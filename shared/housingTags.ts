/**
 * HAUSING tags: the catalog, the priority hierarchy, and the conflict rules.
 *
 * This file is the single source of truth. The composer picker, the board
 * filter, the card chips, the detail page, and the server validator all read
 * from here, so a tag added below shows up everywhere at once.
 *
 * Three rules carried over from shared/housing.ts govern this file:
 *
 *  1. Conduit, not matcher. Tags filter (the viewer chooses what to see) and
 *     they order tags WITHIN a post. They never order posts. The feed is
 *     recency, only ever recency. See listHousingPosts().
 *
 *  2. Whole-unit listings are not households. Household composition, household
 *     compatibility, and adult-culture tags are all shared-living vocabulary
 *     and are blocked on MANAGED. A roommate may pick who they live with; a
 *     landlord advertising a whole unit may not. See TYPES_SHARED below.
 *
 *  3. Verification is issued, never claimed. Identity Verified and Leaseholder
 *     Verified are derived from trust data and are not selectable in the
 *     composer. They are filterable, because a viewer asking to see only
 *     verified leaseholders is asking for less, not for someone excluded.
 */
import type { HousingType } from "./housing";

/** 1 is the most important. Drives display order, card visibility, and filter placement. */
export type HousingTagPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Visual register. Each maps to one approved treatment in Housing.css.
 *  urgent      magenta, strong glow. Emergency only.
 *  adult       purple, soft static glow. Culture, never emergency.
 *  verified    cyan hairline. Platform-issued trust.
 *  restriction orange hairline. A hard no or a gating condition.
 *  (none)      the neutral utility chip.
 */
export type HousingTagTone = "urgent" | "adult" | "verified" | "restriction";

export type HousingTag = {
  id: string;
  label: string;
  priority: HousingTagPriority;
  category: string;
  tone?: HousingTagTone;
  /** Only ever set on one tag. The single pulsing chip on the whole board. */
  pulse?: boolean;
  /** Sorts to the front of its priority band and never hides behind View More. */
  pinned?: boolean;
  /** Issued by the platform. Filterable, but not offered in the composer. */
  derived?: boolean;
  /**
   * Ranks below every other tag regardless of priority. For the interest tags
   * inside priority 4: what someone is into matters less on a card than how
   * loud the house is or whether it takes pets, so these appear later or fold
   * behind View more rather than crowding out the tags that decide a fit.
   */
  soft?: boolean;
  /** Post types that may carry this tag. Defaults to every type. */
  types?: HousingType[];
  /** Shown under the tag in the composer and on the detail page. */
  helper?: string;
};

export type HousingTagCategory = {
  id: string;
  label: string;
  priority: HousingTagPriority;
  /** Open on first paint in the filter dropdown. */
  open?: boolean;
  blurb?: string;
};

const ALL: HousingType[] = ["LOOKING", "OFFERING", "FORMING", "MANAGED"];
/** Shared living. A household exists, so household vocabulary applies. */
const TYPES_SHARED: HousingType[] = ["LOOKING", "OFFERING", "FORMING"];
/** Someone is describing a place they hold or manage. */
const TYPES_SUPPLY: HousingType[] = ["OFFERING", "FORMING", "MANAGED"];

export const HOUSING_TAG_CATEGORIES: HousingTagCategory[] = [
  { id: "urgent", label: "Urgent", priority: 1, open: true, blurb: "Someone needs housing now." },
  { id: "timing", label: "Timing and availability", priority: 2, open: true },
  { id: "property", label: "Room and property", priority: 2, open: true },
  { id: "financial", label: "Money, lease, and approval", priority: 2 },
  { id: "accessibility", label: "Accessibility", priority: 3 },
  { id: "pets", label: "Pets", priority: 3 },
  { id: "transit", label: "Getting around", priority: 3 },
  { id: "safety", label: "Safety and privacy", priority: 3 },
  { id: "household-style", label: "Household style", priority: 4 },
  { id: "household-rhythm", label: "Noise, guests, and hours", priority: 4 },
  { id: "household-clean", label: "Cleaning", priority: 4 },
  { id: "household-interests", label: "What the house is into", priority: 4 },
  { id: "culture", label: "Adult household culture", priority: 5 },
  { id: "work", label: "Work and creating", priority: 6 },
  { id: "substances", label: "Smoking and substances", priority: 7 },
  { id: "composition", label: "Who lives there", priority: 8 },
];

