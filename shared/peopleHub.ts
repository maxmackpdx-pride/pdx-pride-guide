/** System guide identity - never shown in member people lists or discover. */
export const GUIDE_SYSTEM_USERNAMES = (process.env.GUIDE_SYSTEM_USERNAMES || "prideguidepdx")
  .split(",")
  .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
  .filter(Boolean);

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