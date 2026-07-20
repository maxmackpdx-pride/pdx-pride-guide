import { sqlite } from "../storage";
import type { YieldStatus } from "../ingest/types";

export type QSearchSourceHealth = {
  sourceId: string;
  url: string;
  label: string;
  lastScanAt: string | null;
  lastOk: boolean | null;
  lastError: string | null;
  lastEventCount: number;
  consecutiveFails: number;
  isDirectory: boolean;
  firstSeenAt: string;
  isNew: boolean;
  businessId: number | null;
  tier: string;
  format: string;
  resolvedUrl: string | null;
  recipeUrl: string | null;
  winningParser: string | null;
  yieldStatus: YieldStatus;
  zeroYieldStreak: number;
  instagramHandle: string | null;
  dragpdxOptIn: boolean;
  /** Soft-removed — excluded from scans until re-enabled */
  disabled: boolean;
  /** Admin-added source (not from curated registry or directory auto) */
  isCustom: boolean;
};

export type PersistedScanJob = {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  total: number;
  completed: number;
  currentSourceId: string | null;
  currentLabel: string | null;
  etaSeconds: number | null;
  error: string | null;
  avgMs: number;
  filterJson: string;
  perSourceJson: string;
  kind: string; // manual | nightly
};

function ensureTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS qsearch_source_health (
      source_id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      label TEXT NOT NULL,
      last_scan_at TEXT,
      last_ok INTEGER,
      last_error TEXT,
      last_event_count INTEGER NOT NULL DEFAULT 0,
      consecutive_fails INTEGER NOT NULL DEFAULT 0,
      is_directory INTEGER NOT NULL DEFAULT 0,
      first_seen_at TEXT NOT NULL,
      is_new INTEGER NOT NULL DEFAULT 1,
      business_id INTEGER,
      tier TEXT NOT NULL DEFAULT '',
      format TEXT NOT NULL DEFAULT '',
      resolved_url TEXT,
      recipe_url TEXT,
      winning_parser TEXT,
      yield_status TEXT NOT NULL DEFAULT 'unscanned',
      zero_yield_streak INTEGER NOT NULL DEFAULT 0,
      instagram_handle TEXT,
      dragpdx_opt_in INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS qsearch_scan_jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      total INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      current_source_id TEXT,
      current_label TEXT,
      eta_seconds INTEGER,
      error TEXT,
      avg_ms INTEGER NOT NULL DEFAULT 2500,
      filter_json TEXT NOT NULL DEFAULT '{}',
      per_source_json TEXT NOT NULL DEFAULT '[]',
      kind TEXT NOT NULL DEFAULT 'manual'
    );

    CREATE TABLE IF NOT EXISTS qsearch_candidates (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      source_id TEXT,
      source_label TEXT,
      source_url TEXT,
      draft_json TEXT NOT NULL,
      selected INTEGER NOT NULL DEFAULT 1,
      recurring TEXT,
      recurring_count INTEGER NOT NULL DEFAULT 1,
      condensed INTEGER NOT NULL DEFAULT 0,
      conflicts_json TEXT NOT NULL DEFAULT '[]',
      duplicates_json TEXT NOT NULL DEFAULT '[]',
      strong_dup_json TEXT,
      brands_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      committed_event_id INTEGER,
      FOREIGN KEY (job_id) REFERENCES qsearch_scan_jobs(id)
    );

    CREATE INDEX IF NOT EXISTS qsearch_candidates_job ON qsearch_candidates(job_id);
    CREATE INDEX IF NOT EXISTS qsearch_candidates_status ON qsearch_candidates(status);
  `);

  // Migrations for older health table
  const cols = sqlite.prepare(`PRAGMA table_info(qsearch_source_health)`).all() as Array<{ name: string }>;
  const names = new Set(cols.map(c => c.name));
  const add = (col: string, def: string) => {
    if (!names.has(col)) {
      try {
        sqlite.exec(`ALTER TABLE qsearch_source_health ADD COLUMN ${col} ${def}`);
      } catch {
        /* ignore */
      }
    }
  };
  add("resolved_url", "TEXT");
  add("recipe_url", "TEXT");
  add("winning_parser", "TEXT");
  add("yield_status", "TEXT NOT NULL DEFAULT 'unscanned'");
  add("zero_yield_streak", "INTEGER NOT NULL DEFAULT 0");
  add("instagram_handle", "TEXT");
  add("dragpdx_opt_in", "INTEGER NOT NULL DEFAULT 0");
  add("disabled", "INTEGER NOT NULL DEFAULT 0");
  add("is_custom", "INTEGER NOT NULL DEFAULT 0");

  // candidates brands + multi-source bundle for older DBs
  try {
    const ccols = sqlite.prepare(`PRAGMA table_info(qsearch_candidates)`).all() as Array<{ name: string }>;
    if (!ccols.some(c => c.name === "brands_json")) {
      sqlite.exec(`ALTER TABLE qsearch_candidates ADD COLUMN brands_json TEXT NOT NULL DEFAULT '[]'`);
    }
    if (!ccols.some(c => c.name === "bundle_json")) {
      sqlite.exec(`ALTER TABLE qsearch_candidates ADD COLUMN bundle_json TEXT NOT NULL DEFAULT '{}'`);
    }
  } catch {
    /* ignore */
  }
}

ensureTables();

function rowToHealth(row: any): QSearchSourceHealth {
  return {
    sourceId: String(row.source_id),
    url: String(row.url || ""),
    label: String(row.label || ""),
    lastScanAt: row.last_scan_at || null,
    lastOk: row.last_ok == null ? null : Boolean(row.last_ok),
    lastError: row.last_error || null,
    lastEventCount: Number(row.last_event_count || 0),
    consecutiveFails: Number(row.consecutive_fails || 0),
    isDirectory: Boolean(row.is_directory),
    firstSeenAt: String(row.first_seen_at || ""),
    isNew: Boolean(row.is_new),
    businessId: row.business_id != null ? Number(row.business_id) : null,
    tier: String(row.tier || ""),
    format: String(row.format || ""),
    resolvedUrl: row.resolved_url || null,
    recipeUrl: row.recipe_url || null,
    winningParser: row.winning_parser || null,
    yieldStatus: (row.yield_status || "unscanned") as YieldStatus,
    zeroYieldStreak: Number(row.zero_yield_streak || 0),
    instagramHandle: row.instagram_handle || null,
    dragpdxOptIn: Boolean(row.dragpdx_opt_in),
    disabled: Boolean(row.disabled),
    isCustom: Boolean(row.is_custom),
  };
}

export function listSourceHealth(): QSearchSourceHealth[] {
  ensureTables();
  return sqlite
    .prepare(`SELECT * FROM qsearch_source_health ORDER BY label COLLATE NOCASE`)
    .all()
    .map(rowToHealth);
}

export function getSourceHealth(sourceId: string): QSearchSourceHealth | null {
  ensureTables();
  const row = sqlite.prepare(`SELECT * FROM qsearch_source_health WHERE source_id = ?`).get(sourceId);
  return row ? rowToHealth(row) : null;
}

export function syncKnownSources(
  sources: Array<{
    id: string;
    url: string;
    label: string;
    tier: string;
    format: string;
    businessId?: number;
    caution?: boolean;
  }>,
): { total: number; newlyRegistered: number } {
  ensureTables();
  const now = new Date().toISOString();
  const insert = sqlite.prepare(`
    INSERT INTO qsearch_source_health (
      source_id, url, label, last_scan_at, last_ok, last_error, last_event_count,
      consecutive_fails, is_directory, first_seen_at, is_new, business_id, tier, format,
      yield_status, zero_yield_streak, dragpdx_opt_in, disabled, is_custom
    ) VALUES (?, ?, ?, NULL, NULL, NULL, 0, 0, ?, ?, 1, ?, ?, ?, 'unscanned', 0, 0, 0, 0)
    ON CONFLICT(source_id) DO UPDATE SET
      url = CASE WHEN qsearch_source_health.is_custom = 1 THEN qsearch_source_health.url ELSE excluded.url END,
      label = CASE WHEN qsearch_source_health.is_custom = 1 THEN qsearch_source_health.label ELSE excluded.label END,
      is_directory = excluded.is_directory,
      business_id = COALESCE(excluded.business_id, qsearch_source_health.business_id),
      tier = CASE WHEN qsearch_source_health.is_custom = 1 THEN qsearch_source_health.tier ELSE excluded.tier END,
      format = CASE WHEN qsearch_source_health.is_custom = 1 THEN qsearch_source_health.format ELSE excluded.format END
  `);

  let newlyRegistered = 0;
  const tx = sqlite.transaction(() => {
    for (const s of sources) {
      // dragpdx: never auto-enable; skip unless opt-in already set
      if (s.id.includes("dragpdx") || /dragpdx\.com/i.test(s.url)) {
        const existing = getSourceHealth(s.id);
        if (!existing?.dragpdxOptIn) {
          // Still register for admin visibility with meta_only until opt-in
        }
      }
      const existing = sqlite.prepare(`SELECT source_id FROM qsearch_source_health WHERE source_id = ?`).get(s.id);
      if (!existing) newlyRegistered += 1;
      insert.run(
        s.id,
        s.url,
        s.label,
        s.tier === "directory" ? 1 : 0,
        now,
        s.businessId ?? null,
        s.tier,
        s.format,
      );
    }
  });
  tx();
  return { total: sources.length, newlyRegistered };
}

export function markAllNewSeen() {
  ensureTables();
  sqlite.prepare(`UPDATE qsearch_source_health SET is_new = 0 WHERE is_new = 1`).run();
}

export function setRecipeUrl(sourceId: string, recipeUrl: string | null) {
  ensureTables();
  sqlite
    .prepare(
      `UPDATE qsearch_source_health SET
        recipe_url = ?,
        yield_status = CASE WHEN ? IS NOT NULL THEN 'needs_recipe' ELSE yield_status END,
        zero_yield_streak = CASE WHEN ? IS NOT NULL THEN 0 ELSE zero_yield_streak END
      WHERE source_id = ?`,
    )
    .run(recipeUrl, recipeUrl, recipeUrl, sourceId);
  if (recipeUrl) {
    sqlite
      .prepare(`UPDATE qsearch_source_health SET yield_status = 'works', resolved_url = ? WHERE source_id = ?`)
      .run(recipeUrl, sourceId);
  }
}

export function setDragpdxOptIn(optIn: boolean) {
  ensureTables();
  sqlite
    .prepare(
      `UPDATE qsearch_source_health SET dragpdx_opt_in = ? WHERE source_id LIKE '%dragpdx%' OR url LIKE '%dragpdx.com%'`,
    )
    .run(optIn ? 1 : 0);
}

export function setInstagramHandle(sourceId: string, handle: string | null) {
  ensureTables();
  const clean = handle ? handle.replace(/^@/, "").trim() : null;
  sqlite.prepare(`UPDATE qsearch_source_health SET instagram_handle = ? WHERE source_id = ?`).run(clean, sourceId);
}

const ALLOWED_SOURCE_TIERS = new Set([
  "1",
  "2",
  "3",
  "agg",
  "partiful",
  "eventbrite",
  "directory",
  "custom",
]);

const ALLOWED_SOURCE_FORMATS = new Set([
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

function slugSourceId(label: string, url: string): string {
  const base = String(label || "source")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "source";
  let host = "x";
  try {
    host = new URL(url.includes("://") ? url : `https://${url}`).hostname
      .replace(/^www\./i, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .slice(0, 24);
  } catch {
    /* keep x */
  }
  const tail = Math.random().toString(36).slice(2, 7);
  return `custom-${base}-${host}-${tail}`.replace(/-+/g, "-");
}

