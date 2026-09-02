import { INGEST_SOURCES } from "@shared/ingestSources";
import { eventDedupeKey } from "@shared/eventDedupe";
import { TRUSTED_VENUES } from "@shared/trustedVenues";
import { randomUUID } from "node:crypto";
import { sqlite, storage } from "./storage";

type ArchivedHealthRow = {
  source_id: string;
  url: string;
  label: string;
  tier: string | null;
  format: string | null;
  resolved_url: string | null;
  recipe_url: string | null;
  winning_parser: string | null;
  yield_status: string | null;
  last_scan_at: string | null;
  last_ok: number | null;
  last_error: string | null;
  instagram_handle: string | null;
  disabled: number | null;
};

export type EventResearchPathObservation = {
  sourceKey: string;
  label: string;
  url: string;
  pathType?: string;
  outcome: "candidate" | "success" | "failure";
  discoveredFrom?: string | null;
  navigationRecipe?: string | null;
  fieldsFound?: string[] | null;
  requiresLogin?: boolean | null;
  evidenceNote?: string | null;
  error?: string | null;
};

export type EventResearchEvidenceReceipt = {
  field: string;
  sourceUrl: string;
  checkedAt: string;
  note?: string | null;
};

export type EventResearchChangeInput = {
  expectedUpdatedAt: string;
  patch: Record<string, unknown>;
  evidenceReceipts: EventResearchEvidenceReceipt[];
  reason: string;
  mistakeTestsPassed: boolean;
};

export type EventResearchCreateInput = {
  event: Record<string, unknown>;
  evidenceReceipts: EventResearchEvidenceReceipt[];
  reason: string;
  mistakeTestsPassed: boolean;
};

const EVENT_RESEARCH_MUTABLE_FIELDS = new Set([
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
]);

const EVENT_RESEARCH_REQUIRED_CREATE_FIELDS = [
  "title",
  "description",
  "venueName",
  "dateStart",
  "dateEnd",
  "ageRequirement",
  "admission",
  "status",
] as const;

function ensureEventResearchChangeTable() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agent_event_change_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rollback_token TEXT NOT NULL UNIQUE,
      operation TEXT NOT NULL,
      event_id INTEGER NOT NULL,
      before_json TEXT,
      after_json TEXT NOT NULL,
      patch_json TEXT NOT NULL,
      evidence_receipts_json TEXT NOT NULL,
      reason TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT 'qsearch-2',
      created_at TEXT NOT NULL,
      rolled_back_at TEXT,
      rollback_result_json TEXT
    );
    CREATE INDEX IF NOT EXISTS agent_event_change_log_event
      ON agent_event_change_log(event_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS agent_event_change_log_created
      ON agent_event_change_log(created_at DESC);
  `);
}

function eventResearchError(status: number, error: string, detail?: Record<string, unknown>) {
  return { ok: false as const, status, error, ...(detail || {}) };
}

function parseLockedFields(raw: unknown): string[] {
  try {
    const parsed = JSON.parse(String(raw || "[]"));
    return Array.isArray(parsed)
      ? parsed.filter(value => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function derivedDayOfWeek(dateStart: string): string | null {
  const day = dateStart.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!day) return null;
  const parsed = new Date(`${day}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(parsed).toUpperCase();
}

function safeEventLink(raw: unknown, allowLocal = false): string | null {
  if (raw == null || raw === "") return null;
  const value = String(raw).trim();
  if (allowLocal && value.startsWith("/") && !value.startsWith("//")) {
    return value.slice(0, 1000);
  }
  const safe = safeResearchUrl(value);
  return safe ? safe.slice(0, 1000) : null;
}

