/**
 * Admin account actions on public profiles: suspend / shadow-ban / delete.
 * Reasons are short summaries of Community Standards violations.
 */

export const ACCOUNT_MOD_REASONS = [
  { code: "RACE_PLAY", label: "Race play or hate-based roleplay" },
  { code: "SCAT", label: "Scat play" },
  { code: "BLOOD", label: "Blood play" },
  { code: "WEAPONS", label: "Knife, gun, or weapon play" },
  { code: "BESTIALITY", label: "Bestiality or animal sexual content" },
  { code: "MINORS", label: "Sexual content involving minors or non-consent" },
  { code: "NONCONSENT", label: "Non-consensual, coercive, or exploitative content" },
  { code: "ILLEGAL", label: "Illegal activity or solicitation" },
  { code: "NSFW_PROFILE", label: "Explicit public profile or photo content" },
  { code: "BULLYING", label: "Bullying, harassment, or cyber mobbing" },
  { code: "THREATS", label: "Threats or safety concern" },
  { code: "SPAM", label: "Spam, scams, or platform abuse" },
  { code: "IMPERSONATION", label: "Impersonation or fake identity" },
  { code: "OTHER", label: "Other community standards / legal concern" },
] as const;

export type AccountModReasonCode = (typeof ACCOUNT_MOD_REASONS)[number]["code"];

export type AccountModAction = "suspend" | "unsuspend" | "shadowban" | "unshadowban" | "delete";

export function accountModReasonLabel(code: string): string {
  return ACCOUNT_MOD_REASONS.find((r) => r.code === code)?.label ?? code;
}

export function formatAccountModReason(code: string, note?: string | null): string {
  const label = accountModReasonLabel(code);
  const trimmed = (note || "").trim();
  return trimmed ? `${label}. ${trimmed}` : label;
}

/** Optional duration presets (hours). Empty / null = no automatic end. */
export const ACCOUNT_MOD_DURATION_OPTIONS = [
  { hours: null as number | null, label: "No end date (until lifted)" },
  { hours: 24, label: "24 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
  { hours: 720, label: "30 days" },
] as const;

export function untilIsoFromHours(hours: number | null | undefined): string | null {
  if (hours == null || !Number.isFinite(hours) || hours <= 0) return null;
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

export function isModerationActive(
  flag: boolean | number | null | undefined,
  until: string | null | undefined,
): boolean {
  if (!flag) return false;
  if (!until) return true;
  const t = Date.parse(until);
  if (!Number.isFinite(t)) return true;
  return t > Date.now();
}
