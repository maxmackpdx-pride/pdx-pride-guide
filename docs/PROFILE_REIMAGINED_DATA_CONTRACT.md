# Public Profile Live Data Contract

**Repo:** `/Users/tuckercasey/pdx-pride-guide`  
**Branch:** `feature/profile-reimagined`  
**Date:** 2026-07-13  
**Purpose:** Wire the reimagined profile UI to live APIs without inventing fields.

---

## 1. Live endpoint

| Item | Value |
|------|--------|
| Method / path | `GET /api/users/:username` |
| Route | `server/routes.ts` ~L2210–2215 |
| Auth | None required; session optional |
| Viewer | `req.session?.userId ?? null` passed into storage |
| Success | `200` + body from `storage.getPublicProfile` |
| Missing / inactive | `404` `{ error: "Not found" }` |
| Active page | `client/src/pages/MemberProfile.tsx` → `/u/:username` |
| Query key | `["profile", username]` |

```ts
// server/routes.ts
app.get("/api/users/:username", (req, res) => {
  const username = String(req.params.username || "").trim().replace(/^@/, "");
  const profile = storage.getPublicProfile(username, req.session?.userId ?? null);
  if (!profile) return res.status(404).json({ error: "Not found" });
  res.json(profile);
});
```

Related mutations (same username resource):

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `POST` | `/api/users/:username/follow` | required | `{ followers, isFollowing: true }` |
| `DELETE` | `/api/users/:username/follow` | required | `{ followers, isFollowing: false }` |
| `POST` | `/api/users/:username/message` | required | `{ ok: true }` body: `{ body, subject? }` |
| `PUT` | `/api/users/me` | required (owner edit) | auth user payload |

---

## 2. Exact current API JSON shape (`getPublicProfile`)

**Source of truth implementation:** `server/storage.ts` `getPublicProfile` ~L5790–5928.  
**Typed client mirror (LIVE):** `client/src/pages/profile/types.ts` → `MemberProfileData`.

### Top-level fields

| Field | Type (live) | Notes |
|-------|-------------|--------|
| `username` | `string` | |
| `displayName` | `string \| null` | |
| `pronouns` | `string \| null` | |
| `location` | `string \| null` | |
| `bio` | `string \| null` | |
| `photoUrl` | `string \| null` | |
| `avatarChoice` | `number` | default `1` |
| `avatarRing` | `string` | `"none"` or ring id from `shared/avatarRings.ts` |
| `avatarCrop` | `string \| null` | crop metadata; not used by redesign types |
| `memberSince` | `string` | user `createdAt` ISO |
| `verifiedHost` | `boolean` | `user.promoterStatus === "approved"` |
| `showPromoterVariant` | `boolean` | **always equals** `verifiedHost` |
| `roles` | `string[]` | talent role labels + `"Party Host"` if hosting LIVE events |
| `talents` | `string[]` | parsed JSON from user |
| `standFor` | `string[]` | **empty unless** `verifiedHost` |
| `affiliatedVenues` | `{ id, name, type }[]` | from `affiliatedVenueIds` |
| `ownedBusiness` | `Business \| null` | first owned business only |
| `accentColor` | `string \| null` | hex allowlist via `@shared/profileTheme` |
| `banner` | `string` | **enum key** from `profileTheme` (see § Banner) |
| `marquee` | `{ items, speed, color } \| null` | **null unless** `verifiedHost` |
| `pup` | `{ name, hood, role, lookingFor } \| null` | **null if** promoter |
| `packmates` | pack link users | **[] if** promoter |
| `handlers` | pack link users | **[] if** promoter |
| `media` | media card or `null` | podcast/playlist shape |
| `socialLinks` | `Record<string,string>` | object (never raw string on this endpoint) |
| `profileEmbeds` | `{ id, src, title }[]` | legacy embeds |
| `profilePhotos` | `{ url, caption? }[]` | |
| `stats` | object | see below |
| `isOwner` | `boolean` | viewer === profile user |
| `isFollowing` | `boolean` | false if owner / no session |
| `activity` | object | nested lists |
| `linkedVenues` | `{ id, name, type, address }[]` | |

**Not returned today (important for redesign):**

