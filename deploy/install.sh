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
#   1. Preflight: cPanel, owner of xomexo.com, Node >= 20.9, free port
#   2. Backs up the old site folder to ~/backups as a .tar.gz
#   3. Creates old.xomexo.com and copies the old site there (untouched, .git included)
#   4. Clones the store from GitHub (github.com/aroraayan01/Towel)
#   5. Writes .env.local with generated admin credentials (first time only)
#   6. npm ci, database migrate, catalogue seed (first time only), build
#   7. Runs it as a systemd service on 127.0.0.1 as the cPanel user
#   8. Points xomexo.com at it through Apache, tested and reloaded gracefully
set -euo pipefail

DOMAIN="${XOMEXO_DOMAIN:-xomexo.com}"
OLD_SUB="${XOMEXO_OLD_SUB:-old}"                     # old.xomexo.com
REPO="${XOMEXO_REPO:-https://github.com/aroraayan01/Towel.git}"
PORT="${XOMEXO_PORT:-3410}"
SERVICE=xomexo

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

NODE_BIN=""
for cand in /opt/cpanel/ea-nodejs22/bin/node /opt/cpanel/ea-nodejs24/bin/node /opt/cpanel/ea-nodejs20/bin/node "$(command -v node || true)"; do
  [ -n "$cand" ] && [ -x "$cand" ] || continue
  if "$cand" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>20||(a===20&&b>=9)?0:1)'; then
    NODE_BIN="$cand"; break
  fi
done
[ -n "$NODE_BIN" ] || die "Node 20.9 or newer is needed. Install it with:  dnf install -y ea-nodejs22   then run this again."
NODE_DIR="$(dirname "$NODE_BIN")"
ok "Node $("$NODE_BIN" -v) at ${NODE_BIN}"

if ss -ltn "sport = :${PORT}" | grep -q LISTEN && ! systemctl is-active --quiet "$SERVICE"; then
  die "Port ${PORT} is already in use by something else. Re-run with XOMEXO_PORT=<free port>."
fi
ok "Port ${PORT} is free (or already ours)"

as_owner() { runuser -u "$OWNER" -- env HOME="$HOME_DIR" PATH="${NODE_DIR}:/usr/local/bin:/usr/bin:/bin" "$@"; }
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
say "Installing packages and building (a few minutes)"
cd "$APP_DIR"
as_owner npm ci --no-audit --no-fund
as_owner npx prisma migrate deploy
if [ "$FIRST_DB" = 1 ]; then
  # Sample reviews are left out on purpose: publishing reviews that are not from
  # real customers breaches the Australian Consumer Law.
  as_owner env SEED_REVIEWS=false npx prisma db seed
  ok "Loaded the catalogue (no sample reviews)"
else
  ok "Database already has data; not reseeding (that would undo price and stock edits made in /admin)"
fi
as_owner npm run build

# ── 7. Service ──────────────────────────────────────────────────────────────
say "Starting the store as a service"
cat > "/etc/systemd/system/${SERVICE}.service" <<EOF
[Unit]
Description=xomexo store (Next.js) for ${DOMAIN}
After=network.target

[Service]
Type=simple
User=${OWNER}
Group=${OWNER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PATH=${NODE_DIR}:/usr/local/bin:/usr/bin:/bin
ExecStart=${NODE_BIN} ${APP_DIR}/node_modules/next/dist/bin/next start -p ${PORT} -H 127.0.0.1
Restart=always
RestartSec=3
# Keep it to its own files
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null 2>&1
systemctl restart "$SERVICE"

for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/" || true)"
  [ "$code" = 200 ] && break
  sleep 2
done
[ "${code:-}" = 200 ] || { journalctl -u "$SERVICE" -n 40 --no-pager; die "The store did not start (HTTP ${code:-none}). xomexo.com is unchanged."; }
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
if [ -n "${ADMIN_PASSWORD:-}" ]; then
  printf '\n    \033[1;33mAdmin password: %s\033[0m\n    (stored only in %s, change it there)\n' "$ADMIN_PASSWORD" "$ENV_FILE"
fi
printf '\n    Checkout stays closed until STRIPE_SECRET_KEY is set in %s.\n' "$ENV_FILE"
printf '    Logs:      journalctl -u %s -f\n' "$SERVICE"
printf '    Updates:   bash %s/deploy/update.sh\n' "$APP_DIR"
printf '    Undo:      bash %s/deploy/rollback.sh\n\n' "$APP_DIR"
