import { sqlite, storage } from "./storage";
import { getOutzSnapshot } from "./outz";

/**
 * The places umbrella: ONE data layer under the three place-card families.
 *
 * SceneZ (communities), Placez (directory businesses), and Outzide
 * (destinations) each keep their own detailed API — /api/scenez/:slug,
 * /api/placez/:id, /api/outz/details — but every one of them resolves its
 * place through this registry, so identity, location, and artwork are
 * shared: a place is the same place in all three families. SceneZ
 * communities anchor to their source directory place (source_business_id)
 * and inherit its location from here.
 */
export type PlaceFamily = "scenez" | "placez" | "outzide";

export interface PlaceCore {
  family: PlaceFamily;
  /** slug (scenez), numeric id as a string (placez), destination id (outzide) */
  ref: string;
  name: string;
  neighborhood: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  imageUrl: string | null;
  /** Directory business this place anchors to, when known. */
  sourcePlaceId: number | null;
}

function businessCore(b: any): PlaceCore {
  return {
    family: "placez",
    ref: String(b.id),
    name: b.name,
    neighborhood: b.neighborhood ?? null,
    address: b.address ?? null,
    lat: b.lat ?? null,
    lng: b.lng ?? null,
    imageUrl: b.imageUrl ?? null,
    sourcePlaceId: b.id,
  };
}

function communityCore(row: any, businessesById: Map<number, any>): PlaceCore {
  const source = row.source_business_id
    ? businessesById.get(Number(row.source_business_id))
    : undefined;
  return {
    family: "scenez",
    ref: row.slug,
    name: row.name,
    neighborhood: row.neighborhood ?? source?.neighborhood ?? null,
    address: source?.address ?? null,
    lat: source?.lat ?? null,
    lng: source?.lng ?? null,
    imageUrl: row.image_url ?? source?.imageUrl ?? null,
    sourcePlaceId: row.source_business_id ? Number(row.source_business_id) : null,
  };
}

function outzPlaces(snapshot: any): any[] {
  return [
    ...(snapshot?.destinations || []),
    ...(snapshot?.catalog || []),
    ...(snapshot?.communityStays || []),
  ];
}

function outzCore(place: any): PlaceCore {
  return {
    family: "outzide",
    ref: place.id,
    name: place.name || place.title || place.id,
    neighborhood: place.neighborhood ?? place.region ?? null,
    address: place.address ?? null,
    lat: typeof place.lat === "number" ? place.lat : null,
    lng: typeof place.lng === "number" ? place.lng : null,
    imageUrl: place.imageUrl ?? place.image ?? null,
    sourcePlaceId: null,
  };
}

export async function getPlaceCore(
  family: PlaceFamily,
  ref: string,
): Promise<PlaceCore | null> {
  if (family === "placez") {
    const id = Number(ref);
    if (!Number.isInteger(id) || id <= 0) return null;
    const b = storage.getBusiness(id) as any;
    return b ? businessCore(b) : null;
  }
  if (family === "scenez") {
    const row = sqlite
      .prepare("SELECT * FROM communities WHERE slug = ?")
      .get(ref) as any;
    if (!row) return null;
    const businessesById = new Map(
      (storage.getBusinesses({}) as any[]).map(b => [b.id, b]),
    );
    return communityCore(row, businessesById);
  }
  const snapshot = (await getOutzSnapshot()).data as any;
  const place = outzPlaces(snapshot).find((p: any) => p.id === ref);
  return place ? outzCore(place) : null;
}

/** Every place under the umbrella, across all three families. */
export async function listPlaceCores(): Promise<PlaceCore[]> {
  const businesses = storage.getBusinesses({}) as any[];
  const businessesById = new Map(businesses.map(b => [b.id, b]));
  const cores: PlaceCore[] = businesses
    .filter(b => b.status !== "CLOSED")
    .map(businessCore);
  const communities = sqlite
    .prepare(
      "SELECT * FROM communities WHERE visibility IN ('public','discoverable')",
    )
    .all() as any[];
  for (const row of communities) cores.push(communityCore(row, businessesById));
  const snapshot = (await getOutzSnapshot()).data as any;
  const seen = new Set<string>();
  for (const place of outzPlaces(snapshot)) {
    if (!place?.id || seen.has(place.id)) continue;
    seen.add(place.id);
    cores.push(outzCore(place));
  }
  return cores;
}
