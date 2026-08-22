# Group A / A3 — Personal calendar navigation

## Audit (before any redesign)

### Which surface is the personal calendar?

**`/schedule` (`client/src/pages/Schedule.tsx`) is the personal calendar.** Nav labels it **My Schedule** (`siteNav.ts`: Eventz dropdown, mobile Events sheet, page header). The page already has My Schedule / All Events, a year-round week grid, and `weekStart` + prev/next.

The other candidates are **lists**, not a calendar:

| Surface | What it is | Period chrome |
|---|---|---|
| **Schedule** (`Schedule.tsx` + `Schedule.css` + `ScheduleToolbar.css` + `ScheduleHero`) | Year-round **week** grid. `weekStart`, `sch-weeknav`, `weekRangeLabel`. Default week = week of the next upcoming event, else this week. | Week range + prev/next. **"This week" only rendered when you have left the current week.** |
| **HubEvents** | Hub "Your Events" Going / Hosting rows. Kicker still says "Your Pride Week". | None. Empty: `"No events in this tab yet."` with no next action. |
| **EventsTab** (profile) | Upcoming / Past segments (hosting + going). | Upcoming/Past only. Owner upcoming empty already links to `/events`. Past empty did not. |
| **Dashboard widgets / HubNextRsvpTile** | Pride-week weather/countdown (seasonal) and "next RSVP" tile. | Not a calendar. |
| **Inbox PersonalView** | Threads + group chats. | Not a calendar. |
| **`scheduleExport.ts`** | Stories PNG export. | Not navigation. |
| **`PersonalCalendar.tsx` / `CalendarPage.tsx`** | **Do not exist** on `origin/master`. | — |

IA conclusion: do **not** add a second calendar engine on Hub/profile. The week model is not the failure. The failure is that the existing week navigator is easy to lose, "This week" is hidden when you need the landmark, the grid still opens on Pride-week Friday, and empty weeks are a dead end.

### What month/period chrome exists today?

- **Week**, not month: `sch-weeknav` with ‹ › and a range like `Jul 20 – 26`.
- Week nav sits **below** the sticky toolbar and empty banner, **not sticky**, and **not** inside the toolbar.
- Default landing week is "week of next event", so you can open My Schedule off of today with no "you are not on this week" landmark if `This week` is hidden (it is hidden when `activeWeekStart === this Monday` — and the opposite case is the only time it appears).

### Are period controls reachable one-handed on mobile (thumb zone, 360px, dock clipping)?

- **No.** Prev/next live in the document flow under the hero + sticky toolbar + filter chips. On phone the header scrolls away (`--site-header-height: 0`) but week nav is **not** pinned, so once you scroll into the grid you lose period controls.
- Arrows were 40px, not a thumb target. No bottom placement above the dock (`z-index: 80`, `--site-mobile-nav-height: 98px` + `env(safe-area-inset-bottom)`).
- Toast was `bottom: 28px` — **clipped by the dock**.
- Grid shell padding was `40px` bottom; the dock already has a main padding-bottom rule, but a bottom-pinned navigator needs its **own** extra pad so the last rows are not hidden.

### Visible "today" / "this week" affordance?

- **"This week" only appears when you have left the current week.** That is the opposite of a visible now landmark.
- Grid still had a **Pride-week leftover**: on mount it always scrolled to **Friday 3pm** (`3.15 * BASE_DAY`), even in a year-round week that does not contain that Friday.

### Days with events scannable at a glance?

- Desktop: yes, 7 columns + `N EVENTS` / `QUIET DAY` in headers + poster blocks.
- **Phone / 360px:** the inner `sch-scroll` only shows ~1–2 day columns at a time. You have to **pan the grid** to discover which days have events. No week-strip dots/counts.

### Dead-end empty states?

- Sign-in / no RSVPs / no matches: **copy only**, no buttons.
- **Quiet week** (events exist elsewhere, none in the visible week): **no banner at all**. All-quiet columns + no next action.
- HubEvents empty: kicker only. Profile past empty (owner): no next action.

### 360px + dock: what is clipped?

- Week nav and "This week" scroll away; toast sits under the dock.
- Grid horizontal pan is fine; period chrome is the thing that disappears.
- Existing dock-safe pattern (reuse, do not invent `--dock-safe`): `calc(var(--site-mobile-nav-height, 98px) + env(safe-area-inset-bottom, 0px))`.

---

## What we changed (controls, not a new calendar)

Kept the **week** grid. Did not add a month view.

1. **Period chrome is obvious**
   - Range + prev/next stay; 44px arrows; "This week" is **always** visible (cyan pill when you are on this week, jump-back when you are not). Tap This week also pans the grid to **today**.
2. **Thumb-reachable on mobile**
   - At `max-width: 640px`, week nav is `position: fixed` **above the dock** (`bottom: calc(var(--site-mobile-nav-height) + env(safe-area-inset-bottom))`, `z-index: 54` so the dock at 80 still wins). Left outside `ScrollReveal` so `transform` cannot trap `fixed`.
3. **Days with events scannable without opening a column**
   - 7-cell strip using existing day-color tokens (`DAYS` / `col.color`, calm greys). Filled cell + count when the day has events; idle mark when quiet; today ring. Tap a day pans `sch-scroll` to that column.
4. **Grid opens on now**
   - Replaced Friday-3pm Pride leftover with: today (if this week is on screen), else first busy day, else Monday.
5. **Empty states always have a next action**
   - Signed out: Sign in + Browse events.
   - My Schedule empty: Browse events + Submit.
   - Filters empty: Clear filters + Browse events.
   - Quiet week: This week (if away) + Next week + Browse events.
   - Hub Going empty: Browse events + Open My Schedule. Hub Hosting empty: Submit an event.
   - Profile owner empties: events board / promoter form.
6. **360px + dock**
   - Extra grid-shell padding (`124px`) for the pinned week nav. Toast lifted above dock + week nav. Day cells stay `minmax(0, 1fr)` so seven fit at 360px.

No `--c` on the day strip (inline day-color tokens). Empty-state `Button`s that set `--c` also carry `.pdx-glass-rebind`. No em dashes. No type/title/nav restyle.

---

## Files

- `client/src/pages/Schedule.tsx`
- `client/src/pages/Schedule.css`
- `client/src/pages/ScheduleToolbar.css`
- `client/src/components/hub/sections/HubEvents.tsx`
- `client/src/components/hub/hub-v2.css`
- `client/src/pages/profile/tabs/EventsTab.tsx`
- `GROUP_A_CALENDAR_REPORT.md` (this file)

## tsc

- Before: `npx tsc --noEmit --pretty false` → **0** errors
- After: `npx tsc --noEmit --pretty false` → **0** errors (did not increase)

Not pushed. Parent checkout `/Users/tuckercasey/pdx-pride-guide` was not edited.
