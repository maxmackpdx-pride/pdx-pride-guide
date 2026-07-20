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

/**
 * When a draft lacks a real flyer (missing or site logo), copy poster from
 * another draft in the same series that already has good art.
 */
export function applySeriesFlyerReuse(drafts: IngestEventDraft[]): IngestEventDraft[] {
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
    const flyer = goodBySeries.get(key);
    if (!flyer) return d;
    return {
      ...d,
      posterImageUrl: flyer,
      warnings: Array.from(new Set([...(d.warnings || []), "Series flyer reused"])),
    };
  });
}

export type FetchSanctuaryDraftsOpts = {
  feedUrl?: string;
  maxPages?: number;
  concurrency?: number;
  /** When true, keep past VEVENTs (default false — adapter drops them). */
  includePast?: boolean;
};

/**
 * Full Sanctuary path: ICS → upcoming → page enrich → series flyer reuse → venue fix.
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

  // Page URL + flyer/description enrich (higher budget than generic scan)
  const withPages = drafts.map(d => enrichEventPageUrl(d));
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

  // Series reuse fills null/logo gaps from sibling occurrences with real art
  enriched = applySeriesFlyerReuse(enriched);
  enriched = enriched.map(applySanctuaryVenue);
  // 21+ sex club policy — always, before auto-LIVE or review queue
  enriched = enriched.map(applySanctuaryPolicy);

  // Re-check past after page may have refined dates
  if (!opts?.includePast) {
    enriched = enriched.filter(d => !isPastEventListing(d));
  }

  return enriched;
}
