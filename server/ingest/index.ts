import type { Event, InsertEvent } from "@shared/schema";
import {
  findSubmissionMatches,
  submissionHasStrongDuplicate,
} from "@shared/submissionMatch";
import { normalizeVenueKey } from "@shared/venueLinks";
import { isWeakVenueName } from "../qsearch/directoryBrands";
import { fetchIngestSource } from "./fetchSource";
import { parseIcs, looksLikeIcs } from "./parseIcs";
import { parseJsonLdDocument, parseJsonLdFromHtml } from "./parseJsonLd";
import { looksLikeSquarespaceJson, parseSquarespaceJson } from "./parseSquarespace";
import { looksLikeTribeJson, parseTribeEventsJson } from "./parseTribe";
import { looksLikeBadlandsJson, parseBadlandsJson } from "./parseBadlands";
import { parseWarmupDataFromHtml } from "./parseWarmupData";
import {
  enrichDraftPoster,
  extractFlyerCandidatesFromHtml,
  preferFullQualityImageUrl,
} from "./posterQuality";
import type {
  IngestCommitResult,
  IngestEventDraft,
  IngestPreviewItem,
  IngestPreviewResult,
} from "./types";

export type {
  IngestEventDraft,
  IngestPreviewItem,
  IngestPreviewResult,
  IngestCommitResult,
};

export const INGEST_MAX_COMMIT = 40;

type ParseSourceTag =
  | "jsonld"
  | "ics"
  | "squarespace"
  | "tribe"
  | "wix"
  | "badlands"
  | "vision"
  | "caption"
  | "instagram";

/**
 * Venue status blurbs that calendars often publish as "events" but are not
 * parties/shows to list on Zaylist (closed nights, holidays off, etc.).
 * Prefer title signals so "we were closed for renovation - now open" still counts.
 */
