export type NudeBeachTab = "rooster-rock" | "sauvie-island";

export const Z_OUT_BEACH_PATHS: Record<NudeBeachTab, string> = {
  "rooster-rock": "/z/out/rooster-rock",
  "sauvie-island": "/z/out/sauvie-island",
};

export type SwimGuideStatus = "pass" | "fail" | "warning" | "unknown";

export function formatSwimStatusLabel(status: SwimGuideStatus | null): string | null {
  switch (status) {
    case "pass":
      return "PASSED";
    case "fail":
      return "FAILED";
    case "warning":
      return "ADVISORY";
    case "unknown":
      return "UNKNOWN";
    default:
      return null;
  }
}

export function normalizeSwimStatusLabel(
  label: string | null | undefined,
  status?: SwimGuideStatus | null,
): string | null {
  const fromStatus = status ? formatSwimStatusLabel(status) : null;
  if (fromStatus) return fromStatus;
  if (!label) return null;
  const trimmed = label.trim();
  if (/^passed$/i.test(trimmed)) return "PASSED";
  if (/^failed$/i.test(trimmed)) return "FAILED";
  if (/^advisory$/i.test(trimmed)) return "ADVISORY";
  if (/^unknown$/i.test(trimmed)) return "UNKNOWN";
  return trimmed.toUpperCase();
}

export function normalizeSwimSummary(summary: string | null | undefined): string | null {
  if (!summary) return null;
  return summary
    .replace(/\bPassed\b/gi, "PASSED")
    .replace(/\bFailed\b/gi, "FAILED");
}

/** Hub card copy - drops the status word already shown in the hero stats band. */
export function swimSummaryDetail(summary: string | null | undefined): string | null {
  const normalized = normalizeSwimSummary(summary);
  if (!normalized) return null;
  const stripped = normalized
    .replace(/^(PASSED|FAILED|ADVISORY|UNKNOWN)\s+/i, "")
    .trim();
  return stripped || null;
}

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

/** One NWS daytime period, keyed by Pacific YYYY-MM-DD. */
export type DayForecastBrief = {
  date: string;
  name: string;
  shortForecast: string | null;
  highF: number | null;
  wind: string | null;
};

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
  /** Upcoming daytime forecasts (Pacific dates) for plan-ahead UI. */
  forecastDays?: DayForecastBrief[];
  source: string;
  error?: string;
};

export const ROOSTER_ROCK_PARKING = {
  location: "Rooster Rock State Park · I-84 Exit 25 · Corbett, OR",
  dayUseOr: "$10 / vehicle / day",
  dayUseOutOfState: "$12 / vehicle / day",
  annualOr: "$60 / year",
  annualOutOfState: "$75 / year",
  hours: "Jun–Aug: 7am–10pm · Sep–May: 6am–dusk",
  note: "Day-use only - Oregon State Parks pass or pay at the fee machine / QR on site.",
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

/**
 * The public map intentionally shows the official place anchor only. It must
 * not publish unverified shortcuts, informal hangouts, or precise location
 * claims about visitors or queer community activity.
 */

/** GPS presence anchors. Radius is generous - both beaches are 1–2km
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

/** Columbia Gorge beaches report "today" on Pacific time, not UTC. */
export const BEACH_TIME_ZONE = "America/Los_Angeles";

export function calendarDayInTimeZone(isoOrDate: string | Date, timeZone = BEACH_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate,
  );
}

export function formatWindStat(wind?: string | null): { value: string; label: string } {
  if (!wind?.trim()) return { value: "-", label: "Wind" };
  const mphMatch = wind.match(/(\d+(?:\s*to\s*\d+)?)\s*mph/i);
  const dir = wind.trim().split(/\s+/)[0] ?? "-";
  if (mphMatch) return { value: `${dir} ${mphMatch[1]}`, label: "Wind · mph" };
  return { value: wind.trim(), label: "Wind" };
}

export function depthEstimateFromGage(gageFt: number): string {
  const depth = depthAtCrossing(gageFt);
  if (depth <= 0.05) return "Dry - walk across";
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
  /**
   * Short live read from the parking portal scrape:
   * OPEN | DAY PASS (seasonal sold out, dailies available) | SOLD OUT (day inventory) | CHECK.
   * Never treat "seasonal sold out" alone as full parking sold-out.
   */
  parkingStatusLabel: string | null;
  parkingHref: string;
  weatherSummary: string | null;
  airTempF: number | null;
  wind: string | null;
  forecastDays?: DayForecastBrief[];
  source: string;
  error?: string;
};

export type NudeBeachesSnapshot = {
  fetchedAt: string;
  roosterRock: RoosterRockLive;
  sauvieIsland: SauvieIslandLive;
};

