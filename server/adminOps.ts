/**
 * Admin-only operations for the floating inbox + /admin tools.
 * Not used by public member surfaces.
 */
import { storage, sqlite } from "./storage";

export const ADMIN_QUEUE_KINDS = [
  "submission",
  "promoter",
  "business_claim",
  "business_submission",
  "logo_request",
  "moderation",
  "missed_connection",
  "gifting_report",
  "gifting_flagged",
  "river_brats",
  "gig_pending",
] as const;

export type AdminQueueKind = (typeof ADMIN_QUEUE_KINDS)[number];

const CLAIM_STALE_HOURS = Math.max(1, Number(process.env.ADMIN_QUEUE_CLAIM_STALE_HOURS) || 8);
const BULK_MAX = 40;
const MSG_RATE_WINDOW_MS = 60_000;
const MSG_RATE_MAX = 30;
const msgRateByUser = new Map<number, number[]>();

export function ensureAdminOpsSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS admin_queue_claims (
      queue_kind TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      assignee_user_id INTEGER NOT NULL,
      claimed_at TEXT NOT NULL,
      PRIMARY KEY (queue_kind, entity_id)
    );
    CREATE INDEX IF NOT EXISTS idx_admin_queue_claims_assignee
      ON admin_queue_claims(assignee_user_id);
  `);
}

ensureAdminOpsSchema();

export function reclaimStaleAdminQueueClaims(nowIso = new Date().toISOString()): number {
  ensureAdminOpsSchema();
  const cutoff = new Date(Date.now() - CLAIM_STALE_HOURS * 3600_000).toISOString();
  const result = sqlite.prepare(`
    DELETE FROM admin_queue_claims WHERE claimed_at < ?
  `).run(cutoff);
  return result.changes || 0;
}

export type AdminQueueClaim = {
  queueKind: string;
  entityId: number;
  assigneeUserId: number;
  assigneeUsername: string | null;
  assigneeDisplayName: string | null;
  claimedAt: string;
  staleHours: number;
};

export function listAdminQueueClaims(): AdminQueueClaim[] {
  ensureAdminOpsSchema();
  reclaimStaleAdminQueueClaims();
  const rows = sqlite.prepare(`
    SELECT c.queue_kind AS queueKind, c.entity_id AS entityId,
           c.assignee_user_id AS assigneeUserId, c.claimed_at AS claimedAt,
           u.username AS assigneeUsername, u.display_name AS assigneeDisplayName
    FROM admin_queue_claims c
    LEFT JOIN users u ON u.id = c.assignee_user_id
    ORDER BY c.claimed_at DESC
  `).all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    queueKind: String(r.queueKind),
    entityId: Number(r.entityId),
    assigneeUserId: Number(r.assigneeUserId),
    assigneeUsername: (r.assigneeUsername as string) || null,
    assigneeDisplayName: (r.assigneeDisplayName as string) || null,
    claimedAt: String(r.claimedAt || ""),
    staleHours: CLAIM_STALE_HOURS,
  }));
}

export function claimAdminQueueItem(
  queueKind: string,
  entityId: number,
  assigneeUserId: number,
  opts?: { takeover?: boolean },
): { ok?: boolean; claim?: AdminQueueClaim; error?: string } {
  ensureAdminOpsSchema();
  reclaimStaleAdminQueueClaims();
  const kind = String(queueKind || "").trim();
  if (!ADMIN_QUEUE_KINDS.includes(kind as AdminQueueKind)) {
    return { error: "Invalid queue kind" };
  }
  if (!Number.isFinite(entityId) || entityId <= 0) return { error: "Invalid entity id" };
  const assignee = storage.getUserById(assigneeUserId);
  if (!assignee || !storage.userIsSiteAdmin(assignee)) {
    return { error: "Assignee must be a site admin" };
  }
  const existing = sqlite.prepare(`
    SELECT assignee_user_id AS assigneeUserId, claimed_at AS claimedAt
    FROM admin_queue_claims WHERE queue_kind = ? AND entity_id = ?
  `).get(kind, entityId) as { assigneeUserId: number; claimedAt: string } | undefined;

  if (existing && existing.assigneeUserId !== assigneeUserId && !opts?.takeover) {
    const holder = storage.getUserById(existing.assigneeUserId);
    return {
      error: `Claimed by @${holder?.username || existing.assigneeUserId}. Use takeover to reassign.`,
    };
  }

  const now = new Date().toISOString();
  sqlite.prepare(`
    INSERT INTO admin_queue_claims (queue_kind, entity_id, assignee_user_id, claimed_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(queue_kind, entity_id) DO UPDATE SET
      assignee_user_id = excluded.assignee_user_id,
      claimed_at = excluded.claimed_at
  `).run(kind, entityId, assigneeUserId, now);

  return {
    ok: true,
    claim: {
      queueKind: kind,
      entityId,
      assigneeUserId,
      assigneeUsername: assignee.username,
      assigneeDisplayName: assignee.displayName ?? null,
      claimedAt: now,
      staleHours: CLAIM_STALE_HOURS,
    },
  };
}

export function releaseAdminQueueClaim(
  queueKind: string,
  entityId: number,
  actorUserId: number,
  opts?: { force?: boolean },
): { ok?: boolean; error?: string } {
  ensureAdminOpsSchema();
  const kind = String(queueKind || "").trim();
  const existing = sqlite.prepare(`
    SELECT assignee_user_id AS assigneeUserId FROM admin_queue_claims
    WHERE queue_kind = ? AND entity_id = ?
  `).get(kind, entityId) as { assigneeUserId: number } | undefined;
  if (!existing) return { ok: true };
  if (!opts?.force && existing.assigneeUserId !== actorUserId) {
    const actor = storage.getUserById(actorUserId);
    if (!actor || !storage.hasOwnerAdminAccess(actor)) {
      return { error: "Only the assignee or an owner admin can release this claim" };
    }
  }
  sqlite.prepare(`DELETE FROM admin_queue_claims WHERE queue_kind = ? AND entity_id = ?`).run(kind, entityId);
  return { ok: true };
}

export type BulkEventAction = "hide" | "claimable_on" | "claimable_off";

const ALLOWED_BULK: BulkEventAction[] = ["hide", "claimable_on", "claimable_off"];

export function previewBulkEvents(ids: number[], action: string) {
  const act = String(action || "") as BulkEventAction;
  if (!ALLOWED_BULK.includes(act)) {
    return { error: "Action must be hide | claimable_on | claimable_off" };
  }
  const unique = Array.from(new Set(ids.map(Number).filter((n) => Number.isFinite(n) && n > 0)));
  if (!unique.length) return { error: "No event ids" };
  if (unique.length > BULK_MAX) {
    return { error: `Max ${BULK_MAX} events per bulk action` };
  }
  const rows = unique.map((id) => {
    const evt = storage.getEvent(id);
    if (!evt) return { id, error: "Not found" as const };
    return {
      id,
      title: evt.title,
      status: evt.status,
      isClaimable: Boolean(evt.isClaimable),
      venueName: evt.venueName,
    };
  });
  const missing = rows.filter((r) => "error" in r).length;
  return {
    action: act,
    max: BULK_MAX,
    count: unique.length,
    missing,
    impact:
      act === "hide"
        ? "Set status HIDDEN (not deleted). Listings leave the public calendar until restored."
        : act === "claimable_on"
          ? "Mark events claimable for promoters."
          : "Clear claimable flag on events.",
    events: rows,
  };
}

export function executeBulkEvents(
  ids: number[],
  action: string,
  actor: { id?: number | null; username?: string | null },
  reason?: string,
) {
  const preview = previewBulkEvents(ids, action);
  if ("error" in preview && preview.error) return preview;
  const act = (preview as { action: BulkEventAction }).action;
  const events = (preview as { events: Array<{ id: number; error?: string; title?: string }> }).events;
  const applied: number[] = [];
  const skipped: Array<{ id: number; reason: string }> = [];

  for (const row of events) {
    if ("error" in row && row.error) {
      skipped.push({ id: row.id, reason: row.error });
      continue;
    }
    const evt = storage.getEvent(row.id);
    if (!evt) {
      skipped.push({ id: row.id, reason: "Not found" });
      continue;
    }
    if (act === "hide") {
      if (String(evt.status).toUpperCase() === "REMOVED") {
        skipped.push({ id: row.id, reason: "Already REMOVED" });
        continue;
      }
      storage.updateEventStatus(row.id, "HIDDEN");
      applied.push(row.id);
    } else if (act === "claimable_on") {
      storage.toggleClaimable(row.id, true);
      applied.push(row.id);
    } else if (act === "claimable_off") {
      storage.toggleClaimable(row.id, false);
      applied.push(row.id);
    }
  }

  storage.logAdminAction({
    actorUserId: actor.id ?? null,
    actorUsername: actor.username ?? null,
    action: `bulk_events_${act}`,
    targetType: "events",
    targetId: applied.slice(0, 20).join(","),
    targetLabel: `${applied.length} events`,
    detail: { action: act, applied, skipped, reason: reason || null },
  });

  return { ok: true, action: act, applied, skipped, count: applied.length };
}

/** One payload for floating inbox Admin · Queue (mobile-friendly). */
export function getAdminQueueAggregate() {
  reclaimStaleAdminQueueClaims();
  const breakdown = storage.getAdminQueueBreakdown();
  const claims = listAdminQueueClaims();
  const claimKey = (kind: string, id: number) => `${kind}:${id}`;
  const claimMap = new Map(claims.map((c) => [claimKey(c.queueKind, c.entityId), c]));

  const submissions = storage
    .getSubmissions("PENDING")
    .filter((s) => s.type !== "PROMOTER_APPLICATION")
    .map((s) => ({
      kind: "submission" as const,
      id: s.id,
      title: s.title,
      meta: `${s.type} · ${s.submitterEmail || ""}`,
      type: s.type,
      claim: claimMap.get(claimKey("submission", s.id)) || null,
    }));

  const promoters = storage.getPendingPromoterRequests().map((p: any) => ({
    kind: "promoter" as const,
    id: p.id,
    title: p.displayName || p.username || "Promoter",
    meta: `@${p.username || "?"} · promoter`,
    claim: claimMap.get(claimKey("promoter", p.id)) || null,
  }));

  const businessClaims = storage.getPendingBusinessClaims().map((c: any) => ({
    kind: "business_claim" as const,
    id: c.id,
    title: c.businessName || c.name || `Claim #${c.id}`,
    meta: c.claimantUsername || c.email || "claim",
    claim: claimMap.get(claimKey("business_claim", c.id)) || null,
  }));

  const businessSubmissions = storage.getPendingBusinessSubmissions().map((s: any) => ({
    kind: "business_submission" as const,
    id: s.id,
    title: s.name || `Venue #${s.id}`,
    meta: s.type || "venue",
    claim: claimMap.get(claimKey("business_submission", s.id)) || null,
  }));

  const logoRequests = storage.getPendingBusinessLogoRequests().map((l: any) => ({
    kind: "logo_request" as const,
    id: l.id,
    title: l.businessName || `Logo #${l.id}`,
    meta: "logo",
    claim: claimMap.get(claimKey("logo_request", l.id)) || null,
  }));

  const moderation = storage.getModerationRequests("PENDING").map((m: any) => ({
    kind: "moderation" as const,
    id: m.id,
    title: m.eventTitle || m.type || `Mod #${m.id}`,
    meta: m.type || "moderation",
    claim: claimMap.get(claimKey("moderation", m.id)) || null,
  }));

  const missedConnections = storage.getAdminMissedConnections().map((m: any) => ({
    kind: "missed_connection" as const,
    id: m.id,
    title: m.title || `MC #${m.id}`,
    meta: m.username || "missed connection",
    claim: claimMap.get(claimKey("missed_connection", m.id)) || null,
  }));

  const giftingReports = storage.getGiftingReports("PENDING").map((r: any) => ({
    kind: "gifting_report" as const,
    id: r.id,
    title: r.postTitle || `Gift report #${r.id}`,
    meta: r.reason || "report",
    claim: claimMap.get(claimKey("gifting_report", r.id)) || null,
  }));

  const terminal = new Set(["REJECTED", "REMOVED", "GIFTED", "FOUND", "EXPIRED"]);
  const giftingFlagged = storage
    .getGiftingPosts({ includeInactive: true })
    .filter((p: any) => !terminal.has(String(p.status || "").toUpperCase()) && Number(p.reportCount || 0) > 0)
    .map((p: any) => ({
      kind: "gifting_flagged" as const,
      id: p.id,
      title: p.title || `Gift #${p.id}`,
      meta: `${p.reportCount || 0} reports`,
      claim: claimMap.get(claimKey("gifting_flagged", p.id)) || null,
    }));

  const riverBrats = storage.getRiverBratsReports("PENDING").map((r: any) => ({
    kind: "river_brats" as const,
    id: r.id,
    title: `${r.target_type || "Content"} #${r.target_id}`,
    meta: r.reason || "report",
    claim: claimMap.get(claimKey("river_brats", r.id)) || null,
  }));

  const gigPending = storage
    .getGigPosts()
    .filter((g) => String(g.status || "").toUpperCase() === "PENDING")
    .map((g: any) => ({
      kind: "gig_pending" as const,
      id: g.id,
      title: g.title || `Gig #${g.id}`,
      meta: g.username ? `@${g.username}` : g.name || "gig",
      claim: claimMap.get(claimKey("gig_pending", g.id)) || null,
    }));

  return {
    generatedAt: new Date().toISOString(),
    breakdown,
    claims,
    buckets: {
      submissions,
      promoters,
      businessClaims,
      businessSubmissions,
      logoRequests,
      moderation,
      missedConnections,
      giftingReports,
      giftingFlagged,
      riverBrats,
      gigPending,
    },
  };
}

