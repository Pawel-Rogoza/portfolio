#!/usr/bin/env bash
# Ręczny deploy na VPS przez rsync — awaryjnie i dla docroota, który NIE jest
# klonem repo. Normalną drogą jest push do main: .github/workflows/deploy.yml
# robi `git fetch` + `git reset --hard <sha>` w klonie na VPS-ie.
#
# Nie mieszaj obu na tym samym katalogu: rsync wgrywa pliki obok gita, więc
# klon zrobi się brudny i następny reset i tak je nadpisze.
#
# Użycie:
#   DEPLOY_HOST=user@twoj-vps ./deploy/deploy.sh
# albo na stałe ustaw HOST poniżej.

set -euo pipefail

HOST="${DEPLOY_HOST:?Ustaw DEPLOY_HOST, np. DEPLOY_HOST=pawel@vps ./deploy/deploy.sh}"
DEST="${DEPLOY_PATH:-/home/portfolio/portfolio/public}"
SRC="$(cd "$(dirname "$0")/../public" && pwd)"

echo "Deploying ${SRC}/ -> ${HOST}:${DEST}/"
rsync -avz --delete "${SRC}/" "${HOST}:${DEST}/"
echo "Done."