function sanitizeEventResearchPatch(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return eventResearchError(400, "patch must be an object");
  }
  const input = raw as Record<string, unknown>;
  const unknown = Object.keys(input).filter(key => !EVENT_RESEARCH_MUTABLE_FIELDS.has(key));
  if (unknown.length) {
    return eventResearchError(400, "patch contains fields outside QSearch authority", {
      fields: unknown,
    });
  }
  const patch: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(input)) {
    if (["title", "venueName"].includes(field)) {
      const text = String(value || "").trim().slice(0, 240);
      if (!text) return eventResearchError(400, `${field} cannot be empty`);
      patch[field] = text;
      continue;
    }
    if (field === "description") {
      const text = String(value || "").trim().slice(0, 5000);
      if (text.length < 10) return eventResearchError(400, "description is too short");
      patch[field] = text;
      continue;
    }
    if (["address", "neighborhood"].includes(field)) {
      patch[field] = value == null || value === "" ? null : String(value).trim().slice(0, 300);
      continue;
    }
    if (["lat", "lng"].includes(field)) {
      if (value == null) {
        patch[field] = null;
      } else {
        const number = Number(value);
        if (!Number.isFinite(number)) return eventResearchError(400, `${field} must be numeric`);
        if (field === "lat" && (number < -90 || number > 90)) return eventResearchError(400, "lat is out of range");
        if (field === "lng" && (number < -180 || number > 180)) return eventResearchError(400, "lng is out of range");
        patch[field] = number;
      }
      continue;
    }
    if (["dateStart", "dateEnd"].includes(field)) {
      const text = String(value || "").trim().slice(0, 80);
      if (!text || !Number.isFinite(Date.parse(text))) {
        return eventResearchError(400, `${field} must be a valid date-time`);
      }
      patch[field] = text;
      continue;
    }
    if (field === "ageRequirement") {
      if (!["ALL_AGES", "18_PLUS", "21_PLUS"].includes(String(value))) {
        return eventResearchError(400, "ageRequirement is invalid");
      }
      patch[field] = String(value);
      continue;
    }
    if (field === "admission") {
      if (!["FREE", "TICKETED", "DOOR_FEE", "UNKNOWN"].includes(String(value))) {
        return eventResearchError(400, "admission is invalid");
      }
      patch[field] = String(value);
      continue;
    }
    if (field === "status") {
      if (!["LIVE", "HIDDEN"].includes(String(value))) {
        return eventResearchError(400, "status must be LIVE or HIDDEN");
      }
      patch[field] = String(value);
      continue;
    }
    if (["ticketUrl", "posterImageUrl"].includes(field)) {
      const safe = safeEventLink(value, field === "posterImageUrl");
      if (value != null && value !== "" && !safe) {
        return eventResearchError(400, `${field} must be a safe http(s)${field === "posterImageUrl" ? " or local" : ""} URL`);
      }
      patch[field] = safe;
      continue;
    }
    if (field === "eventTypes") {
      if (!Array.isArray(value)) return eventResearchError(400, "eventTypes must be an array");
      patch[field] = JSON.stringify(
        [...new Set(value.map(item => String(item).trim()).filter(Boolean))].slice(0, 30),
      );
      continue;
    }
    if (["isPublic", "isHouseParty", "isSexPositive", "nudityOk"].includes(field)) {
      if (typeof value !== "boolean") return eventResearchError(400, `${field} must be boolean`);
      patch[field] = value;
    }
  }
  return { ok: true as const, patch };
}

function normalizeEvidenceReceipts(raw: unknown, requiredFields: string[]) {
  if (!Array.isArray(raw)) return eventResearchError(400, "evidenceReceipts must be an array");
  const now = Date.now();
  const oldest = now - 30 * 24 * 60 * 60 * 1000;
  const newest = now + 10 * 60 * 1000;
  const receipts: EventResearchEvidenceReceipt[] = [];
  for (const item of raw.slice(0, 100)) {
    if (!item || typeof item !== "object") return eventResearchError(400, "evidence receipt is invalid");
    const value = item as Record<string, unknown>;
    const field = String(value.field || "").trim();
    const sourceUrl = safeResearchUrl(String(value.sourceUrl || ""));
    const checkedAt = String(value.checkedAt || "").trim();
    const checkedTime = Date.parse(checkedAt);
    if (!field || !sourceUrl || !Number.isFinite(checkedTime)) {
      return eventResearchError(400, "each receipt needs field, safe sourceUrl, and checkedAt");
    }
    if (checkedTime < oldest || checkedTime > newest) {
      return eventResearchError(400, `receipt for ${field} is stale or future-dated`);
    }
    receipts.push({
      field,
      sourceUrl,
      checkedAt: new Date(checkedTime).toISOString(),
      note: value.note == null ? null : String(value.note).trim().slice(0, 1000),
    });
  }
  const covered = new Set(receipts.map(receipt => receipt.field));
  const missing = requiredFields.filter(field => !covered.has(field));
  if (missing.length) {
    return eventResearchError(400, "field-level evidence receipts are incomplete", {
      fields: missing,
    });
  }
  return { ok: true as const, receipts };
}

function eventValuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateEventDateOrder(event: { dateStart?: unknown; dateEnd?: unknown }) {
  const start = Date.parse(String(event.dateStart || ""));
  const end = Date.parse(String(event.dateEnd || ""));
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return eventResearchError(400, "dateStart and dateEnd must be valid date-times");
  }
  if (end <= start) return eventResearchError(400, "dateEnd must be after dateStart");
  return { ok: true as const };
}

