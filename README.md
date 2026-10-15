# SG Xpress website (sgxpressja.com)

The public website for SG Xpress Shipping. It is a separate project from the SGX
Back Office and shares no code or data with it.

Built with Next.js (App Router), TypeScript and Tailwind. The font is Poppins and
the colours are navy `#1d3361` and yellow `#fdcb06`, matched to the logo.

## Run it locally

```bash
npm install
cp .env.example .env      # then fill in the values (see below)
npm run dev -- --port 3100
```

- Site: http://localhost:3100
- Staff admin: http://localhost:3100/admin

Set the admin password with `npm run hash-password -- "a strong password"` and
paste the printed line into `.env`. Generate `SESSION_SECRET` with
`openssl rand -base64 32`.

## Admin accounts

- **Superadmin** (one only): set on the server with `SUPERADMIN_USERNAME`, `SUPERADMIN_NAME`
  and `ADMIN_PASSWORD_HASH_B64`. Can do everything, plus add, switch off, remove and reset
  staff accounts, and see the **Activity** log.
- **Staff**: created by the superadmin in /admin → Staff. Can edit all content, read
  messages and change their own password. Switching an account off logs that person out
  straight away.
- **Activity log** (`activity.json`): logins, logouts, every save with the exact changes
  (e.g. "Air rate 3 lb: 1,800 → 1,850"), deleted messages and account changes.
- If two people edit at once, the second save is refused with a message, so nobody
  overwrites someone else's work.
- After 5 wrong passwords for a username or from one connection, logins wait 10 minutes.
- **Job applications** go to admin → Applications (and to `CAREERS_TO`/`CONTACT_TO` by email if SMTP is set). CVs (PDF/Word, 5 MB max, checked by file signature) are stored privately next to content.json and can only be downloaded by logged-in staff; every download is logged.

## How content works

Prices, fees, the notice bar, branches, hours, FAQs and China addresses are
edited by staff at `/admin`. They're saved to one JSON file (`CONTENT_FILE`,
default `data/content.json`) and the public pages update as soon as staff save.

- Until the first save, the site uses `src/lib/content/defaults.ts`.
- Every save keeps the previous 20 versions in `data/backups/`.
- All price maths (homepage estimate, Rates calculator, rate table) comes from
  `src/lib/rates.ts`, so the three always agree.

Fixed links (register, login, app stores) are in `src/lib/site.ts`. The legal
text for Terms and Privacy is in `src/content/`.

## Pages

| Path | What it is |
| --- | --- |
| `/` | Homepage |
| `/rates` | Calculator, air table, fees, ocean, China, barrels |
| `/china-direct` | Air/sea/dangerous goods, steps, China addresses with copy buttons |
| `/about`, `/contact`, `/faqs` | |
| `/careers`, `/careers/[job]`, `/careers/apply` | Job openings (managed in admin → Careers), job pages with CV upload, general applications |
| `/restricted-items`, `/privacy`, `/terms` | |
| `/admin` | Staff editing, password protected, not indexed by search engines |

## Tracking

When `NEXT_PUBLIC_GA_ID` is set, these GA4 events are sent: `register_click`,
`login_click`, `whatsapp_click`, `call_click`, `directions_click`,
`app_store_click` and `estimate_used`. Each event includes the page and where
on the page the click happened. To track a new link, add
`data-track="event_name" data-track-location="where"` to it.

## Deploying

See [deploy/README.md](deploy/README.md).
