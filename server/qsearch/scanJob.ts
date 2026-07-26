import { randomUUID } from "node:crypto";
import type { Event } from "@shared/schema";
import {
  INGEST_SOURCES,
  buildDirectoryCoverage,
  buildDirectoryIngestSources,
  mergeIngestSources,
  type IngestSource,
} from "@shared/ingestSources";
import { isTrustedLaneSource } from "@shared/trustedVenues";
import type { IngestEventDraft } from "../ingest/types";
import { isPortlandEventListing, isAllowedCityEventListing } from "../ingest";
import { isPastEventListing } from "../ingest/dates";
import {
  isGenericEventbriteDumpUrl,
  isRelevantScanDraft,
  type SourceRelevanceContext,
} from "../ingest/relevance";
import { enrichEventPageUrl } from "../ingest/eventPageUrl";
import { enrichDraftsFromEventPages } from "../ingest/enrichEventPage";
import {
  enrichDraftPoster,
  extractFlyerCandidatesFromHtml,
} from "../ingest/posterQuality";
import { fetchSanctuaryDrafts } from "../ingest/adapters/sanctuary";
import { storage } from "../storage";
import { buildScanCandidates, priorFlyerFromCatalog, type ScanCandidate } from "./analyze";
import {
  enrichDraftVenueFromSource,
  matchDirectoryBrands,
  directoryVenueAddressConflicts,
} from "./directoryBrands";
import { isEventPlaceholderUrl } from "@shared/eventPoster";
import { discoverAndParse } from "./discover";
import { fetchIngestSource } from "../ingest/fetchSource";
import { expandBadlandsCalendarUrl } from "../ingest/parseBadlands";
import { extractFlyerImageUrls, visionFlyerToDrafts } from "./vision";
import {
  getActiveScanJobRow,
  getLatestScanJobRow,
  getScanJobRow,
  getSourceHealth,
  insertScanJob,
  listCandidates,
  listCustomIngestSources,
  listDisabledSourceIds,
  listSourceHealth,
  prunePendingAgainstCatalog,
  recordScanResult,
  reviewQueueSummary,
  saveCandidates,
  syncKnownSources,
  updateScanJob,
  type QSearchSourceHealth,
} from "./store";

export type ScanJobStatus = "queued" | "running" | "done" | "failed" | "cancelled";

const AVG_MS_DEFAULT = 2800;
const MAX_SOURCES_MANUAL = 60;
const MAX_SOURCES_NIGHTLY = 40;
let activeScanId: string | null = null;
/** In-memory running handles for cancel + live progress (also mirrored to SQLite). */
const live = new Map<
  string,
  {
    cancel: boolean;
    candidates: ScanCandidate[];
    /** Drafts dropped as closed_permanent:* this run (Eventbrite resurrection block). */
    closedVenueDrops: number;
    closedVenueReasons: Record<string, number>;
    perSource: Array<{
      sourceId: string;
      label: string;
      url: string;
      ok: boolean;
      eventCount: number;
      error: string | null;
      ms: number;
      resolvedUrl?: string | null;
      parsers?: string[];
      closedVenueDrops?: number;
    }>;
  }
>();

function noteClosedDrop(
  handle: { closedVenueDrops: number; closedVenueReasons: Record<string, number> },
  reason: string | undefined,
  perSourceRow?: { closedVenueDrops?: number },
) {
  if (!reason || !reason.startsWith("closed_permanent:")) return;
  handle.closedVenueDrops += 1;
  handle.closedVenueReasons[reason] = (handle.closedVenueReasons[reason] || 0) + 1;
  if (perSourceRow) {
    perSourceRow.closedVenueDrops = (perSourceRow.closedVenueDrops || 0) + 1;
  }
}