- `isPromoter` (use `verifiedHost` / `showPromoterVariant`)
- `isAdmin` / `isSiteAdmin` (admin sticker cannot be driven from this payload alone)
- `profileBanner` (use `banner`)
- `boardPosts` (client-build from `activity.*`)
- `events.hosting` / `events.going` (use `activity.*`)
- Per-event `posterImageUrl`, `goingCount`, `address`, `neighborhood`, `ageRequirement`, `eventTypes`
- Hub feed posts, likes, replies

### `stats`

```ts
{
  events: number;    // hostedUpcoming.length + hostedPast.length
  hosting: number;   // hostedUpcoming.length
  going: number;     // goingToUpcoming.length - 0 for non-owners (privacy)
  posts: number;     // gigs + gifting + spotted counts
  gigs: number;
  gifting: number;
  checkIns: number;  // all attendances by user
  followers: number;
}
```

No `shows`, `estYear`, `saved` keys live - derive on client (`shows ≈ stats.events`, `estYear` from `memberSince`, `saved` **MISSING**).

### `activity` (live nesting)

```ts
activity: {
  hostedEvents: ProfileEvent[];      // upcoming LIVE hosts
  hostedEventsPast: ProfileEvent[];  // past LIVE hosts
  gigs: ProfileGig[];
  gifting: ProfileGifting[];
  spotted: ProfileSpotted[];
  goingTo: ProfileEvent[];           // upcoming RSVPs - **owner only** ([] for public viewers)
  attendedPast: ProfileEvent[];      // past RSVPs - public
}
```

### Nested event shape (hosted vs attended)

**Hosted** SQL selects:

```
id, title, venueName, dayOfWeek, dateStart, dateEnd, admission, ticketUrl
```

**Attended** SQL selects:

```
id, title, venueName, dayOfWeek, dateStart, dateEnd, admission
```

(`ticketUrl` omitted on attended rows.)

**Neither query includes:** `poster_image_url`, address, neighborhood, age, event_types, going counts.

### Nested board-ish shapes

| Key | Fields |
|-----|--------|
| `gigs` | `id, title, venueText, compensation, status, createdAt, description` (LIVE only) |
| `gifting` | `id, title, neighborhood, createdAt, description` (excludes REMOVED/REJECTED/PENDING/EXPIRED) |
| `spotted` | `id, title, body, dayOfWeek, venueHint, createdAt` (ACTIVE only) |

### Pack link user

```ts
{ id, username, displayName, avatarChoice, avatarRing, photoUrl }
```

### Media

```ts
{
  kind: "podcast" | "playlist";
  title, tag, cadence, blurb, coverUrl,
  platformLinks: { label, url }[],
  items: { id, label, title, meta, audioUrl, isEmbed }[]
}
```

Legacy fallback synthesizes from `profileEmbeds` when no `profile_media` row.

### Banner (live validation)

- **Write path:** `PUT /api/users/me` validates with `isProfileBanner` from `@shared/profileTheme`.
- **Allowed values:** `"accent-gradient" | "neon-collage" | "sticker-wall" | "pride-guide-social"`.
- **Default:** `"accent-gradient"` (`DEFAULT_PROFILE_BANNER` in `shared/profileTheme.ts`).
- **Image map** (`PROFILE_BANNER_IMAGES`):

  | Key | Path |
  |-----|------|
  | `neon-collage` | `/sandbox-ds/banners/hero-collage.png` |
  | `sticker-wall` | `/sandbox-ds/banners/banner-stickers.png` |
  | `pride-guide-social` | `/sandbox-ds/banners/banner-social.png` |

- **`shared/profileConstants.ts`** uses a **different** model (path-or-null banners + slightly different accent greens). Used by **unwired** `client/src/components/profile/AccentPicker.tsx`. **Do not send path strings to `PUT /api/users/me`** - server will 400.

### Privacy notes

1. **`activity.goingTo` + `stats.going`** only populate when `isOwner`. Public viewers always see empty going-upcoming (by design).
2. **`attendedPast`** is public.
3. **`standFor` / marquee** promoter-only; **pup / pack** member-only (server nulls the other).

---

## 3. Two client type systems