/**
 * The catalog. Order inside a category is the display order, so put the tag
 * someone is most likely to want first.
 */
export const HOUSING_TAGS: HousingTag[] = [
  // ---- Priority 1: immediate safety and emergency housing -----------------
  // The only tags that pulse, and the only ones that never hide.
  {
    id: "immediate-housing-needed",
    label: "Immediate housing needed",
    priority: 1,
    category: "urgent",
    tone: "urgent",
    pulse: true,
    pinned: true,
    types: ["LOOKING", "FORMING"],
    helper: "You need somewhere to sleep now, not next month.",
  },
  {
    id: "safety-needed",
    label: "Safety needed",
    priority: 1,
    category: "urgent",
    tone: "urgent",
    pinned: true,
    types: ["LOOKING", "FORMING"],
    helper: "You are leaving a situation that is not safe.",
  },
  {
    id: "pet-emergency-housing-needed",
    label: "Pet inclusive emergency housing needed",
    priority: 1,
    category: "urgent",
    tone: "urgent",
    pinned: true,
    types: ["LOOKING", "FORMING"],
    helper: "You need somewhere now and you are not leaving your animal behind.",
  },
  {
    id: "urgent-roommate-replacement",
    label: "Urgent roommate replacement needed",
    priority: 1,
    category: "urgent",
    tone: "urgent",
    pinned: true,
    types: ["OFFERING", "FORMING"],
    helper: "Someone moved out and rent is due.",
  },

  // ---- Priority 2: core housing fit ---------------------------------------
  { id: "available-now", label: "Available now", priority: 2, category: "timing" },
  { id: "move-in-this-week", label: "Move in this week", priority: 2, category: "timing" },
  { id: "move-in-this-month", label: "Move in this month", priority: 2, category: "timing" },
  { id: "flexible-move-date", label: "Flexible move date", priority: 2, category: "timing" },
  { id: "temporary-housing", label: "Temporary housing", priority: 2, category: "timing" },
  { id: "short-term", label: "Short term", priority: 2, category: "timing" },
  { id: "long-term", label: "Long term", priority: 2, category: "timing" },
  { id: "month-to-month", label: "Month to month", priority: 2, category: "timing" },
  { id: "fixed-term-lease", label: "Fixed term lease", priority: 2, category: "timing" },
  { id: "sublet", label: "Sublet", priority: 2, category: "timing" },

  { id: "private-room", label: "Private room", priority: 2, category: "property" },
  { id: "shared-room", label: "Shared room", priority: 2, category: "property" },
  { id: "entire-unit", label: "Entire unit", priority: 2, category: "property" },
  { id: "furnished", label: "Furnished", priority: 2, category: "property" },
  { id: "partially-furnished", label: "Partially furnished", priority: 2, category: "property" },
  { id: "unfurnished", label: "Unfurnished", priority: 2, category: "property" },
  { id: "private-bathroom", label: "Private bathroom", priority: 2, category: "property" },
  { id: "shared-bathroom", label: "Shared bathroom", priority: 2, category: "property" },
  { id: "house", label: "House", priority: 2, category: "property", types: TYPES_SUPPLY },
  { id: "apartment", label: "Apartment", priority: 2, category: "property", types: TYPES_SUPPLY },
  { id: "condo", label: "Condo", priority: 2, category: "property", types: TYPES_SUPPLY },
  { id: "townhome", label: "Townhome", priority: 2, category: "property", types: TYPES_SUPPLY },
  { id: "adu", label: "ADU", priority: 2, category: "property", types: TYPES_SUPPLY },
  { id: "tiny-house", label: "Tiny house", priority: 2, category: "property", types: TYPES_SUPPLY },

  { id: "utilities-included", label: "Utilities included", priority: 2, category: "financial", types: TYPES_SUPPLY },
  { id: "deposit-required", label: "Deposit required", priority: 2, category: "financial", types: TYPES_SUPPLY },
  { id: "flexible-deposit", label: "Flexible deposit", priority: 2, category: "financial", types: TYPES_SUPPLY },
  {
    id: "housing-assistance-accepted",
    label: "Housing assistance accepted",
    priority: 2,
    category: "financial",
    types: TYPES_SUPPLY,
    helper: "Vouchers and subsidies welcome. Oregon law requires this anyway, so say it out loud.",
  },
  {
    id: "income-verification-required",
    label: "Income verification required",
    priority: 2,
    category: "financial",
    tone: "restriction",
    types: TYPES_SUPPLY,
  },
  {
    id: "credit-check-required",
    label: "Credit check required",
    priority: 2,
    category: "financial",
    tone: "restriction",
    types: TYPES_SUPPLY,
  },
  {
    id: "background-check-required",
    label: "Background check required",
    priority: 2,
    category: "financial",
    tone: "restriction",
    types: TYPES_SUPPLY,
  },
  { id: "guarantor-accepted", label: "Guarantor accepted", priority: 2, category: "financial", types: TYPES_SUPPLY },
  { id: "no-long-term-lease", label: "No long term lease", priority: 2, category: "financial", types: TYPES_SUPPLY },
  {
    id: "landlord-approval-required",
    label: "Landlord approval required",
    priority: 2,
    category: "financial",
    tone: "restriction",
    pinned: true,
    types: TYPES_SUPPLY,
    helper:
      "The current household may select its preferred match, but the landlord or property manager must provide final approval before move in.",
  },

  // ---- Priority 3: accessibility, pets, transportation, safety ------------
  { id: "step-free-entry", label: "Step free entry", priority: 3, category: "accessibility", types: TYPES_SUPPLY },
  { id: "ground-floor", label: "Ground floor", priority: 3, category: "accessibility", types: TYPES_SUPPLY },
  { id: "elevator", label: "Elevator", priority: 3, category: "accessibility", types: TYPES_SUPPLY },
  {
    id: "wheelchair-accessible",
    label: "Wheelchair accessible",
    priority: 3,
    category: "accessibility",
    types: TYPES_SUPPLY,
  },
  {
    id: "accessible-bathroom",
    label: "Accessible bathroom",
    priority: 3,
    category: "accessibility",
    types: TYPES_SUPPLY,
  },
  { id: "low-sensory-household", label: "Low sensory household", priority: 3, category: "accessibility", types: TYPES_SHARED },
  { id: "fragrance-aware", label: "Fragrance aware", priority: 3, category: "accessibility" },
  {
    id: "service-animals-welcome",
    label: "Service animals welcome",
    priority: 3,
    category: "accessibility",
    helper: "A service or assistance animal is not a pet, so this stands even in a no pets house.",
  },

  { id: "pets-welcome", label: "Pets welcome", priority: 3, category: "pets", types: TYPES_SUPPLY },
  { id: "dogs-welcome", label: "Dogs welcome", priority: 3, category: "pets", types: TYPES_SUPPLY },
  { id: "cats-welcome", label: "Cats welcome", priority: 3, category: "pets", types: TYPES_SUPPLY },
  { id: "no-pets", label: "No pets", priority: 3, category: "pets", tone: "restriction", types: TYPES_SUPPLY },
  { id: "existing-dog", label: "Existing dog", priority: 3, category: "pets" },
  { id: "existing-cat", label: "Existing cat", priority: 3, category: "pets" },
  { id: "pet-allergies", label: "Pet allergies", priority: 3, category: "pets", tone: "restriction" },

  { id: "near-max", label: "Near MAX", priority: 3, category: "transit", types: TYPES_SUPPLY },
  { id: "near-bus", label: "Near bus", priority: 3, category: "transit", types: TYPES_SUPPLY },
  { id: "bike-friendly", label: "Bike friendly", priority: 3, category: "transit", types: TYPES_SUPPLY },
  { id: "walkable", label: "Walkable", priority: 3, category: "transit", types: TYPES_SUPPLY },
  { id: "parking-available", label: "Parking available", priority: 3, category: "transit", types: TYPES_SUPPLY },
  { id: "street-parking", label: "Street parking", priority: 3, category: "transit", types: TYPES_SUPPLY },
  { id: "ev-charging", label: "EV charging", priority: 3, category: "transit", types: TYPES_SUPPLY },

  {
    id: "identity-verified",
    label: "Identity verified",
    priority: 3,
    category: "safety",
    tone: "verified",
    derived: true,
  },
  {
    id: "leaseholder-verified",
    label: "Leaseholder verified",
    priority: 3,
    category: "safety",
    tone: "verified",
    derived: true,
  },
  { id: "address-after-contact", label: "Address shared after contact", priority: 3, category: "safety" },
  { id: "private-entrance", label: "Private entrance", priority: 3, category: "safety", types: TYPES_SUPPLY },
  { id: "bedroom-lock", label: "Bedroom lock", priority: 3, category: "safety", types: TYPES_SUPPLY },
  { id: "security-system", label: "Security system", priority: 3, category: "safety", types: TYPES_SUPPLY },
  { id: "invite-only-tours", label: "Invite only tours", priority: 3, category: "safety", types: TYPES_SUPPLY },

  // ---- Priority 4: household compatibility --------------------------------
  { id: "independent-household", label: "Independent household", priority: 4, category: "household-style", types: TYPES_SHARED },
  { id: "mixed-household-style", label: "Mixed household style", priority: 4, category: "household-style", types: TYPES_SHARED },
  { id: "communal-household", label: "Communal household", priority: 4, category: "household-style", types: TYPES_SHARED },
  { id: "ships-passing", label: "Ships passing in the night", priority: 4, category: "household-style", types: TYPES_SHARED },
  { id: "friendly-but-independent", label: "Friendly but independent", priority: 4, category: "household-style", types: TYPES_SHARED },
  { id: "close-household", label: "Close household", priority: 4, category: "household-style", types: TYPES_SHARED },
  { id: "chosen-family", label: "Chosen family", priority: 4, category: "household-style", types: TYPES_SHARED },

  { id: "quiet-household", label: "Quiet household", priority: 4, category: "household-rhythm", types: TYPES_SHARED },
  { id: "balanced-household", label: "Balanced household", priority: 4, category: "household-rhythm", types: TYPES_SHARED },
  { id: "social-household", label: "Social household", priority: 4, category: "household-rhythm", types: TYPES_SHARED },
  { id: "guests-rarely", label: "Guests rarely", priority: 4, category: "household-rhythm", types: TYPES_SHARED },
  { id: "guests-occasionally", label: "Guests occasionally", priority: 4, category: "household-rhythm", types: TYPES_SHARED },
  { id: "guests-frequently", label: "Guests frequently", priority: 4, category: "household-rhythm", types: TYPES_SHARED },
  { id: "quiet-hours", label: "Quiet hours", priority: 4, category: "household-rhythm", types: TYPES_SHARED },
  { id: "strict-quiet-hours", label: "Strict quiet hours", priority: 4, category: "household-rhythm", types: TYPES_SHARED },
  { id: "early-risers", label: "Early risers", priority: 4, category: "household-rhythm", types: TYPES_SHARED },
  { id: "night-owls", label: "Night owls", priority: 4, category: "household-rhythm", types: TYPES_SHARED },

  { id: "relaxed-about-cleaning", label: "Relaxed about cleaning", priority: 4, category: "household-clean", types: TYPES_SHARED },
  { id: "moderately-clean", label: "Moderately clean", priority: 4, category: "household-clean", types: TYPES_SHARED },
  { id: "very-clean", label: "Very clean", priority: 4, category: "household-clean", types: TYPES_SHARED },
  { id: "clean-but-cluttered", label: "Clean but cluttered", priority: 4, category: "household-clean", types: TYPES_SHARED },
  {
    id: "split-cleaning-service",
    label: "Willing to split a cleaning service",
    priority: 4,
    category: "household-clean",
    types: TYPES_SHARED,
  },

  { id: "shared-meals-occasionally", label: "Shared meals occasionally", priority: 4, category: "household-interests", types: TYPES_SHARED },
  { id: "shared-meals-often", label: "Shared meals often", priority: 4, category: "household-interests", types: TYPES_SHARED },
  { id: "remote-workers", label: "Remote workers", priority: 4, category: "household-interests", types: TYPES_SHARED, soft: true },
  { id: "gamers", label: "Gamers", priority: 4, category: "household-interests", types: TYPES_SHARED, soft: true },
  { id: "fitness-focused", label: "Fitness focused", priority: 4, category: "household-interests", types: TYPES_SHARED, soft: true },

  // ---- Priority 5: community and adult household culture ------------------
  // Soft purple glow. Culture and compatibility, never urgency, never featured.
  { id: "sex-positive", label: "Sex positive", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "kink-friendly", label: "Kink friendly", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "poly-friendly", label: "Poly friendly", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "sex-worker-friendly", label: "Sex worker friendly", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  {
    id: "adult-content-creator-friendly",
    label: "Adult content creator friendly",
    priority: 5,
    category: "culture",
    tone: "adult",
    types: TYPES_SHARED,
  },
  { id: "clothing-optional", label: "Clothing optional", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "casual-nudity-okay", label: "Casual nudity okay", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "nudist-household", label: "Nudist household", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "house-parties-rarely", label: "House parties rarely", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "house-parties-occasionally", label: "House parties occasionally", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "house-parties-often", label: "House parties often", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "play-parties-rarely", label: "Play parties rarely", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "play-parties-occasionally", label: "Play parties occasionally", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },
  { id: "play-parties-often", label: "Play parties often", priority: 5, category: "culture", tone: "adult", types: TYPES_SHARED },

  // ---- Priority 6: work and creation --------------------------------------
  { id: "content-creation-friendly", label: "Content creation friendly", priority: 6, category: "work", types: TYPES_SHARED },
  { id: "recording-friendly", label: "Recording friendly", priority: 6, category: "work", types: TYPES_SHARED },
  { id: "home-studio", label: "Home studio", priority: 6, category: "work", types: TYPES_SUPPLY },
  { id: "home-office", label: "Home office", priority: 6, category: "work", types: TYPES_SUPPLY },
  { id: "private-workspace", label: "Private workspace", priority: 6, category: "work", types: TYPES_SUPPLY },
  { id: "flexible-work-hours", label: "Flexible work hours", priority: 6, category: "work", types: TYPES_SHARED },
  { id: "high-speed-internet", label: "High speed internet", priority: 6, category: "work", types: TYPES_SUPPLY },
  { id: "sound-tolerant-household", label: "Sound tolerant household", priority: 6, category: "work", types: TYPES_SHARED },

  // ---- Priority 7: smoking and substances ---------------------------------
  { id: "cannabis-friendly", label: "Cannabis friendly", priority: 7, category: "substances" },
  { id: "cannabis-outdoors-only", label: "Cannabis outdoors only", priority: 7, category: "substances" },
  { id: "cannabis-free", label: "Cannabis free", priority: 7, category: "substances", tone: "restriction" },
  { id: "alcohol-friendly", label: "Alcohol friendly", priority: 7, category: "substances" },
  { id: "sober-household", label: "Sober household", priority: 7, category: "substances", tone: "restriction", types: TYPES_SHARED },
  { id: "tobacco-indoors-okay", label: "Tobacco indoors okay", priority: 7, category: "substances" },
  { id: "tobacco-outdoors-only", label: "Tobacco outdoors only", priority: 7, category: "substances" },
  { id: "tobacco-free", label: "Tobacco free", priority: 7, category: "substances", tone: "restriction" },

  // ---- Priority 8: household composition ----------------------------------
  // Shared living only. A roommate may choose who they live with; a whole unit
  // advertised by a manager may not be filtered this way. See rule 2 up top.
  { id: "one-roommate", label: "One roommate", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "multiple-roommates", label: "Multiple roommates", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "couple-household", label: "Couple household", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "couples-welcome", label: "Couples welcome", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "solo-applicant-preferred", label: "Solo applicant preferred", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "students", label: "Students", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "professionals", label: "Professionals", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "mixed-age-household", label: "Mixed age household", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "men-only-household", label: "Men only household", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "women-only-household", label: "Women only household", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "nonbinary-household", label: "Nonbinary household", priority: 8, category: "composition", types: TYPES_SHARED },
  { id: "mixed-gender-household", label: "Mixed gender household", priority: 8, category: "composition", types: TYPES_SHARED },
];

export const HOUSING_TAG_BY_ID: Record<string, HousingTag> = Object.fromEntries(
  HOUSING_TAGS.map((t) => [t.id, t]),
);

/** Catalog position, so display order is stable and does not depend on input order. */
const TAG_INDEX: Record<string, number> = Object.fromEntries(HOUSING_TAGS.map((t, i) => [t.id, i]));

export const URGENT_TAG_IDS: string[] = HOUSING_TAGS.filter((t) => t.priority === 1).map((t) => t.id);

// ---------------------------------------------------------------------------
// Conflicts
// ---------------------------------------------------------------------------

/**
 * Sets where picking one rules out the rest. These are answers to the same
 * question, not a survey: the house is either furnished or it is not.
 */
const EXCLUSIVE_GROUPS: string[][] = [
  ["furnished", "partially-furnished", "unfurnished"],
  ["private-room", "shared-room", "entire-unit"],
  ["cannabis-friendly", "cannabis-outdoors-only", "cannabis-free"],
  ["tobacco-indoors-okay", "tobacco-outdoors-only", "tobacco-free"],
  ["relaxed-about-cleaning", "moderately-clean", "very-clean"],
  ["guests-rarely", "guests-occasionally", "guests-frequently"],
  ["house-parties-rarely", "house-parties-occasionally", "house-parties-often"],
  ["play-parties-rarely", "play-parties-occasionally", "play-parties-often"],
  ["quiet-household", "balanced-household", "social-household"],
];

/**
 * One off pairs. Note what is deliberately absent: service animals never
 * conflict with no pets, because a service animal is not a pet and a no pets
 * policy does not lawfully exclude one.
 */
const EXTRA_CONFLICTS: Array<[string, string]> = [
  ["no-pets", "pets-welcome"],
  ["no-pets", "dogs-welcome"],
  ["no-pets", "cats-welcome"],
  ["no-pets", "existing-dog"],
  ["no-pets", "existing-cat"],
  ["fixed-term-lease", "no-long-term-lease"],
  ["sober-household", "alcohol-friendly"],
];

/** id -> every id it cannot be held alongside. */
export const HOUSING_TAG_CONFLICTS: Record<string, string[]> = (() => {
  const map: Record<string, Set<string>> = {};
  const link = (a: string, b: string) => {
    (map[a] ||= new Set()).add(b);
    (map[b] ||= new Set()).add(a);
  };
  for (const group of EXCLUSIVE_GROUPS) {
    for (const a of group) for (const b of group) if (a !== b) link(a, b);
  }
  for (const [a, b] of EXTRA_CONFLICTS) link(a, b);
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, [...v]]));
})();

