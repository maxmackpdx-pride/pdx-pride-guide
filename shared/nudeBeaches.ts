export type NudeBeachTab = "rooster-rock" | "sauvie-island";

export type SwimGuideStatus = "pass" | "fail" | "warning" | "unknown";

export type LiveMetric = {
  label: string;
  value: string;
  detail?: string;
  status?: "good" | "warn" | "bad" | "neutral";
  href?: string;
};

export type ResourceLink = {
  title: string;
  description: string;
  href: string;
  priority?: "primary";
};

export type RiverLevelTrend = "rising" | "falling" | "steady";

export type RoosterRockLive = {
  riverLevelFt: number | null;
  riverLevelAt: string | null;
  todayLowFt: number | null;
  todayLowAt: string | null;
  todayHighFt: number | null;
  todayHighAt: string | null;
  crossingWindowNote: string | null;
  levelTrend: RiverLevelTrend | null;
  depthEstimate: string | null;
  crossingBand: string | null;
  crossingAdvice: string | null;
  worthCrossing: boolean | null;
  weatherSummary: string | null;
  airTempF: number | null;
  wind: string | null;
  waterTempF: number | null;
  waterTempSite: string | null;
  waterClarity: string | null;
  airQuality: string | null;
  source: string;
  error?: string;
};

export const ROOSTER_ROCK_PARKING = {
  location: "Rooster Rock State Park · I-84 Exit 25 · Corbett, OR",
  dayUseOr: "$10 / vehicle / day",
  dayUseOutOfState: "$12 / vehicle / day",
  annualOr: "$60 / year",
  annualOutOfState: "$75 / year",
  note: "Day-use only — Oregon State Parks pass or pay at the fee machine / QR on site.",
};

export type BeachMapLocation = {
  label: string;
  subtitle: string;
  lat: number;
  lng: number;
  zoom: number;
  pinColor: string;
};

export const BEACH_MAP_LOCATIONS: Record<NudeBeachTab, BeachMapLocation> = {
  "rooster-rock": {
    label: "Rooster Rock State Park",
    subtitle: "I-84 Exit 25 · Corbett, OR",
    lat: 45.5446,
    lng: -122.2342,
    zoom: 15,
    pinColor: "#FF6600",
  },
  "sauvie-island": {
    label: "Collins Beach",
    subtitle: "Clothing-optional · Sauvie Island Wildlife Area",
    lat: 45.793,
    lng: -122.789,
    zoom: 14,
    pinColor: "#00EE44",
  },
};

/** GPS presence anchors. Radius is generous — both beaches are 1–2km
 *  shorelines and the anchor sits mid-beach. Client coordinates are checked
 *  against these on the server and immediately discarded, never stored. */
export const BEACH_VERIFY_POINTS: Record<NudeBeachTab, { lat: number; lng: number; radiusM: number }> = {
  "rooster-rock": { lat: 45.5446, lng: -122.2342, radiusM: 2000 },
  "sauvie-island": { lat: 45.793, lng: -122.789, radiusM: 2000 },
};

export const ROOSTER_ROCK_MAPS = [
  {
    label: "Google Maps directions",
    href: "https://www.google.com/maps/dir/?api=1&destination=Rooster+Rock+State+Park%2C+Corbett%2C+OR",
  },
  {
    label: "Apple Maps directions",
    href: "https://maps.apple.com/?daddr=Rooster+Rock+State+Park,+Corbett,+OR&dirflg=d",
  },
  {
    label: "Crossing map",
    href: "https://roosterrockcrossing.com/#map",
  },
  {
    label: "OpenStreetMap",
    href: "https://www.openstreetmap.org/?mlat=45.5446&mlon=-122.2342#map=15/45.5446/-122.2342",
  },
] as const;

export const SAUVIE_ISLAND_MAPS = [
  {
    label: "Google Maps directions",
    href: "https://www.google.com/maps/dir/?api=1&destination=Collins+Beach,+Sauvie+Island,+OR",
  },
  {
    label: "Apple Maps directions",
    href: "https://maps.apple.com/?daddr=Collins+Beach,+Sauvie+Island,+OR&dirflg=d",
  },
  {
    label: "OpenStreetMap",
    href: "https://www.openstreetmap.org/?mlat=45.793&mlon=-122.789#map=14/45.793/-122.789",
  },
] as const;

export function depthAtCrossing(gageFt: number): number {
  if (gageFt <= 11) return 0;
  if (gageFt <= 13) return ((gageFt - 11) / 2) * 2;
  if (gageFt <= 15) return 2 + ((gageFt - 13) / 2) * 3;
  return 5 + (gageFt - 15);
}

export function depthEstimateFromGage(gageFt: number): string {
  const depth = depthAtCrossing(gageFt);
  if (depth <= 0.05) return "Dry — walk across";
  if (depth < 1.5) return "Ankle to shin deep";
  if (depth < 2.5) return "Knee deep";
  if (depth < 4) return "Waist deep";
  if (depth < 5.5) return "Chest deep";
  return "Over your head";
}

