/**
 * Trusted venue sync pipeline.
 *
 * Manual Sync (admin Trusted tab) → QSearch Review queue (no auto-LIVE).
 * Optional mode "publish" → commit LIVE (nightly / future automation only).
 */

import { randomUUID } from "node:crypto";
import {
  TRUSTED_VENUES,
  getTrustedVenue,
  type TrustedVenueDef,
} from "@shared/trustedVenues";
import type { Event, InsertEvent } from "@shared/schema";
import {
  commitIngest,
  isNonEventListing,
  mergeDraftIntoEvent,
  INGEST_MAX_COMMIT,
} from "../ingest";
import { findSubmissionMatches, submissionHasStrongDuplicate } from "@shared/submissionMatch";
import { isPastEventListing } from "../ingest/dates";
import { fetchIngestSource } from "../ingest/fetchSource";
import {
  expandBadlandsCalendarUrl,
  parseBadlandsJson,
} from "../ingest/parseBadlands";
import {
  applySanctuaryPolicy,
  fetchSanctuaryDrafts,
  isSanctuaryLogoPoster,
  SANCTUARY_AGE_REQUIREMENT,
} from "../ingest/adapters/sanctuary";
import { applyEaglePolicy, fetchEagleDrafts } from "../ingest/adapters/eagle";
import { applyDarcellePolicy, fetchDarcelleDrafts } from "../ingest/adapters/darcelle";
import {
  applyHawksPolicy,
  fetchHawksDrafts,
  HAWKS_AGE_REQUIREMENT,
} from "../ingest/adapters/hawks";
import { fetchSportsBraDrafts, sportsBraConfigured } from "../ingest/adapters/sportsBra";
import { inferAdmissionFromText } from "../ingest/admissionInfer";
import { applyDeclaredVenuePolicy, countFreshFlyerDrafts } from "../ingest/venuePolicy";
import { isRelevantScanDraft } from "../ingest/relevance";
import type { IngestEventDraft } from "../ingest/types";
import { storage } from "../storage";
import { buildScanCandidates } from "./analyze";
import { discoverAndParse } from "./discover";
import { insertScanJob, saveCandidates } from "./store";

/** Belt-and-suspenders: Sanctuary createEvent must never land as ALL_AGES / 18+. */
function enforceSanctuaryCreateFields(data: InsertEvent): InsertEvent {
  let eventTypes = data.eventTypes || "[]";
  try {
    const tags = Array.isArray(JSON.parse(eventTypes))
      ? (JSON.parse(eventTypes) as unknown[]).map(t => String(t))
      : [];
    const upper = new Set(tags.map(t => t.trim().toUpperCase().replace(/[\s-]+/g, "_")));
    for (const t of ["SEX_POSITIVE", "NUDITY_OK", "KINK"] as const) {
      if (!upper.has(t)) {
        tags.push(t);
        upper.add(t);
      }
    }
    eventTypes = JSON.stringify(tags);
  } catch {
    eventTypes = JSON.stringify(["SEX_POSITIVE", "NUDITY_OK", "KINK"]);
  }
  return {
    ...data,
    ageRequirement: SANCTUARY_AGE_REQUIREMENT,
    isSexPositive: true,
    nudityOk: true,
    eventTypes,
  };
}

/** Belt-and-suspenders: Hawks createEvent must never land as ALL_AGES / 18+. */
function enforceHawksCreateFields(data: InsertEvent): InsertEvent {
  let eventTypes = data.eventTypes || "[]";
  try {
    const tags = Array.isArray(JSON.parse(eventTypes))
      ? (JSON.parse(eventTypes) as unknown[]).map(t => String(t))
      : [];
    const upper = new Set(tags.map(t => t.trim().toUpperCase().replace(/[\s-]+/g, "_")));
    for (const t of ["SEX_POSITIVE", "NUDITY_OK", "KINK"] as const) {
      if (!upper.has(t)) {
        tags.push(t);
        upper.add(t);
      }
    }
    eventTypes = JSON.stringify(tags);
  } catch {
    eventTypes = JSON.stringify(["SEX_POSITIVE", "NUDITY_OK", "KINK"]);
  }
  return {
    ...data,
    ageRequirement: HAWKS_AGE_REQUIREMENT,
    isSexPositive: true,
    nudityOk: true,
    eventTypes,
  };
}

