import { lazy, type ComponentType } from "react";

// After a deploy, hashed chunk filenames change and a cached page can
// request a chunk that no longer exists. When that happens, reload once
// to pick up the fresh bundle instead of crashing to the error boundary.
export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  const key = "bundle-reload";
  return lazy(() =>
    factory().then((mod) => {
      if (typeof window !== "undefined") sessionStorage.removeItem(key);
      return mod;
    }).catch((err) => {
      if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }),
  );
}
