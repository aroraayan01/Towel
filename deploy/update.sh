#!/usr/bin/env bash
# Pull the latest code and restart the live store. Run as root:
#   bash /home/grapme/xomexo-store/deploy/update.sh            # only if there are new commits
#   bash /home/grapme/xomexo-store/deploy/update.sh --force    # rebuild anyway (e.g. after editing .env.local)
#
# The new image is built while the current one keeps serving, so the site is
# only down for the few seconds it takes to swap containers. Database
# migrations run when the new container starts. Never reseeds the database
# (that would undo price and stock edits made in /admin).
set -euo pipefail

PORT="${XOMEXO_PORT:-3410}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OWNER="$(stat -c %U "$APP_DIR")"
HOME_DIR="$(getent passwd "$OWNER" | cut -d: -f6)"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "Run this as root."
cd "$APP_DIR"

say "Pulling"
BEFORE="$(runuser -u "$OWNER" -- git rev-parse --short HEAD)"
runuser -u "$OWNER" -- env HOME="$HOME_DIR" git pull --ff-only
AFTER="$(runuser -u "$OWNER" -- git rev-parse --short HEAD)"
if [ "$BEFORE" = "$AFTER" ] && [ "${1:-}" != "--force" ]; then
  echo "Already up to date at ${AFTER}. Use --force to rebuild anyway."
  exit 0
fi

export XOMEXO_DATA_DIR="${HOME_DIR}/xomexo-data" XOMEXO_PORT="$PORT"
export APP_UID="$(id -u "$OWNER")" APP_GID="$(id -g "$OWNER")"
export NEXT_PUBLIC_SITE_URL="$(grep -oP '^NEXT_PUBLIC_SITE_URL=\K.*' .env.local)"

say "Building"
docker compose build

say "Restarting"
docker compose up -d
for _ in $(seq 1 45); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/" || true)"
  [ "$code" = 200 ] && break
  sleep 2
done
if [ "${code:-}" != 200 ]; then
  docker compose logs --tail 60
  die "Store is not answering (HTTP ${code:-none}). To go back: git -C ${APP_DIR} checkout ${BEFORE} && bash $0 --force"
fi
docker image prune -f >/dev/null 2>&1 || true
printf '\n\033[32mUpdated %s -> %s, store is up.\033[0m\n' "$BEFORE" "$AFTER"
