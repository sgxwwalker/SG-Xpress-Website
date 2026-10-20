# Deploying the SG Xpress website

One Linux server (Ubuntu 24.04) runs two copies of the site:

| Copy    | Address                        | Folder                          | Port |
|---------|--------------------------------|---------------------------------|------|
| Staging | https://staging.sgxpressja.com | /var/www/sgx-website-staging    | 3101 |
| Live    | https://sgxpressja.com         | /var/www/sgx-website            | 3100 |

Staging is password-protected and hidden from Google. It has its own content,
staff accounts and messages, so testing there never touches the live site.

---

## Step 1: Get a server (you)

Any provider with Ubuntu 24.04 works. A 1 GB / 1 CPU server (about US$5–6/month at
DigitalOcean, Hetzner, Vultr or Linode) is enough for both copies.

When creating it, add your computer's SSH key. If you don't have one, run this on
your Mac and paste the printed line into the provider's "SSH key" box:

```bash
ssh-keygen -t ed25519 -C "sgx-website"
```

```bash
cat ~/.ssh/id_ed25519.pub
```

Note the server's IP address.

## Step 2: Point the staging address at it (you)

Where the sgxpressja.com DNS is managed (domain registrar or Cloudflare), add:

| Type | Name    | Value            | TTL |
|------|---------|------------------|-----|
| A    | staging | your server's IP | 300 |

This leaves the current WordPress site at sgxpressja.com untouched.

## Step 3: Set up the server (one time)

```bash
ssh root@YOUR-SERVER-IP
```

Then, on the server:

```bash
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx apache2-utils ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
npm install -g pm2

# Firewall: only SSH and web traffic
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable

# A non-root user that runs the site, using the same SSH key as root
adduser --disabled-password --gecos "" deploy
mkdir -p /home/deploy/.ssh && cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh

mkdir -p /var/www/sgx-website-staging/{releases,shared/data}
chown -R deploy:deploy /var/www/sgx-website-staging
```

From your Mac (in the SGX Website folder), copy the helper files up:

```bash
scp deploy/ecosystem.config.cjs deploy/backup-content.sh deploy/rollback.sh deploy@YOUR-SERVER-IP:/var/www/sgx-website-staging/
```

```bash
scp deploy/nginx-staging.conf root@YOUR-SERVER-IP:/etc/nginx/sites-available/staging.sgxpressja.com
```

## Step 4: Staging secrets (you, on the server)

Make passwords on your Mac (they never go in git, chat or email):

```bash
npm run hash-password    # asks for the new password without showing it
```

```bash
openssl rand -base64 32
```

On the server, as root, create `/var/www/sgx-website-staging/shared/.env`
(`nano /var/www/sgx-website-staging/shared/.env`):

```bash
SUPERADMIN_USERNAME=wwalker
SUPERADMIN_NAME=Warren Walker
ADMIN_PASSWORD_HASH_B64=...   # the line printed by hash-password
SESSION_SECRET=...            # the openssl output
CONTENT_FILE=/var/www/sgx-website-staging/shared/data/content.json
NEXT_PUBLIC_SITE_ENV=staging
NEXT_PUBLIC_SITE_URL=https://staging.sgxpressja.com
```

Then lock it down: `chown deploy:deploy` and `chmod 600` that file.

Optional extras in the same file:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `CONTACT_TO` and `CAREERS_TO` email contact messages and job applications. They're always saved in /admin too. With the current email host: `SMTP_HOST=mail.sgxpressja.com`, `SMTP_PORT=465`, and the existing `info@sgxpressja.com` mailbox as `SMTP_USER`/`SMTP_FROM`. Messages go to `CONTACT_TO=info@sgxpressja.com`; job applications and CVs go to `CAREERS_TO=hr@sgxpressja.com`.
- `TURNSTILE_SECRET_KEY` turns on Cloudflare's spam check. It needs the site key in `deploy/staging.env` too.

## Step 5: Nginx, the reviewer password and HTTPS (on the server, as root)

```bash
ln -s ../sites-available/staging.sgxpressja.com /etc/nginx/sites-enabled/
htpasswd -c /etc/nginx/sgx-staging.htpasswd reviewer   # asks you to type a password
nginx -t && systemctl reload nginx
certbot --nginx -d staging.sgxpressja.com
```

