export const MOBILE_NAV_DISMISS = "pdx-mobile-nav-dismiss";

export type MobileNavDismissExcept =
  | "events"
  | "boards"
  | "inbox"
  | "hub-drawer"
  | "profile"
  | "notify";

export type MobileNavDismissDetail = {
  except?: MobileNavDismissExcept;
};

/** Ask all mobile nav overlays (bottom sheets, hub drawer, etc.) to close. */
export function dismissMobileNavOverlays(except?: MobileNavDismissExcept) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<MobileNavDismissDetail>(MOBILE_NAV_DISMISS, { detail: { except } }),
  );
}