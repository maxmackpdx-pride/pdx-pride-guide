/**
 * Trusted venue calendars - QSearch "Trusted" health board + dedicated adapters.
 *
 * Manual Sync now / Sync all → Review queue (admin approves LIVE or HIDDEN).
 * Keep this list small and intentional.
 */

export type TrustedHealthStatus = "green" | "yellow" | "red" | "unknown";

export type TrustedVenueDef = {
  /** Matches INGEST_SOURCES id */
  sourceId: string;
  /** Display name on Trusted board */
  venueName: string;
  /** Default address when feed omits location */
  address: string;
  neighborhood?: string;
  /** How we pull events */
  fetchMode:
    | "badlands_api"
    | "sanctuary_ics"
    | "eagle_wix"
    | "darcelle_tribe"
    | "hawks_squarespace"
    | "sports_bra_airtable"
    | "generic";
  /** Primary feed URL (may need date expansion at runtime) */
  feedUrl: string;
  /** Human calendar page for admins */
  calendarPageUrl: string;
  /** Preferred status when approving from Review (or rare publish-mode automation) */
  publishStatus: "LIVE" | "HIDDEN";
  /** Hours between trusted sync runs */
  pollHours: number;
  notes?: string;
  /**
   * Declarative per-venue rules applied to every draft (after any dedicated
   * adapter policy). New venues get correct policy without new code.
   */
  venuePolicy?: {
    /** Force schema enum age (restrictive default; Review can adjust) */
    ageRequirement?: "ALL_AGES" | "18_PLUS" | "21_PLUS";
    /** Warning breadcrumb explaining the age default for Review */
    ageNote?: string;
    /** Sex-club stamps: isSexPositive + nudityOk + SEX_POSITIVE/NUDITY_OK/KINK tags */
    sexPositive?: boolean;
    /** Re-infer admission from text - never invent FREE (default true) */
    reinferAdmission?: boolean;
  };
};

