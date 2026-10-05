#!/usr/bin/env bash
# First-time install of the xomexo store on the cPanel box, replacing the old
# static site on xomexo.com while keeping that site live at old.xomexo.com.
#
# Run as root (WHM » Terminal):
#   curl -fsSL https://raw.githubusercontent.com/aroraayan01/Towel/main/deploy/install.sh -o /root/xomexo-install.sh
#   bash /root/xomexo-install.sh
#
# Safe to re-run: every step checks what is already done and skips it.
# It stops on the first error, and xomexo.com keeps serving the old site
# until the very last step, which only runs once the new store answers.
#
# What it does, in order:
#   1. Preflight: cPanel, owner of xomexo.com, Docker, free port
#   2. Backs up the old site folder to ~/backups as a .tar.gz
#   3. Creates old.xomexo.com and copies the old site there (untouched, .git included)
#   4. Clones the store from GitHub (github.com/aroraayan01/Towel)
#   5. Writes .env.local with generated admin credentials (first time only)
#   6. Builds the Docker image, migrates the database, seeds it (first time only)
#   7. Runs the container on 127.0.0.1, as the cPanel user, restarting on boot
#   8. Points xomexo.com at it through Apache, tested and reloaded gracefully
set -euo pipefail

DOMAIN="${XOMEXO_DOMAIN:-xomexo.com}"
OLD_SUB="${XOMEXO_OLD_SUB:-old}"                     # old.xomexo.com
REPO="${XOMEXO_REPO:-https://github.com/aroraayan01/Towel.git}"
PORT="${XOMEXO_PORT:-3410}"

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[32m%s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "Run this as root (WHM » Terminal)."
[ -x /scripts/whoowns ] || die "This is not a cPanel server."

# ── 1. Preflight ────────────────────────────────────────────────────────────
say "Preflight"
OWNER="$(/scripts/whoowns "$DOMAIN" 2>/dev/null || true)"
[ -n "$OWNER" ] || die "No cPanel account owns ${DOMAIN}."
HOME_DIR="$(getent passwd "$OWNER" | cut -d: -f6)"
OLD_DOCROOT="${HOME_DIR}/public_html/${DOMAIN}"
OLD_SUB_DOCROOT="${HOME_DIR}/public_html/${OLD_SUB}.${DOMAIN}"
APP_DIR="${HOME_DIR}/xomexo-store"
DATA_DIR="${HOME_DIR}/xomexo-data"
ok "${DOMAIN} belongs to ${OWNER} (home ${HOME_DIR})"

# The store runs in a container: this server's glibc is 2.28 and Next.js's
# compiler needs 2.30 or newer.
command -v docker >/dev/null || die "Docker is not installed."
docker compose version >/dev/null 2>&1 || die "The Docker Compose plugin is missing (docker compose)."
ok "$(docker --version)"

# A previous attempt may have left a systemd unit behind; the container replaces it
if [ -f /etc/systemd/system/xomexo.service ]; then
  systemctl disable --now xomexo >/dev/null 2>&1 || true
  rm -f /etc/systemd/system/xomexo.service; systemctl daemon-reload
fi
if ss -ltn "sport = :${PORT}" | grep -q LISTEN && ! docker ps --format '{{.Ports}}' | grep -q "127.0.0.1:${PORT}->"; then
  die "Port ${PORT} is already in use by something else. Re-run with XOMEXO_PORT=<free port>."
fi
ok "Port ${PORT} is free (or already ours)"

as_owner() { runuser -u "$OWNER" -- env HOME="$HOME_DIR" "$@"; }
# Work from a folder the cPanel user can read (root's own home is off limits to it)
cd "$HOME_DIR"

# ── 2. Back up the old site ─────────────────────────────────────────────────
say "Backing up the old site"
BACKUP_DIR="${HOME_DIR}/backups"
mkdir -p "$BACKUP_DIR"
if ls "$BACKUP_DIR"/xomexo-static-*.tar.gz >/dev/null 2>&1; then
  ok "Backup already exists: $(ls -1 "$BACKUP_DIR"/xomexo-static-*.tar.gz | head -1)"
else
  [ -d "$OLD_DOCROOT" ] || die "Old site folder ${OLD_DOCROOT} not found."
  TARBALL="${BACKUP_DIR}/xomexo-static-$(date +%Y%m%d-%H%M).tar.gz"
  tar -czf "$TARBALL" -C "$(dirname "$OLD_DOCROOT")" "$(basename "$OLD_DOCROOT")"
  ok "Saved ${TARBALL}"
fi
chown -R "$OWNER:$OWNER" "$BACKUP_DIR"

# ── 3. old.xomexo.com ───────────────────────────────────────────────────────
say "Keeping the old site live at ${OLD_SUB}.${DOMAIN}"
if /scripts/whoowns "${OLD_SUB}.${DOMAIN}" >/dev/null 2>&1; then
  ok "${OLD_SUB}.${DOMAIN} already exists"
else
  uapi --user="$OWNER" SubDomain addsubdomain domain="$OLD_SUB" rootdomain="$DOMAIN" \
    dir="public_html/${OLD_SUB}.${DOMAIN}" disallowdot=0 >/dev/null \
    || die "Could not create ${OLD_SUB}.${DOMAIN}. Add it in cPanel » Domains (document root public_html/${OLD_SUB}.${DOMAIN}) and run this again."
  ok "Created ${OLD_SUB}.${DOMAIN}"
fi
if [ -f "${OLD_SUB_DOCROOT}/index.html" ]; then
  ok "Old site files already copied"
else
  mkdir -p "$OLD_SUB_DOCROOT"
  cp -a "${OLD_DOCROOT}/." "${OLD_SUB_DOCROOT}/"
  chown -R "$OWNER:$OWNER" "$OLD_SUB_DOCROOT"
  ok "Copied the old site to ${OLD_SUB_DOCROOT}"
fi
# The original folder stays where it is as a second copy; once the proxy is on,
# xomexo.com no longer serves from it. rollback.sh switches back to it.

# ── 4. Code ─────────────────────────────────────────────────────────────────
say "Getting the store code"
# The repo is public, so this needs no key. If it is ever made private, add a
# read-only deploy key for the cPanel user and set XOMEXO_REPO to the SSH URL.
if [ -d "${APP_DIR}/.git" ]; then
  as_owner git -C "$APP_DIR" pull --ff-only
else
  as_owner git clone "$REPO" "$APP_DIR"
fi
ok "Code at ${APP_DIR} ($(as_owner git -C "$APP_DIR" log -1 --format='%h %s'))"

# ── 5. Settings ─────────────────────────────────────────────────────────────
say "Settings"
as_owner mkdir -p "$DATA_DIR"
ENV_FILE="${APP_DIR}/.env.local"
FIRST_DB=0
[ -f "${DATA_DIR}/xomexo.db" ] || FIRST_DB=1
if [ -f "$ENV_FILE" ]; then
  ok ".env.local already exists, left as is"
else
  ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"
  cat > "$ENV_FILE" <<EOF
# Server settings for the live store. Next.js and Prisma both read this file.
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
DATABASE_URL=file:${DATA_DIR}/xomexo.db

# Stripe. Until STRIPE_SECRET_KEY is set, checkout on the live site is closed.
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email. Blank SMTP_HOST means emails only go to the service log.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM="xomexo <hello@${DOMAIN}>"
MAIL_ADMIN=hello@${DOMAIN}

ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_SECRET=$(openssl rand -hex 32)
EOF
  chown "$OWNER:$OWNER" "$ENV_FILE"; chmod 600 "$ENV_FILE"
  ok "Wrote ${ENV_FILE} (admin password is printed at the end)"
fi

# ── 6. Build ────────────────────────────────────────────────────────────────
say "Building the store image (a few minutes the first time)"
cd "$APP_DIR"
# Left over from an earlier attempt that built directly on this server
rm -rf "${APP_DIR}/node_modules" "${APP_DIR}/.next"
chown "$OWNER:$OWNER" "$DATA_DIR"

export XOMEXO_DATA_DIR="$DATA_DIR" XOMEXO_PORT="$PORT"
export APP_UID="$(id -u "$OWNER")" APP_GID="$(id -g "$OWNER")"
export NEXT_PUBLIC_SITE_URL="$(grep -oP '^NEXT_PUBLIC_SITE_URL=\K.*' "$ENV_FILE")"
docker compose build
docker compose run --rm --no-deps store npx prisma migrate deploy
if [ "$FIRST_DB" = 1 ]; then
  # Sample reviews are left out on purpose: publishing reviews that are not from
  # real customers breaches the Australian Consumer Law.
  docker compose run --rm --no-deps -e SEED_REVIEWS=false store npx prisma db seed
  ok "Loaded the catalogue (no sample reviews)"
else
  ok "Database already has data; not reseeding (that would undo price and stock edits made in /admin)"
fi

# ── 7. Run ──────────────────────────────────────────────────────────────────
say "Starting the store"
docker compose up -d
for _ in $(seq 1 45); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/" || true)"
  [ "$code" = 200 ] && break
  sleep 2
done
[ "${code:-}" = 200 ] || { docker compose logs --tail 60; die "The store did not start (HTTP ${code:-none}). xomexo.com is unchanged."; }
ok "Store answering on 127.0.0.1:${PORT}"

# ── 8. Apache ───────────────────────────────────────────────────────────────
say "Pointing ${DOMAIN} at the store"
# cPanel rebuilds httpd.conf from templates, so the proxy goes in userdata
# include files (the same approach workk.work uses on this box).
PROXY="$(cat <<EOF
ProxyRequests Off
ProxyPreserveHost On
RequestHeader set X-Forwarded-Proto "https"

# www.${DOMAIN} -> ${DOMAIN}
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.(.+)\$ [NC]
RewriteCond %{REQUEST_URI} !^/\.well-known/
RewriteRule ^/?(.*) https://%1/\$1 [R=301,L]

# AutoSSL proves domain ownership through files under /.well-known
ProxyPass        /.well-known !
ProxyPass        / http://127.0.0.1:${PORT}/ retry=0 timeout=60
ProxyPassReverse / http://127.0.0.1:${PORT}/
EOF
)"
TO_HTTPS="$(cat <<'EOF'
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteCond %{REQUEST_URI} !^/\.well-known/
RewriteRule ^/?(.*) https://%{HTTP_HOST}/$1 [R=301,L]
EOF
)"
WROTE=()
for mode in std ssl; do
  dir="/etc/apache2/conf.d/userdata/${mode}/2_4/${OWNER}/${DOMAIN}"
  mkdir -p "$dir"
  if [ "$mode" = std ]; then printf '%s\n\n%s\n' "$TO_HTTPS" "$PROXY" > "${dir}/xomexo.conf"
  else printf '%s\n' "$PROXY" > "${dir}/xomexo.conf"; fi
  WROTE+=("${dir}/xomexo.conf")
