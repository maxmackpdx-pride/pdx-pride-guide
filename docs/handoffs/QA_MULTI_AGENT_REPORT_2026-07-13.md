# Master QA report - multi-agent bug hunt

**Date:** 2026-07-13  
**Prompt pack:** `docs/handoffs/MULTI_AGENT_BUG_TEST_PROMPT.md`  
**Agents:** A–L (unit, API, auth, events UI, modal, a11y, mobile shell, admin, data, XSS, inbox, SEO)

## Fix order (next sessions)

1. Gate `GET /api/events/:id` on LIVE (or admin-only HIDDEN)
2. `/inbox` double bottom nav + hub main bottom padding
3. Shared focus-trap / Escape for EventModal + AuthModal
4. Revalidate admin every request; harden session secret gate
5. Thread mark-all-read + RSVP vs chat membership split
6. Deploy day-aware poster assets + `resolveEventPosterUrl`
7. Sanitize ticket/website URLs; fix `innerHTML` export sinks
8. Events URL sync (`replace` + reverse hydrate) + clear-filters includes day
9. Narrow `isUserEventHost` (drop `submittedBy` as host)
10. Data: Badlands Y2GAY vs Thirsty Thursdays; OSLC; geocode gaps

## P0

| Finding | Agents |
|---------|--------|
| HIDDEN events leak via `GET /api/events/:id` | B |
| Double bottom nav on `/inbox` | G |
| Hub routes lack bottom padding while site bar shows | G |
| EventModal + AuthModal not keyboard-safe (Escape, focus trap, dialog role) | E, F |

## P1 (selected)

- Sticky `session.isAdmin` after revoke (C, H)
- Secrets soft-warn / default SESSION_SECRET (C)
- Events `?q=` history spam; clear filters ignores day (D)
- Message host compose off-screen (E)
- Private address in calendar export (E, B)
- Multi-day expand not bound to Pride week dates (A)
- Day-aware posters not live / missing prod assets (B, L)
- `submittedBy` permanent host (H)
- Mark-read latest only; RSVP tied to chat expiry (K)
- Gifting admin pending double-count (K)
- ItemList JSON-LD ignores real posters; OG secure_url stale (L)
- `javascript:` possible on ticketUrl/website (J)
- `scheduleExport` innerHTML XSS (J)
- Badlands duplicate listing (I)
- RailCard / Directory cards mouse-only (F)

## Clean

- Iced Tea Sun 3–10pm White Owl; Yes Sir 9pm–2am REALM (I)
- Public list LIVE-only; claim happy path largely sound
- PUBLIC chips off cards (A)
- ListingCard keyboard props; FilterChip `aria-pressed`
- Health 200

## Note: local vs live

Map hide, sticky CTAs, PUBLIC hide, day posters may be local/uncommitted; agents B/L reported live still on legacy poster resolve.
