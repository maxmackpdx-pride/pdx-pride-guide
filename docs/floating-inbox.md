# Floating Inbox - Architecture & Handoff Guide

The floating inbox is the single inbox surface on the site: a bottom-sheet
overlay (mobile) / bottom-right panel (desktop FAB) that holds three tabs -
**INBOX**, **POSTS**, **STATS** - and, under INBOX, three account views:
**Personal**, **Admin** (shared keyholder queue), and **Owner** (Owner Desk).
Everything happens **in place** - opening a thread, replying, archiving, and
approving/denying admin items never navigate to a URL.

---

## TL;DR - where to look

Start here, in this order:

| Concern | File |
|---|---|
| **Overlay shell** (tabs, account switcher, in-place thread detail, bottom search) | `client/src/components/InboxOverlay.tsx` |
| **Open/close state + mounting** (context provider, `openSheet`/`toggleSheet`) | `client/src/context/InboxSheetContext.tsx` |
| **Desktop FAB** (the floating button, ≥641px; drag to reposition) | `client/src/components/FloatingInbox.tsx` |
| **Data hook** - threads + all thread actions | `client/src/components/inbox/useInboxThreads.ts` |
| **Personal thread list** (Received/Sent, filters) | `client/src/components/inbox/panel/PersonalView.tsx` |
| **Admin/Owner queue** - every category, mappers, approve/deny mutations | `client/src/components/inbox/panel/QueueView.tsx` |
| **Posts tab** | `client/src/components/inbox/panel/PostsView.tsx` |
| **Stats tab** | `client/src/components/inbox/panel/StatsView.tsx` |
| **Design tokens** (colors `C.*`, fonts, helpers) | `client/src/components/inbox/panel/sheet.ts` |
| **Types** (`Thread`, `ThreadMessage`, `Folder`, …) | `client/src/components/inbox/types.ts` |
| **Avatar** | `client/src/components/inbox/ThreadAvatar.tsx` |
| **Positioning + look** (`.inbox-overlay`, `.inbox-overlay__backdrop`, `.inbox-sheet-host`, mobile bottom offset) | `client/src/index.css` (search `inbox-overlay`) |
| **Full-page /inbox** (separate shell; good styling reference for thread detail) | `client/src/components/inbox/InboxShell.tsx`, `client/src/pages/Inbox.tsx` |
| **All server endpoints** (messages + every admin/owner queue) | `server/routes.ts` |
| **Storage/queries** (`getAdminPendingCount`, `getSubmissions`, `getOwnerDeskItems`, `getPendingBusiness*`, …) | `server/storage.ts` |
| **Consolidated backlog report** (server-rendered) | `server/adminReport.ts` → `GET /api/admin/report` |

---

## How it's wired (data flow)

```
App.tsx
 └─ InboxSheetProvider (context/InboxSheetContext.tsx)   ← open state, mounts overlay in <div class="inbox-sheet-host">
     └─ InboxOverlay (components/InboxOverlay.tsx)        ← tabs, account switcher, in-place ThreadDetail, bottom search
         ├─ useInboxThreads(activeId)                     ← threads + sendMessage/setRead/archive/revealSelf/resolveLineup
         ├─ PersonalView   (INBOX · Personal)             ← thread list; onOpenThread → InboxOverlay sets activeId
         ├─ QueueView mode="admin"  (INBOX · Admin)       ← shared keyholder queue (9 categories)
         ├─ QueueView mode="owner"  (INBOX · Owner)       ← Owner Desk (owner only)
         ├─ PostsView      (POSTS)
         └─ StatsView      (STATS)

FloatingInbox (components/FloatingInbox.tsx)  ← desktop FAB; calls toggleSheet() from the same context
```

- **Opening a thread:** `PersonalView` calls `onOpenThread(id)` → `InboxOverlay.openThread` sets local `activeId` and calls `setRead(id, false)` (marks the latest message read → invalidates `/api/messages/unread-count`, so the badge resets). When `activeId` is set, `InboxOverlay` renders its in-file `ThreadDetail` (back header, message bubbles, reply composer, archive) **instead of** the list, and hides the account tabs / personal toolbar / bottom search. No navigation.
- **The badge count** comes from `/api/admin/pending-count` (`getAdminPendingCount` in `server/storage.ts`). It sums every admin category **plus** promoter requests, business claims/submissions, and logo requests - so the count must match what `QueueView` renders (it does now; see history below).

