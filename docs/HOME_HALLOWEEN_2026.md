# Homepage panel 1: Halloween 2026

The October 10 live baseline is commit `1c837c7ebced32059149ed947d82efe2616796da`.
The existing Portland map texture, camera, radius, hover behavior, hologram rotation,
logo deduplication, layout and other homepage panels remain the nonseasonal path.

From October 10 through October 31, panel 1 uses a white-dot pumpkin with two
identical carvings exactly 180 degrees apart. Ten distinct Halloween symbol anchors
join the existing hologram rotation in purple, orange and green. The recovered
Pink Ponies vine texture grows around the globe, with leaf overhang and gentle
breeze. Actual opaque vine pixels open the shared event modal for event 1571;
transparent pixels and scrolling gestures do not open it. A keyboard button
provides the same action. Reduced motion renders fully grown, stationary vines.

At `2026-11-01T00:00:00-07:00`, the seasonal renderer disables itself. The homepage
checks the date every 30 seconds and on focus/visibility changes, including already
open pages. No deployment or scheduled server mutation is needed for the return.
The fallback is the preserved renderer, not the earlier unpublished vine draft.
