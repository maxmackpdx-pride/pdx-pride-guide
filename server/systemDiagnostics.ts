import type Database from "better-sqlite3";
import crypto from "crypto";

export type SystemDiagnosticInput = {
  source: string;
  message: string;
  stack?: string | null;
  pageUrl?: string | null;
  userAgent?: string | null;
  environment?: string | null;
};

export function ensureSystemDiagnosticsTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_diagnostics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      message TEXT NOT NULL,
      stack TEXT,
      page_url TEXT,
      user_agent TEXT,
      environment TEXT NOT NULL DEFAULT 'unknown',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS system_diagnostics_created_idx ON system_diagnostics(created_at);
    CREATE INDEX IF NOT EXISTS system_diagnostics_fingerprint_idx ON system_diagnostics(fingerprint);
  `);
}

function normalizedFingerprintText(input: SystemDiagnosticInput) {
  const firstLine = String(input.message || "Unknown client error").split("\n", 1)[0]
    .replace(/https?:\/\/[^\s)]+/g, "<url>")
    .replace(/\b\d+\b/g, "#")
    .trim()
    .slice(0, 500);
  const firstFrame = String(input.stack || "").split("\n").find(line => line.includes(" at ")) || "";
  return `${input.source}|${firstLine}|${firstFrame.replace(/:\d+:\d+/g, ":#:#")}`;
}

function environmentFrom(input: SystemDiagnosticInput) {
  if (input.environment) return String(input.environment).slice(0, 40);
  try {
    const hostname = input.pageUrl ? new URL(input.pageUrl).hostname : "";
    if (hostname === "localhost" || hostname === "127.0.0.1") return "local-editing";
    if (hostname.endsWith("zaylist.com") || hostname.endsWith("prideguidepdx.com")) return "production";
    if (hostname) return hostname.slice(0, 40);
  } catch { /* malformed page URLs are still useful as diagnostics */ }
  return "unknown";
}

export function recordSystemDiagnostic(db: Database.Database, input: SystemDiagnosticInput) {
  const createdAt = new Date().toISOString();
  const fingerprint = crypto.createHash("sha256").update(normalizedFingerprintText(input)).digest("hex").slice(0, 24);
  const environment = environmentFrom(input);
  const result = db.prepare(`
    INSERT INTO system_diagnostics
      (source, fingerprint, message, stack, page_url, user_agent, environment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(input.source || "client-error").slice(0, 80),
    fingerprint,
    String(input.message || "Unknown client error").slice(0, 4000),
    input.stack ? String(input.stack).slice(0, 8000) : null,
    input.pageUrl ? String(input.pageUrl).slice(0, 1000) : null,
    input.userAgent ? String(input.userAgent).slice(0, 1000) : null,
    environment,
    createdAt,
  );
  return { id: Number(result.lastInsertRowid), fingerprint, environment, createdAt };
}

export function getSystemDiagnosticsDigest(db: Database.Database, sinceHours = 24) {
  const boundedHours = Math.min(24 * 14, Math.max(1, Math.floor(sinceHours)));
  const since = new Date(Date.now() - boundedHours * 60 * 60 * 1000).toISOString();
  const rows = db.prepare(`
    SELECT fingerprint, source, environment, message, page_url AS pageUrl,
           COUNT(*) AS occurrences, MIN(created_at) AS firstSeen, MAX(created_at) AS lastSeen
    FROM system_diagnostics
    WHERE created_at >= ?
    GROUP BY fingerprint, source, environment
    ORDER BY occurrences DESC, lastSeen DESC
  `).all(since) as Array<Record<string, unknown>>;

  const groups = rows.map(row => ({
    fingerprint: String(row.fingerprint),
    source: String(row.source),
    environment: String(row.environment),
    occurrences: Number(row.occurrences),
    problem: String(row.message || "Unknown client error").split("\n", 1)[0].slice(0, 500),
    page: row.pageUrl ? String(row.pageUrl) : null,
    firstSeen: String(row.firstSeen),
    lastSeen: String(row.lastSeen),
  }));
  return {
    since,
    through: new Date().toISOString(),
    totalOccurrences: groups.reduce((sum, group) => sum + group.occurrences, 0),
    uniqueProblems: groups.length,
    productionOccurrences: groups.filter(group => group.environment === "production").reduce((sum, group) => sum + group.occurrences, 0),
    localEditingOccurrences: groups.filter(group => group.environment === "local-editing").reduce((sum, group) => sum + group.occurrences, 0),
    groups,
  };
}
