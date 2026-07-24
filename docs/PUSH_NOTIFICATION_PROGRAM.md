# Push Notification Program - PM Source of Truth

> **Program manager:** Grok (bird's-eye continuity across phases and agents)
> **Goal:** Zaylist as an installable PWA with working Web Push for logged-in users
> **Production:** `https://www.zaylist.com`

## How this program works

```
                    ┌─────────────────┐
                    │   Grok (PM)     │
                    │  Source of truth │
                    │  Answers questions│
                    │  Unblocks gates  │
                    └────────┬────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
 Phase 1 agent          Phase 2 agent          Phase 3 agent … Phase 4
     │                       │                       │
     └──── handoff doc ──────┴──── handoff doc ──────┘
              docs/handoffs/PHASE_N_COMPLETE.md
```

1. **One phase agent runs at a time.** Do not start Phase N+1 until Phase N handoff is written and PM marks the gate passed.
2. **Each agent reads this file + the previous handoff** before writing code.
3. **Blocked or unclear?** Agent adds a question to [Open questions](#open-questions) and asks the PM (Grok) or Tucker - do not guess on product decisions.
4. **When done,** agent writes `docs/handoffs/PHASE_N_COMPLETE.md` using the template, updates the phase status table below, and stops.

### Slash commands

| Phase | Agent | Command |
|-------|-------|---------|
| PM / status | Grok orchestrator | `/pdx-push-pm` |
| 1 - PWA shell | Phase 1 agent | `/pdx-push-phase-1` |
| 2 - Web push | Phase 2 agent | `/pdx-push-phase-2` |
| 3 - Dispatch | Phase 3 agent | `/pdx-push-phase-3` |
| 4 - Polish & ship | Phase 4 agent | `/pdx-push-phase-4` |

### Reference docs (all agents)

| Doc | Purpose |
|-----|---------|
| [NOTIFICATION_SYSTEM_REFERENCE.md](./NOTIFICATION_SYSTEM_REFERENCE.md) | What we notify, user types, contextTypes |
| [PWA_PUSH_IMPLEMENTATION_PLAN.md](./PWA_PUSH_IMPLEMENTATION_PLAN.md) | Technical research and architecture |
| [handoffs/HANDOFF_TEMPLATE.md](./handoffs/HANDOFF_TEMPLATE.md) | Required handoff format |

---

## Phase status

| Phase | Name | Status | Handoff | Owner agent |
|-------|------|--------|---------|-------------|
| **1** | PWA shell + prereqs | `COMPLETE` | [PHASE_1](./handoffs/PHASE_1_COMPLETE.md) | `/pdx-push-phase-1` |
| **2** | Web push infrastructure | `COMPLETE` | [PHASE_2](./handoffs/PHASE_2_COMPLETE.md) | `/pdx-push-phase-2` |
| **3** | Inbox → push dispatch | `COMPLETE` | [PHASE_3](./handoffs/PHASE_3_COMPLETE.md) | `/pdx-push-phase-3` |
| **4** | Polish, prefs UI, UAT | `COMPLETE` | [PHASE_4](./handoffs/PHASE_4_COMPLETE.md) | `/pdx-push-phase-4` |

**Program status:** `SHIPPED` - code complete; awaiting Railway VAPID + device UAT

**Status values:** `NOT_STARTED` · `IN_PROGRESS` · `COMPLETE` · `BLOCKED`

*PM updates this table when a phase handoff is accepted.*

---

## Program goals (non-negotiable)

1. **Inbox remains source of truth** - push is a delivery channel only
2. **Session-cookie auth** - no localStorage for auth or prefs
3. **Declarative Web Push first** - Safari / iOS Home Screen reliability
4. **iOS = Home Screen PWA** - educate users; no push from Safari tab
5. **Deploy-safe service worker** - no stale bundles after Railway deploy
6. **SQLite on `/data`** - new tables registered in `server/persistence.ts`
7. **User approval** for visitor-visible UX (install banners, permission prompts, Dashboard toggles)

---

## Phase gates

### Gate 1 → Phase 2 may start when

- [ ] `manifest.webmanifest` valid; Lighthouse PWA installable
- [ ] Service worker registers; `client/src/sw.ts` exists with push listener stub
- [ ] Icons in `client/public/icons/`
- [ ] `isStandalonePwa()` helper exists
- [ ] `HOST_UPDATE` inbox badge bug fixed
- [ ] `npm run build` passes
- [ ] Handoff: `docs/handoffs/PHASE_1_COMPLETE.md`

### Gate 2 → Phase 3 may start when

- [ ] `push_subscriptions` table + persistence surface
- [ ] VAPID env documented; public key endpoint works
- [ ] Subscribe / unsubscribe API works (`requireAuth`)
- [ ] Notification prefs API (4 categories) works
- [ ] SW handles declarative + imperative push
- [ ] Admin test push works on Android Chrome
- [ ] Handoff: `docs/handoffs/PHASE_2_COMPLETE.md`

### Gate 3 → Phase 4 may start when

- [ ] `dispatchPushForMessage()` hooked into `sendMessage()`
- [ ] Host update → RSVP push works (with `my_events` pref)
- [ ] Inbox message → recipient push works (with `messages` pref)
- [ ] System messages → `account` category push
- [ ] Push failures non-blocking; 410 prunes subscription
- [ ] Handoff: `docs/handoffs/PHASE_3_COMPLETE.md`

### Gate 4 → Program complete when

- [ ] Dashboard notification prefs UI (4 toggles)
- [ ] iOS Add to Home Screen onboarding card
- [ ] Codex UAT checklist executed and logged in handoff
- [ ] Gaps triaged (fixed or explicitly deferred)
- [ ] Handoff: `docs/handoffs/PHASE_4_COMPLETE.md`
- [ ] PM marks program `SHIPPED`

---

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-02 | 4 sequential phase agents with handoffs | Continuity; one concern per agent |
| 2026-07-02 | Keep push subscription on logout | Device-level sub; prefs server-side (Q1 default) |
| 2026-07-02 | Install prompt on Dashboard after login | Q3 default |
| 2026-07-02 | Admin push deferred to post-ship | Q2 - throttle if added later |
| 2026-07-02 | DIY `web-push` + VAPID, not OneSignal | Privacy, one Safari-compatible path |
| 2026-07-02 | Declarative Web Push primary | iOS / ITP service worker eviction |
| 2026-07-02 | 4 user prefs: messages, my_events, account, admin | Simplifies 14 contextTypes |
| - | Logout deletes push sub? | **OPEN** - see questions below |

---

## Open questions

Questions agents cannot answer alone. PM (Grok) or Tucker resolves; then move to decision log.

| ID | Question | Asked by | Status | Resolution |
|----|----------|----------|--------|------------|
| Q1 | On logout, delete push subscription or keep for re-login? | PM | RESOLVED | Keep on device |
| Q2 | Admin push on every new submission, or daily digest? | PM | RESOLVED | Deferred; throttle if added |
| Q3 | Install prompt: after login only, or also second visit for anonymous? | PM | RESOLVED | Dashboard after login |

*Agents: add rows here when blocked. Do not implement until resolved or PM says "use default: …".*

### Default answers (use if PM unavailable)

| ID | Default |
|----|---------|
| Q1 | Keep subscription on logout (device-level); prefs stay server-side |
| Q2 | Throttle admin push - max 1 per kind per 5 min |
| Q3 | Install prompt after login on Dashboard only |

---

## Environment & secrets checklist

| Item | Phase | Owner | Status |
|------|-------|-------|--------|
| `VAPID_PUBLIC_KEY` | 2 | Tucker → Railway | **GENERATED** - see `.railway/vapid-keys.txt` |
| `VAPID_PRIVATE_KEY` | 2 | Tucker → Railway | **GENERATED** - run `script/set-railway-vapid.sh` |
| `VAPID_SUBJECT` | 2 | `mailto:hello@zaylist.com` | ready |
| App icons | 1 | Phase 1 agent | ✅ shipped |
| Code deploy | all | commit `2be78ce` | pushed → Railway CI |

---

## Handoff index

| File | Phase | Date | Summary |
|------|-------|------|---------|
| [PHASE_1](./handoffs/PHASE_1_COMPLETE.md) | 1 | 2026-07-02 | PWA shell |
| [PHASE_2](./handoffs/PHASE_2_COMPLETE.md) | 2 | 2026-07-02 | Web push API |
| [PHASE_3](./handoffs/PHASE_3_COMPLETE.md) | 3 | 2026-07-02 | Dispatch bridge |
| [PHASE_4](./handoffs/PHASE_4_COMPLETE.md) | 4 | 2026-07-02 | Prefs UI + ship |

*PM appends a row when each `PHASE_N_COMPLETE.md` is accepted.*

---

## PM responsibilities (Grok)

When acting as program manager:

1. **Track phase status** in this file
2. **Answer agent questions** in Open questions / Decision log
3. **Accept or reject handoffs** against phase gates
4. **Maintain continuity** - ensure agents don't contradict prior decisions
5. **Escalate to Tucker** for UX approval, Railway secrets, production deploy timing
6. **Do not implement phase work** when in PM mode - delegate to the phase agent

When Tucker says "run the program" or "start phase 1": launch `/pdx-push-phase-1`. When a handoff lands, review it, update gates, launch the next phase agent.