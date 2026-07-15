/**
 * Tip / “buy me a coffee” links for the guide.
 * Venmo is always available. Stripe Payment Link (cards + Apple Pay / Google Pay
 * when configured in Stripe) is optional via env.
 */

export const DEFAULT_VENMO_HANDLE = "tucker_pdmax";

/** Open Venmo to pay @handle with a prefilled note. */
export function venmoPayUrl(handle = DEFAULT_VENMO_HANDLE, note = "PDX Pride Guide"): string {
  const h = handle.replace(/^@/, "").trim() || DEFAULT_VENMO_HANDLE;
  const params = new URLSearchParams({
    txn: "pay",
    note,
  });
  return `https://venmo.com/${encodeURIComponent(h)}?${params.toString()}`;
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return /^https:\/\//i.test(v);
}

export type TipLinks = {
  venmoUrl: string;
  venmoHandle: string;
  /** Stripe Payment Link — enables Apple Pay / Google Pay / cards on the web. */
  stripePaymentLink: string | null;
  /** True when a Stripe link is configured. */
  applePayReady: boolean;
};

export function buildTipLinks(opts?: {
  venmoHandle?: string | null;
  stripePaymentLink?: string | null;
}): TipLinks {
  const handle = (opts?.venmoHandle || DEFAULT_VENMO_HANDLE).replace(/^@/, "").trim() || DEFAULT_VENMO_HANDLE;
  const stripe =
    opts?.stripePaymentLink && isHttpUrl(opts.stripePaymentLink)
      ? opts.stripePaymentLink.trim()
      : null;
  return {
    venmoUrl: venmoPayUrl(handle),
    venmoHandle: handle,
    stripePaymentLink: stripe,
    applePayReady: Boolean(stripe),
  };
}
