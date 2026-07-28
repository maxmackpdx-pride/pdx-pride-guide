# ZAYLIST HAÜSING — Engineering Handoff

**For:** the coding agent building the Housing board.
**How to read this:** this is *what* to build, *how it behaves*, and *how complex* each piece is. It is not a UI design and not an implementation prescription. Use the linked ZAYLIST design standards for all styling and components. Full product rationale lives in `HAUS_HOUSING_SPEC_v0.2.md`; this is the build brief. Repo-specific orientation for the coding agent is in Appendix A.

> **Design reference:** the interactive prototype and its notes live in `docs/design-handoff-hausing/` (`README.md` for the visual/interaction decisions, `TITLE_MOTIF.md` for the name-over-photo algorithm).

---

## 1. What HAÜSING is

HAÜSING is ZAYLIST's Housing board — another community board alongside Events, Marketplace, Gifting, and Missed Connections. It helps queer Portland find rooms, roommates, and households they fit into. (**HAÜSING** is the board; **a HAÜS** is a single household formed on it.)

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

### 4.1 Four post types — **Med**
A Housing post is one thing that can be one of four types:
- **Offering a Room** — an existing household has a room open.
- **Looking for Housing** — a person needs a place.
- **Forming a HAÜS** — people teaming up to rent together (see 4.8).
- **Managed Property** — a property manager/landlord posts a whole unit for rent (see 4.1a).
All four share one underlying post object; type controls which fields and card variant show.

**4.1a Managed Property (the 4th type) — Low/Med.** A straight whole-unit rental listing posted by a property manager/landlord — the one non-peer, non-household type. Build it as another value of the post-type enum, not a separate system. Differences from the roommate types, all of which *reduce* work except verification:
- **Purple card variant.** Same card *shape* as Offering a Room, `--c` set to purple (must also carry `.pdx-glass-rebind`, or it falls back to root cyan — see design-system footgun). A **"Property Manager" verified badge** replaces the household/avatar area.
- **No household UI.** No avatar stack, no "Open" slots, no off-platform roommates/pets, no openness flag, no compatibility. Fields are unit-level: property/building name, cover photo, rent, beds/baths, availability date, neighborhood, description.
- **No forced HAÜS suffix.** Uses the real property name (skip the locked-suffix logic from 4.2 for this type).
- **No type conversion.** A Managed Property post does not convert to/from the seeker types (4.3 conversion applies only to Looking ⇄ Forming).
- **No request-to-chat — link out instead.** Managed Property does NOT use 4.7. Store a **`sourceUrl`** (deep link to the unit on the PM's rental site); the card/detail primary action is an external **"View listing on [manager]'s site"** link. Renters inquire/apply on the manager's site, not on-platform. (The community action, "Build a HAÜS" 4.1b, still lives on the card.)
- **Verification gate → also turns on a scraper.** Only verified property-manager accounts get this type (reuse the directory business/verification signal). Verification does two things: badges them, and **registers their rental website as an auto-ingest source** (below). **Mandatory and free — no unverified path exists.** There is no unverified or "list-first" state; an un-approved PM has no listings on the board at all. Never put verification, the badge, or any safety step behind payment — if monetization is added later it gates *service* features (distribution, analytics, featured), never the verification/safety layer. Don't build a free-unverified tier.
- **PM can see interest.** A verified PM has a real account, so they can view the "N groups forming" interest (4.1b) and members. Visible, no obligation.
- **Fair Housing:** whole-unit landlord listings get full FHA scrutiny and **no matching/steering** — keep it a plain informational listing (this is already the hard constraint in §2/§0). Money still never touches the platform.
- **Property Manager is its own account type — model on `promoters`.** A PM is a distinct website user type (like promoters), not a normal member. Mirror the existing `promoters` table in `shared/schema.ts` (session-based account, `status` active/suspended) — e.g. a `property_managers` table — and give each Managed Property listing a `propertyManagerId` owner. **Permission matrix (enforce server-side, not just in the UI):**
  - *Property Manager:* edit details of **their own** listings only. No create, no delete, nothing else on the board.
  - *Admin:* edit **any** listing; **hide** a listing (below).
  - *Owner only:* **add/remove property managers** and **add/remove properties/listings** — create + delete are owner-level for both PM accounts and listings.
  - *Hide = soft + reversible.* An admin hiding a listing sets a hidden flag (pulls it from public/feed) and **enqueues a review task into the owner's inbox** — reuse the existing moderation/task path (`storage.createModerationRequest(...)` + the owner review queue), do not hard-delete. Only the owner removes.
  Reuse existing admin/owner auth and the promoter role plumbing; don't build a new permissions framework (§2 compose-don't-fork).
