# PWA + Web Push Implementation Plan

> Research-backed plan to make Zaylist installable and deliver working push notifications.
> Companion doc: [NOTIFICATION_SYSTEM_REFERENCE.md](./NOTIFICATION_SYSTEM_REFERENCE.md)

## Executive summary

Zaylist is a **Vite + React SPA on Express** with **session-cookie auth**. There is no service worker, manifest, or push infrastructure today. The fastest path to a working web app with push:

1. **PWA shell** — manifest + icons + service worker for installability and offline app shell
2. **Web Push** — VAPID keys, subscription storage, `web-push` dispatcher
3. **Notification bridge** — hook `sendMessage()` and admin queue events to push delivery
4. **Declarative Web Push** — Safari/iOS Home Screen compatibility from day one

Target: **logged-in users on HTTPS** who opt in after a contextual prompt.

---

## Current stack audit

| Item | Status | Notes |
|------|--------|-------|
| HTTPS | ✅ | `www.zaylist.com`, Railway TLS |
| SPA routing | ✅ | Express fallback in `server/static.ts` |
| Session auth | ✅ | `credentials: "include"` — push subs must be per-user server-side |
| Service worker | ❌ | None |
| Web manifest | ❌ | None |
| Apple meta tags | ❌ | No `apple-mobile-web-app-capable` |
| Push API usage | ❌ | None |
| `web-push` dependency | ❌ | Not installed |

### Constraints to respect

- **Hash routes migrated away** — clean paths (`/events`, `/inbox`); push `navigate` URLs must use same paths
- **Deploy cache busting** — `index.html` is `no-cache`; SW update strategy must not strand users on stale bundles (see existing bundle-reload script in `index.html`)
- **Helmet CSP disabled** — enables easier SW rollout; tighten CSP in Phase 2
- **SQLite on Railway volume** — new tables persist via `/data` like everything else
- **No localStorage for auth** — project rule; push prefs live server-side only

---

## Platform support matrix

| Platform | Install (Add to Home Screen) | Web Push | Notes |
|----------|------------------------------|----------|-------|
| **Chrome Android** | ✅ | ✅ FCM-backed | Full support |
| **Chrome Desktop** | ✅ | ✅ | Full support |
| **Firefox** | ✅ | ✅ Mozilla push | Full support |
| **Safari macOS** | ✅ | ✅ | Uses Apple Push Notification service |
| **Safari iOS** | ✅ PWA only | ✅ iOS 16.4+ **Home Screen only** | Regular Safari tabs cannot subscribe |
| **Samsung Internet** | ✅ | ✅ | Chromium-based |

### iOS critical path

iOS web push **only works when the site is installed to the Home Screen** as a PWA. Plan UX accordingly:

1. Detect `standalone` display mode → offer push opt-in
2. If in Safari tab (not installed) → show "Add to Home Screen to get notifications" education sheet
3. Use **Declarative Web Push** format so notifications survive ITP service worker eviction

---

## Recommended architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (PWA)                          │
│  manifest.json · SW registration · pushManager.subscribe()   │
│  Notification prefs UI (Dashboard)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/push/subscribe
                           │ PUT  /api/users/me/notification-prefs
┌──────────────────────────▼──────────────────────────────────┐
│                     Express (Railway)                        │
│  push_subscriptions table · notification_preferences         │
│  dispatchPush(userId, payload) — called from sendMessage()   │
│  web-push (VAPID) → browser push endpoints                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    Chrome/FCM        Mozilla Push       Apple APNs
    (Web Push)        (Web Push)         (Web Push via Safari)
```

### Why not OneSignal/Firebase-only?

- **DIY with `web-push`** keeps one code path for all browsers including Safari web push
- No third-party SDK in the privacy-sensitive queer community app
- Inbox already exists — push is a delivery channel, not a new messaging system
- Cost stays flat at scale

Consider OneSignal later only if ops burden grows.

---

## Phase plan

### Phase 0 — Prerequisites (1 day)

- [ ] Generate VAPID key pair (`npx web-push generate-vapid-keys`)
- [ ] Add Railway env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:hello@zaylist.com`
- [ ] Create app icons: 192×192, 512×512, maskable variant, apple-touch-icon 180×180
- [ ] Fix `HOST_UPDATE` badge bug in `inboxContext.ts`

### Phase 1 — PWA shell (2–3 days) → Agent: `pdx-pwa-shell`

**Goal:** Installable app, offline shell, no push yet.