| | **LIVE (wired)** | **Redesign (aspirational, not routed)** |
|--|------------------|----------------------------------------|
| Types | `client/src/pages/profile/types.ts` → `MemberProfileData` | `client/src/components/profile/types.ts` → `PublicProfileData` |
| Components | `client/src/pages/profile/*` | `client/src/components/profile/*` |
| Fetch | `MemberProfile.tsx` casts JSON as `MemberProfileData` | No page imports these yet |
| Events | `activity.hostedEvents` / `goingTo` | `events.hosting` / `events.going` |
| Promoter flag | `showPromoterVariant` / `verifiedHost` | `isPromoter` |
| Banner | `banner` (enum key) | `profileBanner` (path string expected by `ProfileHero`) |
| Board | built in `BoardTab` from activity | `boardPosts[]` |

### Source of truth recommendation

1. **API contract truth:** keep documenting against `getPublicProfile` + `pages/profile/types.ts` (`MemberProfileData`).
2. **UI view-model for reimagined layout:** keep `PublicProfileData` in `components/profile/types.ts` **as a client-normalized view model**, not as a claim about the HTTP response.
3. **Ship path:** `MemberProfile.tsx` should fetch API → `normalizePublicProfile(api)` → `PublicProfileData`, then compose reimagined panels. Eventually collapse duplicate helpers; until then, prefer **pages types = wire shape**, **components types = UI shape**.

Do **not** change the server response field names solely to match redesign types without a normalize layer - live clients and handoffs already use `activity.*` / `showPromoterVariant`.

---

## 4. Mapping table: Design field → API field

Design fields from `/tmp/profile-reimagined/grok-prompt.md` + `PublicProfileData`.

| Design / UI field | Live API field | Status |
|-------------------|----------------|--------|
| `displayName` | `displayName` | OK |
| `username` | `username` | OK |
| `pronouns` | `pronouns` | OK |
| `location` | `location` | OK |
| `bio` | `bio` | OK |
| `photoUrl` | `photoUrl` | OK |
| `avatarChoice` | `avatarChoice` | OK |
| `avatarRing` | `avatarRing` | OK |
| `accentColor` | `accentColor` | OK (null → default `#FF00CC`) |
| `memberSince` | `memberSince` | OK |
| `verifiedHost` | `verifiedHost` | OK |
| `isPromoter` | `verifiedHost` **or** `showPromoterVariant` | **CLIENT ALIAS** |
| `roles` | `roles` | OK |
| `talents` | `talents` | OK |
| `standFor` | `standFor` | OK (promoter only) |
| `profileBanner` | `banner` (+ resolve image path) | **CLIENT NORMALIZE** |
| `events.hosting.upcoming` | `activity.hostedEvents` | **CLIENT NORMALIZE** |
| `events.hosting.past` | `activity.hostedEventsPast` | **CLIENT NORMALIZE** |
| `events.going.upcoming` | `activity.goingTo` | **CLIENT NORMALIZE** (owner-only data) |
| `events.going.past` | `activity.attendedPast` | **CLIENT NORMALIZE** |
| `events.*.posterImageUrl` | - | **MISSING** - server SELECT or client fetch per event |
| `events.*.goingCount` | - | **MISSING on profile** - join `GET /api/events/attendance-summaries` |
| `events.*.address` / `neighborhood` / `ageRequirement` / `eventTypes` | - | **MISSING** on profile events |
| `stats.followers` | `stats.followers` | OK |
| `stats.hosting` | `stats.hosting` | OK |
| `stats.going` | `stats.going` | OK for owner; 0 public |
| `stats.shows` | derive `stats.events` | **CLIENT** |
| `stats.estYear` | year of `memberSince` | **CLIENT** |
| `stats.checkIns` | `stats.checkIns` | OK |
| `stats.saved` | - | **MISSING** (no saved-events API on profile) |
| `stats.gigs` / `gifting` | `stats.gigs` / `stats.gifting` | OK |
| `boardPosts` | merge `activity.gigs` + `gifting` + `spotted` | **CLIENT NORMALIZE** (see BoardTab) |
| Updates rail (likes/replies) | - | **MISSING** - no public social posts API |
| Hub organizer posts | `GET /api/hub/feed/posts/mine` (auth, self only) | **NOT public profile** |
| `businessPlace` | `ownedBusiness` | **CLIENT ALIAS** |
| `linkedVenues` | `linkedVenues` | OK |
| `affiliatedVenues` | `affiliatedVenues` | OK |
| `marquee` / `pup` / pack / media / socialLinks | same | OK |
| `ticketUrl` (profile-level) | first upcoming host `ticketUrl` | **CLIENT DERIVE** (not top-level) |
| `isOwner` / `isFollowing` | same | OK |
| `isAdmin` sticker | - | **MISSING on public profile** (see § Admin) |

