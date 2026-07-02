# Pride Week July 13–19, 2026 — Implementation Plan

**Status:** Draft for review
**Reviewer:** Claude (+ Tucker)
**Constraint:** July 19 = Sunday (SUN). Do not change date↔day mappings.

## Calendar (authoritative)

| Date   | Day       | Code |
|--------|-----------|------|
| Jul 13 | Monday    | MON  |
| Jul 14 | Tuesday   | TUE  |
| Jul 15 | Wednesday | WED  |
| Jul 16 | Thursday  | THU  |
| Jul 17 | Friday    | FRI  |
| Jul 18 | Saturday  | SAT  |
| Jul 19 | Sunday    | SUN  |

## What we're doing

Expand from Thu–Sun Jul 16–19 to full Pride Week Jul 13–19 with one canonical source in `shared/prideWeek.ts` for dates, colors, helpers, map pins, tag colors, filters, schedule, weather, and copy.

## Current problems (audit)

- prideWeek.ts still has WED 15 → MON 20 (missing Mon 13, Tue 14)
- multiDayEvents.ts missing TUE in PRIDE_LISTING_DAYS
- 6 copies of DAY_COLORS with SAT/SUN split (board = green/orange; modal/tags/CSS = orange/red)
- Events filter: only THU–SUN; kicker wrongly says July 18–19
- Map legend: 4 days only; pie pins need sorted day order
- Admin dropdown: hardcoded THU–SUN, not using prideWeek.ts

## Proposed 7-day palette (needs sign-off)

| Code | Hex     | Notes                        |
|------|---------|------------------------------|
| MON  | #8800FF | Purple opener                |
| TUE  | #0044FF | Blue                         |
| WED  | #CCFF00 | Yellow-green                 |
| THU  | #00FFFF | Cyan — official Pride starts |
| FRI  | #FF00CC | Pink                         |
| SAT  | #39FF14 | Green                        |
| SUN  | #FF6600 | Orange — Jul 19 parade       |

## Map pins (preserve behavior, extend colors)

- Single-day: 22px hollow circle, 3px stroke in day color, neon glow
- Multi-day: SVG pie slices, sorted MON→SUN, black ring
- RSVP: yellow #CCFF00 pulse (unchanged)
- Legend: 7 swatches + updated MULTI-DAY demo
- Directory map: no change (type-based pins)

## 8 implementation phases

0. Approvals (palette, Events.tsx unlock, copy)
1. prideWeek.ts + multiDayEvents.ts
2. CSS tokens (index.css + tokens.css)
3. Tags, cards, modal, directory accents
4. Map pins + legend
5. Events filter bar (requires Events.tsx approval)
6. Schedule, weather, submit, admin + prideDayFromDate sync
7. Copy & SEO
8. QA matrix (15 tests)

## Files touched (22+)

- **Shared:** prideWeek.ts, multiDayEvents.ts
- **Components:** EventsMap, EventTagsRow, EventBoardCard, EventModal, DashboardEventEditor
- **Pages:** Events, Submit, Schedule, Home, About, Directory, Admin
- **Lib:** scheduleExport, portlandWeather
- **Styles:** index.css, design-system/tokens/tokens.css
- **Server:** seo.ts, optional routes.ts validation

**Not changing:** DirectoryMap.tsx, server/storage.ts seeds

## Open questions for Claude + Tucker

1. Approve palette hex values?
2. Unlock Events.tsx + filter CSS for this project?
3. Server: auto-correct dayOfWeek from dateStart or warn only?
4. Schedule mobile: 7 scrollable columns OK?
5. Home countdown fallback: Jul 16 or Jul 13?
6. Any other Jul 16–19 references Claude finds?
7. Sync or consolidate tokens.css vs index.css?
8. Gifting "through July 26" — leave as broader season?

---

# Claude Review

*Reviewed 2026-07-02 against master `3d237cb`. Every audit claim was verified against the actual code; findings below.*

## Audit verification

| Plan claim | Verdict | Detail |
|---|---|---|
| prideWeek.ts is WED 15 → MON 20 | ✅ True | `shared/prideWeek.ts:11–16`. Missing MON 13 + TUE 14, **and includes an extra MON Jul 20** past the plan's end date (see Concern 1). No `prideDayFromDate` helper exists — it must be written, not "synced". |
| multiDayEvents.ts missing TUE | ✅ True | `shared/multiDayEvents.ts:5` — also a hardcoded duplicate list; it does **not** import prideWeek.ts. |
| 6 DAY_COLORS copies, SAT/SUN split | ✅ True | Exactly 6 JS maps. Group A (SAT `#39FF14` / SUN `#FF6600`, 4 days): `Events.tsx:32`, `Directory.tsx:46`, `EventBoardCard.tsx:7`, `EventsMap.tsx:14`. Group B (SAT `#FF6600` / SUN `#FF2400`, incl. WED): `EventModal.tsx:35`, `EventTagsRow.tsx:6`. CSS vars in `index.css:41–46` + `tokens.css:22–26` match Group B. Bonus bug: `Schedule.tsx:18–21` uses `var(--day-sat, #39FF14)` — Group A *fallbacks* against Group B *vars*, so its source reads green/orange but renders orange/red. |
| Events filter THU–SUN; kicker "July 18–19" | ✅ True | `Events.tsx:38` (`DAYS`), `:39` (`DAY_SORT_ORDER`), `:466` (kicker — wrong even for the current site; quick-fixable today). |
| Map legend 4 days; pie needs sort | ✅ True | `EventsMap.tsx:368–388`. Pie slice order is venue-group insertion order (`EventsMap.tsx:119`), not day order; popup `primaryColor` uses unsorted `days[0]` too. The MULTI-DAY legend swatch hardcodes 4 hexes **mixing both color groups**. |
| Admin dropdown hardcoded THU–SUN | ❌ **Already fixed** | `3d237cb` switched `DashboardEventEditor.tsx:103` and both Submit form selects to `PRIDE_WEEK_DAY_OPTIONS`. Phase 6's admin item is done — but both forms now inherit the wrong WED 15 → MON 20 window. |