export function buildLiveSources(businesses: Array<{
  id: number;
  name: string;
  website?: string | null;
  type?: string | null;
  active?: boolean | null;
  instagram?: string | null;
}>): IngestSource[] {
  const directory = buildDirectoryIngestSources(businesses);
  let sources = mergeIngestSources(INGEST_SOURCES, directory);

  // Admin-added custom scrape URLs
  const custom = listCustomIngestSources();
  if (custom.length) {
    const seen = new Set(sources.map(s => s.id));
    const tierOk = new Set(["1", "2", "3", "agg", "partiful", "eventbrite", "directory"]);
    const formatOk = new Set([
      "ics",
      "jsonld",
      "squarespace",
      "tribe",
      "wix",
      "html",
      "eventbrite",
      "partiful",
      "unknown",
    ]);
    for (const c of custom) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      sources.push({
        id: c.id,
        url: c.url,
        label: c.label,
        tier: (tierOk.has(c.tier) ? c.tier : "1") as IngestSource["tier"],
        format: (formatOk.has(c.format) ? c.format : "html") as IngestSource["format"],
        businessId: c.businessId,
        notes: "Admin-added custom source",
      });
    }
  }

  // Trusted lane is a separate custom path (adapters + Trusted board).
  // QSearch catch-all must not re-scan those venues or their sibling recipes.
  sources = sources.filter(s => !isTrustedLaneSource({ id: s.id, url: s.url }));

  // Eventbrite is Trusted-lane ONLY now. Trusted venues keep their official
  // Eventbrite feeds via trustedSync (fetchMode eventbrite_org, e.g. Stag PDX)
  // which are already excluded above. Drop every remaining Eventbrite scan
  // source, the broad Portland keyword dumps and the venue-name EB searches,
  // so the QSearch catch-all never pulls from Eventbrite.
  sources = sources.filter(s => s.format !== "eventbrite" && s.tier !== "eventbrite");

  // Soft-deleted sources stay out of scans (and stay disabled across registry sync)
  const disabled = listDisabledSourceIds();
  if (disabled.size) {
    sources = sources.filter(s => !disabled.has(s.id));
  }

  // dragpdx: only include if opt-in
  const health = listSourceHealth();
  const dragOpt = health.some(h => h.dragpdxOptIn && /dragpdx/i.test(h.sourceId + h.url));
  if (!dragOpt) {
    sources = sources.filter(s => !/dragpdx/i.test(s.id + s.url));
  }
  return sources;
}

export function effectiveScanUrl(source: IngestSource): string {
  const h = getSourceHealth(source.id);
  let url = source.url;
  if (h?.recipeUrl && !isGenericEventbriteDumpUrl(h.recipeUrl)) {
    url = h.recipeUrl;
  } else if (
    h?.resolvedUrl &&
    h.yieldStatus === "works" &&
    h.zeroYieldStreak < 2 &&
    !isGenericEventbriteDumpUrl(h.resolvedUrl)
  ) {
    url = h.resolvedUrl;
  }
  // Badlands worker requires ?from=&to= Pacific date window
  if (
    source.id === "badlands-api" ||
    /badlandsportland\.workers\.dev|badlands-events/i.test(url)
  ) {
    url = expandBadlandsCalendarUrl(url);
  }
  return url;
}

export function syncAndSummarize(
  sources: IngestSource[],
  businesses?: Array<{
    id: number;
    name: string;
    website?: string | null;
    type?: string | null;
    active?: boolean | null;
  }>,
) {
  const sync = syncKnownSources(
    sources.map(s => ({
      id: s.id,
      url: s.url,
      label: s.label,
      tier: s.tier,
      format: s.format,
      businessId: s.businessId,
      caution: s.caution,
    })),
  );
  // Health table still holds historical trusted rows - hide them from the
  // catch-all Sources / Health UI (they live on the Trusted board).
  const health = listSourceHealth().filter(
    h => !isTrustedLaneSource({ id: h.sourceId, url: h.url }),
  );
  const failing = health.filter(
    h =>
      h.lastOk === false ||
      h.consecutiveFails >= 2 ||
      ["dead", "zero_yield", "discovery_needed"].includes(h.yieldStatus),
  );
  const healthy = health.filter(h => h.yieldStatus === "works" || h.lastOk === true);
  const neverScanned = health.filter(h => h.lastScanAt == null || h.yieldStatus === "unscanned");
  const newFromDirectory = health.filter(h => h.isDirectory && h.isNew);
  const coverage = businesses ? buildDirectoryCoverage(businesses, INGEST_SOURCES) : [];
  const queue = reviewQueueSummary();

  return {
    sources,
    health,
    coverage,
    sync,
    reviewQueue: queue,
    stats: {
      urlCount: sources.length,
      curatedCount: sources.filter(s => s.tier !== "directory").length,
      directoryCount: sources.filter(s => s.tier === "directory").length,
      directoryPlaces: coverage.length,
      directoryWithWebsiteField: coverage.filter(c => c.resolution === "field").length,
      directoryWithFallbackUrl: coverage.filter(c => c.resolution === "fallback").length,
      directoryMissingUrl: coverage.filter(c => c.resolution === "none").length,
      directoryAbsorbedByCurated: coverage.filter(c => c.absorbedByCurated).length,
      healthyCount: healthy.length,
      failingCount: failing.length,
      neverScannedCount: neverScanned.length,
      newDirectoryCount: newFromDirectory.length,
      pendingReview: queue.pendingCandidates,
      lastScanAt: health.reduce<string | null>((best, h) => {
        if (!h.lastScanAt) return best;
        if (!best || h.lastScanAt > best) return h.lastScanAt;
        return best;
      }, null),
    },
    failing,
    newFromDirectory,
  };
}