---

## Message threads (Personal tab)

`useInboxThreads(activeThreadId)` (`components/inbox/useInboxThreads.ts`) is the
single source of truth. It returns `{ threads, loading, sendMessage, setRead,
archive, remove, revealSelf, resolveLineup }`.

| Action | Hook method | Endpoint |
|---|---|---|
| Load inbox / sent lists | (queries) | `GET /api/messages/inbox`, `GET /api/messages/sent` |
| Load full thread (when `activeThreadId` set) | (query) | `GET /api/messages/thread/:id` |
| Send reply | `sendMessage(id, body)` | `POST /api/messages/thread/:id/reply` |
| Mark read (reset badge) | `setRead(id, false)` | `PUT /api/messages/:id/read` + invalidates `/api/messages/unread-count` |
| Archive (client-side, localStorage `pdx-inbox-archived-v1`) | `archive(id)` | - |
| Delete thread | `remove(id)` | `DELETE /api/messages/thread/:id` |
| Reveal identity (anonymous MC threads) | `revealSelf(id)` | `POST /api/messages/thread/:id/reveal` |
| Approve/deny event-talent "lineup" request | `resolveLineup(id, decision)` | `POST /api/talent-request/:reqId/approve|reject` |

---

## Admin queue (INBOX · Admin) - every category

Rendered by `QueueView` (`components/inbox/panel/QueueView.tsx`). Each category
has: a query (fetch), a `mapX` mapper (row shape + which fields display), and an
approve/deny mutation. **This is the file to touch for admin-queue work.**

| # | Category (tag) | What it is | Data shown (mapper) | Actions → endpoint |
|---|---|---|---|---|
| 1 | **Event / Claim** | New event, event edit suggestion, event claim, or promoter application (via Submit page) | title, type, venue+address, date, submitter+email, description, claim reason | Approve `POST /api/admin/submissions/:id/approve` · Decline `.../reject` |
| 2 | **Promoter** | Member applied to be a verified promoter (or pending event-claim submitter) | name, @handle, email, org, event, pitch | Approve `POST /api/admin/promoter-requests/:userId/approve` · Deny `.../deny` |
| 3 | **Venue claim** | User claims a directory listing as owner | venue name, claimant, email, reason | Approve `POST /api/admin/business-claims/:id/approve` · Deny `.../deny` |
| 4 | **New venue** | New business/venue submitted to directory | name, type, address, phone, web, IG, description | Approve `POST /api/admin/business-submissions/:id/approve` · Deny `.../deny` |
| 5 | **Logo** | Venue owner submitted a new logo | venue, image URL | Approve `POST /api/admin/business-logo-requests/:id/approve` · Deny `.../deny` |
| 6 | **Moderation** | Reports/notices for all admins (MC report, new-listing notice, transfer, remove, flag) | type, item/event, requester, proof | Mark reviewed `POST /api/admin/moderation/:id/resolve` |
| 7 | **Missed conn** | Active Missed Connection posts needing a pass | subject, venue/day, poster, body | Clear `POST /api/admin/missed-connections/:id/approve` · Remove `DELETE /api/admin/missed-connections/:id` · Reject `.../reject` |
| 8 | **River Brats** | Report on River Brats beach chat/content | target type+id, reason, reporter, details | Resolve `POST /api/admin/river-brats/reports/:id/resolve` |
| 9 | **Gifting** | Reported gifting post or auto-flagged post | post title, reason, report count, message | Resolve report `POST /api/admin/gifting/reports/:id/resolve` · Reject `POST /api/admin/gifting/:id/reject` |

List endpoints (all `requireAdmin`): `GET /api/admin/submissions`,
`/api/admin/promoter-requests`, `/api/admin/business-claims`,
`/api/admin/business-submissions`, `/api/admin/business-logo-requests`,
`/api/admin/moderation`, `/api/admin/missed-connections`,
`/api/admin/river-brats/reports`, `/api/admin/gifting`.

