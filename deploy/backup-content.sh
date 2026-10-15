#!/usr/bin/env bash
# Nightly copy of the staff-edited content. Add to the server's crontab:
#   15 2 * * * /var/www/sgx-website/backup-content.sh
set -euo pipefail

SRC=/var/www/sgx-website/shared/data
DEST=/var/backups/sgx-website
mkdir -p "$DEST"
# content.json, staff.json, activity.json and messages.json in one dated archive.
tar -czf "$DEST/data-$(date +%Y%m%d).tgz" -C "$SRC" --exclude=backups .
# Keep 60 days.
find "$DEST" -name 'data-*.tgz' -mtime +60 -delete
