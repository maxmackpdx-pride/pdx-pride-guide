/** Generic send-back reasons for gigs, gifting, and Spotted posts. */
export const BOARD_REJECT_REASONS = [
  { code: "OFF_TOPIC", label: "Off-topic for this board" },
  { code: "PERSONALS", label: "Reads like a personal ad or dating post" },
  { code: "SPAM", label: "Spam, promo, or solicitation" },
  { code: "SAFETY", label: "Safety or PG-13 concern" },
  { code: "CONTACT", label: "Contact or meetup details belong in inbox replies" },
  { code: "UNCLEAR", label: "Too vague — needs clearer details" },
  { code: "DUPLICATE", label: "Duplicate or already covered" },
  { code: "OTHER", label: "Other (see admin note)" },
] as const;

export type BoardRejectReasonCode = (typeof BOARD_REJECT_REASONS)[number]["code"];

export function boardRejectReasonLabel(code: string): string {
  return BOARD_REJECT_REASONS.find(r => r.code === code)?.label ?? code;
}

export function formatBoardRejectMessage(reasonCode: string, note?: string): string {
  const label = boardRejectReasonLabel(reasonCode);
  const trimmed = (note || "").trim();
  return trimmed ? `${label} — ${trimmed}` : label;
}

export const GIG_BOARD_RULES_SUMMARY =
  "Gig Werk is PG-13 and work-focused: paid gigs, volunteer shifts, and real availability. No personals, dating, hookups, escorting, or adult content.";

/** Shown beside profile photo upload — public-facing images only. */
export const PROFILE_PHOTO_RULES_SUMMARY =
  "Yes, this site is about keeping Pride events visible and uncensored, and what you do in private chats is on you. But public profile photos are a different story — this runs on one person and a laptop, so we can't keep nudes safe or legal here yet. No genitalia, no zoomed-in ass shots, no drugs — you get the point.";

export const PROFILE_PHOTO_REJECT_REASONS = [
  { code: "NSFW", label: "Nudity or sexual content" },
  { code: "DRUGS", label: "Drugs or illegal content" },
  { code: "SAFETY", label: "Safety or PG-13 concern" },
  { code: "NOT_A_FACE", label: "Not appropriate for a profile photo" },
  { code: "SPAM", label: "Spam, promo, or unrelated image" },
  { code: "OTHER", label: "Other (see admin note)" },
] as const;

export type ProfilePhotoRejectReasonCode = (typeof PROFILE_PHOTO_REJECT_REASONS)[number]["code"];

export function profilePhotoRejectReasonLabel(code: string): string {
  return PROFILE_PHOTO_REJECT_REASONS.find(r => r.code === code)?.label ?? code;
}

export function formatProfilePhotoRejectMessage(reasonCode: string, note?: string): string {
  const label = profilePhotoRejectReasonLabel(reasonCode);
  const trimmed = (note || "").trim();
  return trimmed ? `${label} — ${trimmed}` : label;
}

const GIG_PERSONALS_TERMS = [
  "personal ad",
  "personals",
  "looking for love",
  "seeking love",
  "seeking relationship",
  "long-term relationship",
  "date night",
  "dating",
  "hookup",
  "hook up",
  "fwb",
  "friends with benefits",
  "sugar daddy",
  "sugar baby",
  "sugar mommy",
  "escort",
  "onlyfans",
  "only fans",
  "fansly",
  "sensual massage",
  "erotic massage",
  "happy ending",
  "xxx",
  "nsfw",
  "nude model",
  "roommate with benefits",
  "single and ready",
  "lonely hearts",
  "seeking companion",
  "seeking man",
  "seeking woman",
  "seeking men",
  "seeking women",
  "m4m",
  "m4f",
  "f4m",
  "t4m",
  "w4m",
  "dm for fun",
  "slide into my",
  "netflix and chill",
];

export function validateGigPostContent(fields: {
  title?: string | null;
  description?: string | null;
  skills?: string | null;
  compensation?: string | null;
}): string | null {
  const haystack = [fields.title, fields.description, fields.skills, fields.compensation]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!haystack.trim()) return null;

  const hit = GIG_PERSONALS_TERMS.find(term => haystack.includes(term));
  if (hit) {
    return "Gig Werk is for work and gigs only — no personals or dating posts. Keep it PG-13 and job-related.";
  }

  return null;
}