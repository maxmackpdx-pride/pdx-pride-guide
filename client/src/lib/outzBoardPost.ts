import type { BoardPost } from "@/lib/allBoards";

/** Wall/feed post kinds that become Trip Buddy and Carpool Boardz cards. */
const BUDDY_KINDS = ["HIKE_BUDDY", "CAMP_BUDDY", "LOOKING_FOR_COMPANY"];
const CARPOOL_KINDS = ["CARPOOL", "CARPOOL_OFFER", "CARPOOL_REQUEST"];

export type OutzWallPostLike = {
  id: number | string;
  kind?: string;
  postKind?: string;
  title?: string;
  body?: string;
  placeName?: string;
  placeId?: string;
  tripDate?: string;
  createdAt?: string;
};

export function outzBoardCategory(kind?: string): "tripbuddy" | "carpool" | null {
  const k = String(kind || "").toUpperCase();
  if (BUDDY_KINDS.includes(k)) return "tripbuddy";
  if (CARPOOL_KINDS.includes(k)) return "carpool";
  return null;
}

/** Shape a wall post for PunkBoardCard. Returns null for kinds that are not Trip Buddy or Carpool. */
export function outzWallToBoardPost(post: OutzWallPostLike): BoardPost | null {
  const category = outzBoardCategory(post.postKind || post.kind);
  if (!category) return null;
  const buddy = category === "tripbuddy";
  const day = post.tripDate ? ` · ${post.tripDate}` : "";
  return {
    key: `outz-${category}-${post.id}`,
    id: Number(post.id) || 0,
    category,
    intent: buddy ? "buddy" : "ride",
    kicker: buddy ? "TRIP BUDDY" : "CARPOOL",
    logo: "outzide.png",
    title: post.title || (buddy ? "Find a trip buddy" : "Carpool"),
    description: (post.body || "") + day,
    area: post.placeName || "Outzide",
    detail: post.placeName || "Outzide",
    value: "",
    createdAt: post.createdAt || new Date().toISOString(),
  } as unknown as BoardPost;
}
