# Release 1 baseline and regression protection

Status: baseline recorded for the available environments; physical Safari/GPU and complete external-resource timing remain unverified. Application baseline is commit `90a88238a3d1b775bcf144641f66171d21f3a828`. Evidence captured November 2, 2026 UTC. This document distinguishes live observations, local production-build measurements, and test fixtures. None establishes physical iPhone Safari performance.

## Starting production state

- GitHub master and live `/api/health` both identify `90a88238`.
- Live deployment: `3491a5ea-7427-4076-a425-b385cde75953`.
- Existing exact-commit CI [41359739219](https://github.com/maxmackpdx-pride/pdx-pride-guide/actions/runs/41359739219) and deploy verification [41359739220](https://github.com/maxmackpdx-pride/pdx-pride-guide/actions/runs/41359739220) succeeded.
- Previously reported fix `67595277` is already an ancestor, not outstanding work. Master is 17 commits ahead of it.
- Fresh execution results below are separate from these historic CI results.

## Repeatable comparison rules

Record the application commit, dependency lockfile, Node/browser versions, viewport, device scale, network conditions, dataset provenance, cache state, and sample window. Compare matched conditions only. Use three sequential cold contexts and warm reloads per route; do not publish a p95 from three observations. Do not run heavy build/test workloads during timing samples.

Engineering gates for subsequent releases:

- All affected correctness, sizing, anchor/reflow, scrolling, auth, and recovery checks must pass without weakening assertions.
- No new uncaught application errors or newly broken first-party image URLs relative to the matched baseline.
- For otherwise unchanged routes, investigate a repeatable median navigation or synthetic-scroll frame-time regression above 15%, or transferred-byte increase above 5%. Repeat the matched run to distinguish environmental variation before judging the release.
- Optimization releases must demonstrate a measurable improvement in their targeted metric; security/runtime releases need not claim a speed gain.
- Live proxy-conditioned request times are diagnostics, not application CPU benchmarks. Do not impose local-loopback thresholds on live requests.
- Physical-device Safari/GPU support remains an explicit unresolved product gate before the replacement map architecture is selected. Software-rendered or no-WebGL tests are not a substitute.

## Live API evidence

Three sequential anonymous GETs per endpoint, certificate verification enabled, compression negotiation enabled, separate curl processes. All returned HTTP 200. No cache purge or cache-busting; these are not origin cold/warm samples. Requests use the cloud environment's network proxy.

| Endpoint | Median total | Median TTFB after pretransfer |
| --- | ---: | ---: |
| `/api/health` | 3.454 s | 134 ms |
| `/api/events` | 2.810 s | 188 ms |
| `/api/events?limit=1` | 2.960 s | 213 ms |

TLS/proxy setup dominates the total. The post-pretransfer interval still includes network, edge, proxy and server time, not pure application execution.

Both event variants returned **1,406 records / 1,707,590 decoded bytes**, about **209 KB gzip transfer**. The limit is ineffective. Delivered responses already include gzip, weak ETags, `Vary: accept-encoding`, and `CF-Cache-Status: DYNAMIC`. One conditional request returned HTTP 304 with zero response body. This proves transfer validation, not computation caching. Direct-origin compression was not measured.

Machine-readable timing evidence: [HTTP samples](baselines/2026-11-02/http-baseline-summary.json).

## Source and build sizes

Fresh source measurements, not browser downloads:

- `client/public`: 1,291,131,995 bytes across 4,400 files.
- OutZide photos: 849,355,519 bytes across 1,380 files; 251 exceed 1 MiB.
- Brand sources: 55,993,421 bytes. Originals remain protected.

Fresh local build entry files:

| Asset | Raw | Brotli | Gzip |
| --- | ---: | ---: | ---: |
| Entry JavaScript | 1,874,029 B | 514,862 B | 550,359 B |
| Entry CSS | 700,192 B | 113,146 B | 125,539 B |

These are entry files only, not entire route transfers. See [source sizes](baselines/2026-11-02/source-asset-sizes.json) and [entry files](baselines/2026-11-02/entry-bundles.json).

## Asset safety findings

Audit/archive naming does not mean unused. Every file in `event-posters/audit-2026-09-28` has a runtime reference in the poster audit mapping; live Eventz references 23 of them, including the large `steam-events-3.png` candidate. Preserve these sources and use derivatives where appropriate. OutZide already has responsive variants for all 143 photo-bearing destinations; sizing hints and consumers need inspection before generating replacements.

## Local verification

Fresh checks on Node 20.20.2 and the locked dependencies:

| Check | Result |
| --- | --- |
| Focused shared-card, size, image-planner, startup and recovery checks | 40/40 pass |
| Map render/startup/bridge/nightlife checks | 61/61 pass |
| OutZide iframe lifecycle source guards | 2/2 pass |
| Mapz and OutZide host browser recovery/fallback checks | 6/6 pass |
| Existing CI unit command | 67/67 pass |
| Glass parser / audit | 4/4 pass; 0 violations across 837 files |
| Typecheck / production build / deploy-bundle verification | pass |
| Full four-suite card browser command | 4/4 pass, 609.95 seconds |
| Additional map lifetime collection | 14 pass; 3 WebKit launch failures due to missing host libraries |

The card suite covers 21 category/layout combinations, all three anchors, inline reflow without overlap, dismissal/reopening, real route components, 320/390/430 widths, 844x390 rotation, long names and multiple phone locations, last-card behavior, native touch scrolling, bottom overscroll containment, and immediate close geometry. Small faces remain 136x170; shared hearts have 40x40 controls, 18-pixel glyphs, 6-pixel insets and centered glyph geometry. No Placez radar reappeared. The 390-pixel open-card screenshot was visually inspected in addition to assertions.

Fixtures use mocked local API data where the test says so. These browser tests establish component behavior, not physical-device performance. One test harness was made platform-portable: OutZide recovery honors CHROME_PATH, uses installed Mac Chrome where available, and otherwise uses the Playwright Chromium binary. Assertions were unchanged.

Predeploy checks also passed using the ignored local runtime database. No tracked seed database was modified.

## Local mobile load measurements

Node 20.20.2, Playwright 1.52.0, Chromium 136.0.7103.25, Linux, 390x844 mobile emulation, device scale 1, touch enabled, unthrottled loopback, anonymous local production build, local seed copy. Three independent cold contexts plus same-context warm reloads per route, service workers blocked, five-second observation window. These are laboratory measurements, not physical-phone or production-network timings.

| Route | Cold median DCL | Cold median top-frame resource bytes | Warm median top-frame resource bytes |
| --- | ---: | ---: | ---: |
| Home | 239.7 ms | 14,504,221 B | 10,240 B |
| Eventz | 240.4 ms | 5,005,278 B | 32,928 B |
| Placez | 232.3 ms | 14,139,201 B | 11,894,885 B |
| OutZide host | 226.4 ms | 1,323,317 B | 1,540 B |
| Boardz | 223.3 ms | 8,110,533 B | 6,940 B |

All 30 retained navigation observations returned 200 with no uncaught page JavaScript errors. This does not prove all assets loaded. External Foundation CDN, tiles and several image hosts failed in this environment. Resource totals exclude the navigation document, iframe resources and opaque/unavailable cross-origin byte information; they are **not total page downloads**. Directory was rerun with a 10,000-entry timing buffer after its warm samples hit the default 250-entry cap; the table uses that corrected run (260 warm resources).

[Machine-readable load summary](baselines/2026-11-02/mobile-summary.json) and [local check results](baselines/2026-11-02/local-check-results.json).

Original synthetic-scroll intervals mixed the initial timestamp with rAF timestamps and are invalid. They were not used to compute FPS or acceptance thresholds. The corrected harness establishes its clock from the first rAF, cancels a pending rAF on timeout, collects HTTP error statuses and completed-but-broken image indicators, and was separately smoke-tested. Most software-renderer scroll probes time out; zero-displacement OutZide frame probes are not scrolling measurements. Actual internal-scroll behavior is separately proven by the card interaction tests.

No map-ready event was observed within the five-second map observation window; external tile requests failed. This remains a **missing rendered-map startup baseline**, not a map performance pass. It is carried forward as a device/network verification gate before map architecture changes. The runtime/API releases must preserve existing map behavior and repeat the supported regression tests, without claiming those missing measurements are available.

## Reproduction

Use the pinned application commit and its Node 20 engine, install from the lockfile, build, prepare the ignored local database, and start the production server with DATABASE_PATH=.local/data.db, LOCAL_PREVIEW=1 and PORT=5050. Run `node script/measure-mobile-baseline.mjs` in an execution context that can reach that server. Output defaults to ignored `.local/performance`; BASELINE_ROUTES, BASELINE_SAMPLES, BASELINE_OUTPUT and BASELINE_COMMIT override the documented defaults. Collector exit zero is not a correctness/performance pass: inspect sample errors, HTTP errors, resource limitations and readiness observations.

The reproduction harness was independently reviewed, including correction of its rAF clock and HTTP-error capture. The documented 15% timing/5% bytes gates apply only to matched, valid samples; there is no valid smooth-scrolling or rendered-map timing threshold yet.

## Environment limits

Managed cloud Chromium cannot create WebGL contexts. Its map fallback screenshots demonstrate the unavailable-graphics path, not map-render success. Direct Playwright navigation to production could not establish trusted TLS in this environment; no certificate bypass was attempted. WebKit could not launch due to missing host native libraries. These limitations must remain visible in completion and future comparison reports.
