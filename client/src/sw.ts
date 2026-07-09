/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

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

// Web Push — always show a user-visible notification (Safari revokes silent pushes).
// Handles Declarative Web Push (web_push: 8030) and legacy title/body payloads.
self.addEventListener("push", (event) => {
  const show = async () => {
    let title = "PDX Pride Guide";
    let body: string | undefined;
    let url = "/";
    let icon = "/icons/icon-192.png";
    let tag = "pdx-pride-guide";

    if (event.data) {
      try {
        const payload = event.data.json() as {
          web_push?: number;
          notification?: {
            title?: string;
            body?: string;
            navigate?: string;
            icon?: string;
            tag?: string;
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
          icon = n.icon || icon;
          tag = n.tag || tag;
        } else {
          title = payload.title || payload.notification?.title || title;
          body = payload.body || payload.notification?.body;
          url = payload.url || payload.notification?.navigate || "/";
          icon = payload.icon || payload.notification?.icon || icon;
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
      tag,
      // Safari/Chromium support renotify; DOM lib typings lag behind.
      renotify: true,
      data: { url },
    } as NotificationOptions);
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