# Blocked fixes — QSearch

Record fixes that could not land yet, watched weekly by the blocked-fix
tracker (`qsearch-blocked-fix-tracker`) until each is verified landed.
An item closes only with live evidence.

## Open

- **Event 502 — stored dates fail validation.** dateEnd must be after
  dateStart; no change of any kind can land on this record until its
  dates are fixed. Open since before Nov 16, 2026. Route: site-side /
  developer.
- **Sanctuary description + admission depth** (Nov 23, 2026 detail-page
  audit): only 5 of 64 upcoming Sanctuary records carry a full
  description; 15 sit at admission UNKNOWN. Backfill from the detail
  pages (description, doors, cover). Route: paired API / detail-page
  pass in a sweep.
- **QSC stubs 2367–2369** (Nov 23, 2026 audit): published from the
  calendar index — age UNVERIFIED, no ticketUrl. Backfill from the
  /events-portland/<slug> detail pages.
- **Darcelle stubs 2115/2116, 2133/2134** (Nov 23, 2026 audit):
  119-char descriptions, ticketUrl points at the index. Backfill from
  the dated /event/<slug>/<date>/ pages.
- **Eventbrite field depth** (Nov 23, 2026 audit): 11 of 17 EB-ticketed
  upcoming records at admission UNKNOWN, 9 age UNVERIFIED. Capture from
  the event pages.
- **Red Hanky Social 1909–1912**: all four editions lack end times and
  admission. Source: the Partiful event pages (browser lane).
- **Fridays Are A Drag start time — DECISION-blocked, not route-blocked:**
  catalog 20:30 vs Badlands API 21:30. Needs Tucker's ruling; do not
  auto-change either way.

## Closed

- **Event 824 (The Locker Room) end time** — opened Nov 24, 2026 (API
  lock + admin save rejection); closed Nov 24, 2026: root cause was a
  server date-comparison bug (UTC vs Pacific offset), fixed in code;
  end now reads Nov 28, 2026, 02:00, verified live.
- **Event 2022 (Yes Coach Anniversary) eventTypes** — opened Nov 16,
  2026 (no API or form route); closed Nov 24, 2026: KINK set through a
  guarded data-layer fix, verified live.
