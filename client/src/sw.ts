/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { PUSH_NOTIFICATION_BADGE, PUSH_NOTIFICATION_ICON } from "@shared/pushAssets";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
};

// Never precache index.html — a stale shell breaks installed PWA launches after deploy.
const precacheManifest = self.__WB_MANIFEST.filter(entry => {
  const url = typeof entry === "string" ? entry : entry.url;
  return url !== "index.html" && !url.endsWith("/index.html");
});

precacheAndRoute(precacheManifest);
cleanupOutdatedCaches();
clientsClaim();

// Always try the network for navigations so the installed app gets fresh HTML + bundle hashes.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "pdx-navigations",
      networkTimeoutSeconds: 5,
    }),
  ),
);

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function absoluteAsset(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return new URL(clean, self.location.origin).href;
}

async function applyAppBadge(count: number | undefined): Promise<void> {
  const nav = self.navigator as Navigator & {
    setAppBadge?: (count: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  try {
    if (count != null && count > 0 && nav.setAppBadge) {
      await nav.setAppBadge(count);
    } else if (nav.clearAppBadge) {
      await nav.clearAppBadge();
    }
  } catch {
    /* badge API optional */
  }
}

// Web Push — always show a user-visible notification (Safari revokes silent pushes).
// Handles Declarative Web Push (web_push: 8030) and legacy title/body payloads.
self.addEventListener("push", (event) => {
  const show = async () => {
    let title = "PDX Pride Guide";
    let body: string | undefined;
    let url = "/";
    let icon = absoluteAsset(PUSH_NOTIFICATION_ICON);
    let badge = absoluteAsset(PUSH_NOTIFICATION_BADGE);
    let tag = "pdx-pride-guide";
    let appBadge: number | undefined;

    if (event.data) {
      try {
        const payload = event.data.json() as {
          web_push?: number;
          notification?: {
            title?: string;
            body?: string;
            navigate?: string;
            icon?: string;
            badge?: string;
            tag?: string;
            app_badge?: string;
          };
          title?: string;
          body?: string;
          url?: string;
          icon?: string;
        };

        if (payload.web_push === 8030 && payload.notification?.title) {
          const n = payload.notification;
          title = n.title!;
          body = n.body;
          url = n.navigate || "/";
          icon = n.icon ? absoluteAsset(n.icon) : icon;
          badge = n.badge ? absoluteAsset(n.badge) : badge;
          tag = n.tag || tag;
          if (n.app_badge != null) {
            const parsed = parseInt(String(n.app_badge), 10);
            if (!Number.isNaN(parsed)) appBadge = parsed;
          }
        } else {
          title = payload.title || payload.notification?.title || title;
          body = payload.body || payload.notification?.body;
          url = payload.url || payload.notification?.navigate || "/";
          icon = payload.icon ? absoluteAsset(payload.icon) : icon;
          badge = payload.notification?.badge ? absoluteAsset(payload.notification.badge) : badge;
          if (payload.notification?.app_badge != null) {
            const parsed = parseInt(String(payload.notification.app_badge), 10);
            if (!Number.isNaN(parsed)) appBadge = parsed;
          }
        }
      } catch {
        try {
          const text = event.data.text();
          if (text) body = text.slice(0, 180);
        } catch {
          /* ignore */
        }
      }
    }

    await self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      // Safari/Chromium support renotify; DOM lib typings lag behind.
      renotify: true,
      data: { url },
    } as NotificationOptions);

    await applyAppBadge(appBadge);
  };

  event.waitUntil(show());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data?.url as string) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ("focus" in client) {
          const url = new URL(target, self.location.origin).href;
          if (client.url.startsWith(self.location.origin)) {
            return client.focus().then(c => {
              if ("navigate" in c) return (c as WindowClient).navigate(url);
            });
          }
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});