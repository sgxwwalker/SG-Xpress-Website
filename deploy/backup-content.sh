#!/usr/bin/env bash
# Nightly copy of the staff-edited content. Add to the server's crontab:
#   15 2 * * * /var/www/sgx-website/backup-content.sh
set -euo pipefail

BASE=$(cd "$(dirname "$0")" && pwd)   # /var/www/sgx-website (or -staging)
SRC=$BASE/shared/data
DEST=${BACKUP_DIR:-/var/backups/$(basename "$BASE")}
mkdir -p "$DEST"
# content.json, staff.json, activity.json, messages.json, applications and CVs in one dated archive.
tar -czf "$DEST/data-$(date +%Y%m%d).tgz" -C "$SRC" --exclude=backups .
# Keep 60 days.
find "$DEST" -name 'data-*.tgz' -mtime +60 -delete