---

## Owner Desk (INBOX · Owner) - owner only

`QueueView mode="owner"` → `GET /api/admin/feedback` (gated to the primary site
owner; carries contact PII). Item kinds come from `owner_desk_items` +
`feedback_reports` (`getOwnerDeskItems` in `server/storage.ts`).

| Kind (tag) | What it is | Data shown | Action |
|---|---|---|---|
| **Message** (contact) | Site Contact form | name, email, phone, page, message | Reply (mailto) · Mark done |
| **Sponsor** | Sponsorship pitch | name, email, business, sponsorship type, length, message | Reply · Mark done |
| **Bug** | Bug report via feedback form | description, page, severity | Mark done |
| **Feedback** | General feedback | message, page | Mark done |
| **Crash** (auto) | `ErrorBoundary` self-report when the UI crashes - stack trace + user agent, **not** a person | error, stack, page URL, user agent | Mark done |
| **Keyholder / Escalation** | team-access requests / admin escalations to owner | who, what, context | Reply · Mark done |

Resolve → `POST /api/admin/feedback/:id/resolve` (body `{ source: "desk" | "feedback" }`).
Crash reports are created by `client/src/components/ErrorBoundary.tsx` (`category: "CRASH"`).

---

## Known behaviors, recent fixes & gotchas

- **In-place, never navigate.** Reading, replying, archiving, revealing,
  approving/denying, and Owner-Desk resolving all mutate in place. If you add a
  new action, do **not** use `setLocation`/router navigation inside the overlay.
- **Badge vs. queue must agree.** `getAdminPendingCount` (`server/storage.ts`)
  must count every category `QueueView mode="admin"` renders: submissions,
  moderation, promoters, gifting reports, flagged gifting posts, business
  claims/submissions, logo requests, missed connections awaiting review, and
  River Brats reports. Owner Desk is separate (`getOwnerDeskCount`).
- **FAB + mobile Messages badge** use `useInboxAttentionCount` (unread DMs +
  admin queue + owner desk) so backlog is visible without opening the Admin tab.
- **Opening the inbox** with pending queue items defaults to the Admin tab (or
  Owner when only desk items are waiting).
- **Silent-empty on error.** Every queue query does `r.ok ? r.json() : []`, so a
  500 shows an empty section, not an error. When debugging "nothing shows,"
  check the endpoint response, not just the UI.
- **Mobile bottom offset.** `.inbox-sheet-host .inbox-overlay` sits `96px` above
  the viewport bottom because the mobile nav is ~84px tall; `env(safe-area-inset-bottom)`
  resolves to 0 in-browser. Don't drop below that or the composer/search tucks
  under the nav. (`client/src/index.css`, search `inbox-overlay`.)
- **Navy neon frame.** The overlay uses `border: 2px solid var(--neon-blue)` +
  a layered glow to match the site's glowing cards.
- **Two admin surfaces still exist.** `client/src/pages/Admin.tsx` is the older
  full admin page and also fetches business claims/submissions. The floating
  inbox is now the primary surface; keep parity in mind if you change endpoints.

---

## How to run & verify

```bash
npm run build            # tsc types are stripped by esbuild; build won't fail on TS errors
SESSION_SECRET=dev PORT=5050 NODE_ENV=development npx tsx server/index.ts
```

- Log in via `POST /api/auth/login` (`{ email, password }`). The admin/owner
  tabs only render for admins; the primary owner is required for the Owner tab.
- To exercise the admin queue, seed a pending row in each source table
  (`submissions`, `business_claims`, `business_submissions`,
  `business_logo_requests`, `moderation_requests`, `owner_desk_items`; set a
  user's `promoter_status='pending'`), then open the inbox → Admin/Owner.
- The whole backlog in one view: `GET /api/admin/report` (HTML) or
  `?format=json`.

---

## Full item reference (shareable)

A designed, print-friendly version of the "what each item is / data shown / how
to handle" tables above is also published as an artifact for the keyholder team.
This doc is the source of truth for the code paths; that one is for at-a-glance
reference.
