import { lazy, type ComponentType } from "react";
import { clearPwaCaches } from "@/lib/pwa";

// After a deploy, hashed chunk filenames change and a cached page can
// request a chunk that no longer exists. When that happens, clear SW
// caches and reload once instead of crashing to the error boundary.
//
// Do NOT clear the session key on success — clearing it allowed another
// failed lazy import later in the same session to reload again (reload loop).
export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  const key = "bundle-reload";
  return lazy(() =>
    factory().catch(async (err) => {
      if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        await clearPwaCaches().catch(() => {});
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }),
  );
}