done
/scripts/ensure_vhost_includes --user="$OWNER" >/dev/null
if ! apachectl configtest >/dev/null 2>&1; then
  apachectl configtest || true
  rm -f "${WROTE[@]}"; /scripts/ensure_vhost_includes --user="$OWNER" >/dev/null || true
  die "Apache rejected the config, so it was removed again. Nothing was reloaded; every site is as it was."
fi
# Graceful: finishes in-flight requests on the other sites instead of dropping them.
apachectl graceful
ok "Apache reloaded gracefully"

# Certificate for the new subdomain (runs in the background)
/usr/local/cpanel/bin/autossl_check --user="$OWNER" >/dev/null 2>&1 &

sleep 2
say "Done"
printf '    https://%s            new store   (HTTP %s)\n' "$DOMAIN" "$(curl -s -o /dev/null -w '%{http_code}' --resolve "${DOMAIN}:443:127.0.0.1" "https://${DOMAIN}/" -k || true)"
printf '    https://%s.%s        old site (certificate can take a few minutes)\n' "$OLD_SUB" "$DOMAIN"
if [ -z "$(dig +short "${OLD_SUB}.${DOMAIN}" 2>/dev/null || true)" ]; then
  printf '    \033[1;33m%s.%s has no DNS record yet. If DNS for %s is managed outside this server,\n' "$OLD_SUB" "$DOMAIN" "$DOMAIN"
  printf '    add an A record for "%s" pointing at this server.\033[0m\n' "$OLD_SUB"
fi
printf '    https://%s/admin      admin\n' "$DOMAIN"
# Read back from the file, so a re-run still shows it
printf '\n    \033[1;33mAdmin setup password: %s\033[0m\n' "$(grep -oP '^ADMIN_PASSWORD=\K.*' "$ENV_FILE")"
printf '    Open https://%s/admin and enter it once to create the owner account.\n' "$DOMAIN"
printf '    After that everyone logs in with their own email and password (staff are added in Admin » Staff).\n'
printf '\n    Checkout stays closed until STRIPE_SECRET_KEY is set in %s.\n' "$ENV_FILE"
printf '    Logs:      cd %s && docker compose logs -f\n' "$APP_DIR"
printf '    Updates:   bash %s/deploy/update.sh\n' "$APP_DIR"
printf '    Undo:      bash %s/deploy/rollback.sh\n\n' "$APP_DIR"