---

## 5. Recommended client normalize signature

```ts
// Suggested: client/src/lib/normalizePublicProfile.ts
// (or client/src/components/profile/normalizePublicProfile.ts)

import type { MemberProfileData } from "@/pages/profile/types";
import type { PublicProfileData, ProfileBoardPost, ProfileEvent } from "@/components/profile/types";
import { PROFILE_BANNER_IMAGES, type ProfileBanner } from "@shared/profileTheme";
import { BOARD_COLORS } from "@shared/profileConstants"; // Spotted/Gifting/Gigs CSS vars

/**
 * Map LIVE GET /api/users/:username JSON → redesign view-model.
 * Does not invent server fields. Optional goingCounts from attendance-summaries.
 */
export function normalizePublicProfile(
  api: MemberProfileData,
  opts?: {
    /** Map eventId → going count from GET /api/events/attendance-summaries */
    goingCounts?: Record<number | string, { count: number }>;
  },
): PublicProfileData;

/** Resolve profileTheme banner key → image path or null (accent-gradient). */
export function resolveProfileBannerSrc(banner?: string | null): string | null;

/** activity.* → boardPosts for UpdatesPanel / BoardTab (no likes/replies). */
export function boardPostsFromActivity(
  activity: MemberProfileData["activity"],
): ProfileBoardPost[];
```

### Normalize sketch (behavior)

```ts
function withGoing(e: ProfileEventLike, counts?: ...): ProfileEvent {
  return {
    ...e,
    goingCount: counts?.[e.id]?.count ?? counts?.[String(e.id)]?.count,
    // posterImageUrl stays undefined unless server patched or enriched later
  };
}

export function normalizePublicProfile(api, opts): PublicProfileData {
  const isPromoter = !!(api.verifiedHost || api.showPromoterVariant);
  const a = api.activity ?? {};
  return {
    username: api.username,
    displayName: api.displayName,
    pronouns: api.pronouns,
    location: api.location,
    bio: api.bio,
    photoUrl: api.photoUrl,
    avatarChoice: api.avatarChoice,
    avatarRing: api.avatarRing,
    memberSince: api.memberSince,
    verifiedHost: api.verifiedHost,
    isPromoter,
    roles: api.roles,
    accentColor: api.accentColor || "#FF00CC",
    profileBanner: resolveProfileBannerSrc(api.banner),
    talents: api.talents,
    standFor: api.standFor,
    affiliatedVenues: api.affiliatedVenues,
    businessPlace: api.ownedBusiness ?? null,
    marquee: api.marquee ?? undefined,
    media: /* map platformLinks / items if shapes differ */ api.media as any,
    socialLinks: api.socialLinks,
    boardPosts: boardPostsFromActivity(api.activity),
    pup: api.pup,
    packmates: api.packmates,
    handlers: api.handlers,
    events: {
      hosting: {
        upcoming: (a.hostedEvents ?? []).map(e => withGoing(e, opts?.goingCounts)),
        past: (a.hostedEventsPast ?? []).map(e => withGoing(e, opts?.goingCounts)),
      },
      going: {
        upcoming: (a.goingTo ?? []).map(e => withGoing(e, opts?.goingCounts)),
        past: (a.attendedPast ?? []).map(e => withGoing(e, opts?.goingCounts)),
      },
    },
    stats: {
      followers: api.stats?.followers,
      hosting: api.stats?.hosting,
      shows: api.stats?.events, // design "Shows"
      estYear: api.memberSince ? new Date(api.memberSince).getFullYear() : null,
      going: api.stats?.going,
      checkIns: api.stats?.checkIns,
      events: api.stats?.events,
      gigs: api.stats?.gigs,
      gifting: api.stats?.gifting,
      // saved: MISSING
    },
    ticketUrl: a.hostedEvents?.[0]?.ticketUrl ?? null,
    isOwner: api.isOwner,
    isFollowing: api.isFollowing,
    linkedVenues: api.linkedVenues,
  };
}

function resolveProfileBannerSrc(banner?: string | null): string | null {
  if (!banner || banner === "accent-gradient") return null;
  return (PROFILE_BANNER_IMAGES as Record<string, string>)[banner] ?? null;
}
```

