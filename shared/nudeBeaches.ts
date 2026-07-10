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

export type RoosterRockLive = {
  riverLevelFt: number | null;
  riverLevelAt: string | null;
  crossingBand: string | null;
  crossingAdvice: string | null;
  worthCrossing: boolean | null;
  weatherSummary: string | null;
  airTempF: number | null;
  wind: string | null;
  source: string;
  error?: string;
};

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

export const ROOSTER_ROCK_RESOURCES: ResourceLink[] = [
  {
    title: "Rooster Rock Crossing (live)",
    description: "River level, crossing bands, seasonal guide, and live camera — the best unofficial read for Sand Island access.",
    href: "https://roosterrockcrossing.com",
    priority: "primary",
  },
  {
    title: "Rooster Rock State Park (official)",
    description: "Hours, amenities, rules, and the park map from Oregon State Parks.",
    href: "https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=126",
  },
  {
    title: "USGS live river gage",
    description: "Columbia River below Bonneville Dam — raw gage height we mirror on this page.",
    href: "https://waterdata.usgs.gov/monitoring-location/USGS-14128870/",
  },
  {
    title: "NWS forecast",
    description: "National Weather Service forecast for the park area.",
    href: "https://forecast.weather.gov/MapClick.php?lat=45.5446&lon=-122.2342",
  },
  {
    title: "RoosterRock.org (community)",
    description: "Community trip reports and on-the-ground beach notes.",
    href: "https://roosterrock.org",
  },
];

export const SAUVIE_ISLAND_RESOURCES: ResourceLink[] = [
  {
    title: "Sauvie Island parking permits",
    description: "Official portal for mandatory parking permits — only place to see if a date is sold out in real time.",
    href: "https://www.sauvieislandparking.com/",
    priority: "primary",
  },
  {
    title: "Swim Guide — Collins Beach",
    description: "Bi-weekly water samples and health advisories for Collins Beach.",
    href: "https://www.theswimguide.org/beach/1792",
    priority: "primary",
  },
  {
    title: "Sauvie Island beaches (SICA)",
    description: "Community hub for island-wide alerts — road closures, bridge issues, and beach access changes.",
    href: "https://www.sauvieisland.org/beaches/",
  },
  {
    title: "Windfinder — Reeder Beach",
    description: "Live wind, tide, and weather patterns for the Sauvie Island area.",
    href: "https://www.windfinder.com/forecast/reeder_beach",
  },
  {
    title: "ODFW Sauvie Island Wildlife Area",
    description: "Day-use hours, rules, and wildlife area regulations.",
    href: "https://myodfw.com/sauvie-island-wildlife-area",
  },
];

export const TRAVELER_RULES = [
  "Alcohol is strictly prohibited on all beaches in the Sauvie Island Wildlife Area.",
  "Day-use hours are 4 a.m. to 10 p.m. in the wildlife area.",
  "Columbia River water is cold. Currents and underwater sand ridges can change fast.",
  "Rooster Rock east end is Oregon's designated clothing-optional beach; Collins Beach is partly clothing-optional.",
];

export const PLANNING_CHECKLIST = [
  {
    step: "Check permit status",
    detail: "Weekends and holidays through Labor Day require a Sauvie Island parking permit. Check SauvieIslandParking.com before you go.",
  },
  {
    step: "Check water safety",
    detail: "If you plan to swim at Collins, verify the latest Swim Guide sample. At Rooster Rock, read the live river level before crossing.",
  },
  {
    step: "Review rules & hours",
    detail: "No alcohol on wildlife-area beaches. Pack water, sun protection, and shoes that handle mud.",
  },
];