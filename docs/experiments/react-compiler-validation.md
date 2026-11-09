# React 19 Compiler experiment: evidence and production gates

Status (November 8, 2026): **isolated branch, no production imports or merge**.
Pull request: https://github.com/maxmackpdx-pride/pdx-pride-guide/pull/69

## Real build configuration
Vite 8 and `@vitejs/plugin-react` 6 no longer accept the obsolete `react({babel:{plugins:...}})` configuration. The experimental `vite.config.ts` uses:
- `react()` from `@vitejs/plugin-react`;
- `babel({presets:[reactCompilerPreset({compilationMode:"annotation"})]})` from `@rolldown/plugin-babel`;
- `"use memo"` only in `client/src/components/cards/experimental/React19CardBoundaries.tsx`.

The existing production React 19 cards, React 19 transitions, event listeners, animation styles and Mapz host are untouched.

## Confirmed CI evidence before the new comparison
GitHub Actions run https://github.com/maxmackpdx-pride/pdx-pride-guide/actions/runs/42544387338
passed frozen `npm ci`, real Babel Compiler transform and opt-out checks, `npm run typecheck`, Mapz and platform suites, build, bundle verification, and a browser React Profiler baseline with existing production Eventz/Boardz cards. It **failed** an existing card route browser test targeting an outdated Needz selector. The main branch also has existing browser QA failures for the revised discovery gating and unified Hearts endpoint. Do not misreport the full CI run as green.

A separate test-only correction is under review in https://github.com/maxmackpdx-pride/pdx-pride-guide/pull/70. That PR changes browser assertions and fixture URLs, not production behavior.

## Deterministic compiler comparison
The `script/react-compiler-comparison-browser.test.mjs` browser test uses one exact, isolated `script/fixtures/react-compiler-card-benchmark.tsx` fixture in two modes: React 19 with the Compiler disabled, and React 19 with annotation-only Compiler enabled.

The benchmark:
1. Confirms Vite transforms the opted-in module only when Compiler is enabled.
2. Renders 120 stable keyed records and the exact same renderer in both modes.
3. Triggers six parent state updates without changing card records.
4. Records the child renderer's actual call count and React Profiler commit durations in Chromium.
5. Requires unchanged DOM content and fewer redundant child renders when compiled.

Duration measurements are diagnostic, not a guaranteed speedup percentage. A lower render-call count does not replace real Placez, Eventz, Boardz and Needz performance traces on representative devices.

## Adoption gate
Complete CI browser regressions, confirm matched baseline/Compiler comparison, profile representative **actual production pages** on a consistent browser/network/device, then rerun typecheck, Mapz/platform regressions, build, bundle validation, keyboard/focus/reduced-motion checks, and physical iPhone gestures. Only merge measurable beneficial changes after review. No CI result authorizes skipping production release gates, and no Mapz frontend/backend change is in scope.