export type TrustedSyncMode = "review" | "publish";

export type TrustedSyncResult = {
  sourceId: string;
  venueName: string;
  ok: boolean;
  error?: string;
  /** How this run finished events */
  mode: TrustedSyncMode;
  fetched: number;
  /** LIVE events created (publish mode only) */
  created: Array<{ id: number; title: string }>;
  /** Existing events refreshed in place (kept id → kept RSVPs) */
  updated: Array<{ id: number; title: string }>;
  /** Review-queue candidate count (review mode) */
  queued: number;
  /** Scan job id when mode=review */
  jobId: string | null;
  skipped: Array<{ title: string; reason: string }>;
  lastPublishedAt: string | null;
};

export type TrustedSyncOpts = {
  /**
   * review (default) - land drafts in QSearch Review for admin approve.
   * publish - commit LIVE without review (nightly automation only).
   */
  mode?: TrustedSyncMode;
};

function applyVenueDefaults(draft: IngestEventDraft, venue: TrustedVenueDef): IngestEventDraft {
  const weakVenue =
    !draft.venueName ||
    draft.venueName === "TBA" ||
    /^(unknown|tbd|n\/a)$/i.test(draft.venueName.trim()) ||
    /^\d+\s/.test(draft.venueName.trim());

  let next: IngestEventDraft = {
    ...draft,
    venueName: weakVenue ? venue.venueName : draft.venueName,
    address: draft.address?.trim() ? draft.address : venue.address,
    neighborhood: draft.neighborhood?.trim()
      ? draft.neighborhood
      : venue.neighborhood ?? null,
  };

  if (venue.sourceId === "sanctuary-ics" || venue.fetchMode === "sanctuary_ics") {
    next = applySanctuaryPolicy(next);
  }

  if (venue.sourceId === "eagle-events" || venue.fetchMode === "eagle_wix") {
    next = applyEaglePolicy(next);
  }

  if (venue.sourceId === "darcelle-tribe" || venue.fetchMode === "darcelle_tribe") {
    next = applyDarcellePolicy(next);
  }

  // Hawks is a sex club - Sanctuary-style stamps, never ALL_AGES
  if (venue.sourceId === "hawks-json" || venue.fetchMode === "hawks_squarespace") {
    next = applyHawksPolicy(next);
  }

  // Badlands is a 21+ bar - never ALL_AGES; never invent FREE cover
  if (venue.sourceId === "badlands-api" || venue.fetchMode === "badlands_api") {
    const adm = inferAdmissionFromText(next.title, next.description);
    // Only keep FREE if re-infer still says free; otherwise UNKNOWN/DOOR/TICKETED
    const admission =
      next.admission === "FREE" && adm.admission === "FREE"
        ? "FREE"
        : next.admission && next.admission !== "FREE" && next.admission !== "ALL_AGES"
          ? next.admission
          : adm.admission;
    next = {
      ...next,
      ageRequirement: "21_PLUS",
      admission,
      warnings: Array.from(
        new Set([
          ...(next.warnings || []),
          "Age set to 21_PLUS (Badlands is a bar)",
          ...(adm.reason ? [adm.reason] : []),
        ]),
      ),
    };
  }

  // Declarative rules last - new venues scale via data, not code
  next = applyDeclaredVenuePolicy(next, venue);

  return next;
}

