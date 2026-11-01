# Profile production integration — current release audit

Updated 2026-11-01. Overall completion remains **pending P8**. No further approval is needed under Tucker's explicit P0–P8 execution/push/deploy authorization.

## Release state

- Product candidate: `0c40646c474f12b063895305ce721c5e0fd3786c`, confirmed on GitHub `master`. Includes concurrent Mapz work through `41e2b6dc`; unrelated original checkout work preserved.
- Railway deployment: `0e9df83b-f42b-420e-85cd-340e15ff1f25`, **BUILDING**, not yet accepted as live.
- Product GitHub deployment verification: run `41293721629`, queued behind previous runs. Final typecheck and glass audit pass; unit job has the two baseline Mapz failures described below.
- Foundation candidate: isolated `profile-wall-foundation` worktree, baseline `75970a1bec0d545b82820aac07761596ff9431ee`. Release `zaylist-foundation-design-system-2026-11-01.1`. Not committed/pushed/deployed yet; awaiting exact live product package and verified revision.

## P0–P8 checklist

- [x] P0 — Isolated worktrees, owner rules/design sources, baselines and preservation of unrelated work.
- [x] P1 — Authorized profile projection; public/friends/anonymous/blocked/private-event boundaries; historical RSVP versus host archive provenance; archived BoardZ filters. No fabricated production participation.
- [x] P2 — 18 widgets plus 6 shared renderers registered as 24 contracts, 52 variants. Exact native BoardZ and shared Outz wide source. Typed ESM package, source/asset hashes and runtime constraints.
- [x] P3 — Additive user-ID layout table, strict schema, owner-only/no-store routes, atomic revisions/409, forward-schema preservation. Removed saved sources can be discarded without admitting new unauthorized references; username change retains layout.
- [x] P4 — Real profile shell/actions, canonical readers, in-place BoardZ expansion/reflow, chronological trail, URL/history behavior. Original profile renderer retained behind the build-time rollout flag.
- [x] P5 — Save/Cancel, drawer, native variants, independent desktop/mobile positions, Undo/Redo, keyboard movement, draft recovery and conflict handling.
- [x] P6 — Viewer-specific profile query keys and domain invalidation; native RSVP and Hub mutation paths reused. Layout/palette changes do not create notifications or mutate read state.
- [x] P7 — Animated ribbon geometry, portrait/contact phase continuity, palettes, fixed hardware and scroll-only paper sway; Calm/offscreen/hidden lifecycle handling.
- [ ] P8 — Final Railway SUCCESS/health/profile capture; exact live package and source parity; Foundation commit, Cloudflare success, direct/embedded guide and object API parity.

## Actual verification

- **Final exact-revision Railway build passed** for `0c40646c` (client, service worker, portable package and server); container assembly is in progress. Live package reports 376 artifacts / 8,526,582 bytes; exact live copy will replace the local-platform package.

- Product full build and deploy-bundle checks passed for the corrected native/pin implementation: `/private/tmp/profile-pin-final-build.log`, `/private/tmp/profile-pin-bundle.log`. Final additional CSS hidden-front correction passed the package's CSS/JS build and browser inspection. Rebase over Mapz rehashed every package source/asset: zero changed inputs.
- Final portable verification: 24 objects, 52 variants, 376 checksummed artifacts, approximately 8.53MB; `/private/tmp/profile-final-portable.log`. Generated declarations compile in an independent typed consumer. Browser host reload renders from the package outside the product application. Native API adapters still require authorized same-origin APIs/assets; no universal standalone claim.
- Final typecheck passes: `/private/tmp/profile-release-types.log`; final GitHub typecheck and glass audit also pass.
- Focused privacy/layout/reflow/domain/notification regressions: **16 pass**, `/private/tmp/profile-release-tests.log`.
- Actual HTTP owner layout/concurrency/source-removal/username tests: **2 pass**, `/private/tmp/profile-source-removal-tests.log`.
- Unchanged complete predeploy guard passed: `/private/tmp/profile-final-predeploy.log`, including registry, admin operations and QSearch safety guards on disposable data.
- Foundation non-browser suite: **226 pass**, `/private/tmp/profile-foundation-final-tests.log`. Build passes, and guide comprehension **100/100**, `/private/tmp/profile-foundation-pinned-build.log`, `/private/tmp/profile-foundation-pinned-benchmark.log`. Browser checks use CUA; no local Playwright browser collector was run.