### Board posts normalize (already live in `pages/profile/tabs/BoardTab.tsx`)

```ts
// Pattern already shipping:
// gigs → board "Gigs", where = venueText, text = description || title
// gifting → "Gifting", where = neighborhood
// spotted → "Missed Connections", where = venueHint · dayOfWeek, text = body
// sort by createdAt desc
// colors: pages use CSS vars; redesign types use `color: string`
// shared/profileConstants BOARD_COLORS: Spotted/Gifting/Gigs
```

Use this for **UpdatesPanel** text cards **without** inventing likes/replies (show `timeAgo` only; hide heart/reply or hardcode `-` with TODO).

---

## 6. Server gaps that block poster / going / updates

### 6.1 Poster images on profile events - **BLOCKS Hosting rail quality**

`getPublicProfile` event SELECTs omit `poster_image_url`.  
Redesign `PosterCard` + `resolveEventPosterUrl(id, posterImageUrl)` will always fall back to placeholders.

**Minimal server patch:**

```sql
-- both hosted + attended queries, add:
e.poster_image_url AS posterImageUrl
-- optional extras used by components/profile ProfileEvent:
e.address, e.neighborhood, e.age_requirement AS ageRequirement,
e.event_types AS eventTypes
```

Parse `eventTypes` JSON server-side or leave string for client.  
Client types already have `posterImageUrl?` on redesign `ProfileEvent`.

### 6.2 Going counts - **client-join available (no server required for counts)**

`GET /api/events/attendance-summaries` → `Record<eventId, { count, preview }>`.

Already used in:

- `pages/profile/tabs/EventsTab.tsx` (always enabled)
- `components/profile/EventsTab.tsx` (enabled when `!!user` - fix to always load for public counts)

Pass into `normalizePublicProfile` or read in the panel.

### 6.3 Public “Going to” list privacy - **product gap**

Non-owners get `activity.goingTo = []` and `stats.going = 0`.  
Redesign “Going” panel will look empty for every public visitor.

**Options:**

- A) Accept privacy (show empty / “private calendar”).  
- B) Server patch: return upcoming going for everyone (or a privacy flag later).

### 6.4 Updates panel (social posts with likes/replies) - **no API**

| Source | Public by username? | Has likes/replies? |
|--------|---------------------|--------------------|
| `activity.gigs/gifting/spotted` | Yes (via profile) | No |
| Hub feed `getHubFeedPostsByUser` | Only `GET /api/hub/feed/posts/mine` (self) | No public likes API |
| Missed connections list endpoints | Not filtered as “profile updates rail” | No |

**Closest existing source for UpdatesPanel:** same merge as BoardTab (`gigs` + `gifting` + `spotted`), sorted by `createdAt`.  
**TODO marker:** likes/replies require new tables/endpoints - do not invent.

Optional future minimal endpoint (not required to ship UI shell):

```
GET /api/users/:username/board-posts  // or expand getPublicProfile with boardPosts[]
```

### 6.5 Admin sticker - **MISSING on public profile**

Public payload has no admin flag. Viewer `authUser.isAdmin` only describes the **logged-in viewer**, not the profile subject.

**Minimal server patch** (recommended for ADMIN sticker):

```ts
// in getPublicProfile return:
isSiteAdmin: isEnvListedSiteAdmin(user) || storage.hasSiteAdminGrant(user.id) || !!user.subAdmin,
```

(Or reuse `isMainAdminUser` logic without leaking email.)

Client: `isSiteAdmin || username === "tucker_pdmax"` is **not** a full admin rule - see § Admin.

### 6.6 Banner dual package

`components/profile/AccentPicker` writes **paths** via `profileConstants`; live API expects **enum keys** from `profileTheme`.  
When wiring owner edit, use `pages/profile/AccentBannerPopover` / `profileTheme` values.

---

## 7. Follow mutation (live snippet)

From `MemberProfile.tsx`:

