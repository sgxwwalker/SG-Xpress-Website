#!/usr/bin/env bash
# Builds the site locally and ships it to the server.
# Usage: SERVER=deploy@your-server-ip ./deploy/deploy.sh              (staging, the default)
#        SERVER=deploy@your-server-ip TARGET=production ./deploy/deploy.sh
set -euo pipefail

: "${SERVER:?Set SERVER, e.g. SERVER=deploy@203.0.113.10}"
TARGET=${TARGET:-staging}
case "$TARGET" in
  staging)    APP_DIR=/var/www/sgx-website-staging ;;
  production) APP_DIR=/var/www/sgx-website ;;
  *) echo "TARGET must be staging or production"; exit 1 ;;
esac
RELEASE=$(date +%Y%m%d-%H%M%S)

cd "$(dirname "$0")/.."

# NEXT_PUBLIC_* values are baked in at build time, so build with this target's values.
if [ ! -f "deploy/$TARGET.env" ]; then
  echo "Missing deploy/$TARGET.env (copy deploy/$TARGET.env.example)"; exit 1
fi
set -a; . "deploy/$TARGET.env"; set +a

if [ "$TARGET" = production ]; then
  read -r -p "Deploy to the LIVE site? Type yes: " ok
  [ "$ok" = yes ] || exit 1
fi

rm -rf .next/standalone
npm ci
npm run build

# The standalone server needs the static files and public folder next to it.
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public
# Next copies local .env files into the build; never ship them. The server uses shared/.env.
rm -f .next/standalone/.env .next/standalone/.env.*
if ls -a .next/standalone | grep -q '^\.env'; then echo "Refusing to deploy: .env found in build"; exit 1; fi

tar -czf "/tmp/sgx-website-$RELEASE.tgz" -C .next/standalone .
scp "/tmp/sgx-website-$RELEASE.tgz" "$SERVER:/tmp/"
rm "/tmp/sgx-website-$RELEASE.tgz"

ssh "$SERVER" bash -s <<REMOTE
set -euo pipefail
mkdir -p $APP_DIR/releases/$RELEASE
tar -xzf /tmp/sgx-website-$RELEASE.tgz -C $APP_DIR/releases/$RELEASE
rm /tmp/sgx-website-$RELEASE.tgz
ln -sfn $APP_DIR/releases/$RELEASE $APP_DIR/current
pm2 startOrReload $APP_DIR/ecosystem.config.cjs --update-env
pm2 save
# Keep the last 5 releases for quick rollback.
ls -1dt $APP_DIR/releases/* | tail -n +6 | xargs -r rm -rf
REMOTE

echo "Deployed release $RELEASE to $TARGET"
