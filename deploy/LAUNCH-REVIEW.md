# Pre-launch review: SG Xpress website

**Date:** 15 October 2026
**Tested on:** the exact production build, run locally as a staging stand-in. Final testing was done on localhost; no staging server pass is planned.

**Result:** all critical and high-risk issues found are fixed and retested. The final regression run passed 23 of 23 checks.

## What was checked

| Area | How | Result |
|---|---|---|
| Dependencies | `npm audit` | **Fixed:** Next.js had 6 high-severity advisories, upgraded to 16.4.1. Live-site dependencies now show 0 vulnerabilities. |
| Secrets | Scanned all files and the full git history for keys, tokens and password hashes. Also checked browser files and the deploy package. | No secrets in git or in browser files. **Fixed:** the deploy package was picking up your local `.env`. |
| Code review | Login, sessions, staff roles, admin actions, forms, uploads, content storage | 7 issues fixed (below). |
| Admin panel | Live attacks on the running build: forged and unsigned session cookies, calling admin functions directly, cross-site requests, brute-force login, staff trying superadmin actions, script and link injection | All blocked after fixes. |
| Forms | Contact and job application: spam trap, too-fast sending, per-visitor limits, faked visitor addresses, script injection, line breaks in names (email header injection) | All blocked; real messages and applications still go through. |
| CV uploads | Text file named .pdf, renamed .exe, .svg, .html, 6 MB file, `../../` file name, PDF/HTML hybrid; downloading CVs without signing in | Bad files rejected. CVs are saved under random names, only downloadable by signed-in staff, and always as a download, never opened in the page. |
| Calculator | 82 automated checks on the real pricing code and rates, plus browser spot-checks | All pass: rounding, 0.1–0.5 lb rate, every weight 1–50 lb, J$200/J$500 fee, 35% over US$100 charge, ocean per cu ft and under 1 cu ft, over-50 lb WhatsApp. |
| Whole site | All 13 pages, 45 links (on-site and external), redirects, phone-width layout, images, console errors, search-engine hiding on staging | All pass. |
| Backups and rollback | Copied the server's folder layout locally: deploy, roll back, roll forward, delete all data, restore from the nightly archive | All work. Saved content, staff, messages and CVs survive deploys and rollbacks. |

## Issues found and fixed

| # | Risk | Issue | Fix |
|---|---|---|---|
| 1 | **High** | Next.js 16.3.6 had known security flaws (cache poisoning, image-proxy SSRF, information leaks). | Upgraded to Next 16.4.1 and React 19.3.1. |
| 2 | **High** | After every deploy, public pages would have shown the content from build time (default prices), not what staff saved, until someone saved again. | Pages now read the saved content on every visit. |
| 3 | **High** | Spam and login limits trusted an address the visitor can fake, so they could be bypassed. This allowed unlimited CV uploads (disk filling) and unlimited password guessing. | Uses the address Nginx sees, which can't be faked. Added site-wide caps: 30 applications an hour, 100 messages an hour. |
| 4 | **High** | The deploy package included the local `.env` (local admin password hash and session secret). | `deploy.sh` strips it and refuses to deploy if one is found. |
| 5 | Medium | Resetting or changing a password didn't sign out existing sessions (up to 8 hours). | Sessions are tied to the current password; a change ends all older sessions. |
| 6 | Medium | Admin link fields accepted `javascript:` links. React blocked them, but nothing else did. | Links must be site pages (`/faqs`) or `https://`, with a clear error message. |
| 7 | Medium | The site could be loaded inside another website's frame (clickjacking risk to the admin). No basic security headers were set. | Added frame blocking, nosniff, referrer and permissions headers; HSTS in Nginx; admin pages never cached. |
| 8 | Medium | One invalid field in the saved content made the whole site, and the admin, fall back to the defaults. A save from that state would have overwritten staff edits. | Only the invalid section falls back; everything else staff saved is kept. |
| 9 | Low | A wrong username answered faster than a wrong password, which reveals which usernames exist. | Both now take the same time. |
| 10 | Low | The "deleted a message" log entry was written from what the browser sent. | Now written from the saved message. |
| 11 | Low | Line breaks were allowed in names that go into email headers. | Rejected. |

New: `deploy/rollback.sh` gives a one-command rollback. Restore steps are in `deploy/README.md`.

## Outstanding (updated 17 Oct 2026)

Before launch:

1. **Node.js on the server:** the cPanel host must enable Node.js 22 or 24 (minimum 20.9.0, set in `package.json`), or use a VPS.
2. **Rebuild the upload package** with `deploy/package-cpanel.sh` right before uploading.
3. **Email (SMTP):** send through the existing `info@sgxpressja.com` mailbox. Contact messages go to `info@sgxpressja.com`; job applications and CVs go to `hr@sgxpressja.com`. Settings are in `deploy/README.md`.
4. **Turnstile:** create a new secret key in Cloudflare and set `TURNSTILE_SECRET_KEY` on the server.
5. **DNS:** if the site moves off the cPanel host, change only the website records and leave the mail (MX) records alone.

After launch:

6. **Off-server backups:** turn on the host's backups, or copy the content and media backups elsewhere.
7. **Google:** check Analytics (G-1C5HGP1Y8Y) and Search Console are receiving data, and submit `sgxpressja.com/sitemap.xml`.

Decided by the owner (not doing): a staging-server test pass (tested on localhost instead), a new admin password, a separate website@ mailbox, a lawyer review, final content checks, removing `.env.vercel-preview`, and revoking the old GitHub token.

Accepted low risks:
- Lint tools (developer-only, not on the live site) carry a `braces` advisory with no fix yet.
- Login lockouts are kept in memory, so they reset if the site restarts.
- Five wrong passwords lock that username for 10 minutes, even for the real owner. This is deliberate.
- Watch for Next.js 16.4.x patch releases.
