import type { IStorage } from "./storage";

/** Social circle of a member relative to the viewer (Ridez circle filter, Nov 20).
 *  friend = mutual follow (the same rule as ride-check trusted members);
 *  fof    = not a friend, but mutually follows one of the viewer's friends.
 *  Only the bucket is returned, never who the shared friend is. */
export type SocialCircle = "you" | "friend" | "fof" | "everybody";

/** Bounds the friends-of-friends scan per request (follow-all soft launch makes friend lists large). */
export const FOF_SCAN_LIMIT = 500;

export function createCircleOf(storage: Pick<IStorage, "isFollowing" | "getFollowingList">, viewer: number) {
  const mutual = (a: number, b: number) => storage.isFollowing(a, b) && storage.isFollowing(b, a);
  const cache = new Map<number, SocialCircle>();
  let friends: number[] | null = null;
  return (member: number | null | undefined): SocialCircle => {
    if (member == null) return "everybody";
    if (member === viewer) return "you";
    const hit = cache.get(member);
    if (hit) return hit;
    let circle: SocialCircle = "everybody";
    if (mutual(viewer, member)) circle = "friend";
    else {
      friends ??= storage.getFollowingList(viewer, viewer).map(u => u.id).filter(id => id !== viewer && storage.isFollowing(id, viewer)).slice(0, FOF_SCAN_LIMIT);
      if (friends.some(c => c !== member && mutual(c, member))) circle = "fof";
    }
    cache.set(member, circle);
    return circle;
  };
}
