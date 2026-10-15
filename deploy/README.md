# Deploying sgxpressja.com to the dedicated server

Assumes a Linux server (Ubuntu 22.04/24.04) with SSH access. If the server turns
out to be cPanel or Windows, the app is the same; only these setup steps change.

## One-time server setup

```bash
# As root on the server
apt update && apt install -y nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
npm install -g pm2

adduser --disabled-password deploy
mkdir -p /var/www/sgx-website/{releases,shared/data}
chown -R deploy:deploy /var/www/sgx-website
```

Copy `deploy/ecosystem.config.cjs` and `deploy/backup-content.sh` to
`/var/www/sgx-website/`, then create `/var/www/sgx-website/shared/.env`:

```bash
SUPERADMIN_USERNAME=wwalker    # the one superadmin login
SUPERADMIN_NAME=Warren Walker  # shown in the activity log
ADMIN_PASSWORD_HASH_B64=...    # from: npm run hash-password -- "a strong password"
SESSION_SECRET=...             # from: openssl rand -base64 32
CONTENT_FILE=/var/www/sgx-website/shared/data/content.json
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://sgxpressja.com
```

Optional extras in the same file: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`,
`SMTP_FROM` and `CONTACT_TO` to email contact-form messages (they're always saved in
/admin → Messages too), and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`
for Cloudflare's spam check. `NEXT_PUBLIC_*` values must also be in
`deploy/production.env` because they're baked in at build time.

Staff accounts (`staff.json`), the activity log (`activity.json`) and contact messages
(`messages.json`) are saved in the same folder as `CONTENT_FILE`. Back up the whole
`shared/data/` folder, not just content.json.

`CONTENT_FILE` sits outside the release folders, so deploys never touch what
staff saved in /admin. Each save also keeps the last 20 versions in
`shared/data/backups/`.

Nginx and HTTPS:

```bash
cp nginx.conf /etc/nginx/sites-available/sgxpressja.com   # from deploy/nginx.conf
ln -s ../sites-available/sgxpressja.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d sgxpressja.com -d www.sgxpressja.com
```

Start on boot, and nightly backups:

```bash
su - deploy -c "pm2 startup"   # run the command it prints, as root
crontab -u deploy -e           # add: 15 2 * * * /var/www/sgx-website/backup-content.sh
```

## Each deploy (from your computer)

Put the production `NEXT_PUBLIC_*` values in `deploy/production.env` (not
committed), then:

```bash
SERVER=deploy@your-server-ip ./deploy/deploy.sh
```

Rollback: point `current` at the previous folder in `releases/` and run
`pm2 reload sgx-website`.

## Going live

1. Deploy and test on the server's IP or a staging subdomain first.
2. A day before, lower the DNS TTL for sgxpressja.com to 300 seconds.
3. Point the `A` records for `sgxpressja.com` and `www` at the new server.
4. Run certbot (above) once DNS has switched.
5. Keep the WordPress site for a week as a fallback.

Old WordPress links (`/calculator/`, `/terms-and-conditions/`, `/about-us/`…)
redirect permanently to the new pages; see `next.config.ts`.
