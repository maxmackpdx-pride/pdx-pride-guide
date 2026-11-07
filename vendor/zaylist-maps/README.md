# Pinned map release artifact

`v1.0.0.tar.gz` is the immutable build of maxmackpdx-pride/zaylist-maps tag v1.0.0.
The exact source commit, bundle entry and SHA-256 are locked in shared/mapReleaseLock.json.
The ordinary site build verifies and extracts it to /map-assets/v1.0.0/.
No runtime fetch of an unpinned latest branch is permitted. No private address notes
or captured user data are included. This archive is installed only once the source
release is tagged and its corresponding build is verified.

The deterministic release archive is stored as ordered 2 MiB parts to keep connector uploads bounded. Build reassembles the exact bytes and verifies the full SHA-256 before extraction. Parts are never selected via latest/main.

Browser-target compilation of the exact tagged source uses the explicit Vite define `process.env.NODE_ENV = "production"`. Library builds intentionally leave that consumer define unresolved by default; the native ESM browser must not depend on a global Node process shim. Reproduce after checking out the exact lock commit and `npm ci`: 

```sh
node --import tsx --input-type=module -e 'import {build} from "vite"; await build({configFile:"vite.release.config.ts",define:{"process.env.NODE_ENV":JSON.stringify("production")}})'
node scripts/namespace-release-assets.mjs
tar --sort=name --mtime='UTC 2026-11-07' --owner=0 --group=0 --numeric-owner -czf release.tar.gz -C dist-release .
```
The host rejects unresolved Node environment globals before serving the checksum-verified bundle.
