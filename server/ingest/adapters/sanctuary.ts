/**
 * Sanctuary Club dedicated ingest path.
 *
 * ICS is the structured source (~400 VEVENTs, no ATTACH flyers). We:
 * 1. Fetch the trusted ICS feed
 * 2. Drop past listings
 * 3. Infer event page URLs + enrich flyers/descriptions from detail pages
 * 4. Keep artwork empty unless it is verified on the exact event page
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
 * Sanctuary is a 21+ sex club - never 18+ / ALL_AGES.
 */
export const SANCTUARY_AGE_REQUIREMENT = "21_PLUS" as const;
/** JSON tags stored in eventTypes (see shared/eventTypeTags SEX_POSITIVE / NUDITY_OK). */
const SANCTUARY_EVENT_TYPE_TAGS = ["SEX_POSITIVE", "NUDITY_OK", "KINK"] as const;

const DEFAULT_FEED =
  getTrustedVenue("sanctuary-ics")?.feedUrl ||
  "https://pdxsanctuary.com/events/calendar/sanctuary/ics/";

/**
 * Sanctuary's Sugar Calendar feed labels Pacific wall-clock values as UTC
 * (for example, a page-listed 8 PM event is emitted as
 * `DTSTART;TZID=UTC:...T200000`). Parsing that label literally shifts every
 * event seven or eight hours early. This adapter owns the source-specific
 * correction; the shared RFC-compliant ICS parser remains unchanged.
 */
export function normalizeSanctuaryIcsTimezone(ics: string): string {
  return String(ics || "").replace(
    /^(DT(?:START|END));TZID=(?:UTC|GMT):/gim,
    "$1;TZID=America/Los_Angeles:",
  );
}

/** Site logo / brand art / chrome - not a real event flyer. */
export function isSanctuaryLogoPoster(url: string | null | undefined): boolean {
  if (!url || !String(url).trim()) return true;
  return /logo|cropped-|favicon|t_color_full|trans_color|footer[_-]?map|site[_-]?map|screenshot|placeholder|spacer|1x1|pixel|wp-includes|gravatar|apple-touch/i.test(
    url,
  );
}

/**
 * Normalize titles for series matching: "Game Bang - July 2026 PRIDE" → "game bang".
 * Strips dates, months, years, ordinals, bare numbers, and "pride".
 */
export function seriesTitleKey(title: string): string {
  return String(title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/[–-−]/g, " ")
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

/**
 * Page-match key: like seriesTitleKey but KEEPS distinctive subtitle words
 * (pride, speed, date, apocalypse…). Stripping "pride" was collapsing
 * "Jiffy Kink: Pride" → "jiffy kink" and matching Speed Date's page.
 */
export function matchTitleKey(title: string): string {
  return String(title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/[–-−]/g, " ")
    .replace(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/g,
      " ",
    )
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\b\d{1,2}(st|nd|rd|th)\b/g, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── Events-index URL harvest ─────────────────────────────────────────────
 * Sanctuary's real event URLs carry WP collision suffixes and per-occurrence
 * dates ("/events/game-bang-blanket-forts-3-2/2026-07-22/") that title-slug
 * inference can never predict - guessed slugs 404 and the flyer enrich step
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

/** Non-event /events/* paths (views, feeds, archives) - never event pages. */
const SANCTUARY_INDEX_EXCLUDE =
  /^(calendar|category|categories|list|month|week|day|today|tag|page|feed|photo|map|ical|search)$/i;

export function extractSanctuaryEventIndex(
  html: string,
  baseUrl = "https://pdxsanctuary.com/",
): SanctuaryIndexEntry[] {
  const out: SanctuaryIndexEntry[] = [];
  const seen = new Set<string>();
  // Sugar Calendar publishes event pages under BOTH /events/{slug}/ and
  // /calendar/{slug}/ (Horse Market's current page is /calendar/horse-market-2/)
  const re =
    /href=["']((?:https?:\/\/(?:www\.)?pdxsanctuary\.com)?\/(?:events|calendar)\/([a-z0-9][a-z0-9-]*)\/(?:(\d{4}-\d{2}-\d{2})\/)?)(?:["'#?])/gi;
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
 * WordPress sitemap harvest - the FULL slug map. Sanctuary runs Sugar
 * Calendar, whose /events/ list paginates via JS (no hrefs), so the index
 * page can only ever show ~1 week. WP sitemaps list every sc_event page URL
 * server-side: wp-sitemap.xml → wp-sitemap-posts-sc_event-N.xml. This is the
 * primary source; the index page still contributes dated occurrence URLs.
 */
export function extractSitemapLocs(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) != null) out.push(m[1]);
  return out;
}

export function sitemapLocsToIndexEntries(locs: string[]): SanctuaryIndexEntry[] {
  const out: SanctuaryIndexEntry[] = [];
  const seen = new Set<string>();
  for (const loc of locs) {
    const m = loc.match(/\/(?:events|calendar)\/([a-z0-9][a-z0-9-]*)\/?$/i);
    if (!m) continue;
    if (SANCTUARY_INDEX_EXCLUDE.test(m[1])) continue;
    const url = loc.endsWith("/") ? loc : `${loc}/`;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, slug: m[1], day: null });
  }
  return out;
}

