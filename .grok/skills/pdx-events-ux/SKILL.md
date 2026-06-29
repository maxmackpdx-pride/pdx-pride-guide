---
name: pdx-events-ux
description: >
  Events UX bucket agent for PDX Pride Guide. Use when asked to work on Events
  page behavior, search URL sync, filter clearing, multi-day deep links, or
  keyboard-accessible event cards. Triggers: "events UX", "events bucket",
  "?q= sync", "multi-day deep link", "clear filters", "keyboard cards",
  "/pdx-events-ux". Requires user approval before any UI/behavior change.
---

# PDX Events UX Agent

Specialized agent for the **Events UX** approval bucket on `pdx-pride-guide`.

## Standing rules (non-negotiable)

1. **User approval required** before implementing any change to how the site looks, feels, or behaves for visitors.
2. **Do NOT modify** the Events filter bar or day-pill styling in `client/src/index.css`.
3. **Do NOT change** mobile map layout, collapse, or map dominance — map bucket is explicitly out of scope.
4. Repo path: `/Users/tuckercasey/pdx-pride-guide`. Live: https://www.prideguidepdx.com

## Bucket scope

| Item | Description | Key files |
|------|-------------|-----------|
| Search URL sync | Read and write `?q=` as users type/clear search | `client/src/pages/Events.tsx` |
| Clear filters | "Clear Filters" must also reset `searchQuery` | `client/src/pages/Events.tsx` |
| Multi-day deep links | Client uses `?day=` when opening events; match clicked listing | `Events.tsx`, `shared/multiDayEvents.ts`, `shared/eventSlug.ts` |
| Keyboard cards | Event cards open modal via Enter/Space with button semantics | `Events.tsx` (cards only — not filter bar) |

## Already shipped (do not redo)

- Phase 5: lazy map chunk, `?q=` read on mount (write-back not done)
- Phase 6 API: `GET /api/events/:id?day=THU` — client not wired yet
- Nav/inbox fixes in commit `40e2032`

## Workflow

1. **Read** `Events.tsx`, `multiDayEvents.ts`, `eventSlug.ts`, and current routing in `App.tsx`.
2. **Propose** a minimal diff plan listing exact behavior changes. Present to user for approval.
3. **Implement** only approved items. Keep changes focused — no drive-by refactors.
4. **Verify**: build (`npm run build`), manual check of deep links and `?q=` bookmarking.
5. **Do not touch** `index.css` filter bar / day-pill rules.

## Implementation notes

- Multi-day: list uses `listingInstanceKey` (`id:date`); deep link should use `?day=THU` or include day in URL without breaking existing `/events/:id/:slug` shares.
- `events.find(e => e.id === routeEventId)` is the known bug — must match `dayOfWeek` or `listingInstanceKey`, not first id match.
- URL sync: prefer `history.replaceState` or wouter `setLocation` without full page reload; debounce search input ~300ms.

## Out of scope

- Map mobile collapse, map height, EventsMap lazy-load UX
- Share/social, OG cards, EventModal share
- Filter taxonomy (MARCH, QTBIPOC) — culture bucket
- Modal a11y — a11y bucket

## Report format when auditing

Return: executive summary, approved vs pending items, proposed diff plan with file paths, risks (SEO URLs, back-compat), and explicit approval ask.