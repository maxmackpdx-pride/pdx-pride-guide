type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  // iPadOS 13+ often reports a desktop Macintosh UA.
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

export function pushPlatform(): "ios" | "android" | "desktop" {
  if (isIosDevice()) return "ios";
  if (isAndroidDevice()) return "android";
  return "desktop";
}

export function canUseWebPush(): boolean {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

export function captureInstallPrompt(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent("pdx-pwa-install-available"));
  });
}

export function hasInstallPrompt(): boolean {
  return deferredInstallPrompt != null;
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredInstallPrompt) return "unavailable";
  const prompt = deferredInstallPrompt;
  deferredInstallPrompt = null;
  await prompt.prompt();
  const choice = await prompt.userChoice;
  return choice.outcome;
}

export async function clearPwaCaches(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    // Snapshot before register(): clientsClaim() on first install (and any
    // first control of this document) fires controllerchange even when the
    // page already has the latest shell. Reloading in that case makes every
    // cold open of / flash a full second load.
    const hadController = navigator.serviceWorker.controller != null;

    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        // Activate immediately only when replacing an already-controlling SW
        // (post-deploy update). First install activates on its own.
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          worker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });

    // Only auto-reload when an *updated* worker takes over a page that was
    // already controlled. First-time claim must not force a reload.
    if (hadController) {
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    }

    return registration;
  } catch (error) {
    console.warn("[pwa] service worker registration failed", error);
    return null;
  }
}

export async function waitForServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    // Prefer ready so pushManager.subscribe has an active worker (required by Push API).
    const ready = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (ready) return ready;

    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing?.active) return existing;
    return registerServiceWorker();
  } catch {
    return registerServiceWorker();
  }
}