```ts
const followMutation = useMutation({
  mutationFn: async () => {
    const method = data?.isFollowing ? "DELETE" : "POST";
    const res = await apiRequest(method, `/api/users/${username}/follow`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["profile", username] });
    toast({ title: data?.isFollowing ? "Unfollowed" : "Following", duration: 2000 });
  },
});

// UI: only when !isOwner
onFollow={() => followMutation.mutate()}
// following={!!data.isFollowing}
// followPending={followMutation.isPending}
```

Message (non-owner):

```ts
await apiRequest("POST", `/api/users/${encodeURIComponent(username)}/message`, { body });
// MessageModal in pages/profile/MessageModal.tsx
```

Owner theme save:

```ts
await apiRequest("PUT", "/api/users/me", { accentColor, banner /* ProfileBanner enum */ });
queryClient.invalidateQueries({ queryKey: ["profile", username] });
```

---

## 8. RSVP / EventModal open patterns

### 8.1 Shared RSVP hook (profile already uses for PosterCard)

`client/src/hooks/useEventRsvp.ts`:

```ts
const { myEventIds, toggleRsvp, showAuth, setShowAuth } = useEventRsvp();

// POST /api/events/${eventId}/attendance { message, isAnonymous: false }
// DELETE /api/events/${eventId}/attendance
// Invalidates: mine/check-ins, attendance-summaries
// Unauthed → showAuth gate

// In EventsTab:
onRsvp={() => toggleRsvp(evt.id)}
```

Profile cards currently navigate with `href={eventPath(...)}` rather than opening a modal.

### 8.2 EventModal (full event object required)

`EventModal` expects a full `Event` from `@shared/schema` (includes `posterImageUrl`, description, etc.).

**Events page pattern** (`Events.tsx`):

```tsx
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
// on card click → setSelectedEvent(eventFromList)
{selectedEvent && (
  <EventModal
    event={selectedEvent}
    onClose={closeEvent}
    onEventUpdated={updated => setSelectedEvent(updated)}
  />
)}
```

**Profile-safe open (if modal desired):**

```ts
// Profile events are thin → fetch full listing:
const res = await apiRequest("GET", `/api/events/${id}`);
const event = await res.json(); // publicEvent() includes resolved posterImageUrl
setSelectedEvent(event);
```

**FeaturedEventAd pattern** (`client/src/components/hub/sections/FeaturedEventAd.tsx`):

```tsx
type Props = { event: Event; onDismiss: () => void; slides?: string[] };
// resolveEventPosterUrl(event.id, event.posterImageUrl)
// local useCountdown(eventStartMs(event.dateStart)) → { done, days, hours, minutes, seconds }
// Ticket: <a href={event.ticketUrl}> if present
// RSVP row: setOpen(true) → <EventModal event={event} onClose={() => setOpen(false)} />
// Day accent: DAY_TEXT_COLORS[event.dayOfWeek] from @shared/eventWeek
```

Shared countdown also exists at `client/src/lib/countdown.ts` (`useCountdown` + `parsePacificEventTime`) and DS `client/src/components/ds/Countdown.tsx`.

---

## 9. UserAvatar + rings

| Piece | Path |
|-------|------|
| Component | `client/src/components/UserAvatar.tsx` |
| Ring IDs / emoji fallbacks | `shared/avatarRings.ts` |
| CSS | `client/src/index.css` ~L5073–5274 (`.user-avatar`, `[data-ring="…"]` conic gradients, shimmer) |

Props: `photoUrl`, `avatarChoice`, `avatarRing`, `displayName`, `username`, `size`, `shimmer`, `logoFit`.

`normalizeAvatarRing(value)`: unknown → `"progress"` (not `"none"`).  
Promoter hero currently forces `avatarRing="none"` when rendering avatar (`ProfileHero`).

---

## 10. Admin sticker eligibility

### What `SITE_ADMIN_GIG_OWNER` is **not**

In `client/src/pages/Admin.tsx`:

```ts
const SITE_ADMIN_GIG_TITLE = "Site Admins Needed: Zaylist";
const SITE_ADMIN_GIG_OWNER = "tucker_pdmax";
// Sticker only on admin gig moderation cards:
// gig.title === SITE_ADMIN_GIG_TITLE || gig.username === SITE_ADMIN_GIG_OWNER
```

Server mirrors: `SITE_ADMIN_GIG_OWNER_USERNAME = "tucker_pdmax"` in `server/storage.ts` (~L4892).  
This is **gig post labeling**, not a general profile admin badge.