/** Wind-from-east pushes marsh material toward the crossing (roosterrockcrossing logic). */
export function estimateWaterClarity(windFrom: string | null, windMph: number | null): string | null {
  if (!windFrom) return null;
  const mph = windMph ?? 0;
  const fromEast = /^(E|NE|ENE|ESE|SE|SSE)$/.test(windFrom);
  if (fromEast && mph >= 12) return "Likely murky";
  if (fromEast && mph >= 6) return "Some debris possible";
  if (fromEast) return "Watch clarity";
  return "Likely clear";
}

export function aqiCategoryFromValue(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

export type SauvieIslandLive = {
  swimStatus: SwimGuideStatus | null;
  swimStatusLabel: string | null;
  lastSampleAt: string | null;
  swimSummary: string | null;
  parkingNote: string | null;
  parkingHref: string;
  weatherSummary: string | null;
  airTempF: number | null;
  wind: string | null;
  source: string;
  error?: string;
};

export type NudeBeachesSnapshot = {
  fetchedAt: string;
  roosterRock: RoosterRockLive;
  sauvieIsland: SauvieIslandLive;
};

export const NUDE_BEACH_TABS: { key: NudeBeachTab; label: string }[] = [
  { key: "rooster-rock", label: "Rooster Rock" },
  { key: "sauvie-island", label: "Sauvie Island" },
];

export function crossingBandFromLevel(ft: number): { band: string; advice: string; worthCrossing: boolean } {
  if (ft >= 18) {
    return {
      band: "Flooded",
      advice: "Usually too flooded to bother — check again right before you leave.",
      worthCrossing: false,
    };
  }
  if (ft >= 15) {
    return {
      band: "Swim or float",
      advice: "Expect a swim or float crossing. Cold water and strong currents possible.",
      worthCrossing: ft < 18,
    };
  }
  if (ft >= 13) {
    return {
      band: "Wade or swim",
      advice: "Shallow wading may turn into swimming. Sand ridges drop off abruptly.",
      worthCrossing: true,
    };
  }
  if (ft >= 11) {
    return {
      band: "Wade or walk",
      advice: "Often walkable with shallow wading — still check at the water's edge.",
      worthCrossing: true,
    };
  }
  if (ft >= 9) {
    return {
      band: "Very low",
      advice: "Low water — trails may still be muddy from recent highs.",
      worthCrossing: true,
    };
  }
  return {
    band: "Dry sand",
    advice: "Sandbars and trails are usually exposed. Mud can linger after recent floods.",
    worthCrossing: true,
  };
}

/** Official Sauvie Island beach parking permit portal (Collins, Walton, North Unit). */
export const SAUVIE_ISLAND_PARKING_URL = "https://sauvieislandparking.com/";

export const SAUVIE_ISLAND_WINDFINDER_URL =
  "https://www.windfinder.com/webcams/reeder_beach_sauvie_island";

export const SAUVIE_ISLAND_SWIM_GUIDE_URL = "https://www.theswimguide.org/beach/1792";

export const SAUVIE_ISLAND_SICA_BEACHES_URL = "https://www.sauvieisland.org/beaches/";

export const SAUVIE_ISLAND_RESOURCES: ResourceLink[] = [
  {
    title: "Swim Guide — Collins Beach",
    description:
      "Best source for current water quality — updated bi-weekly from actual samples at the beach. Health advisories and bacteria spikes post here.",
    href: SAUVIE_ISLAND_SWIM_GUIDE_URL,
    priority: "primary",
  },
  {
    title: "Sauvie Island Parking",
    description:
      "Mandatory permit portal for Collins, Walton, and North Unit. Only place to see live sold-out dates and the exact schedule through Labor Day.",
    href: SAUVIE_ISLAND_PARKING_URL,
    priority: "primary",
  },
  {
    title: "Sauvie Island beaches (SICA)",
    description:
      "Community hub for island-wide alerts — major road closures, bridge issues, and significant beach access changes.",
    href: SAUVIE_ISLAND_SICA_BEACHES_URL,
  },
  {
    title: "Windfinder — Reeder Beach",
    description:
      "Live wind, tides, and weather for the Sauvie Island area — the most reliable real-time read near Collins Beach.",
    href: SAUVIE_ISLAND_WINDFINDER_URL,
  },
];

export const SAUVIE_ISLAND_CHECKLIST = [
  {
    step: "Check permit status",
    detail:
      "Weekends and holidays through Labor Day require a permit. Always check SauvieIslandParking.com first — sold-out dates update there in real time.",
  },
  {
    step: "Check water safety",
    detail:
      "If you plan to swim, verify the latest Collins Beach sample on Swim Guide before you go.",
  },
  {
    step: "Review wildlife-area rules",
    detail:
      "Alcohol is prohibited on all beaches. Day-use hours are 4 a.m. to 10 p.m. Check SICA for road or bridge alerts.",
  },
];

export const SAUVIE_ISLAND_RULES = [
  "Alcohol is strictly prohibited on all beaches in the Sauvie Island Wildlife Area.",
  "Day-use hours are 4 a.m. to 10 p.m. in the wildlife area.",
  "Collins Beach is partly clothing-optional — wild, sandy, and on the island's western shore.",
  "Parking permits are required on busy days through Labor Day — verify before you drive out.",
];