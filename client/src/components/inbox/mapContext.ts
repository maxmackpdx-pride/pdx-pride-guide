import type { Category } from "./types";

export function categoryFromContext(contextType?: string | null): Category {
  const ctx = String(contextType || "").toUpperCase();
  if (ctx === "MISSED_CONNECTION") return "spotted";
  if (ctx === "EVENT_TALENT_REQUEST" || ctx === "GIG" || ctx === "EVENT_TALENT") {
    return "gigs";
  }
  // Gift / ISO interest threads — never "Host" (that badge is for event hosts).
  if (ctx === "GIFTING") return "gifting";
  if (
    ctx === "HOST_UPDATE"
    || ctx === "HOST_MESSAGE"
    || ctx === "EVENT_HOST"
    || ctx === "EVENT_INVITE"
    || ctx === "EVENT_CLAIM"
  ) {
    return "hosts";
  }
  if (
    ctx === "CHECK_IN"
    || ctx === "RIVER_BRATS_CHECKIN"
    || ctx === "BEACH_CARPOOL"
  ) {
    return "checkins";
  }
  // Shared admin / guide notices (photo reject, queue outcomes, admin DMs).
  if (
    ctx === "GUIDE_UPDATE"
    || ctx === "PROFILE_PHOTO"
    || ctx === "ADMIN_MESSAGE"
    || ctx === "ADMIN_ALERT"
    || ctx === "SUBMISSION"
    || ctx === "PROMOTER"
  ) {
    return "hosts";
  }
  // Generic DMs / guide updates — neutral host bucket is wrong; keep hosts only
  // for true event-host traffic above. Fallback = hosts for unknown legacy rows
  // that were already event-adjacent, but GIFTING is handled explicitly.
  return "hosts";
}

export function formatThreadTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}