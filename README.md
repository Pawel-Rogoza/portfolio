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
| treść | `whoami` `about` `projects` `skills` `htop` `education` `goals` `contact` (+ skróty `harbor` `robust` `advokat` `zabbix` `umami`) |
| pliki | `ls` (z `-l` / `-a`, `ll` = `ls -la`) `cd` `pwd` `tree` `cat` `head` `tail` `grep` `find` |
| system | `uname` `hostname` `id` `uptime` `date` `df` `free` `w` `systemctl` |
| powłoka | `help` `man` `history` `echo` `clear` |
| reszta | `neofetch` `banner` `open` `theme` `lang` |

Plus aliasy (`top`, `cls`, `dir`, `email`, `motd`, `q`…), luźne frazy typu
`show me the projects` oraz easter eggi z pamięci mięśniowej admina
(`sudo`, `ping`, `ssh`, `vim`, `rm`, `wget`, `apt`…) — wszystko ląduje na
właściwej komendzie albo dostaje sensowną odpowiedź.

Skróty klawiszowe: `Tab` uzupełnia · `↑`/`↓` historia · `Ctrl+L` czyści ·
`Ctrl+C` przerywa linię · `Ctrl+U`/`Ctrl+K` kasują do początku/końca ·
`Ctrl+A`/`Ctrl+E` skaczą na początek/koniec · `Esc` wychodzi z pełnego ekranu.

**Reszta strony**

- Wirtualny system plików — `ls`, `cd`, `tree`, `cat`, `head`, `tail`, `grep`
  i `find` działają na jednym drzewie (`TREE` w `app.js`), więc ścieżki i treść
  nie mogą się rozjechać. Ścieżka w nagłówku terminala jest klikalna i zmienia
  się przy `cd`. W drzewie: `~/projects` (harbor, robust, advokat-varshava,
  zabbix, umami), `~/scripts` (redis-check.sh, calve.sh — skrypty z pracy)
  oraz ukryty `.plan` widoczny dopiero po `ls -a`. Terminal na starcie sam
  wykonuje `ls`, żeby od razu pokazać strukturę.
- Motyw **ciemny domyślnie**, niezależnie od ustawień systemu. Przełącznik
  w nawigacji albo komenda `theme dark|light|auto` — `auto` oddaje decyzję
  `prefers-color-scheme`. Wybór zapamiętywany w `localStorage` i stosowany
  przed pierwszym paintem (`js/theme.js`), więc nie ma migotania.
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
tests/             <- tylko CI, strona nadal nie ma zależności
  static-checks.mjs  <- CSP, referencje, tagi head (bez przeglądarki)
  browser.mjs        <- terminal, motywy, i18n, a11y w headless Chromium
deploy/
  nginx/portfolio.pawelrogoza.pl.conf   <- gotowy vhost nginx
  deploy.sh                             <- awaryjny deploy przez rsync
.github/workflows/
  ci.yml                                <- testy przy każdym pushu i PR
  deploy.yml                            <- deploy na main (domyślnie wyłączony)
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