1. Add `vite-plugin-pwa` with `injectManifest` strategy (custom SW for push later)
2. Create `client/public/manifest.webmanifest`:
   - `name`: Zaylist
   - `short_name`: Zaylist
   - `start_url`: `/`
   - `display`: `standalone`
   - `theme_color` / `background_color`: match site neon-on-black
   - `icons`: 192, 512, maskable
3. Add to `index.html`:
   - `<link rel="manifest" href="/manifest.webmanifest">`
   - `<meta name="theme-color" content="#000000">`
   - `<meta name="apple-mobile-web-app-capable" content="yes">`
   - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
   - `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`
4. Service worker (`client/src/sw.ts`):
   - Precache app shell (index, fonts, core CSS)
   - **Do not** precache API responses
   - Network-first for navigation (avoid stale SPA after deploy)
   - Stale-while-revalidate for hashed `/assets/*`
5. Serve `sw.js` from `dist/public/` via existing static middleware
6. Register SW in `main.tsx` after load (not blocking render)
7. Install prompt component: show after 2nd visit or post-login, dismissible

**Offline scope (minimal):** cached shell + "You're offline" banner. Events data stays network-only (Pride weekend needs fresh data).

**Acceptance criteria:**
- Lighthouse PWA installable ✅
- Add to Home Screen works on iOS Safari and Android Chrome
- App opens standalone without browser chrome
- Deploy does not break cached users (SW update + existing bundle-reload fallback)

### Phase 2 — Web Push client + API (2–3 days) → Agent: `pdx-web-push`

**Goal:** Users can subscribe; server can send a test push.

#### Database (`shared/schema.ts`)

```sql
push_subscriptions (
  id, user_id, endpoint, p256dh, auth,
  user_agent, platform, created_at, last_used_at, active
)

-- Option A: columns on users
users.notification_prefs JSON  -- { messages, my_events, account, admin }

-- Option B: separate table (cleaner for audit)
notification_preferences (user_id, category, enabled)
```

