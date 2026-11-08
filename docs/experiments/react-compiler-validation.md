# React Compiler experiment

Status: **configured on experimental branch only; not validated or deployed**.

## Configuration
- `vite.config.ts` registers `babel-plugin-react-compiler` with `compilationMode: "annotation"`. This limits compilation to explicitly annotated functions rather than enabling whole-site compilation.
- `React19CardBoundaries.tsx` opts in with `"use memo"` directives and removes its experimental manual `memo` wrapper.
- `package.json` declares `babel-plugin-react-compiler` as a development dependency.

## Important validation blocker
The repository has `package-lock.json`. The lockfile has **not yet been regenerated** for the new dependency. A clean `npm ci` may fail until a trusted Node 24 environment runs `npm install --package-lock-only` (or `npm install`) and commits the lockfile. Do not merge or deploy this branch before resolving that dependency lock and running tests. The declared plugin version must be verified as available and compatible.

## Test matrix
1. Existing React 19 components, no compiler.
2. Existing components with compiler configured but not annotated (expected no transformation).
3. Experimental annotated card components with compiler.

Run `npm ci`, `npm run typecheck`, `npm run test:mapz`, `npm run test:platform`, `npm run build`, `npm run verify:deploy`, then browser and iPhone interaction checks. Inspect compiled output or compiler diagnostics to confirm the intended functions were transformed. Capture React DevTools profiling traces before claiming gains.

No production card, map, API or visual component imports this experimental module. No performance claims have been established.