/** What the given selection rules out. Used to disable, not to silently drop. */
export function blockedByHousingTags(selected: readonly string[]): Set<string> {
  const blocked = new Set<string>();
  for (const id of selected) {
    for (const other of HOUSING_TAG_CONFLICTS[id] || []) {
      if (!selected.includes(other)) blocked.add(other);
    }
  }
  return blocked;
}

export function housingTagsConflict(a: string, b: string): boolean {
  return (HOUSING_TAG_CONFLICTS[a] || []).includes(b);
}

// ---------------------------------------------------------------------------
// Validation and ordering
// ---------------------------------------------------------------------------

export function housingTagAllowedOn(tag: HousingTag, type: HousingType): boolean {
  return (tag.types ?? ALL).includes(type);
}

/**
 * Clean a submitted list: drop unknown ids, drop tags this post type may not
 * carry, drop platform issued ones, dedupe, and resolve conflicts by keeping
 * whichever the poster picked first. Returns catalog order.
 */
export function normalizeHousingTags(raw: unknown, type: HousingType): string[] {
  const input = Array.isArray(raw) ? raw : [];
  const kept: string[] = [];
  for (const value of input) {
    const id = typeof value === "string" ? value.trim() : "";
    const tag = HOUSING_TAG_BY_ID[id];
    if (!tag || tag.derived) continue;
    if (!housingTagAllowedOn(tag, type)) continue;
    if (kept.includes(id)) continue;
    if (kept.some((k) => housingTagsConflict(k, id))) continue;
    kept.push(id);
  }
  return kept.sort((a, b) => TAG_INDEX[a] - TAG_INDEX[b]);
}

