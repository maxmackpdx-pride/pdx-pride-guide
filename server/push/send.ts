import webpush from "web-push";
import { PUSH_NOTIFICATION_BADGE, PUSH_NOTIFICATION_ICON } from "@shared/pushAssets";
import { ensureVapidConfigured } from "./vapid";

const SITE_ORIGIN = (
  process.env.PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://www.zaylist.com"
).replace(/\/$/, "");

/**
 * Declarative Web Push payload (Safari 18.4+ / WebKit) plus legacy top-level
 * title/body/url so older SW handlers still render if declarative parsing fails.
 *
 * `mutable: true` forces the service worker push event so our SW can call
 * showNotification even when the browser's declarative path is flaky.
 * @see https://webkit.org/blog/16535/meet-declarative-web-push/
 */
export type DeclarativePushPayload = {
  web_push: 8030;
  mutable: true;
  notification: {
    title: string;
    body?: string;
    navigate: string;
    lang?: string;
    dir?: "ltr" | "rtl" | "auto";
    silent?: boolean;
    app_badge?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    renotify?: boolean;
  };
  /** Legacy fields for non-declarative SW handlers */
  title: string;
  body?: string;
  url: string;
  icon?: string;
};

export type PushSendResult =
  | { ok: true; statusCode?: number }
  | { ok: false; statusCode?: number; gone: boolean; error?: string };

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN.replace(/\/$/, "")}${clean}`;
}

export function buildDeclarativePayload(input: {
  title: string;
  body?: string;
  navigate: string;
  badge?: number;
  tag?: string;
}): DeclarativePushPayload {
  const title = (input.title || "Zaylist").trim().slice(0, 120) || "Zaylist";
  const body = input.body?.replace(/\s+/g, " ").trim().slice(0, 180) || undefined;
  const navigate = absoluteUrl(input.navigate || "/");
  const icon = absoluteUrl(PUSH_NOTIFICATION_ICON);
  const badge = absoluteUrl(PUSH_NOTIFICATION_BADGE);

  return {
    web_push: 8030,
    mutable: true,
    notification: {
      title,
      ...(body ? { body } : {}),
      navigate,
      lang: "en-US",
      dir: "ltr",
      silent: false,
      icon,
      badge,
      tag: input.tag || "zaylist",
      renotify: true,
      ...(input.badge != null && input.badge > 0 ? { app_badge: String(input.badge) } : {}),
    },
    title,
    ...(body ? { body } : {}),
    url: navigate,
    icon,
  };
}

export async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: DeclarativePushPayload,
): Promise<PushSendResult> {
  if (!ensureVapidConfigured()) {
    return { ok: false, gone: false, error: "VAPID not configured" };
  }

  try {
    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 12,
        urgency: "high",
        // Prefer modern encryption; web-push defaults to aes128gcm.
        contentEncoding: "aes128gcm",
      },
    );
    return { ok: true, statusCode: result?.statusCode };
  } catch (error: any) {
    const statusCode = Number(error?.statusCode || error?.status || 0) || undefined;
    const gone = statusCode === 410 || statusCode === 404;
    const bodySnippet = typeof error?.body === "string"
      ? error.body.slice(0, 300)
      : error?.message
        ? String(error.message).slice(0, 300)
        : undefined;
    console.warn(
      `[push] web-push error status=${statusCode ?? "unknown"} gone=${gone} body=${bodySnippet || "n/a"}`,
    );
    return { ok: false, statusCode, gone, error: bodySnippet };
  }
}