3. **nginx** — ścieżka zależy od dystrybucji:

   ```bash
   # RHEL / Fedora / Rocky / Alma
   sudo cp deploy/nginx/portfolio.pawelrogoza.pl.conf /etc/nginx/conf.d/

   # Debian / Ubuntu
   sudo cp deploy/nginx/portfolio.pawelrogoza.pl.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/portfolio.pawelrogoza.pl.conf /etc/nginx/sites-enabled/
   ```

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. **HTTPS (Let's Encrypt):**

   ```bash
   sudo certbot --nginx -d portfolio.pawelrogoza.pl
   ```

   Po sprawdzeniu, że HTTPS na pewno działa, odkomentuj HSTS w vhoście.

> **Certbot przepisuje vhost w miejscu.** Po `certbot --nginx` zainstalowany
> plik nie wygląda już jak ten z repo: blok `:80` zamienia się w przekierowanie
> na HTTPS, a cała treść ląduje w nowym bloku `:443` z liniami `ssl_certificate`.
>
> Dlatego **aktualizacja vhosta nie jest zwykłym `cp` z repo** — nadpisanie
> skasowałoby konfigurację TLS i zdjęło stronę z HTTPS. Zmiany przenoś ręcznie
> do bloku `:443` w zainstalowanym pliku, albo skopiuj plik i uruchom certbota
> ponownie. Zawsze `sudo nginx -t` przed `reload` i nie zamykaj bieżącej sesji
> SSH, dopóki nie potwierdzisz, że nowa działa.

### Cache a deploy

Nazwy plików nie są hashowane (nie ma build stepu), więc `style.css` po deployu
ma ten sam URL co poprzednio. Gdyby serwować go z `expires 7d`, powracający
odwiedzający dostałby **nowy HTML ze starym CSS-em** — i zobaczyłby rozjechany
layout aż do wygaśnięcia cache.

Dlatego vhost rozdziela zasoby:

| co | nagłówek | dlaczego |
| --- | --- | --- |
| `index.html`, `.css`, `.js` | `no-cache` (`expires -1`) | rewalidacja przy każdym wejściu; odpowiedź 304 to ~200 bajtów |
| `.svg`, `.png`, `.woff2`, … | `max-age=604800` (`expires 7d`) | zmieniają się rzadko, nieświeży favicon nie psuje strony |

Jeśli kiedyś dojdzie build step z hashowaniem nazw, wtedy `.css`/`.js` można
przestawić na długi cache — hash w nazwie załatwia unieważnianie sam.

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

## CI / CD

```
push na gałąź  ->  CI  (static + browser)
push na main   ->  CI  ->  deploy na VPS  ->  health check
```

### CI — `.github/workflows/ci.yml`

Dwa joby, obie bramki muszą być zielone:

**`static`** — bez przeglądarki, kilka sekund:

- `node --check` na każdym pliku JS i `bash -n` na `deploy.sh`,
- `nginx -t` na vhoście (łapie literówki i rozjechane cudzysłowy w CSP),
- `tests/static-checks.mjs`: brak inline `<script>` / `<style>` / `style=""`
  (inaczej CSP by je wyciął w produkcji), CSP bez `unsafe-inline`,
  brak `add_header` w bloku `location`, wszystkie lokalne `href`/`src`
  istnieją na dysku, żaden plik w `public/` nie jest osierocony, klasy `.mt-*`
  używane przez `app.js` są zdefiniowane w CSS, komplet tagów `<head>`,
  `og.png` faktycznie 1200×630, zero klikalnych `<span>`.

**`browser`** — Chromium headless, serwuje `public/` **z tym samym CSP, co
vhost** (policy jest czytana z pliku konfiguracyjnego, więc testy nie mogą się
z nią rozjechać). Sprawdza m.in.:

- wszystkie ~90 komend i ścieżek błędów — każda musi coś wypisać, zero
  wyjątków JS w całym przebiegu,
- scrollback dopisuje, `clear` czyści, `cd` przestawia prompt, breadcrumb,
  pasek statusu i tytuł okna,
- `Tab` (unikat, lista kandydatów, ścieżka), `↑`/`↓`, `Ctrl+U`, `Ctrl+L`,
  historia przeżywa reload,
- paski `htop` mają niezerową wysokość **i** się ruszają,
- kontrast echa komendy w jasnym motywie ≥ 4.5:1,
- motyw przełącza się i zapisuje, widoczna jest dokładnie jedna ikona,
- przełączenie na PL zmienia **każdy** string strony (poza jawną listą tych,
  które w obu językach są takie same) oraz treść terminala,
- chipy, nawigacja i pasek plików sterują terminalem, pełny ekran i `Esc`,
- zero klikalnych `<span>`, linki zewnętrzne mają `rel="noopener"`,
- `prefers-reduced-motion` wyłącza animacje, ciemny motyw wchodzi z systemu,
- zero naruszeń CSP (przez zdarzenie `securitypolicyviolation`, nie przez
  parsowanie konsoli).

Lokalnie:

```bash
cd tests
npm ci
npx playwright install chromium
npm test
```

### CD — `.github/workflows/deploy.yml`

Po pushu do `main` workflow **najpierw woła cały CI** (`workflow_call`), więc
nie ma ścieżki, którą da się wdrożyć bez zielonych testów. Potem loguje się na
VPS i robi `git fetch` + `git reset --hard <sha>` w klonie repo — na serwerze
ląduje dokładnie ten commit, a nie "to, co zdążyło się przesłać".

Na koniec **health check**: strona odpowiada, zawiera terminal, wszystkie
zasoby (`style.css`, `theme.js`, `app.js`, `favicon.svg`, `og.png`) się
serwują, a odpowiedź ma nagłówki `Content-Security-Policy`,
`X-Content-Type-Options` i `Referrer-Policy`. Deploy bez tego sprawdzenia to
tylko kopiowanie plików.

Job `deploy` jest domyślnie **pomijany**. Żeby go włączyć, ustaw w repo
(Settings → Secrets and variables → Actions):

| typ | nazwa | opis |
| --- | --- | --- |
| variable | `DEPLOY_ENABLED` | `true` — bez tego deploy się nie uruchamia |
| variable | `DEPLOY_REPO` | ścieżka klona na VPS (default `/home/portfolio/portfolio`) |
| variable | `SITE_URL` | adres do health checku (default `https://portfolio.pawelrogoza.pl`) |
| secret | `VPS_SSH_HOST` | adres VPS-a |
| secret | `VPS_SSH_USER` | użytkownik SSH — **nie potrzebuje sudo** (patrz niżej) |
| secret | `VPS_SSH_KEY` | prywatny klucz ed25519 (publiczny w `authorized_keys`) |
| secret | `VPS_SSH_PORT` | opcjonalnie, domyślnie `22` |
| secret | `VPS_SSH_KNOWN_HOSTS` | **zalecane** — output `ssh-keyscan -p PORT twoj-vps`; bez tego workflow ufa kluczowi hosta przy pierwszym połączeniu |

Deploy celowo nie wymaga uprawnień: robi tylko `git fetch` / `git reset --hard`
w katalogu domowym użytkownika, który jest jego właścicielem, a nginx te pliki
wyłącznie czyta (konfiguracja się nie zmienia, więc nie ma czego przeładowywać).
Użytkownik deployu **nie powinien** być w sudoers — klucz trafia na runnera
GitHuba przy każdym pushu, więc im mniej może, tym lepiej.

> Przy porcie innym niż 22 wpis w `VPS_SSH_KNOWN_HOSTS` musi mieć postać
> `[host]:port` — taki właśnie wypluwa `ssh-keyscan -p PORT host`. Wpis
> wygenerowany bez `-p` nie pasuje i `StrictHostKeyChecking` odrzuci połączenie
> mimo poprawnego klucza.

Ręczny deploy przez rsync (`deploy/deploy.sh`) został jako wariant awaryjny —
nie mieszaj go z `git reset` na tym samym katalogu.

### Kiedy deploy nie przechodzi

Klient SSH nigdy nie powie, *dlaczego* serwer odrzucił klucz — zawsze dostaniesz
to samo `Permission denied (publickey)`. Prawdziwy powód jest w logu sshd:

```bash
sudo journalctl -u sshd -n 30 --no-pager
```

Rzeczy, które faktycznie potrafiły to zablokować:

| objaw w logu / zachowanie | przyczyna |
| --- | --- |
| `User X not allowed because not listed in AllowUsers` | użytkownik deployu nie jest wpisany w `AllowUsers`. Sprawdź konfigurację **efektywną**: `sudo sshd -T \| grep -i allowusers` — dyrektywa bywa w `Include`owanym pliku, nie w głównym |
| `Authentication refused: bad ownership or modes for ...` | katalog domowy zapisywalny dla grupy/innych, `.ssh` ≠ 700 albo `authorized_keys` ≠ 600 |
| `Permission denied`, a uprawnienia wyglądają idealnie | SELinux — `.ssh` utworzony ręcznie gubi kontekst `ssh_home_t`. Diagnoza: `sudo ausearch -m avc -ts recent \| grep ssh`, naprawa: `sudo restorecon -RFv /home/<user>/.ssh` |
| `Host key verification failed` przy niestandardowym porcie | wpis w `VPS_SSH_KNOWN_HOSTS` musi mieć postać `[host]:port` — taką generuje `ssh-keyscan -p PORT host`, bez `-p` nie pasuje |
| krok deployu wypisuje usage `ssh` i kończy się kodem 255 | brakujący sekret rozwinął się w pustą wartość — od tego jest krok `Check required secrets`, który nazwie brakujący po imieniu |

Sprawdzenie, czy serwer w ogóle ma właściwy klucz (odciski muszą być identyczne):

```bash
sudo ssh-keygen -lf /home/<user>/.ssh/authorized_keys
ssh-keygen -lf ~/.ssh/<twój_klucz>            # u siebie
```

Test uwierzytelnienia bez czekania na workflow:

```bash
ssh -i ~/.ssh/<twój_klucz> -p <PORT> <user>@<host> 'echo OK'
```

Przejdzie tu — przejdzie i w Actions. To ten sam klucz i ta sama ścieżka.

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
