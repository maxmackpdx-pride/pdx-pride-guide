/**
 * HAUSING - shared domain vocabulary for the Housing board.
 *
 * Spec: docs/HAUS_HOUSING_SPEC_v0.2.md
 * Build brief: docs/HAUS_ENGINEERING_HANDOFF.md
 * Visual reference: docs/design-handoff-hausing/
 *
 * Two rules govern everything in this file:
 *  1. Conduit, not matcher. Nothing here is a protected-class trait, and none of
 *     these vocabularies may be used to rank, hide, or steer posts.
 *  2. The platform never handles money. Every rent/deposit value is display text.
 */

export const HOUSING_TYPES = ["LOOKING", "OFFERING", "FORMING", "MANAGED"] as const;
export type HousingType = (typeof HOUSING_TYPES)[number];

/** The locked suffix every household name ends in. Never editable by the poster. */
export const HAUS_SUFFIX = "HAÜS";

/** Types whose name carries the locked HAÜS suffix. A managed building is not a household. */
export const SUFFIXED_TYPES: HousingType[] = ["OFFERING", "FORMING"];

/** Composer limit. Past ~3 words the name-over-photo motif stops reading as a motif. */
export const HAUS_NAME_MAX_WORDS = 3;
export const HAUS_NAME_MAX_CHARS = 22;

/**
 * Board accents. Each post type rebinds `--c` for its own subtree.
 * Any element setting these MUST also carry `.pdx-glass-rebind` or it silently
 * falls back to root cyan.
 */
export const HOUSING_ACCENT_VAR: Record<HousingType, string> = {
  LOOKING: "var(--panel-cyan)",
  OFFERING: "var(--panel-orange)",
  FORMING: "var(--green-acid)",
  MANAGED: "var(--panel-purple)",
};

/** Board chrome runs on the same softened cyan as "Looking for housing". */
export const HOUSING_BOARD_ACCENT = "var(--panel-cyan)";

export const HOUSING_TYPE_LABEL: Record<HousingType, string> = {
  LOOKING: "Looking for housing",
  OFFERING: "Offering a room",
  FORMING: "Forming a HAÜS",
  MANAGED: "Managed property",
};

/** Mono kicker shown at the top of each card. */
export const HOUSING_TYPE_KICKER: Record<HousingType, string> = {
  LOOKING: "LOOKING FOR HOUSING",
  OFFERING: "OFFERING A ROOM",
  FORMING: "FORMING A HAÜS",
  MANAGED: "MANAGED PROPERTY",
};

export const HOUSING_TYPE_BLURB: Record<HousingType, string> = {
  LOOKING: "You need a place. Tell people who you are and what you are after.",
  OFFERING: "Your household has a room open. Introduce the people, not just the room.",
  FORMING: "Build the household first, then go find a place together.",
  MANAGED: "A whole unit for rent, posted by a verified property manager.",
};

export const FORMING_FLAVORS = ["PLACE_IN_MIND", "FIND_TOGETHER"] as const;
export type FormingFlavor = (typeof FORMING_FLAVORS)[number];

export const FORMING_FLAVOR_LABEL: Record<FormingFlavor, string> = {
  PLACE_IN_MIND: "Place in mind",
  FIND_TOGETHER: "Finding a place together",
};

/** Fixed vocabularies. Logistics only, never identity. */
export const PARKING_OPTIONS = ["OFF_STREET", "DRIVEWAY", "GARAGE", "STREET_ONLY", "NONE"] as const;
export type ParkingOption = (typeof PARKING_OPTIONS)[number];
export const PARKING_LABEL: Record<ParkingOption, string> = {
  OFF_STREET: "Off street",
  DRIVEWAY: "Driveway",
  GARAGE: "Garage",
  STREET_ONLY: "Street only",
  NONE: "No parking",
};

export const OUTDOOR_OPTIONS = ["PRIVATE_YARD", "SHARED_YARD", "PATIO_BALCONY", "NONE"] as const;
export type OutdoorOption = (typeof OUTDOOR_OPTIONS)[number];
export const OUTDOOR_LABEL: Record<OutdoorOption, string> = {
  PRIVATE_YARD: "Private yard",
  SHARED_YARD: "Shared yard",
  PATIO_BALCONY: "Patio or balcony",
  NONE: "No outdoor space",
};

/**
 * Affirmative badges only. These surface voucher-friendly and accessible options.
 * They are never a filter that excludes anyone.
 */
export const AFFORDABILITY_BADGES = ["SECTION_8", "INCOME_RESTRICTED", "ACCESSIBLE"] as const;
export type AffordabilityBadge = (typeof AFFORDABILITY_BADGES)[number];
export const AFFORDABILITY_BADGE_LABEL: Record<AffordabilityBadge, string> = {
  SECTION_8: "Accepts Section 8",
  INCOME_RESTRICTED: "Income restricted",
  ACCESSIBLE: "Accessible unit",
};

