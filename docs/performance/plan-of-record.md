# Zaylist improvement plan of record — gated release sequence with evidence
Merged Nov 1, 2026 into the single document of record (merged from Muse’s evidence and the reviewed gated sequence; execution now owned by Janice). Structure: the revised gated sequence. Underneath each release: Muse's file-level evidence and acceptance criteria from the Nov 1 audit at master `90a88238`, plus the two adopted adjustments.

**Current authorization boundary, November 3 at 00:16:40 UTC: complete and verify Releases 1–6, then STOP for a review of the whole project with Tucker. Release 7 must not begin automatically. It requires explicit new approval after that review and after confirming all of Releases 1–6 are done. No automatic production map cutover or retirement of the old map system.**

Current progress at this instruction: Releases 1–3 are complete and verified; Release 4 forward-only image processing is ongoing. React and Vite remain Release 5a and 5b, respectively; the replacement map build is Release 6. Numbering is unchanged.

The earlier November 2 full-plan execution authorization is narrowed by this latest instruction. Verification remains required for every release. Decisions that expand scope or require separate permission are not silently assumed.

Execution run logs: [Release 1 baseline](release-1-baseline.md), [Release 2 runtime](release-2-runtime.md), [Release 3 API](release-3-api.md), [Release 4 phone loading](release-4-phone-load.md). This repository copy carries the agreed plan forward; previously delivered PDF/JSON are the pre-execution snapshot.
Amended Nov 1 per Codex's document review: Node 24 corrected to a chosen target (not a Vite 8 requirement); Express ETag wording corrected; home-flight acceptance criterion changed to zero obsolete asset dependencies; home globe described as canvas; cache-freshness tests, repeatable performance gates, and a pre-move reference audit added; map-code extraction marked proposed. That review used the earlier code findings and current official documentation — not a fresh production audit; nothing was changed or deployed by it.

## Ground rules (apply to every release)

- Repo: pdx-pride-guide (Zaylist). Deploy path is GitHub master → Actions → Railway. Never `railway up`.
- **Map primacy:** MapLibre is the most important map technology on the site, and the flagship map surfaces are the home globe (a self-contained canvas globe — no MapLibre), Mapz, and Outzide (MapLibre). Leaflet only powers incidental card minimaps. Weight MapLibre decisions by importance, not footprint.
- **Brand resolution:** branding stays high resolution. Brand masters are never compressed. The only allowed pattern is masters untouched, with web-served copies sized to their actual display dimensions.
- Stack facts: npm (package-lock.json); Railway + Nixpacks (`npm install --include=dev && npm run build`, start `node dist/index.cjs`); production serves a prebuilt client (Vite → dist/public; Express from server/static.ts); the server is an esbuild-minified CJS bundle (script/build.ts).

## Release discipline (every release)

