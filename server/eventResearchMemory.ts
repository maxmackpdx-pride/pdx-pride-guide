import { INGEST_SOURCES } from "@shared/ingestSources";
import { TRUSTED_VENUES } from "@shared/trustedVenues";
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
      sportsBra: "archived_direct_scraper_blocked_but_qsearch_2_browser_research_allowed_with_event_specific_lgbtq_evidence",
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