export type StartScanOpts = {
  tiers?: string[];
  onlyFailing?: boolean;
  onlyDirectory?: boolean;
  onlyNew?: boolean;
  sourceIds?: string[];
  kind?: "manual" | "nightly";
  businesses: Array<{
    id: number;
    name: string;
    website?: string | null;
    type?: string | null;
    active?: boolean | null;
  }>;
  existingEvents: Event[];
  /** Optional vision assist when structured empty */
  tryVision?: boolean;
  /**
   * When false (default), past occurrences are dropped from the review queue.
   * Weekly/monthly series still condense around the next upcoming date.
   */
  includePastEvents?: boolean;
};

function prioritizeForNightly(sources: IngestSource[]): IngestSource[] {
  const health = new Map(listSourceHealth().map(h => [h.sourceId, h]));
  const score = (s: IngestSource) => {
    const h = health.get(s.id);
    if (!h || !h.lastScanAt) return 0;
    if (h.lastOk === false || h.yieldStatus === "dead" || h.yieldStatus === "zero_yield") return 1;
    if (s.tier === "1" || s.tier === "eventbrite") return 2;
    if (s.priority) return 2;
    return 3;
  };
  return [...sources].sort((a, b) => score(a) - score(b) || a.label.localeCompare(b.label));
}

