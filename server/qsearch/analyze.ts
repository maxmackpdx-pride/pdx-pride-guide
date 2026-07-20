import type { Business, Event } from "@shared/schema";
import { parsePacificDateTime } from "@shared/missedConnections";
import { isEventPlaceholderUrl } from "@shared/eventPoster";
import { normalizeTitleKey, findSubmissionMatches } from "@shared/submissionMatch";
import { normalizeVenueKey } from "@shared/venueLinks";
import type { IngestEventDraft } from "../ingest/types";
import { isPastEventListing } from "../ingest/dates";
import { matchDirectoryBrands, type DirectoryBrand } from "./directoryBrands";

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
};

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
  return condensed.map((row, index) => {
    const directoryBrands = businesses.length
      ? matchDirectoryBrands(row.draft, businesses, { sourceLabel: row.sourceLabel })
      : [];
    const matches = findSubmissionMatches(
      {
        title: row.draft.title,
        venueName: row.draft.venueName,
        address: row.draft.address,
        dateStart: row.draft.dateStart,
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
    let draft: IngestEventDraft = row.draft;
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

    return {
      id: `cand-${index}-${row.sourceId}`,
      draft,
      sourceId: row.sourceId,
      sourceLabel: row.sourceLabel,
      sourceUrl: row.sourceUrl,
      selected,
      recurring: row.recurring,
      recurringGroupId: row.recurringGroupId,
      recurringCount: row.recurringCount,
      condensed: row.condensed,
      conflicts,
      duplicates,
      strongDuplicate: strong,
      recurringDupAction: action,
      directoryBrands,
    };
  });
}
