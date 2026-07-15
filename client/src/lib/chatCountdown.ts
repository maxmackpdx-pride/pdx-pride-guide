/** Live countdown helpers for event / beach group chats in the floating inbox. */

/** Time remaining until a chat opens (or closes, if you pass closesAt). */
export function formatDurationUntil(iso: string | null | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const ms = t - now;
  if (ms <= 0) return null;
  const totalSec = Math.ceil(ms / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

/** “Opens in 12h 4m” / “Opens soon” for BEFORE windows. */
export function formatOpensIn(opensAt: string | null | undefined, now = Date.now()): string | null {
  const left = formatDurationUntil(opensAt, now);
  if (!left) return null;
  return `Opens in ${left}`;
}

/** “2h 14m left” while OPEN (until closesAt). */
export function formatClosesIn(closesAt: string | null | undefined, now = Date.now()): string | null {
  const left = formatDurationUntil(closesAt, now);
  if (!left) return "Chat closed";
  return `${left} left`;
}

export function formatOpensAtWall(opensAt: string | null | undefined): string | null {
  if (!opensAt) return null;
  const d = new Date(opensAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
