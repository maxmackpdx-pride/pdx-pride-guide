/**
 * Board 19: one clock behind the cards. Both styles read the same elapsed time, so
 * the math can't drift. Card copy is unchanged, word for word.
 */
const MINUTE = 60_000, HOUR = 60 * MINUTE, DAY = 24 * HOUR;

function elapsed(iso?: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  return Number.isFinite(then) ? now - then : null;
}

/** Feed precision: "just now", "5m ago", "3h ago", "2d ago"; future times read "in 3h". */
export function timeAgo(iso: string, now = Date.now()): string {
  const diff = elapsed(iso, now);
  if (diff === null) return "";
  // Future timestamps (party nights used as feed activity) - don't say "just now"
  if (diff < 0) {
    const ahead = -diff;
    if (ahead < MINUTE) return "soon";
    const mins = Math.floor(ahead / MINUTE);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 48) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
  }
  if (diff < MINUTE) return "just now";
  const mins = Math.floor(diff / MINUTE);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Profile precision: "today", "3d ago", "2w ago", then the date ("Jul 16"). */
export function timeAgoCoarse(iso?: string | null, now = Date.now()): string {
  const diff = elapsed(iso, now);
  if (diff === null) return "";
  const days = Math.floor(diff / DAY);
  if (days <= 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso!).toLocaleDateString([], { month: "short", day: "numeric" });
}
