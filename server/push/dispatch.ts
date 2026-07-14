import type { Message } from "@shared/schema";
import { pushCategoryForContext } from "@shared/pushCategories";
import { storage } from "../storage";
import { buildPushPayloadForMessage } from "./templates";
import { sendPushToSubscription } from "./send";
import { isPushConfigured } from "./vapid";

const MAX_PUSH_PER_USER_HOUR = 20;
const recentPushByUser = new Map<number, number[]>();

function withinRateLimit(userId: number): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const hits = (recentPushByUser.get(userId) || []).filter(ts => ts > hourAgo);
  recentPushByUser.set(userId, hits);
  if (hits.length >= MAX_PUSH_PER_USER_HOUR) return false;
  hits.push(now);
  recentPushByUser.set(userId, hits);
  return true;
}

async function pushToUser(userId: number, message: Message): Promise<number> {
  const category = pushCategoryForContext(message.contextType);
  const prefs = storage.getNotificationPrefs(userId);
  if (!prefs[category]) {
    console.log(`[push] skip user=${userId} category=${category} disabled`);
    return 0;
  }
  if (!withinRateLimit(userId)) {
    console.warn(`[push] skip user=${userId} rate limited`);
    return 0;
  }

  const unreadCount = storage.getUnreadCount(userId);
  const payload = buildPushPayloadForMessage(message, unreadCount);
  const subs = storage.getActivePushSubscriptions(userId);
  if (subs.length === 0) {
    console.log(`[push] skip user=${userId} no active subscriptions`);
    return 0;
  }

  console.log(
    `[push] dispatch user=${userId} devices=${subs.length} ctx=${message.contextType || "THREAD"} title=${JSON.stringify(payload.notification.title)}`,
  );

  let sent = 0;
  await Promise.all(subs.map(async (sub) => {
    const result = await sendPushToSubscription(sub, payload);
    if (result.ok) {
      storage.touchPushSubscription(sub.id);
      sent += 1;
      console.log(`[push] ok user=${userId} sub=${sub.id} status=${result.statusCode ?? 201}`);
      return;
    }
    console.warn(
      `[push] send failed user=${userId} sub=${sub.id} status=${result.statusCode ?? "unknown"} err=${result.error || "n/a"}`,
    );
    if (result.gone) storage.deactivatePushSubscription(sub.id);
  }));
  console.log(`[push] done user=${userId} sent=${sent}/${subs.length} ctx=${message.contextType || "THREAD"}`);
  return sent;
}

export async function dispatchPushForMessage(message: Message): Promise<void> {
  if (!message?.toUserId || message.fromUserId === message.toUserId) {
    console.log(`[push] skip self-message or missing recipient id=${message?.id}`);
    return;
  }
  if (!isPushConfigured()) {
    console.log("[push] skip — VAPID not configured");
    return;
  }

  // Replies to the shared guide-admin identity fan out to every site admin.
  if (storage.isGuideAdminUserId(message.toUserId)) {
    const admins = storage.listSiteAdmins();
    const targets = admins
      .map((a) => a.userId)
      .filter((id) => id && id !== message.fromUserId);
    if (targets.length === 0) {
      console.log("[push] guide-admin message — no site admins to notify");
      return;
    }
    await Promise.all(targets.map((userId) => pushToUser(userId, message)));
    return;
  }

  await pushToUser(message.toUserId, message);
}

export function schedulePushForMessage(message: Message): void {
  void dispatchPushForMessage(message).catch((error) => {
    console.warn("[push] dispatch failed", error);
  });
}