/** Filter ids off a query string. Unknown ids are dropped, derived ones are kept. */
export function parseHousingTagFilter(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const piece of raw.split(",")) {
    const id = piece.trim();
    if (HOUSING_TAG_BY_ID[id] && !out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * Display order for the tags ON one post.
 *
 * 1. Urgent, with Immediate housing needed always first.
 * 2. Pinned lease conditions.
 * 3. Anything matching an active filter, so a viewer sees why this post came back.
 * 4. Everything else by priority, then catalog order.
 * 5. Interest tags last, whatever their priority.
 */
export function orderHousingTags(ids: readonly string[], active: readonly string[] = []): HousingTag[] {
  const activeSet = new Set(active);
  const rank = (t: HousingTag): number => {
    if (t.pulse) return 0;
    if (t.priority === 1) return 1;
    if (t.pinned) return 2;
    if (activeSet.has(t.id)) return 3;
    if (t.soft) return 99;
    return 4 + t.priority;
  };
  return ids
    .map((id) => HOUSING_TAG_BY_ID[id])
    .filter(Boolean)
    .sort((a, b) => rank(a) - rank(b) || TAG_INDEX[a.id] - TAG_INDEX[b.id]);
}

/** How many non urgent chips a card shows before the rest fold away. */
export const HOUSING_CARD_TAG_LIMIT = 6;

/**
 * Split a post's tags into what a card shows and what folds behind View more.
 * Urgent and pinned tags never fold, however many there are.
 */
export function splitHousingCardTags(
  ids: readonly string[],
  active: readonly string[] = [],
  limit: number = HOUSING_CARD_TAG_LIMIT,
): { shown: HousingTag[]; hidden: HousingTag[] } {
  const ordered = orderHousingTags(ids, active);
  const shown: HousingTag[] = [];
  const hidden: HousingTag[] = [];
  let budget = limit;
  for (const tag of ordered) {
    if (tag.priority === 1 || tag.pinned) {
      shown.push(tag);
      continue;
    }
    if (budget > 0) {
      shown.push(tag);
      budget -= 1;
    } else {
      hidden.push(tag);
    }
  }
  return { shown, hidden };
}

/** Tags a given post type may offer in the composer, grouped for the picker. */
export function housingTagGroups(type: HousingType): Array<{ category: HousingTagCategory; tags: HousingTag[] }> {
  return HOUSING_TAG_CATEGORIES.map((category) => ({
    category,
    tags: HOUSING_TAGS.filter(
      (t) => t.category === category.id && !t.derived && housingTagAllowedOn(t, type),
    ),
  })).filter((g) => g.tags.length > 0);
}

/** Every category with at least one filterable tag. Derived tags stay in. */
export function housingFilterGroups(): Array<{ category: HousingTagCategory; tags: HousingTag[] }> {
  return HOUSING_TAG_CATEGORIES.map((category) => ({
    category,
    tags: HOUSING_TAGS.filter((t) => t.category === category.id),
  })).filter((g) => g.tags.length > 0);
}

/** Substring search over labels, for the filter dropdown's search field. */
export function searchHousingTags(query: string): HousingTag[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return HOUSING_TAGS.filter((t) => t.label.toLowerCase().includes(q) || t.id.includes(q));
}

export function housingTagLabel(id: string): string {
  return HOUSING_TAG_BY_ID[id]?.label ?? id;
}

/**
 * The two verification tags are issued from trust data rather than stored on
 * the post, so they are merged in at render and filter time.
 *
 * Property manager verification is deliberately NOT mapped to leaseholder
 * verified. A manager is not the leaseholder, and the managed card already
 * carries its own verified badge. Until identity and leaseholder verification
 * actually ship, these simply never appear, which is the honest result.
 */
export function derivedHousingTags(trust: {
  leaseholderVerified?: boolean;
  identityVerified?: boolean;
}): string[] {
  const out: string[] = [];
  if (trust.identityVerified) out.push("identity-verified");
  if (trust.leaseholderVerified) out.push("leaseholder-verified");
  return out;
}
