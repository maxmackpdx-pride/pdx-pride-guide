import { useQuery } from "@tanstack/react-query";
import { buildTipLinks, type TipLinks } from "@shared/tipSupport";

/** Client-side Venmo always works — never wait on the API for coffee tips. */
const LOCAL = buildTipLinks();

/**
 * Public tip links. Venmo is built client-side so About/footer never blank out.
 * Stripe Payment Link (optional) comes from Railway env via /api/site/tip-links.
 */
export function useTipLinks(): TipLinks & { loading: boolean } {
  const { data, isLoading } = useQuery<TipLinks>({
    queryKey: ["/api/site/tip-links"],
    queryFn: async () => {
      const r = await fetch("/api/site/tip-links", { credentials: "include" });
      if (!r.ok) return LOCAL;
      const body = (await r.json()) as Partial<TipLinks>;
      // Prefer server Stripe if present; keep a known-good Venmo pay URL either way.
      return buildTipLinks({
        venmoHandle: body.venmoHandle || LOCAL.venmoHandle,
        stripePaymentLink: body.stripePaymentLink ?? null,
      });
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return {
    ...(data || LOCAL),
    // Venmo never depends on loading — always show the button.
    loading: false,
  };
}
