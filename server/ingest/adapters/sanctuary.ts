/**
 * Sanctuary Club dedicated ingest path.
 *
 * ICS is the structured source (~400 VEVENTs, no ATTACH flyers). We:
 * 1. Fetch the trusted ICS feed
 * 2. Drop past listings
 * 3. Infer event page URLs + enrich flyers/descriptions from detail pages
 * 4. Reuse series flyers when an occurrence only has the site logo
 * 5. Force Pearl District venue when LOCATION is empty/TBA/address-only
 */
import { getTrustedVenue } from "@shared/trustedVenues";
import type { IngestEventDraft } from "../types";
import { fetchIngestSource } from "../fetchSource";
import { parseIcs } from "../parseIcs";
import { isPastEventListing } from "../dates";
import { enrichEventPageUrl } from "../eventPageUrl";
import { enrichDraftsFromEventPages } from "../enrichEventPage";

const SANCTUARY_VENUE = "Sanctuary Club";
const SANCTUARY_ADDRESS = "33 NW 9th Ave, Portland, OR 97209";
const SANCTUARY_NEIGHBORHOOD = "Pearl District";

/**
 * Schema ageRequirement enum is ALL_AGES | 18_PLUS | 21_PLUS (underscore form).
 * Sanctuary is a 21+ sex club — never 18+ / ALL_AGES.
 */
export const SANCTUARY_AGE_REQUIREMENT = "21_PLUS" as const;
/** JSON tags stored in eventTypes (see shared/eventTypeTags SEX_POSITIVE / NUDITY_OK). */
const SANCTUARY_EVENT_TYPE_TAGS = ["SEX_POSITIVE", "NUDITY_OK", "KINK"] as const;

const DEFAULT_FEED =
  getTrustedVenue("sanctuary-ics")?.feedUrl ||
  "https://pdxsanctuary.com/events/calendar/sanctuary/ics/";

/** Site logo / brand art — not a real event flyer. */
export function isSanctuaryLogoPoster(url: string | null | undefined): boolean {
  if (!url || !String(url).trim()) return true;
  return /logo|cropped-|favicon|t_color_full|trans_color/i.test(url);
}

/**
 * Normalize titles for series matching: "Game Bang — July 2026 PRIDE" → "game bang".
 * Strips dates, months, years, ordinals, bare numbers, and "pride".
 */
export function seriesTitleKey(title: string): string {
  return String(title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/[–—−]/g, " ")
    .replace(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/g,
      " ",
    )
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\b\d{1,2}(st|nd|rd|th)\b/g, " ")
    .replace(/\bpride\b/g, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── Events-index URL harvest ─────────────────────────────────────────────
 * Sanctuary's real event URLs carry WP collision suffixes and per-occurrence
 * dates ("/events/game-bang-blanket-forts-3-2/2026-07-22/") that title-slug
 * inference can never predict — guessed slugs 404 and the flyer enrich step
 * gets no page to pull from. So: fetch the public /events/ index, harvest the
 * REAL hrefs, and match them to ICS drafts by title tokens + occurrence day.
 * Slug inference (enrichEventPageUrl) stays as fallback for unmatched drafts.
 */

export type SanctuaryIndexEntry = {
  /** Absolute event page URL (with occurrence date path when present) */
  url: string;
  /** Raw slug segment, e.g. "game-bang-blanket-forts-3-2" */
  slug: string;
  /** Occurrence day from the URL path (YYYY-MM-DD) or null */
  day: string | null;
};

/** Non-event /events/* paths (views, feeds, archives) — never event pages. */
const SANCTUARY_INDEX_EXCLUDE =
  /^(calendar|category|categories|list|month|week|day|today|tag|page|feed|photo|map|ical|search)$/i;

export function extractSanctuaryEventIndex(
  html: string,
  baseUrl = "https://pdxsanctuary.com/",
): SanctuaryIndexEntry[] {
  const out: SanctuaryIndexEntry[] = [];
  const seen = new Set<string>();
  const re =
    /href=["']((?:https?:\/\/(?:www\.)?pdxsanctuary\.com)?\/events\/([a-z0-9][a-z0-9-]*)\/(?:(\d{4}-\d{2}-\d{2})\/)?)(?:["'#?])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) != null) {
    const slug = m[2];
    if (SANCTUARY_INDEX_EXCLUDE.test(slug)) continue;
    let url: string;
    try {
      url = new URL(m[1], baseUrl).toString();
    } catch {
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, slug, day: m[3] || null });
  }
  return out;
}

