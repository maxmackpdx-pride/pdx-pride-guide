import { hasHousingPets } from "@shared/boardMotifs";
import type { HousingBoardResponse, HousingPostView } from "@shared/housing";
import { FORMING_FLAVOR_LABEL } from "@shared/housing";
import type { GigPost } from "@/pages/PrideWork";
import type { GiftingPost } from "@/components/board/GiftListingCard";
import type { SellzPost } from "@/components/board/SellzListingCard";
import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import { ROOMS } from "./rooms";

export type BoardCategory = "housing" | "gigz" | "giftz" | "sellz" | "mizzed";
export type BoardIntent =
  | "offering"
  | "looking"
  | "forming"
  | "managed"
  | "hiring"
  | "available"
  | "giving"
  | "iso"
  | "selling"
  | "connection"
  | "grab";
export const boardCategories = [
  {
    id: "mizzed",
    label: "Mizzed Connections",
    logo: "mizzed-connection.svg?v=20261013-texture",
    color: ROOMS.mizzed.accent,
    motif: "mizzed",
    endpoint: "/api/missed-connections",
    route: ROOMS.mizzed.route,
    description: "Maybe they felt it, too.",
    prompt: "A moment, a place, and one more chance to say hello.",
  },
  {
    id: "giftz",
    label: "Giftz",
    logo: "giftz.svg?v=20261013-texture",
    color: ROOMS.giftz.accent,
    motif: "giftz",
    endpoint: "/api/gifting",
    route: ROOMS.giftz.route,
    description: "Give a little. Find a lot.",
    prompt: "Pass something along or ask for what you need. Always free.",
  },
  {
    id: "sellz",
    label: "Sellz",
    logo: "sellz.svg?v=20261013-texture",
    color: ROOMS.sellz.accent,
    motif: "sellz",
    endpoint: "/api/sellz",
    route: ROOMS.sellz.route,
    description: "Secondhand. Next chapter.",
    prompt: "Shop community finds or sell something of your own.",
  },
  {
    id: "housing",
    label: "My Hoüz",
    logo: "my-houz.svg",
    color: ROOMS.hauz.accent,
    motif: "hauz",
    endpoint: "/api/housing",
    route: ROOMS.hauz.route,
    description: "A place. Your people.",
    prompt: "Find a room, join a Hoüz, or build one together.",
  },
  {
    id: "gigz",
    label: "Gigz",
    logo: "gigz.svg?v=20261013-texture",
    color: ROOMS.gigz.accent,
    motif: "gigz",
    endpoint: "/api/gigs",
    route: ROOMS.gigz.route,
    description: "Good work. Good people.",
    prompt: "Find your next gig or the person who can make it happen.",
  },
] satisfies {
  id: BoardCategory;
  label: string;
  logo: string;
  color: string;
  motif: string;
  endpoint: string;
  route: string;
  description: string;
  prompt: string;
}[];
export const intentLabels: Record<BoardIntent, string> = {
  offering: "Join our Hoüz",
  looking: "Looking to rent",
  forming: "Building a Hoüz",
  managed: "Managed rental",
  hiring: "Hiring",
  available: "Available for work",
  giving: "Giving away",
  iso: "In search of",
  selling: "For sale",
  connection: "Looking for you",
  grab: "Open grab",
};
export type BoardPost = {
  photos?: string[];
  housing?: HousingPostView;
  motifChoice?: string;
  key: string;
  id: number;
  category: BoardCategory;
  intent: BoardIntent;
  title: string;
  description: string;
  area: string;
  value: string;
  valueLabel?: string;
  detail: string;
  photo?: string;
  createdAt: string;
  householdCount?: number;
  hasPets?: boolean;
  openSlots?: number;
  isDemo?: boolean;
  status?: string;
  isMine?: boolean;
  itemCategory?: string;
  condition?: string;
  priceCents?: number;
  isRemote?: boolean;
  source?: string;
  saved?: boolean;
  tags?: string[];
};
export type BoardPayload =
  | HousingBoardResponse
  | GigPost[]
  | GiftingPost[]
  | SellzPost[]
  | MissedConnectionPost[];
