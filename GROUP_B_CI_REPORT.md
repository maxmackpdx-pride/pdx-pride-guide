# Group B Wave 0 (B1 + B2) — CI leaks

Worktree: `/Users/tuckercasey/pdx-pride-guide-group-b-ci-leaks`  
Branch: `chore/group-b-ci-leaks` (from `origin/master` `331b7773`)  
Not pushed.

## B1. Typecheck

### Baseline (this worktree, before edits)

```
npx tsc --noEmit --pretty false --incremental false
```

**0 errors.** Exit 0.

Docs and agent memory still cited a baseline of ~9 errors in `server/` and `shared/` (older HAUS / ROADMAP notes also mention 37). On current `origin/master` those are already gone. Nothing in `tsconfig.json` was loosened (`skipLibCheck` was already `true`; no new excludes).

### After

**0 errors.** Same command.

No type-correctness patches were required. The job is now to keep the count at 0 in CI.

### CI

- npm script: `"typecheck": "tsc --noEmit"` next to existing `"check": "tsc"`.
- New workflow: `.github/workflows/typecheck.yml`
  - `on: pull_request` and `on: push`
  - Node 20, `npm ci --include=dev`, `npm run typecheck`
  - Fails if `tsc` is non-zero
- Extra safety (not a substitute): `.github/workflows/railway-deploy.yml` also runs `npm run typecheck` after install, before `npm run ship`. PR / branch pushes are still caught by `typecheck.yml` before merge.

## B2. Glass `--c` rebind audit

### Rule

A CSS rule or TSX inline style that **assigns** `--c` must rebind glass recipes on the **same element**. Otherwise `--glass-card-*` stays computed against root cyan.

Scanner: `script/audit-glass-rebind.mjs`  
npm: `"audit:glass-rebind": "node script/audit-glass-rebind.mjs"`  
CI: same `typecheck.yml` job `glass-rebind` (plain Node, no `npm ci`) plus the Railway extra step.

**CSS.** Each selector whose block assigns `--c` must have `.pdx-glass-rebind` on the subject, **or** a class from the official grouped rebind rule in `client/src/components/ds/tokens/glass.css` (BEM `--` modifiers of those classes count). Comma-separated selectors are checked one by one. `.event-modal { --c: ... }` passes because `.event-modal` is in that group.

**TSX.** An opening tag that assigns `"--c"` / `["--c" as string]` in `style` must include `pdx-glass-rebind` (or a rebind-group class) in `className`. Simple `className={ident}` is resolved to the preceding `const ident = ...`.

First pass on origin/master: **200 findings** (185 CSS, 15 TSX) across 31 files. Not left as a ratchet-from-baseline list; product surfaces were fixed so CI is strict at 0.

### Fixes (no restyle)

- Added product classes that already set `--c` to the official rebind group in `glass.css`, so recipes recompute against the local accent (same contract as `.event-modal`).
- Added `.pdx-glass-rebind` on TSX hosts that set inline `--c` (`Button`, Housing ask buttons, Z-index filters/tags, ZDeck dots, hub feed badge, inbox demo login, event-modal send, TipSupport Apple Pay, page roots `.hz` / `.nude-beaches-page` / `.inbox-shell-root`).
- Dropped the bare `.nude-beaches-page button { --c }` catch-all so unclassed buttons cannot set `--c` without a rebind class. Named chips / `pdxBtn` / river-brats controls in that rule stay (they are in the group).

After: `glass-rebind audit: 0 violations (552 files, 104 rebind-group selectors)`.

### Remaining allowlist (scanner exceptions)

Keep short. Prefer adding `.pdx-glass-rebind` at the source.

| Exception | Why |
|-----------|-----|
| `:root` / `html` / `body` | Global default `--c` (the cyan fallback itself). |
| Official group in `tokens/glass.css` | Parsed from the `.pdx-glass-rebind, … { --glass-card-bg: … }` rule, not hardcoded. Includes the product surfaces listed there. |
| `client/src/components/ds/glass.ts` | `glass()` / `glassNeutral()` bake fill, edge, and bloom inline with the same accent. |
| `<Button>` | Always attaches `.pdxBtn.pdx-glass-rebind` on the host node. |

No per-file violation skip list.

## tsc before / after

| | Count |
|--|--|
| Before (origin/master in this worktree) | **0** |
| After | **0** |
