# Portfolio — Paweł Rogoża

Osobiste portfolio w formie interaktywnego terminala. Implementacja projektu
z Claude Design (*Portfolio - Desktop (Live)*) jako czysta strona statyczna —
**HTML + CSS + vanilla JS, bez żadnego build stepu i bez zależności**.

Docelowy adres: **https://portfolio.pawelrogoza.pl**

## Co potrafi strona

**Terminal** — prawdziwy scrollback (każda komenda dopisuje się pod poprzednią,
`clear` czyści ekran), historia komend zapamiętywana w `localStorage`,
uzupełnianie `Tab`, podpowiedzi przy literówkach.

Komendy:

| grupa | komendy |
| --- | --- |
| treść | `whoami` `about` `projects` `harbor` `skills` `htop` `education` `goals` `contact` |
| pliki | `ls` `cd` `pwd` `tree` `cat` `grep` `find` |
| powłoka | `help` `man` `history` `echo` `date` `uptime` `clear` |
| reszta | `neofetch` `banner` `open` `theme` `lang` |

Plus aliasy (`top`, `cls`, `dir`, `email`, `motd`, `q`…) i luźne frazy typu
`show me the projects` — wszystko ląduje na właściwej komendzie.

Skróty klawiszowe: `Tab` uzupełnia · `↑`/`↓` historia · `Ctrl+L` czyści ·
`Ctrl+C` przerywa linię · `Ctrl+U`/`Ctrl+K` kasują do początku/końca ·
`Ctrl+A`/`Ctrl+E` skaczą na początek/koniec · `Esc` wychodzi z pełnego ekranu.

**Reszta strony**

- Wirtualny system plików — `ls`, `cd`, `tree`, `cat`, `grep` i `find` działają
  na jednym drzewie (`TREE` w `app.js`), więc ścieżki i treść nie mogą się
  rozjechać. Ścieżka w nagłówku terminala jest klikalna i zmienia się przy `cd`.
- Motyw jasny / ciemny — domyślnie z ustawień systemu, przełącznik w nawigacji
  albo komenda `theme dark|light|auto`, zapamiętywany w `localStorage`.
- Pełne EN/PL — również **wnętrze terminala**, nie tylko nagłówki
  (przełącznik w nawigacji albo `lang pl`).
- `htop` z animowanymi paskami (wyłączonymi przy `prefers-reduced-motion`).
- Tryb pełnoekranowy terminala (Esc zamyka) oraz resize za prawy dolny róg.
- Klawiatura i czytniki ekranu: wszystkie klikalne elementy to `<button>`,
  transkrypt terminala to `role="log"` z `aria-live`, jest skip link i widoczny
  focus ring.

## Struktura repo

```
public/            <- to jest cała strona (deployowany katalog)
  index.html
  css/style.css
  js/theme.js      <- ustawia motyw przed pierwszym paintem (bez migotania)
  js/app.js        <- terminal: i18n, wirtualny FS, komendy, powłoka
  favicon.svg
  og.png           <- podgląd dla social mediów (1200×630)
  robots.txt
deploy/
  nginx/portfolio.pawelrogoza.pl.conf   <- gotowy vhost nginx
  deploy.sh                             <- ręczny deploy przez rsync
.github/workflows/deploy.yml            <- opcjonalny auto-deploy (domyślnie wyłączony)
```

## Podgląd lokalny

Wystarczy dowolny serwer statyczny, np.:

```bash
cd public
python3 -m http.server 8080
# -> http://localhost:8080
```

## Deploy na VPS (portfolio.pawelrogoza.pl)

1. **DNS** — dodaj rekord `A` (i ew. `AAAA`) dla `portfolio.pawelrogoza.pl`
   wskazujący na IP VPS-a.

2. **Klon repo na VPS** (jako user `portfolio`, do `/home/portfolio/portfolio`):

   ```bash
   sudo useradd -m -s /bin/bash portfolio   # jeśli jeszcze nie istnieje
   sudo chmod o+x /home/portfolio           # nginx musi móc wejść do katalogu
   sudo -iu portfolio
   git clone https://github.com/Pawel-Rogoza/portfolio.git ~/portfolio
   exit
   ```

   nginx serwuje bezpośrednio `/home/portfolio/portfolio/public`, więc
   aktualizacja strony to po prostu `git pull` w tym katalogu.

3. **nginx:**

   ```bash
   sudo cp deploy/nginx/portfolio.pawelrogoza.pl.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/portfolio.pawelrogoza.pl.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. **HTTPS (Let's Encrypt):**

   ```bash
   sudo certbot --nginx -d portfolio.pawelrogoza.pl
   ```

   Po sprawdzeniu, że HTTPS na pewno działa, odkomentuj HSTS w vhoście.

### Nagłówki bezpieczeństwa

Vhost wysyła ścisłe `Content-Security-Policy` — strona nie ma ani jednego
inline `<script>` ani `<style>` (motyw ustawia osobny `js/theme.js`, odstępy
w terminalu to klasy `.mt-*`), więc CSP nie potrzebuje `'unsafe-inline'`.
Jedyne dozwolone źródło zewnętrzne to Google Fonts; jeśli kiedyś zhostujesz
fonty lokalnie, usuń wpisy `fonts.googleapis.com` / `fonts.gstatic.com`
i zostaw samo `'self'`.

> Uwaga na przyszłość: `add_header` wewnątrz `location {}` **kasuje** wszystkie
> `add_header` odziedziczone z `server {}`. Dlatego cache jest ustawiany
> dyrektywą `expires`, a nie `add_header Cache-Control`.

### Auto-deploy z GitHuba (opcjonalnie)

Workflow `.github/workflows/deploy.yml` po każdym pushu do `main` wgrywa
`public/` na VPS przez rsync. Domyślnie jest **pomijany** — żeby go włączyć,
ustaw w repo (Settings → Secrets and variables → Actions):

- variable `DEPLOY_ENABLED` = `true` (+ opcjonalnie `DEPLOY_PATH`),
- secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (klucz prywatny ed25519,
  którego klucz publiczny jest w `authorized_keys` na VPS).

## Edycja treści

Wszystko siedzi w `public/js/app.js`, w kolejności od góry pliku:

| co | gdzie |
| --- | --- |
| teksty strony (hero, nawigacja, stopka) EN/PL | obiekt `PAGE` |
| **treść komend terminala** EN/PL | obiekt `TERM` |
| jednolinijkowe opisy komend (`help`, `man`) | obiekt `DESC` |
| drzewo plików (`ls`, `tree`, `cat`, `grep`) | obiekt `TREE` |
| jak renderuje się dany plik | obiekt `RENDER` |
| nowa komenda | obiekt `COMMANDS` (+ ewentualny alias w `ALIAS`) |
| linki kontaktowe | stałe `LINKS` / `EMAIL` na górze pliku |

Dodanie komendy to jeden wpis w `COMMANDS` — `help`, `man` i uzupełnianie
`Tab` wyciągają ją z rejestru same, nic nie trzeba dopisywać w drugim miejscu.

**Kolory i layout:** `public/css/style.css`. Cała paleta to zmienne CSS
w bloku `:root` na górze pliku (+ warianty dla motywu ciemnego) — zmiana
akcentu to jedna linijka, nie szukanie `oklch()` po całym pliku.

**Podgląd społecznościowy (`og.png`):** obrazek 1200×630 wygenerowany raz
z HTML-a. Żeby go odświeżyć, wystarczy dowolna przeglądarka w trybie headless:

```bash
chromium --headless --window-size=1200,630 \
  --screenshot=public/og.png file:///ścieżka/do/karty.html
```