export function normalizeSauvieIslandLive(live: SauvieIslandLive): SauvieIslandLive {
  return {
    ...live,
    swimStatusLabel: normalizeSwimStatusLabel(live.swimStatusLabel, live.swimStatus),
    swimSummary: normalizeSwimSummary(live.swimSummary),
  };
}

export function normalizeNudeBeachesSnapshot(snapshot: NudeBeachesSnapshot): NudeBeachesSnapshot {
  return {
    ...snapshot,
    sauvieIsland: normalizeSauvieIslandLive(snapshot.sauvieIsland),
  };
}

export const NUDE_BEACH_TABS: { key: NudeBeachTab; label: string }[] = [
  { key: "rooster-rock", label: "Rooster Rock" },
  { key: "sauvie-island", label: "Sauvie Island" },
];

/** Five bands aligned with roosterrockcrossing.com LEVEL_BANDS (<9, 9–11, 11–13, 13–15, 15+). */
export function crossingBandFromLevel(ft: number): { band: string; advice: string; worthCrossing: boolean } {
  return {
    band: crossingBandLabel(ft),
    advice: crossingVerdictFromLevel(ft),
    worthCrossing: ft <= 18,
  };
}

export function crossingBandLabel(ft: number): string {
  if (ft >= 15) return "Swim or float";
  if (ft >= 13) return "Wade or swim";
  if (ft >= 11) return "Wade or walk";
  if (ft >= 9) return "Very low";
  return "Dry";
}

/** Verdict copy from roosterrockcrossing.com tierFor(). */
export function crossingVerdictFromLevel(ft: number): string {
  if (ft >= 15) {
    return "The water's high - you'll likely need to swim or float to reach Sand Island. Be careful.";
  }
  if (ft >= 13) {
    return "Expect to wade, and possibly swim across the deeper channel. Tread carefully.";
  }
  if (ft < 9) {
    return "The crossing may be dry enough to walk straight across.";
  }
  return "The water's low - you can likely wade, or even walk, to Sand Island.";
}

/** Official ODFW 2026 parking guidance for Collins, Walton, and North Unit beaches. */
export const SAUVIE_ISLAND_PARKING_URL =
  "https://myodfw.com/articles/parking-sauvie-island-wildlife-area";

export const SAUVIE_ISLAND_WINDFINDER_URL =
  "https://www.windfinder.com/webcams/reeder_beach_sauvie_island";

export const SAUVIE_ISLAND_SWIM_GUIDE_URL = "https://www.theswimguide.org/beach/1792";

export const SAUVIE_ISLAND_SICA_BEACHES_URL = "https://www.sauvieisland.org/beaches/";

export const SAUVIE_ISLAND_FARM_STORES: ResourceLink[] = [
  {
    title: "Sauvie Island Farms",
    description: "Berries, flowers, and u-pick fields - one of the island's classic farm stops on the road to Collins.",
    href: "http://www.sauvieislandfarms.com/",
  },
  {
    title: "The Pumpkin Patch & Corn Maze",
    description: "Farm market, animals, and seasonal produce - a Sauvie Island institution year-round.",
    href: "https://www.thepumpkinpatch.com/",
  },
  {
    title: "Topaz Farm",
    description: "Organic farm stand with produce, flowers, and pasture-raised eggs - great mid-island detour.",
    href: "https://topazfarm.com/",
  },
  {
    title: "Columbia Farms U-Pick",
    description: "Seasonal berries and produce on the north end - check what's picking before you swing by.",
    href: "https://www.columbiafarmsu-pick.com/",
  },
];

export type SauvieChecklistItem = {
  step: string;
  detail: string;
  href?: string;
  linkLabel?: string;
};

export const SAUVIE_ISLAND_CHECKLIST: SauvieChecklistItem[] = [
  {
    step: "Check permit status",
    detail:
      "From June 19 through Labor Day, Collins uses a limited Beaches permit on summer weekends and select holidays. Summer weekdays use the Wildlife Area permit instead. Check the official calendar before you drive.",
    href: SAUVIE_ISLAND_PARKING_URL,
    linkLabel: "Sauvie Island Parking",
  },
  {
    step: "Check water safety",
    detail:
      "If you plan to swim, verify the latest Collins Beach sample before you go.",
    href: SAUVIE_ISLAND_SWIM_GUIDE_URL,
    linkLabel: "Swim Guide",
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
  "Collins Beach is partly clothing-optional - wild, sandy, and on the island's western shore.",
  "Parking permits change by date: limited Beaches permits cover summer weekends and select holidays; Wildlife Area permits cover summer weekdays. Seasonal sold-out does not mean daily permits are gone.",
];