function normalizeSourceUrl(raw: string): string | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

export type AddCustomSourceInput = {
  label: string;
  url: string;
  tier?: string;
  format?: string;
  businessId?: number | null;
};

/** Admin-added scrape URL. Survives registry sync; included in live scans. */
export function addCustomSource(input: AddCustomSourceInput): { ok: true; source: QSearchSourceHealth } | { ok: false; error: string } {
  ensureTables();
  const label = String(input.label || "").trim();
  if (!label || label.length < 2) return { ok: false, error: "Label is required (min 2 characters)" };
  const url = normalizeSourceUrl(input.url);
  if (!url) return { ok: false, error: "Valid http(s) URL is required" };

  // Dedupe by URL against active sources
  const existingSameUrl = sqlite
    .prepare(
      `SELECT * FROM qsearch_source_health WHERE lower(url) = lower(?) OR lower(COALESCE(recipe_url,'')) = lower(?) OR lower(COALESCE(resolved_url,'')) = lower(?) LIMIT 1`,
    )
    .get(url, url, url) as any;
  if (existingSameUrl) {
    const h = rowToHealth(existingSameUrl);
    if (h.disabled) {
      sqlite.prepare(`UPDATE qsearch_source_health SET disabled = 0, label = ?, is_new = 1 WHERE source_id = ?`).run(label, h.sourceId);
      const restored = getSourceHealth(h.sourceId);
      if (restored) return { ok: true, source: restored };
    }
    return { ok: false, error: `URL already registered as “${h.label}” (${h.sourceId})` };
  }

  const tier = ALLOWED_SOURCE_TIERS.has(String(input.tier || "")) ? String(input.tier) : "custom";
  const format = ALLOWED_SOURCE_FORMATS.has(String(input.format || "")) ? String(input.format) : "html";
  const businessId =
    input.businessId != null && Number.isFinite(Number(input.businessId))
      ? Number(input.businessId)
      : null;
  const sourceId = slugSourceId(label, url);
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `INSERT INTO qsearch_source_health (
        source_id, url, label, last_scan_at, last_ok, last_error, last_event_count,
        consecutive_fails, is_directory, first_seen_at, is_new, business_id, tier, format,
        yield_status, zero_yield_streak, dragpdx_opt_in, disabled, is_custom
      ) VALUES (?, ?, ?, NULL, NULL, NULL, 0, 0, 0, ?, 1, ?, ?, ?, 'unscanned', 0, 0, 0, 1)`,
    )
    .run(sourceId, url, label, now, businessId, tier, format);

  const source = getSourceHealth(sourceId);
  if (!source) return { ok: false, error: "Failed to create source" };
  return { ok: true, source };
}

