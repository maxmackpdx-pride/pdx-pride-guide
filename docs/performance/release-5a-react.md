# Release 5a: React compatibility upgrade

**Status: LOCALLY VERIFIED WITH DOCUMENTED PERFORMANCE COST / DEPLOYMENT APPROVED / UNPUBLISHED.** Base: verified Release 4 commit `b15844b13685a3bbc78b2096133836597778529c`.

Upgrade React independently of the build tool. The current intended dependency set is React/react-dom 19.3.1, matching type packages 19.3.0, react-leaflet 5.0.0 and @react-leaflet/core 3.0.0. The resolved graph also uses scheduler 0.28.0 and removes obsolete @types/prop-types. The initial source patch changed package.json and package-lock.json plus 11 compatibility-only source files; the subsequent lifecycle correction is recorded separately below. Nine lock records change, including the root record.

Vite stays on the existing 7.x release for this gate. Do not combine Vite 8, Tailwind, React Compiler enablement, broad component rewrites or map-system replacement with this upgrade. Existing createRoot, automatic JSX, forwardRef and card behavior remain unless a specific compatibility correction requires a narrow change.

The 11 source files change only ref initialization (`T | undefined`), nullable DOM-ref contracts and `React.JSX` namespace references. No design, gesture, card geometry or broad component rewrite is intended. Existing day-picker remains unchanged because its installed version already accepts React 19.

Initial dependency checks passed: npm clean install completed (891 packages), native SQLite and esbuild smoke checks passed, and the resolved React dependency graph passed. Typecheck passed. Focused units passed 24/24 and focused incidental-map, carousel, EventLocationMap and Motion browser tests passed 6/6. The implementation was frozen for independent review at 02:34 UTC. These focused results are not the final aggregate/build/live gate.

## Aggregate attempt and pending correction

The first Release 5a aggregate browser run passed 13/14 tests. The incidental-map WebGL lifecycle test failed with a null-reference `getZoom` error; focused earlier passes did not cover this failure. The cause was an uncancelled resize/transition animation frame in maplibre-gl-leaflet 0.1.4: removing its Leaflet layer cleared `_map` before the queued callback called `getZoom`. A deterministic test reproduced the failure. The narrow fix cancels the instance-owned frame on removal and verifies the current map/engine before callback work; it does not upgrade or replace the renderer. Three consecutive strengthened WebGL tests, four adjacent map browser tests, typecheck and an independent reviewer rerun passed. The full aggregate gate is being repeated against the corrected source.

The corrected aggregate now passes typecheck, 146 CI units plus one intentional skip, 20 shared-card units, all 14 browser tests, glass/predeploy, the full guarded production build and bundle verification. The build used the checked-in design-library snapshot with external traffic denied; it does not verify the remote refresh path. The 6,063-file source inventory shows no drift.

The remaining performance threshold exceedance was investigated and reviewed; it is retained below, not relabeled a timing pass. Seventy-two valid interleaved Release 4/5a replay samples returned 200 with no JavaScript errors or missing assets. The previously flagged same-context reload timings resolved below 15% in the paired comparison. Directory cold DOMContentLoaded remains **18.10% higher, an absolute 13.7 ms** (75.7 to 89.4 ms). Independent review concluded the required investigation and repeat measurements were completed and found no functional blocker. The release owner accepts this documented modest compatibility cost within the authorized React upgrade, without claiming every timing threshold passed. Compared route-transfer growth was 0.17–1.35%, below 5%. Entry JavaScript Brotli increased **21,975 bytes / 9.43%** (233,148 to 255,123); there is one React runtime, not duplicate React 18/19, and the JavaScript chunk count remains 193. CSS is unchanged. This upgrade is not claimed to make the app smaller or faster.

Built-app smoke checks passed four same-document client navigations with zero page errors. The service worker activated and cached only icons/manifest, not HTML/JavaScript. This is not physical-device installation, push-notification or operating-system verification.

Fresh proof is recorded in [verification results](releases/release-5a/verification-results.json), [bundle comparison](releases/release-5a/bundle-comparison.json), [offline route diagnostics](releases/release-5a/mobile-comparison.json), [interleaved timing investigation](releases/release-5a/interleaved-summary.json) and [built-app smoke checks](releases/release-5a/built-app-smoke.json). The source inventory contains 6,063 files, with digest `1dbc0626e261f77dd5117ae42378ed757e298fb0ea080ba91e10625174e84308` and zero final drift. The original root database remains unchanged. The first failed lifecycle aggregate and invalid replay pilot are excluded from final proof, not relabeled passing.

No React 19 deployment has occurred. The user explicitly approved deployment of the tested React upgrade and narrow Carto/React lifecycle correction on November 3 at 03:27:08 UTC. Publication and deployment verification remain pending.

## Verification gate

Functional/build verification and the required performance investigation are complete. Release acceptance includes the explicit residual Directory cold timing exceedance and React 19 bundle cost; it is not a blanket timing pass, speed gain or no-regression claim. Deployment approval has been obtained; final source/dependency evidence and built-app checks are recorded above. Exercise the ref-consuming UI paths and actual built lazy routes, including repeated open/close and keyboard behavior. Preserve the existing browser support target and disclose physical Safari/device limitations.

The interleaved comparison uses production Release 4 static build artifacts versus the local Release 5a build, replayed through identical loopback servers and APIs. It is not a same-build provenance comparison or live production latency measurement. External traffic and HTTP caching are disabled; Chromium uses a software GPU, and physical Safari/iPhone coverage remains unavailable. Do not reuse an old release's passes or make whole-page performance claims from entry sizes alone. Require exact-commit CI, Railway success and live verification before starting Release 5b.

## Authorization boundary

After separately verified 5a and 5b, stop and notify Tucker that the full project is ready for review. Do not start Release 6 map building/repository creation or Release 7 cutover/retirement without explicit approval. The future list/card fallback preference is not permission to start map work.