### Real site-admin rule (auth / session)

`server/routes.ts`:

```ts
function isMainAdminUser(user) {
  // ADMIN_USER_EMAILS env (default hello.tuckercasey@gmail.com)
  // || ADMIN_USERNAMES env (default hello_tuckercasey,tucker_pdmax)
  // || storage.hasSiteAdminGrant(user.id)
}

// authUserResponse.isAdmin =
//   isMainAdminUser(user) || user.subAdmin
```

Client self-check patterns:

```ts
// AuthContext AuthUser.isAdmin from /api/auth/me
const isAdmin = Boolean(user?.isAdmin || adminSession?.isAdmin);
// Dashboard also: user?.promoterStatus === "approved" for feed posting
```

### Profile ADMIN sticker rule (recommended)

```ts
// After server adds isSiteAdmin to getPublicProfile:
const showAdminSticker = !!profile.isSiteAdmin;

// Until then - incomplete fallbacks only:
// - Viewer cannot know subject admin status from public API
// - Hardcoding username === "tucker_pdmax" matches default env owner only
```

**Do not** use `SITE_ADMIN_GIG_OWNER` alone as the profile admin rule for all admins (granted site admins + env co-admins would be missed).

### Promoter sticker

```ts
const showPromoterSticker = !!(data.verifiedHost || data.showPromoterVariant);
// redesign: data.isPromoter after normalize
// DS: StickerBadge color="lime" / "cyan" for admin
```

### isPromoter equivalence (canonical)

```
isPromoter
  ≡ verifiedHost
  ≡ showPromoterVariant
  ≡ (user.promoterStatus === "approved")
```

Server sets both booleans from the same expression. Prefer reading either flag; normalize to `isPromoter` for redesign components.

---

## 11. Accents + day color tokens

### Profile accents

`shared/profileConstants.ts` / `shared/profileTheme.ts` (prefer **profileTheme** for live write validation):

```
#FF00CC #00FFFF #CCFF00 #FF6600 #8800FF #00EE44|#39FF14 #0044FF #FF2400
```

Text-safe overrides: `#8800FF→#AA66FF`, `#0044FF→#4488FF` (also `--day-mon-text` / `--day-tue-text`).

### Day tokens (`--day-*`)

Defined in `client/src/index.css` and `design-system/tokens/tokens.css`:

| Token | Hex |
|-------|-----|
| `--day-mon` | `#8800FF` |
| `--day-tue` | `#0044FF` |
| `--day-wed` | `#FFEE00` |
| `--day-thu` | `#00FFFF` |
| `--day-fri` | `#FF00CC` |
| `--day-sat` | `#39FF14` |
| `--day-sun` | `#FF6600` |
| `--day-mon-text` | `#AA66FF` |
| `--day-tue-text` | `#4488FF` |
| `--day-multi` | rainbow gradient |

JS maps: `DAY_COLORS` / `DAY_TEXT_COLORS` in `shared/eventWeek.ts`.  
CSS helper: `dayAccentToken(day)` in `client/src/lib/dsColors.ts` → `var(--day-${code})`.  
Classes: `.day-MON` … `.day-SUN` in `index.css`.

Hosting rail day border/chip should use `DAY_COLORS[dayOfWeek]` or `var(--day-sat)` etc., matching HostingPanel mock.

---

## 12. Components worth reusing

### LIVE (wired under MemberProfile)

| Path | Role |
|------|------|
| `/Users/tuckercasey/pdx-pride-guide/client/src/pages/MemberProfile.tsx` | Route shell, queries, mutations |
| `pages/profile/types.ts` | **API-aligned types** |
| `pages/profile/ProfileHero.tsx` | Banner enum → image, avatar, promoter chips |
| `pages/profile/ProfileActionRow.tsx` | Follow / theme / share / tickets |
| `pages/profile/ProfileStatStrip.tsx` | Followers + role stats |
| `pages/profile/ProfileMarquee.tsx` | Promoter marquee + save |
| `pages/profile/tabs/EventsTab.tsx` | Hosting/going + attendance-summaries + `useEventRsvp` |
| `pages/profile/tabs/BoardTab.tsx` | **boardPosts normalize pattern** |
| `pages/profile/tabs/MediaTab.tsx` | Media card |
| `pages/profile/tabs/AboutTab.tsx` | Bio, pack, social, businesses |
| `pages/profile/MessageModal.tsx` | DM |
| `pages/profile/helpers.ts` | Social platforms, `fmtEventWhen`, `timeAgo` |
| `pages/profile/AccentBannerPopover.tsx` | **Correct** banner enum write path |

