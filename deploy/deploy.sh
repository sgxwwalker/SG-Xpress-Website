#!/usr/bin/env bash
# Builds the site locally and ships it to the server.
# Usage: SERVER=deploy@your-server-ip ./deploy/deploy.sh
set -euo pipefail

: "${SERVER:?Set SERVER, e.g. SERVER=deploy@203.0.113.10}"
APP_DIR=/var/www/sgx-website
RELEASE=$(date +%Y%m%d-%H%M%S)

cd "$(dirname "$0")/.."

# NEXT_PUBLIC_* values are baked in at build time, so build with the production ones.
if [ -f deploy/production.env ]; then
  set -a; . deploy/production.env; set +a
fi

npm ci
npm run build

# The standalone server needs the static files and public folder next to it.
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public

tar -czf "/tmp/sgx-website-$RELEASE.tgz" -C .next/standalone .
scp "/tmp/sgx-website-$RELEASE.tgz" "$SERVER:/tmp/"
rm "/tmp/sgx-website-$RELEASE.tgz"

ssh "$SERVER" bash -s <<EOF
set -euo pipefail
mkdir -p $APP_DIR/releases/$RELEASE
tar -xzf /tmp/sgx-website-$RELEASE.tgz -C $APP_DIR/releases/$RELEASE
rm /tmp/sgx-website-$RELEASE.tgz
ln -sfn $APP_DIR/releases/$RELEASE $APP_DIR/current
cd $APP_DIR/current
pm2 startOrReload /var/www/sgx-website/ecosystem.config.cjs --update-env
pm2 save
# Keep the last 5 releases for quick rollback.
ls -1dt $APP_DIR/releases/* | tail -n +6 | xargs -r rm -rf
EOF

echo "Deployed release $RELEASE"
