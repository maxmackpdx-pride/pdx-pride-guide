# ZAYLIST HAÜS — Housing Board
## Founder Product Specification
Version 0.2 — Community-board reframe

> Supersedes the v0.1 marketplace framing. Housing is not a rental marketplace; it is a community board. The closest behavioral model is a trusted Facebook Group, not Zillow or Roommates.com.

---

## 0. Legal & Safety Foundations (read first)

These constraints shape the architecture, so they come before the product.

**Platform posture: conduit, not matcher.** ZAYLIST hosts what members post in their own words. It does not create discriminatory criteria, and it does not rank, filter, or steer listings by protected characteristics. This is the line the *Fair Housing Council v. Roommates.com* case drew: a platform that makes users answer structured questions about protected traits (sex, family status, etc.) and then matches on them becomes a co-author of discrimination; a platform that hosts free-text community posts generally does not. Even Facebook was sued (HUD/DOJ, 2019–2022) not for its groups but for its ad-*targeting algorithm* steering housing by protected class. The lesson: the trusted board full of user-written posts is the safe part; an algorithm that steers people by traits is the liability.

**Shared-living focus.** The product centers on roommate and household living (shared space), which carries more latitude to express preferences than whole-unit landlord rentals. Landlord/whole-unit listings may exist, but they are not the soul of the board and get no special matching treatment.

**The platform never handles money.** No deposits, rent, application fees, or escrow flow through ZAYLIST. This removes a large regulatory burden and a major scam surface in one decision. Money is always arranged directly between people, off-platform.

**Sensitive data is minimized.** Housing naturally attracts sensitive info (income, ID, accessibility/disability, substance use). Collect the minimum, keep identity/values user-authored and opt-in, and be explicit about what is stored, who sees it, and when it becomes visible.

**Get a real attorney before launch.** Specifically a Fair Housing attorney who knows Oregon and Portland, because Portland layers strong local anti-discrimination and tenant ordinances on top of the federal FHA. This spec is product direction, not legal advice.

---

## 1. Vision

Housing platforms optimize around property. ZAYLIST optimizes around people, and the queer community it already serves. The apartment is just where those people happen to live.

The wedge is **trust and belonging**, not inventory. A "room available" post inside a community people already trust beats a thousand anonymous listings. ZAYLIST is not trying to build that trust — it already has it. Housing is simply the community using that trust to find homes and each other.

For queer Portland specifically, the value is safety and chosen family: trans-safe and queer-safe shared living, avoiding discriminatory roommates and landlords, and building households with people who share your world. That is why Housing belongs *inside* ZAYLIST and could not work as a standalone app.

---

## 2. Product Philosophy: compose, don't fork

Housing is another vertical inside ZAYLIST — a board alongside Events, Marketplace, Gifting, and Missed Connections. It reuses platform primitives rather than reinventing them.

Everything in ZAYLIST is an **Object** (Event, Gift, Gig, Housing Post, Organization). Objects own metadata, media, discussions, moderation, notifications, and analytics. Objects do **not** own users — users participate in objects. This is what lets nearly every future feature reuse the same framework.

**Reuse / extend — never fork:**

| System | How Housing uses it |
| --- | --- |
| Accounts | Normal ZAYLIST accounts. No housing-specific login. |
| Profiles | Housing *extends* profiles with optional sections (move timeline, budget, neighborhoods, living style, accessibility). Reusable elsewhere. |
| Media & links | Existing uploader — photos, video, floorplans, docs — plus saved external links (used by the shared house-hunt board, §9). |
| Inbox | Existing floating inbox. No housing inbox. Housing is another notification source. |
| Notifications & reminders | Existing platform notifications drive saved-post alerts and the "important dates" reminders in a forming HAÜS (§9). |
| Group conversations | The existing group-chat model. "Chat with the household" = create group conversation, attach post, invite members. No new messaging system. |
| Roles & permissions | The existing household-member roles model powers the HAÜS **Lead** and members (§9). No housing-specific permissions. |
| Search | Global search; Housing contributes searchable metadata. Refinement, not first experience. |
| Maps | Existing Leaflet maps; approximate location until appropriate. |
| Cards | The deep-glass card system (glass.css). Housing cards are new *variants*, not new components. |
| Moderation | Platform moderation + housing-specific categories. |

