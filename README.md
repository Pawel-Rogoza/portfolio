# Portfolio — Paweł Rogoża

Osobiste portfolio w formie interaktywnego terminala. Implementacja projektu
z Claude Design (*Portfolio - Desktop (Live)*) jako czysta strona statyczna —
**HTML + CSS + vanilla JS, bez żadnego build stepu i bez zależności**.

Docelowy adres: **https://portfolio.pawelrogoza.pl**

## Co potrafi strona

- Interaktywny terminal: komendy `whoami`, `about`, `projects`, `harbor`,
  `skills`, `htop`, `education`, `goals`, `contact`, `ls`, `tree`, `cat <plik>`,
  `uptime`, `clear`, `help` + podpowiedzi przy literówkach
- Historia komend (↑/↓), klikalne chipy, klikalna ścieżka i pasek plików
- Tryb pełnoekranowy terminala (Esc zamyka) oraz resize za prawy dolny róg
- Przełącznik języka EN/PL (zapamiętywany w localStorage)
- Responsywność — na mobile terminal ma stałą wysokość, menu jest ukryte

## Struktura repo

```
public/            <- to jest cała strona (deployowany katalog)
  index.html
  css/style.css
  js/app.js
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

2. **Katalog na VPS:**

   ```bash
   sudo mkdir -p /var/www/portfolio
   sudo chown $USER:$USER /var/www/portfolio
   ```

3. **Wgraj stronę** (z lokalnej maszyny, z katalogu repo):

   ```bash
   DEPLOY_HOST=user@twoj-vps ./deploy/deploy.sh
   # albo ręcznie:
   rsync -avz --delete public/ user@twoj-vps:/var/www/portfolio/
   ```

4. **nginx:**

   ```bash
   sudo cp deploy/nginx/portfolio.pawelrogoza.pl.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/portfolio.pawelrogoza.pl.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

5. **HTTPS (Let's Encrypt):**

   ```bash
   sudo certbot --nginx -d portfolio.pawelrogoza.pl
   ```

### Auto-deploy z GitHuba (opcjonalnie)

Workflow `.github/workflows/deploy.yml` po każdym pushu do `main` wgrywa
`public/` na VPS przez rsync. Domyślnie jest **pomijany** — żeby go włączyć,
ustaw w repo (Settings → Secrets and variables → Actions):

- variable `DEPLOY_ENABLED` = `true` (+ opcjonalnie `DEPLOY_PATH`),
- secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (klucz prywatny ed25519,
  którego klucz publiczny jest w `authorized_keys` na VPS).

## Edycja treści

- **Teksty hero / nawigacji (EN i PL):** obiekt `STRINGS` na górze `public/js/app.js`
- **Treść komend terminala** (about, skills, harbor, contact itd.): funkcja
  `renderOutput()` w `public/js/app.js`
- **Kolory i layout:** `public/css/style.css` (kolory w `oklch()`, 1:1 z designem)
- **Linki kontaktowe:** komenda `contact` w `renderOutput()` — podmień na
  właściwe adresy, jeśli się zmienią