Anyone reviewing staging needs the `reviewer` login first (a browser pop-up), then
the normal site. Admin staff then log in at /admin as usual.

## Step 6: Deploy (from your Mac)

`deploy/staging.env` already holds the staging build settings. From the SGX Website folder:

```bash
SERVER=deploy@YOUR-SERVER-IP ./deploy/deploy.sh
```

Then make the site start on reboot. As `deploy`, run `pm2 startup`, then run the
command it prints as root.

Visit https://staging.sgxpressja.com. Updating it later is just the deploy command again.

Optional nightly backups. Run `crontab -u deploy -e` and add:

```
15 2 * * * /var/www/sgx-website-staging/backup-content.sh
```

## What to test on staging

- Every page on a phone and a computer, and every link and button: Register, Login, WhatsApp, call, maps, app stores.
- Calculator: Air and Ocean, several weights and item values.
- Admin:
  - log in as wwalker
  - change a rate and save, then check the Rates page and calculator
  - add a staff account and log in as them
  - check the Activity log
- Contact form: send a message, then check that it appears in /admin → Messages.
- Careers: add a test job in admin, apply with a PDF CV, then open the CV in /admin → Applications.
- Delete test messages, applications, jobs and staff when done.

---

## Going live later (same server)

1. Create `/var/www/sgx-website/{releases,shared/data}` and copy in `ecosystem.config.cjs`, `backup-content.sh` and `rollback.sh`. The live `.env` is the same as staging with:
   - `CONTENT_FILE=/var/www/sgx-website/shared/data/content.json`
   - `NEXT_PUBLIC_SITE_ENV=production`
   - `NEXT_PUBLIC_SITE_URL=https://sgxpressja.com`
   - its own new `SESSION_SECRET`
2. Optionally copy the content you approved on staging: `cp /var/www/sgx-website-staging/shared/data/content.json /var/www/sgx-website/shared/data/`.
3. Install `deploy/nginx.conf` as `/etc/nginx/sites-available/sgxpressja.com` and enable it.
4. Copy `deploy/production.env.example` to `deploy/production.env`, add the GA4 ID, then deploy:

   ```bash
   SERVER=deploy@YOUR-SERVER-IP TARGET=production ./deploy/deploy.sh
   ```

5. **Protect email first.** Email for sgxpressja.com is hosted on the old WordPress server (199.85.208.169), and the MX record points at `sgxpressja.com` itself, so moving the website would move email too. At least a day before switching:
   - change `mail.sgxpressja.com` from a CNAME to an **A record** → `199.85.208.169`
   - change the **MX** record to `mail.sgxpressja.com`
   - keep the old hosting account active for email
   - send a test email to info@sgxpressja.com afterwards
6. A day before, lower the DNS TTL for sgxpressja.com to 300. Then point the `@` and `www` A records at the server.
7. Run `certbot --nginx -d sgxpressja.com -d www.sgxpressja.com`.
8. Keep the WordPress site for a week as a fallback.

Old WordPress links (`/terms-and-conditions/`, `/about-us/`…) redirect to the new pages
(see `next.config.ts`).

## Rollback and restore

**Undo a bad deploy** (on the server, as `deploy`):

```bash
/var/www/sgx-website/rollback.sh                    # back to the previous release
/var/www/sgx-website/rollback.sh 20261015-0930      # or a named one from releases/
```

Saved content, staff, messages and CVs live in `shared/data`, so a rollback never touches them.

**Undo a bad admin save:** each save keeps the previous version in `shared/data/backups/`.
Copy the one you want over `shared/data/content.json`. No restart is needed; pages read it on the next visit.

**Superadmin can't log in and can't reset by email:** delete `superadmin.json` from the
data folder (next to `content.json`; on cPanel, the `sgx-data` folder). The password from the
`ADMIN_PASSWORD_HASH_B64` server setting works again. No restart is needed.

**Restore everything** (content, staff, messages, applications, CVs) from a nightly archive:

```bash
tar -xzf /var/backups/sgx-website/data-YYYYMMDD.tgz -C /var/www/sgx-website/shared/data
```

Also copy `/var/backups/` off the server now and then (or turn on your provider's
server backups), so a lost server doesn't take the backups with it.