**Do not build:** a second profile, inbox, chat system, permissions model, moderation system, notification framework, or analytics system. If another feature could reuse it later, it belongs to the platform, not to Housing.

---

## 3. What HAÜS Is

HAÜS is the brand for the **Housing board**. Every housing post lives inside HAÜS, the way every sale lives inside Marketplace.

HAÜS means two things at once:

1. **The board** — the home for all housing posts.
2. **A special post type, "Forming a HAÜS"** — where people intentionally build a household *before* finding a property.

Existing roommate houses do **not** have to rebrand themselves "a HAÜS." That was the v0.1 mistake. Forcing every household into a branded identity added friction and felt inauthentic. HAÜS is the board; "Forming a HAÜS" is the flagship post type within it.

---

## 4. The Three Post Types

The board launches with three post types. Everything else is a variation.

**Offering a Room.** An existing household has an available room — the traditional roommate listing. The household exists; someone is joining it. *(Carries early liquidity: simplest to post.)*

**Looking for Housing.** An individual needs a place. They may not know where yet. Typical info: budget, move timeline, neighborhood preferences, room preferences, short description. *(Also easy to seed — it's basically a profile flag.)*

**Forming a HAÜS.** The flagship and the biggest differentiator. Instead of finding a room, people find *each other* first, then rent together. "Two friends looking for one more." "Building a queer household together." The household forms first. Nobody builds this well today. *(Highest halo value, slowest to seed — needs multiple people to coordinate. It's the story, not the day-one volume driver.)*

It comes in **two flavors**, chosen when you create it:

- **Find a place together** — no property yet. Form the group, then house-hunt as a team using the shared shortlist. (The pure "form first" case.)
- **Place in mind** — the founder already has a specific prospected place, or is ready to sign a lease on one, and needs people to fill it and sign together. It's still people-first (the household forms together), but a property is attached from the start and there's usually a lease deadline, so the important dates carry more weight. Think "I found the house, I need roommates to make it real" — distinct from "Offering a Room" because nobody has signed yet and the household doesn't exist.

### Posts are fluid — convert and signal openness

Housing intent is fuzzy. People often don't know whether they want *a room* or *to build a household* until they're a few conversations in. So a Housing Post is one object with a **changeable type** and lightweight **openness flags** — not three separate, locked things.

**Convert between types** (keeps the same post, its replies, and its community context — never a new post, never a lost conversation):

- **Looking for Housing ⇄ Forming a HAÜS.** A seeker who decides to build a household instead of just finding a room converts their post to "Forming a HAÜS," and can switch back. Converting to a HAÜS makes them its **Lead** (§9) and gives the post the workspace (member list, property shortlist, important dates); switching back **archives** that workspace so nothing is lost if they flip again.

**Openness flags** (a chip, not a commitment):

- A **Looking for Housing** post can flag **"Open to becoming a HAÜS"** — open to forming or joining a household together, not just taking a room — so household-builders can find people who are game. The flag lives on the **seeker side only**; an Offering a Room post is just offering a room and doesn't carry it.

These flags are **user-authored intent**, shown as a small chip on the card (§7). They lower the commitment gradient: someone can start as "looking for a room," mark openness, and grow into "forming a HAÜS" as momentum builds — instead of having to know exactly what they want the moment they post. (It's intent people express about *themselves*, not the platform steering anyone — it stays on the safe side of §0.)

---

## 5. Posting Flow: under a minute

Facebook wins because posting is trivial. No long application before you can participate.

The flow opens with one question:

> **What are you looking for?**
> ○ Offering a Room ○ Looking for Housing ○ Forming a HAÜS

Then: write a description → add photos if it fits → optional structured fields (including the openness flag from §4). Done. Users enrich or convert the post later. **Low friction creates liquidity**, and liquidity is the whole game early on.

---

## 6. Feed-First Information Architecture

Discovery begins in the **feed**, not a blank search page. People find housing by scrolling and recognizing names: "Oh, Jordan's looking." "My friend's forming a HAÜS." That behavior already exists on ZAYLIST.

HAÜS is another active board in the feed. Search and filters exist for **refinement**, but the front door is the feed. (The feed and its poster-deck card rendering already exist — Housing posts are new card variants on that system.)

---

## 7. The HAÜS Card

Housing cards are introductions, not advertisements. The goal is not to get a click — it's to let someone think "I could see myself here" in five seconds. Three variants on the shared deep-glass card:

- **Offering a Room:** cover photo, rent, neighborhood, move-in date, room type, who's in the household (avatars), a few lifestyle badges, accessibility badges, Save / Share / Request to chat.
- **Looking for Housing:** the person is the listing — avatar, name, move timeline, budget, desired neighborhoods, a short lifestyle line, "looking for."
- **Forming a HAÜS:** group name, member avatars, combined budget, neighborhood goals, move timeline, "looking for N more."

Instead of "Hosted by Alex," cards say **"Meet the household"** with avatars — the people are part of the visual identity. **Open spots show as empty "Open" avatar slots in the stack:** a household with 2 members looking for 2 more renders as 2 filled avatars + 2 empty "Open" placeholders, so "looking for N more" is visible at a glance and a person can picture themselves in one of the gaps. (Same for an Offering a Room card — the open room is an empty slot; a full/"we're full" HAÜS shows no open slots.) **Filling the stack with off-platform roommates:** when offering a room, the poster can add household members who aren't on ZAYLIST by uploading a photo + first name, so "Meet the household" shows everyone who actually lives there, not only members with accounts. These off-platform members are display-only (photo + name, no profile, no account, not clickable) and should only be posted with the roommate's OK. Cards carry **community-context** chips (§11) rather than a compatibility score, and an **"Open to a HAÜS"** chip when the poster has flagged that openness (§4). Card states (New, Saved, Filled, etc.) change status, never layout. Badges always pair color with icon/label for accessibility.

---

## 8. Post Detail: conversation-first

The detail view reduces uncertainty so the conversation can be about getting to know each other, not discovering basics. It stays lightweight and modular (sections can be empty and prompt completion): the home, who lives there ("Meet the household"), house culture and rules as structured chips/tables, honest financials (monthly vs. move-in kept separate), accessibility as standard info (never hidden behind a filter), approximate neighborhood (exact address stays private until appropriate), and trust signals. Primary action, always visible: **Request to chat.** First contact is consent-based — it sends a chat request the poster accepts before the conversation opens, so nobody gets cold-DMed. It's a one-tap request, not an application (no forms, no questionnaire); on accept it opens the normal group conversation. This consent gate matters more here than on most boards because it's housing and it's a queer community.

---

## 9. Forming a HAÜS — the flagship, in depth

Because compatibility is soft (§10), the product lives in the **group-formation and planning experience**. A forming HAÜS is a lightweight shared *workspace* — the thing a Facebook group fundamentally can't be — built entirely on existing primitives: group conversations, roles/permissions, saved links, and reminders.

**The Lead.** The person who forms the HAÜS (or who converts a "Looking for Housing" post into one, §4) is its **Lead** (founder). This is a responsibility role, not a status one. The Lead can:

- invite and add members, and approve or decline join requests;
- remove a member if needed;
- set and manage the household's **important dates**;
- curate the shared **property shortlist**;
- edit the HAÜS post (name, goals, budget, neighborhoods, "looking for N more").

Members can fully contribute — post property links, comment, react, add their own dates — but the Lead keeps the household organized and moving. A Lead can name a **co-lead** or hand the role off, so the HAÜS survives if the founder steps back. All of this rides the platform's household-member roles/permissions; no housing-specific permission model is built.

**Shared house-hunt board (property shortlist).** Members paste **links to real listings** — Zillow, Apartments.com, Craigslist, a Facebook post, anywhere. Each link becomes a saved card the group tracks together:

- title, rent, neighborhood, a thumbnail pulled from the link when available, and who added it;
- group **reactions and comments** so the household decides together;
- a simple **status** per property: Interested → Touring → Applied → Passed / Chosen.

This turns "did anyone see that place on Zillow?" into one organized shortlist the whole group can weigh in on. Important: these are **external links the group bookmarks for itself** — ZAYLIST is not hosting or re-listing those properties, so the shortlist stays a private planning tool, not a rental-listing service (and stays clear of Fair Housing listing obligations).

**Important dates.** The Lead and members track the dates a real house-hunt runs on: target move-in, tour dates, application deadlines, lease-signing, deposit-due, budget check-ins. These reuse the platform's date + reminder/notification primitives, so the household gets nudged exactly like every other ZAYLIST reminder. A shared timeline keeps everyone aligned without a spreadsheet or a group text no one can find.

**Formation lifecycle:**

1. **Create** — the Lead starts the HAÜS (or converts a "Looking for Housing" post into one): name, goals, budget range, target neighborhoods, timeline, how many more people, and the **flavor** (find a place together, or place in mind). If "place in mind," they attach the specific place up front — it seeds the shortlist as the target — and the lease deadline drives the important dates.
2. **Discover** — it appears in the feed as a "Forming a HAÜS" card with community-context signals. People who flagged "open to a HAÜS" (§4) are natural candidates.
3. **Request to join / invite** — joining uses the **same request-to-chat gesture** (§12): asking to chat *is* asking in. People request in (or the Lead invites); the Lead accepts and the conversation opens, and that's how someone joins. Requests don't auto-add — acceptance is required. (Chat and join are one action; the separate action is *creating / leading* the HAÜS itself.)
4. **Plan together** — group chat + the shared property shortlist + important dates. This is where fit gets decided *and* where the search actually gets run.
5. **"We're full" + waitlist** — the HAÜS marks itself complete and the card's join action flips from "request to join" to **"Join the waitlist."** Interested people can still add themselves rather than hitting a dead end. The Lead sees the waitlist and can pull from it if a spot opens (a member leaves, or the household decides to grow), and waitlisted people are notified if a spot frees up or the HAÜS reopens. This keeps the household from losing interested people at the exact moment it's most appealing, and it reuses the existing request-to-join list + notification system (no new mechanism).
6. **Convert to a place** — when the group rents somewhere, the HAÜS persists (and can later post "Offering a Room" when someone moves out — the waitlist is the natural first place to offer it); the chosen property closes out the shortlist.

Hard cases still need answers over time — a member wants to leave a forming group, a dispute over who owns the HAÜS if the Lead departs, a member who ghosts. These ride the platform's roles/permissions model, with **co-lead / hand-off** as the pressure valve.

---

## 10. Compatibility → Conversation Prompts (softened)

ZAYLIST does **not** score people, rank applicants, or decide who should live together. That's the Roommates.com landmine and it's off the table.

Instead of a score, surface **conversation prompts** drawn from what people voluntarily said about *themselves*:

- "You both work remotely."
- "Similar move timeline."
- "Both have dogs."
- "Different guest expectations — worth talking about."
- "Similar household goals."

Rules that keep this safe and useful:

- Prompts describe **logistics and lifestyle** (schedule, cleanliness, pets, noise, budget, smoking) — mostly *not* protected classes.
- Identity and values stay **user-authored free text, opt-in**, framed around community and safety (queer-safe / trans-safe shared living) — never a platform dropdown the system filters on.
- Prompts **never hide, rank, or filter** listings. They only help a conversation. Guidance, not judgment.

---

## 11. Community Context & Trust

For a tight community, community overlap is a stronger, safer trust signal than any questionnaire — and it's buildable from data ZAYLIST already has:

- **Mutual connections** (follows).
- **Shared events attended** (RSVP/attendance data).
- **Time on ZAYLIST / member since** (account age).
- *(Later)* shared organizations, volunteer work, communities.

Especially for "Forming a HAÜS," seeing real community overlap makes joining a household of near-strangers feel dramatically safer. **Trust comes from participation as much as verification** — "member 3 years, 18 community events, 4 mutual connections" tells a richer story than a checkmark. Verification still helps (identity, leaseholder, listing) and should say exactly what it verifies — no vague "Trusted" badges.

---

## 12. Connecting: request to chat (consent-based)

Connecting is **interest → request to chat → accept → conversation**, using the existing group-conversation + inbox systems. First contact is a request the recipient accepts or declines, not an open DM — so people aren't cold-messaged, which matters a lot for housing in a queer community. That's the one intentional gate, and it's a single tap, not paperwork: there is still **no application, no forms, no questionnaire** between interest and talking. A structured application/tour/decision flow stays a *later* option for households that want it. Design note: a declined request should be quiet and non-punitive (no notification drama), and blocking still works the usual way.

---

## 13. Liquidity & Seeding

A board with nothing in it is dead, so this matters more than any feature.

**Don't open public browse into an empty room.** Until there's density, Housing is intent posts + hand-matching. Target for flipping on browse: **~30 active posts concentrated in a couple of Portland neighborhoods**, timed to a lease-turnover wave (summer, September).

**Seed the two sides differently.** Demand is easy — "Looking for Housing" is a low-friction profile flag; open it to all users free on day one. Supply is the constraint — recruit the first 20–40 "Offering a Room" / forming households **by hand**, from the scene.

**HAÜS-first, unfair-advantage move:** let existing group houses claim a household page as identity/belonging even with no room open — latent supply that converts to a listing the moment a room opens.

**Piggyback existing behavior:** queer Portland already posts roommate-wanted in FB groups, Discords, IG. Make it trivial to bring those over; re-post the best (with permission).

**Use the machinery you have:** the feed distributes new posts to the whole community for free; the venue/org directory is a partner list (anchor a few households to community pillars for social proof); the **events → housing funnel** is the sharpest wedge — people move to Portland for the scene and need housing + community at the same moment, and you're the only platform serving both.

**Concierge first:** for the first ~50 households, *you* are the matcher — introduce people by hand. It creates word-of-mouth, makes the board feel alive, and teaches which signals actually predict a good match.

**Sequence:** (1) quiet phase — recruit supply, open free seeker posts, match by hand; (2) soft launch browse to ZAYLIST users once density is real; (3) open self-serve posting with manual verification on new houses.

---

## 14. Moderation & Safety

Reuse platform moderation; add housing categories: fake listing, scam, unsafe housing, discrimination, unauthorized sublease. Safety features (verified identities, block, easy reporting, meeting-location visibility for any future tours) should feel available without making the experience feel policed. Because the platform never handles money (§0), the biggest scam vector — deposit fraud through the platform — is structurally removed; remaining risk is off-platform, and the community-trust layer is the main defense.

---

## 15. Roadmap

- **v0.1** — three post types, one-question composer, openness flags, feed-first discovery, deep-glass HAÜS cards, request-to-chat (consent-based) via group conversations. Concierge matching. No compatibility, no applications, no tours.
- **v0.2** — the "Forming a HAÜS" workspace (Lead + member management, shared property shortlist, important dates/reminders); the full-HAÜS waitlist; post-type conversion (Looking for Housing ⇄ Forming a HAÜS); community-context chips (mutual connections, shared events, tenure); verification badges; saved posts/searches; richer detail view.
- **v0.3** — conversation prompts (soft compatibility); optional structured application + tours for households that want them.
- **Later** — the compatibility/community-context service generalized to other boards (organizations, volunteer teams, projects). Housing is just the first board to use it.

---

## 16. Guiding Principle

For every Housing feature, ask: *"Is this a Housing problem, or a platform capability?"* If it's a capability, build it for ZAYLIST, not just Housing.

And the product truth underneath the reframe: **you're not building a matching algorithm — you're building the trusted room where queer Portland finds housing and each other, with better tools than a Facebook group and a household concept nobody else has.** The flagship innovation isn't roommate listings. It's helping people build a household together — plan the search, track the places, hit the dates — before they ever sign a lease.
