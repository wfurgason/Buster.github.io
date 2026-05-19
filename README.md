# Buster — Official Band Website

**Live site:** [bustertheband.com](https://bustertheband.com)  
**Repo:** Buster.github.io  
**Deployed via:** Vercel  
**Last updated:** May 2025

---

## Overview

Full-stack static website for **Buster**, a heavy rock band based on Utah's Wasatch Front. Primary goals are fan engagement and fan base growth. Secondary audiences include talent buyers and booking agents.

The site is intentionally lightweight — no framework, no build step for the front end. Plain HTML, CSS, and vanilla JavaScript, deployed via Vercel for serverless API support.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Front end | HTML, CSS, Vanilla JS |
| Serverless API | Vercel (Node.js) |
| Backend / Automation | Google Apps Script (GAS) |
| Database | Google Sheets ("Buster Backend") |
| Payments | Stripe (Checkout) |
| Shows calendar | Google Calendar API |
| Email | Gmail via GAS (alias: buster@bustertheband.com) |
| DNS / Domain | bustertheband.com via CNAME |

---

## File Structure

```
Buster.github.io/
├── index.html          # Main site (single page)
├── epk.html            # Electronic Press Kit (separate page)
├── success.html        # Stripe payment success page
├── cancel.html         # Stripe payment cancel page
├── thankyou.html       # Form thank-you page
├── script.js           # All front-end logic (shows, forms, merch, poll)
├── components.js       # Shared nav + footer injected on all pages
├── styles.css          # Global styles
├── epk-styles.css      # EPK-specific styles
├── GAS_Code.gs         # LOCAL COPY ONLY — reference for the Apps Script
├── WelcomeTemplate.html # Fan welcome email template (used in GAS)
├── robots.txt
├── sitemap.xml
├── CNAME               # bustertheband.com
├── .gitignore          # Excludes .env*.local, .DS_Store, .vercel
├── .env.local          # ⚠️ NOT committed — contains Stripe secret key
├── api/
│   ├── create-checkout-session.js   # Vercel serverless function (Stripe)
│   └── package.json                 # stripe npm dependency
├── assets/             # Images, favicon, merch photos
└── backups/            # Manual file backups
```

---

## Key Integrations

### Google Apps Script (GAS)
- **Spreadsheet:** "Buster Backend" (Google Sheets)
- **Sheets:** `Fans`, `Bookings`, `Polls`, `ShowInterest`, `Agents`
- **Deployed as:** Web App (public, execute as me)
- **URL:** Stored in `script.js` as `SCRIPT_URL`
- **`GAS_Code.gs`** is a local reference copy only. After editing it, you must manually paste the updated code into the GAS editor and redeploy.

**GAS handles:**
- Inner Circle fan signups → appends to `Fans` sheet + sends welcome email
- Booking form submissions → appends to `Bookings` sheet + sends email + SMS alert
- Song poll votes → appends to `Polls` sheet
- Show interest clicks → updates `ShowInterest` counts
- Agent outreach → `installableOnEdit` trigger auto-emails agents when added to `Agents` sheet

### Stripe
- **Mode:** Test (not yet live)
- **Serverless function:** `api/create-checkout-session.js`
- **Secret key:** Set as `STRIPE_SECRET_KEY` environment variable in Vercel dashboard — never hardcoded
- **Publishable key:** Hardcoded in `script.js` (this is safe and expected for Stripe)
- **Store is hidden** behind `?mode=test` URL parameter until ready to launch

### Google Calendar
- Shows are pulled from the band's public Google Calendar (`busterthebandslc@gmail.com`)
- API key is restricted to `bustertheband.com` referrer in Google Cloud Console
- Shows auto-register in `ShowInterest` sheet on load; fans can mark interest and download `.ics` calendar files

### Email / SMS Alerts
- Welcome emails sent from `buster@bustertheband.com` alias via GAS
- Booking alerts sent to band email + SMS via T-Mobile carrier gateway (`8012011095@tmomail.net`)
- Agent outreach uses a separate `AgentTemplate.html` in GAS

---

## Local Development

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Run local dev server (serves site + API routes)
cd /Users/wfurgason/Documents/Buster/Buster.github.io
vercel dev
```

The local dev server reads `.env.local` automatically for the Stripe secret key.

---

## Deployment

Pushing to the `main` branch automatically triggers a Vercel deployment.

```bash
git add .
git commit -m "your message"
git push origin main
```

Vercel environment variables (including `STRIPE_SECRET_KEY`) are set in the Vercel dashboard, not in code.

---

## Environment Variables

| Variable | Where Set | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Vercel dashboard + `.env.local` | Never commit. Test key starts with `sk_test_` |

---

## Security Notes

### 🔴 Stripe Secret Key exposure
**Risk:** The `sk_test_...` key in `.env.local` would grant full Stripe account access if exposed.  
**Mitigation:** `.env.local` is listed in `.gitignore` and is never committed. The production key is stored exclusively as a Vercel environment variable in the dashboard, not in any file. The API function reads it via `process.env.STRIPE_SECRET_KEY` only at runtime on the server side.  
**Status:** Mitigated. Rotate key before going live with real payments.

### 🔴 Vercel OIDC Token in `.env.local`
**Risk:** A JWT token granting access to the Vercel project environment was stored in `.env.local`.  
**Mitigation:** File is gitignored and never committed. Token is short-lived (~12 hours) and auto-rotated by Vercel CLI on each `vercel dev` session.  
**Status:** Mitigated by gitignore + token expiry.

### 🟠 Google Calendar API Key in `script.js`
**Risk:** The API key is visible in client-side source code and could be used by anyone to consume quota against the project.  
**Mitigation:** Key is restricted to the `bustertheband.com` HTTP referrer in Google Cloud Console. Requests from any other origin are rejected by Google.  
**Status:** Mitigated.

### 🟡 GAS endpoint has no authentication or rate limiting
**Risk:** The Apps Script deployment URL is public and accepts POST requests from anyone. A bad actor could spam the `Fans` or `Bookings` sheets with fake data.  
**Mitigation:** None currently in place.  
**Status:** Open. Future improvement: add a simple shared secret token check in `doPost`, or add a honeypot/CAPTCHA to the forms.

### 🟡 Merch store activated by URL parameter
**Risk:** The store is gated behind `?mode=test` — visible to anyone who reads `script.js`.  
**Mitigation:** None beyond obscurity. Store is in test mode only; no real payments can be taken.  
**Status:** Acceptable for now. Remove the parameter gate entirely when the store goes live.

### 🔵 No HTTP security headers (CSP, etc.)
**Risk:** Without headers like `Content-Security-Policy`, `X-Frame-Options`, and `X-Content-Type-Options`, the site is more exposed to XSS and clickjacking attacks.  
**Mitigation:** None currently configured.  
**Status:** Open. Future improvement: add a `headers` block to `vercel.json`.

---

## Pages

| Page | Purpose | Audience |
|---|---|---|
| `index.html` | Main fan-facing site | Fans, general public |
| `epk.html` | Electronic Press Kit | Booking agents, talent buyers |
| `success.html` | Post-purchase confirmation | Fans (merch buyers) |
| `cancel.html` | Abandoned checkout | Fans |
| `thankyou.html` | Generic thank-you | Forms |

---

## Fan Engagement Features

- **Inner Circle signup** — name, email, zip code → GAS → welcome email
- **Quick email capture strip** — pre-fills Inner Circle form from hero section
- **Song poll** — fans vote on setlist; results shown live; vote stored in localStorage
- **Show interest** — "INTERESTED" button per show; count stored in GAS; calendar download offered
- **Merch store** — hidden until launch (`?mode=test` for preview)
- **Floating JOIN button** — persistent scroll-to-Inner-Circle CTA

