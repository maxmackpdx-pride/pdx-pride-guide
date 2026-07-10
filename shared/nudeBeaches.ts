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

export const ROOSTER_ROCK_CHECKLIST = [
  {
    step: "Check the river level",
    detail: "Read the live USGS gage and Rooster Rock Crossing before you attempt the Sand Island wade. About 18 ft is the highest worth trying.",
  },
  {
    step: "Time it for low water",
    detail: "The Columbia swings through the day. Aim for the low-water window — early July is usually the first safe bet; August is easiest.",
  },
  {
    step: "Pack for mud and cold",
    detail: "Trails stay muddy after the river drops. Water is cold, currents are strong, and sand ridges drop off without warning.",
  },
];

export const SAUVIE_ISLAND_CHECKLIST = [
  {
    step: "Check permit status",
    detail: "Weekends and holidays through Labor Day require a Sauvie Island parking permit. SauvieIslandParking.com is the only place to see sold-out dates live.",
  },
  {
    step: "Check water safety",
    detail: "Verify the latest Swim Guide sample for Collins Beach before you swim. Sampling on the Columbia is limited.",
  },
  {
    step: "Review wildlife-area rules",
    detail: "No alcohol on the beaches. Day-use hours are 4 a.m. to 10 p.m. Check SICA for road or bridge alerts.",
  },
];

export const ROOSTER_ROCK_RULES = [
  "Rooster Rock State Park is day-use: $10/day or an Oregon State Parks annual pass.",
  "The far east end of the park is Oregon's designated clothing-optional beach.",
  "Columbia River water is cold. Currents and underwater sand ridges can change fast.",
  "Never cross to Sand Island alone if you are unsure — check roosterrockcrossing.com at the water's edge.",
];

export const SAUVIE_ISLAND_RULES = [
  "Alcohol is strictly prohibited on all beaches in the Sauvie Island Wildlife Area.",
  "Day-use hours are 4 a.m. to 10 p.m. in the wildlife area.",
  "Collins Beach is partly clothing-optional — wild, sandy, and on the island's western shore.",
  "Parking permits are required on busy days through Labor Day — verify before you drive out.",
];