function prepareDrafts(raw: IngestEventDraft[], venue: TrustedVenueDef): IngestEventDraft[] {
  const out: IngestEventDraft[] = [];
  const seen = new Set<string>();
  for (const d of raw) {
    if (!d?.title || !d?.dateStart) continue;
    if (isNonEventListing(d)) continue;
    if (isPastEventListing(d)) continue;
    const draft = applyVenueDefaults(d, venue);
    const day = draft.dateStart.slice(0, 10);
    const key = `${draft.title}|${day}|${draft.venueName}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(draft);
  }
  return out;
}

/**
 * Refresh existing events in place instead of re-queuing / re-skipping them.
 *
 * For each freshly-synced draft that strongly matches an event already on the
 * board, merge it into that event (same id → RSVPs & chat preserved; date/time
 * refreshed to the newest sync; missing fields backfilled; never erased, never
 * duplicated). Only drafts with no existing match are returned as `fresh` for
 * the Review queue / LIVE publish. This is what keeps a recurring trusted feed
 * from surfacing the same events every sync.
 */
function autoMergeExistingEvents(
  drafts: IngestEventDraft[],
  existingEvents: Event[],
): { fresh: IngestEventDraft[]; updated: Array<{ id: number; title: string }> } {
  const updated: Array<{ id: number; title: string }> = [];
  const fresh: IngestEventDraft[] = [];
  const byId = new Map(existingEvents.map(e => [e.id, e] as const));
  const usedIds = new Set<number>();
  const toRow = (e: Event) => ({
    id: e.id,
    title: e.title,
    venueName: e.venueName,
    address: e.address,
    dateStart: e.dateStart,
    dateEnd: e.dateEnd,
    status: e.status,
    ticketUrl: e.ticketUrl,
  });

  for (const draft of drafts) {
    // Match against the live catalog minus anything we already merged this run.
    const catalog = existingEvents
      .filter(e => e.status !== "REMOVED" && !usedIds.has(e.id))
      .map(toRow);
    const matches = findSubmissionMatches(
      {
        title: draft.title,
        venueName: draft.venueName,
        address: draft.address,
        dateStart: draft.dateStart,
        dateEnd: draft.dateEnd,
        ticketUrl: draft.ticketUrl,
      },
      catalog,
      { limit: 1, minScore: 32 },
    );
    const strong = submissionHasStrongDuplicate(matches);
    const existing = strong ? byId.get(strong.eventId) : undefined;
    if (strong && existing && !usedIds.has(existing.id)) {
      try {
        storage.updateEvent(existing.id, mergeDraftIntoEvent(existing, draft));
        usedIds.add(existing.id);
        updated.push({ id: existing.id, title: existing.title });
        continue;
      } catch {
        /* fall through and treat as fresh if the update failed */
      }
    }
    fresh.push(draft);
  }

  return { fresh, updated };
}

async function fetchBadlandsDrafts(venue: TrustedVenueDef): Promise<IngestEventDraft[]> {
  const url = expandBadlandsCalendarUrl(venue.feedUrl);
  const fetched = await fetchIngestSource(url);
  return parseBadlandsJson(fetched.body, fetched.url);
}

async function fetchSanctuaryDraftsForVenue(
  venue: TrustedVenueDef,
  existingEvents: Event[],
): Promise<IngestEventDraft[]> {
  // Cross-run series flyer memory: recurring Sanctuary events already on the
  // board carry the series art even when this run's page fetch comes up empty.
  const seriesPosterHints = existingEvents
    .filter(e => e.status !== "REMOVED")
    .filter(
      e =>
        /sanctuary/i.test(String(e.venueName || "")) ||
        /sanctuary/i.test(String((e as { source?: string | null }).source || "")),
    )
    .filter(e => e.posterImageUrl && !isSanctuaryLogoPoster(e.posterImageUrl))
    .map(e => ({ title: e.title, posterImageUrl: e.posterImageUrl ?? null }));

  return fetchSanctuaryDrafts({
    feedUrl: venue.feedUrl,
    maxPages: 80,
    concurrency: 4,
    includePast: false,
    seriesPosterHints,
  });
}

async function fetchEagleDraftsForVenue(venue: TrustedVenueDef): Promise<IngestEventDraft[]> {
  return fetchEagleDrafts({
    feedUrl: venue.feedUrl,
    includePast: false,
  });
}

async function fetchGenericDrafts(
  venue: TrustedVenueDef,
  existingEvents: Event[],
): Promise<IngestEventDraft[]> {
  const hit = await discoverAndParse({
    primaryUrl: venue.feedUrl || venue.calendarPageUrl,
    recipeUrl: venue.calendarPageUrl,
    existingEvents,
    allowExpand: true,
  });
  // Venue-scope relevance - the scan lane applies this per source, and
  // trusted generic mode must too: an Eventbrite venue-scoped search page
  // (e.g. Sports Bra /d/ URL) returns city-wide noise without it. For own-
  // site feeds the mode resolves to "open" and everything passes.
  const relevanceCtx = {
    sourceId: venue.sourceId,
    label: venue.venueName,
    url: venue.feedUrl || venue.calendarPageUrl,
    tier: "1",
  };
  return hit.drafts.filter(d => isRelevantScanDraft(d, relevanceCtx).keep);
}

async function fetchDraftsForVenue(
  venue: TrustedVenueDef,
  existingEvents: Event[],
): Promise<IngestEventDraft[]> {
  switch (venue.fetchMode) {
    case "badlands_api":
      return fetchBadlandsDrafts(venue);
    case "sanctuary_ics":
      return fetchSanctuaryDraftsForVenue(venue, existingEvents);
    case "eagle_wix":
      return fetchEagleDraftsForVenue(venue);
    case "darcelle_tribe":
      return fetchDarcelleDrafts({ feedUrl: venue.feedUrl, includePast: false });
    case "hawks_squarespace":
      return fetchHawksDrafts({ feedUrl: venue.feedUrl, includePast: false });
    case "sports_bra_airtable": {
      // Official Airtable schedule when a token is configured; otherwise fall
      // back to the (venue-scoped) Eventbrite feed so the venue isn't empty.
      if (sportsBraConfigured()) {
        const { drafts } = await fetchSportsBraDrafts({ includePast: false });
        return drafts;
      }
      return fetchGenericDrafts(venue, existingEvents);
    }
    case "generic":
    default:
      return fetchGenericDrafts(venue, existingEvents);
  }
}

async function recordHealth(input: {
  sourceId: string;
  ok: boolean;
  error?: string | null;
  eventCount: number;
  /** Drafts that arrived with real flyer art (null = not measured this run) */
  flyerCount?: number | null;
  created: Array<{ id: number; title: string }>;
  lastPublishedAt: string | null;
}): Promise<void> {
  try {
    const mod = await import("./trustedHealth");
    if (typeof mod.recordTrustedSyncResult === "function") {
      mod.recordTrustedSyncResult({
        sourceId: input.sourceId,
        ok: input.ok,
        error: input.error ?? null,
        eventCount: input.eventCount,
        flyerCount: input.flyerCount ?? null,
        created: input.created,
        lastPublishedAt: input.lastPublishedAt,
      });
    }
  } catch {
    /* health store optional */
  }
}

/**
 * Queue drafts into QSearch Review (pending). Admin approves → HIDDEN or LIVE.
 */
function queueDraftsForReview(
  venue: TrustedVenueDef,
  drafts: IngestEventDraft[],
  existingEvents: Event[],
): { jobId: string; queued: number; skipped: Array<{ title: string; reason: string }> } {
  const businesses = storage.getBusinesses({});
  const candidates = buildScanCandidates(
    drafts.map(draft => ({
      draft,
      sourceId: venue.sourceId,
      sourceLabel: `Trusted · ${venue.venueName}`,
      sourceUrl: venue.feedUrl || venue.calendarPageUrl,
    })),
    existingEvents,
    businesses,
  );

  const skipped: Array<{ title: string; reason: string }> = [];
  // buildScanCandidates already drops events fully covered by the main board.
  // Any residual strong-dup (edge cases) stays unselected and is reported.
  for (const c of candidates) {
    if (c.strongDuplicate) {
      c.selected = false;
      skipped.push({
        title: c.draft.title,
        reason: `Possible duplicate of #${c.strongDuplicate.eventId} (unselected)`,
      });
    }
    if (c.alreadyOnBoard?.length) {
      skipped.push({
        title: c.draft.title,
        reason: `${c.alreadyOnBoard.length} date(s) already on main board - only new nights queued`,
      });
    }
  }

  const jobId = `trusted-review-${venue.sourceId}-${randomUUID().slice(0, 8)}`;
  insertScanJob({
    id: jobId,
    status: "done",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    total: 1,
    completed: 1,
    currentSourceId: venue.sourceId,
    currentLabel: `Trusted · ${venue.venueName}`,
    etaSeconds: 0,
    error: null,
    avgMs: 0,
    filterJson: JSON.stringify({ kind: "trusted_review", sourceId: venue.sourceId }),
    perSourceJson: JSON.stringify([
      {
        sourceId: venue.sourceId,
        label: venue.venueName,
        url: venue.feedUrl,
        ok: true,
        eventCount: candidates.length,
        error: null,
        ms: 0,
      },
    ]),
    kind: "trusted_manual",
  });

  saveCandidates(
    jobId,
    candidates.map(c => ({
      id: c.id,
      sourceId: c.sourceId,
      sourceLabel: c.sourceLabel,
      sourceUrl: c.sourceUrl,
      draft: c.draft,
      selected: c.selected,
      recurring: c.recurring,
      recurringCount: c.recurringCount,
      condensed: c.condensed,
      conflicts: c.conflicts,
      duplicates: c.duplicates,
      strongDuplicate: c.strongDuplicate,
      directoryBrands: c.directoryBrands,
      sourceBundle: c.sourceBundle,
      fieldConflicts: c.fieldConflicts,
      memberDrafts: c.memberDrafts || [],
    })),
  );

  return { jobId, queued: candidates.length, skipped };
}

