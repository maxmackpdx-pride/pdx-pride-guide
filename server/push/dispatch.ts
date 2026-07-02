import type { Message } from "@shared/schema";
import { pushCategoryForContext } from "@shared/pushCategories";
import { storage } from "../storage";
import { buildPushPayloadForMessage } from "./templates";
import { sendPushToSubscription } from "./send";

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
  if (!message?.toUserId || message.fromUserId === message.toUserId) return;

  const category = pushCategoryForContext(message.contextType);
  const prefs = storage.getNotificationPrefs(message.toUserId);
  if (!prefs[category]) return;
  if (!withinRateLimit(message.toUserId)) return;

  const unreadCount = storage.getUnreadCount(message.toUserId);
  const payload = buildPushPayloadForMessage(message, unreadCount);
  const subs = storage.getActivePushSubscriptions(message.toUserId);
  if (subs.length === 0) return;

  await Promise.all(subs.map(async (sub) => {
    const result = await sendPushToSubscription(sub, payload);
    if (result.ok) {
      storage.touchPushSubscription(sub.id);
      return;
    }
    if (result.gone) storage.deactivatePushSubscription(sub.id);
  }));
}

export function schedulePushForMessage(message: Message): void {
  void dispatchPushForMessage(message).catch((error) => {
    console.warn("[push] dispatch failed", error);
  });
}