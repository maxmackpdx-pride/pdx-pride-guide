# Zaylist mobile control choreography QA

**Source visual truth**

- Mobile reference: `/workspace/scratch/6ddcb6866a27/upload/Untitled - September 15, 2026 at 00.37.05.png`.
- Target state: fixed top navigation, lower-left map controls, circular Z at bottom-left, and compact Search Zaylist bar aligned beside it.

**Implementation inspection**

- The drawer publishes `open` or `compact` on the document root.
- Compact drawer plus collapsed dock places map controls 76px above the safe-area bottom, clearing the Z and search row.
- Compact drawer plus expanded dock places map controls 166px above the safe-area bottom, clearing the lifted search and full dock.
- Opening the drawer returns map controls to the upper-left rail while the right drawer retains a 12px horizontal gap.
- All choreography rules are mobile-only. Desktop positioning is unchanged.
- Reduced-motion users receive the final positions without the transition.

**Verification**

- TypeScript check passed.
- Production client and server build passed with `node --import tsx script/build.ts`.
- Platform tests passed, 3 of 3.
- Full predeploy smoke is blocked in this container because the installed `better-sqlite3` native binding does not support the available Node 24 runtime.

**Browser comparison**

- The reference image was opened and inspected at full resolution.
- The cloud browser rejected the local preview URL with `ERR_BLOCKED_BY_CLIENT`, so a same-viewport implementation capture and click-through of all three coordinated states could not be completed here.

final result: blocked
