# ZAYLIST HAÜS — Engineering Handoff

**For:** the coding agent building the Housing board.
**How to read this:** this is *what* to build, *how it behaves*, and *how complex* each piece is. It is not a UI design and not an implementation prescription. Use the linked ZAYLIST design standards for all styling and components. Full product rationale lives in `HAUS_HOUSING_SPEC_v0.2.md`; this is the build brief. Repo-specific orientation for the coding agent is in Appendix A.

---

## 1. What HAÜS is

HAÜS is ZAYLIST's Housing board — another community board alongside Events, Marketplace, Gifting, and Missed Connections. It helps queer Portland find rooms, roommates, and households they fit into.

It is **not** a rental marketplace (not Zillow/Roommates.com). The behavioral model is a **trusted Facebook Group**: people post in their own words, discovery happens in the feed, and conversations — not algorithms — do the matching. ZAYLIST is the trusted community layer that makes those posts credible.

The one thing no competitor does, and the flagship: **"Forming a HAÜS"** — people build a household *together, before* they have a property, then go find a place as a group.

---

## 2. Hard constraints (these are non-negotiable)

1. **Conduit, not matcher (Fair Housing).** The platform hosts what users write. It must never create discriminatory criteria, and never rank, filter, hide, or steer posts by protected characteristics. Any "compatibility" is a conversation aid the user opted into about themselves — never a score, never a gate.
2. **The platform never handles money.** No rent, deposits, or fees flow through ZAYLIST. Rent/deposit amounts are informational text only.
3. **Shared-living focus.** Center roommate/household living. Whole-unit landlord listings may exist but get no special treatment.
4. **Compose, don't fork.** Reuse existing platform systems (below). Do **not** build a second profile, inbox, chat, notification, permissions, moderation, or media system.
5. **Use the design standards.** All UI is built on the existing ZAYLIST design system (link provided separately). Housing cards are new *variants* of the existing card system, not new components. Don't invent colors, fonts, or one-off components.

---

## 3. Reuse these existing systems (do not rebuild)

| Need | Reuse |
| --- | --- |
| Login / accounts | Existing ZAYLIST accounts |
| Profiles | Extend with optional housing sections (budget, move timeline, neighborhoods, living style, accessibility) |
| Discovery feed | Existing home/hub feed — Housing posts are new feed items/cards |
| Messaging ("Chat with HAÜS") | Existing group-conversation / inbox system — no new chat |
| Notifications & reminders | Existing notification + reminder system (drives saved-post alerts and "important dates") |
| Photos / media | Existing media upload |
| Moderation / reporting | Existing moderation, plus new report categories |
| Maps | Existing map system (approximate location) |
| Roles / permissions | Existing member-role model (powers the HAÜS Lead) |
| Cards & styling | Existing design system / card system |

If a capability could serve another board later, build it as a platform capability, not a Housing-only one.

---

## 4. Features — what each does, how it works, and complexity

Complexity is a rough build-effort signal: **Low** = mostly reuse + config, **Med** = new UI + data + wiring, **High** = new coordinated multi-user behavior.

### 4.1 Three post types — **Med**
A Housing post is one thing that can be one of three types:
- **Offering a Room** — an existing household has a room open.
- **Looking for Housing** — a person needs a place.
- **Forming a HAÜS** — people teaming up to rent together (see 4.8).
All three share one underlying post object; type controls which fields and card variant show.

### 4.2 Posting flow — **Low/Med**
Posting must take under a minute. It opens with one question — "What are you looking for?" (the three types) — then a description, optional photos, optional structured fields, done. Users can enrich or change the post later. Long forms are prohibited; low friction is a requirement, not a nicety.

### 4.3 Fluid posts: convert + openness flags — **Med**
- A post can **convert type** while keeping the same post, its replies, and history. Specifically **Looking for Housing ⇄ Forming a HAÜS** (converting to a HAÜS makes the poster its Lead and adds the workspace; switching back archives that workspace, nothing lost).
- **Openness flags** are lightweight chips a user can toggle: a "Looking for Housing" post can flag *"open to forming/joining a HAÜS"*; an "Offering a Room" post can flag *"open to becoming a HAÜS."* Shown as a chip on the card. These are user-declared intent, not platform steering.

### 4.4 Feed-first discovery — **Low/Med**
Discovery starts in the feed by scrolling, not a blank search page. HAÜS posts appear as feed items. Search and filters exist for **refinement** only. The feed is the front door.