export const HOUSING_MEMBER_KINDS = ["MEMBER", "OFFPLATFORM", "PET"] as const;
export type HousingMemberKind = (typeof HOUSING_MEMBER_KINDS)[number];

export const HOUSING_MEMBER_ROLES = ["LEAD", "COLEAD", "MEMBER"] as const;
export type HousingMemberRole = (typeof HOUSING_MEMBER_ROLES)[number];

export const HOUSING_REQUEST_KINDS = ["CHAT", "JOIN", "WAITLIST"] as const;
export type HousingRequestKind = (typeof HOUSING_REQUEST_KINDS)[number];

export const HOUSING_REQUEST_STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "WITHDRAWN"] as const;
export type HousingRequestStatus = (typeof HOUSING_REQUEST_STATUSES)[number];

export const PLACE_STATUSES = ["INTERESTED", "TOURING", "APPLIED", "PASSED", "CHOSEN"] as const;
export type PlaceStatus = (typeof PLACE_STATUSES)[number];
export const PLACE_STATUS_LABEL: Record<PlaceStatus, string> = {
  INTERESTED: "Interested",
  TOURING: "Touring",
  APPLIED: "Applied",
  PASSED: "Passed",
  CHOSEN: "Chosen",
};

export const HOUSING_DATE_KINDS = [
  "MOVE_IN",
  "TOUR",
  "APPLICATION",
  "LEASE",
  "DEPOSIT",
  "CHECKIN",
  "OTHER",
] as const;
export type HousingDateKind = (typeof HOUSING_DATE_KINDS)[number];
export const HOUSING_DATE_KIND_LABEL: Record<HousingDateKind, string> = {
  MOVE_IN: "Target move in",
  TOUR: "Tour",
  APPLICATION: "Application deadline",
  LEASE: "Lease signing",
  DEPOSIT: "Deposit due",
  CHECKIN: "Budget check in",
  OTHER: "Other",
};

export const HOUSING_REPORT_REASONS = [
  "FAKE_LISTING",
  "SCAM",
  "UNSAFE_HOUSING",
  "DISCRIMINATION",
  "UNAUTHORIZED_SUBLEASE",
  "OTHER",
] as const;
export type HousingReportReason = (typeof HOUSING_REPORT_REASONS)[number];
export const HOUSING_REPORT_REASON_LABEL: Record<HousingReportReason, string> = {
  FAKE_LISTING: "Fake listing",
  SCAM: "Scam",
  UNSAFE_HOUSING: "Unsafe housing",
  DISCRIMINATION: "Discrimination",
  UNAUTHORIZED_SUBLEASE: "Unauthorized sublease",
  OTHER: "Something else",
};

/**
 * Housing geofence. Deliberately WIDER than the events/directory map lock:
 * nightlife stays in Portland, but renters commute, so someone will happily live
 * in Woodburn or Gresham and drive in. Portland metro plus the Willamette Valley
 * corridor down to Salem. Keep this separate from the tighter events box.
 */
export const HOUSING_BOUNDS = {
  sw: { lat: 44.83, lng: -123.25 },
  ne: { lat: 45.9, lng: -122.2 },
} as const;

export function withinHousingBounds(lat: number, lng: number): boolean {
  return (
    lat >= HOUSING_BOUNDS.sw.lat &&
    lat <= HOUSING_BOUNDS.ne.lat &&
    lng >= HOUSING_BOUNDS.sw.lng &&
    lng <= HOUSING_BOUNDS.ne.lng
  );
}