/**
 * Remove a source from the active scrape list.
 * - Custom sources: hard delete
 * - Registry / directory: soft-disable (so nightly sync does not re-activate)
 */
export function deleteSource(
  sourceId: string,
): { ok: true; hard: boolean; sourceId: string } | { ok: false; error: string } {
  ensureTables();
  const existing = getSourceHealth(sourceId);
  if (!existing) return { ok: false, error: "Source not found" };

  if (existing.isCustom) {
    sqlite.prepare(`DELETE FROM qsearch_source_health WHERE source_id = ?`).run(sourceId);
    return { ok: true, hard: true, sourceId };
  }

  sqlite.prepare(`UPDATE qsearch_source_health SET disabled = 1, is_new = 0 WHERE source_id = ?`).run(sourceId);
  return { ok: true, hard: false, sourceId };
}

/** Re-enable a soft-disabled registry/directory source. */
export function enableSource(
  sourceId: string,
): { ok: true; source: QSearchSourceHealth } | { ok: false; error: string } {
  ensureTables();
  const existing = getSourceHealth(sourceId);
  if (!existing) return { ok: false, error: "Source not found" };
  sqlite.prepare(`UPDATE qsearch_source_health SET disabled = 0 WHERE source_id = ?`).run(sourceId);
  const source = getSourceHealth(sourceId);
  if (!source) return { ok: false, error: "Source not found after enable" };
  return { ok: true, source };
}

