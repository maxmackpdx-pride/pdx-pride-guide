/**
 * Backend smoke for admin ops (queue aggregate, claims, bulk, guide, activity).
 * Run: node --import tsx script/smoke-admin-ops.mjs
 * Or: node --import tsx -e 'import("./script/smoke-admin-ops.mjs")'
 */
import { storage } from "../server/storage.ts";
import {
  claimAdminQueueItem,
  executeBulkEvents,
  getAdminQueueAggregate,
  listAdminQueueClaims,
  previewBulkEvents,
  publicPreviewLinks,
  releaseAdminQueueClaim,
  adminSearchForViewer,
} from "../server/adminOps.ts";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const breakdown = storage.getAdminQueueBreakdown();
assert(typeof breakdown.total === "number", "breakdown.total");
assert(breakdown.total === storage.getAdminPendingCount(), "pending matches breakdown");

const agg = getAdminQueueAggregate();
assert(agg.buckets, "aggregate buckets");
assert(agg.raw, "aggregate raw for QueueView");
assert(Array.isArray(agg.claims), "claims array");
assert(Array.isArray(agg.raw.submissions), "raw.submissions");
assert(Array.isArray(agg.raw.promoters), "raw.promoters");
assert("submissions" in agg.buckets && "promoters" in agg.buckets, "bucket keys");
assert(!("logoRequests" in (agg.buckets || {})), "logos not on shared buckets");

const admins = storage.listSiteAdmins();
assert(admins.length > 0, "need at least one site admin for claim smoke");
const actorId = admins[0].userId;

// Soft claim / release on a synthetic kind if no real entity — use first pending submission if any
const firstSub = storage.getSubmissions("PENDING").find((s) => s.type !== "PROMOTER_APPLICATION");
if (firstSub) {
  const claimed = claimAdminQueueItem("submission", firstSub.id, actorId);
  assert(claimed.ok, claimed.error || "claim");
  const listed = listAdminQueueClaims();
  assert(listed.some((c) => c.queueKind === "submission" && c.entityId === firstSub.id), "claim listed");
  const released = releaseAdminQueueClaim("submission", firstSub.id, actorId);
  assert(released.ok, released.error || "release");
}

const live = storage.getEvents({ status: "LIVE" }).slice(0, 3).map((e) => e.id);
if (live.length) {
  const prev = previewBulkEvents(live, "claimable_off");
  assert(!prev.error, prev.error || "preview");
  assert(prev.count === live.length, "preview count");
  // Do not execute hide on live production data in smoke — only re-apply claimable_off dry path
  const prevHide = previewBulkEvents(live.slice(0, 1), "hide");
  assert(!prevHide.error, prevHide.error || "preview hide");
}

const guide = storage.resolveGuideAdminUser();
assert(guide && guide.username === "prideguidepdx", "guide identity");
assert(storage.isSystemGuideAccount(guide), "system account");

const searchOwner = adminSearchForViewer("a", admins[0], 5);
assert(searchOwner.users || searchOwner.events || searchOwner.queue, "search returns shape");

const links = publicPreviewLinks({ eventId: live[0] || null, username: admins[0]?.username });
assert(Array.isArray(links), "preview links");

storage.logAdminAction({
  actorUserId: actorId,
  actorUsername: admins[0].username,
  action: "smoke_admin_ops",
  targetType: "system",
  targetId: "smoke",
});
const log = storage.getAdminActionLog(3);
assert(log.some((a) => a.action === "smoke_admin_ops"), "activity log");

console.log("SMOKE PASS admin-ops", {
  queueTotal: breakdown.total,
  guideId: guide.id,
  buckets: Object.fromEntries(
    Object.entries(agg.buckets).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0]),
  ),
});
