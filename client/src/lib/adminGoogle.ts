/** Helpers for the Admin page "Continue with Google" button. */

export const ADMIN_SIGNATURE_STASH_KEY = "zaylist.admin.approvalSignature";
export const ADMIN_GOOGLE_START_URL = "/api/auth/google?intent=admin&returnTo=%2Fadmin";
export const ADMIN_GOOGLE_LINK_URL = "/api/auth/google?link=1&returnTo=%2Fadmin";

export type AdminGoogleErrorCode =
  | "cancelled" | "expired" | "unauthorized" | "link_required" | "failed" | "unavailable";

export const ADMIN_GOOGLE_ERROR_MESSAGES: Record<AdminGoogleErrorCode, string> = {
  cancelled: "Google sign-in was canceled. Nothing changed. You can try again or use your password.",
  expired: "That Google sign-in expired. Please try again.",
  unauthorized: "That Google account doesn't have admin access to Zaylist.",
  link_required: "Link required: sign in with your password first, then choose “Link Google” in the Admin toolbar. After that, Continue with Google will work.",
  failed: "Google sign-in didn't finish. Please try again, or use your password.",
  unavailable: "Google sign-in isn't available right now. Please use your password.",
};

export function readGoogleAdminError(search: string): AdminGoogleErrorCode | null {
  const value = new URLSearchParams(search).get("google_error");
  return value && Object.prototype.hasOwnProperty.call(ADMIN_GOOGLE_ERROR_MESSAGES, value)
    ? (value as AdminGoogleErrorCode)
    : null;
}

type StashStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StashStorage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null; // Safari private mode / blocked storage
  }
}

/** Keep the Approval signature across the Google redirect. Display text only; the server never trusts it for auth. */
export function stashApprovalSignature(value: string, store: StashStorage | null = defaultStorage()): void {
  const v = value.trim().slice(0, 80);
  if (!store || !v) return;
  try { store.setItem(ADMIN_SIGNATURE_STASH_KEY, v); } catch { /* storage full or blocked */ }
}

/** Read and clear the stashed signature (one use). */
export function takeApprovalSignature(store: StashStorage | null = defaultStorage()): string | null {
  if (!store) return null;
  try {
    const v = store.getItem(ADMIN_SIGNATURE_STASH_KEY);
    store.removeItem(ADMIN_SIGNATURE_STASH_KEY);
    return v && v.trim() ? v.trim().slice(0, 80) : null;
  } catch {
    return null;
  }
}