export function startScan(opts: StartScanOpts): { jobId: string; total: number; status: string; etaSeconds: number } | { error: string } {
  // Drop DB rows left "running" after a crash/restart so Scan never looks dead
  recoverOrphanScans();

  // In-memory lock: only block if that job is actually still live in this process
  if (activeScanId && !live.has(activeScanId)) {
    activeScanId = null;
  }
  const active = getActiveScanJobRow();
  if (active && live.has(active.id)) {
    return { error: "A scan is already running" };
  }
  if (active && !live.has(active.id)) {
    // DB says running but process has no handle - mark failed and continue
    updateScanJob({
      id: active.id,
      status: "failed",
      error: "Orphaned scan (no live worker)",
      finishedAt: new Date().toISOString(),
    });
  }
  if (activeScanId && live.has(activeScanId)) {
    return { error: "A scan is already running" };
  }

  let sources = buildLiveSources(opts.businesses);
  syncKnownSources(
    sources.map(s => ({
      id: s.id,
      url: s.url,
      label: s.label,
      tier: s.tier,
      format: s.format,
      businessId: s.businessId,
    })),
  );

  if (opts.sourceIds?.length) {
    const set = new Set(opts.sourceIds);
    sources = sources.filter(s => set.has(s.id));
  }
  if (opts.tiers?.length) {
    const set = new Set(opts.tiers);
    sources = sources.filter(s => set.has(s.tier));
  }
  if (opts.onlyDirectory) sources = sources.filter(s => s.tier === "directory");
  if (opts.onlyFailing) {
    const failIds = new Set(
      listSourceHealth()
        .filter(h => h.lastOk === false || h.zeroYieldStreak >= 1 || h.yieldStatus === "dead")
        .map(h => h.sourceId),
    );
    sources = sources.filter(s => failIds.has(s.id));
  }
  if (opts.onlyNew) {
    const newIds = new Set(listSourceHealth().filter(h => h.isNew).map(h => h.sourceId));
    sources = sources.filter(s => newIds.has(s.id));
  }

  // Skip chronic dead / meta_only unless explicitly selected
  if (!opts.sourceIds?.length) {
    const health = new Map(listSourceHealth().map(h => [h.sourceId, h]));
    sources = sources.filter(s => {
      if (s.caution && s.tier === "directory") return false;
      const h = health.get(s.id);
      if (h?.yieldStatus === "meta_only") return false;
      if (h?.yieldStatus === "dead" && h.zeroYieldStreak >= 5 && opts.kind !== "nightly") return false;
      return true;
    });
  }

  if (opts.kind === "nightly") {
    sources = prioritizeForNightly(sources).slice(0, MAX_SOURCES_NIGHTLY);
  } else if (sources.length > MAX_SOURCES_MANUAL) {
    sources = sources.slice(0, MAX_SOURCES_MANUAL);
  }

  if (!sources.length) return { error: "No sources matched scan filters" };

  const id = randomUUID();
  const startedAt = new Date().toISOString();
  insertScanJob({
    id,
    status: "queued",
    startedAt,
    finishedAt: null,
    total: sources.length,
    completed: 0,
    currentSourceId: null,
    currentLabel: null,
    etaSeconds: Math.round((sources.length * AVG_MS_DEFAULT) / 1000),
    error: null,
    avgMs: AVG_MS_DEFAULT,
    filterJson: JSON.stringify({
      tiers: opts.tiers,
      onlyFailing: opts.onlyFailing,
      onlyDirectory: opts.onlyDirectory,
      onlyNew: opts.onlyNew,
      sourceIds: opts.sourceIds,
      kind: opts.kind || "manual",
      includePastEvents: opts.includePastEvents === true,
      tryVision: opts.tryVision !== false,
    }),
    perSourceJson: "[]",
    kind: opts.kind || "manual",
  });

  live.set(id, {
    cancel: false,
    candidates: [],
    closedVenueDrops: 0,
    closedVenueReasons: {},
    perSource: [],
  });
  activeScanId = id;

  void runScan(id, sources, opts).finally(() => {
    if (activeScanId === id) activeScanId = null;
  });

  return {
    jobId: id,
    total: sources.length,
    status: "queued",
    etaSeconds: Math.round((sources.length * AVG_MS_DEFAULT) / 1000),
  };
}

