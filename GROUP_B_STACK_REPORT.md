# Group B / B3 — HouseholdStack

Worktree: `/Users/tuckercasey/pdx-pride-guide-group-b-household-stack`  
Branch: `feat/group-b-household-stack` (from `origin/master` `331b7773`)  
Not pushed.

## What overflowed

The primitive was fine. Forming cards were the bug.

`FormingCard` sat a `HousingCluster` in `HousingWell` (`overflow: hidden`, 240px desktop / 190px mobile) with:

1. `size="sm"` plus `scale={1.5}` (63px avatars)
2. CSS `--hz-av-scale` on `.hz-well .hz-cluster` (`1` desktop, `0.66` mobile via `transform: scale`, which does not shrink layout)
3. `wrap3` rows for members + dashed Open slots + pets
4. `.hz-well__cap { overflow: hidden }` so extra rows clipped

Wrap shrink only fired when `people.length > 3`, so a small forming crew with many Open slots still used full-size avatars. Seeking is capped at 12, so several wrap rows were routine. The name motif and caption fought for the same flex column, and the bottom of the stack (Open slots, pets, `+N`) disappeared.

Managed interest groups used the default wrap. After promotion `wrap3` defaults to true, so that row would wrap and overflow the interest line unless overridden.

## Consumer fix

- Dropped the extra `scale={1.5}` on Forming feed and Forming detail wells (Looking / Offering keep it).
- `hz-well--contain-stack`: caption is absolutely pinned to the photo bottom, cap overflow is visible, and the well CSS scale is disabled so layout size matches paint. The well still `overflow: hidden`, so the stack stays inside the card at 360px and 1440px.
- Wrap shrink now uses total filled slots (people shown, `+N`, pets, Open), not only `people.length`.
- Managed interest row and managed-detail group leads pass `wrap3={false}` so they stay one overlapping line.

Pets stay smaller (`PET_RATIO 0.72`). Open slots stay dashed. `+N` overflow is unchanged.

## Files

| Path | Change |
|------|--------|
| `client/src/components/ds/HouseholdStack.tsx` | Promoted primitive, `wrap3` default true |
| `client/src/components/ds/HouseholdStack.css` | Cluster / pet / Open / `+N` styles |
| `client/src/components/ds/index.ts` | Export `HouseholdStack` |
| `client/src/components/housing/HousingCluster.tsx` | Thin re-export alias |
| `client/src/components/housing/HousingCards.tsx` | DS import; Forming contain + drop scale; Managed `wrap3={false}` |
| `client/src/components/housing/HousingDetail.tsx` | Same for Forming well + group leads |
| `client/src/pages/Housing.css` | Well scale retargeted; contain-stack; primitives moved out |

## tsc

`npx tsc --noEmit --pretty false --incremental false`

- Before: **0** errors
- After: **0** errors
