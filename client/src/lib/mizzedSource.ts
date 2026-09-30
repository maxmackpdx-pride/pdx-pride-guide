import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";

/** Portland stock photos (Unsplash license), served from /stock/portland so nothing hot-links. */
const STOCK = "/stock/portland";
const PORTLAND_STOCK = ["neon-sign", "skyline-sunset", "bridge-skyline", "downtown-street", "waterfront-blossoms", "shopfront", "nightlife", "bar", "cafe"]
  .map(name => `${STOCK}/${name}.jpg`);

/** A Portland photo that stays the same for a given post. */
export function portlandStockImage(seed: number): string {
  return PORTLAND_STOCK[Math.abs(Math.trunc(seed)) % PORTLAND_STOCK.length];
}

export function placezStockImage(type?: string | null): string {
  const category = String(type || "").toLowerCase();
  if (category.includes("cafe") || category.includes("coffee") || category.includes("restaurant")) return `${STOCK}/cafe.jpg`;
  if (category.includes("bar") || category.includes("pub")) return `${STOCK}/bar.jpg`;
  return `${STOCK}/nightlife.jpg`;
}

export function mizzedSource(post: MissedConnectionPost) {
  if (post.eventId) return {
    label: "Eventz",
    title: post.eventTitle || "Eventz card",
    image: post.eventPosterUrl || portlandStockImage(post.id),
    href: `/events?event=${post.eventId}`,
    note: post.eventPosterUrl ? "Flyer from the linked Eventz card" : "Portland stock photo. This event has no flyer yet.",
  };
  if (post.placeId) return {
    label: "Placez",
    title: post.placeName || post.venueHint || "Placez card",
    image: placezStockImage(post.placeType),
    href: `/map?place=${post.placeId}`,
    note: "Portland stock photo. Venue logo stays off this post.",
  };
  if (post.beachId === "rooster-rock" || post.beachId === "sauvie-island") return {
    label: "OutZide",
    title: post.beachId === "rooster-rock" ? "Rooster Rock" : "Sauvie Island",
    image: `/outzide-map/assets/motifs/places/${post.beachId}.svg`,
    href: `/outzide/${post.beachId}`,
    note: "Artwork from the linked OutZide destination",
  };
  return null;
}

/** The picture on a Mizzed post: the event flyer when it's tied to one, otherwise Portland. */
export function mizzedArt(post: MissedConnectionPost): string {
  return mizzedSource(post)?.image || portlandStockImage(post.id);
}
