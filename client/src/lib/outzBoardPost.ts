import type { BoardPost } from "@/lib/allBoards";

/** A row from /api/outz/board: a Trip Buddy, Carpool or Missed Connection wall post. */
export type OutzBoardPost = {
  id: number;
  placeId: string;
  placeName?: string;
  postKind: string;
  body: string;
  tripDate?: string | null;
  createdAt: string;
  userId?: number;
  isMine?: boolean;
  /** Set by the server for seeded DEMO cards. */
  isDemo?: boolean;
  displayName?: string;
  username?: string;
};

const BUDDY_KINDS = ["HIKE_BUDDY", "CAMP_BUDDY", "LOOKING_FOR_COMPANY"];
const CARPOOL_KINDS = ["CARPOOL", "CARPOOL_OFFER", "CARPOOL_REQUEST"];

const MISSED_KINDS = ["MISSED_CONNECTION"];

const BUDDY_TITLES: Record<string, string> = { HIKE_BUDDY: "Looking for a hike buddy", CAMP_BUDDY: "Looking for a camp buddy", LOOKING_FOR_COMPANY: "Looking for company" };
const RIDE_TITLES: Record<string, string> = { CARPOOL: "Carpool", CARPOOL_OFFER: "Offering a ride", CARPOOL_REQUEST: "Looking for a ride" };

export function outzBoardIntent(kind?: string): "buddy" | "ride" | "missed" | null {
  const k = String(kind || "").toUpperCase();
  if (MISSED_KINDS.includes(k)) return "missed";
  if (BUDDY_KINDS.includes(k)) return "buddy";
  if (CARPOOL_KINDS.includes(k)) return "ride";
  return null;
}

/**
 * Buddy and ride posts are place-first: tapping the card opens the place on
 * the Outzide map. Missed connections are not — they expand in place, like
 * every other BoardZ card.
 */
export function shouldOpenOutzPlace(intent?: string | null): boolean {
  return intent === "buddy" || intent === "ride";
}

/** Places with destination artwork on the Outzide map. */
const OUTZIDE_ARTWORK = ["rooster-rock", "sauvie-island"];

/** The source-card link shown inside an expanded OutZide missed connection. */
export function outzMissedSource(placeId?: string | null, placeName?: string | null) {
  const id = String(placeId || "");
  return {
    label: "OutZide",
    title: placeName || "OutZide destination",
    image: OUTZIDE_ARTWORK.includes(id) ? `/outzide-map/assets/motifs/places/${id}.svg` : null,
    href: `/outzide?place=${encodeURIComponent(id)}&tab=community`,
    note: "From the linked OutZide destination card",
  };
}

/** Adapt one /api/outz/board row. Only Trip Buddy, Carpool and Missed Connection posts belong on the Outzide board. */
export function outzBoardRowToPost(base: Pick<BoardPost, "category" | "motifChoice" | "isDemo" | "isMine" | "status" | "saved" | "id" | "key" | "createdAt">, p: OutzBoardPost): BoardPost {
  const intent = outzBoardIntent(p.postKind) ?? "buddy";
  const kind = p.postKind.toUpperCase();
  const place = p.placeName || "Outzide";
  return {
    ...base,
    isMine: Boolean(p.isMine),
    intent,
    title: (intent === "buddy" ? BUDDY_TITLES[kind] : intent === "missed" ? "Missed connection" : RIDE_TITLES[kind]) || place,
    description: p.tripDate ? `${p.body} · ${p.tripDate}` : p.body,
    area: place,
    detail: place,
    value: "",
    source: p.placeId,
  };
}

/** Wall post to board post, for specimens and previews. Null for kinds that are not Trip Buddy or Carpool. */
export function outzWallToBoardPost(post: { id: number | string; postKind?: string; title?: string; body?: string; placeName?: string; placeId?: string; tripDate?: string | null; createdAt?: string }): BoardPost | null {
  if (!outzBoardIntent(post.postKind)) return null;
  const id = Number(post.id) || 0;
  const row = outzBoardRowToPost(
    { category: "outz", id, key: `outz:${id}`, createdAt: post.createdAt || new Date().toISOString() } as never,
    { id, placeId: post.placeId || "", placeName: post.placeName, postKind: post.postKind!, body: post.body || "", tripDate: post.tripDate, createdAt: post.createdAt || "" },
  );
  return post.title ? { ...row, title: post.title } : row;
}
