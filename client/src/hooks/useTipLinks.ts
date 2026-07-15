import { useQuery } from "@tanstack/react-query";
import { buildTipLinks, type TipLinks } from "@shared/tipSupport";

const FALLBACK = buildTipLinks();

/**
 * Public tip links. Stripe Payment Link comes from Railway env (no rebuild
 * required when you paste a new link). Venmo is always present.
 */
export function useTipLinks(): TipLinks & { loading: boolean } {
  const { data, isLoading } = useQuery<TipLinks>({
    queryKey: ["/api/site/tip-links"],
    queryFn: async () => {
      const r = await fetch("/api/site/tip-links", { credentials: "include" });
      if (!r.ok) return FALLBACK;
      return (await r.json()) as TipLinks;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return {
    ...(data || FALLBACK),
    loading: isLoading && !data,
  };
}
