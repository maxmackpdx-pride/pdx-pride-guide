/**
 * Trusted venue calendars — QSearch "Trusted" health board + dedicated adapters.
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
  fetchMode: "badlands_api" | "sanctuary_ics" | "eagle_wix" | "generic";
  /** Primary feed URL (may need date expansion at runtime) */
  feedUrl: string;
  /** Human calendar page for admins */
  calendarPageUrl: string;
  /** Preferred status when approving from Review (or rare publish-mode automation) */
  publishStatus: "LIVE" | "HIDDEN";
  /** Hours between trusted sync runs */
  pollHours: number;
  notes?: string;
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
      "Wix Events via appsWarmupData. 21+ bar — never ALL_AGES; cover UNKNOWN unless listing says free.",
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
 * Catalog “last LIVE event” fallbacks must NOT force yellow — only real trusted
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
