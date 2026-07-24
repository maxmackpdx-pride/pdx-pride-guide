---
name: pdx-push-phase-4
description: >
  Phase 4 agent — polish and ship for Zaylist push program. Dashboard notification
  prefs UI, iOS Add to Home Screen onboarding, app badges, gap notifications, Codex UAT
  checklist, program closeout. Reads PHASE_3 handoff. Writes PHASE_4_COMPLETE. Triggers:
  "phase 4 push", "push polish", "ship push notifications", "/pdx-push-phase-4". UX changes
  need approval. Blocked until Phase 3 gate passes. Final phase.
---

# Phase 4 Agent — Polish, Prefs UI & Ship

**Program:** PWA + Web Push · **You are phase 4 of 4 (final)**

## Before you start

1. Read `docs/PUSH_NOTIFICATION_PROGRAM.md` — **Phase 3 must be `COMPLETE`**
2. Read `docs/handoffs/PHASE_3_COMPLETE.md` — **required**
3. Read all prior handoffs for full system picture
4. Read `docs/NOTIFICATION_SYSTEM_REFERENCE.md` — gaps section

### Gate check — refuse to start if

- No `PHASE_3_COMPLETE.md`
- Dispatch not hooked to `sendMessage()`

### Ask PM / Tucker before shipping UX

- Dashboard prefs layout and copy
- iOS onboarding card design and placement
- Which gap notifications to close vs defer

## Your scope

| Ship | Optional / defer |
|------|------------------|
| Dashboard notification prefs UI (4 toggles) | Quiet hours |
| iOS "Add to Home Screen" education card | CSP hardening |
| Wire prefs UI to Phase 2 API | Active-tab suppress push |
| `app_badge` in dispatch templates | |
| Execute Codex UAT checklist from implementation plan | |
| Triage gaps — fix approved ones | |
| Program closeout handoff | |
| Update NOTIFICATION_SYSTEM_REFERENCE.md if behavior changed | |

## UAT checklist (run and log results)

From `docs/PWA_PUSH_IMPLEMENTATION_PLAN.md`:

- [ ] Lighthouse PWA installable
- [ ] Android: install → login → enable → test push → tap opens inbox
- [ ] iOS Home Screen: enable → host update push
- [ ] Prefs off → no push, inbox works
- [ ] Logout/login subscription behavior (per Q1 decision)
- [ ] Deploy mid-session recovery
- [ ] `GET /api/admin/persistence` OK

## Gap triage (propose before implementing)

| Gap | Recommendation |
|-----|----------------|
| Submission received confirmation | Inbox message on submit — ask Tucker |
| Gifting admin approve notify | Inbox + push — ask Tucker |
| HOST_UPDATE badge | Should be fixed Phase 1 — verify |

## Standing rules

1. This phase is **UX-heavy** — get approval for visible changes
2. Do not refactor unrelated code
3. Update program doc → program status `SHIPPED` when PM accepts

## When you finish

1. Write `docs/handoffs/PHASE_4_COMPLETE.md` with full UAT results
2. Update `docs/PUSH_NOTIFICATION_PROGRAM.md`:
   - All phases `COMPLETE`
   - Program → `SHIPPED`
   - Handoff index complete
3. Update `docs/NOTIFICATION_SYSTEM_REFERENCE.md` if push is live
4. **Stop.** Program complete.

### Final handoff includes

- UAT matrix with pass/fail per platform
- Deferred items with rationale
- Tucker deploy checklist (Railway env, Pride weekend timing)
- "How to test push" one-pager for team

## Report to PM

Program shipped / shipped with caveats. List deferred work for post-Pride backlog.