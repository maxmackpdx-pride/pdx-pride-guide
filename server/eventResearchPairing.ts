import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { sqlite } from "./storage";

const PAIRING_LIFETIME_MS = 15 * 60_000;
const AGENT_NAME = "qsearch-3";

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function equalDigest(left: string, right: string): boolean {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

let tablesReady = false;

function ensureTables() {
  if (tablesReady) return;
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agent_pairing_requests (
      id TEXT PRIMARY KEY,
      display_code TEXT NOT NULL,
      claim_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      approved_by INTEGER,
      approved_at TEXT,
      redeemed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS agent_credentials (
      id TEXT PRIMARY KEY,
      agent_name TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      last_used_at TEXT,
      revoked_at TEXT
    );
    CREATE INDEX IF NOT EXISTS agent_pairing_expiry ON agent_pairing_requests(expires_at);
  `);
  tablesReady = true;
}

export function startAgentPairing() {
  ensureTables();
  const id = randomUUID();
  const claimSecret = randomBytes(32).toString("base64url");
  const displayCode = randomBytes(5).toString("hex").toUpperCase();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + PAIRING_LIFETIME_MS).toISOString();
  sqlite.prepare(`INSERT INTO agent_pairing_requests
    (id, display_code, claim_hash, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)`).run(id, displayCode, digest(claimSecret), createdAt, expiresAt);
  return { id, claimSecret, displayCode, expiresAt };
}

export function listAgentPairings() {
  ensureTables();
  return sqlite.prepare(`SELECT id, display_code AS displayCode, created_at AS createdAt,
    expires_at AS expiresAt, approved_at AS approvedAt
    FROM agent_pairing_requests
    WHERE redeemed_at IS NULL AND expires_at > ?
    ORDER BY created_at DESC`).all(new Date().toISOString());
}

export function approveAgentPairing(id: string, ownerUserId: number) {
  ensureTables();
  const result = sqlite.prepare(`UPDATE agent_pairing_requests SET approved_by = ?, approved_at = ?
    WHERE id = ? AND approved_at IS NULL AND redeemed_at IS NULL AND expires_at > ?`)
    .run(ownerUserId, new Date().toISOString(), id, new Date().toISOString());
  return result.changes === 1;
}

export function redeemAgentPairing(id: string, claimSecret: string) {
  ensureTables();
  if (!id || claimSecret.length < 32) return { status: "invalid" as const };
  const row = sqlite.prepare(`SELECT claim_hash AS claimHash, expires_at AS expiresAt,
    approved_at AS approvedAt, redeemed_at AS redeemedAt
    FROM agent_pairing_requests WHERE id = ?`).get(id) as any;
  if (!row || !equalDigest(digest(claimSecret), row.claimHash)) return { status: "invalid" as const };
  if (row.redeemedAt || row.expiresAt <= new Date().toISOString()) return { status: "expired" as const };
  if (!row.approvedAt) return { status: "pending" as const };
  const token = randomBytes(48).toString("base64url");
  const credentialId = randomUUID();
  const issuedAt = new Date().toISOString();
  const transaction = sqlite.transaction(() => {
    const claimed = sqlite.prepare(`UPDATE agent_pairing_requests SET redeemed_at = ?
      WHERE id = ? AND redeemed_at IS NULL AND approved_at IS NOT NULL AND expires_at > ?`)
      .run(issuedAt, id, issuedAt);
    if (claimed.changes !== 1) return false;
    sqlite.prepare(`INSERT INTO agent_credentials (id, agent_name, token_hash, created_at)
      VALUES (?, ?, ?, ?)`).run(credentialId, AGENT_NAME, digest(token), issuedAt);
    return true;
  });
  if (!transaction()) return { status: "expired" as const };
  return { status: "ready" as const, token, credentialId };
}

export function isPairedEventResearchToken(token: string): boolean {
  if (token.length < 32) return false;
  ensureTables();
  const row = sqlite.prepare(`SELECT id, last_used_at AS lastUsedAt FROM agent_credentials
    WHERE token_hash = ? AND revoked_at IS NULL`).get(digest(token)) as { id: string; lastUsedAt: string | null } | undefined;
  if (!row) return false;
  if (!row.lastUsedAt || Date.now() - Date.parse(row.lastUsedAt) > 15 * 60_000) {
    sqlite.prepare(`UPDATE agent_credentials SET last_used_at = ? WHERE id = ?`).run(new Date().toISOString(), row.id);
  }
  return true;
}

export function listAgentCredentials() {
  ensureTables();
  return sqlite.prepare(`SELECT id, agent_name AS agentName, created_at AS createdAt,
    last_used_at AS lastUsedAt, revoked_at AS revokedAt
    FROM agent_credentials ORDER BY created_at DESC`).all();
}

export function revokeAgentCredential(id: string) {
  ensureTables();
  return sqlite.prepare(`UPDATE agent_credentials SET revoked_at = ?
    WHERE id = ? AND revoked_at IS NULL`).run(new Date().toISOString(), id).changes === 1;
}
