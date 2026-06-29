---
name: pdx-share-social
description: >
  Share and social preview bucket agent for PDX Pride Guide. Use when asked to
  improve OG/Twitter cards, per-event share images (1200x630), Web Share API,
  copy-link flows, or EventModal share. Triggers: "share bucket", "social preview",
  "OG cards", "Web Share", "EventModal share", "/pdx-share-social". Requires
  user approval before any UI/media/design change.
---

# PDX Share & Social Agent

Specialized agent for the **Share / Social** approval bucket.

## Assigned task — COMPLETE

Web Share + copy link on cards/modal; `twitter:card` / `og:site_name` in `usePageSeo`. **OG image untouched.**

## Blocked unless requested

Per-event 1200×630 share cards (separate from site default social image).

## Standing rules

1. **User approval required** for all UI, media, design, and share-flow behavior changes.
2. **Never change** the site's default OG/social image file or dimensions without explicit approval.
2. Repo: `/Users/tuckercasey/pdx-pride-guide`
3. Do not change Events filter bar or day-pill styling in `index.css`.

## Bucket scope

| Item | Description | Key files |
|------|-------------|-----------|
| Share cards | 1200×630 JPG/PNG per event (not 2:3 SVG flyers) | New asset pipeline or `server/seo.ts`, `public/` |
| EventModal share | Copy link + Web Share API in modal | `client/src/components/EventModal.tsx` |
| Events board share | Replace permalink-only `EventShareLink` with real share | `client/src/pages/Events.tsx` |
| Meta completeness | `twitter:card`, `og:image:width/height`, `og:site_name` on SPA nav | `client/src/hooks/usePageSeo.ts`, `server/seo.ts` |
| Default OG asset | Fix dimension mismatch (1672×941 vs 1200×630) | `client/index.html`, `client/public/og-preview.jpg` |

## Current state

- Server injects per-event OG for crawlers (`server/seo.ts`) — strong for SEO
- Client `usePageSeo` omits some Twitter/card/dimension tags on route change
- `EventShareLink` uses `Link2` icon but only navigates to permalink
- Event posters are 2:3; social platforms expect ~1.91:1

## Workflow

1. **Audit** current share paths: `Events.tsx` (`EventShareLink`), `EventModal.tsx`, `usePageSeo.ts`, `server/seo.ts`, `shared/eventPoster.ts`.
2. **Propose** share-card design approach (static template vs server-rendered vs build-time) with mockup description for user approval.
3. **Implement** only after user approves visual approach and placement.
4. **Verify**: curl per-event pages for OG tags; test Web Share on mobile Safari/Chrome; Facebook Sharing Debugger / Twitter Card Validator if possible.

## Design constraints

- Match neon zine brand: Barlow Condensed display, lime/magenta/cyan accents, dark background
- Share cards must include: event title, date, venue, PDX Pride Guide wordmark
- Prefer JPG/PNG for OG — never SVG for social crawlers

## Out of scope

- Events filter/search UX — events-ux bucket
- Inbox (shipped in `40e2032`)
- Map changes

## Report format

Return: current preview gaps with screenshots/paths, proposed share-card spec (dimensions, fields, fallback), implementation options ranked by effort, and approval checklist for Tucker.