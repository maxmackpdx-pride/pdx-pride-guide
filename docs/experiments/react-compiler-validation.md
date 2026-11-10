# React 19 Compiler: scoped-card evidence and release gates

> **2026-11-09 release follow-through update:** [CI #42740632327](https://github.com/maxmackpdx-pride/pdx-pride-guide/actions/runs/42740632327) and [independent QA #42740632631](https://github.com/maxmackpdx-pride/pdx-pride-guide/actions/runs/42740632631) passed at `cde93d3`. That CI included the real Eventz route, all four page trees, Chromium/WebKit card and motion checks, bundle and Mapz/platform tests, and four order-balanced production-optimized page-tree comparisons. These were **synthetic read-only API** tests with React 19 profiling instrumentation, not live Railway or physical Safari benchmarks.
>
> Production-optimized whole-page means (Profiler actualDuration sum for opening and closing one real card, four pairs): Eventz **32.875 ms off / 19.85 ms infer** (39.6% lower), Boardz **18.90 / 15.15 ms** (19.8% lower), Resources **23.65 / 24.875 ms** (5.2% higher), Placez directory **22.85 / 23.05 ms** (0.9% higher). The Eventz improvement repeated in all four trials. Boardz showed one slower trial; Resources/Placez were mixed. Fingerprints and card counts matched. Numbers include Profiler overhead and do not establish a live-user speedup.
>
> **Next candidate is narrower and unverified:** In commits following `cde93d3`, the Compiler allowlist was reduced to the Eventz and Boardz card components/faces. Placez, Resources/Needz, shared CardAPI, Mapz, modal/auth/consent layers remain uncompiled. Existing comparisons still test Placez as an excluded control; the exact new allowlist must pass fresh CI and measurements before any release assessment. **Do not reuse the results above as fresh evidence for the narrowed configuration.** PR #69 remains draft and unmerged until new checks, independent review, and privacy/API signoff. User requested waiving a physical iPhone test, but CI WebKit is not equivalent to a physical-device validation.

---

**Status as of 2026-11-09:** experimental only, PR [#69](https://github.com/maxmackpdx-pride/pdx-pride-guide/pull/69) remains **draft/unmerged**. No Railway deployment of the Compiler was requested or started. This is a dated, verifiable snapshot, not a permanent green-light.

**Candidate commit tested:** `32d981e9c3f65eed70d73250e56ef201f11e3cad`.
- [React Compiler validation #42661011532](https://github.com/maxmackpdx-pride/pdx-pride-guide/actions/runs/42661011532): **passed**.
- [Independent Typecheck and CSS audit #42661011409](https://github.com/maxmackpdx-pride/pdx-pride-guide/actions/runs/42661011409): **passed**, including glass rebind, unit, typecheck, and card continuity jobs.
- The branch was 0 commits behind `master` when checked at this commit. All performance results below were extracted from the successful validation job logs, not estimated from screenshots.

## Compiler configuration and boundaries

The actual experimental `vite.config.ts` uses Vite 8 `@vitejs/plugin-react` and `@rolldown/plugin-babel` with `reactCompilerPreset({compilationMode:"infer"})`, **only for the exact card-face allowlist** defined in `script/react-compiler-card-scope.mjs`. Its app-config transformation smoke check passed on this commit, including negative assertions for shared `ZaylistCard`, Needz/Outz, CardAPI/layout, pages, auth context, modal controller, and experimental parent fixture.

The in-scope modules in the verified transform log were `EventCard.tsx`, `BoardCard.tsx`, `PlaceCard.tsx`, `PlaceDiscoveryCard.tsx`, `EventRailCard.tsx`, `EventFlyerArt.tsx`, `TonightEventCard.tsx`, `BoardBrowseCard.tsx`, `PunkBoardCard.jsx`, `ZineCard.jsx`, and `TodayLocationCard.tsx`. Changes to this exact list invalidate the performance snapshot and require a fresh audit. This scope verification cannot, by itself, certify every runtime consent/privacy path.

This candidate is **not** the older annotation-only configuration, which did not demonstrate a meaningful consistent benefit in earlier actual-card comparisons. Broad infer is diagnostic only and is **not approved** for application-wide compilation.

## Reproducible browser measurements

**Harness:** Chromium 136.0.7103.25; 6 existing Eventz, Boardz and Placez card faces per family; 5 matched parent updates per trial; 4 order-balanced trials per configuration; React Profiler `actualDuration` summed over callbacks. Both tests assert identical content/card fingerprints and compare screenshots after fonts and images load. Screenshots are tested against a tolerance, not certified pixel-identical.

### Production-optimized isolated fixture

The new `script/react-production-like-card-profile-browser.test.mjs` uses Vite production optimization and `react-dom/profiling` for the real existing card faces. It is **not a deployed app-route experiment**.

| Family | Compiler off mean (ms) | Exact card-infer mean (ms) | Relative mean difference | Trial pairs (off / card-infer, ms) |
| --- | ---: | ---: | ---: | --- |
| Eventz | 7.88 | 3.00 | 61.9% lower | 6.2/2.1, 7.9/5.3, 10.4/2.5, 7.0/2.1 |
| Boardz | 15.50 | 11.30 | 27.1% lower | 15.7/14.4, 14.8/6.4, 16.9/10.2, 14.6/14.2 |
| Placez | 12.08 | 11.05 | 8.5% lower | 16.5/15.3, 10.6/8.5, 12.1/13.1, 9.1/7.3 |

The Placez improvement is small and **not consistent in every trial**. Boardz also varies substantially across trials. These measurements include profiling overhead. All Eventz and Placez screenshot comparisons were pixel-identical in this fixture; Boardz changed 162–186 of 166,440 pixels per round (0.097–0.112%), within the test's threshold. Text/card fingerprints matched in all four rounds.

### Development-server isolated fixture, same real card faces

`script/react-production-card-compiler-comparison.test.mjs` reports:
- Eventz: 29.40 ms off versus 11.07 ms card-only infer, 62.3% lower.
- Boardz: 108.82 ms off versus 51.95 ms card-only infer, 52.3% lower.
- Placez: 52.77 ms off versus 49.75 ms card-only infer, 5.7% lower.

The four balanced trials also include annotation and broad infer for diagnosis. **Do not mistake broad infer's larger diagnostic improvement for an approved safe application configuration.** The dev-server values are not expected to match optimized profiling builds.

## Passed candidate-head gates (CI #42661011532)

- Frozen `npm ci --include=dev`, syntax checks, actual Compiler transformations, and exact app allowlist/exclusion checks.
- `npm run typecheck`, `npm run test:mapz`, `npm run test:platform`.
- `npm run build` with the pinned release lock and `npm run verify:deploy`.
- Baseline production-card profiling, matched Compiler-off/on real card fixture comparisons, optimized profiling fixture, and experimental card comparison.
- Browser card expansion and motion tests, including normal/reduced motion.
- Real card-route browser regression with Compiler **off** and with exact card-only infer **on**. Placez responsive checks passed at 320, 390 and 430 px for browse and grid layouts.

These checks validate the tested code and CI environments only. They do **not** establish that the candidate has shipped or that the production app has identical end-to-end behavior across physical devices.

## Adoption and release gates still open

1. **Representative real application routes:** compare production-like Eventz, Boardz and Placez pages with Compiler off and card-only infer, including interactive search, selection, expansion, navigation, route data, and relevant input responsiveness on a controlled device. The current isolated fixture is not a whole-page performance proof. Record trial ordering, browser/device, raw traces, CPU/network settings and methodology.
2. **Physical iPhone/Safari touch review:** camera and selection retention, card touch/scroll behavior, reduced motion, keyboard/focus, and Mapz mode switching. CI Chromium cannot substitute for this.
3. **Privacy/adult consent and release review:** confirm end-to-end gating and data contract behavior on representative environments; assess the risks and benefits of the small Placez gain and variable Boardz gain. Explicit independent approval through existing GitHub review process is still required.
4. **Fresh candidate CI after any change:** all checks, visuals, exact transforms, optimized measurements, build, bundle and card/motion regressions. Validate no drift with `master`, PR [#70](https://github.com/maxmackpdx-pride/pdx-pride-guide/pull/70), and any new pinned Maps release.
5. **Only after approval and gates pass:** merge through GitHub, allow the existing Railway pipeline to deploy once, verify deployed commit, `/api/health`, assets, app-route interactions and regressions, then close out. Do not trigger a duplicate deployment or silently reinterpret a successful Railway build as device verification.

**Decision at this snapshot: HOLD merge.** There is meaningful isolated evidence for Eventz and Boardz, weaker evidence for Placez, and incomplete whole-page/physical-device release evidence. CI green is necessary but not sufficient.

## Historical context

- Earlier annotation-only and broad-infer experiments are preserved in PR #69's commit history and CI logs.
- Browser QA updates and the 390 px Placez overlap fix were reconciled into this experimental branch. Independent [PR #70](https://github.com/maxmackpdx-pride/pdx-pride-guide/pull/70) remains draft.
- The experimental `React19CardBoundaries` prototype remains outside actual production imports; its untested future integration is **not part of this adoption decision**.
