/** Shared helpers for Gifting / Gig / Missed board feeds */

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function isOpenGrabPost(post: { postType: string; pickupPreference?: string }): boolean {
  return post.postType === "GIFT" && (post.pickupPreference || "").toLowerCase().includes("open grab");
}

export type BoardFilterChip = {
  key: string;
  label: string;
};