async function runScan(jobId: string, sources: IngestSource[], opts: StartScanOpts) {
  const handle = live.get(jobId);
  if (!handle) return;

  updateScanJob({ id: jobId, status: "running" });
  const raw: Array<{ draft: IngestEventDraft; sourceId: string; sourceLabel: string; sourceUrl: string }> = [];
  const times: number[] = [];

  for (const source of sources) {
    if (handle.cancel) break;
    updateScanJob({
      id: jobId,
      currentSourceId: source.id,
      currentLabel: source.label,
    });

    const t0 = Date.now();
    const primary = effectiveScanUrl(source);
    const health = getSourceHealth(source.id);

    try {
      const isSanctuarySource =
        source.id === "sanctuary-ics" ||
        source.id === "sanctuary-calendar" ||
        /^sanctuary[-_]/i.test(source.id);

      // ── Dedicated Sanctuary path (ICS + page flyers + series reuse) ──
      if (isSanctuarySource) {
        const sanctuaryDrafts = await fetchSanctuaryDrafts({
          // Always prefer the ICS feed; calendar HTML is month-grid noise
          feedUrl:
            /ics/i.test(source.id) || /\.ics|\/ics\/?/i.test(primary)
              ? primary
              : undefined,
          maxPages: 80,
          concurrency: 4,
          includePast: opts.includePastEvents === true,
        });

        const ms = Date.now() - t0;
        times.push(ms);
        const avgMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const remaining = sources.length - times.length;
        const etaSeconds = Math.max(0, Math.round((remaining * avgMs) / 1000));

        const cityAllowlist = Array.isArray(source.cityAllowlist) ? source.cityAllowlist : null;
        const portlandOnly =
          !cityAllowlist?.length &&
          (source.portlandOnly === true ||
            String(source.businessType || "").toLowerCase() === "group");
        const relevanceCtx: SourceRelevanceContext = {
          sourceId: source.id,
          label: source.label,
          url: source.url,
          tier: source.tier,
        };
        const includePast = opts.includePastEvents === true;

        let kept = 0;
        const perRow: (typeof handle.perSource)[0] = {
          sourceId: source.id,
          label: source.label,
          url: primary,
          ok: true,
          eventCount: 0,
          error: null,
          ms: 0,
          closedVenueDrops: 0,
        };
        for (const draft of sanctuaryDrafts) {
          if (cityAllowlist?.length && !isAllowedCityEventListing(draft, cityAllowlist)) continue;
          if (portlandOnly && !isPortlandEventListing(draft)) continue;
          if (!includePast && isPastEventListing(draft)) continue;
          const rel = isRelevantScanDraft(draft, relevanceCtx);
          if (!rel.keep) {
            noteClosedDrop(handle, rel.reason, perRow);
            continue;
          }
          kept++;
          const withPoster = await enrichDraftPoster(draft, []);
          raw.push({
            draft: withPoster,
            sourceId: source.id,
            sourceLabel: source.label,
            sourceUrl: source.url,
          });
        }

        recordScanResult(source.id, {
          ok: true,
          eventCount: kept,
          resolvedUrl: kept > 0 ? source.url : null,
          winningParser: "ics",
          yieldStatus: kept > 0 ? "works" : "zero_yield",
        });
        perRow.eventCount = kept;
        perRow.error = kept === 0 ? "Zero yield" : null;
        perRow.ms = ms;
        handle.perSource.push({
          ...perRow,
          // keep rest of fields filled below if original had more
          ok: true,
          ms,
          resolvedUrl: source.url,
          parsers: ["ics", "sanctuary"],
        });
        updateScanJob({
          id: jobId,
          completed: times.length,
          avgMs,
          etaSeconds,
          perSourceJson: JSON.stringify(handle.perSource),
        });
        continue;
      }

      const hit = await discoverAndParse({
        primaryUrl: primary,
        recipeUrl: health?.recipeUrl,
        resolvedUrl: health?.resolvedUrl,
        existingEvents: opts.existingEvents,
        allowExpand: true,
      });

      // Optional vision: if empty and tryVision, sample flyer images from primary page
      if (hit.eventCount === 0 && opts.tryVision) {
        try {
          const page = await fetchIngestSource(primary);
          const imgs = extractFlyerImageUrls(page.body, page.url || primary, 2);
          for (const img of imgs) {
            const vis = await visionFlyerToDrafts({
              imageUrl: img,
              sourceUrl: primary,
              venueHint: source.label,
            });
            if (vis.drafts.length) {
              hit.drafts.push(...vis.drafts);
              hit.eventCount = hit.drafts.length;
              hit.parsers = [...hit.parsers, "vision"];
              break;
            }
          }
        } catch {
          /* vision optional */
        }
      }

      const ms = Date.now() - t0;
      times.push(ms);
      const avgMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const remaining = sources.length - times.length;
      const etaSeconds = Math.max(0, Math.round((remaining * avgMs) / 1000));

      recordScanResult(source.id, {
        ok: true,
        eventCount: hit.eventCount,
        resolvedUrl: hit.eventCount > 0 ? hit.url : null,
        winningParser: hit.parsers[0] || null,
        yieldStatus: hit.eventCount > 0 ? "works" : "zero_yield",
      });

      handle.perSource.push({
        sourceId: source.id,
        label: source.label,
        url: primary,
        ok: true,
        eventCount: hit.eventCount,
        error: hit.eventCount === 0 ? "Zero yield" : null,
        ms,
        resolvedUrl: hit.url,
        parsers: hit.parsers,
      });

      // List-page flyer pool is only safe when this source returned ONE event.
      // Applying a calendar hero to every night is what made wrong flyers spread.
      let pageFlyerPool: string[] = [];
      const singleEventYield = hit.drafts.length === 1;
      if (singleEventYield) {
        try {
          const listPage = await fetchIngestSource(hit.url || primary);
          if (listPage.body && /<html|<img|og:image/i.test(listPage.body)) {
            pageFlyerPool = extractFlyerCandidatesFromHtml(
              listPage.body,
              listPage.url || hit.url || primary,
            );
          }
        } catch {
          /* optional */
        }
      }

      // Groups / multi-city brands: city allowlist (Bearracuda PDX+SEA) or Portland-only
      const cityAllowlist = Array.isArray(source.cityAllowlist) ? source.cityAllowlist : null;
      const portlandOnly =
        !cityAllowlist?.length &&
        (source.portlandOnly === true ||
          String(source.businessType || "").toLowerCase() === "group");

      const relevanceCtx: SourceRelevanceContext = {
        sourceId: source.id,
        label: source.label,
        url: source.url,
        tier: source.tier,
      };

      // Drop past listings BEFORE page enrich (Sanctuary ICS is ~400 VEVENTs, mostly history)
      // Also drop Eventbrite dumps / non-queer city noise / venue-mismatched org scrapes
      const includePast = opts.includePastEvents === true;
      let sourceClosedDrops = 0;
      const upcomingDrafts = hit.drafts.filter(d => {
        if (cityAllowlist?.length && !isAllowedCityEventListing(d, cityAllowlist)) return false;
        if (portlandOnly && !isPortlandEventListing(d)) return false;
        if (!includePast && isPastEventListing(d)) return false;
        const rel = isRelevantScanDraft(d, relevanceCtx);
        if (!rel.keep) {
          if (rel.reason?.startsWith("closed_permanent:")) {
            sourceClosedDrops += 1;
            noteClosedDrop(handle, rel.reason);
          }
          return false;
        }
        return true;
      });

      // Attach human event page URL, then pull flyer + full description from that page
      const withPages = upcomingDrafts.map(d => enrichEventPageUrl(d));
      const enrichedPages = await enrichDraftsFromEventPages(withPages, {
        concurrency: 3,
        maxPages: 50,
      });

      let kept = 0;
      for (const draft of enrichedPages) {
        // Re-check past after page may have corrected dates
        if (!includePast && isPastEventListing(draft)) continue;
        kept++;
        const extra: string[] = [];
        if (!draft.posterImageUrl && singleEventYield && pageFlyerPool.length) {
          extra.push(...pageFlyerPool);
        }
        // Capture full-quality flyer into /uploads when remote
        const withPoster = await enrichDraftPoster(
          draft,
          draft.posterImageUrl ? [] : extra,
        );
        raw.push({
          draft: withPoster,
          sourceId: source.id,
          sourceLabel: source.label,
          sourceUrl: hit.sourceUrl || hit.url,
        });
      }

      // Reflect city filter + closed-venue drops in health counts
      const last = handle.perSource[handle.perSource.length - 1];
      if (last && last.sourceId === source.id) {
        last.closedVenueDrops = sourceClosedDrops;
        if ((portlandOnly || cityAllowlist?.length) && kept !== hit.eventCount) {
          last.eventCount = kept;
          const market = cityAllowlist?.length ? cityAllowlist.join("+") : "Portland";
          last.error =
            kept === 0
              ? hit.eventCount > 0
                ? `Zero ${market} yield (${hit.eventCount} out-of-market dropped)`
                : "Zero yield"
              : last.error;
          recordScanResult(source.id, {
            ok: true,
            eventCount: kept,
            resolvedUrl: kept > 0 ? hit.url : null,
            winningParser: hit.parsers[0] || null,
            yieldStatus: kept > 0 ? "works" : "zero_yield",
          });
        }
      }

      updateScanJob({
        id: jobId,
        completed: times.length,
        avgMs,
        etaSeconds,
        perSourceJson: JSON.stringify(handle.perSource),
      });
    } catch (err: any) {
      const ms = Date.now() - t0;
      times.push(ms);
      const msg = err?.message || "Scan error";
      recordScanResult(source.id, {
        ok: false,
        eventCount: 0,
        error: msg,
        yieldStatus: "discovery_needed",
      });
      handle.perSource.push({
        sourceId: source.id,
        label: source.label,
        url: primary,
        ok: false,
        eventCount: 0,
        error: msg,
        ms,
      });
      updateScanJob({
        id: jobId,
        completed: times.length,
        avgMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        etaSeconds: Math.max(0, Math.round(((sources.length - times.length) * AVG_MS_DEFAULT) / 1000)),
        perSourceJson: JSON.stringify(handle.perSource),
      });
    }
  }

  const businesses = storage.getBusinesses({});
  const candidates = buildScanCandidates(raw, opts.existingEvents, businesses, {
    includePastEvents: opts.includePastEvents === true,
  });
  // Low confidence vision/ig unselected
  for (const c of candidates) {
    if (c.draft.confidence != null && c.draft.confidence < 0.55) {
      c.selected = false;
    }
  }
  handle.candidates = candidates;
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

  const cancelled = handle.cancel;
  // Preserve original filter fields; append closed-venue drop stats for Daily board
  let filter: Record<string, unknown> = {};
  try {
    const row = getScanJobRow(jobId);
    filter = row?.filterJson ? JSON.parse(row.filterJson) : {};
  } catch {
    filter = {};
  }
  filter.closedVenueDrops = handle.closedVenueDrops;
  filter.closedVenueReasons = handle.closedVenueReasons;
  updateScanJob({
    id: jobId,
    status: cancelled ? "cancelled" : "done",
    finishedAt: new Date().toISOString(),
    currentSourceId: null,
    currentLabel: null,
    etaSeconds: 0,
    completed: sources.length,
    perSourceJson: JSON.stringify(handle.perSource),
    filterJson: JSON.stringify(filter),
  });
}