function validateEventResearchPublishable(event: Record<string, unknown>) {
  if (event.status !== "LIVE") return { ok: true as const };
  const required = [
    "title",
    "description",
    "venueName",
    "address",
    "dateStart",
    "dateEnd",
    "ageRequirement",
    "admission",
  ];
  const missing = required.filter(field => {
    const value = event[field];
    return value == null || String(value).trim() === "";
  });
  if (missing.length) {
    return eventResearchError(400, "LIVE event is missing publication fields", {
      fields: missing,
    });
  }
  const hasLat = event.lat != null;
  const hasLng = event.lng != null;
  if (hasLat !== hasLng) {
    return eventResearchError(400, "lat and lng must be supplied together or both omitted");
  }
  return { ok: true as const };
}

function recordEventResearchChange(input: {
  operation: "create" | "update";
  eventId: number;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
  patch: Record<string, unknown>;
  receipts: EventResearchEvidenceReceipt[];
  reason: string;
}) {
  ensureEventResearchChangeTable();
  const rollbackToken = randomUUID();
  sqlite.prepare(`
    INSERT INTO agent_event_change_log (
      rollback_token, operation, event_id, before_json, after_json,
      patch_json, evidence_receipts_json, reason, actor, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'qsearch-2', ?)
  `).run(
    rollbackToken,
    input.operation,
    input.eventId,
    input.before ? JSON.stringify(input.before) : null,
    JSON.stringify(input.after),
    JSON.stringify(input.patch),
    JSON.stringify(input.receipts),
    input.reason,
    new Date().toISOString(),
  );
  return rollbackToken;
}

function eventChangeSnapshot(
  event: Record<string, unknown>,
  fields: string[],
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {
    id: event.id,
    updatedAt: event.updatedAt,
    lockedFields: event.lockedFields || "[]",
  };
  for (const field of fields) snapshot[field] = event[field];
  return snapshot;
}

function eventChangeValues(event: Record<string, unknown>, fields: string[]) {
  return Object.fromEntries(fields.map(field => [field, event[field]]));
}

/**
 * A QSearch correction is written through the normal human-lock mechanism so
 * trusted-source resyncs cannot undo it. This check distinguishes those
 * agent-created locks from pre-existing human locks: QSearch may revise a
 * value it previously set, but it may never take over a locked value that has
 * since been changed by a person.
 */
function qsearchOwnsCurrentLockedValue(
  eventId: number,
  field: string,
  currentValue: unknown,
): boolean {
  ensureEventResearchChangeTable();
  const jsonPath = `$.${field}`;
  const row = sqlite.prepare(`
    SELECT after_json
    FROM agent_event_change_log
    WHERE event_id = ?
      AND rolled_back_at IS NULL
      AND json_type(patch_json, ?) IS NOT NULL
    ORDER BY id DESC
    LIMIT 1
  `).get(eventId, jsonPath) as { after_json?: string } | undefined;
  if (!row?.after_json) return false;
  try {
    const after = JSON.parse(row.after_json) as Record<string, unknown>;
    return eventValuesEqual(after[field], currentValue);
  } catch {
    return false;
  }
}

