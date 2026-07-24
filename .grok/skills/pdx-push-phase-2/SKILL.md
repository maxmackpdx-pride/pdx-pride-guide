---
name: pdx-push-phase-2
description: >
  Phase 2 agent — Web Push infrastructure for Zaylist. VAPID, push_subscriptions
  table, subscribe API, SW push handlers, Declarative Web Push, notification prefs API.
  Reads PHASE_1 handoff. Writes PHASE_2_COMPLETE for Phase 3. Triggers: "phase 2 push",
  "web push phase", "VAPID setup", "/pdx-push-phase-2". Permission UX needs approval.
  Blocked until Phase 1 gate passes.
---

# Phase 2 Agent — Web Push Infrastructure

**Program:** PWA + Web Push · **You are phase 2 of 4**

## Before you start

1. Read `docs/PUSH_NOTIFICATION_PROGRAM.md` — **Phase 1 must be `COMPLETE`**
2. Read `docs/handoffs/PHASE_1_COMPLETE.md` — **required**
3. Read `docs/PWA_PUSH_IMPLEMENTATION_PLAN.md` — Phase 2
4. Read Phase 1 artifacts: `client/src/sw.ts`, `client/src/lib/pwa.ts`

### Gate check — refuse to start if

- No `PHASE_1_COMPLETE.md`
- Service worker not registered
- `npm run build` fails on main

### Ask PM if unclear

- Q1 logout + subscription behavior (use program default)
- Whether to ship minimal subscribe button vs full Dashboard section (full UI is Phase 4 — API only here unless PM says otherwise)

## Your scope

| Ship | Defer to Phase 3+ |
|------|-------------------|
| `npm install web-push` | `dispatchPushForMessage` hooks |
| `push_subscriptions` schema + persistence surface | Admin queue push |
| `server/push/` — vapid, send, subscriptions | Payload templates per contextType |
| API: vapid-public-key, subscribe, unsubscribe | Dashboard prefs UI (Phase 4) |
| API: notification-prefs GET/PUT | |
| API: admin test push | |
| Extend `client/src/sw.ts` — declarative + imperative push | |
| `client/src/lib/pushNotifications.ts` | |
| Basic subscribe flow (can be minimal UI + test on Dashboard) | |
| iOS standalone gate before `requestPermission` | |
| `pushsubscriptionchange` re-subscribe | |
| Prune dead subs on 410 | |
| Document Railway env vars for Tucker | |

## Standing rules

1. Subscriptions require `requireAuth`
2. Prefs server-side only — no localStorage
3. **Declarative Web Push** JSON as primary send format in `server/push/send.ts`
4. Push send failures must not break inbox/message APIs (Phase 3 — but test push is OK to fail loudly)
5. Add tables to `server/persistence.ts`

## Implementation checklist

- [ ] Schema: `push_subscriptions` (+ prefs on `users` or separate table)
- [ ] `server/push/vapid.ts`, `send.ts`, `subscriptions.ts`
- [ ] Routes in `server/routes.ts`
- [ ] SW push + notificationclick handlers
- [ ] `client/src/lib/pushNotifications.ts`
- [ ] Minimal "Enable notifications" entry point (propose UX)
- [ ] Admin `POST /api/push/test`
- [ ] Boot migration if needed

## Verification

- [ ] `GET /api/push/vapid-public-key` returns key
- [ ] Subscribe saves row (authenticated)
- [ ] Admin test push arrives on Android Chrome
- [ ] iOS Home Screen PWA: test push (document result)
- [ ] 410 marks subscription inactive
- [ ] `npm run build` ✅
- [ ] `GET /api/admin/persistence` includes new tables

## When you finish

1. Write `docs/handoffs/PHASE_2_COMPLETE.md`
2. Update program doc phase status
3. **Stop.** PM launches Phase 3 after gate 2.

### Handoff must include for Phase 3

- `server/push/send.ts` function signature for dispatch
- Prefs schema and category enum
- Example declarative payload that worked in testing
- Railway env status (set / not set)
- SW notificationclick URL pattern

## Report to PM

Handoff + whether Tucker must add VAPID keys to Railway before Phase 3 testing.