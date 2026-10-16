#!/usr/bin/env bash
# Builds a ready-to-upload zip for cPanel's "Setup Node.js App" (Linux shared hosting).
# Usage: ./deploy/package-cpanel.sh            (staging, the default)
#        ./deploy/package-cpanel.sh production
# Then upload the zip in cPanel → File Manager and extract it into the app folder.
set -euo pipefail

TARGET=${1:-staging}
cd "$(dirname "$0")/.."

# NEXT_PUBLIC_* values are baked in at build time, so build with this target's values.
[ -f "deploy/$TARGET.env" ] || { echo "Missing deploy/$TARGET.env (copy deploy/$TARGET.env.example)"; exit 1; }
set -a; . "deploy/$TARGET.env"; set +a

rm -rf .next/standalone
npm run build

# The standalone server needs the static files and public folder next to it.
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public

# Never ship this computer's settings. The server has its own (cPanel → environment variables).
rm -f .next/standalone/.env .next/standalone/.env.*

# The image tool (resizing uploads, optimising pictures) has a separate build per system:
# add the Linux one the server needs, and drop the Mac one it can't use.
SHARP_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('node_modules/sharp/package.json','utf8')).version)")
TMP=$(mktemp -d)
npm install --prefix "$TMP" --no-save --no-audit --no-fund --os=linux --cpu=x64 --libc=glibc "sharp@$SHARP_VERSION" >/dev/null
mkdir -p .next/standalone/node_modules/@img
cp -R "$TMP"/node_modules/@img/sharp-linux-x64 "$TMP"/node_modules/@img/sharp-libvips-linux-x64 .next/standalone/node_modules/@img/
rm -rf "$TMP" .next/standalone/node_modules/@img/sharp-darwin-* .next/standalone/node_modules/@img/sharp-libvips-darwin-*

if ls -a .next/standalone | grep -q '^\.env'; then echo "Refusing to package: .env found in build"; exit 1; fi

mkdir -p deploy/out
OUT="deploy/out/sgx-website-$TARGET-$(date +%Y%m%d-%H%M).zip"
(cd .next/standalone && zip -qr -X "../../$OUT" . -x "*.DS_Store")
echo "Ready to upload: $OUT ($(du -h "$OUT" | cut -f1))"
