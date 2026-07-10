/** Username normalization and change cooldown (once per 6 months). */

export function normalizeUsername(raw: unknown): string | null {
  const trimmed = String(raw || "").trim().replace(/^@/, "").toLowerCase();
  const clean = trimmed.replace(/[^a-z0-9_]/g, "");
  if (clean.length < 3 || clean.length > 32) return null;
  return clean;
}

export function usernameChangeEligibility(changedAt: string | null | undefined): {
  canChange: boolean;
  nextChangeAt: string | null;
} {
  if (!changedAt) return { canChange: true, nextChangeAt: null };
  const last = new Date(changedAt);
  if (Number.isNaN(last.getTime())) return { canChange: true, nextChangeAt: null };
  const next = new Date(last);
  next.setMonth(next.getMonth() + 6);
  return {
    canChange: Date.now() >= next.getTime(),
    nextChangeAt: next.toISOString(),
  };
}

export function formatUsernameChangeDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}