export function eventForResearchAgent(event: Record<string, any>) {
  let eventTypes: string[] = [];
  try {
    const parsed = JSON.parse(String(event.eventTypes || "[]"));
    if (Array.isArray(parsed)) eventTypes = parsed.map(String);
  } catch {
    eventTypes = [];
  }
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    venueName: event.venueName,
    address: event.address,
    neighborhood: event.neighborhood,
    lat: event.lat,
    lng: event.lng,
    dateStart: event.dateStart,
    dateEnd: event.dateEnd,
    dayOfWeek: event.dayOfWeek,
    ageRequirement: event.ageRequirement,
    eventTypes,
    admission: event.admission,
    ticketUrl: event.ticketUrl,
    isPublic: event.isPublic,
    isPrivate: event.isPrivate,
    isHouseParty: event.isHouseParty,
    isSexPositive: event.isSexPositive,
    nudityOk: event.nudityOk,
    posterImageUrl: event.posterImageUrl,
    status: event.status,
    source: event.source,
    isClaimable: event.isClaimable,
    claimed: Boolean(event.claimedBy),
    submittedByHuman: Boolean(event.submittedBy),
    lockedFields: parseLockedFields(event.lockedFields),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export function applyEventResearchEventChange(
  eventId: number,
  input: EventResearchChangeInput,
) {
  const event = storage.getEvent(eventId) as Record<string, any> | undefined;
  if (!event) return eventResearchError(404, "event not found");
  if (!input?.mistakeTestsPassed) {
    return eventResearchError(400, "mistakeTestsPassed: true is required");
  }
  if (!input.expectedUpdatedAt || input.expectedUpdatedAt !== event.updatedAt) {
    return eventResearchError(409, "event changed since inspection; reload before modifying", {
      currentUpdatedAt: event.updatedAt,
    });
  }
  if (event.claimedBy || event.submittedBy) {
    return eventResearchError(409, "claimed or human-submitted event requires review");
  }
  const reason = String(input.reason || "").trim().slice(0, 1000);
  if (reason.length < 10) return eventResearchError(400, "a specific change reason is required");
  const sanitized = sanitizeEventResearchPatch(input.patch);
  if (!sanitized.ok) return sanitized;
  const changed: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(sanitized.patch)) {
    if (!eventValuesEqual(event[field], value)) changed[field] = value;
  }
  if (!Object.keys(changed).length) return eventResearchError(400, "patch makes no changes");
  const locked = parseLockedFields(event.lockedFields);
  const lockedChanges = Object.keys(changed).filter(
    field => locked.includes(field) && !qsearchOwnsCurrentLockedValue(eventId, field, event[field]),
  );
  if (
    changed.dateStart !== undefined &&
    locked.includes("dayOfWeek") &&
    !qsearchOwnsCurrentLockedValue(eventId, "dayOfWeek", event.dayOfWeek)
  ) {
    lockedChanges.push("dayOfWeek");
  }
  if (lockedChanges.length) {
    return eventResearchError(409, "patch would overwrite locked human fields", {
      fields: [...new Set(lockedChanges)],
    });
  }
  const receipts = normalizeEvidenceReceipts(input.evidenceReceipts, Object.keys(changed));
  if (!receipts.ok) return receipts;
  const candidate = { ...event, ...changed };
  const dates = validateEventDateOrder(candidate);
  if (!dates.ok) return dates;
  const publishable = validateEventResearchPublishable(candidate);
  if (!publishable.ok) return publishable;
  if (changed.dateStart !== undefined) {
    const dayOfWeek = derivedDayOfWeek(String(changed.dateStart));
    if (dayOfWeek) changed.dayOfWeek = dayOfWeek;
  }
  const before = { ...event };
  const after = storage.updateEvent(eventId, changed as any, { source: "human" }) as
    | Record<string, unknown>
    | undefined;
  if (!after) return eventResearchError(500, "event update failed");
  const changedFields = Object.keys(changed);
  const rollbackToken = recordEventResearchChange({
    operation: "update",
    eventId,
    before: eventChangeSnapshot(before, changedFields),
    after: eventChangeSnapshot(after, changedFields),
    patch: changed,
    receipts: receipts.receipts,
    reason,
  });
  return {
    ok: true as const,
    operation: "update" as const,
    event: eventForResearchAgent(after),
    changedFields,
    beforeValues: eventChangeValues(before, changedFields),
    afterValues: eventChangeValues(after, changedFields),
    evidenceReceipts: receipts.receipts,
    rollback: { token: rollbackToken, available: true },
  };
}

