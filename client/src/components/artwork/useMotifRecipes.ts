import { useEffect, useSyncExternalStore } from "react";
import snapshot from "@/lib/motifRecipes.snapshot";
import { MOTIF_RECIPES_URL, parseMotifRecipes, type MotifRecipes } from "@/lib/designMotifRecipes";

// The snapshot is checked at build time and again here. A failed refresh keeps it intact.
let recipes: MotifRecipes | null = snapshot ? parseMotifRecipes(snapshot) : null;
let request: Promise<void> | undefined;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const read = () => recipes;

function refresh() {
  return request ??= (async () => {
    try {
      const response = await fetch(MOTIF_RECIPES_URL, { credentials: "omit", signal: AbortSignal.timeout(8000) });
      if (!response.ok) return;
      const next = parseMotifRecipes(await response.json());
      if (next.release === recipes?.release) return;
      recipes = next;
      listeners.forEach(listener => listener());
    } catch {
      // Network, CORS, or incomplete-release errors must not erase checked artwork.
    }
  })();
}

/** One shared request per page, regardless of how many cards mount. */
export function useMotifRecipes() {
  const current = useSyncExternalStore(subscribe, read, read);
  useEffect(() => { void refresh(); }, []);
  return current;
}
