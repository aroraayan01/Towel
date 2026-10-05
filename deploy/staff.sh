#!/usr/bin/env bash
# Staff account commands on the live server, run as root:
#   bash /home/grapme/xomexo-store/deploy/staff.sh list
#   bash /home/grapme/xomexo-store/deploy/staff.sh reset you@example.com
# For when nobody can fix it in Admin » Staff, e.g. the only owner forgot their password.
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOME_DIR="$(getent passwd "$(stat -c %U "$APP_DIR")" | cut -d: -f6)"
cd "$APP_DIR"
export XOMEXO_DATA_DIR="${HOME_DIR}/xomexo-data"
docker compose exec -T store npm run --silent staff -- "$@"
