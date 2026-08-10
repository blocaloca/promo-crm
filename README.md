# Promo CRM

Internal outreach + promo organizer. Phone-first CRM, promo builder, worklists you walk one-by-one.
Stack: Next.js 14 (App Router) · Neon Postgres · Vercel Blob · Tailwind · PWA.

## What's built (v1)

- **Prospects** — search/filter, states (prospect → contacted → in_convo → booked → dormant), quick add, **going-cold view** (contacted/in_convo, untouched 21+ days), inline "reach out" (copy message+link, log send).
- **Media library** — upload from phone camera roll or library, **downscaled on-device** before upload (long edge 2000px, q0.8) so it's fast on cell data. Tagged thumbnail grid, stored as public Vercel Blob objects.
- **Promo builder** — one placeholder template (design your real set next), name/aspect/headline/body/CTA, **OG preview fields** (the LinkedIn card), thumbnail asset picker with slot ordering, draft/publish. Publishing mints a public token.
- **Public promo page** `/p/{token}` — server-rendered, light/branded (distinct from the dark cockpit), correct OG + twitter:summary_large_image tags so pasted links preview well. Bumps view_count.
- **Messages** — typed copy library (intro / follow_up / industry / referral / reengage), grouped.
- **Lists** — named worklists; add prospects by filter or hand-pick; progress counts.
- **Run view** `/lists/{id}/run` — one prospect at a time, progress bar, prev/skip, **logging a send marks done + advances**. The one-by-one walk. Not a blast.

Single-user app: `org_id`/`owner_id` are hardcoded constants (`src/lib/constants.ts`), not multi-tenant RLS — auth is a single shared password, not per-user accounts.

## Setup

1. Create a Neon Postgres project and a Vercel Blob store, and link both to this Vercel project.
2. `vercel env pull .env.local` to pull `DATABASE_URL`/`DATABASE_URL_UNPOOLED`/`BLOB_READ_WRITE_TOKEN`.
3. Generate `SESSION_SECRET` (`openssl rand -base64 32`) and `APP_PASSWORD_HASH` (scrypt hash, `salt:hash` hex) and add them as env vars.
4. `npm install` then `npm run dev`. Open http://localhost:3000, sign in with your password.

## Outbound flow (v1, no API needed)

Pick a promo + message + channel → **Copy message + link** → paste into LinkedIn DM (or email) yourself → **Log send**. Human by design; LinkedIn has no send API anyway. The promo link is the hero — its OG card is the first impression.

## Deferred (clean bolt-ons — the schema already accounts for each)

- **Gmail API** (draft/send + reply-tracking) — `channel` + `interactions.direction` already model inbound/outbound.
- **Planoly / social auto-posting** — promos already carry social aspect ratios (1:1 / 4:5 / 9:16).
- **PDF render** — `promos.pdf_path` reserved; wire your headless-Chromium template render to it.
- **AI retrieval** ("hospitality promos I haven't sent them") — pure metadata filtering, no model needed.
- **Real promo templates** — `template_key` is a string; add layouts and switch on it. Your taste, front-loaded once.

## Notes

- Downscale is client-side (your choice) — raw files never leave the device.
- View-tracking is a naive counter; swap for a logged pageview table if you want per-open timestamps.
- `og:image` points directly at a Vercel Blob URL — public, non-expiring, no signed-URL refresh needed.
