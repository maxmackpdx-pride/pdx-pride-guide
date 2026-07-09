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

export async function dispatchPushForMessage(message: Message): Promise<void> {
  if (!message?.toUserId || message.fromUserId === message.toUserId) {
    console.log(`[push] skip self-message or missing recipient id=${message?.id}`);
    return;
  }
  if (!isPushConfigured()) {
    console.log("[push] skip — VAPID not configured");
    return;
  }

  const category = pushCategoryForContext(message.contextType);
  const prefs = storage.getNotificationPrefs(message.toUserId);
  if (!prefs[category]) {
    console.log(`[push] skip user=${message.toUserId} category=${category} disabled`);
    return;
  }
  if (!withinRateLimit(message.toUserId)) {
    console.warn(`[push] skip user=${message.toUserId} rate limited`);
    return;
  }

  const unreadCount = storage.getUnreadCount(message.toUserId);
  const payload = buildPushPayloadForMessage(message, unreadCount);
  const subs = storage.getActivePushSubscriptions(message.toUserId);
  if (subs.length === 0) {
    console.log(`[push] skip user=${message.toUserId} no active subscriptions`);
    return;
  }

  console.log(
    `[push] dispatch user=${message.toUserId} devices=${subs.length} ctx=${message.contextType || "THREAD"} title=${JSON.stringify(payload.notification.title)}`,
  );

  let sent = 0;
  await Promise.all(subs.map(async (sub) => {
    const result = await sendPushToSubscription(sub, payload);
    if (result.ok) {
      storage.touchPushSubscription(sub.id);
      sent += 1;
      console.log(`[push] ok user=${message.toUserId} sub=${sub.id} status=${result.statusCode ?? 201}`);
      return;
    }
    console.warn(
      `[push] send failed user=${message.toUserId} sub=${sub.id} status=${result.statusCode ?? "unknown"} err=${result.error || "n/a"}`,
    );
    if (result.gone) storage.deactivatePushSubscription(sub.id);
  }));
  console.log(`[push] done user=${message.toUserId} sent=${sent}/${subs.length} ctx=${message.contextType || "THREAD"}`);
}

export function schedulePushForMessage(message: Message): void {
  void dispatchPushForMessage(message).catch((error) => {
    console.warn("[push] dispatch failed", error);
  });
}