**Calendar check:** verified with `date` — Jul 13, 2026 is Monday and Jul 19 is Sunday. The authoritative table is correct.

## Additions (missing from the plan)

1. **Data audit before re-pointing MON.** `3d237cb` is already live-ish: Submit and Admin currently offer WED 15 → **MON 20**. When prideWeek.ts remaps MON to Jul 13, any event already stored as `dayOfWeek: "MON"` (meaning Jul 20) silently relabels to Monday Jul 13. Add a pre-flight check (Phase 0.5): list events where `day_of_week` ≠ Pacific weekday of `date_start`, and all MON/TUE rows, and fix data first.
2. **`prideDayFromDate` doesn't exist yet.** Build it on `pacificDayOfWeek` (already in `shared/multiDayEvents.ts` — timezone-safe); don't hand-roll a second date→day conversion.
3. **Make `multiDayEvents.ts` import the day set from prideWeek.ts** — otherwise we keep the exact duplication this project is meant to kill.
4. **Countdown fallbacks (2 spots):** `Home.tsx:65` and `DashboardWidgets.tsx:29` both hardcode `2026-07-16T00:00:00-07:00`. Derive from prideWeek.ts.
5. **Schedule CSS column counts:** `.schedule-grid` hardcodes `repeat(4, …)` in **two** rules (`index.css:9191` desktop, `:9338` mobile). Both must become 7 (or derived); `Schedule.tsx:17–22` DAYS array and the `{THU,FRI,SAT,SUN}` bucket map (`:161`) too.
6. **Weather lib is fully hardcoded:** `portlandWeather.ts:19–28` (`PRIDE_WEEKEND_START/END`, `PRIDE_DAY_LABELS`, `PRIDE_DATES`), caption at `:81`, and the 4-row fallback forecast (`:104–109`). Check the 7-column weather grid on mobile.
7. **Schedule export PNG:** `scheduleExport.ts:15–21, :84` (DAY_LABELS with spelled-out dates, DAY_ORDER, byDay buckets).
8. **Copy/SEO inventory** (answers open question 6): `Home.tsx:46,151`; `About.tsx:14,63,67,107`; `Schedule.tsx:131` ("4-day"); `DashboardWidgets.tsx:52,128`; `client/index.html:7,17,22`; `server/seo.ts:213` (desc), `:322` (**FAQ JSON-LD** — structured data), `:431` (imageAlt). Also `design-system/previews/event-card.html:38` (cosmetic).
9. **The OG image artwork itself says "July 16–19"** (`og-preview.jpg`/`.png` + three alt texts referencing it). Needs a re-exported graphic, not just copy edits.
10. **Calm-mode grayscale override** (`index.css:8226–8230`) sets all `--day-*` to `#888` — add `--day-mon`/`--day-tue` there too or new pills go colored in calm mode.
11. **Map pin fallback color is `#CCFF00`** (`EventsMap.tsx` single + pie fallbacks). Once WED is a real filterable day, an unknown-day pin becomes indistinguishable from WED. Change fallback to a neutral (e.g. `#FFFFFF`).
12. **QA additions:** TUE event flows through `expandMultiDayEvents`; 7-slice pie renders sorted MON→SUN; calm mode; FAQ JSON-LD validates in Rich Results test; Submit default (currently FRI) still sensible.

## Concerns

