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
>;

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

function normalizeVenueKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^the\s+/, "")
    .replace(/[''`]/g, "")
    .replace(/\b(club|bar|theatre|theater|lounge|pdx|portland)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddressKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/,?\s*portland,?\s*(or|oregon)?\s*\d{0,5}(-\d{4})?/gi, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2),
  );
}

function tokenOverlapScore(a: string, b: string): number {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const token of ta) {
    if (tb.has(token)) shared += 1;
  }
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : shared / union;
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
  return Boolean(ak && bk && ak === bk);
}

function startTimesClose(a: string, b: string, hours = 3): boolean {
  const ams = parsePacificDateTime(a);
  const bms = parsePacificDateTime(b);
  if (ams == null || bms == null) return false;
  return Math.abs(ams - bms) <= hours * 60 * 60 * 1000;
}

function confidenceFromScore(score: number): SubmissionMatchConfidence {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function scoreSubmissionAgainstEvent(
  submission: Matchable,
  event: Matchable & { id: number; status?: string },
): SubmissionMatchCandidate | null {
  const reasons: string[] = [];
  let score = 0;

  const subDay = pacificCalendarDate(submission.dateStart);
  const evtDay = pacificCalendarDate(event.dateStart);
  if (subDay && evtDay && subDay === evtDay) {
    score += 30;
    reasons.push("Same date");
  }

  if (venuesMatch(submission.venueName, event.venueName)) {
    score += 35;
    reasons.push("Same venue");
  }

  if (addressesMatch(submission.address, event.address)) {
    score += 15;
    reasons.push("Same address");
  }

  const titleScore = tokenOverlapScore(submission.title, event.title);
  if (titleScore >= 0.45) {
    score += Math.round(titleScore * 30);
    reasons.push("Similar title");
  }

  if (startTimesClose(submission.dateStart, event.dateStart)) {
    score += 20;
    reasons.push("Similar start time");
  }

  if (score < 30) return null;

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
  events: Array<Matchable & { id: number; status?: string }>,
  opts?: { minScore?: number; limit?: number; excludeEventId?: number | null },
): SubmissionMatchCandidate[] {
  const minScore = opts?.minScore ?? 30;
  const limit = opts?.limit ?? 5;
  const excludeId = opts?.excludeEventId ?? null;

  const ranked = events
    .filter(evt => evt.id !== excludeId)
    .map(evt => scoreSubmissionAgainstEvent(submission, evt))
    .filter((m): m is SubmissionMatchCandidate => m != null && m.score >= minScore)
    .sort((a, b) => b.score - a.score);

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
  const merged = [...new Set([...parseEventTypes(existing), ...parseEventTypes(submission)])];
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
    if (hasSubmissionValue(next)) {
      patch[key] = next as Event[typeof key];
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