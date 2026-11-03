# Release 5b: Vite upgrade with preserved browser targets

**Status: FUNCTIONAL/BUILD CHECKS PASSED / DEPLOYMENT AUTHORIZED WITH DISCLOSED PERFORMANCE COST / LIVE VERIFICATION PENDING.** Base: production-verified React 5a commit `4d9c4a473aaeafc0b2362b56de9eb04cd80bea2b`.

## Deployment decision — November 3, 17:53:08 UTC

After disclosure of the 15–21 ms cold-load increase, uncertain repeat-load regressions and lack of physical iPhone testing, the user instructed: “Deploy vite and investigate improvements.” This authorizes this Vite release with those caveats; it does not turn the timing results into a performance pass. The earlier hold recorded below and in verification data is historical. Exact-commit CI, Railway success and live checks are still required. React 5a remains the rollback baseline. Steps 6 and 7 and Tailwind changes remain held.

## Intended change

The current patch changes only package.json, package-lock.json and vite.config.ts: Vite 8.3.5, @vitejs/plugin-react 6.2.1 and esbuild 0.28.2. The latter also affects the separately bundled Node server and needs server regression checks. The implementation is frozen to these three files. Node 24.22.2 clean installation passed, as did native SQLite 3.53.2, Sharp 0.35.3 and esbuild smoke checks. Initial typecheck, 15 focused units and focused browser checks were followed by the full verification below. The implementation source remains unchanged.

Explicit build targets preserve the previous browser range rather than accepting Vite 8's newer defaults: chrome107, edge107, firefox104, safari16 and ios16. Vite resolveConfig confirms these explicit targets. This preserves transformation intent, not proof every feature runs on every corresponding physical device.

React remains 19.3.1. Tailwind, Motion and PWA plugin versions stay unchanged. No React Compiler, styling migration, manual chunk split, map-repository work or replacement renderer is part of this release. Preserve the existing map-generation plugin, base path, PWA behavior and map build dependencies.

## Fresh functional and build verification

The final November 3 run passed typecheck, 146 CI units with one intentional benchmark skip, 20 shared-card units, all 14 browser tests, glass/predeploy, the full build and bundle verification. These overlapping groups are not additive unique coverage.

Generated map outputs and shared renderer references passed checks, including home-flight source parity, Mapz/Outzide manifests, and Brotli/gzip round trips for all referenced JavaScript/CSS. The server bundle and native in-memory SQLite read/write passed. Profile packaging emitted 325 complete declarations. The guarded local build used the checked-in design snapshot with external traffic denied; it does not certify the remote refresh path.

Built assets passed four same-document mobile client navigations, service-worker activation with icons/manifest-only caching, and an isolated React HMR fixture retaining state and document identity after an edit. The temporary HMR fixture was removed. These tests are not operating-system installation or push-notification verification.

The 6,063-file inventory had zero final drift; the tracked root database was unchanged. Inventory file SHA-256: `14626a20781127ba651949551e5dc89df96eb6b9d21875f8f5e944221c9349ff`. Content digest: `b856ac867be75536ca2e6e171e579aa79dbbe08735c1c25dd2888748ca9519ee`.

## Performance findings and open decision

Thirty initial offline samples and 120 matched interleaved observations all returned 200, with no JavaScript errors. The matched comparison nevertheless leaves meaningful timing signals:

- Cold DOMContentLoaded across all five routes increased about **15–21 ms**, approximately **18–26%**.
- Original five-second same-context reload medians changed by approximately **Home +207 ms**, **Directory +156 ms**, **Outzide +68.85 ms**, **Boardz +56 ms**, and **Events −19.55 ms**.
- Initial JavaScript including module preloads changed from **255,123 to 262,681 Brotli bytes**, **+2.96%**. Compare the full initial graph: the single former initial file became 34 initial/preloaded files. A smaller individual entry file is not a smaller initial download.

Home image readiness varied. A separate scoped readiness diagnostic reversed the Home median direction, but it did not establish consistently quiet boundaries; the global-quiet diagnostic could not settle and the Outzide marker was inapplicable. This alternative does **not** erase the original results or establish a performance pass.

The user was asked at **04:36:40 UTC** whether to deploy with these caveats or retain current production and investigate further. **Publication is on hold for that decision.** No faster-phone, no-regression, production-deployment or live-verification claim is made.

The measurements use a disposable seeded database, offline loopback replay and software-GPU Chromium mobile emulation. HTTP cache is disabled; “warm” means same-context reload rather than warm HTTP cache. Top-frame metrics omit iframe internals. There is no physical iPhone/Safari proof. Prior-variant resource URLs were collapsed by the replay sanitizer, while numeric timings/counts/bytes remained intact; raw traces were retained and the diagnostic sanitizer was corrected. These are controlled local diagnostics, not live production latency.

## Evidence and publication gate

[Verification](releases/release-5b/verification-results.json), [build outputs](releases/release-5b/build-output-check.json), [bundle comparison](releases/release-5b/bundle-comparison.json), [interleaved measurements](releases/release-5b/interleaved-summary.json), [readiness diagnostic](releases/release-5b/readiness-diagnostic-summary.json), [offline routes](releases/release-5b/mobile-comparison.json), [built-app/PWA smoke](releases/release-5b/built-app-smoke.json), [HMR](releases/release-5b/hmr-smoke.json) and [source consistency](releases/release-5b/post-build-inventory-check.json).

Keep the verified React 5a commit as rollback baseline and current production until the decision authorizes a change. If deployment is approved, require exact-commit CI, Railway success and read-only live checks before declaring Vite complete.

## Stop after this release

Once Vite 5b is verified live, notify Tucker that Releases 1–5 are ready for whole-project review and stop. Releases 6 and 7 remain held. No map repository, map build, production map swap or old-system retirement may begin without explicit approval. Tailwind is not an additional automatic step.
