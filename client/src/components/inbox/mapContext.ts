import type { Category } from "./types";

export function categoryFromContext(contextType?: string | null): Category {
  if (contextType === "MISSED_CONNECTION") return "spotted";
  if (contextType === "EVENT_TALENT_REQUEST" || contextType === "GIG" || contextType === "EVENT_TALENT") {
    return "gigs";
  }
  if (
    contextType === "HOST_UPDATE"
    || contextType === "HOST_MESSAGE"
    || contextType === "EVENT_HOST"
  ) {
    return "hosts";
  }
  if (contextType === "CHECK_IN") return "checkins";
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