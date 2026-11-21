# Shared DrawerTop

Path: `client/src/components/drawers/DrawerTop.tsx`

Import from `@/components/drawers` or `@/components/drawers/DrawerTop`.

Every room drawer (Events, Placez, Outzide, Afterz, and map drawers) starts with this untitled top, then its own titled sections. Do not fork a second top.

## Order, top to bottom

1. Placez seven-day calendar rail (`PlacezCalendarFilter`), used as a date filter. Outzide (and any map that needs it) can replace this by passing a `lead` node, such as an in-view rail of full-bleed mini cards.
2. Countdown card (`DrawerCountdownCard`): wide and short. It uses the Placez / hologram countdown style (accent label, event name, tabular days / hrs / min) and lists only the names of the next three events, each with its countdown. The next event's flyer is the full-bleed background.
3. Tag filters (`DrawerFilterRail`): the shared filter config in `shared/drawerFilters.ts`, drawn in the Placez filter style on a two-row horizontal rail that scrolls sideways.

There is no section title. A dark gradient fades down from the top of the block. A divider line sits under the filters, before the next titled section.

## Related pieces

- `DrawerMiniCard` is the full-bleed mini event card for events inside the Placez drawer rails. Share is top-right and the heart is bottom-right, same as other small cards.
- In View on the Placez map still uses the standard small event and place cards, mixed, for everything currently on the map.
- Hearts mean interested: save to the stack plus notifications. Every swipe has a button alternative.

Outzide and Afterz variants should land on top of this component rather than copying it.