export function createEventFromResearch(input: EventResearchCreateInput) {
  if (!input?.mistakeTestsPassed) {
    return eventResearchError(400, "mistakeTestsPassed: true is required");
  }
  const reason = String(input.reason || "").trim().slice(0, 1000);
  if (reason.length < 10) return eventResearchError(400, "a specific create reason is required");
  const sanitized = sanitizeEventResearchPatch(input.event);
  if (!sanitized.ok) return sanitized;
  const event = sanitized.patch;
  const missing = EVENT_RESEARCH_REQUIRED_CREATE_FIELDS.filter(field => event[field] == null);
  if (missing.length) {
    return eventResearchError(400, "required event fields are missing", { fields: missing });
  }
  const dates = validateEventDateOrder(event);
  if (!dates.ok) return dates;
  const publishable = validateEventResearchPublishable(event);
  if (!publishable.ok) return publishable;
  const receipts = normalizeEvidenceReceipts(
    input.evidenceReceipts,
    Object.keys(event).filter(field => field !== "dayOfWeek"),
  );
  if (!receipts.ok) return receipts;
  const dayOfWeek = derivedDayOfWeek(String(event.dateStart));
  if (dayOfWeek) event.dayOfWeek = dayOfWeek;
  const duplicateKey = eventDedupeKey({
    id: 0,
    title: String(event.title),
    venueName: String(event.venueName),
    dateStart: String(event.dateStart),
  });
  const duplicate = storage.getEvents({}).find(existing => eventDedupeKey(existing) === duplicateKey);
  if (duplicate) {
    return eventResearchError(409, "duplicate event already exists", { eventId: duplicate.id });
  }
  const lockedFields = Object.keys(event).filter(field => EVENT_RESEARCH_MUTABLE_FIELDS.has(field));
  const created = storage.createEvent({
    ...event,
    source: "qsearch-2",
    isClaimable: false,
    lockedFields: JSON.stringify(lockedFields),
  } as any) as Record<string, unknown>;
  const createdFields = Object.keys(event);
  const rollbackToken = recordEventResearchChange({
    operation: "create",
    eventId: Number(created.id),
    before: null,
    after: eventChangeSnapshot(created, createdFields),
    patch: event,
    receipts: receipts.receipts,
    reason,
  });
  return {
    ok: true as const,
    operation: "create" as const,
    event: eventForResearchAgent(created),
    beforeValues: null,
    afterValues: eventChangeValues(created, createdFields),
    evidenceReceipts: receipts.receipts,
    rollback: {
      token: rollbackToken,
      available: true,
      mode: "hide_created_event",
    },
  };
}

export function rollbackEventResearchChange(rollbackToken: string) {
  ensureEventResearchChangeTable();
  const token = String(rollbackToken || "").trim();
  const row = sqlite.prepare(`
    SELECT * FROM agent_event_change_log WHERE rollback_token = ?
  `).get(token) as Record<string, any> | undefined;
  if (!row) return eventResearchError(404, "rollback token not found");
  if (row.rolled_back_at) {
    return {
      ok: true as const,
      alreadyRolledBack: true,
      eventId: Number(row.event_id),
      rolledBackAt: row.rolled_back_at,
    };
  }
  const current = storage.getEvent(Number(row.event_id)) as Record<string, any> | undefined;
  if (!current) return eventResearchError(409, "event no longer exists; rollback requires review");
  const after = JSON.parse(String(row.after_json || "{}")) as Record<string, unknown>;
  if (current.updatedAt !== after.updatedAt) {
    return eventResearchError(409, "event changed after QSearch; automatic rollback refused", {
      currentUpdatedAt: current.updatedAt,
    });
  }
  let restored: Record<string, unknown> | undefined;
  if (row.operation === "create") {
    restored = storage.updateEvent(
      Number(row.event_id),
      { status: "HIDDEN" } as any,
      { source: "sync" },
    ) as Record<string, unknown> | undefined;
  } else {
    const before = JSON.parse(String(row.before_json || "{}")) as Record<string, unknown>;
    const patch = JSON.parse(String(row.patch_json || "{}")) as Record<string, unknown>;
    const restorePatch: Record<string, unknown> = {};
    for (const field of Object.keys(patch)) restorePatch[field] = before[field];
    restorePatch.lockedFields = before.lockedFields || "[]";
    restored = storage.updateEvent(
      Number(row.event_id),
      restorePatch as any,
      { source: "sync" },
    ) as Record<string, unknown> | undefined;
  }
  if (!restored) return eventResearchError(500, "rollback failed");
  const rolledBackAt = new Date().toISOString();
  sqlite.prepare(`
    UPDATE agent_event_change_log
    SET rolled_back_at = ?, rollback_result_json = ?
    WHERE id = ? AND rolled_back_at IS NULL
  `).run(rolledBackAt, JSON.stringify(restored), row.id);
  return {
    ok: true as const,
    eventId: Number(row.event_id),
    operation: row.operation,
    rolledBackAt,
    event: eventForResearchAgent(restored),
  };
}