/** Ordered for QSearch Trusted tab. */
export const TRUSTED_VENUES: TrustedVenueDef[] = [
  {
    sourceId: "badlands-api",
    venueName: "Badlands",
    address: "110 NW Broadway, Portland, OR",
    neighborhood: "Old Town",
    fetchMode: "badlands_api",
    feedUrl: "https://badlands-events.badlandsportland.workers.dev/api/calendar",
    calendarPageUrl: "https://www.badlandsportland.com/calendar",
    publishStatus: "LIVE",
    pollHours: 6,
    notes: "Worker JSON + photoUrl flyers. Requires ?from=&to= date window.",
  },
  {
    sourceId: "sanctuary-ics",
    venueName: "Sanctuary Club",
    address: "33 NW 9th Ave, Portland, OR 97209",
    neighborhood: "Pearl District",
    fetchMode: "sanctuary_ics",
    feedUrl: "https://pdxsanctuary.com/events/calendar/sanctuary/ics/",
    calendarPageUrl: "https://pdxsanctuary.com/calendar/",
    publishStatus: "LIVE",
    pollHours: 6,
    notes: "ICS for structure; flyers from per-event pages + series reuse.",
  },
  {
    sourceId: "eagle-events",
    venueName: "Eagle Portland",
    address: "835 N Lombard St, Portland, OR 97217",
    neighborhood: "North Portland",
    fetchMode: "eagle_wix",
    feedUrl: "https://www.eagleportland.com/what-s-happening",
    calendarPageUrl: "https://www.eagleportland.com/what-s-happening",
    publishStatus: "LIVE",
    pollHours: 6,
    notes:
      "Wix Events via appsWarmupData. 21+ bar - never ALL_AGES; cover UNKNOWN unless listing says free.",
  },
  {
    sourceId: "darcelle-tribe",
    venueName: "Darcelle XV Showplace",
    address: "208 NW 3rd Ave, Portland, OR",
    neighborhood: "Old Town",
    fetchMode: "darcelle_tribe",
    feedUrl: "https://darcellexv.com/wp-json/tribe/events/v1/events",
    calendarPageUrl: "https://darcellexv.com/events/",
    publishStatus: "LIVE",
    pollHours: 6,
    notes:
      "Tribe REST JSON, image.url flyers, paginated (next_rest_url); ICS ?ical=1 fallback (ATTACH flyers). Age defaults 21_PLUS - verify all-ages/brunch shows in Review.",
  },
  {
    sourceId: "hawks-json",
    venueName: "Hawks PDX",
    address: "335 SE 99th Ave, Portland, OR 97216",
    neighborhood: "SE Portland",
    fetchMode: "hawks_squarespace",
    feedUrl: "https://www.hawkspdx.com/hawks-events?format=json",
    calendarPageUrl: "https://www.hawkspdx.com/hawks-events",
    publishStatus: "LIVE",
    pollHours: 6,
    notes:
      "Squarespace ?format=json, assetUrl posters, paginated (pagination.nextPageUrl). Sex club - sex-positive + nudity flags always on; age defaults 21_PLUS, verify 18+ nights in Review.",
  },
  {
    sourceId: "stag-eb",
    venueName: "Stag PDX",
    address: "317 NW Broadway, Portland, OR",
    neighborhood: "Old Town",
    fetchMode: "generic",
    feedUrl: "https://www.eventbrite.com/o/stag-pdx-73608204703",
    calendarPageUrl: "https://www.eventbrite.com/o/stag-pdx-73608204703",
    publishStatus: "LIVE",
    pollHours: 12,
    venuePolicy: {
      ageRequirement: "21_PLUS",
      ageNote: "Age set to 21_PLUS (Stag is a 21+ bar)",
    },
    notes:
      "Eventbrite organizer via generic discover (relevance guards handle Stags' Leap false-positives). Brunch/specials only - nightly dancers are not discrete rows.",
  },
  {
    sourceId: "sports-bra-eb",
    venueName: "The Sports Bra",
    address: "2512 NE Broadway, Portland, OR",
    neighborhood: "NE Portland",
    fetchMode: "sports_bra_airtable",
    feedUrl: "https://thesportsbraofficial.com/pages/portland",
    calendarPageUrl: "https://thesportsbraofficial.com/pages/portland",
    publishStatus: "LIVE",
    pollHours: 12,
    venuePolicy: {
      ageNote: "Verify age - Sports Bra is a bar-restaurant; watch parties often all-ages, late events may be 21+",
    },
    notes:
      "Official watch-party schedule via their Airtable (SPORTS_BRA_AIRTABLE_TOKEN). Games only - no Eventbrite city noise. No-flyer games get an auto Swedish-minimal poster. Falls back to venue-scoped Eventbrite if token unset.",
  },
  {
    sourceId: "living-room-eb",
    venueName: "Living Room Wines",
    address: "4818 N Lombard St, Portland, OR",
    neighborhood: "N Portland",
    fetchMode: "generic",
    feedUrl: "https://www.eventbrite.com/o/104468106391",
    calendarPageUrl: "https://livingroomwinespdx.com",
    publishStatus: "LIVE",
    pollHours: 12,
    venuePolicy: {
      ageRequirement: "21_PLUS",
      ageNote: "Age set to 21_PLUS (wine bar - ticketed tastings/classes)",
    },
    notes:
      "Eventbrite organizer via generic discover. Ticketed classes only; free nights are IG-only (stay in scan lane).",
  },
  {
    sourceId: "camp-bar",
    venueName: "Camp Bar PDX",
    address: "1125 SW Harvey Milk St, Portland, OR",
    neighborhood: "Downtown",
    fetchMode: "generic",
    feedUrl: "https://campbarpdx.com",
    calendarPageUrl: "https://campbarpdx.com",
    publishStatus: "LIVE",
    pollHours: 12,
    venuePolicy: {
      ageRequirement: "21_PLUS",
      ageNote: "Age set to 21_PLUS (Camp Bar is a 21+ bar)",
    },
    notes:
      "Static #events weeklies via generic discover; flyers limited (IG specials). Watch flyer coverage on the board before pruning scan sources.",
  },
  {
    sourceId: "cc-slaughters",
    venueName: "CC Slaughters",
    address: "219 NW Davis St, Portland, OR",
    neighborhood: "Old Town",
    fetchMode: "generic",
    feedUrl: "https://www.ccslaughterspdx.com/",
    calendarPageUrl: "https://www.ccslaughterspdx.com/",
    publishStatus: "LIVE",
    pollHours: 12,
    venuePolicy: {
      ageRequirement: "21_PLUS",
      ageNote: "Age set to 21_PLUS (CC Slaughters is a 21+ bar)",
    },
    notes:
      "HTML weeklies + WP vertical posters (*_ADVERTICAL_*) via generic discover. Watch flyer coverage before pruning scan sources.",
  },
];

