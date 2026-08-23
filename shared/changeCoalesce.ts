/** Burst-edit window for saved-post “what changed” bumps. Last label wins. */
export const CHANGE_COALESCE_MS = 20 * 60 * 1000;

/** One nudge per housing request, after the other person has had time to answer. */
export const HOUSING_NUDGE_AFTER_MS = 48 * 60 * 60 * 1000;

export function shouldCoalesceChange(
  previousBumpIso: string | null | undefined,
  nowMs: number,
  windowMs = CHANGE_COALESCE_MS,
): boolean {
  if (!previousBumpIso) return false;
  const prev = Date.parse(previousBumpIso);
  if (!Number.isFinite(prev)) return false;
  return nowMs - prev >= 0 && nowMs - prev < windowMs;
}

export function canSendHousingNudge(
  createdAtIso: string | null | undefined,
  nudgeSentAt: string | null | undefined,
  nowMs: number,
  waitMs = HOUSING_NUDGE_AFTER_MS,
): boolean {
  if (nudgeSentAt) return false;
  if (!createdAtIso) return false;
  const created = Date.parse(createdAtIso);
  if (!Number.isFinite(created)) return false;
  return nowMs - created >= waitMs;
}