export function listEventResearchChanges(limit = 100) {
  ensureEventResearchChangeTable();
  const take = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const rows = sqlite.prepare(`
    SELECT id, rollback_token, operation, event_id, before_json, after_json,
           patch_json, evidence_receipts_json,
           reason, actor, created_at, rolled_back_at
    FROM agent_event_change_log
    ORDER BY id DESC
    LIMIT ?
  `).all(take) as Array<Record<string, unknown>>;
  return rows.map(row => {
    const patch = JSON.parse(String(row.patch_json || "{}")) as Record<string, unknown>;
    const fields = Object.keys(patch);
    const before = row.before_json
      ? JSON.parse(String(row.before_json)) as Record<string, unknown>
      : null;
    const after = JSON.parse(String(row.after_json || "{}")) as Record<string, unknown>;
    return {
      id: Number(row.id),
      rollbackToken: row.rollback_token,
      operation: row.operation,
      eventId: Number(row.event_id),
      patch,
      beforeValues: before ? eventChangeValues(before, fields) : null,
      afterValues: eventChangeValues(after, fields),
      evidenceReceipts: JSON.parse(String(row.evidence_receipts_json || "[]")),
      reason: row.reason,
      actor: row.actor,
      createdAt: row.created_at,
      rolledBackAt: row.rolled_back_at || null,
      rollbackAvailable: !row.rolled_back_at,
    };
  });
}

function ensureAgentMemoryColumn(name: string, definition: string) {
  const columns = sqlite.prepare("PRAGMA table_info(agent_event_source_paths)").all() as Array<{
    name: string;
  }>;
  if (!columns.some(column => column.name === name)) {
    sqlite.exec(`ALTER TABLE agent_event_source_paths ADD COLUMN ${name} ${definition}`);
  }
}