- **Entry point / onboarding — mirror promoter sign-up.** The "Managed Property" CTA branches on approval state:
  - *Approved PM →* their **property-manager page**: their listings (edit-own) and manual post/edit. *(The scoped scan tool comes later — it's part of the deferred auto-ingest, 4.1c. For now the approved PM manages listings by hand.)*
  - *Not approved →* a **PM application form** (clone the existing promoter application flow), whose submissions **enqueue into the owner's inbox/review queue**. Only the owner approves (owner-only add, above); approval flips the account to verified PM, which turns on the scraper (4.1c).
  Reuse promoter signup/approval plumbing end to end — form, pending state, owner approval — don't build a separate onboarding.
- **Membership / billing (the "Affirming Housing Partner" fee).** Flat **$30/mo, no tiers**, framed as community support. Model it as a **membership status on the PM account** (`trialing` / `active` / `lapsed`) plus flags for **first-month-free** (all PMs) and **founding-partner** (first 3 signups → 6 months free). **Publishing gates on membership, verification never does:** an active/trialing member's listings are live and their scraper syndicates; a lapsed member **stays verified** but their listings go inactive until they resume. Given only a handful of PMs early, **billing can be manual/invoiced in v0.1** — don't block on a payments integration; the account just needs the status + flags and a publish gate that reads them.

**4.1c Auto-ingest Managed Properties from a verified PM's site — DEFERRED (build after the first PM applies).** Do **not** build this, its QSearch tab, or the PM-page scan tool yet. A scraper is per-site, so it can't be written until we have a real applicant and their actual rental site to build the adapter against. Until then, **manual entry is the live path** (a verified PM hand-posts MANAGED listings, membership-gated), not a stopgap. When the first PM is approved, build the adapter for *their* site using the pattern below, then generalize. The 4.1d safeguards still apply the moment any scraper turns on.

Once we do build it (per applicant), it should mirror the **verified event-flyer scrapers that auto-feed the events feed** — reuse that pattern, don't build a new one:
- The events side defines trusted sources in **`shared/trustedVenues.ts`** (`TrustedVenueDef`) with a per-source **adapter** in **`server/ingest/adapters/`** (see `sanctuary.ts`, `campBar.ts`, etc. — HTML/JSON-LD/Squarespace/Tribe parsers in `server/ingest/`), scanned/synced by **`server/qsearch/scanJob.ts`** + **`server/qsearch/trustedSync.ts`** and dropped into the feed. Mirror this for rentals: a **verified PM = a trusted rental source** with an adapter tied to their rental site's listing pages.
- The adapter scrapes each available unit → normalizes to a **Managed Property** post (name, cover photo, rent, beds/baths, availability, neighborhood, `sourceUrl`) → upserts on a schedule (like the nightly event scan), so inventory stays current and closed units drop off (which triggers the Build-a-HAÜS teardown in 4.1b). Prefer structured data (JSON-LD / a listings feed) where the site offers it; fall back to an HTML adapter per site.
- Verification is the switch: no verified PM account, no scraper. Respect `server/ingest/ssrf.ts` and existing fetch guards. Complexity is Med and **per-site** (each PM site is its own small adapter), same scaling story as trusted venues.
- **Admin management UI = a new tab in the QSearch dashboard, next to "Trusted."** Manage PM rental sources (add a verified PM's site, map/configure its adapter, run/preview a scan, see what got ingested, disable a source) from a **new tab in `client/src/components/admin/QSearchDashboard.tsx`**, mirroring the existing Trusted tab. Same dashboard, one more tab — don't build a separate admin surface.

**4.1d Managed Property safeguards — required (do not ship auto-ingest without these).**
- **Fair-housing scan on ingest.** Run every scraped listing's text through a moderation pass for discriminatory / source-of-income language (e.g. "no kids," "no Section 8," "young professionals") *before* it publishes. A hit **holds the listing and files a flag in the owner's review queue** (reuse `storage.createModerationRequest(...)`), rather than auto-publishing raw. In OR/Portland refusing Section 8 is illegal — this is liability control, not nicety.
- **Scam / legitimacy verification.** The PM application must capture real proof for the owner to approve on: **rental-site domain ownership, business license, and a match to the directory business record.** Store it on the application; surface it in the owner's approval view.
- **Stale-listing freshness.** Stamp `lastSeenAt` on each scraped listing each scan; when a unit is absent for N consecutive scans, mark it **stale / auto-unpublish** (this fires the Build-a-HAÜS teardown, 4.1b). Show "updated X ago" on the card/detail.
- **Scraper health.** Track per-source last-success / error state; show it in the QSearch tab (4.1c) and **notify the owner when a source errors** for M runs, so a broken adapter doesn't silently stop the feed. Reuse the existing scan-job status plumbing (`server/qsearch/scanJob.ts` already tracks status/failed).
- **Geofence — a SEPARATE, wider housing region (do NOT reuse the directory map bounds).** Housing extends past Portland because renters commute; events do not. Define a distinct housing bounding box ≈ **SW [44.83, -123.25] → NE [45.90, -122.20]** (Portland metro + Willamette Valley to Salem: St. Helens/Vernonia/Yacolt in the north, Salem/Turner/Silverton in the south, Carlton/Gaston west, Sandy/Estacada/Scotts Mills east; includes Vancouver/Camas). Filter ingested units to this box. Keep it as its own constant — the directory/events map lock stays the tighter Portland box; these two fences are intentionally different sizes.
- **Affordability badges.** Support **"Accepts Section 8 / income-restricted / accessible"** as affirmative badges on Managed Property (positive signals only — never a filter that excludes people, per §2).

*Upside / roadmap (not v0.1):* PM-facing stats on their page (views, saves, groups forming); a **"secured it"** outcome marker on a Build-a-HAÜS (even off-platform) for social proof + match-signal learning; **owner-inbox triage** (admins triage/annotate applications, hide-reviews, and FH flags; owner keeps the final add/remove call).

**4.1b "Build a HAÜS" from a Managed Property — Med.** The bridge between the 4th type and the flagship. A **"Build a HAÜS" button** on every Managed Property listing creates a **Forming a HAÜS** post (4.8) in the *place-in-mind* flavor, **pre-seeded** from the listing (property name, cover photo, rent, beds/baths, neighborhood copied in; the unit auto-added to the new HAÜS's shortlist as the target; availability/lease date → important dates). Key behaviors:
- **No claim, non-exclusive.** It does NOT reserve or take down the listing — the managed post stays live and rentable, and **multiple** Build-a-HAÜS groups can attach to the same property simultaneously. Model it as a many-to-one link (many forming HAÜS posts → one managed listing), not a status flip on the listing.
- **Interest indicator on the listing.** The managed listing renders a live "N groups forming to secure this place" indicator, each entry linking to its HAÜS (show Lead + member count + "looking for N more"). Two-way link: the HAÜS shows "Forming around [Property] · managed by [X]" back to the listing.
- **One per person per property.** Guard against spam — a user can start at most one Build-a-HAÜS per listing; if they already lead one, the button becomes "Open your HAÜS." Joining another group is the normal request-to-chat/join (4.7).
- **Graceful teardown.** When the PM removes/closes the listing, notify each attached HAÜS and **detach** it — auto-convert to the *find-a-place-together* flavor (4.8) so the group persists; drop the unit from its shortlist. Reuse the saved-post-update-in-feed surfacing (4.4) and the convert/archive logic (4.3). Do not delete the groups.
- **Legal:** renters self-organizing to approach a landlord = user-authored interest, conduit not matcher; no steering. Platform never handles money/applications/lease.

### 4.2 Posting flow — **Low/Med**
Posting must take under a minute. It opens with one question — "What are you looking for?" (the four types; **Managed Property** shows only for verified property-manager accounts) — then a description, optional photos, optional structured fields, done. Users can enrich or change the post later. Long forms are prohibited; low friction is a requirement, not a nicety. For **Offering a Room** and **Forming a HAÜS**, the composer gives the **cover photo a called-out, dedicated upload slot** — visually distinct from the rest of the gallery — because the house name renders as a bold motif over that first image (see 4.5). Make clear in the UI that this is the photo the name sits over. The **name field is prebuilt to end in a fixed, non-editable "HAÜS" suffix**: the poster types only the front part and the composer shows the locked "HAÜS" ending inline ("Rainbow" → **Rainbow HAÜS**). Store the front part, append on render (don't let them type or delete "HAÜS"); this guarantees every household name ends in HAÜS and ties it to the board without any branding step. **Reuse the ad-maker pattern for create/edit:** the existing **`AdBuilder`** (`client/src/components/admin/ads/AdBuilder.tsx`) is already a form + **live card preview** editor (template picks, color swatches, cover image, renders `FeedAdCard`/`PosterAdCard` as you type). Model the HAÜS listing editor on it — form beside a live HAÜS card preview (name-over-cover motif, avatar stack, chips updating live) — rather than inventing a new editor. Adapt, don't copy wholesale (ads are admin-only; listings are user-facing).

### 4.3 Fluid posts: convert + openness flags — **Med**
- A post can **convert type** while keeping the same post, its replies, and history. Specifically **Looking for Housing ⇄ Forming a HAÜS** (converting to a HAÜS makes the poster its Lead and adds the workspace; switching back archives that workspace, nothing lost).
- **Openness flag** is a lightweight chip on **Looking for Housing** posts only: *"Open to becoming a HAÜS"* (open to forming/joining a household together, not just a room), so household-builders can find them. It lives on the seeker side — an Offering a Room post does NOT carry it. User-declared intent, not platform steering.

### 4.4 Feed-first discovery — **Low/Med**
Discovery starts in the feed by scrolling, not a blank search page. HAÜS posts appear as feed items. Search and filters exist for **refinement** only. The feed is the front door.
**Saved posts resurface on update.** Saving a post = following it. When a saved post is **updated** (rent change, room opens/fills, new photos, a forming HAÜS gains a member or sets a tour date), its card **re-appears in that user's feed/timeline with the update attached** — a change label on the card ("Rent updated," "1 spot left," "New photos"), not just a buried notification. Reuse the existing feed + saved-post + notification primitives; this is a surfacing rule (bump saved post into the follower's feed with a "what changed" badge), not a new system. Debounce so a burst of edits doesn't spam the feed.

### 4.5 The HAÜS card (4 variants) — **Med**
Cards are introductions, not ads — a person should grasp "could I live here / with these people?" in ~5 seconds. Variants for each post type. Show the *people* (household avatars, "Meet the household"), not just the property. **House name as motif:** for **Offering a Room** and **Forming a HAÜS**, render the household name **bold, overlaid on the first/cover photo** (card and detail) — a typographic motif on the image, not a caption below it — so the name is the identity. (This is why the cover photo is a called-out upload, 4.2. Looking for Housing uses the person's name over their photo instead.) **Open spots render as empty "Open" avatar slots in the stack** — 2 members looking for 2 more = 2 filled avatars + 2 empty "Open" placeholders, so remaining spots read at a glance (an Offering-a-Room open room is one empty slot; a full HAÜS shows none). The avatar stack can include **off-platform roommates**: when offering a room, the poster uploads a photo + first name for household members who aren't on ZAYLIST, so the full household shows (not just members with accounts). Off-platform members are photo + name, no account; reuse the existing media uploader. **Avatars are tappable, routing by type:** a real ZAYLIST member → their existing **user profile**; an off-platform roommate → a lightweight card stating they're **not on ZAYLIST yet** (an invite hook — no fabricated profile); reuse existing profile routing for the real case and a small non-profile popover for the others. The stack can also include **pet avatars** (photo + name for a dog/cat/etc.), rendered **slightly smaller** than human avatars so people read first and pets read as smaller members beside them; tapping a pet opens a playful **"Zay-VIP-List"** mini-profile (a light, fun variant — not the human profile). Cards carry community-context chips (4.9) and the openness chip (4.3) — never a compatibility number. Built as variants of the existing card system. **The 4th variant, Managed Property, is the exception:** same card shape, **purple `--c`** (+ `.pdx-glass-rebind`), a **"Property Manager" verified badge** where the household/avatars would be, and **none** of the household UI (no avatar stack, open slots, off-platform roommates, pets, openness chip, or compatibility). It shows unit facts only (see 4.1a).

### 4.6 Post detail — **Med**
A lightweight, modular detail view that answers the obvious questions before someone has to ask: the home — with the basics up front as structured fields: **bedrooms + bathrooms** (bath allows halves, e.g. 1.5), **parking** (off-street / driveway / garage / street-only / none), **outdoor space / yard** (private yard / shared yard / patio-balcony / none) — who lives there, house culture/rules (as structured chips, not essays), honest finances (monthly vs move-in separated, informational only), accessibility as standard info, approximate neighborhood (exact address private until appropriate), trust signals. These are optional fixed-vocabulary fields (chips), not free-text, and never used to rank/filter by protected class. One always-visible primary action: **Request to chat** (consent-based, see 4.7). No application form between interest and a first message. **Managed Property is the exception:** no request-to-chat — its primary action is the external **"View listing on [manager]'s site"** link (`sourceUrl`), plus "Build a HAÜS" (4.1b/4.1c).

### 4.7 Request to chat (consent-based) — **Low/Med**
First contact is a **request the recipient accepts or declines**, not an open DM — so people aren't cold-messaged (important for housing + a queer community). It is NOT an application — one tap, no forms. **Chats live in the existing floating inbox** (no separate housing messaging), and every conversation starts **pending**: the request shows up in both people's floating inbox in a pending state, the recipient (the Lead, for a HAÜS) accepts or declines, and only on accept does the group conversation open (post attached) as an active thread. Build it as a light pending-request state on the existing thread model (a message request the recipient approves), with states: request sent / pending, accepted (thread opens), declined (quiet, non-punitive — no drama notification). Blocking works the usual way. Do not add a second messaging system.

### 4.8 Forming a HAÜS — the workspace — **High** (this is the flagship and the hardest part)
Two flavors, picked at creation (a field on the post): **find a place together** (no property yet — form the group, then hunt) or **place in mind** (the founder already has a specific prospected place / is ready to sign a lease, and needs people to fill it and sign together). "Place in mind" attaches a property up front (seeds the shortlist as the target) and leans on the lease deadline in the important dates. Both are still people-first and form the household together; "place in mind" differs from "Offering a Room" because nobody has signed and the household doesn't exist yet.
A forming HAÜS is a small shared workspace, built on existing group-chat + roles + reminders + saved-links:
- **The Lead** — the person who forms it. A responsibility role (reuse existing roles): invite/add/remove members, approve/decline join requests, manage important dates, curate the shortlist, edit the post. Can name a **co-lead** or hand off (so it survives if the founder leaves).
- **Members** — can contribute (post links, comment, react, add dates). Join uses the **same request-to-chat action** (4.7): asking to chat is asking in; the Lead accepts and the thread opens, and that's how someone joins (no auto-add, acceptance required). Chat and join are one gesture — the separate action is creating/leading the HAÜS.
- **Shared property shortlist** — members paste **external listing links** (Zillow, Craigslist, a Facebook post, etc.); each becomes a saved card with a thumbnail, group reactions/comments, and a status (Interested → Touring → Applied → Passed/Chosen). These are the group's private bookmarks — ZAYLIST does **not** host or re-list those properties.
- **Important dates** — target move-in, tours, application deadlines, lease-signing, deposit-due — reusing the existing reminder/notification system so the group gets nudged.
- **Waitlist (full HAÜS)** — when a HAÜS marks itself full, its join action becomes **Join the waitlist** instead of a dead end. Waitlisters queue in the same request-to-join list; the Lead can pull from the waitlist when a spot opens, and waitlisters are notified when one does (or when the HAÜS reopens). Reuses the existing request + notification systems — no new mechanism.
- **Seeded from a Managed Property** — a HAÜS can also be born by tapping **"Build a HAÜS"** on a Managed Property listing (4.1b): place-in-mind flavor, unit pre-seeded onto the shortlist, two-way link to the listing. It doesn't claim the listing and isn't exclusive; on listing teardown it detaches and converts to find-a-place-together.
- **Lifecycle** — create (or Build-a-HAÜS from a managed listing) → discover in feed → request/invite → plan together (chat + shortlist + dates) → mark "we're full" (join action becomes the waitlist) → convert to an actual place (the HAÜS persists; can later post "Offering a Room," offered to the waitlist first).
This is where the product's value concentrates. It's High complexity because it's multi-user coordinated state, but every piece rides an existing system.

### 4.9 Community context & trust — **Med**
Instead of a compatibility score, show real community overlap as trust signals: mutual connections, shared events attended, time on ZAYLIST, verifications. Most of this is derivable from data ZAYLIST already has (follows, event attendance, account age). Especially important for Forming a HAÜS, where people join near-strangers.

### 4.10 Compatibility → conversation prompts — **Med (later, not v0.1)**
Never a score or filter. Optional prompts drawn from what people said about themselves ("you both work remotely," "different guest expectations — worth discussing"), scoped to logistics/lifestyle, purely to help a conversation. See constraint #1.

### 4.11 Moderation & safety — **Low**
Reuse existing moderation; add report categories: fake listing, scam, unsafe housing, discrimination, unauthorized sublease. Standard block/report. Because the platform never touches money, deposit-fraud-through-the-platform is structurally impossible; community trust is the main defense.

---

## 5. Build phases

- **v0.1 (ship first, keep it small):** the four post types (incl. Managed Property behind a PM-verification flag), one-question composer, openness flags, feed-first discovery, the four card variants, post detail, request-to-chat (consent-based). Founder does matching by hand. **Managed Property is manual-entry at launch** — a verified PM hand-posts listings (membership-gated). **Auto-ingest (4.1c) is deferred until the first PM applies**, and when built ships only with its 4.1d safeguards (FH ingest scan, PM verification proof, stale-listing freshness, scraper health, metro geofence, affordability badges). **No** compatibility, applications, tours, or the full workspace yet.
- **v0.2:** the Forming-a-HAÜS workspace (Lead + members, shortlist, important dates), the full-HAÜS waitlist, post-type conversion, community-context chips, verification badges, saved posts/searches.
- **v0.3:** conversation prompts (soft compatibility); optional structured application + tours for households that want them; Managed Property stickiness (PM stats, Build-a-HAÜS "secured it" outcome loop, owner-inbox triage — 4.1d).
- **Later:** generalize community-context/compatibility as a shared platform service for other boards.

---

## 6. Definition of done — v0.1

- A user can post any of the three types in under a minute and see it in the feed.
- Housing posts render as on-brand card variants (design system), showing the people, not just the property.
- A post has a detail view with a working "Request to chat" that the recipient accepts to open the existing group conversation (declining is quiet).
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

**Request-to-chat = the existing messaging system + a consent gate.** Message/thread model is in `shared/schema.ts` (`messages`, group `thread_id`); `storage.sendMessage(...)` starts/appends threads. See how Gifting, Gig Board, and Missed Connections open a conversation from a post — and note Missed Connections is already consent/approval-based, so it's the closest pattern for the accept/decline first-contact gate. Floating inbox: `useInboxSheet` / `InboxOverlay`. Reuse all of this; add only the light pending-request state. Do not add a second messaging system.

**Listing create/edit — reuse the ad maker's shape.** `client/src/components/admin/ads/AdBuilder.tsx` (with `AdManager.tsx`, types in `client/src/lib/adTypes.ts`) is already a form + **live card preview** editor: template picks, color swatches, cover image, and it renders real card components (`FeedAdCard`/`PosterAdCard`) live as you edit. Mirror that pattern for the HAÜS listing editor — form beside a live HAÜS card preview (name-over-cover motif, avatar stack, chips) — instead of building a new editor from scratch. It's admin-only today; the HAÜS version is user-facing, so adapt permissions and simplify, don't lift wholesale.

**Managed Property auto-ingest (4.1c) — mirror the event pipeline.** Trusted event sources live in `shared/trustedVenues.ts` (`TrustedVenueDef`), each with a per-source adapter in `server/ingest/adapters/` (`sanctuary.ts`, `campBar.ts`, …) and shared parsers in `server/ingest/` (`parseJsonLd.ts`, `parseSquarespace.ts`, `parseTribe.ts`, `fetchSource.ts`, `ssrf.ts`). Scanning/sync: `server/qsearch/scanJob.ts` + `server/qsearch/trustedSync.ts` + `nightly.ts`. Admin surface: `client/src/components/admin/QSearchDashboard.tsx` (the "Trusted" tab is the model). A verified property manager is just a **trusted rental source**: add a rental adapter, register the source on verification, scan on a schedule into Managed Property posts, and manage it from a **new QSearch tab beside Trusted**. Don't invent a parallel ingest or admin system.

**Other integration points.** Media upload: `POST /api/upload/*` (multer) — mirror `/api/upload/gifting`. Moderation: `storage.createModerationRequest(...)`. Primary nav entry: `PRIMARY_NAV` in `client/src/lib/siteNav.ts`. Client routes: `client/src/App.tsx`. Day colors / brand tokens: `shared/eventWeek.ts` + `index.css`.

**Content rule.** No em dashes anywhere in user-facing copy — hard project rule. Match the existing voice.

**Suggested first vertical slice (lowest risk).** Ship **"Looking for Housing"** end to end first — it's single-user, no coordinated state: schema + create/list/read routes + the one-question composer + a feed card variant + a detail view + a "Request to chat" that opens a thread on accept. Then add **Offering a Room**, then the **Forming-a-HAÜS** workspace last (the only High-complexity piece). Keep each a small, reviewable PR.

**Legal guardrail is a build constraint, not just product.** Do not build dropdowns or filters that hide or rank listings by protected characteristics. Preferences stay user-authored free text; "compatibility" (a later phase) is conversation prompts only, never a score or gate.
