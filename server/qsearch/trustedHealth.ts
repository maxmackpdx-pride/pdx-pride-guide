/**
 * Trusted venue health store — last sync / last published for auto-publish path.
 * Table: qsearch_trusted_health. Registry: shared/trustedVenues.ts
 */
import { sqlite, storage } from "../storage";
import {
  TRUSTED_VENUES,
  deriveTrustedHealth,
  getTrustedVenue,
  type TrustedHealthStatus,
  type TrustedVenueDef,
} from "@shared/trustedVenues";

export type TrustedHealthRow = {
  sourceId: string;
  lastSyncAt: string | null;
  lastSyncOk: boolean | null;
  lastSyncError: string | null;
  lastEventCount: number;
  /** Drafts with real flyer art last sync (null = not measured) */
  lastFlyerCount: number | null;
  consecutiveFails: number;
  lastPublishedAt: string | null;
  lastPublishedTitle: string | null;
  lastPublishedEventId: number | null;
  updatedAt: string | null;
};

export type TrustedVenueDashboardRow = {
  sourceId: string;
  venueName: string;
  calendarPageUrl: string;
  feedUrl: string;
  fetchMode: TrustedVenueDef["fetchMode"];
  health: TrustedHealthStatus;
  lastSyncAt: string | null;
  lastSyncOk: boolean | null;
  lastSyncError: string | null;
  lastEventCount: number;
  lastFlyerCount: number | null;
  /** lastFlyerCount / lastEventCount (0..1), null when not measured */
  flyerCoverage: number | null;
  lastPublishedAt: string | null;
  lastPublishedTitle: string | null;
  lastPublishedEventId: number | null;
  consecutiveFails: number;
  pollHours: number;
  notes?: string;
  publishStatus: TrustedVenueDef["publishStatus"];
  address: string;
  neighborhood?: string;
};