const join = (...parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(" · ");
const base = (
  category: BoardCategory,
  post: { id: number; createdAt: string; motifChoice?: string; isDemo?: boolean; isMine?: boolean; status?: string; saved?: boolean },
) => ({
  category,
  motifChoice: post.motifChoice,
  isDemo: post.isDemo,
  isMine: post.isMine,
  status: post.status,
  saved: post.saved,
  id: post.id,
  key: `${category}:${post.id}`,
  createdAt: post.createdAt,
});
const liveGiftStatuses = new Set([
  "OPEN",
  "THREE_INTERESTED",
  "POSTER_CHOOSING",
  "PICKUP_PENDING",
  "REOPENED",
  "LOOKING",
  "OFFER_PENDING",
]);

/** Adapt visible inventory and preserved demos; owner views can include inactive posts. */
export function toBoardPosts(
  category: BoardCategory,
  payload: BoardPayload,
  includeInactive = false,
): BoardPost[] {
  switch (category) {
    case "housing":
      return (payload as HousingBoardResponse).posts
        .map((p) => ({
          ...base(category, p),
          intent: (
            {
              LOOKING: "looking",
              OFFERING: "offering",
              FORMING: "forming",
              MANAGED: "managed",
            } as const
          )[p.type],
          title: p.headline || p.displayName,
          description: p.body,
          area: p.areas.join(" / "),
          photo: p.photos[0],
          photos: p.photos,
          housing: p,
          value: p.type === "FORMING" ? (p.budget || "") : (p.rent || p.budget || ""),
          valueLabel: p.type === "FORMING" ? "Budget" : undefined,
          detail:
            p.type === "FORMING"
              ? join(
                  p.flavor && FORMING_FLAVOR_LABEL[p.flavor],
                  p.around && `Around ${p.around.propertyName}`,
                )
              : join(p.roomNote, p.moveIn || p.moveTimeline),
          hasPets: hasHousingPets(p.tags, p.household),
          householdCount: p.household.filter((person) => person.kind !== "PET")
            .length,
          openSlots: p.openSlots,
        }));
    case "gigz":
      return (payload as GigPost[])
        .filter((p) => includeInactive || p.status === "LIVE")
        .map((p) => ({
          ...base(category, p),
          intent: p.postType === "LOOKING_FOR_WORK" ? "available" : "hiring",
          title: p.title,
          description: p.description,
          area: join(p.location, p.isRemote ? "Remote okay" : ""),
          value: p.compensation || "",
          detail: p.skills || "",
          // Talent cards historically show the poster's portrait when no upload exists.
          photo: p.imageUrl || (!p.isDemo && p.postType === "LOOKING_FOR_WORK" ? p.posterPhotoUrl : undefined) || undefined,
        }));
    case "giftz":
      return (payload as GiftingPost[])
        .filter((p) => includeInactive || liveGiftStatuses.has(p.status))
        .map((p) => ({
          ...base(category, p),
          intent: p.postType === "ISO" ? "iso" : (p.pickupPreference || "").toLowerCase().includes("open grab") ? "grab" : "giving",
          title: p.title,
          description: p.description,
          area: p.neighborhood,
          value: "Free",
          detail: join(p.category, p.pickupPreference),
          photo: p.photoUrls[0],
          photos: p.photoUrls,
        }));
    case "sellz":
      return (payload as SellzPost[])
        .filter((p) => includeInactive || ["ACTIVE", "RESERVED"].includes(p.status))
        .map((p) => ({
          ...base(category, p),
          intent: "selling",
          title: p.title,
          description: p.description,
          area: p.neighborhood,
          value: new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: p.priceCents % 100 ? 2 : 0,
          }).format(p.priceCents / 100),
          detail: join(
            p.condition,
            p.status === "RESERVED"
              ? "Reserved"
              : p.negotiable
                ? "Open to offers"
                : "",
          ),
          photo: p.photoUrls[0],
          photos: p.photoUrls,
        }));
    case "mizzed":
      return (payload as MissedConnectionPost[])
        .filter((p) => includeInactive || p.status === "ACTIVE")
        .map((p) => ({
          ...base(category, p),
          intent: "connection",
          title: p.title,
          description: p.body,
          area: p.placeName || p.venueHint || "",
          value: p.eventTitle || "",
          detail: p.dayOfWeek || "",
        }));
  }
}

export function parseBoardPostKey(
  value: string | null,
): { category: BoardCategory; id: number } | null {
  const match = value?.match(/^(housing|gigz|giftz|sellz|mizzed):([1-9]\d*)$/);
  return match && Number.isSafeInteger(Number(match[2]))
    ? { category: match[1] as BoardCategory, id: Number(match[2]) }
    : null;
}
