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

  // candidates brands column for older DBs
  try {
    const ccols = sqlite.prepare(`PRAGMA table_info(qsearch_candidates)`).all() as Array<{ name: string }>;
    if (!ccols.some(c => c.name === "brands_json")) {
      sqlite.exec(`ALTER TABLE qsearch_candidates ADD COLUMN brands_json TEXT NOT NULL DEFAULT '[]'`);
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
      yield_status, zero_yield_streak, dragpdx_opt_in
    ) VALUES (?, ?, ?, NULL, NULL, NULL, 0, 0, ?, ?, 1, ?, ?, ?, 'unscanned', 0, 0)
    ON CONFLICT(source_id) DO UPDATE SET
      url = excluded.url,
      label = excluded.label,
      is_directory = excluded.is_directory,
      business_id = excluded.business_id,
      tier = excluded.tier,
      format = excluded.format
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
  }>,
) {
  ensureTables();
  const now = new Date().toISOString();
  const ins = sqlite.prepare(`
    INSERT OR REPLACE INTO qsearch_candidates (
      id, job_id, source_id, source_label, source_url, draft_json, selected,
      recurring, recurring_count, condensed, conflicts_json, duplicates_json, strong_dup_json,
      brands_json, status, created_at, committed_event_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL)
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
  return sqlite.prepare(sql).all(...params).map((row: any) => ({
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
    status: row.status,
    createdAt: row.created_at,
    committedEventId: row.committed_event_id,
  }));
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
