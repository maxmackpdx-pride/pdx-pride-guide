# Experimental React 19 card rendering boundaries

Branch: `experiment/react19-card-render-boundaries`. This experiment is deliberately **not imported by production components**.

## Hypothesis
For large searchable card collections, deferring the query-dependent list and memoizing stable individual item surfaces may improve input responsiveness and reduce unnecessary item renders.

## Prototype
`client/src/components/cards/experimental/React19CardBoundaries.tsx` exports:
- `useDeferredCardCollection`: a generic, deferred search collection with simple status metrics.
- `ExperimentalCardSurface`: a memoized item boundary.
- `ExperimentalCardCollection`: a keyed collection wrapper without any visual styling.

## Constraints and limitations
- Existing Placez, Eventz, Boardz and Needz cards remain the source of truth. Do not replace or redesign them by default.
- `matches` and `render` must have stable identities for memoization to help; upstream records should preserve reference identity for unchanged items.
- Deferral does not make an expensive filter run faster and does not cancel network requests. Use existing TanStack Query and API cancellation where appropriate.
- This is not virtualization. Measure DOM size and memory separately.
- Accessibility, keyboard interactions, focus restoration, motion preferences, card transitions, and map state must remain intact in any later integration.
- No measured performance gain, typecheck result, or regression result is claimed.

## Validation before adoption
1. Run `npm ci` and `npm run typecheck` on the experimental branch.
2. Record React DevTools Profiler traces on current production components before integrating this prototype.
3. Add a gated, representative Placez or Eventz test integration, preserving the existing CardAPI.
4. Compare input latency, React commit duration, render counts, memory and interaction behavior.
5. Reject the experiment if the change increases complexity without measurable benefit.
6. Only merge and deploy after review and regression validation.