### 4.5 The HAÜS card (3 variants) — **Med**
Cards are introductions, not ads — a person should grasp "could I live here / with these people?" in ~5 seconds. Variants for each post type. Show the *people* (household avatars, "Meet the household"), not just the property. Cards carry community-context chips (4.9) and the openness chip (4.3) — never a compatibility number. Built as variants of the existing card system.

### 4.6 Post detail — **Med**
A lightweight, modular detail view that answers the obvious questions before someone has to ask: the home, who lives there, house culture/rules (as structured chips, not essays), honest finances (monthly vs move-in separated, informational only), accessibility as standard info, approximate neighborhood (exact address private until appropriate), trust signals. One always-visible primary action: **Chat**. No application form between interest and a first message.

### 4.7 Chat with HAÜS — **Low**
"Chat" opens a conversation using the existing group-conversation/inbox system, with the post attached. No new messaging anything.

### 4.8 Forming a HAÜS — the workspace — **High** (this is the flagship and the hardest part)
Two flavors, picked at creation (a field on the post): **find a place together** (no property yet — form the group, then hunt) or **place in mind** (the founder already has a specific prospected place / is ready to sign a lease, and needs people to fill it and sign together). "Place in mind" attaches a property up front (seeds the shortlist as the target) and leans on the lease deadline in the important dates. Both are still people-first and form the household together; "place in mind" differs from "Offering a Room" because nobody has signed and the household doesn't exist yet.
A forming HAÜS is a small shared workspace, built on existing group-chat + roles + reminders + saved-links:
- **The Lead** — the person who forms it. A responsibility role (reuse existing roles): invite/add/remove members, approve/decline join requests, manage important dates, curate the shortlist, edit the post. Can name a **co-lead** or hand off (so it survives if the founder leaves).
- **Members** — can contribute (post links, comment, react, add dates). Join is by request or invite; requests open a conversation, they don't auto-add.
- **Shared property shortlist** — members paste **external listing links** (Zillow, Craigslist, a Facebook post, etc.); each becomes a saved card with a thumbnail, group reactions/comments, and a status (Interested → Touring → Applied → Passed/Chosen). These are the group's private bookmarks — ZAYLIST does **not** host or re-list those properties.
- **Important dates** — target move-in, tours, application deadlines, lease-signing, deposit-due — reusing the existing reminder/notification system so the group gets nudged.
- **Waitlist (full HAÜS)** — when a HAÜS marks itself full, its join action becomes **Join the waitlist** instead of a dead end. Waitlisters queue in the same request-to-join list; the Lead can pull from the waitlist when a spot opens, and waitlisters are notified when one does (or when the HAÜS reopens). Reuses the existing request + notification systems — no new mechanism.
- **Lifecycle** — create → discover in feed → request/invite → plan together (chat + shortlist + dates) → mark "we're full" (join action becomes the waitlist) → convert to an actual place (the HAÜS persists; can later post "Offering a Room," offered to the waitlist first).
This is where the product's value concentrates. It's High complexity because it's multi-user coordinated state, but every piece rides an existing system.

### 4.9 Community context & trust — **Med**
Instead of a compatibility score, show real community overlap as trust signals: mutual connections, shared events attended, time on ZAYLIST, verifications. Most of this is derivable from data ZAYLIST already has (follows, event attendance, account age). Especially important for Forming a HAÜS, where people join near-strangers.

### 4.10 Compatibility → conversation prompts — **Med (later, not v0.1)**
Never a score or filter. Optional prompts drawn from what people said about themselves ("you both work remotely," "different guest expectations — worth discussing"), scoped to logistics/lifestyle, purely to help a conversation. See constraint #1.

### 4.11 Moderation & safety — **Low**
Reuse existing moderation; add report categories: fake listing, scam, unsafe housing, discrimination, unauthorized sublease. Standard block/report. Because the platform never touches money, deposit-fraud-through-the-platform is structurally impossible; community trust is the main defense.

---

## 5. Build phases

- **v0.1 (ship first, keep it small):** the three post types, one-question composer, openness flags, feed-first discovery, the three card variants, post detail, "Chat with HAÜS." Founder does matching by hand. **No** compatibility, applications, tours, or the full workspace yet.
- **v0.2:** the Forming-a-HAÜS workspace (Lead + members, shortlist, important dates), the full-HAÜS waitlist, post-type conversion, community-context chips, verification badges, saved posts/searches.
- **v0.3:** conversation prompts (soft compatibility); optional structured application + tours for households that want them.
- **Later:** generalize community-context/compatibility as a shared platform service for other boards.

---

## 6. Definition of done — v0.1