export async function fetchSanctuarySitemapEntries(
  feedUrl: string,
): Promise<SanctuaryIndexEntry[]> {
  let origin = "https://pdxsanctuary.com";
  try {
    origin = new URL(feedUrl).origin;
  } catch {
    /* keep default */
  }

  // Direct sc_event sitemaps first; index files as discovery fallback.
  const direct = [
    `${origin}/wp-sitemap-posts-sc_event-1.xml`,
    `${origin}/wp-sitemap-posts-sc_event-2.xml`,
  ];
  const indexes = [`${origin}/wp-sitemap.xml`, `${origin}/sitemap_index.xml`];

  const entries: SanctuaryIndexEntry[] = [];
  const seen = new Set<string>();
  const absorb = (list: SanctuaryIndexEntry[]) => {
    for (const e of list) {
      if (seen.has(e.url)) continue;
      seen.add(e.url);
      entries.push(e);
    }
  };

  for (const url of direct) {
    try {
      const fetched = await fetchIngestSource(url);
      absorb(sitemapLocsToIndexEntries(extractSitemapLocs(fetched.body)));
    } catch {
      /* missing page number / plugin rename - try discovery below */
    }
  }

  if (!entries.length) {
    for (const idxUrl of indexes) {
      try {
        const idx = await fetchIngestSource(idxUrl);
        const subs = extractSitemapLocs(idx.body)
          .filter(u => /event|calendar/i.test(u) && /\.xml(\?|$)/i.test(u))
          .slice(0, 4);
        for (const sub of subs) {
          try {
            const fetched = await fetchIngestSource(sub);
            absorb(sitemapLocsToIndexEntries(extractSitemapLocs(fetched.body)));
          } catch {
            /* skip bad sub-sitemap */
          }
        }
        if (entries.length) break;
      } catch {
        /* try next index */
      }
    }
  }

  return entries;
}

/**
 * Fetch the events index (following pagination a few pages, SSRF-guarded via
 * fetchIngestSource). Failures return what we have - callers warn + fall back.
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
      /* single page failure is fine - keep whatever we harvested */
    }
  }
  return entries;
}

/** Slug → comparable token key ("game-bang-blanket-forts-3-2" → "game bang blanket forts"). */
export function sanctuarySlugKey(slug: string): string {
  return seriesTitleKey(String(slug || "").replace(/-/g, " "));
}

/** Bounded Levenshtein for short keys (spelling drift: polyitopia/polytopia). */
export function boundedEditDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    let rowMin = prev[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diag = tmp;
      if (prev[j] < rowMin) rowMin = prev[j];
    }
    if (rowMin > max) return max + 1;
  }
  return prev[b.length];
}

/**
 * Best real event URL for a draft: title-token coverage of the slug (must
 * cover nearly all title tokens so "Jiffy Kink: Pride" never lands on
 * "jiffy-kink-speed-date"), plus day match when the URL carries one.
 * Squashed-form comparison catches word-boundary drift ("EbonyFest" vs
 * "ebony-fest") and small spelling drift ("Polyitopia" vs "polytopia").
 * Returns null when nothing clears the bar.
 */