export function listDisabledSourceIds(): Set<string> {
  ensureTables();
  const rows = sqlite
    .prepare(`SELECT source_id FROM qsearch_source_health WHERE disabled = 1`)
    .all() as Array<{ source_id: string }>;
  return new Set(rows.map(r => String(r.source_id)));
}

/** Custom sources as ingest recipes for live scan merge. */
export function listCustomIngestSources(): Array<{
  id: string;
  url: string;
  label: string;
  tier: string;
  format: string;
  businessId?: number;
}> {
  ensureTables();
  const rows = sqlite
    .prepare(
      `SELECT * FROM qsearch_source_health WHERE is_custom = 1 AND disabled = 0 ORDER BY label COLLATE NOCASE`,
    )
    .all();
  return rows.map((row: any) => {
    const h = rowToHealth(row);
    return {
      id: h.sourceId,
      url: h.recipeUrl || h.url,
      label: h.label,
      tier: h.tier || "custom",
      format: h.format || "html",
      businessId: h.businessId ?? undefined,
    };
  });
}

export function recordScanResult(
  sourceId: string,
  result: {
    ok: boolean;
    eventCount: number;
    error?: string | null;
    resolvedUrl?: string | null;
    winningParser?: string | null;
    yieldStatus?: YieldStatus;
  },
) {
  ensureTables();
  const now = new Date().toISOString();
  const row = getSourceHealth(sourceId);
  if (!row) return;

  const zeroStreak =
    result.eventCount > 0 ? 0 : result.ok ? row.zeroYieldStreak + 1 : row.zeroYieldStreak;
  let yieldStatus: YieldStatus =
    result.yieldStatus ||
    (result.eventCount > 0
      ? "works"
      : result.ok
        ? zeroStreak >= 3
          ? "dead"
          : "zero_yield"
        : "discovery_needed");

  if (row.recipeUrl && result.eventCount === 0) yieldStatus = "needs_recipe";
  if (/instagram|facebook|fb\.com/i.test(row.url) && result.eventCount === 0) {
    yieldStatus = "meta_only";
  }

  const fails = result.ok && result.eventCount > 0 ? 0 : row.consecutiveFails + (result.ok ? 0 : 1);

  sqlite
    .prepare(
      `UPDATE qsearch_source_health SET
        last_scan_at = ?,
        last_ok = ?,
        last_error = ?,
        last_event_count = ?,
        consecutive_fails = ?,
        is_new = 0,
        resolved_url = COALESCE(?, resolved_url),
        winning_parser = COALESCE(?, winning_parser),
        yield_status = ?,
        zero_yield_streak = ?
      WHERE source_id = ?`,
    )
    .run(
      now,
      result.ok && result.eventCount > 0 ? 1 : result.ok ? 1 : 0,
      result.ok ? (result.eventCount > 0 ? null : "Zero yield") : (result.error || "Scan failed").slice(0, 500),
      result.eventCount,
      fails,
      result.resolvedUrl ?? null,
      result.winningParser ?? null,
      yieldStatus,
      zeroStreak,
      sourceId,
    );
}

