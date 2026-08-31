export const COMMUNITY_RULES = [
  "Treat people with respect and follow the Community Standards.",
  "Keep posts relevant to this community.",
  "No harassment, hate, spam, or non-consensual content.",
] as const;

export type CommunityVisibility = "public" | "discoverable" | "private";
export type CommunityMembershipPolicy = "open" | "request" | "invite";
export type CommunityRole = "member" | "moderator" | "owner";

export type CommunitySummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  neighborhood: string | null;
  visibility: CommunityVisibility;
  membershipPolicy: CommunityMembershipPolicy;
  memberCount: number;
  viewerRole: CommunityRole | null;
  sourcePlaceId: number | null;
};

export type CommunityPost = {
  id: number;
  body: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    displayName: string | null;
    photoUrl: string | null;
  };
};

export type CommunityDetail = CommunitySummary & {
  rules: string[];
  moderators: Array<{ id: number; username: string; displayName: string | null }>;
  posts: CommunityPost[];
  related: {
    place: { id: number; name: string; url: string } | null;
    events: Array<{ id: number; title: string; dateStart: string; url: string }>;
  };
};

export function communitySlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "community";
}
