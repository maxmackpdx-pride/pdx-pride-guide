export const PUSH_CATEGORIES = ["messages", "my_events", "account", "admin"] as const;
export type PushCategory = (typeof PUSH_CATEGORIES)[number];

export type NotificationPrefs = Record<PushCategory, boolean>;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  messages: true,
  my_events: true,
  account: true,
  admin: false,
};

const MESSAGE_CONTEXT_TYPES = new Set([
  "THREAD",
  "MISSED_CONNECTION",
  "GIG",
  "GIFTING",
  "CHECK_IN",
  "EVENT_HOST",
]);

const MY_EVENTS_CONTEXT_TYPES = new Set([
  "HOST_UPDATE",
  "HOST_MESSAGE",
  "EVENT_TALENT",
  "EVENT_TALENT_REQUEST",
]);

const ACCOUNT_CONTEXT_TYPES = new Set([
  "SUBMISSION",
  "EVENT_CLAIM",
  "PROMOTER",
  "GUIDE_UPDATE",
]);

export function pushCategoryForContext(contextType?: string | null): PushCategory {
  const ctx = String(contextType || "THREAD").toUpperCase();
  if (MY_EVENTS_CONTEXT_TYPES.has(ctx)) return "my_events";
  if (ACCOUNT_CONTEXT_TYPES.has(ctx)) return "account";
  if (MESSAGE_CONTEXT_TYPES.has(ctx)) return "messages";
  return "messages";
}

export function parseNotificationPrefs(raw: unknown, isAdmin = false): NotificationPrefs {
  const base = { ...DEFAULT_NOTIFICATION_PREFS };
  if (isAdmin) base.admin = true;
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const key of PUSH_CATEGORIES) {
    if (typeof obj[key] === "boolean") base[key] = obj[key];
  }
  if (!isAdmin) base.admin = false;
  return base;
}