// ── Jobs ──────────────────────────────────────────────────────────────────

export function insertScanJob(job: PersistedScanJob) {
  ensureTables();
  sqlite
    .prepare(
      `INSERT INTO qsearch_scan_jobs (
        id, status, started_at, finished_at, total, completed, current_source_id, current_label,
        eta_seconds, error, avg_ms, filter_json, per_source_json, kind
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      job.id,
      job.status,
      job.startedAt,
      job.finishedAt,
      job.total,
      job.completed,
      job.currentSourceId,
      job.currentLabel,
      job.etaSeconds,
      job.error,
      job.avgMs,
      job.filterJson,
      job.perSourceJson,
      job.kind,
    );
}

export function updateScanJob(job: Partial<PersistedScanJob> & { id: string }) {
  ensureTables();
  const cur = getScanJobRow(job.id);
  if (!cur) return;
  const next = { ...cur, ...job };
  sqlite
    .prepare(
      `UPDATE qsearch_scan_jobs SET
        status = ?, finished_at = ?, total = ?, completed = ?, current_source_id = ?,
        current_label = ?, eta_seconds = ?, error = ?, avg_ms = ?, per_source_json = ?
      WHERE id = ?`,
    )
    .run(
      next.status,
      next.finishedAt,
      next.total,
      next.completed,
      next.currentSourceId,
      next.currentLabel,
      next.etaSeconds,
      next.error,
      next.avgMs,
      next.perSourceJson,
      next.id,
    );
}

export function getScanJobRow(id: string): PersistedScanJob | null {
  ensureTables();
  const row = sqlite.prepare(`SELECT * FROM qsearch_scan_jobs WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    total: row.total,
    completed: row.completed,
    currentSourceId: row.current_source_id,
    currentLabel: row.current_label,
    etaSeconds: row.eta_seconds,
    error: row.error,
    avgMs: row.avg_ms,
    filterJson: row.filter_json,
    perSourceJson: row.per_source_json,
    kind: row.kind,
  };
}