/** Soft rate limit for guide-admin DMs (per acting admin session user). */
export function checkAdminMessageRateLimit(actorUserId: number): { ok: true } | { ok: false; error: string } {
  const now = Date.now();
  const hits = (msgRateByUser.get(actorUserId) || []).filter((t) => now - t < MSG_RATE_WINDOW_MS);
  if (hits.length >= MSG_RATE_MAX) {
    return { ok: false, error: `Slow down — max ${MSG_RATE_MAX} admin messages per minute` };
  }
  hits.push(now);
  msgRateByUser.set(actorUserId, hits);
  return { ok: true };
}

export function publicPreviewLinks(opts: {
  eventId?: number | null;
  username?: string | null;
  businessId?: number | null;
}) {
  const site = (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.prideguidepdx.com").replace(/\/$/, "");
  const out: { type: string; url: string; label: string }[] = [];
  if (opts.eventId && Number.isFinite(opts.eventId)) {
    const evt = storage.getEvent(Number(opts.eventId));
    if (evt) {
      out.push({
        type: "event",
        url: `${site}/events?event=${evt.id}`,
        label: evt.title,
      });
    }
  }
  if (opts.username) {
    const uname = String(opts.username).replace(/^@/, "");
    const user = storage.getUserByUsername(uname);
    if (user && !storage.isSystemGuideAccount(user)) {
      out.push({
        type: "profile",
        url: `${site}/u/${encodeURIComponent(user.username)}`,
        label: `@${user.username}`,
      });
    }
  }
  if (opts.businessId && Number.isFinite(opts.businessId)) {
    const b = storage.getBusiness(Number(opts.businessId));
    if (b) {
      out.push({
        type: "place",
        url: `${site}/directory?place=${b.id}`,
        label: b.name,
      });
    }
  }
  return out;
}

export function adminSearchForViewer(
  q: string,
  viewer: { id?: number | null; username?: string | null } | null,
  limit = 16,
) {
  const raw = storage.adminGlobalSearch(q, limit);
  const canSeeEmail = viewer && storage.hasOwnerAdminAccess(viewer);
  return {
    users: raw.users.map((u) => ({
      ...u,
      email: canSeeEmail ? u.email : (u.email ? `${u.email.slice(0, 2)}…@…` : null),
      emailHidden: !canSeeEmail,
    })),
    events: raw.events,
    queue: raw.queue.map((item) => ({
      ...item,
      // Queue meta may include submitter email — redact for non-owners
      meta: canSeeEmail
        ? item.meta
        : item.meta.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "…@…"),
    })),
  };
}
