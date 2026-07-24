import { pacificCalendarDate, parsePacificDateTime } from "./missedConnections";
import type { Event, Submission } from "./schema";

export type SubmissionMatchConfidence = "high" | "medium" | "low";

export type SubmissionMatchCandidate = {
  eventId: number;
  title: string;
  venueName: string;
  dateStart: string;
  dateEnd: string;
  status: string;
  score: number;
  confidence: SubmissionMatchConfidence;
  reasons: string[];
};

export type SubmissionMergeField = {
  key: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
};

type Matchable = Pick<
  Event | Submission,
  "title" | "venueName" | "address" | "dateStart" | "dateEnd"
> & {
  ticketUrl?: string | null;
};

const MERGE_FIELD_META: Array<{ key: keyof Event; label: string }> = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "venueName", label: "Venue" },
  { key: "address", label: "Address" },
  { key: "neighborhood", label: "Neighborhood" },
  { key: "dateStart", label: "Start" },
  { key: "dateEnd", label: "End" },
  { key: "dayOfWeek", label: "Day" },
  { key: "ageRequirement", label: "Age" },
  { key: "admission", label: "Admission" },
  { key: "ticketUrl", label: "Ticket / info link" },
  { key: "posterImageUrl", label: "Poster" },
  { key: "eventTypes", label: "Event types" },
];

/** Noise words stripped from titles before comparison. */
const TITLE_STOP = new Set([
  "the", "a", "an", "and", "or", "at", "of", "to", "for", "with", "in", "on",
  "pride", "week", "weekend", "edition", "presents", "featuring", "feat", "ft",
  "night", "party", "show", "live", "pdx", "portland", "official",
]);