## Browser evidence

Evidence directory: `docs/profile-wall/captures/`.

- `specimen-matrix.json`: all **52** variants rendered without unsupported component/error fallback.
- `portable-independent-host.png`: freshly reloaded independent package host. Typed consumer is `.local/portable-smoke.tsx` (disposable, not production).
- `desktop-native-boardz.png`, `mobile-native-boardz.png`: actual native open reader, not header-only captures. Desktop inline article/dialog both560px; true390px mobile frame has342px open reader. Mobile neighbor y4250→5798→4250 on open/close; source focus restored. Native owner actions are present.
- Owner Save/Cancel/Undo/Redo/reload tested using local disposable account only. Revision2 persists mobile About x10 independently of desktop x20. Visitor controls stay absent. Touch long-press is implemented; no physical-device test claim.
- `detail-links.json`: event/place/Outz direct load, refresh, close and Back, plus poster reverse/native event action. Fresh-document history restores profile without recovery errors. A stale Vite document after source changes was discarded before repeating checks.
- `hosting-browser.png`: actual41 archived hosted events; balanced uncropped grid. Preview arrows page3/compact1; Stash native collection browsing and swipe wiring retained.
- `pinned-paper-collage.png`: corrected pin wrapper. Native needle lies inside paper on desktop/mobile. Paper angle remains exactly -1.10558deg across idle samples; pin rotation remains empty; hidden Hosting preview pins do not sway.
- `portrait-light-phase-a.png` / `b.png`: time-varying geometry and exact portrait/first-edge color phase. Calm browser samples freeze all ribbon paths; Neon restored. Reduced-motion listener inspected in source.
- `desktop-full-profile.png`: corrected sparse-default compaction and pin attachment. Saved/manual arrangements remain untouched. **Final current-live screenshot still pending deployment**; do not use an old header/full capture as live evidence.

Independent coordinator image review: **PASS** for the four corrected profile/pin/native desktop/native mobile images. No material static visual blocker; this review did not independently exercise motion or interactions.

## Known baseline CI failures

Two `script/mapz-nightlife.test.mjs` harness failures already occur in pre-profile `fefb7353` GitHub run `41291616447` and remain in final run `41293721648`:

1. Old `drawWaypointHead` source-regex assertion after the shared waypoint renderer change.
2. VM harness cannot evaluate `import.meta` outside a module.

Final typecheck and glass audit pass. The Mapz implementation/test ownership was not expanded into this profile task. Logs: `/private/tmp/profile-baseline-ci.log`, `/private/tmp/profile-final-ci.log`.

## Deployment wait investigation

Railway completed the full build and entered image export at 09:51:09 UTC. It still reports BUILDING without a failure. Read-only Git inspection: baseline tracked source 1,367,987,963 bytes; current 1,369,483,764 bytes; net increase 1,495,801 bytes (1,321,929 bytes are intended proof captures). No `.local`, `node_modules`, `dist` or nested worktree content is tracked. Available deployment metadata does not expose image size or a live export progress counter. This establishes no accidental build-context growth, but does not independently prove export progress. Running deployment preserved. Export then progressed at 10:00:20 UTC and produced image digest `sha256:ad1587322173fea6c7524a32f8e98dfa128da89f50e6945df36d5f3dadf6ae5d`; this was slow export, not a confirmed stuck build.

## Remaining release work