export function getLatestScanJobRow(): PersistedScanJob | null {
  ensureTables();
  const row = sqlite
    .prepare(`SELECT * FROM qsearch_scan_jobs ORDER BY started_at DESC LIMIT 1`)
    .get() as any;
  if (!row) return null;
  return getScanJobRow(row.id);
}

export function getActiveScanJobRow(): PersistedScanJob | null {
  ensureTables();
  const row = sqlite
    .prepare(`SELECT * FROM qsearch_scan_jobs WHERE status IN ('queued','running') ORDER BY started_at DESC LIMIT 1`)
    .get() as any;
  return row ? getScanJobRow(row.id) : null;
}

export function saveCandidates(
  jobId: string,
  candidates: Array<{
    id: string;
    sourceId: string;
    sourceLabel: string;
    sourceUrl: string;
    draft: unknown;
    selected: boolean;
    recurring: string | null;
    recurringCount: number;
    condensed: boolean;
    conflicts: unknown;
    duplicates: unknown;
    strongDuplicate: unknown;
    directoryBrands?: unknown;
    sourceBundle?: unknown;
    fieldConflicts?: unknown;
    /** Series occurrence drafts for expand-on-approve */
    memberDrafts?: unknown;
  }>,
) {
  ensureTables();
  const now = new Date().toISOString();
  const ins = sqlite.prepare(`
    INSERT OR REPLACE INTO qsearch_candidates (
      id, job_id, source_id, source_label, source_url, draft_json, selected,
      recurring, recurring_count, condensed, conflicts_json, duplicates_json, strong_dup_json,
      brands_json, bundle_json, status, created_at, committed_event_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL)
  `);
  const tx = sqlite.transaction(() => {
    for (const c of candidates) {
      ins.run(
        c.id,
        jobId,
        c.sourceId,
        c.sourceLabel,
        c.sourceUrl,
        JSON.stringify(c.draft),
        c.selected ? 1 : 0,
        c.recurring,
        c.recurringCount,
        c.condensed ? 1 : 0,
        JSON.stringify(c.conflicts || []),
        JSON.stringify(c.duplicates || []),
        c.strongDuplicate ? JSON.stringify(c.strongDuplicate) : null,
        JSON.stringify(c.directoryBrands || []),
        JSON.stringify({
          sourceBundle: c.sourceBundle || [],
          fieldConflicts: c.fieldConflicts || [],
          memberDrafts: Array.isArray(c.memberDrafts) ? c.memberDrafts : [],
        }),
        now,
      );
    }
  });
  tx();
}

export function listCandidates(opts?: {
  jobId?: string;
  status?: string;
  limit?: number;
}): Array<Record<string, unknown>> {
  ensureTables();
  let sql = `SELECT * FROM qsearch_candidates WHERE 1=1`;
  const params: any[] = [];
  if (opts?.jobId) {
    sql += ` AND job_id = ?`;
    params.push(opts.jobId);
  }
  if (opts?.status) {
    sql += ` AND status = ?`;
    params.push(opts.status);
  } else if (!opts?.jobId) {
    sql += ` AND status = 'pending'`;
  }
  sql += ` ORDER BY created_at DESC`;
  if (opts?.limit) {
    sql += ` LIMIT ?`;
    params.push(opts.limit);
  }
  return sqlite.prepare(sql).all(...params).map((row: any) => {
    let bundle: {
      sourceBundle?: unknown[];
      fieldConflicts?: unknown[];
      memberDrafts?: unknown[];
    } = {};
    try {
      bundle = JSON.parse(row.bundle_json || "{}") || {};
    } catch {
      bundle = {};
    }
    return {
      id: row.id,
      jobId: row.job_id,
      sourceId: row.source_id,
      sourceLabel: row.source_label,
      sourceUrl: row.source_url,
      draft: JSON.parse(row.draft_json),
      selected: Boolean(row.selected),
      recurring: row.recurring,
      recurringCount: row.recurring_count,
      condensed: Boolean(row.condensed),
      conflicts: JSON.parse(row.conflicts_json || "[]"),
      duplicates: JSON.parse(row.duplicates_json || "[]"),
      strongDuplicate: row.strong_dup_json ? JSON.parse(row.strong_dup_json) : null,
      directoryBrands: JSON.parse(row.brands_json || "[]"),
      sourceBundle: Array.isArray(bundle.sourceBundle) ? bundle.sourceBundle : [],
      fieldConflicts: Array.isArray(bundle.fieldConflicts) ? bundle.fieldConflicts : [],
      memberDrafts: Array.isArray(bundle.memberDrafts) ? bundle.memberDrafts : [],
      status: row.status,
      createdAt: row.created_at,
      committedEventId: row.committed_event_id,
    };
  });
}

