# PDX Pride Guide — Notification System Reference

> Canonical reference for building the notification system (in-app today, push tomorrow).
> Last updated: 2026-07-02

## Status

| Layer | Status |
|-------|--------|
| In-app Inbox (`messages` table) | **Live** |
| Nav unread dots (HUB + ADMIN) | **Live** |
| On-page host bulletins | **Live** |
| Live WebSocket RSVP refresh | **Live** |
| Web Push / PWA install | **Not built** |
| Native iOS/Android apps | **Not built** |

Production URL: `https://www.prideguidepdx.com`

---

## User types

Users are one base type plus optional hats:

| Type | Who | Notification surfaces |
|------|-----|----------------------|
| **Visitor** | Not logged in | On-page + live only |
| **Member** | Any logged-in account | Inbox + HUB dot |
| **Promoter** | Submits/claims events | Member + system inbox messages |
| **Event Host** | Primary or co-host | Member + host/talent/RSVP messages |
| **Talent** | On event lineup | Member + lineup messages |
| **Admin** | Main admin or sub-admin | Admin queue + everything Member gets |

---

## Four delivery buckets

```
1. INBOX      — Private messages (logged-in users)
2. ADMIN QUEUE — Review items (admins only)
3. ON-PAGE    — Public updates while browsing
4. LIVE       — WebSocket refresh (no stored message)
```

---

## Bucket 1: Inbox

**Route:** `/inbox`  
**API:** `GET /api/messages/inbox`, `GET /api/messages/unread-count`  
**Indicator:** Pink dot on HUB nav when `unread.count > 0`

All items live in `messages` with a `context_type` column (camelCase `contextType` in TS).

### Simplified groups

| Group | `contextType` values |
|-------|---------------------|
| **People wrote you** | `THREAD`, `MISSED_CONNECTION`, `GIG`, `GIFTING`, `CHECK_IN`, `EVENT_HOST` |
| **Your event** | `HOST_UPDATE`, `EVENT_TALENT`, `EVENT_TALENT_REQUEST`, `EVENT_HOST` |
| **From PDX Pride Guide** | `SUBMISSION`, `EVENT_CLAIM`, `PROMOTER`, `GUIDE_UPDATE` |

### Full catalog

#### Member (any logged-in user)

| Notification | Trigger | From | `contextType` | Inbox badge |
|--------------|---------|------|---------------|-------------|
| Thread reply | Reply in existing thread | User | inherits original | — |
| Missed Connection reply | Response to your post | User | `MISSED_CONNECTION` | MISSED CONNECTION |
| Pride Werk message | Message on your gig post | User | `GIG` | — |
| Gifting interest | Someone wants your gift | User | `GIFTING` | — |
| ISO offer | Offer on your ISO post | User | `GIFTING` | — |
| Gifting pickup chosen | Poster picked you | User | `GIFTING` | — |
| Check-in message | RSVP'd attendee messages you | User | `CHECK_IN` | — |
| Message to host | Question about your event | User | `EVENT_HOST` | — |

#### Promoter

| Notification | Trigger | From | `contextType` |
|--------------|---------|------|---------------|
| Submission approved | Admin approves NEW_EVENT | Site owner | `SUBMISSION` |
| Submission rejected | Admin rejects NEW_EVENT | Site owner | `SUBMISSION` |
| Claim approved (submission path) | Admin approves CLAIM submission | Site owner | `SUBMISSION` |
| Claim approved (moderation path) | Admin approves CLAIM request | Site owner | `EVENT_CLAIM` |
| Claim rejected | Admin rejects claim | Site owner | `EVENT_CLAIM` |
| Promoter approved | Admin approves promoter app | Site owner | `PROMOTER` |
| Promoter denied | Admin rejects promoter app | Site owner | `PROMOTER` |

#### Event Host

| Notification | Trigger | From | `contextType` |
|--------------|---------|------|---------------|
| Host update sent | Host posts dashboard update | Host → RSVPs | `HOST_UPDATE` |
| Co-host invite | Added as co-host | Host | `EVENT_HOST` |
| Talent request | User requests lineup spot | User | `EVENT_TALENT_REQUEST` |
| Attendee message | Message about event | User | `EVENT_HOST` |

#### Talent