Wait for Railway SUCCESS on the final revision, verify health SHA and the real live profile/native opening, save a current live screenshot, copy and verify all actual live package artifacts into Foundation, pin all24 object contracts to that product revision, regenerate/build/check Foundation, push `main`, wait for Cloudflare deployment success, then verify direct/embedded guide release and every object API contract/package hash. Only then mark P8/overall complete.

## Current live/demo comparison follow-up

Product `0c40646c474f12b063895305ce721c5e0fd3786c` reached Railway **SUCCESS** at 10:05:29 UTC (deployment `0e9df83b-f42b-420e-85cd-340e15ff1f25`); public health matched exactly. All376 live portable files/8,526,582 bytes were SHA-verified and copied to Foundation. Foundation build,226 tests and100/100 benchmark passed, but publication is held for the following material visual corrections.

The actual live public profile exposed About/Top8 overlap and a stale gap before Updates with real content heights. Local correction now measures desktop/mobile independently, uses actual object footprints, compacts only unsaved defaults, and preserves saved owner arrangements. Seven focused layout tests and typecheck pass. The outer portrait frame is restored to the approved rectangular tilted TV housing with a curved inner screen and shared light phase.

Paired review sources:
- Approved desktop: `/Users/tuckercasey/Documents/Zaylist/prototypes/tucker-wall/captures/final-desktop/tile-01.png` and `profile-stitched.png`.
- Approved mobile pocket: `/private/tmp/tucker-pocket-mobile.jpg`.
- Current live before correction: `captures/live-profile-desktop.png` (capture has extra padded canvas; do not treat as final proof).
- Corrected local native profile, using actual anonymous live profile data: `captures/measured-public-profile-local.png`, `captures/measured-public-profile-mobile.png`. The mobile capture is391px wide with uneven widths/angles, Stash beside About, native Top8, and no horizontal overflow. These are explicitly local previews, not live proof.

Actual public content differs legitimately from the prototype: no public upcoming RSVP or native BoardZ trail post is projected for Tucker, and private favorites/trips are not exposed to visitors. No example attendance/check-in was fabricated. Native application header/actions remain intact as required by the integration plan.

Remaining: finish targeted browser checks, push the visual correction, await its Railway SUCCESS, capture the actual live desktop/mobile result, refresh exact live package and verified revision in Foundation, then publish/verify Foundation direct/embedded guide and all24 contracts/52 variants.

### Fidelity candidate pushed

`e4161b7fb5dce2ef9cf172437184aeb8c673369f` preserves concurrent Mapz `209da85f81289121552c44067667b19778a5b4cd`. Exact rebased full build passed (`/private/tmp/profile-fidelity-final-build.log`), including portable24/52 package. Native desktop reader rechecked: origin y1700 unchanged; neighboring paper1900→3220→1900, focus returns to the original Open control. Native mobile reader is342px inside the390px frame and opens inline at its existing y4000. Product is on GitHub; awaiting Railway SUCCESS and final actual-live captures.

### Production verified; final browser connection interrupted

Railway `a242a436-365b-429d-bce3-669e8243af70` reached **SUCCESS** at10:33:39 UTC for `e4161b7fb5dce2ef9cf172437184aeb8c673369f`; public health confirmed the exact revision. The live package has376 artifacts/8,528,876 bytes, all downloaded and hash-verified; dependency digest `30fc1a069e8745ecf0c21f3e245f8e291bd89b94b9b4c196565314aa5131e43f`. Foundation now contains those exact bytes and24 verified contracts, and its final build/100-of-100 benchmark passed.

Final CI41297330969: typecheck and glass audit pass; the same two existing Mapz harness failures remain (`/private/tmp/profile-fidelity-ci.log`).

