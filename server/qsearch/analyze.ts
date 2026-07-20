import type { Business, Event } from "@shared/schema";
import { parsePacificDateTime } from "@shared/missedConnections";
import { isEventPlaceholderUrl } from "@shared/eventPoster";
import {
  normalizeTitleKey,
  findSubmissionMatches,
  submissionHasStrongDuplicate,
  type SubmissionMatchCandidate,
} from "@shared/submissionMatch";
import { normalizeVenueKey } from "@shared/venueLinks";
import type { IngestEventDraft } from "../ingest/types";
import { isPastEventListing } from "../ingest/dates";
import { enrichEventPageUrl, isIngestFeedUrl } from "../ingest/eventPageUrl";
import {
  enrichDraftVenueFromSource,
  matchDirectoryBrands,
  type DirectoryBrand,
} from "./directoryBrands";

/** True when two titles are the same series (e.g. "BI Night" / "BI Night — July"). */
export function titlesSameSeries(a: string, b: string): boolean {
  const na = normalizeTitleKey(a || "");
  const nb = normalizeTitleKey(b || "");
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Containment only for meaningful keys (avoid "night" matching everything)
  if (na.length >= 6 && nb.length >= 6 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}

/**
 * Reuse a prior flyer ONLY for the same series — never "any event at this venue".
 * Example: BI Night scrape has a new time but no image → use catalog BI Night flyer.
 * Does not pull Friday Night Show art onto Saturday Night Show.
 */
export function priorFlyerFromCatalog(
  draft: IngestEventDraft,
  catalog: Event[],
  matchEventIds: number[],
): { url: string; eventId: number } | null {
  const tryPoster = (e: Event | undefined): { url: string; eventId: number } | null => {
    if (!e?.posterImageUrl || isEventPlaceholderUrl(e.posterImageUrl)) return null;
    return { url: e.posterImageUrl, eventId: e.id };
  };

  const draftTitle = draft.title || "";
  const vKey = normalizeVenueKey(draft.venueName || "");

  // 1) High-confidence matches first — still require same series title
  for (const id of matchEventIds) {
    const e = catalog.find(ev => ev.id === id);
    if (!e || !titlesSameSeries(draftTitle, e.title || "")) continue;
    if (vKey && e.venueName && normalizeVenueKey(e.venueName) && normalizeVenueKey(e.venueName) !== vKey) {
      // same title at a different venue is not the series we want
      continue;
    }
    const hit = tryPoster(e);
    if (hit) return hit;
  }

  // 2) Same series siblings: same title key + same venue (any date)
  const tKey = normalizeTitleKey(draftTitle);
  if (!tKey || tKey.length < 4) return null;
  let best: { url: string; eventId: number; dateStart: string } | null = null;
  for (const e of catalog) {
    if (!e.posterImageUrl || isEventPlaceholderUrl(e.posterImageUrl)) continue;
    if (!titlesSameSeries(draftTitle, e.title || "")) continue;
    if (vKey && e.venueName) {
      const ev = normalizeVenueKey(e.venueName);
      if (ev && ev !== vKey) continue;
    }
    const hit = tryPoster(e);
    if (!hit) continue;
    // Prefer most recent catalog instance with art
    if (!best || String(e.dateStart || "") > best.dateStart) {
      best = { ...hit, dateStart: String(e.dateStart || "") };
    }
  }
  return best ? { url: best.url, eventId: best.eventId } : null;
}

export type RecurringKind = "weekly" | "monthly" | "series" | null;

/** How the existing catalog listing relates to a recurring scrape hit */
export type CatalogRecurringStatus =
  | "catalog_already_recurring"
  | "catalog_one_off_needs_recurring_update"
  | "catalog_stale_instance_update"
  | "catalog_aligned"
  | "unknown";

export type VenueConflict = {
  eventId: number;
  title: string;
  dateStart: string;
  dateEnd: string;
  status: string;
  kind: "overlap" | "same_slot" | "likely_replacement";
  note: string;
};

export type DuplicateInfo = {
  eventId: number;
  title: string;
  score: number;
  confidence: string;
  dateStart?: string;
  dayOfWeek?: string | null;
  /** Inferred from catalog multi-instance patterns */
  catalogRecurring: RecurringKind;
  catalogRecurringStatus: CatalogRecurringStatus;
  note: string;
};

/** One scrape source that produced this listing (cross-source bundle). */
export type SourceBundleMember = {
  sourceId: string;
  sourceLabel: string;
  sourceUrl: string;
  /** Snapshot of key fields from that source (for conflict UI) */
  title?: string;
  venueName?: string;
  dateStart?: string;
  dateEnd?: string;
  ticketUrl?: string | null;
  eventPageUrl?: string | null;
  address?: string | null;
  posterImageUrl?: string | null;
  ageRequirement?: string | null;
  admission?: string | null;
};

/** Same event, different sources disagreeing on a field. */
export type FieldConflict = {
  field: string;
  label: string;
  values: Array<{ sourceLabel: string; sourceId: string; value: string }>;
};

export type ScanCandidate = {
  id: string;
  draft: IngestEventDraft;
  sourceId: string;
  sourceLabel: string;
  sourceUrl: string;
  selected: boolean;
  recurring: RecurringKind;
  recurringGroupId: string | null;
  recurringCount: number;
  condensed: boolean;
  conflicts: VenueConflict[];
  duplicates: DuplicateInfo[];
  strongDuplicate: DuplicateInfo | null;
  /** Action hint for UI when dup is weekly/monthly */
  recurringDupAction: string | null;
  /** Directory venue + group logos/colors when matched */
  directoryBrands: DirectoryBrand[];
  /**
   * When the same party was found on multiple calendars (venue site + EB + …),
   * all sources are listed here. Primary sourceId/sourceLabel stay the “best” row.
   */
  sourceBundle: SourceBundleMember[];
  /** Conflicting fields across sources in the bundle (time, venue, title, tickets, …). */
  fieldConflicts: FieldConflict[];
  /** Every occurrence in a condensed weekly/monthly series (for expand-on-approve). */
  memberDrafts: IngestEventDraft[];
  /**
   * Dates already on the main board (LIVE/HIDDEN) that were stripped from this card.
   * Empty when nothing was pruned.
   */
  alreadyOnBoard?: Array<{ date: string; eventId: number; title: string }>;
};

/** Catalog shape used for strong-dup checks (LIVE + HIDDEN count as “on board”). */
function catalogMatchRows(catalog: Event[]) {
  return catalog
    .filter(e => e.status !== "REMOVED")
    .map(e => ({
      id: e.id,
      title: e.title,
      venueName: e.venueName,
      address: e.address,
      dateStart: e.dateStart,
      dateEnd: e.dateEnd,
      status: e.status,
      ticketUrl: e.ticketUrl,
    }));
}

/** High-confidence match against main-board catalog, or null. */
export function strongCatalogDuplicate(
  draft: Pick<IngestEventDraft, "title" | "venueName" | "address" | "dateStart" | "dateEnd" | "ticketUrl">,
  catalog: Event[],
): SubmissionMatchCandidate | null {
  if (!draft?.title || !draft?.dateStart) return null;
  const matches = findSubmissionMatches(
    {
      title: draft.title,
      venueName: draft.venueName,
      address: draft.address,
      dateStart: draft.dateStart,
      dateEnd: draft.dateEnd,
      ticketUrl: draft.ticketUrl,
    },
    catalogMatchRows(catalog),
    { limit: 1, minScore: 32 },
  );
  return submissionHasStrongDuplicate(matches) ?? null;
}

function sortDraftsByDate(drafts: IngestEventDraft[]): IngestEventDraft[] {
  return [...drafts].sort((a, b) =>
    String(a.dateStart || "").localeCompare(String(b.dateStart || "")),
  );
}

/**
 * Strip occurrence dates already on the main board.
 * - One-off already listed → null (do not put in Review)
 * - Series with only known dates → null
 * - Series with some new nights → keep only new dates (re-score card)
 *
 * Prevents re-approve / re-scan spam of events already published or staged.
 */
export function applyCatalogCoverage(
  candidate: ScanCandidate,
  catalog: Event[],
): ScanCandidate | null {
  const membersRaw =
    Array.isArray(candidate.memberDrafts) && candidate.memberDrafts.length > 0
      ? candidate.memberDrafts
      : [candidate.draft];
  const members = sortDraftsByDate(membersRaw.filter(m => m?.title && m?.dateStart));
  if (!members.length) return null;

  const newMembers: IngestEventDraft[] = [];
  const alreadyOnBoard: Array<{ date: string; eventId: number; title: string }> = [];

  for (const md of members) {
    const strong = strongCatalogDuplicate(md, catalog);
    if (strong) {
      alreadyOnBoard.push({
        date: String(md.dateStart || "").slice(0, 10),
        eventId: strong.eventId,
        title: strong.title,
      });
    } else {
      newMembers.push(md);
    }
  }

  // Fully covered by main board — disappear from Review / never queue
  if (!newMembers.length) return null;

  const allNew = alreadyOnBoard.length === 0 && newMembers.length === members.length;
  if (allNew) {
    // Still drop pure strong-dup one-offs when memberDrafts was empty/single
    // and representative alone is a strong match (belt + suspenders)
    if (
      newMembers.length === 1 &&
      candidate.strongDuplicate?.confidence === "high" &&
      !(candidate.recurring === "weekly" || candidate.recurring === "monthly")
    ) {
      return null;
    }
    return { ...candidate, alreadyOnBoard: [] };
  }

  // Partial series: only new nights remain
  const draft = newMembers[0];
  const isSeries =
    newMembers.length >= 2 &&
    (candidate.recurring === "weekly" || candidate.recurring === "monthly");
  const warnings = Array.from(
    new Set([
      ...(draft.warnings || []),
      ...(candidate.draft.warnings || []),
      `Skipped ${alreadyOnBoard.length} date${alreadyOnBoard.length === 1 ? "" : "s"} already on the main board` +
        (alreadyOnBoard[0]
          ? ` (e.g. #${alreadyOnBoard[0].eventId} ${alreadyOnBoard[0].title})`
          : ""),
    ]),
  );

  // Re-match representative against catalog (should be clean)
  const matches = findSubmissionMatches(
    {
      title: draft.title,
      venueName: draft.venueName,
      address: draft.address,
      dateStart: draft.dateStart,
      dateEnd: draft.dateEnd,
      ticketUrl: draft.ticketUrl,
    },
    catalogMatchRows(catalog),
    { limit: 3, minScore: 32 },
  );
  const duplicates: DuplicateInfo[] = matches.map(m => {
    const prev = candidate.duplicates?.find(d => d.eventId === m.eventId);
    if (prev) return prev;
    return {
      eventId: m.eventId,
      title: m.title,
      score: m.score,
      confidence: m.confidence,
      dateStart: m.dateStart,
      dayOfWeek: null,
      catalogRecurring: null,
      catalogRecurringStatus: "unknown",
      note: m.reasons?.join("; ") || "",
    };
  });
  const strong = duplicates.find(d => d.confidence === "high") || null;

  return {
    ...candidate,
    draft: { ...draft, warnings },
    memberDrafts: isSeries ? newMembers : newMembers.length > 1 ? newMembers : [draft],
    recurring: isSeries ? candidate.recurring : null,
    recurringCount: isSeries ? newMembers.length : 1,
    condensed: isSeries || candidate.condensed,
    strongDuplicate: strong,
    duplicates,
    selected:
      !strong &&
      !(candidate.conflicts?.length > 0) &&
      !(draft.confidence != null && draft.confidence < 0.55) &&
      !(candidate.fieldConflicts?.length > 0),
    alreadyOnBoard,
    recurringDupAction: alreadyOnBoard.length
      ? `Only new dates queued — ${alreadyOnBoard.length} already on main board`
      : candidate.recurringDupAction,
  };
}

function wallParts(dateStart: string): { dayKey: string; minutes: number } | null {
  const m = dateStart.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return { dayKey: m[1], minutes: Number(m[2]) * 60 + Number(m[3]) };
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const as = parsePacificDateTime(aStart);
  const ae = parsePacificDateTime(aEnd) ?? as;
  const bs = parsePacificDateTime(bStart);
  const be = parsePacificDateTime(bEnd) ?? bs;
  if (as == null || ae == null || bs == null || be == null) return false;
  return as < be && bs < ae;
}

function sameVenue(a: string, b: string): boolean {
  const na = normalizeVenueKey(a);
  const nb = normalizeVenueKey(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function timeBucket(dateStart: string): number | null {
  const p = wallParts(dateStart);
  return p ? Math.round(p.minutes / 30) * 30 : null;
}

/**
 * Infer whether the catalog already models this night as a recurring series
 * (multiple LIVE/HIDDEN rows same title+venue+weekday+time bucket).
 */
export function assessCatalogRecurring(
  match: Pick<Event, "id" | "title" | "venueName" | "dateStart" | "dateEnd" | "dayOfWeek" | "status" | "adminNotes">,
  catalog: Event[],
): { kind: RecurringKind; status: CatalogRecurringStatus; instanceCount: number; note: string } {
  const title = normalizeTitleKey(match.title);
  const venue = normalizeVenueKey(match.venueName);
  const bucket = timeBucket(match.dateStart);
  const dow = (match.dayOfWeek || "").toUpperCase() || null;
  const notes = String(match.adminNotes || "").toLowerCase();

  const siblings = catalog.filter(e => {
    if (normalizeTitleKey(e.title) !== title) return false;
    if (!sameVenue(e.venueName, match.venueName)) return false;
    return true;
  });

  // Same weekday + similar start time across different calendar days
  const weeklySiblings = siblings.filter(e => {
    const eDow = (e.dayOfWeek || "").toUpperCase();
    if (dow && eDow && eDow !== dow) return false;
    const b = timeBucket(e.dateStart);
    if (bucket != null && b != null && Math.abs(b - bucket) > 30) return false;
    return true;
  });
  const distinctDays = new Set(weeklySiblings.map(e => e.dateStart.slice(0, 10)));
  const distinctMonths = new Set(weeklySiblings.map(e => e.dateStart.slice(0, 7)));

  const notesSayWeekly = /weekly|every\s+(mon|tue|wed|thu|fri|sat|sun)|recurring/i.test(notes);
  const notesSayMonthly = /monthly|every\s+month/i.test(notes);

  if (distinctDays.size >= 3 || (distinctDays.size >= 2 && notesSayWeekly)) {
    return {
      kind: "weekly",
      status: "catalog_already_recurring",
      instanceCount: distinctDays.size,
      note: `Catalog already has ${distinctDays.size} weekly-like instances for this title/venue — treat as series, don't re-add every week`,
    };
  }

  if (distinctMonths.size >= 2 || notesSayMonthly) {
    return {
      kind: "monthly",
      status: "catalog_already_recurring",
      instanceCount: distinctMonths.size,
      note: `Catalog already has multi-month instances — likely monthly series`,
    };
  }

  if (siblings.length === 1) {
    // Single listing but scrape says weekly
    return {
      kind: null,
      status: "catalog_one_off_needs_recurring_update",
      instanceCount: 1,
      note: `Catalog only has one listing (#${match.id}) — if this is weekly/monthly, update that event's schedule/notes (or expand instances) rather than creating a new row`,
    };
  }

  if (siblings.length >= 2 && distinctDays.size >= 2) {
    return {
      kind: "series",
      status: "catalog_already_recurring",
      instanceCount: siblings.length,
      note: `Catalog has ${siblings.length} related instances — already series-like`,
    };
  }

  // Same single event, check if date is older than scrape
  return {
    kind: null,
    status: "catalog_aligned",
    instanceCount: siblings.length,
    note: `Matches existing #${match.id}`,
  };
}

export function condenseRecurring(
  items: Array<{ draft: IngestEventDraft; sourceId: string; sourceLabel: string; sourceUrl: string }>,
): Array<{
  draft: IngestEventDraft;
  sourceId: string;
  sourceLabel: string;
  sourceUrl: string;
  recurring: RecurringKind;
  recurringGroupId: string | null;
  recurringCount: number;
  condensed: boolean;
  memberDrafts: IngestEventDraft[];
}> {
  type Entry = (typeof items)[number] & { idx: number };
  const entries: Entry[] = items.map((it, idx) => ({ ...it, idx }));

  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const venue = normalizeVenueKey(e.draft.venueName);
    const title = normalizeTitleKey(e.draft.title);
    const key = `${title}|${venue}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  const out: Array<{
    draft: IngestEventDraft;
    sourceId: string;
    sourceLabel: string;
    sourceUrl: string;
    recurring: RecurringKind;
    recurringGroupId: string | null;
    recurringCount: number;
    condensed: boolean;
    memberDrafts: IngestEventDraft[];
  }> = [];

  const consumed = new Set<number>();

  for (const [baseKey, group] of groups) {
    if (group.length < 2) continue;

    const byWeekday = new Map<string, Entry[]>();
    for (const e of group) {
      const parts = wallParts(e.draft.dateStart);
      if (!parts) continue;
      const dow = e.draft.dayOfWeek || String(new Date(`${parts.dayKey}T12:00:00-07:00`).getDay());
      const tb = Math.round(parts.minutes / 30) * 30;
      const wk = `w:${dow}:${tb}`;
      if (!byWeekday.has(wk)) byWeekday.set(wk, []);
      byWeekday.get(wk)!.push(e);
    }

    for (const [wk, members] of byWeekday) {
      if (members.length < 2) continue;
      members.sort((a, b) => a.draft.dateStart.localeCompare(b.draft.dateStart));
      // Prefer next upcoming occurrence as the representative (not the oldest past one)
      const upcoming = members.find(m => !isPastEventListing(m.draft));
      const primary = upcoming || members[0];
      const groupId = `weekly:${baseKey}:${wk}`;
      for (const m of members) consumed.add(m.idx);
      out.push({
        draft: {
          ...primary.draft,
          description:
            `${primary.draft.description}\n\n[QSearch] Weekly series — ${members.length} dates condensed (showing: ${primary.draft.dateStart}).`.slice(
              0,
              8000,
            ),
          warnings: [
            ...primary.draft.warnings,
            `Weekly series: ${members.length} occurrences condensed`,
          ],
        },
        sourceId: primary.sourceId,
        sourceLabel: primary.sourceLabel,
        sourceUrl: primary.sourceUrl,
        recurring: "weekly",
        recurringGroupId: groupId,
        recurringCount: members.length,
        condensed: true,
        memberDrafts: members.map(m => m.draft),
      });
    }

    const monthly = group.filter(e => !consumed.has(e.idx));
    if (monthly.length >= 2) {
      const byDom = new Map<string, Entry[]>();
      for (const e of monthly) {
        const parts = wallParts(e.draft.dateStart);
        if (!parts) continue;
        const dom = Number(parts.dayKey.slice(8, 10));
        const tb = Math.round(parts.minutes / 30) * 30;
        const bucket = `${dom}:${tb}`;
        if (!byDom.has(bucket)) byDom.set(bucket, []);
        byDom.get(bucket)!.push(e);
      }
      for (const [bucket, members] of byDom) {
        if (members.length < 2) continue;
        const months = new Set(members.map(m => m.draft.dateStart.slice(0, 7)));
        if (months.size < 2) continue;
        members.sort((a, b) => a.draft.dateStart.localeCompare(b.draft.dateStart));
        const upcoming = members.find(m => !isPastEventListing(m.draft));
        const primary = upcoming || members[0];
        for (const m of members) consumed.add(m.idx);
        out.push({
          draft: {
            ...primary.draft,
            description:
              `${primary.draft.description}\n\n[QSearch] Monthly series — ${members.length} dates condensed (showing: ${primary.draft.dateStart}).`.slice(
                0,
                8000,
              ),
            warnings: [
              ...primary.draft.warnings,
              `Monthly series: ${members.length} occurrences condensed`,
            ],
          },
          sourceId: primary.sourceId,
          sourceLabel: primary.sourceLabel,
          sourceUrl: primary.sourceUrl,
          recurring: "monthly",
          recurringGroupId: `monthly:${baseKey}:${bucket}`,
          recurringCount: members.length,
          condensed: true,
          memberDrafts: members.map(m => m.draft),
        });
      }
    }
  }

  for (const e of entries) {
    if (consumed.has(e.idx)) continue;
    out.push({
      draft: e.draft,
      sourceId: e.sourceId,
      sourceLabel: e.sourceLabel,
      sourceUrl: e.sourceUrl,
      recurring: null,
      recurringGroupId: null,
      recurringCount: 1,
      condensed: false,
      memberDrafts: [e.draft],
    });
  }

  return out;
}

export function findVenueConflicts(draft: IngestEventDraft, catalog: Event[]): VenueConflict[] {
  const conflicts: VenueConflict[] = [];
  for (const evt of catalog) {
    if (!sameVenue(draft.venueName, evt.venueName)) continue;
    if (!overlaps(draft.dateStart, draft.dateEnd, evt.dateStart, evt.dateEnd)) continue;

    const titleSim =
      normalizeTitleKey(draft.title) === normalizeTitleKey(evt.title)
        ? 1
        : normalizeTitleKey(draft.title).includes(normalizeTitleKey(evt.title)) ||
            normalizeTitleKey(evt.title).includes(normalizeTitleKey(draft.title))
          ? 0.7
          : 0.3;

    let kind: VenueConflict["kind"] = "overlap";
    let note = `Overlaps ${evt.status} listing #${evt.id} at same venue`;
    if (titleSim >= 0.7) {
      kind = "same_slot";
      note = `Same venue + similar title as #${evt.id} — likely already listed`;
    } else {
      kind = "likely_replacement";
      note = `Different title at same venue/time as #${evt.id} — one-off may replace a repeat, or keep both`;
    }

    conflicts.push({
      eventId: evt.id,
      title: evt.title,
      dateStart: evt.dateStart,
      dateEnd: evt.dateEnd,
      status: evt.status,
      kind,
      note,
    });
  }
  return conflicts.slice(0, 5);
}

function recurringDupAction(
  scrapeRecurring: RecurringKind,
  catalogStatus: CatalogRecurringStatus,
  catalogKind: RecurringKind,
): string | null {
  if (!scrapeRecurring && catalogStatus === "catalog_aligned") return null;

  if (scrapeRecurring === "weekly" || scrapeRecurring === "monthly") {
    if (catalogStatus === "catalog_already_recurring" && catalogKind === scrapeRecurring) {
      return `Scrape is ${scrapeRecurring}; catalog already models ${catalogKind} — skip create, optional flyer/time refresh only`;
    }
    if (catalogStatus === "catalog_already_recurring") {
      return `Scrape is ${scrapeRecurring}; catalog has series (${catalogKind || "series"}) — don't stack another series; update existing if times changed`;
    }
    if (catalogStatus === "catalog_one_off_needs_recurring_update") {
      return `Scrape is ${scrapeRecurring} but catalog is a one-off — UPDATE existing event to recurring (or add series instances), do not create a second host listing`;
    }
    return `Scrape is ${scrapeRecurring} — check catalog is set up for recurring before adding`;
  }

  if (catalogStatus === "catalog_already_recurring") {
    return `Catalog is already ${catalogKind || "recurring"} — this scrape may be one instance; prefer update over duplicate`;
  }
  return null;
}

type CondensedRow = {
  draft: IngestEventDraft;
  sourceId: string;
  sourceLabel: string;
  sourceUrl: string;
  recurring: RecurringKind;
  recurringGroupId: string | null;
  recurringCount: number;
  condensed: boolean;
  memberDrafts: IngestEventDraft[];
  sourceBundle?: SourceBundleMember[];
  fieldConflicts?: FieldConflict[];
};

function normalizeComparableUrl(raw: string | null | undefined): string | null {
  if (!raw || !/^https?:\/\//i.test(raw)) return null;
  try {
    const u = new URL(raw);
    // Drop tracking noise; keep path identity
    u.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(
      k => u.searchParams.delete(k),
    );
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    // Feed/API URLs are not event identity
    if (
      /format=json|wp-json|\/tribe\/events\/v1|\.ics(\?|$)|\/ics\/?(\?|$)|ical=1/i.test(
        u.pathname + u.search,
      )
    ) {
      return null;
    }
    return `${host}${u.pathname.replace(/\/$/, "").toLowerCase()}${u.search}`;
  } catch {
    return null;
  }
}

function draftDayKey(d: IngestEventDraft): string {
  return String(d.dateStart || "").slice(0, 10);
}

function isWeakVenueNameLocal(name: string | null | undefined): boolean {
  const v = String(name || "").trim();
  if (!v || v.length < 2) return true;
  return /^(tba|tbd|n\/?a|unknown|various|online|virtual|see listing|multiple|portland)$/i.test(v);
}

/** Completeness score — prefer richer scrape as primary when bundling. */
function draftRichness(d: IngestEventDraft): number {
  let s = 0;
  if (d.posterImageUrl && !isEventPlaceholderUrl(d.posterImageUrl)) s += 40;
  if (d.description && d.description.length > 80) s += 15;
  if (d.description && d.description.length > 300) s += 10;
  if (!isWeakVenueNameLocal(d.venueName)) s += 20;
  if (d.ticketUrl) s += 12;
  if (d.eventPageUrl) s += 10;
  if (d.address) s += 8;
  if (d.ageRequirement) s += 4;
  if (d.admission) s += 4;
  if (d.confidence != null) s += Math.round(d.confidence * 10);
  return s;
}

/**
 * URLs that identify a *specific* event listing — not a shared feed/calendar
 * all nights inherit (Badlands worker API, ICS feed, venue /calendar home).
 * Never use draft.sourceUrl here: it's almost always the list feed for the whole scan.
 */
function uniqueEventIdentityUrls(d: IngestEventDraft): string[] {
  const out: string[] = [];
  for (const raw of [d.ticketUrl, d.eventPageUrl]) {
    if (!raw || !/^https?:\/\//i.test(raw)) continue;
    if (isIngestFeedUrl(raw)) continue;
    if (/\/api\/calendar|workers\.dev\/api\/|format=json|ical=1|\.ics(\?|$)/i.test(raw)) {
      continue;
    }
    // Bare venue calendar index (no /event(s)/ slug)
    try {
      const path = new URL(raw).pathname.replace(/\/+$/, "") || "/";
      if (/\/calendar$/i.test(path) && !/\/events?\//i.test(path)) continue;
    } catch {
      continue;
    }
    const n = normalizeComparableUrl(raw);
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

function sameEventCrossSource(a: CondensedRow, b: CondensedRow): boolean {
  // Never merge two different weekly/monthly series groups
  if (
    a.recurringGroupId &&
    b.recurringGroupId &&
    a.recurringGroupId !== b.recurringGroupId
  ) {
    return false;
  }

  // Shared feed URLs must NOT force a merge (was collapsing all Badlands nights into one card)
  const urlsA = uniqueEventIdentityUrls(a.draft);
  const urlsB = uniqueEventIdentityUrls(b.draft);
  if (urlsA.length && urlsB.length && urlsA.some(u => urlsB.includes(u))) {
    return true;
  }

  const dayA = draftDayKey(a.draft);
  const dayB = draftDayKey(b.draft);
  if (!dayA || !dayB || dayA !== dayB) return false;

  if (!titlesSameSeries(a.draft.title, b.draft.title)) return false;

  const venueOk =
    sameVenue(a.draft.venueName, b.draft.venueName) ||
    isWeakVenueNameLocal(a.draft.venueName) ||
    isWeakVenueNameLocal(b.draft.venueName);
  if (!venueOk) return false;

  const ta = timeBucket(a.draft.dateStart);
  const tb = timeBucket(b.draft.dateStart);
  if (ta != null && tb != null && Math.abs(ta - tb) > 90) return false;

  return true;
}

function normFieldValue(field: string, raw: string): string {
  const s = String(raw || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (field === "dateStart" || field === "dateEnd") {
    // Compare to minute precision
    return s.slice(0, 16);
  }
  if (field === "ticketUrl" || field === "eventPageUrl") {
    return normalizeComparableUrl(raw) || s;
  }
  if (field === "venueName") return normalizeVenueKey(raw) || s;
  if (field === "title") return normalizeTitleKey(raw) || s;
  return s;
}

const BUNDLE_FIELDS: Array<{ field: keyof IngestEventDraft; label: string }> = [
  { field: "title", label: "Title" },
  { field: "venueName", label: "Venue" },
  { field: "address", label: "Address" },
  { field: "dateStart", label: "Start" },
  { field: "dateEnd", label: "End" },
  { field: "ticketUrl", label: "Tickets" },
  { field: "eventPageUrl", label: "Event page" },
  { field: "ageRequirement", label: "Age" },
  { field: "admission", label: "Admission" },
  { field: "posterImageUrl", label: "Flyer" },
];

function buildFieldConflicts(members: CondensedRow[]): FieldConflict[] {
  const out: FieldConflict[] = [];
  for (const { field, label } of BUNDLE_FIELDS) {
    const byNorm = new Map<string, Array<{ sourceLabel: string; sourceId: string; value: string }>>();
    for (const m of members) {
      const raw = String((m.draft as any)[field] ?? "").trim();
      if (!raw) continue;
      if (field === "posterImageUrl" && isEventPlaceholderUrl(raw)) continue;
      const key = normFieldValue(field, raw);
      if (!key) continue;
      const list = byNorm.get(key) || [];
      list.push({
        sourceLabel: m.sourceLabel,
        sourceId: m.sourceId,
        value: field === "dateStart" || field === "dateEnd" ? raw.slice(0, 16).replace("T", " ") : raw.length > 80 ? raw.slice(0, 77) + "…" : raw,
      });
      byNorm.set(key, list);
    }
    if (byNorm.size <= 1) continue;
    const values: FieldConflict["values"] = [];
    for (const list of byNorm.values()) {
      // One representative per distinct value
      values.push(list[0]);
    }
    if (values.length > 1) {
      out.push({ field, label, values });
    }
  }
  return out;
}

function mergeDraftsFromBundle(members: CondensedRow[]): IngestEventDraft {
  const ranked = [...members].sort((a, b) => draftRichness(b.draft) - draftRichness(a.draft));
  const primary = ranked[0].draft;
  let out: IngestEventDraft = { ...primary };

  const fill = <K extends keyof IngestEventDraft>(key: K, prefer?: (v: unknown) => boolean) => {
    if (out[key] != null && String(out[key]).trim() !== "") {
      if (key === "posterImageUrl" && isEventPlaceholderUrl(String(out[key]))) {
        /* fall through to replace */
      } else if (key === "venueName" && isWeakVenueNameLocal(String(out[key]))) {
        /* fall through */
      } else {
        return;
      }
    }
    for (const m of ranked) {
      const v = m.draft[key];
      if (v == null || String(v).trim() === "") continue;
      if (prefer && !prefer(v)) continue;
      if (key === "posterImageUrl" && isEventPlaceholderUrl(String(v))) continue;
      if (key === "venueName" && isWeakVenueNameLocal(String(v))) continue;
      (out as any)[key] = v;
      return;
    }
  };

  fill("venueName");
  fill("address");
  fill("ticketUrl");
  fill("eventPageUrl");
  fill("posterImageUrl");
  fill("ageRequirement");
  fill("admission");
  // Prefer longest description
  for (const m of ranked) {
    if ((m.draft.description || "").length > (out.description || "").length) {
      out = { ...out, description: m.draft.description };
    }
  }

  const sourceNames = Array.from(new Set(members.map(m => m.sourceLabel)));
  const warnings = [
    ...(out.warnings || []),
    sourceNames.length > 1
      ? `Same event on ${sourceNames.length} sources: ${sourceNames.join(" · ")}`
      : "",
  ].filter(Boolean);
  return { ...out, warnings: Array.from(new Set(warnings)) };
}

/**
 * Bundle the same party found on multiple calendars (venue site + Eventbrite + …)
 * into one review card, and record any field-level conflicts.
 */
export function bundleCrossSourceEvents(rows: CondensedRow[]): CondensedRow[] {
  if (rows.length < 2) {
    return rows.map(r => ({
      ...r,
      sourceBundle: [
        {
          sourceId: r.sourceId,
          sourceLabel: r.sourceLabel,
          sourceUrl: r.sourceUrl,
          title: r.draft.title,
          venueName: r.draft.venueName,
          dateStart: r.draft.dateStart,
          dateEnd: r.draft.dateEnd,
          ticketUrl: r.draft.ticketUrl,
          eventPageUrl: r.draft.eventPageUrl,
          address: r.draft.address,
          posterImageUrl: r.draft.posterImageUrl,
          ageRequirement: r.draft.ageRequirement,
          admission: r.draft.admission,
        },
      ],
      fieldConflicts: [],
    }));
  }

  // Union-find
  const parent = rows.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const unite = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      if (sameEventCrossSource(rows[i], rows[j])) unite(i, j);
    }
  }

  const clusters = new Map<number, number[]>();
  for (let i = 0; i < rows.length; i++) {
    const r = find(i);
    const list = clusters.get(r) || [];
    list.push(i);
    clusters.set(r, list);
  }

  const out: CondensedRow[] = [];
  for (const idxs of clusters.values()) {
    const members = idxs.map(i => rows[i]);
    if (members.length === 1) {
      const r = members[0];
      out.push({
        ...r,
        sourceBundle: [
          {
            sourceId: r.sourceId,
            sourceLabel: r.sourceLabel,
            sourceUrl: r.sourceUrl,
            title: r.draft.title,
            venueName: r.draft.venueName,
            dateStart: r.draft.dateStart,
            dateEnd: r.draft.dateEnd,
            ticketUrl: r.draft.ticketUrl,
            eventPageUrl: r.draft.eventPageUrl,
            address: r.draft.address,
            posterImageUrl: r.draft.posterImageUrl,
            ageRequirement: r.draft.ageRequirement,
            admission: r.draft.admission,
          },
        ],
        fieldConflicts: [],
      });
      continue;
    }

    // Prefer richest draft as primary; keep recurring from any condensed member
    members.sort((a, b) => draftRichness(b.draft) - draftRichness(a.draft));
    const primary = members[0];
    const fieldConflicts = buildFieldConflicts(members);
    const draft = mergeDraftsFromBundle(members);
    if (fieldConflicts.length) {
      draft.warnings = [
        ...(draft.warnings || []),
        `Conflicting info across sources: ${fieldConflicts.map(f => f.label).join(", ")}`,
      ];
    }

    const sourceBundle: SourceBundleMember[] = members.map(m => ({
      sourceId: m.sourceId,
      sourceLabel: m.sourceLabel,
      sourceUrl: m.sourceUrl,
      title: m.draft.title,
      venueName: m.draft.venueName,
      dateStart: m.draft.dateStart,
      dateEnd: m.draft.dateEnd,
      ticketUrl: m.draft.ticketUrl,
      eventPageUrl: m.draft.eventPageUrl,
      address: m.draft.address,
      posterImageUrl: m.draft.posterImageUrl,
      ageRequirement: m.draft.ageRequirement,
      admission: m.draft.admission,
    }));

    // De-dupe sources by sourceId
    const seenSrc = new Set<string>();
    const uniqueBundle = sourceBundle.filter(s => {
      if (seenSrc.has(s.sourceId)) return false;
      seenSrc.add(s.sourceId);
      return true;
    });

    const recurringMember = members.find(m => m.recurring) || primary;
    out.push({
      draft,
      sourceId: primary.sourceId,
      sourceLabel:
        uniqueBundle.length > 1
          ? `${primary.sourceLabel} +${uniqueBundle.length - 1} more`
          : primary.sourceLabel,
      sourceUrl: primary.sourceUrl,
      recurring: recurringMember.recurring,
      recurringGroupId: recurringMember.recurringGroupId,
      recurringCount: Math.max(...members.map(m => m.recurringCount || 1)),
      condensed: true,
      memberDrafts: members.flatMap(m => m.memberDrafts),
      sourceBundle: uniqueBundle,
      fieldConflicts,
    });
  }

  return out;
}

export function buildScanCandidates(
  raw: Array<{ draft: IngestEventDraft; sourceId: string; sourceLabel: string; sourceUrl: string }>,
  catalog: Event[],
  businesses: Business[] = [],
  opts?: { includePastEvents?: boolean },
): ScanCandidate[] {
  const includePast = opts?.includePastEvents === true;
  // Filter past occurrences before condense so weekly groups still form from future dates
  const filteredRaw = includePast
    ? raw
    : raw.filter(r => !isPastEventListing(r.draft));
  const condensed = condenseRecurring(filteredRaw).filter(row => {
    if (includePast) return true;
    // Representative should still be upcoming; drop fully-past series
    return !isPastEventListing(row.draft);
  });
  // Same party on multiple sites → one review card + field conflicts
  const bundled = bundleCrossSourceEvents(condensed);
  return bundled.map((row, index) => {
    // Resolve TBA / street-only LOCATION → directory venue (e.g. Sanctuary ICS)
    // + human event page URL when feed omitted it
    let resolvedDraft = businesses.length
      ? enrichDraftVenueFromSource(row.draft, businesses, {
          sourceLabel: row.sourceLabel,
          sourceId: row.sourceId,
        })
      : row.draft;
    resolvedDraft = enrichEventPageUrl(resolvedDraft);
    const directoryBrands = businesses.length
      ? matchDirectoryBrands(resolvedDraft, businesses, {
          sourceLabel: row.sourceLabel,
          sourceId: row.sourceId,
        })
      : [];
    const matches = findSubmissionMatches(
      {
        title: resolvedDraft.title,
        venueName: resolvedDraft.venueName,
        address: resolvedDraft.address,
        dateStart: resolvedDraft.dateStart,
        dateEnd: row.draft.dateEnd,
        ticketUrl: row.draft.ticketUrl,
      },
      catalog.map(e => ({
        id: e.id,
        title: e.title,
        venueName: e.venueName,
        address: e.address,
        dateStart: e.dateStart,
        dateEnd: e.dateEnd,
        status: e.status,
        ticketUrl: e.ticketUrl,
      })),
      { limit: 3, minScore: 32 },
    );

    const duplicates: DuplicateInfo[] = matches.map(m => {
      const full = catalog.find(e => e.id === m.eventId);
      const assessment = full
        ? assessCatalogRecurring(full, catalog)
        : {
            kind: null as RecurringKind,
            status: "unknown" as CatalogRecurringStatus,
            instanceCount: 0,
            note: "Match not found in catalog",
          };

      // If scrape is weekly/monthly and catalog is one-off, escalate note
      let note = assessment.note;
      if (
        (row.recurring === "weekly" || row.recurring === "monthly") &&
        assessment.status === "catalog_one_off_needs_recurring_update"
      ) {
        note = `NEEDS UPDATE: scrape is ${row.recurring} (${row.recurringCount} dates) but #${m.eventId} is a single listing — convert that event to recurring / add instances rather than creating a new one`;
      } else if (
        (row.recurring === "weekly" || row.recurring === "monthly") &&
        assessment.status === "catalog_already_recurring"
      ) {
        note = `OK series: catalog already ${assessment.kind || "recurring"} (${assessment.instanceCount} instances). Skip new event; update flyer/times on #${m.eventId} if needed`;
      }

      return {
        eventId: m.eventId,
        title: m.title,
        score: m.score,
        confidence: m.confidence,
        dateStart: full?.dateStart,
        dayOfWeek: full?.dayOfWeek,
        catalogRecurring: assessment.kind,
        catalogRecurringStatus: assessment.status,
        note,
      };
    });

    const strong = duplicates.find(m => m.confidence === "high") || null;
    const conflicts = findVenueConflicts(row.draft, catalog);
    const hasConflict = conflicts.length > 0;
    const lowConf = row.draft.confidence != null && row.draft.confidence < 0.55;
    const needsRecurringUpdate = duplicates.some(
      d => d.catalogRecurringStatus === "catalog_one_off_needs_recurring_update",
    );
    const action = strong
      ? recurringDupAction(row.recurring, strong.catalogRecurringStatus, strong.catalogRecurring)
      : row.recurring
        ? recurringDupAction(row.recurring, "unknown", null)
        : null;

    // Deselect strong dups; also deselect when weekly scrape matches one-off (needs human update path)
    const selected = !strong && !hasConflict && !lowConf && !needsRecurringUpdate;

    // Same-series prior flyer only (e.g. BI Night update, no new art → old BI Night flyer).
    // Never borrow another night's art from the same venue.
    let draft: IngestEventDraft = resolvedDraft;
    const warnings = [...(draft.warnings || [])];
    if (action) warnings.push(action);

    const scrapeMissingFlyer =
      !draft.posterImageUrl || isEventPlaceholderUrl(draft.posterImageUrl);

    if (scrapeMissingFlyer) {
      // Prefer high-confidence title matches only
      const matchIds = [
        ...(strong && strong.confidence === "high" ? [strong.eventId] : []),
        ...duplicates.filter(d => d.confidence === "high").map(d => d.eventId),
      ];
      const prior = priorFlyerFromCatalog(draft, catalog, matchIds);
      if (prior) {
        draft = {
          ...draft,
          posterImageUrl: prior.url,
        };
        warnings.push(
          `Flyer reused from prior same-series catalog event #${prior.eventId}`,
        );
      }
    }

    draft = warnings.length
      ? { ...draft, warnings: Array.from(new Set(warnings)) }
      : draft;

    const sourceBundle: SourceBundleMember[] =
      row.sourceBundle && row.sourceBundle.length
        ? row.sourceBundle
        : [
            {
              sourceId: row.sourceId,
              sourceLabel: row.sourceLabel,
              sourceUrl: row.sourceUrl,
            },
          ];
    const fieldConflicts: FieldConflict[] = row.fieldConflicts || [];
    if (fieldConflicts.length) {
      // Multi-source disagreement needs a human look — don't auto-select
      // (selected already computed; force off)
    }

    return {
      id: `cand-${index}-${row.sourceId}`,
      draft,
      sourceId: row.sourceId,
      sourceLabel: row.sourceLabel,
      sourceUrl: row.sourceUrl,
      selected: selected && fieldConflicts.length === 0,
      recurring: row.recurring,
      recurringGroupId: row.recurringGroupId,
      recurringCount: row.recurringCount,
      condensed: row.condensed || sourceBundle.length > 1,
      /** All series dates (for “create full series” approve). Empty if one-off. */
      memberDrafts: row.memberDrafts || [],
      conflicts,
      duplicates,
      strongDuplicate: strong,
      recurringDupAction: action,
      directoryBrands,
      sourceBundle,
      fieldConflicts,
    };
  })
    // Main-board de-dupe: drop fully-covered one-offs / series; keep only new series nights
    .map(c => applyCatalogCoverage(c, catalog))
    .filter((c): c is ScanCandidate => c != null);
}