export function cancelScan(id: string): boolean {
  const row = getScanJobRow(id);
  if (!row) return false;
  if (row.status !== "running" && row.status !== "queued") return false;
  const handle = live.get(id);
  if (handle) handle.cancel = true;
  updateScanJob({ id, status: "cancelled", finishedAt: new Date().toISOString() });
  return true;
}

/** Attach/refresh directory logos + prior flyers on any candidate list (queue, scan job, dashboard). */
export function attachDirectoryBrandsToCandidates<T extends Record<string, unknown>>(
  candidates: T[],
  businesses = storage.getBusinesses({}),
  catalog = storage.getEvents({}),
): T[] {
  return candidates.map(c => {
    try {
      let draft = c.draft as IngestEventDraft | undefined;
      if (!draft) return c;
      draft = enrichDraftVenueFromSource(draft, businesses, {
        sourceLabel: String(c.sourceLabel || ""),
        sourceId: String(c.sourceId || ""),
      });
      draft = enrichEventPageUrl(draft);
      const directoryBrands = matchDirectoryBrands(draft, businesses, {
        sourceLabel: String(c.sourceLabel || ""),
        sourceId: String(c.sourceId || ""),
      });
      const dirAddrConflicts = directoryVenueAddressConflicts(draft, directoryBrands, businesses);
      const existingFc = Array.isArray((c as any).fieldConflicts)
        ? ((c as any).fieldConflicts as unknown[])
        : [];
      const fieldConflicts = [
        ...existingFc,
        ...dirAddrConflicts.map(x => x.fieldConflict),
      ];

      // Same-series prior flyer only - never "any poster from this venue"
      const missingFlyer = !draft.posterImageUrl || isEventPlaceholderUrl(draft.posterImageUrl);
      const strong = c.strongDuplicate as { eventId?: number; confidence?: string } | null | undefined;
      const dups =
        (c.duplicates as Array<{ eventId?: number; confidence?: string }> | undefined) || [];
      if (missingFlyer) {
        const matchIds = [
          ...(strong?.eventId != null && (strong.confidence === "high" || !strong.confidence)
            ? [strong.eventId]
            : []),
          ...dups
            .filter(d => d.confidence === "high" || d.confidence == null)
            .map(d => d.eventId)
            .filter((id): id is number => id != null),
        ];
        const prior = priorFlyerFromCatalog(draft, catalog, matchIds);
        if (prior) {
          draft = {
            ...draft,
            posterImageUrl: prior.url,
            warnings: Array.from(
              new Set([
                ...(draft.warnings || []),
                `Flyer reused from prior same-series catalog event #${prior.eventId}`,
              ]),
            ),
          };
        }
      }

      if (dirAddrConflicts.length) {
        draft = {
          ...draft,
          warnings: Array.from(
            new Set([...(draft.warnings || []), ...dirAddrConflicts.map(x => x.warning)]),
          ),
        };
      }

      return {
        ...c,
        draft,
        directoryBrands,
        fieldConflicts,
        // Force human review — never auto-select when address ≠ directory
        selected: dirAddrConflicts.length ? false : (c as any).selected,
      };
    } catch {
      return c;
    }
  });
}