- A user can post any of the three types in under a minute and see it in the feed.
- Housing posts render as on-brand card variants (design system), showing the people, not just the property.
- A post has a detail view with a working "Chat" that opens the existing group conversation.
- A user can toggle an openness flag and it shows on the card.
- Posts can be reported into the existing moderation queue.
- Nothing forks an existing system; all styling comes from the design standards.
- No money, scoring, filtering by protected traits, or long application anywhere.

---

## 7. Decisions the founder still owns (flag, don't guess)

- Exact structured fields per post type (keep minimal).
- Neighborhood granularity / when an address becomes visible.
- Which verifications matter at launch.
- Fair Housing review by an Oregon/Portland attorney before public launch (required before opening to the public).

---

## Appendix A — Repo orientation for the coding agent

Written for a Claude Code agent working directly in `maxmackpdx-pride/pdx-pride-guide`. This is orientation and gotchas, not a schema to copy.

**Stack & run.** Node/Express + TypeScript on the `tsx` runtime (dev runs without a compile step). React + Vite client. SQLite via `better-sqlite3`, Drizzle schema in `shared/schema.ts`. Auto-deploys to Railway on push to `master`. Production build bundles the server with esbuild into a single `dist/index.cjs` (`npm run build`).

**Typecheck baseline (do this before you commit).** `npx tsc --noEmit` reports a small number of *pre-existing* errors unrelated to Housing. Record that count first; your change must not increase it. Do not assume the baseline is zero.

**Production-bundle gotcha (this bit us once).** Because the server is bundled to one CJS file, anything read from disk at *module-load* time (fonts, files by relative path) works in dev but crashes the Railway deploy. Import/bundle assets, or serve them from `client/public/`.

**Learn the "community board" pattern from what exists — mirror it, don't reinvent.** Gifting, Missed Connections, and the Gig Board are each a full board end to end. For each: table + insert schema in `shared/schema.ts`, storage methods in `server/storage.ts`, routes under `server/routes.ts` (registered in `registerRoutes`), the page in `client/src/pages/`, the card in `client/src/components/board/`. Housing is a new board of the same shape. (Gifting is the closest analog: a user-posted listing with photos, status, reports, and "raise your hand" → opens a message.)

**Design system = the system default.** Tokens: `client/src/index.css`. Deep-glass card system: `client/src/components/ds/tokens/glass.css`. Reusable components: `client/src/components/ds/`. The live-is-truth rule: `docs/LIVE_DESIGN_STANDARD.md`. Housing cards are variants on the deep-glass card. **Footgun:** any element that sets its own accent (`--c`) must also carry the `.pdx-glass-rebind` class, or it silently falls back to root cyan.

**Feed integration (this is where discovery happens).** The home/hub feed is assembled server-side in `getHubFeed` (`server/storage.ts`), typed in `shared/hubFeed.ts`, rendered by `client/src/components/hub/sections/HubFeed.tsx` and `HubFeedCard.tsx`, with the poster-deck card in `FeedEventDeck.tsx`. To make Housing posts discoverable, add a new feed item kind here plus a Housing card variant. Note: the feed candidate query orders by *listing recency* and condenses per author — follow that pattern so new Housing posts actually surface (there was a real bug where ordering by a future date buried new items).

**"Chat with HAÜS" = the existing messaging system.** Message/thread model is in `shared/schema.ts` (`messages`, group `thread_id`); `storage.sendMessage(...)` starts/append threads. See how Gifting, Gig Board, and Missed Connections open a conversation from a post. Floating inbox: `useInboxSheet` / `InboxOverlay`. Reuse this for group chat; do not add a second messaging system.

**Other integration points.** Media upload: `POST /api/upload/*` (multer) — mirror `/api/upload/gifting`. Moderation: `storage.createModerationRequest(...)`. Primary nav entry: `PRIMARY_NAV` in `client/src/lib/siteNav.ts`. Client routes: `client/src/App.tsx`. Day colors / brand tokens: `shared/eventWeek.ts` + `index.css`.

**Content rule.** No em dashes anywhere in user-facing copy — hard project rule. Match the existing voice.

**Suggested first vertical slice (lowest risk).** Ship **"Looking for Housing"** end to end first — it's single-user, no coordinated state: schema + create/list/read routes + the one-question composer + a feed card variant + a detail view + a "Chat" button that opens a thread. Then add **Offering a Room**, then the **Forming-a-HAÜS** workspace last (the only High-complexity piece). Keep each a small, reviewable PR.

**Legal guardrail is a build constraint, not just product.** Do not build dropdowns or filters that hide or rank listings by protected characteristics. Preferences stay user-authored free text; "compatibility" (a later phase) is conversation prompts only, never a score or gate.
