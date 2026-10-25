import { lazy, type ComponentType } from "react";
import { clearPwaCaches } from "@/lib/pwa";

const RELOAD_KEY = "zaylist-stale-asset-reload-at";
const RELOAD_COOLDOWN_MS = 60_000;
// Safari can leave service-worker/cache cleanup pending forever. Never let that
// strand a route on its loading spinner: reload anyway after this long.
const CLEANUP_TIMEOUT_MS = 3_000;
// If the reload still has not navigated away this long after recovery began,
// stop swallowing the error so the route error boundary can offer a retry.
export const RECOVERY_WATCHDOG_MS = 10_000;
let recoveryStarted = false;
let recoveryFailed = false;

export function isStaleAssetLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|Unable to preload CSS|error loading dynamically imported module/i.test(message);
}

/**
 * Start one cache-clearing reload for a stale hashed JS/CSS asset. Returning
 * true means the caller should suppress the error while navigation begins.
 */
export function recoverFromStaleAsset(error: unknown): boolean {
  if (typeof window === "undefined" || !isStaleAssetLoadError(error)) return false;
  if (recoveryStarted) return !recoveryFailed;

  let lastAttempt = 0;
  try { lastAttempt = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0); } catch { /* storage may be disabled */ }
  if (Date.now() - lastAttempt < RELOAD_COOLDOWN_MS) return false;

  try { window.sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch { return false; }
  recoveryStarted = true;
  let reloaded = false;
  const reload = () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  };
  const cleanupTimer = setTimeout(reload, CLEANUP_TIMEOUT_MS);
  void Promise.resolve()
    .then(() => clearPwaCaches())
    .catch(() => {})
    .finally(() => { clearTimeout(cleanupTimer); reload(); });
  // The reload never took us anywhere: let pending lazy() imports reject.
  setTimeout(() => { recoveryFailed = true; }, RECOVERY_WATCHDOG_MS);
  return true;
}

/** Catch Vite preload failures, including CSS failures that happen before a
 * React.lazy promise reaches the route error boundary. */
export function installStaleAssetRecovery() {
  if (typeof window === "undefined") return;
  window.addEventListener("vite:preloadError", (event) => {
    const preloadEvent = event as Event & { payload?: unknown };
    // Vite returns undefined when this event is cancelled. React.lazy then
    // crashes reading module.default instead of reaching our import catch.
    // Start recovery, but preserve the rejection for lazyWithReload to handle.
    recoverFromStaleAsset(preloadEvent.payload);
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (recoverFromStaleAsset(event.reason)) event.preventDefault();
  });
}

// After a deploy, hashed chunk filenames change and a cached page can
// request a chunk that no longer exists. When that happens, clear SW
// caches and reload once instead of crashing to the error boundary.
//
// Keep the cooldown across navigation to prevent reload loops.
export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch(async (err) => {
      if (recoverFromStaleAsset(err)) {
        // Hold the Suspense fallback while the reload starts, but never forever.
        return new Promise<{ default: T }>((_resolve, reject) => {
          setTimeout(() => reject(err), RECOVERY_WATCHDOG_MS);
        });
      }
      throw err;
    }),
  );
}