export function matchSanctuaryIndexUrl(
  draft: Pick<IngestEventDraft, "title" | "dateStart">,
  entries: SanctuaryIndexEntry[],
): string | null {
  const day = String(draft.dateStart || "").slice(0, 10);
  // Keep pride / speed / apocalypse etc. - seriesTitleKey strips them and
  // collapsed sibling nights onto the wrong page.
  const titleKey = matchTitleKey(draft.title);
  if (!titleKey) return null;
  const tTokens = new Set(titleKey.split(" ").filter(Boolean));
  if (!tTokens.size) return null;

  const tSquash = titleKey.replace(/\s+/g, "");
  // Generic series family words that may appear on many sibling pages
  const weak = new Set(["night", "party", "event", "the", "and", "with", "presents"]);

  let best: { url: string; score: number } | null = null;
  for (const e of entries) {
    if (e.day && day && e.day !== day) continue;
    // Slug key via matchTitleKey path (hyphens → spaces, keep distinctive words)
    const slugKey = matchTitleKey(String(e.slug || "").replace(/-/g, " "));
    const sTokens = new Set(slugKey.split(" ").filter(Boolean));
    if (!sTokens.size) continue;
    let inter = 0;
    tTokens.forEach(t => {
      if (sTokens.has(t)) inter++;
    });
    // Title coverage: almost every title token must appear in the slug.
    // Precision: slug should not be mostly other-night words (speed date vs pride).
    const coverage = inter / tTokens.size;
    const precision = inter / sTokens.size;
    const missingDistinctive = [...tTokens].filter(
      t => t.length >= 4 && !weak.has(t) && !sTokens.has(t),
    );
    const extraDistinctive = [...sTokens].filter(
      t => t.length >= 4 && !weak.has(t) && !tTokens.has(t),
    );

    let score: number;
    if (inter && coverage >= 0.85 && missingDistinctive.length === 0) {
      // Full title coverage - penalize extra distinctive slug tokens lightly
      // so "jiffy-kink-pride-2" beats "jiffy-kink" root when title has pride.
      score = coverage * 100 + precision * 40 + inter - extraDistinctive.length * 8;
    } else if (inter && coverage >= 0.6 && missingDistinctive.length === 0 && precision >= 0.5) {
      score = coverage * 80 + precision * 30 + inter;
    } else {
      // Squashed fallback: word-boundary drift + small spelling drift only
      // when token path failed - still require near-equality (not containment
      // of a short series family into a longer sibling slug).
      const sSquash = slugKey.replace(/\s+/g, "");
      if (!tSquash || tSquash.length < 5 || !sSquash) continue;
      const contains =
        tSquash === sSquash ||
        (Math.abs(tSquash.length - sSquash.length) <= 2 &&
          (tSquash.includes(sSquash) || sSquash.includes(tSquash)));
      const maxEd = Math.min(tSquash.length, sSquash.length) >= 8 ? 2 : 1;
      const fuzzy = !contains && boundedEditDistance(tSquash, sSquash, maxEd) <= maxEd;
      if (!contains && !fuzzy) continue;
      // Reject when squashed slug is much longer (family name inside sibling)
      if (sSquash.length > tSquash.length + 4 && !fuzzy) continue;
      score = contains ? 85 : 75;
    }
    if (e.day && e.day === day) score += 50; // exact occurrence beats series root
    // Tie-break same-series duplicates ("game-bang-2" vs "game-bang-3-2")
    // toward the highest WP collision suffix - the newest page carries the
    // current flyer. Tiny bonus: never outweighs overlap or day match.
    const suffixNums = e.slug.match(/-(\d+)/g) || [];
    score += Math.min(
      suffixNums.reduce((a, n) => a + Number(n.slice(1)), 0),
      40,
    ) * 0.01;
    if (!best || score > best.score) best = { url: e.url, score };
  }
  return best?.url ?? null;
}

/**
 * Third-party events at Sanctuary (Polyitopia via SP Portland, EbonyFest…)
 * often have no pdxsanctuary.com page - but the ICS DESCRIPTION carries the
 * organizer's URL, whose page has the flyer (og:image). Extract it as an
 * eventPageUrl fallback for the standard enrich path (SSRF-guarded there).
 */
