/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Network-first for SPA navigations — avoids stale HTML after deploy.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "pdx-navigations",
      networkTimeoutSeconds: 4,
    }),
  ),
);

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