Actual-live pre-correction baselines are `captures/before-live-profile-top.png` and `captures/before-live-profile-mobile.png`. Chrome reached actual CSS390px with no horizontal overflow before deployment; its screenshot was saved. Existing public author `/u/coreykaster` exposes genuine `gigz:17` (DJ in Portland), so it can be used for the final native live reader check without creating any data. After deployment, the Chrome connection stopped responding during reload; reconnect attempts then failed and IAB also timed out. **No post-deployment live screenshot or live reader interaction is claimed yet.** Local native desktop/mobile interaction proofs and corrected real-data mobile preview remain valid. Final browser checks/direct+embedded guide are pending reconnection; publication/API parity work continues.

### Live desktop visual and native reader acceptance recovered

The supported IAB DOM interface works; the native accessibility wrapper was stalling. Chrome CDP separately reports a deadline before command dispatch. IAB is at saved25% zoom: viewport clamps to240 physical pixels, yielding minimum960 CSS pixels; documented viewport controls expose no zoom setter, and supported reset shortcut did not change it. No unsupported control or security workaround was used. User is away from the Mac, so publication is not blocked on that environment limitation.

**Actual deployed desktop evidence** (fresh reload, rectangular frame radius2px):
- `captures/live-profile-top.png` vs approved `/Users/tuckercasey/Documents/Zaylist/prototypes/tucker-wall/captures/final-desktop/tile-01.png`.
- `captures/live-profile-desktop.png` vs approved `/Users/tuckercasey/Documents/Zaylist/prototypes/tucker-wall/captures/final-desktop/profile-stitched.png`.
- Live native reader: `captures/live-native-boardz-open.png`, real public `/u/coreykaster`, `gigz:17`. Native full details render560px wide, inline at unchanged y1064. Close restores all prior coordinates and focus to Open DJ in Portland.

Actual Tucker measurements: About y30/h426, Top8 y504/h762, featured poster y1318/h413, Updates y1783/h391 (52px after poster); overlap and stale gap fixed. Holographic frame, layered Stash, independent paper and native pin connection match the approved material treatment. Native site shell and real content differences remain intentional.

Phone-width local proof: `captures/measured-public-profile-mobile.png` (391px real-public-data native preview), plus native reader verified342px within390px frame. **Final post-deployment live mobile capture remains unresolved**, not claimed as verified.

Foundation `57b6ba89b08ae171d7aad569e4d30e549dc843cc` pushed to main; Cloudflare workflow41298360805 is running.

### Coordinator fidelity correction and external publication block

Coordinator inspected live/demo images and rejected Top8's nested tall cards. The existing ProfileTop8 now has a wall-only portrait presentation: approved compact 4x2 circles with concise two-line names, genuine profile/place targets, and Message behind an accessible details control. Existing legacy card presentation remains. Hologram upper grain now uses the approved fine neutral SVG noise at .022 opacity; the incorrect torn-paper texture causing dark wavy bands is removed. Typecheck/build running; not pushed yet. Browser local reload currently failed during the CDP focus command, so no new visual acceptance is claimed.

Foundation workflow41298360805: Cloudflare deployment step SUCCESS, postdeploy live verification FAILURE. Independent release probe returned HTTP429 Cloudflare **Error1027**. Official Cloudflare documentation identifies this as the account's free-tier daily request quota, resetting00:00UTC. No billing upgrade was authorized or attempted. All376 live Foundation byte checks/direct+embedded live guide remain blocked; do not call Foundation publication verified. Existing product deployment/native reader live evidence remain valid.

Additional untracked filenames ending ` 2` appeared throughout this worktree; they are untouched and will not be staged. Exact intended paths only.

Top8 correction verified locally: desktop grid has four columns and293px height (previously762px); all eight real records retain profile/place actions. Christopher Proudfoot's Message disclosure opens/closes correctly. `captures/top8-compact-local.png` shows the complete compact grid and fine surface without dark bands. Local391px state has no horizontal overflow and uses the existing compact two-column variant. Full build passes. Typecheck passes with a temporary config excluding only unrelated untracked ` 2.ts/tsx` duplicates, which otherwise reference obsolete ProfileActivity exports; no tracked config was altered.