function ensureAgentMemoryTable() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agent_event_source_paths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_key TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      path_type TEXT NOT NULL DEFAULT 'official',
      status TEXT NOT NULL DEFAULT 'candidate',
      discovered_from TEXT,
      navigation_recipe TEXT,
      last_successful_recipe TEXT,
      fields_found TEXT,
      requires_login INTEGER,
      evidence_note TEXT,
      first_seen_at TEXT NOT NULL,
      last_checked_at TEXT NOT NULL,
      last_success_at TEXT,
      success_count INTEGER NOT NULL DEFAULT 0,
      failure_count INTEGER NOT NULL DEFAULT 0,
      consecutive_failures INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      UNIQUE(source_key, url)
    );
    CREATE INDEX IF NOT EXISTS agent_event_source_paths_rank
      ON agent_event_source_paths(source_key, status, success_count DESC, last_checked_at DESC);
  `);
  // Keep databases created by an earlier QSearch 2.0 build compatible.
  ensureAgentMemoryColumn("navigation_recipe", "TEXT");
  ensureAgentMemoryColumn("last_successful_recipe", "TEXT");
  ensureAgentMemoryColumn("fields_found", "TEXT");
  ensureAgentMemoryColumn("requires_login", "INTEGER");
}

function safeResearchUrl(raw: string): string | null {
  try {
    const value = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function learnedPathMemory() {
  ensureAgentMemoryTable();
  const rows = sqlite
    .prepare(`
      SELECT * FROM agent_event_source_paths
      ORDER BY source_key, status = 'active' DESC, success_count DESC, last_checked_at DESC
    `)
    .all() as Array<Record<string, any>>;
  return rows.map(row => {
    let fieldsFound: string[] = [];
    try {
      const parsed = JSON.parse(row.fields_found || "[]");
      fieldsFound = Array.isArray(parsed) ? parsed : [];
    } catch {
      fieldsFound = [];
    }
    return {
      id: row.id,
      sourceKey: row.source_key,
      label: row.label,
      url: row.url,
      pathType: row.path_type,
      status: row.status,
      discoveredFrom: row.discovered_from,
      navigationRecipe: row.navigation_recipe,
      lastSuccessfulRecipe: row.last_successful_recipe,
      fieldsFound,
      requiresLogin: row.requires_login == null ? null : Boolean(row.requires_login),
      evidenceNote: row.evidence_note,
      firstSeenAt: row.first_seen_at,
      lastCheckedAt: row.last_checked_at,
      lastSuccessAt: row.last_success_at,
      successCount: row.success_count,
      failureCount: row.failure_count,
      consecutiveFailures: row.consecutive_failures,
      lastError: row.last_error,
    };
  });
}

/** Agent-only memory write: store observations, never fetch or execute a URL. */
export function recordEventResearchPath(observation: EventResearchPathObservation) {
  ensureAgentMemoryTable();
  const sourceKey = String(observation.sourceKey || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  const label = String(observation.label || "").trim().slice(0, 200);
  const url = safeResearchUrl(String(observation.url || ""));
  if (!sourceKey || !label || !url) {
    return { ok: false as const, error: "sourceKey, label, and a safe http(s) URL are required" };
  }
  const outcome = observation.outcome;
  if (!['candidate', 'success', 'failure'].includes(outcome)) {
    return { ok: false as const, error: "outcome must be candidate, success, or failure" };
  }
  const now = new Date().toISOString();
  const pathType = String(observation.pathType || "official").trim().slice(0, 80) || "official";
  const discoveredFrom = observation.discoveredFrom
    ? safeResearchUrl(String(observation.discoveredFrom))
    : null;
  const navigationRecipe = String(observation.navigationRecipe || "").trim().slice(0, 2000) || null;
  const fieldsFound = Array.isArray(observation.fieldsFound)
    ? JSON.stringify(
        [...new Set(observation.fieldsFound.map(field => String(field).trim()).filter(Boolean))]
          .slice(0, 30),
      )
    : null;
  const requiresLogin =
    typeof observation.requiresLogin === "boolean" ? Number(observation.requiresLogin) : null;
  const evidenceNote = String(observation.evidenceNote || "").trim().slice(0, 1000) || null;
  const error = String(observation.error || "").trim().slice(0, 500) || null;

  sqlite
    .prepare(`
      INSERT INTO agent_event_source_paths (
        source_key, label, url, path_type, status, discovered_from,
        navigation_recipe, last_successful_recipe, fields_found, requires_login, evidence_note,
        first_seen_at, last_checked_at, last_success_at, success_count,
        failure_count, consecutive_failures, last_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source_key, url) DO UPDATE SET
        label = excluded.label,
        path_type = excluded.path_type,
        status = CASE
          WHEN excluded.status = 'active' THEN 'active'
          WHEN excluded.status = 'failure' AND agent_event_source_paths.consecutive_failures + 1 >= 2 THEN 'broken'
          WHEN excluded.status = 'candidate' THEN agent_event_source_paths.status
          ELSE agent_event_source_paths.status
        END,
        discovered_from = COALESCE(excluded.discovered_from, agent_event_source_paths.discovered_from),
        navigation_recipe = CASE
          WHEN excluded.status = 'failure' THEN agent_event_source_paths.navigation_recipe
          ELSE COALESCE(excluded.navigation_recipe, agent_event_source_paths.navigation_recipe)
        END,
        last_successful_recipe = CASE
          WHEN excluded.status = 'active' THEN COALESCE(excluded.navigation_recipe, agent_event_source_paths.last_successful_recipe)
          ELSE agent_event_source_paths.last_successful_recipe
        END,
        fields_found = CASE
          WHEN excluded.status = 'failure' THEN agent_event_source_paths.fields_found
          ELSE COALESCE(excluded.fields_found, agent_event_source_paths.fields_found)
        END,
        requires_login = COALESCE(excluded.requires_login, agent_event_source_paths.requires_login),
        evidence_note = COALESCE(excluded.evidence_note, agent_event_source_paths.evidence_note),
        last_checked_at = excluded.last_checked_at,
        last_success_at = COALESCE(excluded.last_success_at, agent_event_source_paths.last_success_at),
        success_count = agent_event_source_paths.success_count + excluded.success_count,
        failure_count = agent_event_source_paths.failure_count + excluded.failure_count,
        consecutive_failures = CASE
          WHEN excluded.status = 'active' THEN 0
          WHEN excluded.status = 'failure' THEN agent_event_source_paths.consecutive_failures + 1
          ELSE agent_event_source_paths.consecutive_failures
        END,
        last_error = CASE
          WHEN excluded.status = 'active' THEN NULL
          WHEN excluded.status = 'failure' THEN excluded.last_error
          ELSE agent_event_source_paths.last_error
        END
    `)
    .run(
      sourceKey,
      label,
      url,
      pathType,
      outcome === "success" ? "active" : outcome,
      discoveredFrom,
      navigationRecipe,
      outcome === "success" ? navigationRecipe : null,
      fieldsFound,
      requiresLogin,
      evidenceNote,
      now,
      now,
      outcome === "success" ? now : null,
      outcome === "success" ? 1 : 0,
      outcome === "failure" ? 1 : 0,
      outcome === "failure" ? 1 : 0,
      outcome === "failure" ? error || "Path failed" : null,
    );

  const row = sqlite
    .prepare(`SELECT * FROM agent_event_source_paths WHERE source_key = ? AND url = ?`)
    .get(sourceKey, url);
  return { ok: true as const, path: row };
}

function archivedPathMemory(): ArchivedHealthRow[] {
  try {
    return sqlite
      .prepare(`
        SELECT
          source_id, url, label, tier, format, resolved_url, recipe_url,
          winning_parser, yield_status, last_scan_at, last_ok, last_error,
          instagram_handle, disabled
        FROM qsearch_source_health
        ORDER BY label COLLATE NOCASE
      `)
      .all() as ArchivedHealthRow[];
  } catch {
    // A new database may never have initialized the archived tables.
    return [];
  }
}

/**
 * Read-only source memory for the agent-run event research workflow.
 *
 * This deliberately exposes no scan, model, queue, approve, or mutation
 * action. It preserves the valuable pathways learned by QSEARCH while the
 * archived system remains inert.
 */
export function getEventResearchSourceMemory() {
  const businesses = storage.getBusinesses({});
  return {
    generatedAt: new Date().toISOString(),
    archivedSystem: {
      name: "QSEARCH",
      active: false,
      archiveBranch: "archive/qsearch-legacy-2026-08-30",
      archiveCommit: "bcb28c4d4550e6f29cc6882bc37481784adb1926",
    },
    rules: {
      sportsBra: "founder_locked_dedicated_lesbian_lgbtq_venue_official_calendar_establishes_relevance_exact_portland_identity_required_archived_direct_scraper_blocked_browser_research_allowed",
      founderLockedDedicatedLgbtqVenues: [
        "Sanctuary Club",
        "Eagle Portland",
        "Badlands",
        "The Sports Bra",
        "Q Center",
        "Steam Portland",
        "Camp Bar PDX",
        "Darcelle XV Showplace",
        "CC Slaughters",
        "Hawks PDX",
        "Scandals East",
      ],
      trustedVenuePublication: "official_venue_calendar_establishes_lgbtq_relevance_publish_after_exact_identity_and_normal_fact_evidence_checks",
      scandalsEast: "trusted_dedicated_lgbtq_venue_current_identity_827_ne_alberta_old_downtown_location_blocked",
      campTrc: "approved_outside_portland_and_off_map",
      generalVenues: "require_event_specific_lgbtq_evidence",
      dedicatedGayVenues: "venue_calendar_is_relevance_evidence",
      venueIdentity: "exact_name_and_address_when_available",
      sanctuaryArtwork: "exact_event_only",
      badlandsPlaAttribution: "explicit_event_credit_only",
      unknownValues: "preserve_unknown_never_guess",
    },
    flyerAuditPlaybook: {
      purpose: "Use flyer OCR as supporting evidence, never as sole truth.",
      verifyFields: [
        "event title",
        "date",
        "start/end time",
        "venue",
        "address",
        "age limit",
        "admission or ticket price",
      ],
      exactEventRequired: true,
      rejectAsEventArtwork: [
        "venue logo",
        "site-wide calendar hero",
        "unrelated event poster",
        "old series poster without current official confirmation",
        "cropped or unreadable thumbnail when a current original is available",
      ],
      sourceOrder: [
        "official event or organizer page",
        "official ticket page",
        "current official Facebook event/post",
        "current official Instagram post",
        "aggregator only as a discovery lead",
      ],
      ambiguousResult: "leave unchanged or unpublished and report what evidence is missing",
    },
    browserPathways: [
      {
        kind: "facebook_events",
        access: "authenticated_browser_session",
        role: "discovery_and_corroboration",
        note: "Use an existing signed-in browser session. Never request, store, or handle Tucker's Facebook password. If signed out, report the pathway unavailable.",
      },
      {
        kind: "instagram",
        access: "public_or_authenticated_browser_session",
        role: "current_official_social_evidence",
        note: "Prefer official organizer or venue accounts and exact event posts.",
      },
    ],
    trustedSources: TRUSTED_VENUES,
    curatedSources: INGEST_SOURCES,
    archivedPathMemory: archivedPathMemory().map(row => ({
      sourceId: row.source_id,
      label: row.label,
      primaryUrl: row.url,
      resolvedUrl: row.resolved_url,
      recipeUrl: row.recipe_url,
      instagramHandle: row.instagram_handle,
      tier: row.tier,
      format: row.format,
      winningParser: row.winning_parser,
      priorYieldStatus: row.yield_status,
      lastCheckedAt: row.last_scan_at,
      lastReached: row.last_ok == null ? null : Boolean(row.last_ok),
      lastError: row.last_error,
      archivedDisabled: Boolean(row.disabled),
    })),
    learnedPathMemory: learnedPathMemory(),
    directorySources: businesses
      .filter((business: any) => business.active !== false)
      .map((business: any) => ({
        businessId: business.id,
        name: business.name,
        type: business.type,
        address: business.address,
        website: business.website,
        instagram: business.instagram,
        ingestEvents: business.ingestEvents,
      })),
  };
}