/** Next-page URLs from the index (rel=next or common WP pagination shapes). */
export function extractSanctuaryIndexNextUrls(html: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  const push = (raw: string) => {
    try {
      const u = new URL(raw.replace(/&amp;/g, "&"), baseUrl).toString();
      if (/pdxsanctuary\.com/i.test(u)) urls.add(u);
    } catch {
      /* ignore */
    }
  };
  let m: RegExpExecArray | null;
  const relNext = /<a[^>]+rel=["']next["'][^>]+href=["']([^"']+)["']|<a[^>]+href=["']([^"']+)["'][^>]+rel=["']next["']/gi;
  while ((m = relNext.exec(html)) != null) push(m[1] || m[2]);
  const pagey =
    /href=["']([^"']*\/events\/(?:page\/\d+\/?|[^"']*(?:\?|&|&amp;)(?:paged|pno|mec_paged|eventDisplay)=[^"']+))["']/gi;
  while ((m = pagey.exec(html)) != null) push(m[1]);
  return Array.from(urls);
}

/**
 * Fetch the events index (following pagination a few pages, SSRF-guarded via
 * fetchIngestSource). Failures return what we have — callers warn + fall back.
 */
export async function fetchSanctuaryEventIndex(
  feedUrl: string,
  maxIndexPages = 5,
): Promise<SanctuaryIndexEntry[]> {
  let origin = "https://pdxsanctuary.com";
  try {
    origin = new URL(feedUrl).origin;
  } catch {
    /* keep default */
  }
  const entries: SanctuaryIndexEntry[] = [];
  const seenUrls = new Set<string>();
  const seenPages = new Set<string>();
  const queue = [`${origin}/events/`];

  while (queue.length && seenPages.size < maxIndexPages) {
    const pageUrl = queue.shift()!;
    if (seenPages.has(pageUrl)) continue;
    seenPages.add(pageUrl);
    try {
      const fetched = await fetchIngestSource(pageUrl);
      if (!fetched.body) continue;
      for (const e of extractSanctuaryEventIndex(fetched.body, fetched.url || pageUrl)) {
        if (seenUrls.has(e.url)) continue;
        seenUrls.add(e.url);
        entries.push(e);
      }
      for (const next of extractSanctuaryIndexNextUrls(fetched.body, fetched.url || pageUrl)) {
        if (!seenPages.has(next)) queue.push(next);
      }
    } catch {
      /* single page failure is fine — keep whatever we harvested */
    }
  }
  return entries;
}

/** Slug → comparable token key ("game-bang-blanket-forts-3-2" → "game bang blanket forts"). */
export function sanctuarySlugKey(slug: string): string {
  return seriesTitleKey(String(slug || "").replace(/-/g, " "));
}

/**
 * Best real event URL for a draft: title-token overlap with the slug, and the
 * occurrence day must match when the URL carries one (wrong-night pages have
 * the wrong flyer). Returns null when nothing clears the bar.
 */
export function matchSanctuaryIndexUrl(
  draft: Pick<IngestEventDraft, "title" | "dateStart">,
  entries: SanctuaryIndexEntry[],
): string | null {
  const day = String(draft.dateStart || "").slice(0, 10);
  const titleKey = seriesTitleKey(draft.title);
  if (!titleKey) return null;
  const tTokens = new Set(titleKey.split(" ").filter(Boolean));
  if (!tTokens.size) return null;

  let best: { url: string; score: number } | null = null;
  for (const e of entries) {
    if (e.day && day && e.day !== day) continue;
    const sTokens = new Set(sanctuarySlugKey(e.slug).split(" ").filter(Boolean));
    if (!sTokens.size) continue;
    let inter = 0;
    tTokens.forEach(t => {
      if (sTokens.has(t)) inter++;
    });
    if (!inter) continue;
    const overlap = inter / Math.min(tTokens.size, sTokens.size);
    if (overlap < 0.6) continue;
    let score = overlap * 100 + inter;
    if (e.day && e.day === day) score += 50; // exact occurrence beats series root
    if (!best || score > best.score) best = { url: e.url, score };
  }
  return best?.url ?? null;
}

function isTbaOrEmpty(value: string | null | undefined): boolean {
  const v = String(value || "").trim();
  return !v || /^tba$/i.test(v) || /^tbd$/i.test(v) || /^n\/?a$/i.test(v);
}

/** LOCATION often empty, "TBA", or street-only ("33 NW 9th Ave"). */
function needsSanctuaryVenueFill(d: IngestEventDraft): boolean {
  if (isTbaOrEmpty(d.venueName)) return true;
  if (/^33\s*nw\s*9th/i.test(d.venueName || "")) return true;
  if (/^\d{1,6}\s+(nw|ne|sw|se|n|s|e|w)\b/i.test(d.venueName || "")) return true;
  if (isTbaOrEmpty(d.address)) return true;
  if (isTbaOrEmpty(d.neighborhood)) return true;
  return false;
}

export function applySanctuaryVenue(draft: IngestEventDraft): IngestEventDraft {
  if (!needsSanctuaryVenueFill(draft)) return draft;
  const warnings = [...(draft.warnings || [])];
  const venueName = isTbaOrEmpty(draft.venueName) ||
    /^33\s*nw\s*9th/i.test(draft.venueName || "") ||
    /^\d{1,6}\s+(nw|ne|sw|se|n|s|e|w)\b/i.test(draft.venueName || "")
    ? SANCTUARY_VENUE
    : draft.venueName;
  const address = isTbaOrEmpty(draft.address) ||
    /^33\s*nw\s*9th(\s+ave)?\.?$/i.test(String(draft.address || "").trim())
    ? SANCTUARY_ADDRESS
    : draft.address;
  const neighborhood = isTbaOrEmpty(draft.neighborhood)
    ? SANCTUARY_NEIGHBORHOOD
    : draft.neighborhood;
  if (venueName !== draft.venueName || address !== draft.address || neighborhood !== draft.neighborhood) {
    warnings.push("Venue forced to Sanctuary Club (Pearl District)");
  }
  return {
    ...draft,
    venueName,
    address,
    neighborhood,
    warnings: Array.from(new Set(warnings)),
  };
}

function parseEventTypesJson(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map(t => String(t)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Stamp every Sanctuary draft as 21+ sex-positive (sex club policy).
 * ageRequirement must be schema enum "21_PLUS" — not "21+" or "18+".
 */
export function applySanctuaryPolicy(draft: IngestEventDraft): IngestEventDraft {
  const tags = parseEventTypesJson(draft.eventTypes);
  const upper = new Set(tags.map(t => t.trim().toUpperCase().replace(/[\s-]+/g, "_")));
  for (const t of SANCTUARY_EVENT_TYPE_TAGS) {
    if (!upper.has(t)) {
      tags.push(t);
      upper.add(t);
    }
  }
  const warnings = [...(draft.warnings || [])];
  if (draft.ageRequirement !== SANCTUARY_AGE_REQUIREMENT) {
    warnings.push("Age set to 21_PLUS (Sanctuary is 21+ only)");
  }
  if (!draft.isSexPositive || !draft.nudityOk) {
    warnings.push("Sex-positive + nudity flags set for Sanctuary sex club");
  }
  return {
    ...draft,
    ageRequirement: SANCTUARY_AGE_REQUIREMENT,
    isSexPositive: true,
    nudityOk: true,
    eventTypes: JSON.stringify(tags),
    warnings: Array.from(new Set(warnings)),
  };
}

/** Existing board event art offered to the current sync as series memory. */
export type SeriesPosterHint = { title: string; posterImageUrl: string | null };

/** Build seriesKey → poster map from existing board events (skips logos/empties). */
export function buildSeriesPosterHintMap(hints: SeriesPosterHint[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const h of hints || []) {
    if (!h?.posterImageUrl || isSanctuaryLogoPoster(h.posterImageUrl)) continue;
    const key = seriesTitleKey(h.title);
    if (!key || key.length < 3) continue;
    if (!map.has(key)) map.set(key, h.posterImageUrl);
  }
  return map;
}

/**
 * When a draft lacks a real flyer (missing or site logo), copy poster from
 * another draft in the same series that already has good art — first from
 * this batch, then from existing board events (cross-run memory: last month's
 * Game Bang already carries the series flyer even when this run's page fetch
 * came up empty).
 */
export function applySeriesFlyerReuse(
  drafts: IngestEventDraft[],
  boardHints?: Map<string, string>,
): IngestEventDraft[] {
  // Prefer earliest occurrence with a good flyer as the series canonical art
  const byDate = [...drafts].sort((a, b) =>
    String(a.dateStart || "").localeCompare(String(b.dateStart || "")),
  );
  const goodBySeries = new Map<string, string>();
  for (const d of byDate) {
    const key = seriesTitleKey(d.title);
    if (!key || key.length < 3) continue;
    if (!isSanctuaryLogoPoster(d.posterImageUrl) && d.posterImageUrl) {
      if (!goodBySeries.has(key)) goodBySeries.set(key, d.posterImageUrl);
    }
  }

  return drafts.map(d => {
    if (!isSanctuaryLogoPoster(d.posterImageUrl)) return d;
    const key = seriesTitleKey(d.title);
    if (!key || key.length < 3) return d;
    const batchFlyer = goodBySeries.get(key);
    const boardFlyer = boardHints?.get(key);
    const flyer = batchFlyer || boardFlyer;
    if (!flyer) return d;
    return {
      ...d,
      posterImageUrl: flyer,
      warnings: Array.from(
        new Set([
          ...(d.warnings || []),
          batchFlyer ? "Series flyer reused" : "Series flyer reused from existing board event",
        ]),
      ),
    };
  });
}

export type FetchSanctuaryDraftsOpts = {
  feedUrl?: string;
  maxPages?: number;
  concurrency?: number;
  /** When true, keep past VEVENTs (default false — adapter drops them). */
  includePast?: boolean;
  /** Existing board events' titles+posters for cross-run series flyer reuse. */
  seriesPosterHints?: SeriesPosterHint[];
  /** Skip the /events/ index harvest (tests / offline). Default false. */
  skipIndexHarvest?: boolean;
};

/**
 * Full Sanctuary path: ICS → upcoming → real-URL harvest from /events/ index
 * → page enrich → series flyer reuse (batch + board memory) → venue fix.
 */
export async function fetchSanctuaryDrafts(
  opts?: FetchSanctuaryDraftsOpts,
): Promise<IngestEventDraft[]> {
  const feedUrl = (opts?.feedUrl || DEFAULT_FEED).trim();
  const maxPages = opts?.maxPages ?? 80;
  const concurrency = opts?.concurrency ?? 4;

  const fetched = await fetchIngestSource(feedUrl);
  if (!fetched.body || !/BEGIN:VEVENT/i.test(fetched.body)) {
    return [];
  }

  let drafts = parseIcs(fetched.body, fetched.url || feedUrl);

  // De-dupe by event page / ticket URL when present, else title|day
  const seen = new Set<string>();
  drafts = drafts.filter(d => {
    const day = (d.dateStart || "").slice(0, 10);
    const key = (
      d.eventPageUrl ||
      d.ticketUrl ||
      `${d.title}|${day}`
    )
      .toLowerCase()
      .trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!opts?.includePast) {
    drafts = drafts.filter(d => !isPastEventListing(d));
  }

  // Real event URLs from the /events/ index — guessed slugs 404 on Sanctuary's
  // suffixed permalinks, so match harvested hrefs by title tokens + day first.
  let indexWarning: string | null = null;
  if (!opts?.skipIndexHarvest) {
    let indexEntries: SanctuaryIndexEntry[] = [];
    try {
      indexEntries = await fetchSanctuaryEventIndex(feedUrl);
    } catch {
      /* harvested nothing — warn below */
    }
    if (indexEntries.length) {
      drafts = drafts.map(d => {
        const url = matchSanctuaryIndexUrl(d, indexEntries);
        if (!url) return d;
        return {
          ...d,
          eventPageUrl: url.slice(0, 500),
          warnings: Array.from(
            new Set([...(d.warnings || []), "Event page matched from Sanctuary events index"]),
          ),
        };
      });
    } else {
      indexWarning = "Sanctuary events index unavailable — slug inference fallback";
    }
  }

  // Page URL + flyer/description enrich (higher budget than generic scan)
  const withPages = drafts.map(d => {
    const next = enrichEventPageUrl(d);
    return indexWarning
      ? {
          ...next,
          warnings: Array.from(new Set([...(next.warnings || []), indexWarning])),
        }
      : next;
  });
  // Clear logo URLs so enrich treats them as missing (batch needs-check is null-only)
  const prepped = withPages.map(d =>
    d.posterImageUrl && isSanctuaryLogoPoster(d.posterImageUrl)
      ? { ...d, posterImageUrl: null as string | null }
      : d,
  );
  let enriched = await enrichDraftsFromEventPages(prepped, {
    concurrency,
    maxPages,
  });

  // Drop residual logo URLs (batch path should avoid setting them; belt-and-suspenders)
  enriched = enriched.map(d =>
    d.posterImageUrl && isSanctuaryLogoPoster(d.posterImageUrl)
      ? { ...d, posterImageUrl: null as string | null }
      : d,
  );

  // Series reuse fills null/logo gaps — sibling occurrences first, then
  // existing board events (cross-run memory)
  enriched = applySeriesFlyerReuse(enriched, buildSeriesPosterHintMap(opts?.seriesPosterHints));
  enriched = enriched.map(applySanctuaryVenue);
  // 21+ sex club policy — always, before auto-LIVE or review queue
  enriched = enriched.map(applySanctuaryPolicy);

  // Re-check past after page may have refined dates
  if (!opts?.includePast) {
    enriched = enriched.filter(d => !isPastEventListing(d));
  }

  return enriched;
}
