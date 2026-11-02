# Release 2 pinned Node 24 runtime

Status: local validation complete; publication and live-runtime verification pending. Base commit: `1d3d804dd34038585f6a9e972639c424b98386ed`.

## Scope

- Node **24.22.2** for CI, local version selection and Railway build/runtime.
- Published `better-sqlite3` **12.11.1**, which supports Node 24, with SQLite **3.53.2** and native ABI **137** in the tested build.
- `@types/node` **24.19.2** and its required `undici-types` lock entry.
- Seven CI runtime pins, `.nvmrc`, package engine range and native compatibility tests.
- Public health adds `nodeVersion` so the actually running version can be verified after deployment.
- No frontend implementation, schema migration, production-volume operation or map-renderer change.

The proposed SQLite 12.12.0 source exists on GitHub, but the npm registry did not publish that version during this implementation. The available 12.11.1 release was selected rather than introducing a further major-version jump to 13. The narrowed lockfile changes only the root metadata, Node types, required undici types and SQLite. A second clean install verified the final narrowed lock.

## Deployment reproducibility

The actual Railway driver is Nixpacks **1.41.0**. Its package snapshot cannot be assumed to supply the required secure Node patch. The configuration therefore installs the official Node 24.22.2 Linux distribution under `/opt/node-runtime`, verifies a pinned architecture-specific SHA256 before extraction, and uses the same absolute runtime for install, build and start. The tarball also contains the matching npm **11.19.1**.

Nixpacks setup retains OpenSSL and the existing provider native libraries; the Caddy phase remains. It does not install an unused end-of-life Node runtime. Dependency installation uses `npm ci --include=dev` once, under the exact runtime. Startup explicitly preserves `NODE_ENV=production`, the correct PATH for child processes, an exact-version assertion, and the version log before executing the server.

The generated final Nixpacks plan/Dockerfile was inspected using the actual 1.41.0 driver: source is copied before the installer runs; setup precedes install and build; the runtime remains in the final image. This is plan verification, not a local Docker build. The actual Railway build and live health still must verify execution.

Primary runtime source: [Node 24.22.2](https://nodejs.org/en/blog/release/v24.22.2). Official Linux x64 archive SHA256: `48cc0e21e048790e54c0cf5749c2725005313d652651c40b7a21feb9697aaf75`. The installer also carries the independently verified ARM64 checksum and refuses unsupported architectures or corrupt downloads.

## Local evidence

- Official installer executed successfully in an isolated local destination.
- Clean dependency install and native SQLite transaction smoke passed.
- Four new runtime/configuration/checksum/architecture tests passed.
- Full CI unit selection including the runtime tests: 71 passed.
- Typecheck, card unit tests, session HTTP tests, glass checks, predeploy, production build and deploy-bundle verification passed.
- Five deployment-verifier tests passed.
- All **252 emitted client JavaScript/CSS files** match the Release 1 build byte-for-byte, including filenames and SHA256 hashes.
- The built server returned `ok: true` and `nodeVersion: v24.22.2` against ignored local storage. That local health-only smoke disabled background geocoding and rejected outbound fetches, so it does not establish external integration coverage.
- Full card browser regression suites: **4/4 passed**, zero failed or skipped, 533.6 seconds. This includes every card anchor/reflow case, mobile viewport containment and internal scrolling, route gutters, and shared hearts without radar.

[Runtime versions](releases/release-2/runtime-versions.json) and [scope verification](releases/release-2/scope-verification.json).

## Validation limits and safeguards

The local environment blocks the tsx CLI's Unix-domain IPC listener. The identical test/build sources were run with `node --import tsx` instead; repository build scripts remain unchanged and the actual npm commands will run in CI/Railway.

An initial predeploy invocation accidentally touched the tracked seed because the global test database variable was omitted. Its resulting local copy was retained for diagnosis, the owned change was restored from HEAD, and validation was repeated with `DATABASE_PATH=.local/data.db`. An independent reviewer confirmed the tracked seed matches HEAD exactly. No production database was touched. The evidence database is not published.

Physical Safari/GPU limitations from Release 1 remain. This runtime release does not claim improved mobile frame rates or change the supported map engine.

## Publication gate

Before marking complete: publish only the intended diff, require exact-commit CI success, observe Railway SUCCESS, verify the live commit and `nodeVersion: v24.22.2`, and probe database-backed routes. Rollback must revert runtime/configuration/dependency pins together; do not reuse native modules across Node ABIs.
