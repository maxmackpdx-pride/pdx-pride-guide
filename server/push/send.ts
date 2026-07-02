import webpush from "web-push";
import { ensureVapidConfigured } from "./vapid";

const SITE_ORIGIN = process.env.PUBLIC_SITE_URL || "https://www.prideguidepdx.com";

export type DeclarativePushPayload = {
  web_push: 8030;
  notification: {
    title: string;
    body?: string;
    navigate: string;
    lang?: string;
    dir?: "ltr" | "rtl";
    silent?: boolean;
    app_badge?: string;
    icon?: string;
  };
};

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
}): DeclarativePushPayload {
  return {
    web_push: 8030,
    notification: {
      title: input.title,
      body: input.body?.slice(0, 180),
      navigate: absoluteUrl(input.navigate),
      lang: "en-US",
      dir: "ltr",
      icon: absoluteUrl("/icons/icon-192.png"),
      ...(input.badge != null && input.badge > 0 ? { app_badge: String(input.badge) } : {}),
    },
  };
}

export async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: DeclarativePushPayload,
): Promise<{ ok: true } | { ok: false; statusCode?: number; gone: boolean }> {
  if (!ensureVapidConfigured()) return { ok: false, gone: false };

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    );
    return { ok: true };
  } catch (error: any) {
    const statusCode = Number(error?.statusCode || error?.status || 0) || undefined;
    const gone = statusCode === 410 || statusCode === 404;
    return { ok: false, statusCode, gone };
  }
}