export function getTrustedVenue(sourceId: string): TrustedVenueDef | undefined {
  return TRUSTED_VENUES.find(v => v.sourceId === sourceId);
}

export function isTrustedSourceId(sourceId: string): boolean {
  return TRUSTED_VENUES.some(v => v.sourceId === sourceId);
}

export function trustedSourceIds(): string[] {
  return TRUSTED_VENUES.map(v => v.sourceId);
}

/**
 * Derive board health from last sync (primary) + optional auto-publish lag.
 * - green: last sync ok within ~2× poll window (zero new creates is still healthy)
 * - yellow: last sync ok but overdue vs poll schedule, or zero yield with consecutive soft issues
 * - red: last sync failed, consecutive fails, or very stale
 * - unknown: never synced
 *
 * Catalog “last LIVE event” fallbacks must NOT force yellow - only real trusted
 * publish timestamps (`fromTrustedPublish`) may.
 */
/**
 * Flyer coverage below this (with a meaningful event count) degrades green →
 * yellow: a sync can "succeed" while art quietly fails, and the board must say
 * so before a venue is trusted enough to prune its scrape sources.
 */
export const TRUSTED_FLYER_COVERAGE_YELLOW = 0.5;
/** Require at least this many drafts before coverage can flag (avoid flapping). */
export const TRUSTED_FLYER_COVERAGE_MIN_EVENTS = 3;

export function deriveTrustedHealth(input: {
  lastSyncAt: string | null;
  lastSyncOk: boolean | null;
  consecutiveFails: number;
  lastPublishedAt: string | null;
  /** True when lastPublishedAt came from trusted auto-publish, not catalog fallback */
  fromTrustedPublish?: boolean;
  pollHours: number;
  /** Feed yield last sync (gates flyer-coverage flagging) */
  lastEventCount?: number;
  /** lastFlyerCount / lastEventCount (0..1); null/undefined = not measured */
  flyerCoverage?: number | null;
  now?: Date;
}): TrustedHealthStatus {
  const now = input.now ?? new Date();
  if (input.lastSyncAt == null && input.lastSyncOk == null) return "unknown";
  if (input.lastSyncOk === false || input.consecutiveFails >= 2) return "red";

  const pollMs = Math.max(1, input.pollHours) * 3600_000;
  const syncAge = input.lastSyncAt ? now.getTime() - Date.parse(input.lastSyncAt) : Infinity;
  if (!Number.isFinite(syncAge) || syncAge > pollMs * 3) return "red";
  if (syncAge > pollMs * 2) return "yellow";

  // Only flag long publish drought when we actually auto-publish and recorded it
  if (input.fromTrustedPublish && input.lastPublishedAt) {
    const pubAge = now.getTime() - Date.parse(input.lastPublishedAt);
    if (Number.isFinite(pubAge) && pubAge > pollMs * 28) return "yellow"; // ~1 week at 6h poll
  }

  // Low flyer yield never blocks sync health harder than yellow, and only
  // flags when measured on a meaningful batch (null = older run, no signal).
  if (
    input.flyerCoverage != null &&
    (input.lastEventCount ?? 0) >= TRUSTED_FLYER_COVERAGE_MIN_EVENTS &&
    input.flyerCoverage < TRUSTED_FLYER_COVERAGE_YELLOW
  ) {
    return "yellow";
  }

  if (input.lastSyncOk === true) return "green";
  return "unknown";
}
