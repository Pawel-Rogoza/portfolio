#!/usr/bin/env bash
# Ręczny deploy na VPS przez rsync.
#
# Użycie:
#   DEPLOY_HOST=user@twoj-vps ./deploy/deploy.sh
# albo na stałe ustaw HOST poniżej.

set -euo pipefail

HOST="${DEPLOY_HOST:?Ustaw DEPLOY_HOST, np. DEPLOY_HOST=pawel@vps ./deploy/deploy.sh}"
DEST="${DEPLOY_PATH:-/var/www/portfolio}"
SRC="$(cd "$(dirname "$0")/../public" && pwd)"

echo "Deploying ${SRC}/ -> ${HOST}:${DEST}/"
rsync -avz --delete "${SRC}/" "${HOST}:${DEST}/"
echo "Done."
