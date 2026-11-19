import { apiRequest, parseApiError } from "@/lib/queryClient";

/**
 * Zay'list client: types and calls for the back end in server/zaylist.ts
 * (shipped as commit b9732713), plus the push allowance policy from
 * Tucker's Nov 19, 2026 ruling (ask 67).
 */

export type ZaylistEntryState =
  | "pending"
  | "accepted"
  | "redeemed"
  | "declined"
  | "expired"
  | "removed"
  | "gifted";

export interface ZaylistDrink {
  id: number;
  kind: "comp" | "discount";
  total: number;
  percent: number | null;
  used: number;
  remaining: number;
  revoked: boolean;
  grantedBy: number;
}

export interface ZaylistEntry {
  id: number;
  userId: number | null;
  contact: string | null;
  state: ZaylistEntryState;
  source: string;
  addedBy: number;
  authorityUserId: number;
  drawId: number | null;
  giftedFrom: number | null;
  createdAt: string;
  acceptedAt: string | null;
  username: string | null;
  displayName: string | null;
  important?: boolean;
  drinks: ZaylistDrink[];
}

export interface ZaylistConfig {
  eventId: number;
  poolSize: number;
  maxCap: number;
  drawDaysBefore: number | null;
  dripPerDay: number | null;
  updatedBy: number;
  updatedAt: string;
}

export interface ZaylistCounts {
  poolSize: number;
  maxCap: number;
  pending: number;
  accepted: number;
  arrived: number;
  declined: number;
  drinksOutstanding: number;
}

export interface ZaylistAllowance {
  userId: number;
  role: "staff" | "promoter" | "talent";
  spots: number;
  assignedBy: number;
  username: string;
  displayName: string | null;
}

export interface ZaylistGrant {
  userId: number;
  grantedBy: number;
  createdAt: string;
  username: string;
  displayName: string | null;
}

export interface ZaylistDraw {
  id: number;
  runBy: number;
  eligible: number;
  requested: number | null;
  awarded: number;
  createdAt: string;
}

export interface ZaylistPermissions {
  team: boolean;
  editor: boolean;
  allocator: boolean;
  canGrantDrinks: boolean;
  allowance: { role: string; spots: number; used: number } | null;
}

export interface ZaylistEventPayload {
  config: ZaylistConfig | null;
  counts: ZaylistCounts;
  entries: ZaylistEntry[];
  allowances?: ZaylistAllowance[];
  grants?: ZaylistGrant[];
  draws?: ZaylistDraw[];
  permissions: ZaylistPermissions;
}

export interface ZaylistGuestPayload {
  guest: true;
  entry: {
    id: number;
    state: ZaylistEntryState;
    source: string;
    token: string | null;
    drinks: ZaylistDrink[];
  };
  permissions: { team: false; editor: false; allocator: false };
}

export interface MyZaylistEntry {
  id: number;
  eventId: number;
  state: ZaylistEntryState;
  source: string;
  contact: string | null;
  createdAt: string;
  acceptedAt: string | null;
  eventTitle: string;
}

export interface ZaylistPass {
  entryId: number;
  state: ZaylistEntryState;
  event: {
    id: number;
    title: string;
    dateStart: string;
    venueName: string | null;
  } | null;
  token: string | null;
  drinks: ZaylistDrink[];
}

export interface MemberSearchResult {
  id: number;
  username: string;
  displayName: string | null;
  email: string;
}