function closedStatsFromJob(row: { filterJson?: string | null }, handle?: {
  closedVenueDrops: number;
  closedVenueReasons: Record<string, number>;
} | null) {
  if (handle) {
    return {
      closedVenueDrops: handle.closedVenueDrops,
      closedVenueReasons: handle.closedVenueReasons,
    };
  }
  try {
    const f = row.filterJson ? JSON.parse(row.filterJson) : {};
    return {
      closedVenueDrops: Number(f.closedVenueDrops || 0),
      closedVenueReasons: (f.closedVenueReasons || {}) as Record<string, number>,
    };
  } catch {
    return { closedVenueDrops: 0, closedVenueReasons: {} as Record<string, number> };
  }
}

export function getScanJobView(id: string) {
  const row = getScanJobRow(id);
  if (!row) return null;
  const handle = live.get(id);
  const rawCandidates =
    row.status === "done" || row.status === "cancelled"
      ? listCandidates({ jobId: id })
      : handle?.candidates || [];
  const candidates = attachDirectoryBrandsToCandidates(rawCandidates as any[]);
  let perSource: unknown[] = [];
  try {
    perSource = JSON.parse(row.perSourceJson || "[]");
  } catch {
    perSource = handle?.perSource || [];
  }
  const closed = closedStatsFromJob(row, handle || null);
  return {
    id: row.id,
    status: row.status,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    total: row.total,
    completed: row.completed,
    currentSourceId: row.currentSourceId,
    currentLabel: row.currentLabel,
    etaSeconds: row.etaSeconds,
    error: row.error,
    kind: row.kind,
    perSource,
    candidates,
    candidateCount: candidates.length,
    progress: row.total ? Math.round((row.completed / row.total) * 100) : 0,
    closedVenueDrops: closed.closedVenueDrops,
    closedVenueReasons: closed.closedVenueReasons,
  };
}