### Redesign draft (unwired, `components/profile/*`)

| Path | Role |
|------|------|
| `components/profile/types.ts` | `PublicProfileData` view model |
| `components/profile/ProfileHero.tsx` | Path-based banner, monogram promoters |
| `components/profile/EventsTab.tsx` | Expects `posterImageUrl` + `isPromoter` + nested `events` |
| `components/profile/BoardTab.tsx` | Expects prebuilt `posts` |
| `components/profile/profileHelpers.ts` | Social + promoter copy helpers |
| `components/profile/AccentPicker.tsx` | ⚠️ path-based banners - mismatch with live API |

**None of `components/profile/*` are imported by `App.tsx` today.**

### Shared DS / utilities to prefer in reimagined UI

- `UserAvatar` - glow rings  
- `@/components/ds`: `PosterCard`, `EventCard`, `Button`, `StickerBadge`, `StatPill`, `SectionHeader`, `Marquee`, `Countdown`  
- `@shared/eventPoster` `resolveEventPosterUrl`  
- `@/hooks/useEventRsvp`  
- `@shared/eventSlug` `eventPath`  
- `@shared/eventWeek` day colors  
- `FeaturedEventAd` - reference for countdown + ticket + EventModal composition (hub only)

---

## 13. Implementer checklist (no invented APIs)

1. Fetch `GET /api/users/:username` → type as `MemberProfileData`.  
2. `normalizePublicProfile(api, { goingCounts })` → `PublicProfileData`.  
3. Parallel `GET /api/events/attendance-summaries` for going badges.  
4. Promoter UI: `isPromoter = verifiedHost || showPromoterVariant`.  
5. Hosting posters: either **server patch** `posterImageUrl` or accept placeholders until patched.  
6. Updates: board merge only; TODO for likes/replies.  
7. Follow / message / theme: reuse MemberProfile mutations.  
8. Event deep dive: `href` to events page **or** fetch `GET /api/events/:id` + `EventModal`.  
9. Admin sticker: needs `isSiteAdmin` on public profile (or ship without admin sticker).  
10. Banner edits: **profileTheme enum keys only**.

---

## 14. File index (absolute paths)

| Concern | Path |
|---------|------|
| getPublicProfile | `/Users/tuckercasey/pdx-pride-guide/server/storage.ts` (~5790) |
| Routes | `/Users/tuckercasey/pdx-pride-guide/server/routes.ts` (~2210, follow, me) |
| Live types | `/Users/tuckercasey/pdx-pride-guide/client/src/pages/profile/types.ts` |
| Redesign types | `/Users/tuckercasey/pdx-pride-guide/client/src/components/profile/types.ts` |
| Active page | `/Users/tuckercasey/pdx-pride-guide/client/src/pages/MemberProfile.tsx` |
| Avatar | `/Users/tuckercasey/pdx-pride-guide/client/src/components/UserAvatar.tsx` |
| Avatar rings | `/Users/tuckercasey/pdx-pride-guide/shared/avatarRings.ts` |
| Profile theme (live) | `/Users/tuckercasey/pdx-pride-guide/shared/profileTheme.ts` |
| Profile constants (draft) | `/Users/tuckercasey/pdx-pride-guide/shared/profileConstants.ts` |
| Event poster helper | `/Users/tuckercasey/pdx-pride-guide/shared/eventPoster.ts` |
| Day colors | `/Users/tuckercasey/pdx-pride-guide/shared/eventWeek.ts` |
| RSVP hook | `/Users/tuckercasey/pdx-pride-guide/client/src/hooks/useEventRsvp.ts` |
| Featured ad | `/Users/tuckercasey/pdx-pride-guide/client/src/components/hub/sections/FeaturedEventAd.tsx` |
| Countdown util | `/Users/tuckercasey/pdx-pride-guide/client/src/lib/countdown.ts` |
| Design brief | `/tmp/profile-reimagined/grok-prompt.md` |

---

*End of contract map. No application source was modified; this report only.*