async function publishDraftsLive(
  venue: TrustedVenueDef,
  drafts: IngestEventDraft[],
  existingEvents: Event[],
): Promise<{
  created: Array<{ id: number; title: string }>;
  skipped: Array<{ title: string; reason: string }>;
  error?: string;
}> {
  const status = venue.publishStatus === "LIVE" ? "LIVE" : "HIDDEN";
  let catalog = existingEvents;
  const created: Array<{ id: number; title: string }> = [];
  const skipped: Array<{ title: string; reason: string }> = [];

  for (let i = 0; i < drafts.length; i += INGEST_MAX_COMMIT) {
    const chunk = drafts.slice(i, i + INGEST_MAX_COMMIT);
    const result = await commitIngest({
      items: chunk.map(draft => ({ draft })),
      status,
      skipDuplicates: true,
      existingEvents: catalog,
      createEvent: (data: InsertEvent) => {
        const isSanctuary =
          venue.sourceId === "sanctuary-ics" || venue.fetchMode === "sanctuary_ics";
        const isHawks =
          venue.sourceId === "hawks-json" || venue.fetchMode === "hawks_squarespace";
        const stamped = isSanctuary
          ? enforceSanctuaryCreateFields(data)
          : isHawks
            ? enforceHawksCreateFields(data)
            : data;
        return storage.createEvent({
          ...stamped,
          status,
          source: `trusted:${venue.sourceId}`,
          adminNotes: [
            stamped.adminNotes,
            `Trusted auto-publish · ${venue.venueName} · ${venue.sourceId}`,
            isSanctuary || isHawks ? "Policy: 21_PLUS · sex-positive · nudity OK" : null,
          ]
            .filter(Boolean)
            .join(" · ")
            .slice(0, 1000),
        });
      },
    });

    if (!result.ok) {
      return { created, skipped, error: result.error };
    }
    for (const c of result.created) created.push({ id: c.id, title: c.title });
    for (const s of result.skipped) skipped.push({ title: s.title, reason: s.reason });
    if (result.created.length) catalog = storage.getEvents({});
  }

  return { created, skipped };
}