/** Strip any suffix the poster managed to type, so it is stored exactly once. */
export function stripHausSuffix(raw: string): string {
  return raw
    .replace(/\s*HA[ÜU]S\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The display name. Only OFFERING and FORMING carry the locked suffix. */
export function housingDisplayName(type: HousingType, name: string): string {
  const front = (name || "").trim();
  if (!SUFFIXED_TYPES.includes(type)) return front;
  const stripped = stripHausSuffix(front);
  return stripped ? `${stripped} ${HAUS_SUFFIX}` : HAUS_SUFFIX;
}

/**
 * Derive a household name from a managed property, for Build a HAUS.
 * Unit numbers and building words are dropped so "The Ardmore, Unit 4B (ADU)"
 * becomes "The Ardmore HAÜS".
 */
export function hausNameFromProperty(propertyName: string): string {
  const cleaned = (propertyName || "")
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(?:unit|apt|apartment|suite|ste|#)\s*[\w-]*/gi, " ")
    .replace(/\bADU\b/gi, " ")
    .replace(/\b(?:apartments?|lofts?|residences?|towers?|flats?)\b/gi, " ")
    .replace(/[,–—-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = stripHausSuffix(cleaned).split(" ").filter(Boolean).slice(0, HAUS_NAME_MAX_WORDS);
  return words.join(" ");
}

/** "2 in, 2 to go" style progress for a forming household. */
export function formingProgress(memberCount: number, seeking: number) {
  const total = Math.max(memberCount + Math.max(seeking, 0), 1);
  return { filled: memberCount, open: Math.max(seeking, 0), total };
}

export type HousingSort = "NEWEST" | "SOONEST";

/** Filter tabs on the board. "Saved" is the viewer's own list, not a ranking. */
export const HOUSING_FILTERS = ["ALL", ...HOUSING_TYPES, "SAVED"] as const;
export type HousingFilter = (typeof HOUSING_FILTERS)[number];

export const HOUSING_FILTER_LABEL: Record<HousingFilter, string> = {
  ALL: "All",
  LOOKING: "Looking for housing",
  OFFERING: "Offering a room",
  FORMING: "Forming a HAÜS",
  MANAGED: "Managed property",
  SAVED: "Saved",
};

// ---------------------------------------------------------------------------
// API view types. What the server sends the board and what the cards render.
// ---------------------------------------------------------------------------

export type HousingPerson = {
  id: number;
  kind: HousingMemberKind;
  /** Set only for real Zaylist members. Off-platform housemates and pets have none. */
  userId?: number | null;
  username?: string | null;
  name: string;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  species?: string | null;
  role: HousingMemberRole;
};

export type HousingAuthor = {
  userId: number;
  displayName: string;
  username?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  pronouns?: string | null;
};

/**
 * Community context. Real overlap the community already generated, never a
 * compatibility score and never a ranking input.
 */
export type HousingTrust = {
  mutualConnections?: number;
  eventsTogether?: number;
  memberSince?: number | null;
  /** Reserved for identity verification. Drives the Identity verified tag. */
  identityVerified?: boolean;
  leaseholderVerified?: boolean;
  propertyManagerVerified?: boolean;
};

/** A forming group attached to a managed listing. Interest, never a claim. */
export type HousingInterestGroup = {
  postId: number;
  name: string;
  lead: HousingAuthor;
  memberCount: number;
  seeking: number;
};

export type HousingPostView = {
  id: number;
  type: HousingType;
  author: HousingAuthor;
  createdAt: string;
  updatedAt: string;
  postedLabel: string;
  name: string;
  displayName: string;
  headline: string;
  body: string;
  photos: string[];
  areas: string[];
  /**
   * Tag ids from shared/housingTags.ts, in catalog order. Includes the derived
   * verification tags, which are issued from trust rather than stored.
   */
  tags: string[];
  status: string;
  saved: boolean;
  trust: HousingTrust;
  household: HousingPerson[];
  /** Empty "Open" slots rendered after the filled avatars. */
  openSlots: number;
  lastChangeLabel?: string | null;

  // LOOKING
  budget?: string | null;
  moveTimeline?: string | null;
  livingStyle?: string[];
  openToHaus?: boolean;

  // OFFERING + MANAGED
  rent?: string | null;
  rentNote?: string | null;
  deposit?: string | null;
  moveIn?: string | null;
  roomNote?: string | null;
  beds?: number | null;
  baths?: number | null;
  parking?: ParkingOption | null;
  outdoor?: OutdoorOption | null;
  culture?: string[];
  access?: string[];

  // FORMING
  flavor?: FormingFlavor | null;
  seeking?: number;
  isFull?: boolean;
  goals?: string | null;
  /** The managed listing this HAÜS formed around, when it was built from one. */
  around?: { postId: number; propertyName: string; managerName: string } | null;
  /** Viewer state for the join gesture. */
  myRequest?: { id: number; kind: HousingRequestKind; status: HousingRequestStatus } | null;

  // MANAGED
  manager?: { id: number; name: string; company?: string | null; siteDomain?: string | null } | null;
  sourceUrl?: string | null;
  sourceDomain?: string | null;
  badges?: AffordabilityBadge[];
  lastSeenAt?: string | null;
  gone?: boolean;
  /** Groups organizing to secure this unit. Non-exclusive, several may form. */
  interestGroups?: HousingInterestGroup[];

  lat?: number | null;
  lng?: number | null;
};

export type HousingBoardStats = {
  activePosts: number;
  formingHouses: number;
  roomsOpen: number;
};

export type HousingBoardResponse = {
  posts: HousingPostView[];
  stats: HousingBoardStats;
};
