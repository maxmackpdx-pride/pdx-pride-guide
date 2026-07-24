import { canUseWebPush, isStandalonePwa, pushPlatform, waitForServiceWorker } from "@/lib/pwa";

/** Decode VAPID public key for PushManager.subscribe (Safari is picky about ArrayBuffer). */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength);
}

export async function fetchPushConfig(): Promise<{ configured: boolean; publicKey: string | null }> {
  const res = await fetch("/api/push/vapid-public-key", { credentials: "include" });
  if (!res.ok) return { configured: false, publicKey: null };
  return res.json();
}

export function shouldShowInstallBeforePush(): boolean {
  return pushPlatform() === "ios" && !isStandalonePwa();
}

export function isPushPermissionPending(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "default";
}

export const PUSH_STATE_EVENT = "pdx-push-state-change";

export function emitPushStateChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PUSH_STATE_EVENT));
  }
}

export async function hasPushSubscription(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}

/** Re-register the browser subscription with the server after login (idempotent). */
export async function syncPushSubscriptionWithServer(): Promise<void> {
  if (!canUseWebPush()) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const config = await fetchPushConfig();
  if (!config.configured || !config.publicKey) return;

  const registration = await waitForServiceWorker();
  if (!registration) return;

  try {
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(config.publicKey),
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
        platform: pushPlatform(),
      }),
    });
    if (res.ok) emitPushStateChange();
  } catch {
    /* non-blocking - inbox still works */
  }
}

export async function subscribeToPush(): Promise<"granted" | "denied" | "unsupported" | "install_required" | "not_configured"> {
  if (!canUseWebPush()) return "unsupported";
  if (shouldShowInstallBeforePush()) return "install_required";

  const config = await fetchPushConfig();
  if (!config.configured || !config.publicKey) return "not_configured";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const registration = await waitForServiceWorker();
  if (!registration?.active && !registration?.pushManager) return "unsupported";

  // Ensure active worker before subscribe (Push API InvalidStateError otherwise).
  if (!registration.active) {
    try {
      await navigator.serviceWorker.ready;
    } catch {
      return "unsupported";
    }
  }

  let subscription: PushSubscription | null = null;
  try {
    const existing = await registration.pushManager.getSubscription();
    subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(config.publicKey),
    });
  } catch (err) {
    console.warn("[push] subscribe failed", err);
    return "unsupported";
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "unsupported";

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      platform: pushPlatform(),
    }),
  });
  if (!res.ok) return "unsupported";
  emitPushStateChange();
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
  emitPushStateChange();
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
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          platform: pushPlatform(),
        }),
      });
    });
  });
}