Test, compare against the Release 1 baseline, deploy, and verify the live version before moving on. Performance gates must be repeatable: every measurement records the commit, the devices, the routes, the network conditions, cold vs warm runs, and the agreed regression limits it is judged against. Verify means probing production itself — a slow Railway rollout (~12 minutes during the PR #61 deploy) can look like a hang from stale watchers; confirm at the source.

---

## Release 1 — Establish the baseline and protect what's working

Measure before changing anything: mobile loading, API response time, downloaded image sizes, map startup, and scrolling. Add regression checks for card sizing, anchored expansion, fixed image/phone sections, and internal scrolling — the card behavior repaired in PR #61/#63 is the spec these checks protect.

Evidence/notes:
- The map regression suites built Nov 1 (mapz-startup, mapz-surfaces, mapz-ground-lights, mapz-bridge-model, mapz-bridge-elevation, mapz-custom-render-retain, map-foundation-browser) are the starting harness set for map startup/behavior.
- Record the baseline numbers in this document's run log before Release 2 begins; every later release is judged against them.
- Acceptance: baseline metrics on file; card-behavior regression checks exist and pass on current master.

## Release 2 — Upgrade the runtime separately (Node 24)

Move to Node 24, updating the app, CI, and deployment settings together so development, testing, and production run the same version. Verify the SQLite dependency and the production build before shipping.

Evidence:
- `package.json` engines: `>=20.19.0 <21`; Nixpacks follows engines, so this one change moves the whole deploy.
- Node 20 end-of-life was 2026-04-30 — no security fixes; an Oct 2026 Brotli CVE was patched only in 22/24/26. Node 24 is supported to Apr 2028 (Node 26 became LTS Oct 28, 2026, and is acceptable, but 24 is the conservative target).
- Risk: `better-sqlite3@^11.7.0` may need its v12 bump for Node 24 prebuilds — test the full build before merging.
- Payoff beyond hygiene: newer V8 for the Express server. **Node 24 is our chosen target on its own merits — it is not a Vite 8 requirement** (Vite 8 supports Node 20.19+/22.12+, the same as Vite 7, per the Vite 8 announcement). Runtime-first is our sequencing decision, not a dependency. This release explicitly updates the CI pins too, not just engines/Nixpacks.

## Release 3 — Fix API response costs and caching

Add appropriate compression, implement useful pagination where needed, and cache eligible public responses **and their expensive computation**. Keep private and personalized responses out of shared caches. An ETag alone doesn't stop the server from doing the expensive work again — the computation cache is the point, not just the transfer savings.

Evidence:
- `server/routes.ts:1883` (`/api/events`) ignores any `limit`, loads ALL LIVE events, expands multi-day events, enriches every row in a CPU loop, and responds with `res.json` under no explicit cache policy. (Express emits weak ETags by default, so "no ETag" would mislead: the default ETag neither sets a freshness policy nor spares the recomputation. The missing pieces are the explicit cache policy and caching the expensive computation.) `/api/events?limit=1` currently dumps everything.
- Source inspection found **no application compression middleware in server/**; precompressed sidecars cover static files. Release 1 nevertheless verified gzip-compressed API delivery through Cloudflare. Direct-origin encoding has not been measured, so origin compression must not be inferred from middleware absence alone.
- Acceptance: `/api/events` responses compressed; repeat public requests served without re-running the enrichment loop (cache hit observable); `limit` honored; no private/personalized response enters a shared cache; response times beat the Release 1 baseline; **cache-freshness tests pass — edited, cancelled, hidden, and expired events must update correctly, and faster but stale results cannot pass.**

## Release 4 — Reduce what phones actually download and run

### 4a. Early housekeeping (first, before any derivative work)
**Verify the reported 813 MB against the current build** — that figure was measured on a 5173983b-era local clone and stays marked as an older measurement until rechecked. Then remove confirmed non-runtime audit/archive material from the deployed public folder **while preserving the originals elsewhere**. Leave map dependencies alone until the replacement (Release 6/7). **Before anything moves, run a reference audit** — every asset slated to leave the deployed folder is checked for references — **and tests must prove no broken image links afterward.**

Evidence (older measurement, to recheck):
- `client/public/outzide-map/` = 825 MB, of which `assets/photos/` = **813 MB across 1,380 files, averaging ~600 KB, with 251 files over 1 MB** — the Outzide map's place photos (trailheads, lakes, hot springs, ATV areas), each place stored in three copies (full-size original, 1280px, 640px), plus `v3/overlays/` SVG trail/route maps at 3–5 MB each.
- Also heavy: `posters/` 90 MB, `brand/` 54 MB, `directory-logos/` 52 MB, `event-posters/` 42 MB — including an 8.9 MB PNG screenshot at `event-posters/audit-2026-09-28/steam-events-3.png`, a formerly suggested housekeeping candidate that Release 1 verified is still used by live events. Preserve it; optimize served derivatives instead.
- Vite copies `client/public` wholesale into dist, so everything in it ships in every deploy.

### 4b. Image derivatives
**Scope revision, November 3 at 00:09:38 UTC:** process new eligible incoming images automatically going forward, using persistent runtime derivatives and dynamic frontend delivery. Do not backfill the existing image catalogue or include the earlier 368-file static batch in this release. Preserve originals and backups. Complete and verify this forward-only work, then move to Release 5. The exact runtime paths and coverage must be documented from the implementation, not assumed.

Serve properly sized image derivatives while preserving originals (`sharp@^0.35.3` is already a dependency). Phones should receive the 640/1280 copies, not camera-size originals. **Brand exception (Tucker's rule):** `brand/` masters stay high resolution and untouched; only web-served copies get sized to their display dimensions.

### 4c. Defer and consolidate runtime work
- Defer offscreen minimaps: Leaflet (leaflet@1.9.4 + react-leaflet) reaches the app shell through card components (PlaceCardMap.tsx, DirectoryMap.tsx, OutzMap.tsx). Loading them behind IntersectionObserver cuts bundle weight **and** the number of live map contexts on iOS Safari — directly relevant to the Boardz/Mapz iPhone jetsam problem.
- Consolidate animation: **two animation libraries are installed** — `framer-motion@^11.13.1` (17 files) AND `motion@^12.43.0` (3 files). Consolidate on motion v12, drop framer-motion, consolidate animation loops, and pause unnecessary work when the page is hidden (loading time, scrolling, battery, heat).
- Entry-bundle context: entry JS ≈ 1.86 MB raw / ~510 KB brotli; entry CSS ≈ 723 KB raw / ~116 KB brotli, paid by every visitor before any route chunk; `main.tsx` eagerly imports ~15 global CSS files over a 419 KB hand-written `index.css`; ~25 Radix packages are the other big contributor. (Bundle figures measured on the same older dist — recheck with the 4a verification.)
- Acceptance: Outzide and card-heavy pages download measurably less than baseline on a phone viewport; All originals preserved; only assets confirmed safe to relocate are removed from the deployed tree; no brand master altered.

## Release 5 — Upgrade the frontend tools in separate releases

Test the React and Vite upgrades **independently** — combining framework, build-tool, and styling migrations makes regressions harder to identify.

### 5a. React 18.3.1 → 19.3.1
- Latest 19.x is 19.3.1 (Oct 14, 2026). Forced companions: react-leaflet 4.2.1 → v5 (plus @react-leaflet/core 2→3), @types/react and @types/react-dom to 19, likely react-day-picker 8→9.
- Evaluate the React Compiler after compatibility checks — the card-heavy Boardz/Eventz lists are its ideal workload.
- Requires a Boardz-on-iPhone test pass before merge.

### 5b. Vite 7.3.0 → 8.3
- @vitejs/plugin-react 4.7 → 6.x; Rolldown/Oxc-based; reported build-time cuts of ~38–64%. Mostly deploy/build speed plus a small bundle reduction. Independent of Release 2 — Vite 8 runs on Node 20.19+/22.12+; running the runtime upgrade first is our sequencing choice, not a requirement.
- **Risk:** `vite.config.ts` deliberately has NO manualChunks — a hand-split Leaflet chunk previously crashed Safari with a TDZ evaluation-order error. Any chunking change must pass the Mapz/Boardz Safari regression suites.

### 5c. Tailwind — optional
Tailwind 3.4.17 → 4 only if it delivers a clear benefit; don't rewrite styling to change version numbers. `@tailwindcss/vite@^4.1.18` already sits in devDependencies unused — resolve it (use or remove) with this decision.

## Release 6 — Build the complete replacement map system last (separate repository)

One separate repository containing the shared map engine and **all five modes: Mapz, OutZide, Afterz, ZayDark, and Boardz** (Boardz: corkboard ground, paper styling, pushpins — added after the original four). Define how it connects to existing accounts, cards, data, and chat before building it. The existing maps keep working while the replacement is developed and tested.

### GATE — device-support decision (before map architecture, before any engine commitment)
**Approved November 3 at 00:20:47 UTC:** preserve the current browser support range; provide usable lists and cards on devices that cannot run the new map graphics. This approves the fallback product direction, not a specific engine version or an untested device-compatibility claim. Validate supported map behavior and the list/card fallback before settling the architecture. Release 7 still requires the separate full-project review and explicit approval.

Test the oldest iPhones and browsers we intend to support. **Verify the approved usable-list/card fallback before committing to the engine**, rather than discovering an exclusion after launch. Preserve the current support range. This gate comes before the MapLibre decision below because the tested fallback and device capabilities constrain the architecture.

### The MapLibre question (evaluated inside this release, after the gate)
- Current sprawl: npm `maplibre-gl@^4.7.1` (EventLocationMap.tsx, outzTopography.ts) vs a **vendored 5.6.2 UMD build (937 KB)** loaded by the standalone Mapz/Outzide maps. Latest is 6.16.0.
- Bringing the lanes in step on 5.x is low-risk. **v6 is NOT a drop-in:** ESM-only (the UMD script the standalone maps load no longer exists) and **requires WebGL2** — devices without it get no map at all. The gate above decides whether that floor is acceptable and what sits below it.
- The vendored three.js in mapz-map/vendor (r186) matches npm three@^0.186.1 — current, no action.

### Build approach — extract-and-harden (PROPOSED, not settled)
**Status: proposal only.** Extracting the existing map code stays a proposed approach until the device-support gate above and the integration decisions are settled — it is not the decided approach. The case for it: the current Mapz carries production scar tissue a clean rewrite would have to re-earn: the PR #61 repairs (style.load waypoint recovery, iframe disposal), Safari module evaluation-order fragility, iOS memory ceilings. Move the current Mapz/Outzide code into the new repository first, get the existing regression suites green there, then evolve — and build Afterz, ZayDark, and Boardz on that foundation. Decide the consumption boundary early (shipped bundle vs package vs framed app): it determines whether the static-serving and deploy coupling being retired in Release 7 follows the maps into their new home.

### Current-code inventory (what the new repo inherits or replaces)
- The homepage globe (PortlandMetroGlobe, rendered by HomeFlight.tsx) has used NO MapLibre since Sep 21, 2026 — a self-contained 2D-canvas globe with its own dot math (placePoint → sphere → project) and baked geography (/home-globe/portland-city-beam-density.png + hologram atlas from script/build-home-globe-atlas.mjs). It is not part of the entanglement; preserve its behavior and outputs whatever happens to map plumbing.
- The retired flyover (client/public/home-flight/index.html + river-flight.js) is MapLibre end-to-end — basemap/style, terrain (queryTerrainElevation), custom layers via MercatorCoordinate, geometry via querySourceFeatures, camera via map.jumpTo, all dot positioning via map.project(). It can only be retired, not stripped.
- Entanglement (why home-flight still exists): Sep 25, 2026 (c3a899d8) Mapz was pointed at home-flight's vendored MapLibre; Oct 6 (7a339430) Mapz + Outzide were consolidated onto home-flight modules. Today: mapz-map/index.html + outzide-map/index.html load home-flight/vendor/maplibre-gl-5.6.2.{js,css}; mapz-map/river-flight.js imports bridge-roads.js, city-sparkles.js, roof-sparkles.js from home-flight; mapz-map/bridge-fit.js imports bridge-roads.js; map-foundation/surface.js imports home-flight/city-map.js; vite.config.ts versions the whole directory; server/mapzStatic.ts allowlists home-flight/vendor; script/build.ts compresses it; script/mapz-build.ts reads/rewrites it; script/build-home-globe-atlas.mjs reads home-flight/waypoints.json, logo-mask.js, and venue logos; seven test scripts read home-flight sources.

## Release 7 — Swap it in, then retire the old map plumbing

**HOLD: not authorized to start automatically.** First confirm Releases 1–6 are complete and verified, review the entire project with Tucker, and obtain his explicit new approval. The production map swap and old-system retirement below are blocked until that approval.

Verify mobile behavior, terrain, markers, recovery, privacy, and mode switching before cutover. Keep a rollback path. Only after the replacement is verified live, remove unused home-flight assets and obsolete build code, preserving anything still needed by the globe or map outputs.

Evidence/cautions for the retirement step:
- **The vite home-flight versioning plugin also generates production map files** — its removal needs care, not a delete-on-sight. Same for the `__HOME_FLIGHT_BASE__` define and the verify-deploy-bundle manifest check.
- server/mapzStatic.ts's allowlist is path-sensitive; the retirement must be sequenced so no live map loses its renderer mid-step.
- Flyover-only weight is small (~316 KB: river-flight.js 43.8 KB, poster.webp 268.8 KB, studio.css, host-bridge.js). MapLibre's 937 KB is not savings — it moves with the maps. The win is structural: the flagship maps no longer live in a retired directory, and dead code stops shipping.
- Acceptance: **zero obsolete asset dependencies on home-flight remain.** A grep for "home-flight" is a triage tool, not the criterion — legitimate styling names containing those words may remain; live Home/Mapz/Outzide probed on production after the swap and again after the cleanup; rollback path tested, not just documented.

---

## Skip list (checked, not worth action)
TypeScript 5.6.3 (build-time only), Express 5.0.1 (patch-level), three/sharp/esbuild (current), Leaflet 1.9.4 (still latest stable — its minimap role is handled by deferral in 4c), lucide-react 0.453.0 (fold any tree-shaking gains into a routine dependency pass).

## Already good — do not "fix"
Static assets are pre-compressed at build (brotli q5 + gzip sidecars in script/build.ts) with `immutable, max-age=1y` on /assets; every App.tsx route is lazy via lazyWithReload; PWA precache is deliberately limited to icons/manifest; map pixel ratios are capped on coarse pointers (Mapz boot 1.25; home globe 1.5); tesseract.js and html2canvas are NOT in the entry chunk; fonts are self-hosted Fontsource latin subsets.

## Related open items (from the agent punch list)
llms.txt gaps; `/openapi.json`, `/agents.json`, `ai-plugin.json` return 404. (The `/api/events?limit=1` item is absorbed into Release 3.)

## Verified execution findings

- November 2, Release 1: production API responses already arrive gzip-compressed through Cloudflare, with weak ETags and working 304 validation. Source has no explicit application compression middleware; direct-origin behavior has not been measured. Release 3 must improve computation cost and freshness, not claim edge compression as a new benefit.
- November 2, Release 1: audit/archive folder names are not evidence of unused assets. Live Eventz references audit-2026-09-28 posters, including the large steam-events-3.png candidate. Preserve runtime files and prioritize served derivatives; only confirmed unused material may leave the deployed tree.

- November 2, Release 4 reconstruction: workspace loss required recovering exact original artifacts where available and reconstructing other changes. The earlier reconstructed candidate passed its local checks at 22:53 UTC, but its static-batch image scope was superseded November 3 at 00:09:38 UTC. Those results are historical only. The forward-only runtime image implementation subsequently passed fresh local typecheck, CI (146 passes, one intentional skip), 14 browser tests, build/bundle checks and 30 offline route samples on November 3. Publisher and member ingestion workflows passed separately against disposable databases. The release remains unpublished pending exact-commit CI, Railway and live verification.
