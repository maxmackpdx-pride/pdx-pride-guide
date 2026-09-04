import { createHash, randomUUID } from "node:crypto";
import { sqlite, storage } from "./storage";

type JsonObject = Record<string, unknown>;

function nowIso() {
  return new Date().toISOString();
}

function json(value: unknown) {
  return JSON.stringify(value ?? null);
}

function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return JSON.parse(String(value ?? "")) as T;
  } catch {
    return fallback;
  }
}

function safeUrl(raw: unknown): string | null {
  try {
    const url = new URL(String(raw || "").trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function key(raw: unknown, max = 160): string {
  return String(raw || "").trim().toLowerCase().replace(/[^a-z0-9:_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max);
}

const EVENT_EVIDENCE_FIELDS = [
  "title",
  "description",
  "venueName",
  "address",
  "neighborhood",
  "lat",
  "lng",
  "dateStart",
  "dateEnd",
  "ageRequirement",
  "admission",
  "ticketUrl",
  "posterImageUrl",
  "eventTypes",
  "status",
  "isPublic",
  "isHouseParty",
  "isSexPositive",
  "nudityOk",
] as const;

const EVENT_EVIDENCE_FIELD_BY_FOLDED = new Map(
  EVENT_EVIDENCE_FIELDS.map(field => [field.toLowerCase(), field]),
);

/** Keep real event-property casing while retaining normalized custom keys. */
function evidenceField(raw: unknown): string {
  const value = String(raw || "").trim().slice(0, 120);
  if (!value) return "";
  const folded = value.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return EVENT_EVIDENCE_FIELD_BY_FOLDED.get(folded) || key(value, 120);
}

export function ensureEventResearchControlTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agent_research_runs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      coverage_window_hours INTEGER NOT NULL DEFAULT 48,
      sources_due INTEGER NOT NULL DEFAULT 0,
      sources_checked INTEGER NOT NULL DEFAULT 0,
      sources_succeeded INTEGER NOT NULL DEFAULT 0,
      sources_blocked INTEGER NOT NULL DEFAULT 0,
      events_audited INTEGER NOT NULL DEFAULT 0,
      summary_json TEXT,
      regression_json TEXT
    );
    CREATE TABLE IF NOT EXISTS agent_research_run_sources (
      run_id TEXT NOT NULL,
      source_key TEXT NOT NULL,
      url TEXT NOT NULL,
      due_at_start INTEGER NOT NULL DEFAULT 1,
      checked_at TEXT,
      outcome TEXT,
      PRIMARY KEY (run_id, source_key, url)
    );
    CREATE TABLE IF NOT EXISTS agent_field_evidence (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      event_id INTEGER,
      entity_key TEXT,
      field TEXT NOT NULL,
      observed_value_json TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_owner TEXT,
      evidence_type TEXT NOT NULL,
      authority_level TEXT NOT NULL,
      checked_at TEXT NOT NULL,
      excerpt TEXT,
      conflict_state TEXT NOT NULL DEFAULT 'clear',
      supersedes_id TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS agent_field_evidence_lookup
      ON agent_field_evidence(event_id, entity_key, field, checked_at DESC);
    CREATE TABLE IF NOT EXISTS agent_entity_identities (
      entity_key TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      canonical_name TEXT NOT NULL,
      aliases_json TEXT NOT NULL,
      anchors_json TEXT NOT NULL,
      official_urls_json TEXT NOT NULL,
      classification TEXT,
      scope_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      evidence_url TEXT NOT NULL,
      merge_history_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS agent_event_conflicts (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      event_id INTEGER,
      field TEXT NOT NULL,
      values_json TEXT NOT NULL,
      receipt_ids_json TEXT NOT NULL,
      material INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'open',
      recommended_action TEXT,
      next_check_at TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      resolution TEXT
    );
    CREATE INDEX IF NOT EXISTS agent_event_conflicts_open
      ON agent_event_conflicts(status, event_id, field);
    CREATE TABLE IF NOT EXISTS agent_review_queue (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      event_id INTEGER,
      candidate_key TEXT,
      reason_code TEXT NOT NULL,
      detail TEXT NOT NULL,
      missing_evidence_json TEXT NOT NULL,
      evidence_urls_json TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'open',
      next_check_at TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      resolution TEXT
    );
    CREATE INDEX IF NOT EXISTS agent_review_queue_open
      ON agent_review_queue(status, priority, created_at);
    CREATE TABLE IF NOT EXISTS agent_media_provenance (
      fingerprint TEXT PRIMARY KEY,
      perceptual_hash TEXT,
      event_id INTEGER,
      series_key TEXT,
      occurrence_date TEXT,
      source_url TEXT NOT NULL,
      media_url TEXT NOT NULL,
      ocr_text TEXT,
      classification TEXT NOT NULL,
      exact_event_match INTEGER NOT NULL DEFAULT 0,
      first_seen_at TEXT NOT NULL,
      last_verified_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS agent_media_event
      ON agent_media_provenance(event_id, occurrence_date);
    CREATE TABLE IF NOT EXISTS agent_mistake_tests (
      test_key TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      misleading_input_json TEXT NOT NULL,
      evidence_json TEXT NOT NULL,
      expected_json TEXT NOT NULL,
      forbidden_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_run_at TEXT,
      last_result TEXT
    );
    CREATE TABLE IF NOT EXISTS agent_event_series (
      series_key TEXT PRIMARY KEY,
      canonical_title TEXT NOT NULL,
      venue_entity_key TEXT,
      recurrence_rule TEXT,
      official_url TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      exception_dates_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS agent_event_occurrences (
      series_key TEXT NOT NULL,
      event_id INTEGER,
      occurrence_date TEXT NOT NULL,
      status TEXT NOT NULL,
      exact_art_fingerprint TEXT,
      evidence_url TEXT NOT NULL,
      checked_at TEXT NOT NULL,
      PRIMARY KEY (series_key, occurrence_date)
    );
    CREATE TABLE IF NOT EXISTS agent_decision_outcomes (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      event_id INTEGER,
      decision TEXT NOT NULL,
      outcome TEXT NOT NULL,
      reason TEXT NOT NULL,
      source_authority TEXT NOT NULL,
      regression_candidate INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS agent_mutation_idempotency (
      idempotency_key TEXT PRIMARY KEY,
      operation TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function learnedSources() {
  ensureEventResearchControlTables();
  try {
    const columns = sqlite.prepare("PRAGMA table_info(agent_event_source_paths)").all() as Array<{ name: string }>;
    if (!columns.some(column => column.name === "check_interval_hours")) {
      sqlite.exec("ALTER TABLE agent_event_source_paths ADD COLUMN check_interval_hours INTEGER NOT NULL DEFAULT 48");
    }
    if (!columns.some(column => column.name === "volatility")) {
      sqlite.exec("ALTER TABLE agent_event_source_paths ADD COLUMN volatility TEXT NOT NULL DEFAULT 'normal'");
    }
    if (!columns.some(column => column.name === "next_check_at")) {
      sqlite.exec("ALTER TABLE agent_event_source_paths ADD COLUMN next_check_at TEXT");
    }
    return sqlite.prepare(`
      SELECT source_key, url, status, last_checked_at, check_interval_hours, volatility, next_check_at
      FROM agent_event_source_paths
      WHERE status != 'candidate'
    `).all() as Array<{ source_key: string; url: string; status: string; last_checked_at: string | null; check_interval_hours: number; volatility: string; next_check_at: string | null }>;
  } catch {
    return [];
  }
}

export function beginResearchRun(input: { coverageWindowHours?: number } = {}) {
  ensureEventResearchControlTables();
  const active = sqlite.prepare(`
    SELECT id, started_at FROM agent_research_runs
    WHERE status = 'running' AND started_at >= ?
    ORDER BY started_at DESC LIMIT 1
  `).get(new Date(Date.now() - 6 * 3600_000).toISOString()) as { id: string; started_at: string } | undefined;
  if (active) {
    return { ok: false as const, status: 409, error: "a QSearch research run is already active", runId: active.id, startedAt: active.started_at };
  }
  const id = randomUUID();
  const startedAt = nowIso();
  const hours = Math.min(168, Math.max(6, Math.floor(Number(input.coverageWindowHours) || 48)));
  const cutoff = Date.now() - hours * 3600_000;
  const sources = learnedSources();
  const due = sources.filter(source => {
    if (source.next_check_at) return Date.parse(source.next_check_at) <= Date.now();
    const interval = Math.min(hours, Math.max(1, Number(source.check_interval_hours) || hours));
    return !source.last_checked_at || Date.parse(source.last_checked_at) <= Date.now() - interval * 3600_000 || Date.parse(source.last_checked_at) <= cutoff;
  });
  const transaction = sqlite.transaction(() => {
    sqlite.prepare(`
      INSERT INTO agent_research_runs (id, status, started_at, coverage_window_hours, sources_due)
      VALUES (?, 'running', ?, ?, ?)
    `).run(id, startedAt, hours, due.length);
    const insert = sqlite.prepare(`
      INSERT INTO agent_research_run_sources (run_id, source_key, url, due_at_start)
      VALUES (?, ?, ?, 1)
    `);
    for (const source of due) insert.run(id, source.source_key, source.url);
  });
  transaction();
  return { ok: true as const, runId: id, startedAt, coverageWindowHours: hours, sourcesDue: due.length, dueSources: due };
}

export function markRunSource(input: { runId: string; sourceKey: string; url: string; outcome: string }) {
  ensureEventResearchControlTables();
  const run = sqlite.prepare(`SELECT status FROM agent_research_runs WHERE id = ?`).get(input.runId) as { status?: string } | undefined;
  if (!run) return { ok: false as const, status: 404, error: "research run not found" };
  if (run.status !== "running") return { ok: false as const, status: 409, error: "research run is not active" };
  const sourceKey = key(input.sourceKey, 120);
  const url = safeUrl(input.url);
  const outcome = String(input.outcome || "").toLowerCase();
  if (!sourceKey || !url || !["success", "failure", "blocked", "signed_out", "skipped"].includes(outcome)) {
    return { ok: false as const, status: 400, error: "run source requires sourceKey, safe URL, and valid outcome" };
  }
  sqlite.prepare(`
    INSERT INTO agent_research_run_sources (run_id, source_key, url, due_at_start, checked_at, outcome)
    VALUES (?, ?, ?, 0, ?, ?)
    ON CONFLICT(run_id, source_key, url) DO UPDATE SET checked_at = excluded.checked_at, outcome = excluded.outcome
  `).run(input.runId, sourceKey, url, nowIso(), outcome);
  const source = learnedSources().find(item => item.source_key === sourceKey && item.url === url);
  if (source) {
    const normalHours = Math.max(1, Number(source.check_interval_hours) || 48);
    const nextHours = outcome === "success" ? normalHours : Math.min(168, Math.max(6, normalHours / 2));
    sqlite.prepare(`
      UPDATE agent_event_source_paths SET next_check_at = ? WHERE source_key = ? AND url = ?
    `).run(new Date(Date.now() + nextHours * 3600_000).toISOString(), sourceKey, url);
  }
  return { ok: true as const };
}

export function setSourceSchedule(input: {
  sourceKey: string;
  url: string;
  checkIntervalHours: number;
  volatility?: string;
}) {
  const sources = learnedSources();
  const sourceKey = key(input.sourceKey, 120);
  const url = safeUrl(input.url);
  const hours = Math.min(720, Math.max(1, Math.floor(Number(input.checkIntervalHours) || 48)));
  const volatility = ["low", "normal", "high", "critical"].includes(input.volatility || "") ? input.volatility! : "normal";
  if (!sourceKey || !url || !sources.some(item => item.source_key === sourceKey && item.url === url)) {
    return { ok: false as const, status: 404, error: "learned source path not found" };
  }
  sqlite.prepare(`
    UPDATE agent_event_source_paths
    SET check_interval_hours = ?, volatility = ?, next_check_at = ?
    WHERE source_key = ? AND url = ?
  `).run(hours, volatility, new Date(Date.now() + hours * 3600_000).toISOString(), sourceKey, url);
  return { ok: true as const, sourceKey, url, checkIntervalHours: hours, volatility };
}

export function finishResearchRun(input: {
  runId: string;
  eventsAudited?: number;
  summary?: JsonObject;
  regression?: JsonObject;
}) {
  ensureEventResearchControlTables();
  const rows = sqlite.prepare(`SELECT due_at_start, checked_at, outcome FROM agent_research_run_sources WHERE run_id = ?`).all(input.runId) as Array<any>;
  const due = rows.filter(row => row.due_at_start).length;
  const checked = rows.filter(row => row.checked_at).length;
  const dueChecked = rows.filter(row => row.due_at_start && row.checked_at).length;
  const succeeded = rows.filter(row => row.outcome === "success").length;
  const blocked = rows.filter(row => ["failure", "blocked", "signed_out", "skipped"].includes(row.outcome)).length;
  const result = sqlite.prepare(`
    UPDATE agent_research_runs
    SET status = 'complete', finished_at = ?, sources_checked = ?, sources_succeeded = ?,
        sources_blocked = ?, events_audited = ?, summary_json = ?, regression_json = ?
    WHERE id = ? AND status = 'running'
  `).run(nowIso(), checked, succeeded, blocked, Math.max(0, Number(input.eventsAudited) || 0), json(input.summary || {}), json(input.regression || {}), input.runId);
  if (!result.changes) return { ok: false as const, status: 409, error: "research run is missing or already finished" };
  return {
    ok: true as const,
    runId: input.runId,
    coverage: { due, checked, dueChecked, succeeded, blocked, percent: due ? Math.round((dueChecked / due) * 1000) / 10 : 100 },
  };
}

export function recordFieldEvidence(input: {
  runId?: string | null;
  eventId?: number | null;
  entityKey?: string | null;
  field: string;
  observedValue: unknown;
  sourceUrl: string;
  sourceOwner?: string | null;
  evidenceType?: string;
  authorityLevel?: string;
  checkedAt: string;
  excerpt?: string | null;
  supersedesId?: string | null;
}) {
  ensureEventResearchControlTables();
  const field = evidenceField(input.field);
  const sourceUrl = safeUrl(input.sourceUrl);
  const checked = Date.parse(input.checkedAt);
  if (!field || !sourceUrl || !Number.isFinite(checked)) {
    return { ok: false as const, status: 400, error: "evidence requires field, safe sourceUrl, and checkedAt" };
  }
  if (!input.eventId && !input.entityKey) {
    return { ok: false as const, status: 400, error: "evidence requires eventId or entityKey" };
  }
  if (checked > Date.now() + 10 * 60_000) {
    return { ok: false as const, status: 400, error: "evidence checkedAt cannot be future-dated" };
  }
  if (input.runId) {
    const run = sqlite.prepare(`SELECT id FROM agent_research_runs WHERE id = ?`).get(input.runId);
    if (!run) return { ok: false as const, status: 404, error: "evidence runId was not found" };
  }
  const id = randomUUID();
  sqlite.prepare(`
    INSERT INTO agent_field_evidence (
      id, run_id, event_id, entity_key, field, observed_value_json, source_url,
      source_owner, evidence_type, authority_level, checked_at, excerpt,
      supersedes_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, input.runId || null, input.eventId || null, input.entityKey ? key(input.entityKey) : null,
    field, json(input.observedValue), sourceUrl,
    String(input.sourceOwner || "").trim().slice(0, 200) || null,
    key(input.evidenceType || "official", 80) || "official",
    key(input.authorityLevel || "primary", 80) || "primary",
    new Date(checked).toISOString(), String(input.excerpt || "").trim().slice(0, 1000) || null,
    input.supersedesId || null, nowIso(),
  );
  return { ok: true as const, receiptId: id };
}

export function persistMutationEvidence(input: {
  runId?: string | null;
  eventId: number;
  values: Record<string, unknown>;
  receipts: Array<{ field: string; sourceUrl: string; checkedAt: string; note?: string | null }>;
}) {
  const ids: string[] = [];
  for (const receipt of input.receipts) {
    const saved = recordFieldEvidence({
      runId: input.runId,
      eventId: input.eventId,
      field: receipt.field,
      observedValue: input.values[receipt.field],
      sourceUrl: receipt.sourceUrl,
      evidenceType: "mutation_receipt",
      authorityLevel: "primary",
      checkedAt: receipt.checkedAt,
      excerpt: receipt.note,
    });
    if (!saved.ok) throw new Error(saved.error);
    ids.push(saved.receiptId);
  }
  return ids;
}

export function upsertEntityIdentity(input: {
  entityKey: string;
  entityType: string;
  canonicalName: string;
  aliases?: string[];
  anchors?: JsonObject;
  officialUrls?: string[];
  classification?: string | null;
  scope?: JsonObject;
  status?: string;
  evidenceUrl: string;
  expectedUpdatedAt?: string | null;
}) {
  ensureEventResearchControlTables();
  const entityKey = key(input.entityKey);
  const evidenceUrl = safeUrl(input.evidenceUrl);
  const canonicalName = String(input.canonicalName || "").trim().slice(0, 240);
  if (!entityKey || !canonicalName || !evidenceUrl) return { ok: false as const, status: 400, error: "identity requires entityKey, canonicalName, and evidenceUrl" };
  const existing = sqlite.prepare(`
    SELECT canonical_name, anchors_json, updated_at FROM agent_entity_identities WHERE entity_key = ?
  `).get(entityKey) as { canonical_name: string; anchors_json: string; updated_at: string } | undefined;
  if (existing) {
    const identityChanged = existing.canonical_name !== canonicalName || existing.anchors_json !== json(input.anchors || {});
    if (identityChanged && input.expectedUpdatedAt !== existing.updated_at) {
      return { ok: false as const, status: 409, error: "canonical identity changed; reload and provide expectedUpdatedAt" };
    }
  }
  const officialUrls = (input.officialUrls || []).map(safeUrl).filter((url): url is string => Boolean(url));
  const now = nowIso();
  sqlite.prepare(`
    INSERT INTO agent_entity_identities (
      entity_key, entity_type, canonical_name, aliases_json, anchors_json,
      official_urls_json, classification, scope_json, status, evidence_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(entity_key) DO UPDATE SET
      entity_type = excluded.entity_type, canonical_name = excluded.canonical_name,
      aliases_json = excluded.aliases_json, anchors_json = excluded.anchors_json,
      official_urls_json = excluded.official_urls_json, classification = excluded.classification,
      scope_json = excluded.scope_json, status = excluded.status,
      evidence_url = excluded.evidence_url, updated_at = excluded.updated_at
  `).run(entityKey, key(input.entityType, 80) || "venue", canonicalName, json(input.aliases || []), json(input.anchors || {}), json(officialUrls), input.classification || null, json(input.scope || {}), input.status || "active", evidenceUrl, now, now);
  return { ok: true as const, entityKey };
}

export function recordConflict(input: {
  runId?: string | null;
  eventId?: number | null;
  field: string;
  values: unknown[];
  receiptIds?: string[];
  material?: boolean;
  recommendedAction?: string | null;
  nextCheckAt?: string | null;
}) {
  ensureEventResearchControlTables();
  const field = evidenceField(input.field);
  if (!field || !Array.isArray(input.values) || input.values.length < 2) return { ok: false as const, status: 400, error: "conflict requires a field and at least two values" };
  const id = randomUUID();
  sqlite.prepare(`
    INSERT INTO agent_event_conflicts (
      id, run_id, event_id, field, values_json, receipt_ids_json, material,
      recommended_action, next_check_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.runId || null, input.eventId || null, field, json(input.values), json(input.receiptIds || []), input.material === false ? 0 : 1, String(input.recommendedAction || "").slice(0, 1000) || null, input.nextCheckAt || null, nowIso());
  return { ok: true as const, conflictId: id };
}

export function enqueueResearchReview(input: {
  runId?: string | null;
  eventId?: number | null;
  candidateKey?: string | null;
  reasonCode: string;
  detail: string;
  missingEvidence?: string[];
  evidenceUrls?: string[];
  priority?: string;
  nextCheckAt?: string | null;
}) {
  ensureEventResearchControlTables();
  const reason = key(input.reasonCode, 100);
  const detail = String(input.detail || "").trim().slice(0, 2000);
  if (!reason || !detail) return { ok: false as const, status: 400, error: "review item requires reasonCode and detail" };
  const id = randomUUID();
  const urls = (input.evidenceUrls || []).map(safeUrl).filter((url): url is string => Boolean(url));
  sqlite.prepare(`
    INSERT INTO agent_review_queue (
      id, run_id, event_id, candidate_key, reason_code, detail, missing_evidence_json,
      evidence_urls_json, priority, next_check_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.runId || null, input.eventId || null, input.candidateKey ? key(input.candidateKey) : null, reason, detail, json(input.missingEvidence || []), json(urls), ["low", "normal", "high", "urgent"].includes(input.priority || "") ? input.priority : "normal", input.nextCheckAt || null, nowIso());
  return { ok: true as const, reviewId: id };
}

export function recordMediaProvenance(input: {
  fingerprint?: string | null;
  perceptualHash?: string | null;
  eventId?: number | null;
  seriesKey?: string | null;
  occurrenceDate?: string | null;
  sourceUrl: string;
  mediaUrl: string;
  ocrText?: string | null;
  classification: string;
  exactEventMatch?: boolean;
}) {
  ensureEventResearchControlTables();
  const sourceUrl = safeUrl(input.sourceUrl);
  const mediaUrl = safeUrl(input.mediaUrl);
  if (!sourceUrl || !mediaUrl) return { ok: false as const, status: 400, error: "media provenance requires safe source and media URLs" };
  const fingerprint = key(input.fingerprint, 160) || createHash("sha256").update(mediaUrl).digest("hex");
  const now = nowIso();
  sqlite.prepare(`
    INSERT INTO agent_media_provenance (
      fingerprint, perceptual_hash, event_id, series_key, occurrence_date, source_url,
      media_url, ocr_text, classification, exact_event_match, first_seen_at, last_verified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(fingerprint) DO UPDATE SET
      perceptual_hash = COALESCE(excluded.perceptual_hash, agent_media_provenance.perceptual_hash),
      event_id = COALESCE(excluded.event_id, agent_media_provenance.event_id),
      series_key = COALESCE(excluded.series_key, agent_media_provenance.series_key),
      occurrence_date = COALESCE(excluded.occurrence_date, agent_media_provenance.occurrence_date),
      source_url = excluded.source_url, media_url = excluded.media_url,
      ocr_text = COALESCE(excluded.ocr_text, agent_media_provenance.ocr_text),
      classification = excluded.classification, exact_event_match = excluded.exact_event_match,
      last_verified_at = excluded.last_verified_at
  `).run(fingerprint, input.perceptualHash || null, input.eventId || null, input.seriesKey ? key(input.seriesKey) : null, input.occurrenceDate || null, sourceUrl, mediaUrl, String(input.ocrText || "").slice(0, 4000) || null, key(input.classification, 80) || "unknown", input.exactEventMatch ? 1 : 0, now, now);
  return { ok: true as const, fingerprint };
}

export function upsertMistakeTest(input: {
  testKey: string;
  title: string;
  misleadingInput: unknown;
  evidence: unknown;
  expected: unknown;
  forbidden: unknown;
}) {
  ensureEventResearchControlTables();
  const testKey = key(input.testKey);
  const title = String(input.title || "").trim().slice(0, 240);
  if (!testKey || !title) return { ok: false as const, status: 400, error: "mistake test requires testKey and title" };
  const now = nowIso();
  sqlite.prepare(`
    INSERT INTO agent_mistake_tests (
      test_key, title, misleading_input_json, evidence_json, expected_json,
      forbidden_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(test_key) DO UPDATE SET title = excluded.title,
      misleading_input_json = excluded.misleading_input_json,
      evidence_json = excluded.evidence_json, expected_json = excluded.expected_json,
      forbidden_json = excluded.forbidden_json, updated_at = excluded.updated_at
  `).run(testKey, title, json(input.misleadingInput), json(input.evidence), json(input.expected), json(input.forbidden), now, now);
  return { ok: true as const, testKey };
}

export function recordMistakeTestResult(input: { testKey: string; passed: boolean; detail?: string | null }) {
  ensureEventResearchControlTables();
  const testKey = key(input.testKey);
  const result = sqlite.prepare(`
    UPDATE agent_mistake_tests SET last_run_at = ?, last_result = ? WHERE test_key = ? AND status = 'active'
  `).run(nowIso(), input.passed ? "passed" : `failed:${String(input.detail || "").slice(0, 500)}`, testKey);
  if (!result.changes) return { ok: false as const, status: 404, error: "mistake test not found" };
  return { ok: true as const, testKey, passed: input.passed };
}

export function evaluateDecisionGate(input: {
  eventId: number;
  fields: string[];
  requireIndependentVerification?: boolean;
  runId?: string | null;
  proposedValues?: Record<string, unknown>;
}) {
  ensureEventResearchControlTables();
  const eventId = Number(input.eventId);
  const fields = [...new Set((input.fields || []).map(field => evidenceField(field)).filter(Boolean))];
  if (!Number.isInteger(eventId) || eventId <= 0 || !fields.length) {
    return { ok: false as const, status: 400, error: "decision gate requires eventId and fields" };
  }
  const cutoff = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  const evidence = (sqlite.prepare(`
    SELECT id, field, source_url, authority_level, checked_at, observed_value_json
    FROM agent_field_evidence
    WHERE event_id = ? AND checked_at >= ?
    ORDER BY checked_at DESC
  `).all(eventId, cutoff) as Array<any>).map(item => ({ ...item, field: evidenceField(item.field) }));
  const conflicts = (sqlite.prepare(`
    SELECT id, field FROM agent_event_conflicts
    WHERE event_id = ? AND status = 'open' AND material = 1
  `).all(eventId) as Array<any>).map(item => ({ ...item, field: evidenceField(item.field) }));
  const missing = fields.filter(field => !evidence.some(item => item.field === field));
  const event = storage.getEvent(eventId) as Record<string, unknown> | undefined;
  if (!event) return { ok: false as const, status: 404, error: "event not found" };
  const expectedValues = { ...event, ...(input.proposedValues || {}) };
  const mismatched = fields.filter(field => {
    const fieldEvidence = evidence.filter(item => item.field === field);
    return fieldEvidence.length > 0 && !fieldEvidence.some(item => JSON.stringify(parseJson(item.observed_value_json, null)) === JSON.stringify(expectedValues[field]));
  });
  const conflicted = fields.filter(field => conflicts.some(item => item.field === field));
  const insufficientIndependent = input.requireIndependentVerification
    ? fields.filter(field => new Set(evidence.filter(item => item.field === field).map(item => item.source_url)).size < 2)
    : [];
  const testCutoff = input.runId
    ? (sqlite.prepare(`SELECT started_at FROM agent_research_runs WHERE id = ?`).get(input.runId) as { started_at?: string } | undefined)?.started_at
    : new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const failedTests = sqlite.prepare(`
    SELECT test_key FROM agent_mistake_tests
    WHERE status = 'active' AND (last_result IS NULL OR last_result != 'passed' OR last_run_at < ?)
  `).all(testCutoff || nowIso()) as Array<{ test_key: string }>;
  const publishable = !missing.length && !mismatched.length && !conflicted.length && !insufficientIndependent.length && !failedTests.length;
  return {
    ok: true as const,
    decision: publishable ? "approved" : conflicted.length ? "review" : "blocked",
    publishable,
    missingEvidence: missing,
    mismatchedEvidence: mismatched,
    materialConflicts: conflicted,
    insufficientIndependentVerification: insufficientIndependent,
    unpassedMistakeTests: failedTests.map(item => item.test_key),
    evidenceReceiptIds: evidence.filter(item => fields.includes(item.field)).map(item => item.id),
  };
}

export function upsertEventSeries(input: {
  seriesKey: string;
  canonicalTitle: string;
  venueEntityKey?: string | null;
  recurrenceRule?: string | null;
  officialUrl: string;
  active?: boolean;
  exceptionDates?: string[];
  occurrence?: { eventId?: number | null; date: string; status: string; exactArtFingerprint?: string | null; evidenceUrl: string; checkedAt: string };
}) {
  ensureEventResearchControlTables();
  const seriesKey = key(input.seriesKey);
  const title = String(input.canonicalTitle || "").trim().slice(0, 240);
  const officialUrl = safeUrl(input.officialUrl);
  if (!seriesKey || !title || !officialUrl) return { ok: false as const, status: 400, error: "series requires key, canonical title, and official URL" };
  const now = nowIso();
  const transaction = sqlite.transaction(() => {
    sqlite.prepare(`
      INSERT INTO agent_event_series (
        series_key, canonical_title, venue_entity_key, recurrence_rule, official_url,
        active, exception_dates_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(series_key) DO UPDATE SET canonical_title = excluded.canonical_title,
        venue_entity_key = excluded.venue_entity_key, recurrence_rule = excluded.recurrence_rule,
        official_url = excluded.official_url, active = excluded.active,
        exception_dates_json = excluded.exception_dates_json, updated_at = excluded.updated_at
    `).run(seriesKey, title, input.venueEntityKey ? key(input.venueEntityKey) : null, String(input.recurrenceRule || "").slice(0, 500) || null, officialUrl, input.active === false ? 0 : 1, json(input.exceptionDates || []), now, now);
    if (input.occurrence) {
      const evidenceUrl = safeUrl(input.occurrence.evidenceUrl);
      if (!evidenceUrl || !/^\d{4}-\d{2}-\d{2}$/.test(input.occurrence.date)) throw new Error("occurrence requires date and evidence URL");
      sqlite.prepare(`
        INSERT INTO agent_event_occurrences (
          series_key, event_id, occurrence_date, status, exact_art_fingerprint, evidence_url, checked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(series_key, occurrence_date) DO UPDATE SET event_id = excluded.event_id,
          status = excluded.status, exact_art_fingerprint = excluded.exact_art_fingerprint,
          evidence_url = excluded.evidence_url, checked_at = excluded.checked_at
      `).run(seriesKey, input.occurrence.eventId || null, input.occurrence.date, key(input.occurrence.status, 80) || "confirmed", input.occurrence.exactArtFingerprint || null, evidenceUrl, input.occurrence.checkedAt);
    }
  });
  try {
    transaction();
    return { ok: true as const, seriesKey };
  } catch (error) {
    return { ok: false as const, status: 400, error: error instanceof Error ? error.message : "series update failed" };
  }
}

export function recordDecisionOutcome(input: {
  runId?: string | null;
  eventId?: number | null;
  decision: string;
  outcome: string;
  reason: string;
  sourceAuthority?: string;
  regressionCandidate?: boolean;
}) {
  ensureEventResearchControlTables();
  const decision = key(input.decision, 80);
  const outcome = key(input.outcome, 80);
  const reason = String(input.reason || "").trim().slice(0, 2000);
  if (!decision || !outcome || !reason) return { ok: false as const, status: 400, error: "outcome requires decision, outcome, and reason" };
  const id = randomUUID();
  sqlite.prepare(`
    INSERT INTO agent_decision_outcomes (
      id, run_id, event_id, decision, outcome, reason, source_authority,
      regression_candidate, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.runId || null, input.eventId || null, decision, outcome, reason, key(input.sourceAuthority || "agent_observation", 80) || "agent_observation", input.regressionCandidate ? 1 : 0, nowIso());
  return { ok: true as const, outcomeId: id, regressionCandidate: Boolean(input.regressionCandidate) };
}

export function resolveResearchItem(input: {
  kind: "conflict" | "review";
  id: string;
  resolution: string;
}) {
  ensureEventResearchControlTables();
  if (input.kind !== "conflict" && input.kind !== "review") {
    return { ok: false as const, status: 400, error: "kind must be conflict or review" };
  }
  const resolution = String(input.resolution || "").trim().slice(0, 2000);
  if (!input.id || !resolution) return { ok: false as const, status: 400, error: "resolution requires id and explanation" };
  const table = input.kind === "conflict" ? "agent_event_conflicts" : "agent_review_queue";
  const result = sqlite.prepare(`UPDATE ${table} SET status = 'resolved', resolved_at = ?, resolution = ? WHERE id = ? AND status = 'open'`).run(nowIso(), resolution, input.id);
  if (!result.changes) return { ok: false as const, status: 404, error: "open item not found" };
  return { ok: true as const, kind: input.kind, id: input.id };
}

export function getResearchControlState() {
  ensureEventResearchControlTables();
  const runs = sqlite.prepare(`SELECT * FROM agent_research_runs ORDER BY started_at DESC LIMIT 20`).all() as Array<any>;
  const conflicts = sqlite.prepare(`SELECT * FROM agent_event_conflicts WHERE status = 'open' ORDER BY created_at DESC LIMIT 100`).all() as Array<any>;
  const review = sqlite.prepare(`SELECT * FROM agent_review_queue WHERE status = 'open' ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, created_at LIMIT 100`).all() as Array<any>;
  const identities = sqlite.prepare(`SELECT * FROM agent_entity_identities WHERE status = 'active' ORDER BY canonical_name`).all() as Array<any>;
  const mistakeTests = sqlite.prepare(`SELECT * FROM agent_mistake_tests WHERE status = 'active' ORDER BY test_key`).all() as Array<any>;
  const series = sqlite.prepare(`SELECT * FROM agent_event_series WHERE active = 1 ORDER BY canonical_title`).all() as Array<any>;
  const outcomes = sqlite.prepare(`SELECT * FROM agent_decision_outcomes ORDER BY created_at DESC LIMIT 100`).all() as Array<any>;
  return {
    generatedAt: nowIso(),
    runs: runs.map(row => ({ ...row, summary: parseJson(row.summary_json, {}), regression: parseJson(row.regression_json, {}) })),
    openConflicts: conflicts.map(row => ({ ...row, values: parseJson(row.values_json, []), receiptIds: parseJson(row.receipt_ids_json, []) })),
    reviewQueue: review.map(row => ({ ...row, missingEvidence: parseJson(row.missing_evidence_json, []), evidenceUrls: parseJson(row.evidence_urls_json, []) })),
    identities: identities.map(row => ({ ...row, aliases: parseJson(row.aliases_json, []), anchors: parseJson(row.anchors_json, {}), officialUrls: parseJson(row.official_urls_json, []), scope: parseJson(row.scope_json, {}) })),
    mistakeTests: mistakeTests.map(row => ({ ...row, misleadingInput: parseJson(row.misleading_input_json, {}), evidence: parseJson(row.evidence_json, {}), expected: parseJson(row.expected_json, {}), forbidden: parseJson(row.forbidden_json, {}) })),
    eventSeries: series.map(row => ({ ...row, exceptionDates: parseJson(row.exception_dates_json, []) })),
    recentDecisionOutcomes: outcomes,
  };
}
