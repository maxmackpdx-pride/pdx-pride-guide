# React 19 production audit: baseline and verification plan

Status: **source inspection started, profiling/build validation pending**. Date: 2026-11-08.
Production source: `maxmackpdx-pride/pdx-pride-guide`, `master`, Railway service `pdx-pride-guide`.
Do not confuse the separate `zaylist-waypoint-demo` with the production site.

## Verified source findings
- `package.json` declares React and React DOM 19.3.1.
- `client/src/components/cards/react19Card.tsx` already uses React `Activity`, `ViewTransition`, `use`, and `Suspense`.
- `client/src/components/cards/react19CardModel.ts` uses `startTransition`, `addTransitionType`, `preinit`, `preinitModule`, `preload`, and `preloadModule`.
- `client/src/components/cards/CardAPI.tsx` implements shared card shells and expansion/origin behavior.
- `client/src/components/PlaceModal.tsx` and `EventModal.tsx` use the existing React card primitives and TanStack Query.
- `client/src/pages/Directory.tsx` uses `useMemo`; avoid declaring all cards unoptimized without profiling.
- `client/src/pages/UnifiedMap.tsx` uses lazy-loaded modals, Suspense and a pinned native ESM Maps mount.
- `shared/mapReleaseLock.json` pins Maps v1.0.10, source commit `516a41b37782aaa17b6c8774216c2105f4dc5c63`, with checksum. This is source evidence, not deployment verification.
- `package.json` exposes `npm run typecheck`, `npm run test:mapz`, `npm run test:platform`, `npm run ship`, and `npm run verify:deploy`.

## Profiling targets and acceptance evidence
1. **Placez directory**: React DevTools Profiler commits, filter input latency, visible-card render count, image decode and network waterfall, open/close behavior.
2. **Eventz and Placez details**: card-open transition latency, layout shifts, modal mount/unmount, request duplication, keyboard and reduced-motion paths.
3. **Boardz**: board-item render counts on scroll/filter, DOM node count, layout/paint costs, touch interactions.
4. **Needz**: ZIP search latency, request cancellation, expanded Food section, accessibility and error recovery.
5. **Mapz**: pinned asset startup and cleanup, camera retention, selection continuity, physical iPhone gestures, memory, and all five modes. No behavior changes authorized by this audit.

Collect baseline measurements on the same device/network/build before any optimization. Only implement a change when a measured regression or demonstrable redundancy exists.

## Validation gate
- Run `npm ci`, `npm run typecheck`, `npm run test:mapz`, `npm run test:platform`, `npm run build`, and `npm run verify:deploy` in an isolated checkout with the supported Node version.
- Verify the exact deployed Railway commit, health endpoint, and pinned Mapz assets.
- Run desktop and physical iPhone smoke tests, including reduced motion, keyboard navigation, maps and card expansion.
- Record pass/fail, timings, environment, and logs. Do not claim these checks passed before execution.

## Explicit preservation requirements
All cards are already React components. Do not rebuild or visually redesign them as part of performance auditing. Preserve Mapz frontend and backend behavior, card visuals, consent gating, map state, API contracts and deployed release assets. No deployment or production runtime changes from this document.
