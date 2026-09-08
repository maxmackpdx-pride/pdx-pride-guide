import type { Category } from "./types";

export function categoryFromContext(contextType?: string | null): Category {
  const ctx = String(contextType || "").toUpperCase();
  if (ctx === "MISSED_CONNECTION") return "spotted";
  if (ctx === "EVENT_TALENT_REQUEST" || ctx === "GIG" || ctx === "EVENT_TALENT") {
    return "gigs";
  }
  // Gift / ISO interest threads - never "Host" (that badge is for event hosts).
  if (ctx === "GIFTING") return "gifting";
  // Marketplace interest and seller-selection threads stay distinct from hosts.
  if (ctx === "SELLZ") return "sellz";
  // HAUSING: request to chat and request to join share one thread context.
  if (ctx === "HOUSING") return "housing";
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
  // Ordinary conversations and account notices do not imply an event host.
  return "messages";
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
