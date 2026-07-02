import { canUseWebPush, isIosDevice, isStandalonePwa, waitForServiceWorker } from "@/lib/pwa";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export async function fetchPushConfig(): Promise<{ configured: boolean; publicKey: string | null }> {
  const res = await fetch("/api/push/vapid-public-key", { credentials: "include" });
  if (!res.ok) return { configured: false, publicKey: null };
  return res.json();
}

export function shouldShowInstallBeforePush(): boolean {
  return isIosDevice() && !isStandalonePwa();
}

export async function subscribeToPush(): Promise<"granted" | "denied" | "unsupported" | "install_required" | "not_configured"> {
  if (!canUseWebPush()) return "unsupported";
  if (shouldShowInstallBeforePush()) return "install_required";

  const config = await fetchPushConfig();
  if (!config.configured || !config.publicKey) return "not_configured";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const registration = await waitForServiceWorker();
  if (!registration) return "unsupported";

  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(config.publicKey),
  });

  const json = subscription.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      platform: isIosDevice() ? "ios" : "desktop",
    }),
  });
  if (!res.ok) return "unsupported";
  return "granted";
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await waitForServiceWorker();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}

export function listenForPushSubscriptionChanges(): void {
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.ready.then((registration) => {
    registration.addEventListener("pushsubscriptionchange", async () => {
      const config = await fetchPushConfig();
      if (!config.publicKey) return;
      const next = await registration.pushManager.getSubscription();
      if (!next) return;
      const json = next.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
    });
  });
}