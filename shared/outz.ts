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

export const OUTZ_COMMUNITY_STAYS: OutzCommunityStay[] = [
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
