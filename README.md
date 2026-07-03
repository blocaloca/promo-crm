# Promo CRM

Internal outreach + promo organizer. Phone-first CRM, promo builder, worklists you walk one-by-one.
Stack: Next.js 14 (App Router) · Supabase (Auth + Postgres + Storage) · Tailwind · PWA.

## What's built (v1)

- **Prospects** — search/filter, states (prospect → contacted → in_convo → booked → dormant), quick add, **going-cold view** (contacted/in_convo, untouched 21+ days), inline "reach out" (copy message+link, log send).
- **Media library** — upload from phone camera roll or library, **downscaled on-device** before upload (long edge 2000px, q0.8) so it's fast on cell data. Tagged thumbnail grid, private bucket via signed URLs.
- **Promo builder** — one placeholder template (design your real set next), name/aspect/headline/body/CTA, **OG preview fields** (the LinkedIn card), thumbnail asset picker with slot ordering, draft/publish. Publishing mints a public token.
- **Public promo page** `/p/{token}` — server-rendered, light/branded (distinct from the dark cockpit), correct OG + twitter:summary_large_image tags so pasted links preview well. Bumps view_count.
- **Messages** — typed copy library (intro / follow_up / industry / referral / reengage), grouped.
- **Lists** — named worklists; add prospects by filter or hand-pick; progress counts.
- **Run view** `/lists/{id}/run` — one prospect at a time, progress bar, prev/skip, **logging a send marks done + advances**. The one-by-one walk. Not a blast.

Every table carries `org_id` + RLS from day one — solo now, multi-tenant when you flip it on. Auth is Supabase magic-link; first login bootstraps an org.

## Setup

1. Create a Supabase project.
2. Run the migrations in order in the SQL editor:
   - `supabase/migrations/0001_init.sql`  (schema + RLS)
   - `supabase/migrations/0002_storage.sql`  (buckets + storage policies)
3. Copy `.env.local.example` → `.env.local`, fill in your project URL + anon key.
4. `npm install` then `npm run dev`. Open http://localhost:3000, sign in with your email.

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
- `og:image` uses a 1-hour signed URL from the private bucket. For long-lived link previews, copy the OG hero into the public `promo-public` bucket on publish and point `og_image_path` there.
