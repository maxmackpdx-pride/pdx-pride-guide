/**
 * Map GET /api/events/attendance-summaries preview rows → ProfileUserChip[]
 * for Going facepiles (The Big One, Going rail).
 */
import type { AttendancePreviewBubble, AttendanceSummary } from "@/lib/attendanceBubble";
import type { ProfileUserChip } from "./types";

export type AttendanceSummaryMap = Record<string | number, AttendanceSummary>;

/** Server marks anonymous with userId null, initials "?", avatarSeed "anon-{id}". */
function isAnonymousOrMasked(bubble: AttendancePreviewBubble): boolean {
  const seed = String(bubble.avatarSeed || "");
  if (seed.startsWith("anon-")) return true;
  if (bubble.initials === "?" && bubble.userId == null && !bubble.photoUrl) return true;
  return false;
}

/**
 * Convert attendance summary preview bubbles into UserAvatar-ready chips.
 * Skips anonymous/masked entries so we never leak or invent faces.
 */
export function mapAttendancePreviewToChips(
  preview: AttendancePreviewBubble[] | null | undefined,
  opts?: { max?: number },
): ProfileUserChip[] {
  if (!preview?.length) return [];
  const max = opts?.max ?? 4;
  const chips: ProfileUserChip[] = [];

  for (const bubble of preview) {
    if (chips.length >= max) break;
    if (isAnonymousOrMasked(bubble)) continue;

    const seed = String(bubble.avatarSeed || "").replace(/^@/, "").trim();
    // avatarSeed is handle (or seed); UserAvatar needs username/displayName for a11y.
    const username =
      seed && !seed.startsWith("anon-") ? seed : `member-${bubble.userId ?? bubble.id}`;
    const displayFromInitials =
      bubble.initials && bubble.initials !== "?" ? bubble.initials : null;

    chips.push({
      // Prefer stable user id when present; fall back to attendance row id.
      id: bubble.userId ?? bubble.id,
      username,
      displayName: displayFromInitials || username,
      photoUrl: bubble.photoUrl ?? null,
      avatarChoice: bubble.avatarChoice ?? undefined,
      avatarRing: bubble.avatarRing ?? null,
    });
  }

  return chips;
}

export function summaryForEvent(
  summaries: AttendanceSummaryMap | null | undefined,
  eventId: number,
): AttendanceSummary | null {
  if (!summaries) return null;
  return summaries[eventId] ?? summaries[String(eventId)] ?? null;
}

/** Chips for one event id from the summaries map (empty when none / all anonymous). */
export function chipsForEvent(
  summaries: AttendanceSummaryMap | null | undefined,
  eventId: number,
  max = 4,
): ProfileUserChip[] {
  const summary = summaryForEvent(summaries, eventId);
  return mapAttendancePreviewToChips(summary?.preview, { max });
}