| Notification | Trigger | From | `contextType` |
|--------------|---------|------|---------------|
| Tagged on lineup | Host adds you | Host | `EVENT_TALENT` |
| Request approved | Host/admin approves | Host/Admin | `EVENT_TALENT` |
| Request declined | Host/admin denies | Host/Admin | `EVENT_TALENT` |

#### RSVP'd attendee

| Notification | Trigger | From | `contextType` |
|--------------|---------|------|---------------|
| Host update | Host posts update | Host | `HOST_UPDATE` |

### Known bug

`client/src/lib/inboxContext.ts` checks `HOST_MESSAGE` for the badge, but the server sends `HOST_UPDATE`. Host updates show **no badge** in Inbox until fixed.

### System sender

Automated messages use `notifyGuideInbox()` in `server/storage.ts`, which sends from the site owner account with default `contextType: GUIDE_UPDATE` unless overridden.

---

## Bucket 2: Admin queue

**Route:** `/admin` → Inbox tab  
**API:** `GET /api/admin/pending-count`  
**Indicator:** Dot on ADMIN nav

Not the user Inbox — this is a review queue.

| Kind (`AdminInbox.tsx`) | Trigger |
|-------------------------|---------|
| `submission` | NEW_EVENT / CLAIM / EDIT submitted |
| `promoter` | Promoter application pending |
| `talent` | Lineup request on unclaimed event |
| `moderation` | CLAIM / REMOVE / FLAG / TRANSFER request |
| `gifting_post` | First-time poster held `PENDING` |
| `gifting_report` | User reported gifting post |
| `feedback` | Soft-launch bug/feedback report |

**Simplified admin categories:**

| Category | Includes |
|----------|----------|
| Needs approval | Submissions, Promoters, Talent, Gifting posts |
| Needs moderation | Moderation requests, Gifting reports |
| Needs triage | Feedback |

---

## Bucket 3: On-page

| What | Where | Audience |
|------|-------|----------|
| Host bulletin | Event detail (pinned host messages) | Everyone |
| RSVP bubbles | Event cards | Everyone (PII masked until RSVP) |
| Lineup tags | Event cards | Everyone |
| Missed Connections board | `/missed-connections` | Everyone |
| Gifting / Gig boards | Public listings | Everyone |
| Toast popups | After user's own actions | Self only |

---

## Bucket 4: Live

| What | Mechanism | Audience |
|------|-----------|----------|
| RSVP count/bubbles | WebSocket `/ws/attendance` | Open pages |
| Map pulse pins | Refetch `/api/events/mine/check-ins` | Logged-in with RSVPs |

---

## Gaps (no notification today)

- Gifting post approved/rejected by admin
- Gig post removed/changed by admin
- Gifting interest not chosen (silent decline)
- Submission received confirmation ("we got it")
- Co-host / talent removal
- FLAG / TRANSFER request outcome (only claim approve/reject notifies)

---

## Push category mapping (planned)

Collapse 14 `contextType` values into 4 user-facing toggles:

| Push category | Setting label | Includes |
|---------------|---------------|----------|
| `messages` | Direct messages | THREAD, MISSED_CONNECTION, GIG, GIFTING, CHECK_IN, EVENT_HOST |
| `my_events` | My events | HOST_UPDATE, EVENT_TALENT, EVENT_TALENT_REQUEST |
| `account` | Account updates | SUBMISSION, EVENT_CLAIM, PROMOTER, GUIDE_UPDATE |
| `admin` | Admin alerts | Admin queue only (separate channel, admin devices) |

---

## Key code locations

| Area | Files |
|------|-------|
| Schema | `shared/schema.ts` → `messages` table |
| Send message | `server/storage.ts` → `sendMessage()`, `notifyGuideInbox()`, `notifyAttendeesOfHostUpdate()` |
| Routes | `server/routes.ts` → `/api/messages/*` |
| Inbox UI | `client/src/pages/Inbox.tsx`, `client/src/lib/inboxContext.ts` |
| Nav dots | `client/src/components/Nav.tsx` |
| Admin queue UI | `client/src/components/admin/AdminInbox.tsx` |
| Live RSVP | `server/attendanceWs.ts` |

---

## Persistence

Add to `server/persistence.ts` → `PERSISTENCE_SURFACES` when push ships:

- `push_subscriptions` table
- `notification_preferences` table (or columns on `users`)

Env vars (planned): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto: or https:)