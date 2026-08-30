/**
 * Z/OUT public data contract. Locations arrive from named government sources;
 * community posts are deliberately a separate layer and never rewrite official
 * access or safety information.
 */
export type OutzDestinationKind = "camp-hike" | "beach";

export type OutzAlert = {
  headline: string;
  severity: string | null;
  endsAt: string | null;
};

export type OutzDestination = {
  id: string;
  name: string;
  subtitle: string;
  kind: OutzDestinationKind;
  lat: number;
  lng: number;
  officialUrl: string;
  sourceName: string;
  sourceStatus: string | null;
  forecast: string | null;
  airTempF: number | null;
  wind: string | null;
  alerts: OutzAlert[];
};

export type OutzCatalogPlace = {
  id: string;
  name: string;
  kind: "campground" | "trailhead";
  lat: number;
  lng: number;
  status: string | null;
  statusReason: string | null;
  officialUrl: string | null;
  sourceName: string;
};

/**
 * A reviewed operator listing is useful trip-planning context, but it is never
 * an official access or conditions source. Community-directory inclusion is a
 * discovery lead, not proof of ownership, inclusion policy, or availability.
 */
export type OutzCommunityStay = {
  id: string;
  name: string;
  region: string;
  kind: "campground" | "outdoor-stay";
  detail: string;
  accessNote: string;
  inclusionNote: string;
  officialUrl: string;
  discoverySource: {
    name: string;
    href: string;
  };
  reviewedAt: string;
};

export type OutzSource = {
  id: string;
  name: string;
  href: string;
  detail: string;
  live: boolean;
};

export type OutzSnapshot = {
  fetchedAt: string;
  destinations: OutzDestination[];
  catalog: OutzCatalogPlace[];
  communityStays: OutzCommunityStay[];
  sources: OutzSource[];
};

export type OutzPlaceKind = OutzDestinationKind | OutzCatalogPlace["kind"] | OutzCommunityStay["kind"];

/** A current OUTZ listing with a stable human-readable Z/ address. */
export type OutzPlace = {
  id: string;
  name: string;
  slug: string;
  kind: OutzPlaceKind;
  detail: string;
  officialUrl: string | null;
  sourceName: string;
  sourceStatus: string | null;
};

function outzSlugPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function outzPlaceSlug(place: Pick<OutzPlace, "id" | "name">) {
  return `${outzSlugPart(place.name) || "outz-place"}--${outzSlugPart(place.id)}`;
}

export function outzPlaceHref(place: Pick<OutzPlace, "id" | "name">) {
  return `/z/out/${outzPlaceSlug(place)}`;
}

export function outzPlacesFromSnapshot(snapshot: OutzSnapshot): OutzPlace[] {
  const featured = snapshot.destinations.map(place => ({
    id: place.id,
    name: place.name,
    slug: outzPlaceSlug(place),
    kind: place.kind,
    detail: place.subtitle,
    officialUrl: place.officialUrl,
    sourceName: place.sourceName,
    sourceStatus: place.sourceStatus,
  }));
  const catalog = snapshot.catalog.map(place => ({
    id: place.id,
    name: place.name,
    slug: outzPlaceSlug(place),
    kind: place.kind,
    detail: place.statusReason || "Official USFS recreation-site listing.",
    officialUrl: place.officialUrl,
    sourceName: place.sourceName,
    sourceStatus: place.status,
  }));
  const stays = snapshot.communityStays.map(place => ({
    id: place.id,
    name: place.name,
    slug: outzPlaceSlug(place),
    kind: place.kind,
    detail: place.detail,
    officialUrl: place.officialUrl,
    sourceName: place.discoverySource.name,
    sourceStatus: `Operator details reviewed ${place.reviewedAt}`,
  }));
  return [...featured, ...catalog, ...stays];
}

export function outzPlaceFromSlug(snapshot: OutzSnapshot, slug: string | null | undefined) {
  return outzPlacesFromSnapshot(snapshot).find(place => place.slug === slug) ?? null;
}

export const OUTZ_COMMUNITY_STAYS: OutzCommunityStay[] = [
  {
    id: "bamboo-acres",
    name: "Bamboo Acres",
    region: "Talent, OR · Southern Oregon",
    kind: "outdoor-stay",
    detail: "Private, clothing-optional getaway in Talent with lodging, glamping, tent camping, and limited dry RV space.",
    accessNote: "For men 21+; make reservations with the operator and confirm availability, arrival details, and dry-camping limits before driving.",
    inclusionNote: "The operator describes Bamboo Acres as a private, clothing-optional getaway for men 21 and over.",
    officialUrl: "https://www.bambooacres.org/",
    discoverySource: {
      name: "Gay Camping Friends directory",
      href: "https://gaycampingfriends.com/campground-category/gay-campgrounds",
    },
    reviewedAt: "2026-08-30",
  },
  {
    id: "triangle-recreation-camp",
    name: "Triangle Recreation Camp",
    region: "Granite Falls, WA · Pacific Northwest",
    kind: "campground",
    detail: "Private queer-centered campground with tent and RV camping in the Cascade foothills.",
    accessNote: "LGBTQ+ adults 21+; membership and reservation details are on the operator site. Seasonal access is operator-controlled.",
    inclusionNote: "Queer-centered status is stated by the operator.",
    officialUrl: "https://www.camptrc.org/",
    discoverySource: {
      name: "Gay Camping Friends directory",
      href: "https://gaycampingfriends.com/campground/triangle-recreation-camp",
    },
    reviewedAt: "2026-08-22",
  },
  {
    id: "umpquas-last-resort",
    name: "Umpqua's Last Resort",
    region: "Dry Creek · North Umpqua River, OR",
    kind: "outdoor-stay",
    detail: "Private RV park and campground with RV sites, glamping tents, cabins, and river access.",
    accessNote: "Confirm reservations, seasonal conditions, and local access directly with the operator before driving.",
    inclusionNote: "Listed as a community-directory lead; the operator site does not make a queer-specific claim.",
    officialUrl: "https://www.golastresort.com/about-us",
    discoverySource: {
      name: "Gay Camping Friends directory",
      href: "https://gaycampingfriends.com/campground/umpquas-last-resort",
    },
    reviewedAt: "2026-08-22",
  },
];

export const OUTZ_SOURCES: OutzSource[] = [
  {
    id: "nws",
    name: "National Weather Service",
    href: "https://www.weather.gov/documentation/services-web-api",
    detail: "Forecasts and active weather alerts for each featured destination.",
    live: true,
  },
  {
    id: "usfs",
    name: "US Forest Service Recreation Sites",
    href: "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RecInfraRecreationSites_02/MapServer",
    detail: "Official campground and trailhead catalog for Oregon and southern Washington.",
    live: true,
  },
  {
    id: "oregon-parks",
    name: "Oregon Parks and Recreation Department",
    href: "https://maps.prd.state.or.us/arcgis/rest/services/Land_ownership/Oregon_State_Parks/MapServer/0",
    detail: "Official Oregon state-park land data; always confirm a visit on the park page.",
    live: true,
  },
  {
    id: "washington-parks",
    name: "Washington State Parks",
    href: "https://services5.arcgis.com/4LKAHwqnBooVDUlX/arcgis/rest/services/ParkBoundaries/FeatureServer/2",
    detail: "Official Washington state-park boundaries and visitor-page links.",
    live: true,
  },
  {
    id: "recreation-gov",
    name: "Recreation.gov",
    href: "https://ridb.recreation.gov/access-agreement-ridb",
    detail: "Reservation API requires an account key, so availability is linked, not claimed here.",
    live: false,
  },
];
