#!/usr/bin/env bash
# Switches the site back to the previous release (or a named one) and restarts it.
# On the server:  /var/www/sgx-website-staging/rollback.sh            (previous release)
#                 /var/www/sgx-website-staging/rollback.sh 20261015-0930
set -euo pipefail

BASE=$(cd "$(dirname "$0")" && pwd)
NAME=$(basename "$BASE")   # sgx-website or sgx-website-staging
CURRENT=$(basename "$(readlink "$BASE/current")")

if [ $# -ge 1 ]; then
  TARGET=$1
else
  # Releases are named by date, so the one before "current" is the previous deploy.
  TARGET=$(ls -1 "$BASE/releases" | sort | awk -v cur="$CURRENT" '$0 < cur' | tail -n 1)
fi

if [ -z "$TARGET" ] || [ ! -f "$BASE/releases/$TARGET/server.js" ]; then
  echo "No earlier release to roll back to. Releases:"; ls -1 "$BASE/releases"; exit 1
fi

ln -sfn "$BASE/releases/$TARGET" "$BASE/current"
pm2 reload "$NAME" --update-env
echo "Rolled back $NAME: $CURRENT -> $TARGET"