1. **MON is ambiguous right now.** The plan's week ends Sun Jul 19, but shipped code offers Mon Jul 20. Tucker needs to make an explicit call: is Jul 20 a real wind-down day (then the week is 13–20 and the plan title is wrong) or does MON mean Jul 13 (then remove Jul 20 from the options and audit existing rows)? **This is the one blocking decision.** Everything in phases 1–7 depends on it.
2. **Palette — three issues:**
   - **WED `#CCFF00` collides with the RSVP pulse `#CCFF00`** (plan explicitly keeps RSVP unchanged). On the map, a WED pin and an RSVP'd pin share the same glow color. Suggest WED `#FFEE00` (already in the `--day-multi` gradient) and reserve `#CCFF00` for RSVP.
   - **TUE `#0044FF` (~3.3:1) and MON `#8800FF` (~3.5:1) on the near-black background** pass for 3px pin strokes/glows (≥3:1 graphics) but fail 4.5:1 for text (day pills, tags). Add lighter text variants (e.g. TUE `#4488FF`, MON `#AA66FF`) or lighten the base hexes.
   - If WED stays `#CCFF00`, it sits close to SAT `#39FF14` at 22px pin size. The `#FFEE00` swap fixes this too.
   - Otherwise the palette is good — THU/FRI match current values everywhere, and TUE/MON echo the existing `--day-multi` gradient colors. Adopting Group A's SAT/SUN means modal/tags/CSS users see SAT flip orange→green and SUN red→orange; acceptable, just ship it atomically (phases 2–4 in one deploy) so the two groups never disagree live.
3. **Events.tsx "lock":** there's no in-file marker; the rule lives in `.grok/skills/pdx-events-ux/SKILL.md` (+ a11y, culture-copy): day-pill **styling in index.css is off-limits**, filter **logic in Events.tsx may change with approval**. So the unlock request should be scoped: add day values to `DAYS`/`DAY_SORT_ORDER` and fix the kicker; new pills inherit existing styling untouched.
4. **7 filter chips + ALL on mobile** — check the filter bar wraps/scrolls acceptably at 375px before sign-off on Phase 5.
5. The kicker "July 18–19" is wrong for visitors **today** — worth shipping immediately, independent of this project (one-line fix).
6. FAQ JSON-LD change (`seo.ts:322`) must stay in lockstep with `About.tsx:63` — they mirror each other and Google reads both.

## Suggested changes

- **Add Phase 0.5 — data audit** (Concern 1 / Addition 1) before any remapping.
- **Put the colors in prideWeek.ts.** Extend it to a `DAY_META` map (label, date, hex, textHex) and delete all 6 JS maps in favor of imports. Keep CSS vars defined once in `index.css:root`; update `tokens.css` in the same commit as a documented mirror (it's the design-sync bundle — full consolidation isn't worth build tooling right now).
- **Ship the two trivial fixes now**, ahead of the project: Events kicker text, and normalizing `Schedule.tsx` CSS-var fallbacks to whatever the vars actually are.
- **Sort pie slices and popup primary color** with one shared `DAY_SORT_ORDER` exported from prideWeek.ts (calendar order MON→SUN per the new week).
- Phase ordering is otherwise sound; phases 2–4 should land as one deploy (Concern 2).

## Answers to open questions

1. **Palette:** approve **conditionally** — resolve the WED/RSVP collision (recommend WED → `#FFEE00`) and add text-contrast variants for TUE/MON. All other hexes ✅.
2. **Events.tsx unlock:** ✅ for filter *logic* (`DAYS`, `DAY_SORT_ORDER`, kicker); keep day-pill *styling* in index.css untouched per the pdx-events-ux skill rule.
3. **Server dayOfWeek:** derive-and-correct on **write** for new/edited events (server sets `dayOfWeek` from `dateStart` via `pacificDayOfWeek` when dates are present, logs when it overrode the client). Read-time fallback already exists in `expandMultiDayEvents`. Don't silently rewrite existing rows — that's the Phase 0.5 audit.
4. **Schedule mobile:** ✅ 7 scrollable columns (the `overflow-x: auto` wrapper already exists; it shows 2-of-4 today). Add initial scroll-to-today so weekend visitors don't swipe past 5 columns. Update both `repeat(4, …)` CSS rules.
5. **Countdown fallback:** Jul 13 — but derive it from prideWeek.ts's first day instead of a new literal, and fix **both** copies (Home + DashboardWidgets). Real countdown target stays "earliest event," which is correct.
6. **Other refs:** yes — see Additions 4–9 for the complete inventory (countdowns, weather lib, schedule export, schedule CSS, FAQ JSON-LD, OG artwork, calm-mode override, map fallback color).
7. **tokens.css vs index.css:** sync, don't consolidate (see Suggested changes) — single JS source of truth in prideWeek.ts, CSS vars in index.css, tokens.css as a same-commit mirror.
8. **Gifting July 26:** leave as-is ✅ — it's a separate season enforced server-side (`routes.ts:232` `GIFTING_RUN_END`), independent of event-week dates.

## Sign-off

- [x] Audit verified against master `3d237cb` (one claim already fixed: admin dropdown)
- [x] Architecture: prideWeek.ts as single source, incl. colors (`DAY_META`) — approved
- [x] Phasing approved **with amendments**: add Phase 0.5 data audit; land phases 2–4 atomically
- [x] Events.tsx logic unlock — approved, styling untouched
- [ ] Palette — **pending Tucker**: WED/RSVP collision decision + TUE/MON text variants
- [ ] **Blocking: Tucker to rule on MON Jul 20** (drop it, or the week is 13–20) — nothing in phases 1–7 should merge before this
- [ ] OG artwork re-export scheduled (design task, not code)

*— Claude, 2026-07-02*