function ensureTrustedHealthTable() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS qsearch_trusted_health (
      source_id TEXT PRIMARY KEY,
      last_sync_at TEXT,
      last_sync_ok INTEGER,
      last_sync_error TEXT,
      last_event_count INTEGER NOT NULL DEFAULT 0,
      consecutive_fails INTEGER NOT NULL DEFAULT 0,
      last_published_at TEXT,
      last_published_title TEXT,
      last_published_event_id INTEGER,
      updated_at TEXT
    );
  `);
  // Migration: flyer yield column (added for flyer-coverage health)
  try {
    sqlite.exec(`ALTER TABLE qsearch_trusted_health ADD COLUMN last_flyer_count INTEGER`);
  } catch {
    /* column exists */
  }
}

ensureTrustedHealthTable();

function rowToHealth(row: any): TrustedHealthRow {
  return {
    sourceId: String(row.source_id),
    lastSyncAt: row.last_sync_at || null,
    lastSyncOk: row.last_sync_ok == null ? null : Boolean(row.last_sync_ok),
    lastSyncError: row.last_sync_error || null,
    lastEventCount: Number(row.last_event_count || 0),
    lastFlyerCount: row.last_flyer_count == null ? null : Number(row.last_flyer_count),
    consecutiveFails: Number(row.consecutive_fails || 0),
    lastPublishedAt: row.last_published_at || null,
    lastPublishedTitle: row.last_published_title || null,
    lastPublishedEventId:
      row.last_published_event_id != null ? Number(row.last_published_event_id) : null,
    updatedAt: row.updated_at || null,
  };
}

export function listTrustedHealthRows(): TrustedHealthRow[] {
  ensureTrustedHealthTable();
  return sqlite
    .prepare(`SELECT * FROM qsearch_trusted_health ORDER BY source_id COLLATE NOCASE`)
    .all()
    .map(rowToHealth);
}

export function getTrustedHealthRow(sourceId: string): TrustedHealthRow | null {
  ensureTrustedHealthTable();
  const row = sqlite
    .prepare(`SELECT * FROM qsearch_trusted_health WHERE source_id = ?`)
    .get(sourceId);
  return row ? rowToHealth(row) : null;
}

/**
 * Persist outcome of a trusted venue sync.
 *
 * Accepts Agent C payload (TrustedSyncHealthPayload) and a compact legacy shape:
 *   { sourceId, ok, error?, eventCount|fetched, created?, lastPublished* }
 *
 * - ok=false → consecutive_fails += 1
 * - ok=true  → consecutive_fails = 0
 * - created[] / lastPublishedEventId updates last_published_*
 */
export function recordTrustedSyncResult(input: {
  sourceId: string;
  ok: boolean;
  error?: string | null;
  /** Feed yield count (preferred) */
  eventCount?: number;
  /** Agent C alias for eventCount */
  fetched?: number;
  /** Drafts with real flyer art this sync (null/omitted = not measured) */
  flyerCount?: number | null;
  created?: Array<{ id: number; title: string }>;
  createdCount?: number;
  lastPublishedAt?: string | null;
  lastPublishedTitle?: string | null;
  lastPublishedEventId?: number | null;
  /** Agent C clock; defaults to now */
  syncedAt?: string | null;
  venueName?: string;
  skippedCount?: number;
}): TrustedHealthRow {
  ensureTrustedHealthTable();
  const now = String(input.syncedAt || new Date().toISOString());
  const prev = getTrustedHealthRow(input.sourceId);
  const consecutiveFails = input.ok ? 0 : (prev?.consecutiveFails ?? 0) + 1;

  const eventCount = Math.max(
    0,
    Number(
      input.eventCount != null
        ? input.eventCount
        : input.fetched != null
          ? input.fetched
          : 0,
    ) || 0,
  );

  const flyerCount =
    input.flyerCount == null ? null : Math.max(0, Number(input.flyerCount) || 0);

  let lastPublishedAt = prev?.lastPublishedAt ?? null;
  let lastPublishedTitle = prev?.lastPublishedTitle ?? null;
  let lastPublishedEventId = prev?.lastPublishedEventId ?? null;

  const created = Array.isArray(input.created) ? input.created : [];
  if (created.length > 0) {
    const best = [...created].sort((a, b) => Number(b.id) - Number(a.id))[0];
    lastPublishedEventId = Number(best.id);
    lastPublishedTitle = String(best.title || "").trim() || lastPublishedTitle;
    lastPublishedAt = input.lastPublishedAt || now;
  } else if (
    input.lastPublishedEventId != null ||
    input.lastPublishedAt ||
    input.lastPublishedTitle
  ) {
    if (input.lastPublishedEventId != null) {
      lastPublishedEventId = Number(input.lastPublishedEventId);
    }
    if (input.lastPublishedTitle) {
      lastPublishedTitle = String(input.lastPublishedTitle);
    }
    if (input.lastPublishedAt) {
      lastPublishedAt = input.lastPublishedAt;
    } else if (input.lastPublishedEventId != null) {
      lastPublishedAt = now;
    }
  }

  sqlite
    .prepare(
      `INSERT INTO qsearch_trusted_health (
        source_id, last_sync_at, last_sync_ok, last_sync_error,
        last_event_count, last_flyer_count, consecutive_fails,
        last_published_at, last_published_title, last_published_event_id,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source_id) DO UPDATE SET
        last_sync_at = excluded.last_sync_at,
        last_sync_ok = excluded.last_sync_ok,
        last_sync_error = excluded.last_sync_error,
        last_event_count = excluded.last_event_count,
        last_flyer_count = excluded.last_flyer_count,
        consecutive_fails = excluded.consecutive_fails,
        last_published_at = COALESCE(excluded.last_published_at, qsearch_trusted_health.last_published_at),
        last_published_title = COALESCE(excluded.last_published_title, qsearch_trusted_health.last_published_title),
        last_published_event_id = COALESCE(excluded.last_published_event_id, qsearch_trusted_health.last_published_event_id),
        updated_at = excluded.updated_at`,
    )
    .run(
      input.sourceId,
      now,
      input.ok ? 1 : 0,
      input.ok ? null : String(input.error || "sync failed").slice(0, 2000),
      eventCount,
      flyerCount,
      consecutiveFails,
      lastPublishedAt,
      lastPublishedTitle,
      lastPublishedEventId,
      now,
    );

  return getTrustedHealthRow(input.sourceId)!;
}

/** Loose venue name match for fallback “last LIVE published” lookup. */
function venueNameMatches(eventVenue: string | null | undefined, trustedName: string): boolean {
  const a = String(eventVenue || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const b = String(trustedName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!a || !b) return false;
  if (a === b) return true;
  // "Sanctuary Club" ↔ "Sanctuary"; "Badlands" exact
  if (a.includes(b) || b.includes(a)) return true;
  const aFirst = a.split(" ")[0];
  const bFirst = b.split(" ")[0];
  return aFirst.length >= 4 && aFirst === bFirst;
}

/**
 * When health row has no last_published_*, pick the most recent LIVE event
 * for that venue (by createdAt, then dateStart).
 */
function findLatestLiveEventForVenue(venueName: string): {
  id: number;
  title: string;
  publishedAt: string;
} | null {
  try {
    const events = storage.getEvents({ status: "LIVE" }) as Array<{
      id: number;
      title: string;
      venueName: string;
      dateStart?: string;
      createdAt?: string;
    }>;
    const matches = events.filter(e => venueNameMatches(e.venueName, venueName));
    if (!matches.length) return null;
    matches.sort((x, y) => {
      const cx = String(x.createdAt || "");
      const cy = String(y.createdAt || "");
      if (cx !== cy) return cy.localeCompare(cx);
      return String(y.dateStart || "").localeCompare(String(x.dateStart || ""));
    });
    const best = matches[0];
    const publishedAt = String(best.createdAt || best.dateStart || "").trim();
    if (!publishedAt) return null;
    return {
      id: Number(best.id),
      title: String(best.title || ""),
      publishedAt,
    };
  } catch {
    return null;
  }
}

export function getTrustedDashboard(): { venues: TrustedVenueDashboardRow[] } {
  ensureTrustedHealthTable();
  const healthById = new Map(listTrustedHealthRows().map(r => [r.sourceId, r]));

  const venues: TrustedVenueDashboardRow[] = TRUSTED_VENUES.map(def => {
    const h = healthById.get(def.sourceId);
    let lastPublishedAt = h?.lastPublishedAt ?? null;
    let lastPublishedTitle = h?.lastPublishedTitle ?? null;
    let lastPublishedEventId = h?.lastPublishedEventId ?? null;
    const fromTrustedPublish = Boolean(h?.lastPublishedAt);

    if (!lastPublishedAt) {
      const fallback = findLatestLiveEventForVenue(def.venueName);
      if (fallback) {
        lastPublishedAt = fallback.publishedAt || null;
        lastPublishedTitle = fallback.title || null;
        lastPublishedEventId = fallback.id;
      }
    }

    const lastFlyerCount = h?.lastFlyerCount ?? null;
    const flyerCoverage =
      lastFlyerCount != null && (h?.lastEventCount ?? 0) > 0
        ? lastFlyerCount / (h!.lastEventCount)
        : null;

    const health = deriveTrustedHealth({
      lastSyncAt: h?.lastSyncAt ?? null,
      lastSyncOk: h?.lastSyncOk ?? null,
      consecutiveFails: h?.consecutiveFails ?? 0,
      lastPublishedAt,
      fromTrustedPublish,
      pollHours: def.pollHours,
      lastEventCount: h?.lastEventCount ?? 0,
      flyerCoverage,
    });

    return {
      sourceId: def.sourceId,
      venueName: def.venueName,
      calendarPageUrl: def.calendarPageUrl,
      feedUrl: def.feedUrl,
      fetchMode: def.fetchMode,
      health,
      lastSyncAt: h?.lastSyncAt ?? null,
      lastSyncOk: h?.lastSyncOk ?? null,
      lastSyncError: h?.lastSyncError ?? null,
      lastEventCount: h?.lastEventCount ?? 0,
      lastFlyerCount,
      flyerCoverage,
      lastPublishedAt,
      lastPublishedTitle,
      lastPublishedEventId,
      consecutiveFails: h?.consecutiveFails ?? 0,
      pollHours: def.pollHours,
      notes: def.notes,
      publishStatus: def.publishStatus,
      address: def.address,
      neighborhood: def.neighborhood,
    };
  });

  return { venues };
}

/** Lightweight counts for optional dashboards — safe to call anytime. */
export function trustedHealthSummary() {
  const { venues } = getTrustedDashboard();
  return {
    total: venues.length,
    green: venues.filter(v => v.health === "green").length,
    yellow: venues.filter(v => v.health === "yellow").length,
    red: venues.filter(v => v.health === "red").length,
    unknown: venues.filter(v => v.health === "unknown").length,
  };
}

export { getTrustedVenue, TRUSTED_VENUES };