#### API routes

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/push/vapid-public-key` | Return public key for subscribe |
| `POST` | `/api/push/subscribe` | Save subscription (requireAuth) |
| `DELETE` | `/api/push/subscribe` | Unsubscribe endpoint |
| `GET` | `/api/users/me/notification-prefs` | Read prefs |
| `PUT` | `/api/users/me/notification-prefs` | Update prefs |
| `POST` | `/api/push/test` | Admin-only test push |

#### Client (`client/src/lib/pushNotifications.ts`)

1. Feature detect: `serviceWorker`, `PushManager`, `Notification`
2. Permission flow: contextual prompt on Dashboard or after first inbox message
3. Subscribe via `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`
4. POST subscription JSON to server
5. Handle `pushsubscriptionchange` — re-subscribe and PATCH server
6. iOS gate: if not `standalone`, show install instructions instead of permission prompt

#### Service worker push handler

Support **both** formats:

**Declarative (preferred — Safari/ITP safe):**
```json
{
  "web_push": 8030,
  "notification": {
    "title": "Host update: Drag Brunch",
    "body": "Doors moved to 2pm",
    "navigate": "https://www.zaylist.com/inbox?thread=abc123",
    "app_badge": "3"
  }
}
```

**Imperative fallback (older browsers):**
```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
```

**Acceptance criteria:**
- Android Chrome: subscribe → test push → tap opens correct page
- iOS Home Screen PWA: same flow
- Unsubscribe clears server row
- 410 from push endpoint marks subscription inactive

### Phase 3 — Notification dispatch bridge (2–3 days) → Agent: `pdx-notification-dispatch`

**Goal:** Real inbox events trigger push automatically.

#### Central dispatcher

```typescript
// server/push/dispatch.ts
async function dispatchPushForUser(userId: number, payload: PushPayload): Promise<void>
```

Call from:
- `storage.sendMessage()` — after insert, if recipient has prefs enabled for category
- `notifyGuideInbox()` — account category
- `notifyAttendeesOfHostUpdate()` — my_events category (batch)
- Admin queue (optional): new submission → admin users with `admin` pref

#### Category mapping

See [NOTIFICATION_SYSTEM_REFERENCE.md](./NOTIFICATION_SYSTEM_REFERENCE.md#push-category-mapping-planned).

#### Payload builder

| `contextType` | Push title template | Deep link |
|---------------|--------------------|-----------|
| `HOST_UPDATE` | Host update: {event} | `/inbox?thread={threadId}` |
| `MISSED_CONNECTION` | New missed connection reply | `/inbox?thread={threadId}` |
| `GIG` | Gig Werk message | `/inbox?thread={threadId}` |
| `GIFTING` | Gifting update | `/inbox?thread={threadId}` |
| `SUBMISSION` | Submission update | `/dashboard` |
| `EVENT_TALENT_REQUEST` | Lineup request | `/inbox?thread={threadId}` |

#### Batching / dedup

- Host update to 50 RSVPs: send individual pushes (or collapse if same event within 5 min — Phase 4)
- Don't push for messages user sends themselves
- Don't push if user is active on site (optional Phase 4: Page Visibility API heartbeat)

#### Admin push (optional Phase 3b)

Separate high-priority channel for admins when `pending-count` increases.

**Acceptance criteria:**
- Host posts update → RSVP'd users with `my_events` enabled get push
- New inbox message → recipient gets push if `messages` enabled
- Submission approved → promoter gets push if `account` enabled
- Prefs off → no push, inbox still works

### Phase 4 — Polish (ongoing)

- [ ] Notification prefs UI on Dashboard (4 toggles)
- [ ] iOS "Add to Home Screen" onboarding card
- [ ] Badge API for installed PWA (`app_badge` in declarative payload)
- [ ] Quiet hours (optional, Portland timezone default)
- [ ] CSP hardening with SW allowed
- [ ] Close gaps from reference doc (submission received confirmation, etc.)
- [ ] E2E test checklist for Codex UAT

---

## Technical decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PWA plugin | `vite-plugin-pwa` injectManifest | Custom SW needed for push; integrates with Vite build |
| Push library | `web-push` (Node) | Standard VAPID; works with all browser push services |
| Subscription storage | SQLite `push_subscriptions` | Matches existing stack; persists on `/data` volume |
| Auth for subscribe | Session required | No anonymous push; ties sub to user_id |
| Payload format | Declarative first | Safari ITP + iOS reliability |
| Offline data | Shell only | Pride event data must be fresh |
| Permission timing | Post-login, contextual | iOS allows one prompt; don't waste on page load |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| iOS users in Safari tab expect push | Clear install-first UX; detect `display-mode: standalone` |
| SW caches stale bundle after deploy | Network-first navigation + existing bundle-reload script + `skipWaiting` prompt |
| Push spam on host updates | User toggle + batch/dedup |
| Dead subscriptions | Prune on 410/404 from `web-push` |
| Session expired but push sub exists | Sub tied to user_id; logout does not delete sub (user may want pushes while logged out on phone — discuss) |
| VAPID key rotation | Support multiple keys during transition |

---

## Agent ownership

**Program manager:** `/pdx-push-pm` (Grok — gates, handoffs, continuity)

| Phase | Agent | Slash command | Handoff |
|-------|-------|---------------|---------|
| 1 | PWA shell + prereqs | `/pdx-push-phase-1` | `docs/handoffs/PHASE_1_COMPLETE.md` |
| 2 | Web push infrastructure | `/pdx-push-phase-2` | `docs/handoffs/PHASE_2_COMPLETE.md` |
| 3 | Inbox → push dispatch | `/pdx-push-phase-3` | `docs/handoffs/PHASE_3_COMPLETE.md` |
| 4 | Polish & ship | `/pdx-push-phase-4` | `docs/handoffs/PHASE_4_COMPLETE.md` |

Master status: [PUSH_NOTIFICATION_PROGRAM.md](./PUSH_NOTIFICATION_PROGRAM.md)

Execute in order: **phase-1 → phase-2 → phase-3 → phase-4**. One agent at a time; PM accepts each gate before the next starts.

---

## Verification checklist (Codex UAT)

- [ ] Lighthouse: PWA installable, HTTPS, SW registered
- [ ] Android Chrome: install → login → enable notifications → receive test push → tap opens inbox
- [ ] iOS: Add to Home Screen → open standalone → enable notifications → host update push arrives
- [ ] Prefs off: no push, inbox still populated
- [ ] Logout/login: subscription persists (or re-prompt — document chosen behavior)
- [ ] Deploy mid-session: app recovers without white screen
- [ ] `GET /api/admin/persistence` still OK after new tables

---

## Dependencies to add

```bash
npm install web-push
npm install -D vite-plugin-pwa workbox-precaching workbox-routing workbox-strategies
```

## Env vars (Railway)

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:hello@zaylist.com
```