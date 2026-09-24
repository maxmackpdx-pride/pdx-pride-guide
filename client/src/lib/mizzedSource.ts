import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";

const PORTLAND_IMAGES: Record<string, string> = {
  bar: "https://images.unsplash.com/photo-1599648918338-9bae2cbf3155?w=900&q=85",
  cafe: "https://images.unsplash.com/photo-1656596991280-e7029666071e?w=900&q=85",
  nightlife: "https://images.unsplash.com/photo-1517592640034-4d5804694660?w=900&q=85",
};

export function placezStockImage(type?: string | null): string {
  const category = String(type || "").toLowerCase();
  if (category.includes("cafe") || category.includes("coffee") || category.includes("restaurant")) return PORTLAND_IMAGES.cafe;
  if (category.includes("bar") || category.includes("pub")) return PORTLAND_IMAGES.bar;
  return PORTLAND_IMAGES.nightlife;
}

export function mizzedSource(post: MissedConnectionPost) {
  if (post.eventId) return {
    label: "Eventz",
    title: post.eventTitle || "Eventz card",
    image: post.eventPosterUrl || null,
    href: `/events?event=${post.eventId}`,
    note: "Flyer from the linked Eventz card",
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
