/** Public artwork contract published by the canonical Foundation Library. */
export const FOUNDATION_ORIGIN = "https://zaylist-foundation-library.maxmackpdx.workers.dev";
export const MOTIF_RECIPES_URL = `${FOUNDATION_ORIGIN}/api/design/v1/motif-recipes`;

export type MotifRoom = "placez" | "needz" | "boardz";
export const MOTIF_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type MotifDay = typeof MOTIF_DAYS[number];
export type DayMotifPair = { frontId: string; backId: string; colorId: string; invertedId: string; color?: string };
export type MotifAsset = {
  id: string;
  url: string;
  sha256?: string;
  width?: number;
  height?: number;
  alpha?: boolean;
  kind?: string;
  room?: string;
};
export type CategoryMotifRecipe = {
  room: MotifRoom;
  category: string;
  intent?: string;
  heroId: string;
  companionId: string;
  aliasOf?: string;
};
export type PlaceMotifRecipe = { name: string; names: string[]; heroId: string; companionId: string };
export type MotifRecipes = {
  release: string;
  networkSets: { a: [string, string, string]; b: [string, string, string] };
  categories: CategoryMotifRecipe[];
  places?: PlaceMotifRecipe[];
  dayPairs: Record<MotifDay, DayMotifPair>;
  assets: Record<string, MotifAsset>;
};

export const REQUIRED_MOTIF_CATEGORIES: Record<MotifRoom, readonly string[]> = {
  placez: ["bar", "restaurant", "cafe", "venue", "service", "shop", "hotel", "realestate", "campground"],
  needz: ["health", "safety", "legal", "youth", "community", "family", "money", "arts", "mental-health", "harm-reduction"],
  boardz: ["housing", "giftz", "gigz", "sellz", "mizzed"],
};

const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const identifier = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9][a-z0-9-]*$/.test(value);
const assetIdentifier = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);

/** Reject partial releases: a card must never mix a hero with another release's companion. */
export function parseMotifRecipes(value: unknown): MotifRecipes {
  if (!record(value) || typeof value.release !== "string" || !value.release.trim() || !record(value.assets) || !record(value.networkSets) || !record(value.dayPairs) || !Array.isArray(value.categories)) {
    throw new Error("Invalid Foundation motif recipe envelope");
  }
  const assets: Record<string, MotifAsset> = {};
  for (const [id, raw] of Object.entries(value.assets)) {
    if (!assetIdentifier(id) || !record(raw) || raw.id !== id || typeof raw.url !== "string") throw new Error(`Invalid motif asset: ${id}`);
    const url = new URL(raw.url);
    const version = url.searchParams.get("v");
    const versioned = typeof raw.sha256 === "string" && /^[a-f0-9]{64}$/.test(raw.sha256)
      && version === raw.sha256.slice(0, 16) && [...url.searchParams.keys()].length === 1;
    if (url.origin !== FOUNDATION_ORIGIN || url.pathname !== `/api/design/v1/motifs/${id}/file` || (url.search && !versioned) || url.hash) throw new Error(`Unrecognized motif asset URL: ${id}`);
    assets[id] = { ...raw, id, url: url.href } as MotifAsset;
  }
  const triplet = (set: unknown): [string, string, string] => {
    if (!Array.isArray(set) || set.length !== 3 || !set.every(id => typeof id === "string" && assets[id])) throw new Error("A network set needs three published layers");
    return [...set] as [string, string, string];
  };
  const seen = new Set<string>();
  const categories = value.categories.map(raw => {
    if (!record(raw) || !["placez", "needz", "boardz"].includes(String(raw.room)) || !identifier(raw.category) || !identifier(raw.heroId) || !identifier(raw.companionId) || !assets[raw.heroId] || !assets[raw.companionId] || (raw.intent !== undefined && !identifier(raw.intent))) {
      throw new Error("Category recipe references unavailable artwork");
    }
    const key = `${raw.room}:${raw.category}:${raw.intent || ""}`;
    if (seen.has(key)) throw new Error(`Duplicate motif recipe: ${key}`);
    seen.add(key);
    return { ...raw } as CategoryMotifRecipe;
  });
  for (const [room, keys] of Object.entries(REQUIRED_MOTIF_CATEGORIES)) {
    for (const category of keys) if (!seen.has(`${room}:${category}:`)) throw new Error(`Missing motif recipe: ${room}:${category}`);
  }
  if (!seen.has("boardz:giftz:iso")) throw new Error("Missing Giftz ISO motif recipe");
  if (value.places !== undefined && !Array.isArray(value.places)) throw new Error("Invalid named-place recipes");
  const places = ((value.places ?? []) as unknown[]).map(raw => {
    if (!record(raw) || typeof raw.name !== "string" || !Array.isArray(raw.names) || !raw.names.length || !raw.names.every(name => typeof name === "string" && name.trim()) || !identifier(raw.heroId) || !identifier(raw.companionId) || !assets[raw.heroId] || !assets[raw.companionId]) throw new Error("Named-place recipe references unavailable artwork");
    return { ...raw } as PlaceMotifRecipe;
  });
  const rawDayPairs = value.dayPairs;
  const dayPairs = Object.fromEntries(MOTIF_DAYS.map(day => {
    const pair = rawDayPairs[day];
    if (!record(pair) || !["frontId", "backId", "colorId", "invertedId"].every(key => typeof pair[key] === "string" && assets[pair[key] as string])) throw new Error(`Incomplete day motif pair: ${day}`);
    return [day, { ...pair } as DayMotifPair];
  })) as Record<MotifDay, DayMotifPair>;
  return { ...value, release: value.release, networkSets: { a: triplet(value.networkSets.a), b: triplet(value.networkSets.b) }, categories, places, dayPairs, assets };
}

export function categoryMotifRecipe(recipes: MotifRecipes | null, room: MotifRoom, category: string, intent?: string) {
  const matching = recipes?.categories.filter(recipe => recipe.room === room && recipe.category === category) ?? [];
  return matching.find(recipe => recipe.intent === intent && intent !== undefined) ?? matching.find(recipe => !recipe.intent);
}

/** Existing consumer keys, including Boardz room doorways, resolve to the same recipes. */
export function resourceMotifCategory(category: string): { room: MotifRoom; category: string } | null {
  if (category.startsWith("place-")) return { room: "placez", category: category.slice(6) };
  if (["health", "safety", "legal", "youth", "community", "family", "money", "arts", "mental-health", "harm-reduction"].includes(category)) return { room: "needz", category };
  if (["housing", "hauz", "giftz", "gigz", "sellz", "mizzed"].includes(category)) return { room: "boardz", category: category === "hauz" ? "housing" : category };
  return null;
}

const normalizedPlaceName = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘]/g, "'").trim().toLowerCase().replace(/\s+/g, " ");
/** Named PlaceZ artwork wins before any category fallback. */
export function placeMotifRecipe(recipes: MotifRecipes | null, name: string) {
  const key = normalizedPlaceName(name);
  return recipes?.places?.find(recipe => recipe.names.some(alias => normalizedPlaceName(alias) === key));
}