async function json<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export const zaylistApi = {
  getEvent: (eventId: number) =>
    apiRequest("GET", `/api/events/${eventId}/zaylist`).then((r) =>
      json<ZaylistEventPayload | ZaylistGuestPayload>(r),
    ),
  putConfig: (
    eventId: number,
    body: {
      poolSize: number;
      maxCap: number;
      drawDaysBefore: number | null;
      dripPerDay: number | null;
    },
  ) => apiRequest("PUT", `/api/events/${eventId}/zaylist/config`, body).then((r) => json<ZaylistConfig>(r)),
  runDraw: (eventId: number, count?: number) =>
    apiRequest("POST", `/api/events/${eventId}/zaylist/draw`, count ? { count } : {}).then((r) => json(r)),
  expire: (eventId: number) =>
    apiRequest("POST", `/api/events/${eventId}/zaylist/expire`, {}).then((r) => json<{ expired: number }>(r)),
  search: (eventId: number, q: string) =>
    apiRequest("GET", `/api/events/${eventId}/zaylist/search?q=${encodeURIComponent(q)}`).then((r) =>
      json<{ results: MemberSearchResult[] }>(r),
    ),
  addEntry: (eventId: number, body: { userId?: number; contact?: string }) =>
    apiRequest("POST", `/api/events/${eventId}/zaylist/entries`, body).then((r) => json<{ entry: unknown }>(r)),
  removeEntry: (eventId: number, entryId: number) =>
    apiRequest("DELETE", `/api/events/${eventId}/zaylist/entries/${entryId}`).then((r) => json(r)),
  putAllowance: (eventId: number, userId: number, role: string, spots: number) =>
    apiRequest("PUT", `/api/events/${eventId}/zaylist/allowances/${userId}`, { role, spots }).then((r) => json(r)),
  deleteAllowance: (eventId: number, userId: number) =>
    apiRequest("DELETE", `/api/events/${eventId}/zaylist/allowances/${userId}`).then((r) => json(r)),
  putGrant: (eventId: number, userId: number) =>
    apiRequest("PUT", `/api/events/${eventId}/zaylist/grants/${userId}`, {}).then((r) => json(r)),
  deleteGrant: (eventId: number, userId: number) =>
    apiRequest("DELETE", `/api/events/${eventId}/zaylist/grants/${userId}`).then((r) => json(r)),
  putPrivilege: (eventId: number, userId: number) =>
    apiRequest("PUT", `/api/events/${eventId}/zaylist/privileges/${userId}`, {}).then((r) => json(r)),
  deletePrivilege: (eventId: number, userId: number) =>
    apiRequest("DELETE", `/api/events/${eventId}/zaylist/privileges/${userId}`).then((r) => json(r)),
  getMessages: (eventId: number) =>
    apiRequest("GET", `/api/events/${eventId}/zaylist/messages`).then((r) =>
      json<{
        generalBody: string;
        talentMessageId: number | null;
        savedMessages: { id: number; label: string; body: string }[];
      }>(r),
    ),
  putMessages: (eventId: number, body: { generalBody?: string; talentMessageId?: number | null }) =>
    apiRequest("PUT", `/api/events/${eventId}/zaylist/messages`, body).then((r) => json(r)),
  addSavedMessage: (eventId: number, label: string, body: string) =>
    apiRequest("POST", `/api/events/${eventId}/zaylist/saved-messages`, { label, body }).then((r) =>
      json<{ id: number }>(r),
    ),
  deleteSavedMessage: (eventId: number, msgId: number) =>
    apiRequest("DELETE", `/api/events/${eventId}/zaylist/saved-messages/${msgId}`).then((r) => json(r)),
  broadcast: (eventId: number, body: string) =>
    apiRequest("POST", `/api/events/${eventId}/zaylist/broadcasts`, { body }).then((r) => json(r)),
  getBroadcasts: (eventId: number) =>
    apiRequest("GET", `/api/events/${eventId}/zaylist/broadcasts`).then((r) =>
      json<{ broadcasts: { id: number; body: string; recipientCount: number; createdAt: string }[] }>(r),
    ),
  accept: (entryId: number) =>
    apiRequest("POST", `/api/zaylist/entries/${entryId}/accept`, {}).then((r) =>
      json<{ token: string; message: string | null; talentMessage: string | null }>(r),
    ),
  decline: (entryId: number) =>
    apiRequest("POST", `/api/zaylist/entries/${entryId}/decline`, {}).then((r) => json(r)),
  gift: (entryId: number, body: { userId?: number; contact?: string }) =>
    apiRequest("POST", `/api/zaylist/entries/${entryId}/gift`, body).then((r) => json(r)),
  regenerate: (entryId: number) =>
    apiRequest("POST", `/api/zaylist/entries/${entryId}/token/regenerate`, {}).then((r) =>
      json<{ token: string }>(r),
    ),
  getPass: (entryId: number) =>
    apiRequest("GET", `/api/zaylist/entries/${entryId}/pass`).then((r) => json<ZaylistPass>(r)),
  addDrink: (entryId: number, body: { kind: "comp" | "discount"; total: number; percent?: number }) =>
    apiRequest("POST", `/api/zaylist/entries/${entryId}/drinks`, body).then((r) => json(r)),
  revokeDrink: (drinkId: number) =>
    apiRequest("DELETE", `/api/zaylist/drinks/${drinkId}`).then((r) => json(r)),
  scan: (token: string) =>
    apiRequest("POST", `/api/zaylist/scan`, { token }).then((r) =>
      json<{
        result: "admitted" | "already-in";
        firstScan?: { by: string; at: string };
        guest: { username: string | null; displayName: string | null };
      }>(r),
    ),
  scanDrink: (token: string, drinkGrantId?: number) =>
    apiRequest("POST", `/api/zaylist/scan/drink`, drinkGrantId ? { token, drinkGrantId } : { token }).then((r) =>
      json<{ ok: boolean; kind?: string; remaining?: number }>(r),
    ),
  mine: () =>
    apiRequest("GET", `/api/me/zaylist`).then((r) =>
      json<{ entries: MyZaylistEntry[]; claimable: number }>(r),
    ),
  claimInvites: () =>
    apiRequest("POST", `/api/zaylist/invites/claim`, {}).then((r) => json<{ claimed: number }>(r)),
};

