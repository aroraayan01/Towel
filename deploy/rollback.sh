#!/usr/bin/env bash
# Put xomexo.com back on the old static site. Run as root:
#   bash /home/grapme/xomexo-store/deploy/rollback.sh
#
# Removes the Apache proxy so xomexo.com serves its original folder again
# (install.sh never deleted it), then stops the store. The store's code,
# database and settings are left in place, so install.sh can switch back.
# old.xomexo.com is not touched.
set -euo pipefail

DOMAIN="${XOMEXO_DOMAIN:-xomexo.com}"

die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || die "Run this as root."

OWNER="$(/scripts/whoowns "$DOMAIN")"
rm -f "/etc/apache2/conf.d/userdata/std/2_4/${OWNER}/${DOMAIN}/xomexo.conf" \
      "/etc/apache2/conf.d/userdata/ssl/2_4/${OWNER}/${DOMAIN}/xomexo.conf"
/scripts/ensure_vhost_includes --user="$OWNER" >/dev/null
apachectl configtest
apachectl graceful
# Stop the container; restart: unless-stopped keeps it stopped across reboots
HOME_DIR="$(getent passwd "$OWNER" | cut -d: -f6)"
XOMEXO_DATA_DIR="${HOME_DIR}/xomexo-data" docker compose -f "${HOME_DIR}/xomexo-store/compose.yaml" stop 2>/dev/null || true

printf '\n\033[32m%s is serving the old site again. The store is stopped, not deleted.\033[0m\n' "$DOMAIN"
