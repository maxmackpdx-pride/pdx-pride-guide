import { lazy, type ComponentType } from "react";
import { clearPwaCaches } from "@/lib/pwa";

const RELOAD_KEY = "zaylist-stale-asset-reload-at";
const RELOAD_COOLDOWN_MS = 60_000;
let recoveryStarted = false;

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
  if (recoveryStarted) return true;

  const lastAttempt = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - lastAttempt < RELOAD_COOLDOWN_MS) return false;

  recoveryStarted = true;
  window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  void clearPwaCaches()
    .catch(() => {})
    .finally(() => window.location.reload());
  return true;
}

/** Catch Vite preload failures, including CSS failures that happen before a
 * React.lazy promise reaches the route error boundary. */
export function installStaleAssetRecovery() {
  if (typeof window === "undefined") return;
  window.addEventListener("vite:preloadError", (event) => {
    const preloadEvent = event as Event & { payload?: unknown };
    if (recoverFromStaleAsset(preloadEvent.payload)) event.preventDefault();
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (recoverFromStaleAsset(event.reason)) event.preventDefault();
  });
}

// After a deploy, hashed chunk filenames change and a cached page can
// request a chunk that no longer exists. When that happens, clear SW
// caches and reload once instead of crashing to the error boundary.
//
// Do NOT clear the session key on success  -  clearing it allowed another
// failed lazy import later in the same session to reload again (reload loop).
export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch(async (err) => {
      if (recoverFromStaleAsset(err)) {
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }),
  );
}