export function isNonEventListing(draft: Pick<IngestEventDraft, "title" | "description">): boolean {
  const title = String(draft.title || "").trim().toLowerCase();
  if (!title) return true;

  // Pure / leading closure titles
  if (/^closed\b/.test(title)) return true;
  if (/^we(?:'re| are)\s+closed\b/.test(title)) return true;
  if (/^dark\b/.test(title) && title.length < 40) return true;
  if (/^(private\s+event|private\s+party|buyout|sold\s+out\s+private)\b/.test(title) && title.length < 48) {
    return true;
  }
  if (/\b(no\s+service|not\s+open|doors\s+closed|shut\s+down)\b/.test(title)) return true;
  if (/\b(holiday|christmas|thanksgiving|new\s*year'?s?)\s+closure\b/.test(title)) return true;
  if (
    /\bclosed\s+for\s+(the\s+)?(holidays?|christmas|thanksgiving|new\s*year|easter|pride|renovation|private\s+event|inventory)\b/.test(
      title,
    )
  ) {
    return true;
  }
  if (/\bclosed\s+(tonight|today|all\s+day)\b/.test(title)) return true;
  if (/\bno\s+events?\s+(tonight|today)\b/.test(title)) return true;

  // Cancelled without reschedule language in the title
  if (/\b(cancelled|canceled)\b/.test(title) && !/\b(rescheduled|moved\s+to|still\s+on|postponed\s+to)\b/.test(title)) {
    return true;
  }

  return false;
}

type CityListingDraft = Pick<
  IngestEventDraft,
  "title" | "description" | "venueName" | "address" | "neighborhood" | "sourceUrl"
>;

function listingBlob(draft: CityListingDraft): string {
  return [
    draft.venueName,
    draft.address,
    draft.neighborhood,
    draft.title,
    draft.description?.slice(0, 400),
    draft.sourceUrl,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Strong Portland-metro signals (venues or city words). */
function hasPortlandSignal(blob: string): boolean {
  if (/\b(portland|pdx|beaverton|gresham|milwaukie|oregon city|tualatin|hillsboro|lake oswego)\b/i.test(blob)) {
    return true;
  }
  if (/\b(or|oregon)\s*\d{5}\b/i.test(blob) || /,\s*or\b/i.test(blob)) return true;
  if (
    /\b(darcelle|stag|badlands|eagle|silverado|cc slaughters|slaughters|nova|holocene|sanctuary|hawks|camp bar|scandals|crystal ballroom|star theater|get down|alberta rose|meet rack)\b/i.test(
      blob,
    )
  ) {
    return true;
  }
  return false;
}

function hasSeattleSignal(blob: string): boolean {
  if (/\b(seattle|sea-?tac|capitol hill|bellevue|tacoma)\b/i.test(blob)) return true;
  if (/\b(wa|washington)\s*\d{5}\b/i.test(blob) || /,\s*wa\b/i.test(blob)) return true;
  // Common Seattle queer venues that appear without "Seattle" in the title
  if (/\b(re-bar|rebar|neighbour|neighbor|cc\s*attles|rialto|neumos|chop\s*suey)\b/i.test(blob)) {
    return true;
  }
  return false;
}

/**
 * Multi-city brands (Bearracuda, touring groups) often list SF/Seattle/etc.
 * Default group filter: Portland metro only.
 */
export function isPortlandEventListing(draft: CityListingDraft): boolean {
  const blob = listingBlob(draft);

  // Explicit non-PDX cities without a Portland counter-signal
  if (
    /\b(san francisco|sf bay|oakland|seattle|los angeles|\bla\b|chicago|denver|atlanta|new orleans|austin|dallas|houston|phoenix|vegas|miami|nyc|new york|boston|dc|washington)\b/i.test(
      blob,
    ) &&
    !hasPortlandSignal(blob)
  ) {
    return false;
  }
  if (hasPortlandSignal(blob)) return true;
  // No clear city → drop for group filters (prefer precision over noise)
  return false;
}

/**
 * Allowlist filter for multi-city brands.
 * Cities: portland | seattle (extend as needed).
 * Returns true when the draft matches at least one allowed city.
 */
export function isAllowedCityEventListing(
  draft: CityListingDraft,
  cities: string[] | null | undefined,
): boolean {
  if (!cities?.length) return isPortlandEventListing(draft);
  const allow = new Set(cities.map(c => String(c || "").toLowerCase().trim()).filter(Boolean));
  const blob = listingBlob(draft);

  // Hard-drop cities that appear and are NOT on the allowlist
  const foreignHits: Array<{ re: RegExp; key: string }> = [
    { re: /\b(san francisco|sf bay|oakland)\b/i, key: "sf" },
    { re: /\b(los angeles|\bla\b)\b/i, key: "la" },
    { re: /\b(chicago|denver|atlanta|austin|dallas|houston|phoenix|vegas|miami|nyc|new york|boston)\b/i, key: "other" },
  ];
  for (const { re, key } of foreignHits) {
    if (re.test(blob)) {
      // only keep if that foreign city is somehow allowlisted (none today)
      if (!allow.has(key) && !allow.has("all")) {
        // still keep if an allowed city also matches (title lists tour stops)
        const ok =
          (allow.has("portland") && hasPortlandSignal(blob)) ||
          (allow.has("seattle") && hasSeattleSignal(blob));
        if (!ok) return false;
      }
    }
  }

  let matched = false;
  if (allow.has("portland") && hasPortlandSignal(blob)) matched = true;
  if (allow.has("seattle") && hasSeattleSignal(blob)) matched = true;
  return matched;
}

export { isPastEventListing } from "./dates";

function mergeDrafts(parts: IngestEventDraft[][]): IngestEventDraft[] {
  const seen = new Set<string>();
  const out: IngestEventDraft[] = [];
  for (const list of parts) {
    for (const d of list) {
      if (isNonEventListing(d)) continue;
      const key = `${d.title}|${d.dateStart}|${d.venueName}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(d);
    }
  }
  return out;
}

function parseBody(
  body: string,
  contentType: string | null,
  sourceUrl: string | null,
): { drafts: IngestEventDraft[]; parseSources: ParseSourceTag[]; warnings: string[] } {
  const warnings: string[] = [];
  const parseSources: ParseSourceTag[] = [];
  const ct = (contentType || "").toLowerCase();
  const trimmed = body.trim();
  const urlHint = (sourceUrl || "").toLowerCase();

  const isIcs =
    looksLikeIcs(trimmed) ||
    ct.includes("text/calendar") ||
    /\.ics(\?|$)/i.test(urlHint) ||
    /[?&]ical=1\b/i.test(urlHint);

  const isJson =
    ct.includes("application/ld+json") ||
    ct.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");

  const parts: IngestEventDraft[][] = [];

  if (isIcs) {
    const ics = parseIcs(trimmed, sourceUrl);
    if (ics.length) {
      parts.push(ics);
      parseSources.push("ics");
    } else {
      warnings.push("Body looked like ICS but no VEVENTs parsed");
    }
  }

  if (isJson && !isIcs) {
    // Badlands worker JSON before Tribe/Squarespace - Tribe also keys on `.events[]`.
    const badlandsUrl =
      urlHint.includes("badlandsportland.workers.dev") ||
      urlHint.includes("badlands-api") ||
      urlHint.includes("badlands-events");
    if (looksLikeBadlandsJson(trimmed) || badlandsUrl) {
      const bl = parseBadlandsJson(trimmed, sourceUrl);
      if (bl.length) {
        parts.push(bl);
        parseSources.push("badlands");
      }
    }
    if (looksLikeTribeJson(trimmed) || urlHint.includes("/tribe/events/v1/")) {
      const tribe = parseTribeEventsJson(trimmed, sourceUrl);
      if (tribe.length) {
        parts.push(tribe);
        parseSources.push("tribe");
      }
    }
    if (looksLikeSquarespaceJson(trimmed) || urlHint.includes("format=json")) {
      const sq = parseSquarespaceJson(trimmed, sourceUrl);
      if (sq.length) {
        parts.push(sq);
        parseSources.push("squarespace");
      }
    }
    const json = parseJsonLdDocument(trimmed, sourceUrl);
    if (json.length) {
      parts.push(json);
      parseSources.push("jsonld");
    }
  }

  // HTML (or unknown): JSON-LD scripts, Wix warmupData, embedded ICS
  if (!isIcs || /<html|<script/i.test(trimmed)) {
    const fromHtml = parseJsonLdFromHtml(trimmed, sourceUrl);
    if (fromHtml.length) {
      parts.push(fromHtml);
      if (!parseSources.includes("jsonld")) parseSources.push("jsonld");
    }
    const wix = parseWarmupDataFromHtml(trimmed, sourceUrl);
    if (wix.length) {
      parts.push(wix);
      if (!parseSources.includes("wix")) parseSources.push("wix");
    }
    if (!isIcs && looksLikeIcs(trimmed)) {
      const ics = parseIcs(trimmed, sourceUrl);
      if (ics.length) {
        parts.push(ics);
        if (!parseSources.includes("ics")) parseSources.push("ics");
      }
    }
  }

  const drafts = mergeDrafts(parts);
  if (!drafts.length) {
    warnings.push(
      "No events found. Need JSON-LD Event, ICS, Squarespace ?format=json, Tribe REST, Badlands calendar API, or Wix warmupData.",
    );
  }
  return { drafts, parseSources, warnings };
}

function attachDuplicates(
  drafts: IngestEventDraft[],
  catalog: Event[],
): IngestPreviewItem[] {
  return drafts.map((draft, index) => {
    const duplicates = findSubmissionMatches(
      {
        title: draft.title,
        venueName: draft.venueName,
        address: draft.address,
        dateStart: draft.dateStart,
        dateEnd: draft.dateEnd,
        ticketUrl: draft.ticketUrl,
      },
      catalog.map(e => ({
        id: e.id,
        title: e.title,
        venueName: e.venueName,
        address: e.address,
        dateStart: e.dateStart,
        dateEnd: e.dateEnd,
        status: e.status,
        ticketUrl: e.ticketUrl,
      })),
      { limit: 3, minScore: 32 },
    );
    const strong = submissionHasStrongDuplicate(duplicates) ?? null;
    return {
      index,
      draft,
      selected: !strong,
      duplicates,
      strongDuplicate: strong,
    };
  });
}

export async function previewIngest(input: {
  url?: string | null;
  html?: string | null;
  ics?: string | null;
  existingEvents: Event[];
}): Promise<IngestPreviewResult | { ok: false; error: string }> {
  const warnings: string[] = [];
  let sourceUrl: string | null = null;
  let contentType: string | null = null;
  const bodies: Array<{ body: string; contentType: string | null; sourceUrl: string | null }> = [];

  const url = input.url?.trim();
  if (url) {
    try {
      const fetched = await fetchIngestSource(url);
      sourceUrl = fetched.url;
      contentType = fetched.contentType;
      bodies.push({ body: fetched.body, contentType: fetched.contentType, sourceUrl: fetched.url });
    } catch (err: any) {
      return { ok: false, error: err?.message || "Failed to fetch URL" };
    }
  }

  if (input.html?.trim()) {
    bodies.push({ body: input.html, contentType: "text/html", sourceUrl: sourceUrl });
  }
  if (input.ics?.trim()) {
    bodies.push({ body: input.ics, contentType: "text/calendar", sourceUrl: sourceUrl });
  }

  if (!bodies.length) {
    return { ok: false, error: "Provide a url, html paste, or ics paste" };
  }

  const allDrafts: IngestEventDraft[] = [];
  const parseSources = new Set<ParseSourceTag>();
  for (const b of bodies) {
    const parsed = parseBody(b.body, b.contentType, b.sourceUrl);
    allDrafts.push(...parsed.drafts);
    parsed.parseSources.forEach(s => parseSources.add(s));
    warnings.push(...parsed.warnings);
  }

  let drafts = mergeDrafts([allDrafts]);

  // Decode common HTML entities in titles/venues (Tribe/WP often leave &#8217;)
  const decodeEntities = (s: string) =>
    s
      .replace(/&#8217;|&#39;|&rsquo;/g, "'")
      .replace(/&#8220;|&#8221;|&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

  drafts = drafts.map(d => ({
    ...d,
    title: decodeEntities(d.title),
    venueName: decodeEntities(d.venueName),
    description: decodeEntities(d.description),
  }));

  // Harvest page-level flyer candidates (og:image, etc.) - ONLY safe to assign when
  // this fetch produced a single event. Multi-event calendars must not share one
  // list-page hero across every night (that stamped the same flyer on all venues).
  const singleEventPage = drafts.length === 1;
  const pageTitleHint = singleEventPage ? drafts[0]?.title : undefined;
  const pageFlyerPool: string[] = [];
  for (const b of bodies) {
    if (b.body && /<html|<img|og:image/i.test(b.body)) {
      pageFlyerPool.push(
        ...extractFlyerCandidatesFromHtml(
          b.body,
          b.sourceUrl || sourceUrl || "https://example.com",
          pageTitleHint,
        ),
      );
    }
  }

  drafts = drafts.map(d => {
    if (d.posterImageUrl) {
      return {
        ...d,
        posterImageUrl: preferFullQualityImageUrl(d.posterImageUrl) || d.posterImageUrl,
      };
    }
    // One listing on the page → og:image is usually that event's flyer
    if (singleEventPage && pageFlyerPool[0]) {
      return {
        ...d,
        posterImageUrl: pageFlyerPool[0],
        warnings: [...d.warnings, "Poster from page media"],
      };
    }
    return d;
  });

  // Capture flyers to local /uploads when possible (full quality).
  // Never pass shared pageFlyerPool into multi-event drafts (would steal one flyer for all).
  const enriched: IngestEventDraft[] = [];
  for (const d of drafts) {
    const extra = d.posterImageUrl ? [] : singleEventPage ? pageFlyerPool : [];
    enriched.push(await enrichDraftPoster(d, extra));
  }

  const events = attachDuplicates(enriched, input.existingEvents);
  const selected = events.filter(e => e.selected).length;
  const withDup = events.filter(e => e.strongDuplicate).length;
  const withPoster = events.filter(e => e.draft.posterImageUrl).length;

  return {
    ok: true,
    sourceUrl,
    contentType,
    parseSources: Array.from(parseSources),
    events,
    warnings: Array.from(new Set(warnings)),
    impact: `${events.length} event(s) parsed · ${selected} ready · ${withDup} strong duplicate(s) · ${withPoster} with flyer`,
  };
}

export function draftToInsertEvent(
  draft: IngestEventDraft,
  opts: { status: "HIDDEN" | "LIVE"; adminNotes?: string },
): InsertEvent {
  const notes = [
    opts.adminNotes?.trim(),
    draft.sourceUrl ? `Ingested from ${draft.sourceUrl}` : "Ingested (paste)",
    draft.warnings.length ? `Warnings: ${draft.warnings.join("; ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: draft.title,
    description: draft.description,
    venueName: draft.venueName,
    address: draft.address,
    neighborhood: draft.neighborhood,
    lat: draft.lat,
    lng: draft.lng,
    dateStart: draft.dateStart,
    dateEnd: draft.dateEnd,
    dayOfWeek: draft.dayOfWeek,
    ageRequirement: draft.ageRequirement || "ALL_AGES",
    eventTypes: draft.eventTypes || "[]",
    // Never invent FREE when the draft left admission empty
    admission: draft.admission || "UNKNOWN",
    ticketUrl: draft.ticketUrl,
    isPublic: draft.isPublic !== false,
    isPrivate: !!draft.isPrivate,
    isHouseParty: !!draft.isHouseParty,
    isSexPositive: !!draft.isSexPositive,
    nudityOk: !!draft.nudityOk,
    posterImageUrl: draft.posterImageUrl,
    status: opts.status,
    source: "url_ingest",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: notes.slice(0, 1000),
  };
}

/** Non-empty, non-placeholder value check for merge backfill. */
function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  return true;
}

/**
 * Merge a freshly-synced draft INTO an existing event row (same id → RSVPs/chat
 * are preserved). Returns a partial patch for storage.updateEvent().
 *
 * Rule: the newest sync wins on any field it actually carries a value for; the
 * existing row fills gaps the sync lacks (never overwritten with empty). Date/
 * time is ALWAYS taken from the newest sync - that is the point of a merge -
 * and dayOfWeek is set explicitly because updateEvent() writes columns raw and
 * does not recompute it. Safety flags (sex-positive / nudity / house-party) are
 * OR-ed so a venue never silently loses a marking on update. Identity, status/
 * visibility, source, claim/ownership, and createdAt are left untouched.
 *
 * Cross-venue guard: when both sides have strong, different venue names
 * (normalizeVenueKey mismatch), do not overwrite venueName/address or take the
 * draft poster — false-positive merges must not rewrite host or steal flyer art
 * (e.g. Camp event + Eagle Karaoke draft).
 *
 * Claimed events (`claimedBy` set) keep the host's own words: title,
 * description, poster, admission, and ageRequirement are frozen against later
 * syncs. Everything else still refreshes, so a moved date, a new pin, or a fresh
 * ticket link lands as usual. Unclaimed events are unaffected.
 */
/**
 * Every field a trusted-venue resync is allowed to write, and therefore every
 * field a human edit needs to be able to lock. Kept in one place so the write
 * funnel (storage.updateEvent) and the merge below can never drift apart: if a
 * field is added to the merge, add it here or a human edit will not protect it.
 */
export const SYNC_WRITABLE_FIELDS: ReadonlySet<string> = new Set([
  "title", "description", "neighborhood", "lat", "lng", "ticketUrl",
  "venueName", "address", "posterImageUrl",
  "eventTypes", "admission", "ageRequirement",
  "dateStart", "dateEnd", "dayOfWeek",
]);

export function mergeDraftIntoEvent(existing: Event, draft: IngestEventDraft): Partial<InsertEvent> {
  const inc = draftToInsertEvent(draft, { status: existing.status as "HIDDEN" | "LIVE" });
  const patch: Partial<InsertEvent> = {};

  // Claimed events: the host's own words win, the feed's facts still win.
  // A claim means a real person took responsibility for this listing, so a later
  // sync must never revert copy they wrote (title, description, poster, door
  // details). Scheduling and location still refresh, because a moved date is the
  // whole reason to resync, and the host is not the one publishing the feed.
  // Unclaimed events are unchanged: the feed keeps them current.
  const isClaimed = hasValue(existing.claimedBy);
  // Authored-by-a-human fields, frozen once claimed.
  const hostOwned = new Set<keyof InsertEvent>([
    "title", "description", "posterImageUrl", "admission", "ageRequirement",
  ]);
  // Fields a human edited by hand, frozen whether or not anyone has claimed the
  // event. An unclaimed event has no owner to read, so without this an admin fix
  // is silently reverted by the next scan of that venue's feed.
  let lockedFields = new Set<string>();
  try {
    const parsed = JSON.parse(String((existing as { lockedFields?: string }).lockedFields || "[]"));
    if (Array.isArray(parsed)) lockedFields = new Set(parsed.filter(f => typeof f === "string"));
  } catch { /* corrupt value: fall back to no locks rather than block the sync */ }
  const canTake = (k: keyof InsertEvent) =>
    !lockedFields.has(k as string) && !(isClaimed && hostOwned.has(k));

  const existingVenueName = String(existing.venueName || "").trim();
  const draftVenueName = String(inc.venueName || "").trim();
  const existingVenueKey = normalizeVenueKey(existingVenueName);
  const draftVenueKey = normalizeVenueKey(draftVenueName);
  const existingVenueWeak = isWeakVenueName(existingVenueName);
  const draftVenueWeak = isWeakVenueName(draftVenueName);
  // Both have a real venue and they disagree → keep existing host + poster.
  const venuesConflict =
    Boolean(existingVenueKey) &&
    Boolean(draftVenueKey) &&
    existingVenueKey !== draftVenueKey &&
    !existingVenueWeak &&
    !draftVenueWeak;
  // Take draft venue/address only when keys match, or existing is weak/empty/TBA
  // (including strong draft filling a weak existing). Never when both strong+different.
  const canTakeVenueFields =
    !venuesConflict &&
    (existingVenueWeak || !existingVenueKey || existingVenueKey === draftVenueKey);

  // venueName / address / poster handled separately under the cross-venue guard.
  const newWins: Array<keyof InsertEvent> = [
    "title", "description", "neighborhood",
    "lat", "lng", "ticketUrl",
  ];
  for (const k of newWins) {
    if (!canTake(k)) continue;
    if (hasValue((inc as Record<string, unknown>)[k])) {
      (patch as Record<string, unknown>)[k] = (inc as Record<string, unknown>)[k];
    }
  }
  if (canTakeVenueFields) {
    if (hasValue(inc.venueName) && canTake("venueName")) patch.venueName = inc.venueName;
    if (hasValue(inc.address) && canTake("address")) patch.address = inc.address;
  }
  // Poster: same-venue (or no conflict) keeps new-wins for non-empty; never steal on venue conflict.
  // Empty/null draft poster still never clears an existing poster (hasValue gate).
  if (hasValue(inc.posterImageUrl) && !venuesConflict && canTake("posterImageUrl")) {
    patch.posterImageUrl = inc.posterImageUrl;
  }
  // Never let a bad third-party pin (e.g. Hawks Squarespace → NYC) clobber a good PDX pin.
  // Metro box matches venueCoordinates.isInPortlandMetro.
  if (typeof patch.lat === "number" && typeof patch.lng === "number") {
    const inMetro =
      patch.lat >= 45.0 && patch.lat <= 46.1 && patch.lng >= -123.8 && patch.lng <= -121.5;
    if (!inMetro) {
      delete patch.lat;
      delete patch.lng;
    }
  }
  // Placeholder-aware: only take the sync value when it is a real (non-default) value.
  if (canTake("eventTypes") && inc.eventTypes && inc.eventTypes !== "[]") {
    patch.eventTypes = inc.eventTypes;
  }
  if (canTake("admission") && inc.admission && inc.admission !== "UNKNOWN") {
    patch.admission = inc.admission;
  }
  if (canTake("ageRequirement") && inc.ageRequirement && inc.ageRequirement !== "ALL_AGES") {
    patch.ageRequirement = inc.ageRequirement;
  }

  // OR the safety flags so a marking is never lost on update.
  patch.isSexPositive = !!existing.isSexPositive || !!inc.isSexPositive;
  patch.nudityOk = !!existing.nudityOk || !!inc.nudityOk;
  patch.isHouseParty = !!existing.isHouseParty || !!inc.isHouseParty;

  // Date/time always refreshed to the newest sync, unless a human corrected it.
  if (canTake("dateStart")) patch.dateStart = inc.dateStart;
  if (canTake("dateEnd")) patch.dateEnd = inc.dateEnd;
  if (canTake("dayOfWeek")) patch.dayOfWeek = inc.dayOfWeek;

  const lockNote = lockedFields.size ? ` · locked: ${[...lockedFields].join(", ")}` : "";
  const note = `Merged from sync${draft.sourceUrl ? ` (${draft.sourceUrl})` : ""}${
    isClaimed ? " · claimed: host copy kept" : ""
  }${lockNote}`;
  patch.adminNotes = [existing.adminNotes?.trim(), note].filter(Boolean).join(" · ").slice(0, 1000);

  return patch;
}

export async function commitIngest(input: {
  items: Array<{ draft: IngestEventDraft; skip?: boolean; candidateId?: string; allowDuplicate?: boolean }>;
  status?: "HIDDEN" | "LIVE";
  skipDuplicates?: boolean;
  existingEvents: Event[];
  createEvent: (data: InsertEvent) => Event;
}): Promise<IngestCommitResult | { ok: false; error: string }> {
  const status = input.status === "LIVE" ? "LIVE" : "HIDDEN";
  const skipDup = input.skipDuplicates !== false;
  if (!input.items.length) return { ok: false, error: "No events to commit" };
  if (input.items.length > INGEST_MAX_COMMIT) {
    return { ok: false, error: `Max ${INGEST_MAX_COMMIT} events per commit` };
  }

  const created: IngestCommitResult["created"] = [];
  const skipped: IngestCommitResult["skipped"] = [];
  // Mutate a local catalog so within-batch duplicates also get caught.
  let catalog = [...input.existingEvents].filter(e => e.status !== "REMOVED");

  for (let index = 0; index < input.items.length; index++) {
    const item = input.items[index];
    const candidateId = item.candidateId ? String(item.candidateId) : undefined;
    let draft = item.draft;
    if (!draft?.title || !draft?.dateStart) {
      skipped.push({
        index,
        title: draft?.title || "(missing)",
        reason: "Invalid draft",
        candidateId,
      });
      continue;
    }
    if (item.skip) {
      skipped.push({ index, title: draft.title, reason: "Deselected", candidateId });
      continue;
    }
    if (skipDup && !item.allowDuplicate) {
      const matches = findSubmissionMatches(
        {
          title: draft.title,
          venueName: draft.venueName,
          address: draft.address,
          dateStart: draft.dateStart,
          dateEnd: draft.dateEnd,
          ticketUrl: draft.ticketUrl,
        },
        catalog.map(e => ({
          id: e.id,
          title: e.title,
          venueName: e.venueName,
          address: e.address,
          dateStart: e.dateStart,
          dateEnd: e.dateEnd,
          status: e.status,
          ticketUrl: e.ticketUrl,
        })),
        { limit: 1, minScore: 32 },
      );
      const strong = submissionHasStrongDuplicate(matches);
      if (strong) {
        skipped.push({
          index,
          title: draft.title,
          reason: `Already on main board as #${strong.eventId} (${strong.title})`,
          candidateId,
        });
        continue;
      }
    }

    // Always capture full-quality flyer to local uploads before write
    draft = await enrichDraftPoster(draft);
    if (!draft.posterImageUrl) {
      draft = {
        ...draft,
        warnings: [...draft.warnings, "No flyer image found - add poster before going LIVE"],
      };
    }

    const row = input.createEvent(draftToInsertEvent(draft, { status }));
    created.push({ id: row.id, title: row.title, status: row.status, candidateId });
    catalog = [...catalog, row];
  }

  const dupSkips = skipped.filter(s => /Already on main board|Strong duplicate/i.test(s.reason)).length;
  const impactParts = [`Created ${created.length} as ${status}`];
  if (skipped.length) {
    impactParts.push(
      dupSkips === skipped.length
        ? `skipped ${skipped.length} already on board`
        : `skipped ${skipped.length}`,
    );
  }
  return {
    ok: true,
    created,
    skipped,
    impact: impactParts.join("; "),
  };
}
