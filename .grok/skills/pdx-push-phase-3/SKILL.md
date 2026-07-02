---
name: pdx-push-phase-3
description: >
  Phase 3 agent — notification dispatch bridge for PDX Pride Guide. Hooks sendMessage
  and system notify functions to Web Push, payload templates per contextType, preference
  filtering, admin alerts. Reads PHASE_2 handoff. Writes PHASE_3_COMPLETE for Phase 4.
  Triggers: "phase 3 push", "dispatch phase", "inbox to push", "/pdx-push-phase-3".
  New user-visible notification types need approval. Blocked until Phase 2 gate passes.
---

# Phase 3 Agent — Inbox → Push Dispatch

**Program:** PWA + Web Push · **You are phase 3 of 4**

## Before you start

1. Read `docs/PUSH_NOTIFICATION_PROGRAM.md` — **Phase 2 must be `COMPLETE`**
2. Read `docs/handoffs/PHASE_2_COMPLETE.md` — **required**
3. Read `docs/NOTIFICATION_SYSTEM_REFERENCE.md` — full contextType catalog + push mapping
4. Read `server/storage.ts` — `sendMessage`, `notifyGuideInbox`, `notifyAttendeesOfHostUpdate`
5. Read `server/push/*` from Phase 2

### Gate check — refuse to start if

- No `PHASE_2_COMPLETE.md`
- Subscribe API not working
- `server/push/send.ts` missing

### Ask PM if unclear

- Q2 admin push throttle (use program default)
- New gap notifications (submission received, etc.) — propose, get approval before building

## Your scope

| Ship | Defer to Phase 4 |
|------|------------------|
| `server/push/dispatch.ts` | Dashboard prefs UI polish |
| `server/push/templates.ts` — per contextType | iOS onboarding card |
| Hook `sendMessage()` → dispatch (non-blocking) | Quiet hours |
| Hook `notifyAttendeesOfHostUpdate()` | CSP hardening |
| `notifyGuideInbox()` → account category | Full Codex UAT run |
| Preference category filter | Badge polish |
| Admin pending push (optional, throttled) | Close all notification gaps |
| Don't push to sender | |
| Rate limit safety valve (20/user/hr) | |

## Category mapping (enforce)

| Category | contextTypes |
|----------|--------------|
| `messages` | THREAD, MISSED_CONNECTION, GIG, GIFTING, CHECK_IN, EVENT_HOST |
| `my_events` | HOST_UPDATE, EVENT_TALENT, EVENT_TALENT_REQUEST |
| `account` | SUBMISSION, EVENT_CLAIM, PROMOTER, GUIDE_UPDATE |
| `admin` | Admin queue events (not inbox contextType) |

## Payload rules

- Use **Declarative Web Push** via Phase 2 send helper
- `navigate`: absolute `https://www.prideguidepdx.com/...`
- Include `app_badge` with unread count when possible
- Title/body from message subject + truncated body

## Integration points

```typescript
// After message insert in sendMessage():
void dispatchPushForMessage(created).catch(log);

// Inside notifyAttendeesOfHostUpdate loop:
void dispatchPushForMessage(created).catch(log);
```

**Non-blocking** — inbox write always succeeds.

## Verification

- [ ] New inbox message → push to recipient (`messages` on)
- [ ] Prefs off → no push, inbox still has message
- [ ] Host update → RSVP push (`my_events` on)
- [ ] Submission approved → `account` push
- [ ] Sender does not receive own push
- [ ] `npm run build` ✅

## When you finish

1. Write `docs/handoffs/PHASE_3_COMPLETE.md`
2. Update program doc
3. **Stop.** PM launches Phase 4.

### Handoff must include for Phase 4

- Which contextTypes are wired vs skipped
- Admin push: shipped or deferred
- Template coverage table
- Gaps still open from NOTIFICATION_SYSTEM_REFERENCE.md
- Manual test matrix results (Android + iOS if tested)

## Report to PM

Coverage map + any new notification types that need Tucker UX approval in Phase 4.