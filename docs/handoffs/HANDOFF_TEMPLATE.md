# Phase N Handoff - [TITLE]

> Copy this template to `PHASE_N_COMPLETE.md` when a phase agent finishes.
> The next phase agent reads this file before starting work.

## Meta

| Field | Value |
|-------|-------|
| Phase | N |
| Agent | `/pdx-push-phase-N` |
| Completed | YYYY-MM-DD |
| Build | `npm run build` pass/fail |
| Deploy | not deployed / deployed commit SHA |

---

## Summary

2–4 sentences: what shipped, what changed, current user-visible behavior.

---

## Shipped

- [ ] Item 1
- [ ] Item 2

---

## Files changed

| File | Change |
|------|--------|
| `path/to/file` | brief description |

---

## Verification done

| Check | Result |
|-------|--------|
| `npm run build` | ✅ / ❌ |
| Manual test | describe |

---

## Known issues / tech debt

| Issue | Severity | Suggested owner |
|-------|----------|-----------------|
| - | - | Phase N+1 / PM |

---

## For the next phase agent

### You can rely on

- Bullet list of stable APIs, files, env vars, patterns established

### Start here

- First file(s) to read
- First task(s) to do

### Do not break

- Constraints inherited from this phase

---

## Questions for PM

| ID | Question | Blocking? |
|----|----------|-----------|
| - | - | yes/no |

*PM resolves in `PUSH_NOTIFICATION_PROGRAM.md` → Open questions / Decision log before next phase starts if blocking.*

---

## Questions for Tucker (human)

| Question | Needs approval? |
|----------|-----------------|
| - | UX / deploy / secrets |

---

## Env / Railway notes

```
# Keys or config the next agent or Tucker must set
```

---

## UAT notes for Codex

Checklist items the next phase or Phase 4 should run.