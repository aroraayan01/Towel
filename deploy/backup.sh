#!/usr/bin/env bash
# Nightly backup of the live store: the database (orders, products, sellers,
# payouts) and the uploaded product photos. Run as root; install.sh and
# update.sh schedule it daily at 3:30am via /etc/cron.d/xomexo-backup.
#
#   bash /home/grapme/xomexo-store/deploy/backup.sh
#
# Keeps 30 daily database copies and 4 weekly photo archives in
# ~/backups/xomexo. These live on the same server, so also copy that folder
# somewhere else now and then (or point an off-site backup at it).
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OWNER="$(stat -c %U "$APP_DIR")"
HOME_DIR="$(getent passwd "$OWNER" | cut -d: -f6)"
DATA_DIR="${HOME_DIR}/xomexo-data"
DEST="${HOME_DIR}/backups/xomexo"
STAMP="$(date +%Y%m%d-%H%M)"

mkdir -p "$DEST" "${DATA_DIR}/backups"
chown "$OWNER:$OWNER" "${DATA_DIR}/backups"
cd "$APP_DIR"
export XOMEXO_DATA_DIR="$DATA_DIR"

# SQLite's online backup, run inside the container: a consistent copy even
# while customers are checking out (copying the file directly could catch it
# half-written).
docker compose exec -T store node -e '
  const path = require.resolve("better-sqlite3", { paths: [require.resolve("@prisma/adapter-better-sqlite3")] });
  const Database = require(path);
  new Database("/data/xomexo.db", { readonly: true })
    .backup(process.argv[1])
    .then(() => console.log("database copied"))
    .catch((e) => { console.error(e); process.exit(1); });
' "/data/backups/xomexo-${STAMP}.db"

mv "${DATA_DIR}/backups/xomexo-${STAMP}.db" "${DEST}/"
gzip -f "${DEST}/xomexo-${STAMP}.db"

# Photos once a week (Sundays), or whenever there's no archive yet
if [ "$(date +%u)" = 7 ] || ! ls "${DEST}"/uploads-*.tar.gz >/dev/null 2>&1; then
  if [ -d "${DATA_DIR}/uploads" ]; then
    # The resized copies in uploads/cache are rebuilt automatically, so leave them out
    tar -czf "${DEST}/uploads-${STAMP}.tar.gz" -C "$DATA_DIR" --exclude="uploads/cache" uploads
    echo "photos archived"
  fi
fi

# Keep the newest 30 database copies and 4 photo archives
ls -1t "${DEST}"/xomexo-*.db.gz 2>/dev/null | tail -n +31 | xargs -r rm -f
ls -1t "${DEST}"/uploads-*.tar.gz 2>/dev/null | tail -n +5 | xargs -r rm -f
chown -R "$OWNER:$OWNER" "${HOME_DIR}/backups"

echo "$(date '+%F %T') backup done: $(du -sh "$DEST" | cut -f1) in ${DEST}"