export function extractUrlFromDescription(text: string | null | undefined): string | null {
  const m = String(text || "").match(/https?:\/\/[^\s"'<>\\)\]]+/i);
  if (!m) return null;
  const url = m[0].replace(/[.,;:!?]+$/, "");
  if (
    /\.ics(\?|$)|\/ics\/?(\?|$)|\/feed\/|format=json|ical=1|instagram\.com|facebook\.com\/(?:sharer|login)/i.test(
      url,
    )
  ) {
    return null;
  }
  try {
    return new URL(url).toString().slice(0, 500);
  } catch {
    return null;
  }
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
 * ageRequirement must be schema enum "21_PLUS" - not "21+" or "18+".
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

/** Existing board event art retained for API compatibility; never copied to another occurrence. */
export type SeriesPosterHint = { title: string; posterImageUrl: string | null };

/**
 * Legacy helper retained for callers that still supply board hints. Sanctuary
 * no longer consumes this map because an exact-event poster is mandatory.
 */
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
 * Never reuse Sanctuary artwork across occurrences. Recurring events can have
 * different themes, dates, and flyers; a sibling or historical poster is not
 * evidence for this exact event. Missing/logo artwork stays null for review.
 */
export function applySeriesFlyerReuse(
  drafts: IngestEventDraft[],
  _boardHints?: Map<string, string>,
): IngestEventDraft[] {
  return drafts.map(d =>
    isSanctuaryLogoPoster(d.posterImageUrl)
      ? { ...d, posterImageUrl: null }
      : d,
  );
}

export type FetchSanctuaryDraftsOpts = {
  feedUrl?: string;
  maxPages?: number;
  concurrency?: number;
  /** When true, keep past VEVENTs (default false - adapter drops them). */
  includePast?: boolean;
  /** Legacy input retained for callers; cross-occurrence poster reuse is disabled. */
  seriesPosterHints?: SeriesPosterHint[];
  /** Skip the /events/ index harvest (tests / offline). Default false. */
  skipIndexHarvest?: boolean;
};

/**
 * Full Sanctuary path: ICS → upcoming → real-URL harvest from /events/ index
 * → page enrich → exact-event artwork validation → venue fix.
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

  let drafts = parseIcs(normalizeSanctuaryIcsTimezone(fetched.body), fetched.url || feedUrl);

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

  // Real event URLs from the /events/ index - guessed slugs 404 on Sanctuary's
  // suffixed permalinks, so match harvested hrefs by title tokens + day first.
  let indexWarning: string | null = null;
  if (!opts?.skipIndexHarvest) {
    let indexEntries: SanctuaryIndexEntry[] = [];
    try {
      // Sitemap = full slug map (Sugar Calendar's JS pagination hides all but
      // ~1 week from the index page); index page adds dated occurrence URLs.
      const [sitemap, index] = await Promise.all([
        fetchSanctuarySitemapEntries(feedUrl).catch(() => [] as SanctuaryIndexEntry[]),
        fetchSanctuaryEventIndex(feedUrl).catch(() => [] as SanctuaryIndexEntry[]),
      ]);
      const seenUrl = new Set<string>();
      for (const e of [...index, ...sitemap]) {
        if (seenUrl.has(e.url)) continue;
        seenUrl.add(e.url);
        indexEntries.push(e);
      }
    } catch {
      /* harvested nothing - warn below */
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
      indexWarning = "Sanctuary events index unavailable - slug inference fallback";
    }
  }

  // Third-party fallback: organizer URL from the ICS description when no
  // Sanctuary page matched (SP Portland, guest promoters…)
  drafts = drafts.map(d => {
    if (d.eventPageUrl) return d;
    const fromDesc = extractUrlFromDescription(d.description);
    if (!fromDesc) return d;
    return {
      ...d,
      eventPageUrl: fromDesc,
      warnings: Array.from(
        new Set([...(d.warnings || []), "Event page from ICS description (third-party organizer)"]),
      ),
    };
  });

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

  // Exact-event artwork only: missing/logo art stays null. Never copy from a
  // sibling occurrence or an older board record.
  enriched = applySeriesFlyerReuse(enriched);
  enriched = enriched.map(applySanctuaryVenue);
  // 21+ sex club policy - always, before auto-LIVE or review queue
  enriched = enriched.map(applySanctuaryPolicy);

  // Re-check past after page may have refined dates
  if (!opts?.includePast) {
    enriched = enriched.filter(d => !isPastEventListing(d));
  }

  return enriched;
}
