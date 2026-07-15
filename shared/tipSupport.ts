/**
 * Tip / “buy me a coffee” links for the guide.
 * Venmo is always available. Stripe Payment Link (cards + Apple Pay / Google Pay
 * when configured in Stripe) is optional via env.
 */

export const DEFAULT_VENMO_HANDLE = "tucker_pdmax";
export const DEFAULT_TIP_NOTE = "PDX Pride Guide - buy me a coffee";

/**
 * Direct Venmo “pay this person” URL (web + opens app when installed).
 * Uses account.venmo.com/pay which is the reliable Chrome/desktop path.
 */
export function venmoPayUrl(
  handle = DEFAULT_VENMO_HANDLE,
  note = DEFAULT_TIP_NOTE,
  amountDollars?: number | null,
): string {
  const h = handle.replace(/^@/, "").trim() || DEFAULT_VENMO_HANDLE;
  const params = new URLSearchParams({
    txn: "pay",
    audience: "private",
    recipients: h,
    note,
  });
  if (typeof amountDollars === "number" && Number.isFinite(amountDollars) && amountDollars > 0) {
    params.set("amount", String(Math.round(amountDollars * 100) / 100));
  }
  // account.venmo.com/pay is the pay-composer deep link Venmo honors in Chrome.
  return `https://account.venmo.com/pay?${params.toString()}`;
}

/** Profile fallback if pay composer is blocked. */
export function venmoProfileUrl(handle = DEFAULT_VENMO_HANDLE): string {
  const h = handle.replace(/^@/, "").trim() || DEFAULT_VENMO_HANDLE;
  return `https://venmo.com/${encodeURIComponent(h)}`;
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return /^https:\/\//i.test(v);
}

export type TipLinks = {
  venmoUrl: string;
  venmoProfileUrl: string;
  venmoHandle: string;
  /** Stripe Payment Link — enables Apple Pay / Google Pay / cards on the web. */
  stripePaymentLink: string | null;
  /** True when a Stripe link is configured. */
  applePayReady: boolean;
};

export function buildTipLinks(opts?: {
  venmoHandle?: string | null;
  stripePaymentLink?: string | null;
  tipNote?: string | null;
}): TipLinks {
  const handle = (opts?.venmoHandle || DEFAULT_VENMO_HANDLE).replace(/^@/, "").trim() || DEFAULT_VENMO_HANDLE;
  const note = (opts?.tipNote || DEFAULT_TIP_NOTE).trim() || DEFAULT_TIP_NOTE;
  const stripe =
    opts?.stripePaymentLink && isHttpUrl(opts.stripePaymentLink)
      ? opts.stripePaymentLink.trim()
      : null;
  return {
    venmoUrl: venmoPayUrl(handle, note),
    venmoProfileUrl: venmoProfileUrl(handle),
    venmoHandle: handle,
    stripePaymentLink: stripe,
    applePayReady: Boolean(stripe),
  };
}
