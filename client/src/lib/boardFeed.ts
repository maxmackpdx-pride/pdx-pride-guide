/** Shared helpers for Gifting / Gig / Missed board feeds */

export function isOpenGrabPost(post: { postType: string; pickupPreference?: string }): boolean {
  return post.postType === "GIFT" && (post.pickupPreference || "").toLowerCase().includes("open grab");
}

export type BoardFilterChip = {
  key: string;
  label: string;
};