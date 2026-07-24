---
name: pdx-push-phase-1
description: >
  Phase 1 agent — PWA shell and prerequisites for Zaylist push program.
  Manifest, icons, service worker, install UX, iOS standalone detection, HOST_UPDATE
  badge fix. Writes PHASE_1_COMPLETE handoff for Phase 2. Triggers: "phase 1 push",
  "start push phase 1", "PWA shell phase", "/pdx-push-phase-1". Visitor-visible UX
  requires user approval. On finish, hand off to /pdx-push-phase-2 via PM gate.
---

# Phase 1 Agent — PWA Shell + Prerequisites

**Program:** PWA + Web Push · **You are phase 1 of 4**

## Before you start

1. Read `docs/PUSH_NOTIFICATION_PROGRAM.md` — confirm Phase 1 is `NOT_STARTED` or `IN_PROGRESS`
2. Read `docs/PWA_PUSH_IMPLEMENTATION_PLAN.md` — Phase 0 + Phase 1 sections
3. Read `docs/NOTIFICATION_SYSTEM_REFERENCE.md`
4. **No previous handoff** — you are first

### Ask PM (Grok) if unclear

- Install prompt timing (Q3 in program doc — use default if PM silent)
- Icon design direction beyond logo.png source

Add questions to program doc `Open questions` table.

## Your scope

| Ship | Defer to Phase 2+ |
|------|-------------------|
| App icons (192, 512, maskable, apple-touch) | VAPID / push subscribe |
| `manifest.webmanifest` | Notification prefs |
| `vite-plugin-pwa` injectManifest | Dispatch hooks |
| `client/src/sw.ts` — shell caching + **empty push listener stub** | |
| Register SW in `main.tsx` | |
| `client/src/lib/pwa.ts` — `isStandalonePwa()`, install prompt capture | |
| `index.html` PWA meta + manifest link | |
| Fix `HOST_UPDATE` badge in `inboxContext.ts` | |
| Document VAPID generation for Tucker (do not commit keys) | |

## Standing rules

1. **Do not cache `/api/*`** in service worker
2. **Network-first** for HTML navigation (deploy safety)
3. **No** `Notification.requestPermission` in this phase
4. Visitor-visible install UI → **propose and get approval** before shipping
5. `npm run build` must pass before handoff

## Implementation checklist

- [ ] `npm install -D vite-plugin-pwa workbox-precaching workbox-routing workbox-strategies`
- [ ] `client/public/manifest.webmanifest`
- [ ] `client/public/icons/*`
- [ ] `client/src/sw.ts` + vite injectManifest config
- [ ] `client/src/lib/pwa.ts`
- [ ] `index.html` meta tags
- [ ] SW registration in `main.tsx`
- [ ] `inboxContext.ts`: `HOST_MESSAGE` → `HOST_UPDATE`
- [ ] Install UX component (post-login Dashboard — propose first)

## Verification

- Lighthouse PWA → Installable
- Chrome: SW registered, manifest valid
- iOS: Add to Home Screen → standalone mode
- `npm run build` ✅

## When you finish

1. Write `docs/handoffs/PHASE_1_COMPLETE.md` using `docs/handoffs/HANDOFF_TEMPLATE.md`
2. Update `docs/PUSH_NOTIFICATION_PROGRAM.md`:
   - Phase 1 → `COMPLETE`
   - Phase 2 → `NOT_STARTED` (PM accepts gate)
   - Append handoff index row
3. **Stop.** Do not start Phase 2.

### Handoff must include for Phase 2

- Path to `client/src/sw.ts` and how to add push handlers
- `isStandalonePwa()` location
- Icon paths for notification `icon` field
- Whether install UX was approved/shipped
- Any SW update strategy decisions

## Questions for next agent

List anything Phase 2 needs to know in handoff § "For the next phase agent".

## Report to PM

Post completion summary + link to handoff. PM reviews gate 1 before launching `/pdx-push-phase-2`.