export function markCandidatesCommitted(ids: string[], eventIds: number[]) {
  ensureTables();
  const stmt = sqlite.prepare(
    `UPDATE qsearch_candidates SET status = 'committed', committed_event_id = ? WHERE id = ?`,
  );
  const tx = sqlite.transaction(() => {
    ids.forEach((id, i) => {
      stmt.run(eventIds[i] ?? null, id);
    });
  });
  tx();
}

export function markCandidatesSkipped(ids: string[]) {
  ensureTables();
  const stmt = sqlite.prepare(`UPDATE qsearch_candidates SET status = 'skipped' WHERE id = ?`);
  const tx = sqlite.transaction(() => {
    for (const id of ids) stmt.run(id);
  });
  tx();
}

/**
 * Clear review queue candidates.
 * - scope "last": pending rows from the most recent finished scan job
 * - scope "all": every pending candidate (full queue wipe)
 * Soft-skips by default; hard=true deletes rows.
 */
export function clearScanQueue(opts?: {
  scope?: "last" | "all";
  hard?: boolean;
}): { ok: true; cleared: number; scope: "last" | "all"; jobId: string | null; hard: boolean } {
  ensureTables();
  const scope = opts?.scope === "all" ? "all" : "last";
  const hard = Boolean(opts?.hard);

  let jobId: string | null = null;
  let cleared = 0;

  if (scope === "last") {
    const job = sqlite
      .prepare(
        `SELECT id FROM qsearch_scan_jobs WHERE status IN ('done','cancelled','failed') ORDER BY started_at DESC LIMIT 1`,
      )
      .get() as { id: string } | undefined;
    // Fall back to absolute latest job if nothing finished yet
    const fallback = sqlite
      .prepare(`SELECT id FROM qsearch_scan_jobs ORDER BY started_at DESC LIMIT 1`)
      .get() as { id: string } | undefined;
    jobId = job?.id || fallback?.id || null;
    if (!jobId) {
      return { ok: true, cleared: 0, scope, jobId: null, hard };
    }
    if (hard) {
      const r = sqlite
        .prepare(`DELETE FROM qsearch_candidates WHERE job_id = ? AND status = 'pending'`)
        .run(jobId);
      cleared = Number(r.changes || 0);
    } else {
      const r = sqlite
        .prepare(`UPDATE qsearch_candidates SET status = 'skipped' WHERE job_id = ? AND status = 'pending'`)
        .run(jobId);
      cleared = Number(r.changes || 0);
    }
  } else {
    if (hard) {
      const r = sqlite.prepare(`DELETE FROM qsearch_candidates WHERE status = 'pending'`).run();
      cleared = Number(r.changes || 0);
    } else {
      const r = sqlite
        .prepare(`UPDATE qsearch_candidates SET status = 'skipped' WHERE status = 'pending'`)
        .run();
      cleared = Number(r.changes || 0);
    }
  }

  return { ok: true, cleared, scope, jobId, hard };
}

export function reviewQueueSummary() {
  ensureTables();
  const pending = sqlite
    .prepare(`SELECT COUNT(*) AS c FROM qsearch_candidates WHERE status = 'pending'`)
    .get() as any;
  const failing = sqlite
    .prepare(
      `SELECT COUNT(*) AS c FROM qsearch_source_health WHERE last_ok = 0 OR yield_status IN ('dead','zero_yield','discovery_needed')`,
    )
    .get() as any;
  const conflicts = sqlite
    .prepare(
      `SELECT COUNT(*) AS c FROM qsearch_candidates WHERE status = 'pending' AND conflicts_json != '[]'`,
    )
    .get() as any;
  return {
    pendingCandidates: Number(pending?.c || 0),
    failingSources: Number(failing?.c || 0),
    conflictCandidates: Number(conflicts?.c || 0),
  };
}
