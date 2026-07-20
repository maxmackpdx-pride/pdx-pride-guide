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
  INGEST_MAX_COMMIT,
} from "../ingest";
import { isPastEventListing } from "../ingest/dates";
import { fetchIngestSource } from "../ingest/fetchSource";
import {
  expandBadlandsCalendarUrl,
  parseBadlandsJson,
} from "../ingest/parseBadlands";
import {
  applySanctuaryPolicy,
  fetchSanctuaryDrafts,
  SANCTUARY_AGE_REQUIREMENT,
} from "../ingest/adapters/sanctuary";
import { applyEaglePolicy, fetchEagleDrafts } from "../ingest/adapters/eagle";
import { inferAdmissionFromText } from "../ingest/admissionInfer";
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
  /** Review-queue candidate count (review mode) */
  queued: number;
  /** Scan job id when mode=review */
  jobId: string | null;
  skipped: Array<{ title: string; reason: string }>;
  lastPublishedAt: string | null;
};

export type TrustedSyncOpts = {
  /**
   * review (default) — land drafts in QSearch Review for admin approve.
   * publish — commit LIVE without review (nightly automation only).
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

  // Badlands is a 21+ bar — never ALL_AGES; never invent FREE cover
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

async function fetchBadlandsDrafts(venue: TrustedVenueDef): Promise<IngestEventDraft[]> {
  const url = expandBadlandsCalendarUrl(venue.feedUrl);
  const fetched = await fetchIngestSource(url);
  return parseBadlandsJson(fetched.body, fetched.url);
}

async function fetchSanctuaryDraftsForVenue(venue: TrustedVenueDef): Promise<IngestEventDraft[]> {
  return fetchSanctuaryDrafts({
    feedUrl: venue.feedUrl,
    maxPages: 80,
    concurrency: 4,
    includePast: false,
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
  return hit.drafts;
}

async function fetchDraftsForVenue(
  venue: TrustedVenueDef,
  existingEvents: Event[],
): Promise<IngestEventDraft[]> {
  switch (venue.fetchMode) {
    case "badlands_api":
      return fetchBadlandsDrafts(venue);
    case "sanctuary_ics":
      return fetchSanctuaryDraftsForVenue(venue);
    case "eagle_wix":
      return fetchEagleDraftsForVenue(venue);
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
  // Pre-select all; strong dups still show in Review for human decision
  for (const c of candidates) {
    if (c.strongDuplicate) {
      // Keep visible but unselected so approve won't double-publish by default
      c.selected = false;
      skipped.push({
        title: c.draft.title,
        reason: `Possible duplicate of #${c.strongDuplicate.eventId} (unselected)`,
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
        const stamped = isSanctuary ? enforceSanctuaryCreateFields(data) : data;
        return storage.createEvent({
          ...stamped,
          status,
          source: `trusted:${venue.sourceId}`,
          adminNotes: [
            stamped.adminNotes,
            `Trusted auto-publish · ${venue.venueName} · ${venue.sourceId}`,
            isSanctuary ? "Policy: 21_PLUS · sex-positive · nudity OK" : null,
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
 * Default mode **review** — queues for QSearch Review (manual Sync now).
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

    if (!drafts.length) {
      base.ok = true;
      await recordHealth({
        sourceId: venue.sourceId,
        ok: true,
        error: null,
        eventCount: 0,
        created: [],
        lastPublishedAt: null,
      });
      return base;
    }

    if (mode === "review") {
      const { jobId, queued, skipped } = queueDraftsForReview(venue, drafts, existingEvents);
      base.ok = true;
      base.jobId = jobId;
      base.queued = queued;
      base.skipped = skipped;
      // Health: feed worked; no LIVE publish on review path
      await recordHealth({
        sourceId: venue.sourceId,
        ok: true,
        error: null,
        eventCount: drafts.length,
        created: [],
        lastPublishedAt: null,
      });
      return base;
    }

    // ── publish mode (nightly / explicit) ──
    const pub = await publishDraftsLive(venue, drafts, existingEvents);
    if (pub.error) {
      base.error = pub.error;
      base.created = pub.created;
      base.skipped = pub.skipped;
      await recordHealth({
        sourceId: venue.sourceId,
        ok: false,
        error: pub.error,
        eventCount: base.fetched,
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