export function getLatestScanJob() {
  const row = getLatestScanJobRow();
  return row ? getScanJobView(row.id) : null;
}

export function dashboardSnapshot(businesses: StartScanOpts["businesses"]) {
  const sources = buildLiveSources(businesses);
  const summary = syncAndSummarize(sources, businesses);
  const fullBiz = storage.getBusinesses({});
  // Drop Review cards already on the main board (and trim series to new dates only)
  try {
    prunePendingAgainstCatalog(storage.getEvents({}));
  } catch {
    /* non-fatal */
  }
  const latestJob = getLatestScanJob();
  return {
    ...summary,
    latestJob,
    /** Convenience for Daily board: closed-permanent drops from latest scan. */
    closedVenueDrops: (latestJob as { closedVenueDrops?: number } | null)?.closedVenueDrops ?? 0,
    closedVenueReasons:
      (latestJob as { closedVenueReasons?: Record<string, number> } | null)?.closedVenueReasons ?? {},
    pendingCandidates: attachDirectoryBrandsToCandidates(
      listCandidates({ status: "pending", limit: 200 }) as any[],
      fullBiz,
    ),
  };
}

/** Resume marker if process died mid-scan - mark orphan running jobs failed. */
export function recoverOrphanScans() {
  const active = getActiveScanJobRow();
  if (active && !live.has(active.id)) {
    updateScanJob({
      id: active.id,
      status: "failed",
      error: "Process restarted mid-scan",
      finishedAt: new Date().toISOString(),
    });
  }
}
