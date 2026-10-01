#!/usr/bin/env bash
# Pull the latest code and restart the live store. Run as root:
#   bash /home/grapme/xomexo-store/deploy/update.sh
#
# The site can show errors for about a minute while it builds. Fine while
# traffic is low; move to a two-folder release setup before that matters.
# Never reseeds the database (that would undo price and stock edits made in /admin).
set -euo pipefail

SERVICE=xomexo
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OWNER="$(stat -c %U "$APP_DIR")"
HOME_DIR="$(getent passwd "$OWNER" | cut -d: -f6)"
UNIT="/etc/systemd/system/${SERVICE}.service"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "Run this as root."
[ -f "$UNIT" ] || die "${UNIT} not found. Run deploy/install.sh first."
NODE_BIN="$(grep -oP '^ExecStart=\K\S+' "$UNIT")"
NODE_DIR="$(dirname "$NODE_BIN")"
PORT="$(grep -oP 'next start -p \K[0-9]+' "$UNIT")"

as_owner() { runuser -u "$OWNER" -- env HOME="$HOME_DIR" PATH="${NODE_DIR}:/usr/local/bin:/usr/bin:/bin" "$@"; }
cd "$APP_DIR"

say "Pulling"
BEFORE="$(as_owner git rev-parse --short HEAD)"
as_owner git pull --ff-only
AFTER="$(as_owner git rev-parse --short HEAD)"
[ "$BEFORE" = "$AFTER" ] && [ "${1:-}" != "--force" ] && { echo "Already up to date at ${AFTER}. Use --force to rebuild anyway."; exit 0; }

say "Installing, migrating, building"
as_owner npm ci --no-audit --no-fund
as_owner npx prisma migrate deploy
as_owner npm run build

say "Restarting"
systemctl restart "$SERVICE"
for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/" || true)"
  [ "$code" = 200 ] && break
  sleep 2
done
if [ "${code:-}" != 200 ]; then
  journalctl -u "$SERVICE" -n 40 --no-pager
  die "Store is not answering (HTTP ${code:-none}). To go back: git -C ${APP_DIR} checkout ${BEFORE} && bash $0 --force"
fi
printf '\n\033[32mUpdated %s -> %s, store is up.\033[0m\n' "$BEFORE" "$AFTER"