export function zaylistError(err: unknown, fallback: string): string {
  return parseApiError(err, fallback);
}

/* ------------------------------------------------------------------ */
/* Push allowance policy (ask 67, Nov 19, 2026)                        */
/* Owner: push to all users, no cooldown.                              */
/* Standard senders: followers 1 per 5 days, RSVPs 1 per day.          */
/* Paid members: followers 1 per 2 days, RSVPs 3 per day.              */
/* The back end enforces only the owner broadcast today; these numbers */
/* are the policy the UI states honestly, not a second enforcement.    */
/* ------------------------------------------------------------------ */

export type PushAudience = "everyone" | "followers" | "rsvps";
export type PushTier = "owner" | "paid" | "standard";

export interface PushAllowance {
  /** Max sends inside the window; Infinity for the owner. */
  limit: number;
  /** Window length in days. */
  windowDays: number;
}

export function pushTierFor(user: {
  isPrimaryOwner?: boolean;
  isPaidMember?: boolean;
}): PushTier {
  if (user.isPrimaryOwner) return "owner";
  if (user.isPaidMember) return "paid";
  return "standard";
}

export function pushAllowance(tier: PushTier, audience: PushAudience): PushAllowance {
  if (tier === "owner") return { limit: Number.POSITIVE_INFINITY, windowDays: 0 };
  if (audience === "everyone") return { limit: 0, windowDays: 0 };
  if (tier === "paid") {
    return audience === "followers"
      ? { limit: 1, windowDays: 2 }
      : { limit: 3, windowDays: 1 };
  }
  return audience === "followers"
    ? { limit: 1, windowDays: 5 }
    : { limit: 1, windowDays: 1 };
}

/**
 * Sends remaining in the current window, given the timestamps of past
 * sends to this audience. Purely a policy readout: the server is the
 * only enforcement, and today it enforces the owner broadcast only.
 */
export function pushRemaining(
  tier: PushTier,
  audience: PushAudience,
  sentAtIso: string[],
  now: Date = new Date(),
): number {
  const { limit, windowDays } = pushAllowance(tier, audience);
  if (!Number.isFinite(limit)) return Number.POSITIVE_INFINITY;
  if (limit === 0) return 0;
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
  const used = sentAtIso.filter((t) => {
    const ms = Date.parse(t);
    return Number.isFinite(ms) && ms > cutoff;
  }).length;
  return Math.max(0, limit - used);
}

export function entryName(e: {
  displayName: string | null;
  username: string | null;
  contact: string | null;
}): string {
  return e.displayName || e.username || e.contact || "Guest";
}

export function stateLabel(state: ZaylistEntryState): string {
  switch (state) {
    case "pending":
      return "Pending";
    case "accepted":
      return "On the list";
    case "redeemed":
      return "Arrived";
    case "declined":
      return "Declined";
    case "expired":
      return "Expired";
    case "removed":
      return "Removed";
    case "gifted":
      return "Gifted";
    default:
      return state;
  }
}