/**
 * Sync one trusted venue.
 * Default mode **review** - queues for QSearch Review (manual Sync now).
 * Pass mode **publish** only for automated LIVE commit (nightly).
 */
export async function syncTrustedVenue(
  sourceId: string,
  opts?: TrustedSyncOpts,
): Promise<TrustedSyncResult> {
  const mode: TrustedSyncMode = opts?.mode === "publish" ? "publish" : "review";
  const venue = getTrustedVenue(sourceId);
  if (!venue) {
    return {
      sourceId,
      venueName: sourceId,
      ok: false,
      error: `Unknown trusted sourceId: ${sourceId}`,
      mode,
      fetched: 0,
      created: [],
      updated: [],
      queued: 0,
      jobId: null,
      skipped: [],
      lastPublishedAt: null,
    };
  }

  const base: TrustedSyncResult = {
    sourceId: venue.sourceId,
    venueName: venue.venueName,
    ok: false,
    mode,
    fetched: 0,
    created: [],
    updated: [],
    queued: 0,
    jobId: null,
    skipped: [],
    lastPublishedAt: null,
  };

  try {
    const existingEvents = storage.getEvents({});
    const raw = await fetchDraftsForVenue(venue, existingEvents);
    const drafts = prepareDrafts(raw, venue);
    base.fetched = drafts.length;
    // Flyer yield this run - FRESH acquisitions only (series-reuse backfill
    // excluded): sync can be "ok" and every card can show art while the
    // actual flyer path is broken. Coverage must measure acquisition.
    const flyerCount = countFreshFlyerDrafts(drafts);

    if (!drafts.length) {
      base.ok = true;
      await recordHealth({
        sourceId: venue.sourceId,
        ok: true,
        error: null,
        eventCount: 0,
        flyerCount: null,
        created: [],
        lastPublishedAt: null,
      });
      return base;
    }

    // Refresh existing board events in place (no duplicate, no erase); only
    // genuinely-new drafts continue to Review / LIVE publish.
    const { fresh, updated } = autoMergeExistingEvents(drafts, existingEvents);
    base.updated = updated;
    const catalog = updated.length ? storage.getEvents({}) : existingEvents;

    if (mode === "review") {
      if (fresh.length) {
        const { jobId, queued, skipped } = queueDraftsForReview(venue, fresh, catalog);
        base.jobId = jobId;
        base.queued = queued;
        base.skipped = skipped;
      }
      base.ok = true;
      // Health: feed worked; no LIVE publish on review path
      await recordHealth({
        sourceId: venue.sourceId,
        ok: true,
        error: null,
        eventCount: drafts.length,
        flyerCount,
        created: [],
        lastPublishedAt: null,
      });
      return base;
    }

    // ── publish mode (nightly / explicit) ──
    const pub = await publishDraftsLive(venue, fresh, catalog);
    if (pub.error) {
      base.error = pub.error;
      base.created = pub.created;
      base.skipped = pub.skipped;
      await recordHealth({
        sourceId: venue.sourceId,
        ok: false,
        error: pub.error,
        eventCount: base.fetched,
        flyerCount,
        created: pub.created,
        lastPublishedAt: null,
      });
      return base;
    }

    const publishedAt = pub.created.length ? new Date().toISOString() : null;
    base.ok = true;
    base.created = pub.created;
    base.skipped = pub.skipped;
    base.lastPublishedAt = publishedAt;
    await recordHealth({
      sourceId: venue.sourceId,
      ok: true,
      error: null,
      eventCount: base.fetched,
      created: pub.created,
      lastPublishedAt: publishedAt,
    });
    return base;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    base.ok = false;
    base.error = message;
    await recordHealth({
      sourceId: venue.sourceId,
      ok: false,
      error: message,
      eventCount: base.fetched,
      created: base.created,
      lastPublishedAt: null,
    });
    return base;
  }
}

/** Sync every trusted venue (sequential). Defaults to review mode. */
export async function syncAllTrustedVenues(
  opts?: TrustedSyncOpts,
): Promise<TrustedSyncResult[]> {
  const results: TrustedSyncResult[] = [];
  for (const v of TRUSTED_VENUES) {
    results.push(await syncTrustedVenue(v.sourceId, opts));
  }
  return results;
}
