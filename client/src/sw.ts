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

// Phase 2+ extends these handlers for Web Push.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json() as {
      web_push?: number;
      notification?: {
        title?: string;
        body?: string;
        navigate?: string;
        icon?: string;
      };
      title?: string;
      body?: string;
      url?: string;
      icon?: string;
    };

    if (payload.web_push === 8030 && payload.notification?.title) {
      const n = payload.notification;
      event.waitUntil(
        self.registration.showNotification(n.title!, {
          body: n.body,
          icon: n.icon || "/icons/icon-192.png",
          data: { url: n.navigate || "/" },
        }),
      );
      return;
    }

    const title = payload.title || payload.notification?.title;
    if (!title) return;
    event.waitUntil(
      self.registration.showNotification(title, {
        body: payload.body || payload.notification?.body,
        icon: payload.icon || "/icons/icon-192.png",
        data: { url: payload.url || payload.notification?.navigate || "/" },
      }),
    );
  } catch {
    /* ignore malformed push payloads */
  }
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