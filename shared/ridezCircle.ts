/** Ridez circle filter (owner, Nov 20): Everybody / Friends / Friends of friends.
 *  Shared by the event card Ridez panel and the Afterz/Ridez drawer (#117). */
export type RidezCircle = "everybody" | "friends" | "fof";
export type RideCircleTag = "you" | "friend" | "fof" | "everybody";

export const RIDEZ_CIRCLES: { value: RidezCircle; label: string; short: string }[] = [
  { value: "everybody", label: "Everybody", short: "EVERYBODY" },
  { value: "friends", label: "Friends", short: "FRIENDS" },
  { value: "fof", label: "Friends of friends", short: "FOF" },
];

/** Friends keeps you + friends; Friends of friends also keeps their friends. Unknown tags stay under Everybody only. */
export function inRidezCircle(tag: RideCircleTag | null | undefined, circle: RidezCircle): boolean {
  if (circle === "everybody") return true;
  if (tag === "you" || tag === "friend") return true;
  return circle === "fof" && tag === "fof";
}
