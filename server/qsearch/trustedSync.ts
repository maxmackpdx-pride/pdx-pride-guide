/**
 * Trusted venue auto-publish pipeline (no QSearch review queue).
 *
 * Agent C surface — import registry + parsers + commitIngest only.
 * Agent D health: dynamic import of `./trustedHealth.recordTrustedSyncResult`.
 *
 * Call sites (Agent D routes / nightly):
 *   await syncTrustedVenue("badlands-api")
 *   await syncAllTrustedVenues()
 */

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
import { fetchSanctuaryDrafts } from "../ingest/adapters/sanctuary";
import type { IngestEventDraft } from "../ingest/types";
import { storage } from "../storage";
import { discoverAndParse } from "./discover";

export type TrustedSyncResult = {
  sourceId: string;
  venueName: string;
  ok: boolean;
  error?: string;
  fetched: number;
  created: Array<{ id: number; title: string }>;
  skipped: Array<{ title: string; reason: string }>;
  lastPublishedAt: string | null;
};

function applyVenueDefaults(draft: IngestEventDraft, venue: TrustedVenueDef): IngestEventDraft {
  const weakVenue =
    !draft.venueName ||
    draft.venueName === "TBA" ||
    /^(unknown|tbd|n\/a)$/i.test(draft.venueName.trim()) ||
    // ICS often puts street address in LOCATION → first segment looks like address
    /^\d+\s/.test(draft.venueName.trim());

  return {
    ...draft,
    venueName: weakVenue ? venue.venueName : draft.venueName,
    address: draft.address?.trim() ? draft.address : venue.address,
    neighborhood: draft.neighborhood?.trim()
      ? draft.neighborhood
      : venue.neighborhood ?? null,
  };
}

/**
 * Drop past / non-events / empty rows; fill venue defaults; de-dupe within batch.
 */
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
    case "generic":
    default:
      return fetchGenericDrafts(venue, existingEvents);
  }
}

/**
 * Hook Agent D health store. Uses dynamic import so this module still loads if
 * trustedHealth is briefly absent; prefers static-compatible call shape.
 *
 * recordTrustedSyncResult input (Agent D):
 *   { sourceId, ok, error?, eventCount, created?, lastPublishedAt? }
 */
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
    // Agent D not ready — no-op
  }
}

/**
 * Sync one trusted venue: fetch → filter past → dedupe → commit as LIVE (or registry status).
 *
 * Dedupe rules (via commitIngest skipDuplicates:true):
 * - findSubmissionMatches against full catalog (title + day + venue / ticket URL, etc.)
 * - strong (high-confidence) matches are skipped (LIVE or HIDDEN)
 * - within-batch duplicates caught by refreshing catalog after each create chunk
 * - never creates past events (pre-filtered)
 */
export async function syncTrustedVenue(sourceId: string): Promise<TrustedSyncResult> {
  const venue = getTrustedVenue(sourceId);
  if (!venue) {
    return {
      sourceId,
      venueName: sourceId,
      ok: false,
      error: `Unknown trusted sourceId: ${sourceId}`,
      fetched: 0,
      created: [],
      skipped: [],
      lastPublishedAt: null,
    };
  }

  const base: TrustedSyncResult = {
    sourceId: venue.sourceId,
    venueName: venue.venueName,
    ok: false,
    fetched: 0,
    created: [],
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

    const status = venue.publishStatus === "LIVE" ? "LIVE" : "HIDDEN";
    let catalog = existingEvents;
    const created: TrustedSyncResult["created"] = [];
    const skipped: TrustedSyncResult["skipped"] = [];

    for (let i = 0; i < drafts.length; i += INGEST_MAX_COMMIT) {
      const chunk = drafts.slice(i, i + INGEST_MAX_COMMIT);
      const result = await commitIngest({
        items: chunk.map(draft => ({ draft })),
        status,
        skipDuplicates: true,
        existingEvents: catalog,
        createEvent: (data: InsertEvent) =>
          storage.createEvent({
            ...data,
            status,
            source: `trusted:${venue.sourceId}`,
            adminNotes: [
              data.adminNotes,
              `Trusted auto-publish · ${venue.venueName} · ${venue.sourceId}`,
            ]
              .filter(Boolean)
              .join(" · ")
              .slice(0, 1000),
          }),
      });

      if (!result.ok) {
        base.error = result.error;
        base.created = created;
        base.skipped = skipped;
        await recordHealth({
          sourceId: venue.sourceId,
          ok: false,
          error: result.error,
          eventCount: base.fetched,
          created,
          lastPublishedAt: null,
        });
        return base;
      }

      for (const c of result.created) {
        created.push({ id: c.id, title: c.title });
      }
      for (const s of result.skipped) {
        skipped.push({ title: s.title, reason: s.reason });
      }

      // Refresh catalog so next chunk / within-run dups see new rows
      if (result.created.length) {
        catalog = storage.getEvents({});
      }
    }

    const publishedAt = created.length ? new Date().toISOString() : null;
    base.ok = true;
    base.created = created;
    base.skipped = skipped;
    base.lastPublishedAt = publishedAt;

    await recordHealth({
      sourceId: venue.sourceId,
      ok: true,
      error: null,
      eventCount: base.fetched,
      created,
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

/** Sync every entry in TRUSTED_VENUES (sequential — polite to venue hosts). */
export async function syncAllTrustedVenues(): Promise<TrustedSyncResult[]> {
  const results: TrustedSyncResult[] = [];
  for (const v of TRUSTED_VENUES) {
    results.push(await syncTrustedVenue(v.sourceId));
  }
  return results;
}
