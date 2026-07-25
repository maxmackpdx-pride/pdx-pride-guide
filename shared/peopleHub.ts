/**
 * System / brand identities - never shown in member people lists or discover.
 * Keep `prideguidepdx` as the live system mailbox username until a deliberate migration.
 * `zaylist` is reserved so it cannot be squatted as a member handle.
 */
export const GUIDE_SYSTEM_USERNAMES = (process.env.GUIDE_SYSTEM_USERNAMES || "prideguidepdx,zaylist")
  .split(",")
  .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
  .filter(Boolean);

/** Public-facing handle for the system guide account (DB may still be prideguidepdx). */
export const GUIDE_PUBLIC_HANDLE = "zaylist";

export function isGuideSystemUsername(username: string): boolean {
  return GUIDE_SYSTEM_USERNAMES.includes(username.trim().toLowerCase().replace(/^@/, ""));
}

export type PeopleHubUser = {
  id: number;
  username: string;
  displayName: string | null;
  photoUrl: string | null;
  avatarChoice: number;
  avatarRing: string;
  bio: string | null;
  verifiedHost: boolean;
  followers: number;
  isFollowing: boolean;
  subtitle: string | null;
};

/** Directory venue followed via business_follows (Places follow button). */
export type HubFollowedPlace = {
  id: number;
  name: string;
  type: string;
  neighborhood: string | null;
  imageUrl: string | null;
  isFollowing: boolean;
  followerCount: number;
};

/**
 * Following tab payload: people (user follows) + places (venue follows).
 * Followers / discover tabs still return PeopleHubUser[].
 */
export type PeopleFollowingPayload = {
  people: PeopleHubUser[];
  places: HubFollowedPlace[];
};

export type PeopleHubTab = "following" | "followers" | "discover";

export type FollowStats = {
  followers: number;
  following: number;
};