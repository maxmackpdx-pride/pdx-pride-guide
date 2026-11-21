# Shared DrawerTop

Every room drawer uses the same composable top: `client/src/components/drawers/DrawerTop.tsx`, imported from `@/components/drawers/DrawerTop` or `@/components/drawers`.

Worlds stay similar, not identical. They share the building blocks, then each world configures the slots it needs.

## Default Placez / Events layout

1. `upcomingTitle` (default **UP NEXT**). Pass `null` to hide.
2. A narrow countdown card (`DrawerCountdownCard`): one full-bleed flyer, a dark scrim, a big hologram countdown, and the next event name. No list of extra events. Replace the whole card with `countdown`, or pass a mixed list as `countdownEvents` (Outzide: featured plus next-up buddy events and carpools).
3. `actions` (optional; Afterz uses this for the wide HOST AN AFTERZ button).
4. `filtersTitle` (default **FILTERS**). Pass `null` to hide.
5. A 14-day calendar rail (`PlacezCalendarFilter`). Outzide replaces this rail only with `lead` (a full-bleed In View mini-card rail). Set `showCalendar={false}` to hide it when you are not passing `lead`. `calendarLength` defaults to 14.
6. Compact filter chips (`DrawerFilterRail`). Only place-type chips use category colors. Event, time, and tag chips stay neutral.
7. `after` (optional; Afterz uses this for yellow-bloom RSVP cards and off-hours explainer copy).
8. A divider, then the drawer’s existing titled sections.

`lead` still replaces only the calendar, and still sits under FILTERS.

## Mini cards

`DrawerMiniCard` is the shared small card for events and places. Every card is 148 by 96, with rounded corners and an inset bevel. There is no outer bloom or glow. Share sits top-right and the heart sits bottom-right (heart means interested: save to the stack plus notifications).

Tapping a mini card pans and centers the map on that item, then opens the existing Eventz or Placez card centered over the blurred backdrop. This uses `centerThenOpenMapCard` in `shared/centerThenOpen.ts` and `centerThenOpenFromDrawer` in `client/src/lib/placezEventsDrawerApi.ts`. On a map surface it sets the existing `?event=` or `?place=` bookmark and does not rebuild the open-card view.

## Additive slots (stable for Outzide / Afterz)

Keep these props stable so the Outzide / Afterz branch can land on top:

- `lead` — replaces the calendar rail only
- `countdown` — replaces the default countdown card
- `countdownEvents` — events shown in the default countdown card
- `actions` — under the countdown
- `after` — after the filter chips, before the divider
- `upcomingTitle` / `filtersTitle` — section titles; `null` hides one
- `showCalendar` — default true
- `calendarLength` — default 14