function stripDiacritics(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeVenueKey(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[''`]/g, "")
    // Venue noise / corporate fluff
    .replace(/\b(club|bar|theatre|theater|lounge|showplace|pdx|portland|oregon|llc|inc)\b/g, " ")
    // Common aliases
    .replace(/\bdarcelle\s*x+v?\b/g, "darcelle")
    .replace(/\bcc\s*slaughters?\b/g, "cc slaughters")
    .replace(/\bstank\s*[x×]\s*yes\s*coach\b/g, "stank yes coach")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddressKey(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\broad\b/g, "rd")
    .replace(/\bnorthwest\b/g, "nw")
    .replace(/\bnortheast\b/g, "ne")
    .replace(/\bsouthwest\b/g, "sw")
    .replace(/\bsoutheast\b/g, "se")
    .replace(/,?\s*portland,?\s*(or|oregon)?\s*\d{0,5}(-\d{4})?/gi, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Collapse punctuation / separators so "STANK x YES COACH" ≈ "Stank Yes Coach". */
export function normalizeTitleKey(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[–-−]/g, "-")
    .replace(/\s*[x×]\s*/gi, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(value: string, extraStop?: Set<string>): Set<string> {
  return new Set(
    normalizeTitleKey(value)
      .split(/\s+/)
      .filter(w => w.length > 1 && !TITLE_STOP.has(w) && !extraStop?.has(w)),
  );
}

function venueTokenStop(...venues: string[]): Set<string> {
  const stop = new Set<string>();
  for (const v of venues) {
    for (const t of normalizeVenueKey(v || "").split(/\s+/)) {
      if (t.length > 1) stop.add(t);
    }
  }
  return stop;
}

/** Jaccard on content tokens (0–1). */
function tokenOverlapScore(a: string, b: string, extraStop?: Set<string>): number {
  const ta = titleTokens(a, extraStop);
  const tb = titleTokens(b, extraStop);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const token of Array.from(ta)) {
    if (tb.has(token)) shared += 1;
  }
  const union = new Set([...Array.from(ta), ...Array.from(tb)]).size;
  return union === 0 ? 0 : shared / union;
}

/** Containment: shorter title tokens ⊆ longer (e.g. "Fresh Paint" ⊂ "Fresh Paint at Badlands"). */
function titleContainmentScore(a: string, b: string, extraStop?: Set<string>): number {
  const ta = titleTokens(a, extraStop);
  const tb = titleTokens(b, extraStop);
  if (ta.size === 0 || tb.size === 0) return 0;
  const [small, large] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  if (small.size < 2) return 0;
  let hit = 0;
  for (const t of Array.from(small)) {
    if (large.has(t)) hit += 1;
  }
  return hit / small.size;
}

/**
 * Combined title similarity 0–1:
 * exact normalized, containment, token jaccard, prefix-ish startsWith.
 * Pass venue strings so "Badlands" in both titles doesn't fake a match.
 */
export function titleSimilarity(
  a: string,
  b: string,
  venueHints?: { a?: string; b?: string },
): { score: number; kind: string | null } {
  const na = normalizeTitleKey(a);
  const nb = normalizeTitleKey(b);
  if (!na || !nb) return { score: 0, kind: null };
  if (na === nb) return { score: 1, kind: "Exact title" };

  // Strip trailing " - night 1" style variants for near-exact
  const stripNight = (s: string) => s.replace(/\s+(night|part|day)\s*\d+\s*$/i, "").trim();
  if (stripNight(na) && stripNight(na) === stripNight(nb)) {
    return { score: 0.95, kind: "Near-exact title" };
  }

  const extraStop = venueTokenStop(venueHints?.a || "", venueHints?.b || "");
  const contain = titleContainmentScore(a, b, extraStop);
  const jaccard = tokenOverlapScore(a, b, extraStop);
  let best = Math.max(contain * 0.92, jaccard);

  // Long shared prefix of normalized strings (handles "Pride in Demand - Night 1" vs full name)
  const minLen = Math.min(na.length, nb.length);
  if (minLen >= 12) {
    let pref = 0;
    while (pref < minLen && na[pref] === nb[pref]) pref += 1;
    const prefRatio = pref / Math.max(na.length, nb.length);
    if (prefRatio >= 0.55) best = Math.max(best, prefRatio * 0.9);
  }

  if (best >= 0.85) return { score: best, kind: "Very similar title" };
  if (best >= 0.55) return { score: best, kind: "Similar title" };
  if (best >= 0.35) return { score: best, kind: "Partial title" };
  return { score: best, kind: best >= 0.2 ? "Weak title" : null };
}

function venuesMatch(a: string, b: string): boolean {
  const ak = normalizeVenueKey(a);
  const bk = normalizeVenueKey(b);
  if (!ak || !bk) return false;
  if (ak === bk) return true;
  if (ak.length >= 4 && bk.length >= 4 && (ak.includes(bk) || bk.includes(ak))) return true;
  return false;
}

function addressesMatch(a?: string | null, b?: string | null): boolean {
  const ak = a ? normalizeAddressKey(a) : "";
  const bk = b ? normalizeAddressKey(b) : "";
  if (!ak || !bk) return false;
  if (ak === bk) return true;
  // Same street number + shared token (e.g. "835 n lombard" vs "835 n lombard st")
  const numA = ak.match(/^\d+/)?.[0];
  const numB = bk.match(/^\d+/)?.[0];
  if (numA && numA === numB) {
    const ta = new Set(ak.split(" ").filter(w => w.length > 2));
    const tb = new Set(bk.split(" ").filter(w => w.length > 2));
    let shared = 0;
    for (const t of Array.from(ta)) if (tb.has(t)) shared += 1;
    if (shared >= 2) return true;
  }
  return false;
}

function startDeltaHours(a: string, b: string): number | null {
  const ams = parsePacificDateTime(a);
  const bms = parsePacificDateTime(b);
  if (ams == null || bms == null) return null;
  return Math.abs(ams - bms) / (60 * 60 * 1000);
}

function calendarDayDistance(a: string, b: string): number | null {
  const da = pacificCalendarDate(a);
  const db = pacificCalendarDate(b);
  if (!da || !db) return null;
  const ams = Date.parse(`${da}T12:00:00-07:00`);
  const bms = Date.parse(`${db}T12:00:00-07:00`);
  if (!Number.isFinite(ams) || !Number.isFinite(bms)) return null;
  return Math.round(Math.abs(ams - bms) / (24 * 60 * 60 * 1000));
}

/** Normalize ticket URLs so eventbrite.com/e/foo-123 and www.eventbrite.com/e/foo-123 match. */
export function ticketUrlKey(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(String(url).trim());
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    let path = u.pathname.replace(/\/+$/, "").toLowerCase();
    // Drop trailing slug fluff after last numeric id when present
    path = path.replace(/\/$/, "");
    if (!host || path.length < 2) return null;
    return `${host}${path}`;
  } catch {
    return null;
  }
}

function confidenceFromScore(score: number): SubmissionMatchConfidence {
  if (score >= 72) return "high";
  if (score >= 48) return "medium";
  return "low";
}

/**
 * Score one submission/edit against an existing event.
 * Multi-signal: title + venue/address + calendar day + start time + ticket URL.
 * Caps weak-title cases so "two different shows at Badlands Saturday" don't all go high.
 */
export function scoreSubmissionAgainstEvent(
  submission: Matchable,
  event: Matchable & { id: number; status?: string },
): SubmissionMatchCandidate | null {
  const reasons: string[] = [];
  let score = 0;

  const sameVenue = venuesMatch(submission.venueName || "", event.venueName || "");
  const title = titleSimilarity(submission.title || "", event.title || "", {
    a: submission.venueName || "",
    b: event.venueName || "",
  });
  const titleS = title.score;

  // --- Title (0–40) ---
  if (titleS >= 0.99) {
    score += 40;
    if (title.kind) reasons.push(title.kind);
  } else if (titleS >= 0.85) {
    score += 34;
    if (title.kind) reasons.push(title.kind);
  } else if (titleS >= 0.55) {
    score += Math.round(titleS * 32);
    if (title.kind) reasons.push(title.kind);
  } else if (titleS >= 0.35) {
    score += Math.round(titleS * 22);
    if (title.kind) reasons.push(title.kind);
  } else if (titleS >= 0.2) {
    score += Math.round(titleS * 12);
    if (title.kind) reasons.push(title.kind);
  }

  // --- Venue / address (0–32) ---
  if (sameVenue) {
    score += 28;
    reasons.push("Same venue");
  }
  if (addressesMatch(submission.address, event.address)) {
    score += sameVenue ? 8 : 18;
    reasons.push("Same address");
  }

  // --- Calendar day (0–28) ---
  const dayDist = calendarDayDistance(submission.dateStart || "", event.dateStart || "");
  if (dayDist === 0) {
    score += 28;
    reasons.push("Same date");
  } else if (dayDist === 1 && titleS >= 0.45) {
    // Adjacent day only counts with real title signal (multi-day / wrong day typos)
    score += 12;
    reasons.push("Adjacent date");
  } else if (dayDist != null && dayDist >= 3 && titleS < 0.85) {
    // Far-apart nights with weak title: almost never the same listing
    score -= 15;
  }

  // --- Start time proximity (0–18), only meaningful on same/adjacent day ---
  const hours = startDeltaHours(submission.dateStart || "", event.dateStart || "");
  if (hours != null && (dayDist === 0 || dayDist === 1)) {
    if (hours <= 0.75) {
      score += 18;
      reasons.push("Near-identical start");
    } else if (hours <= 2) {
      score += 14;
      reasons.push("Similar start time");
    } else if (hours <= 4) {
      score += 8;
      reasons.push("Start within 4h");
    }
  }

  // --- Ticket URL (0–25) ---
  const tA = ticketUrlKey(submission.ticketUrl);
  const tB = ticketUrlKey(event.ticketUrl);
  if (tA && tB && tA === tB) {
    score += 25;
    reasons.push("Same ticket link");
  }

  // --- Structure guards ---
  // Same venue + same night without title/ticket signal = different shows, not a twin.
  // ("Musical Mondays" vs "Fresh Paint" at Badlands must not surface as a duplicate.)
  if (titleS < 0.35 && !(tA && tB && tA === tB)) {
    if (sameVenue && dayDist === 0) {
      return null;
    }
    if (titleS < 0.15) {
      score = Math.min(score, 28);
    }
  }

  // Strong title + same day is enough for high even if venue strings differ slightly
  if (titleS >= 0.9 && dayDist === 0) {
    score = Math.max(score, 74);
  }

  // Exact title + same venue is a twin when same/adjacent day or times unknown -
  // NOT across weeks (weekly series nights must not block each other).
  if (
    titleS >= 0.99 &&
    sameVenue &&
    (dayDist === 0 || dayDist === 1 || dayDist == null)
  ) {
    score = Math.max(score, 80);
  }

  // Ticket URL + some title signal is strong (per-occurrence URLs usually differ by date)
  if (tA && tB && tA === tB && titleS >= 0.35) {
    score = Math.max(score, 78);
  }

  // Same series title at same venue on a different week = sibling night, not a duplicate listing.
  // Cap below "high" so re-scans can still add new dates for recurring shows.
  if (dayDist != null && dayDist >= 3 && !(tA && tB && tA === tB)) {
    score = Math.min(score, 68);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  if (score < 32) return null;

  return {
    eventId: event.id,
    title: event.title,
    venueName: event.venueName,
    dateStart: event.dateStart,
    dateEnd: event.dateEnd,
    status: event.status || "LIVE",
    score,
    confidence: confidenceFromScore(score),
    reasons,
  };
}

export function findSubmissionMatches(
  submission: Matchable,
  events: Array<Matchable & { id: number; status?: string; ticketUrl?: string | null }>,
  opts?: { minScore?: number; limit?: number; excludeEventId?: number | null },
): SubmissionMatchCandidate[] {
  const minScore = opts?.minScore ?? 32;
  const limit = opts?.limit ?? 5;
  const excludeId = opts?.excludeEventId ?? null;

  const ranked = events
    .filter(evt => evt.id !== excludeId)
    .map(evt => scoreSubmissionAgainstEvent(submission, evt))
    .filter((m): m is SubmissionMatchCandidate => m != null && m.score >= minScore)
    .sort((a, b) => b.score - a.score || a.eventId - b.eventId);

  return ranked.slice(0, limit);
}

function hasSubmissionValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function parseEventTypes(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function mergeEventTypes(existing: string | null | undefined, submission: string | null | undefined): string {
  const merged = Array.from(new Set([...parseEventTypes(existing), ...parseEventTypes(submission)]));
  return JSON.stringify(merged);
}

function formatFieldValue(key: string, value: unknown): string {
  if (value == null || value === "") return "(empty)";
  if (key === "eventTypes") {
    const tags = parseEventTypes(String(value));
    return tags.length ? tags.join(", ") : "(empty)";
  }
  if (key === "dateStart" || key === "dateEnd") {
    const ms = parsePacificDateTime(String(value));
    if (ms == null) return String(value);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ms));
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/** Build event patch: submission wins when it has a value; types are unioned. */
export function buildSubmissionMergePatch(
  existing: Event,
  submission: Submission,
): Partial<Event> {
  const patch: Partial<Event> = {};

  const stringFields = [
    "title",
    "description",
    "venueName",
    "address",
    "neighborhood",
    "dateStart",
    "dateEnd",
    "dayOfWeek",
    "ageRequirement",
    "admission",
    "ticketUrl",
    "posterImageUrl",
  ] as const;

  for (const key of stringFields) {
    const next = submission[key];
    if (hasSubmissionValue(next) && next != null) {
      // Submission columns are nullable; Event fields treat empty as undefined.
      (patch as Record<string, unknown>)[key] = next;
    }
  }

  patch.eventTypes = mergeEventTypes(existing.eventTypes, submission.eventTypes);

  const boolFields = [
    "isPublic",
    "isPrivate",
    "isHouseParty",
    "isSexPositive",
    "nudityOk",
  ] as const;

  for (const key of boolFields) {
    patch[key] = submission[key];
  }

  return patch;
}

export function diffSubmissionMerge(
  existing: Event,
  submission: Submission,
): SubmissionMergeField[] {
  const patch = buildSubmissionMergePatch(existing, submission);
  const rows: SubmissionMergeField[] = [];

  for (const { key, label } of MERGE_FIELD_META) {
    const before = formatFieldValue(key, existing[key as keyof Event]);
    const after = formatFieldValue(key, (patch as Record<string, unknown>)[key] ?? existing[key as keyof Event]);
    rows.push({
      key,
      label,
      before,
      after,
      changed: before !== after,
    });
  }

  return rows;
}

export function submissionHasStrongDuplicate(
  matches: SubmissionMatchCandidate[],
): SubmissionMatchCandidate | undefined {
  return matches.find(m => m.confidence === "high");
}