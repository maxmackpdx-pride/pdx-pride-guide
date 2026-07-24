/**
 * Hawks PDX - Squarespace events collection (`?format=json`).
 *
 * Feed: https://www.hawkspdx.com/hawks-events?format=json
 *   - items[] / upcoming[] with epoch-ms startDate/endDate
 *   - assetUrl full posters (preferFullQualityImageUrl strips SQ shrink params)
 *   - paginated via pagination.nextPageUrl
 *
 * Policy: gay men's sex club - sex-positive + nudity flags always on
 * (Sanctuary-style), age defaulted 21_PLUS (conservative; leave a verify
 * breadcrumb - some nights may be 18+). Never invent FREE.
 */
import { getTrustedVenue } from "@shared/trustedVenues";
import type { IngestEventDraft } from "../types";
import { fetchIngestSource } from "../fetchSource";
import { parseSquarespaceJson } from "../parseSquarespace";
import { isPastEventListing } from "../dates";
import { inferAdmissionFromText } from "../admissionInfer";

const HAWKS_VENUE = "Hawks PDX";
const HAWKS_ADDRESS = "335 SE 99th Ave, Portland, OR 97216";
const HAWKS_NEIGHBORHOOD = "SE Portland";
/**
 * Schema enum ALL_AGES | 18_PLUS | 21_PLUS. Sex club - never ALL_AGES.
 * Default 21_PLUS (restrictive direction); reviewer adjusts for 18+ nights.
 */
export const HAWKS_AGE_REQUIREMENT = "21_PLUS" as const;
/** JSON tags stored in eventTypes (see shared/eventTypeTags). */
const HAWKS_EVENT_TYPE_TAGS = ["SEX_POSITIVE", "NUDITY_OK", "KINK"] as const;

const DEFAULT_FEED =
  getTrustedVenue("hawks-json")?.feedUrl ||
  "https://www.hawkspdx.com/hawks-events?format=json";

/** Max Squarespace pages to follow via pagination.nextPageUrl. */
const MAX_SQ_PAGES = 5;

function parseEventTypesJson(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map(t => String(t)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Stamp every Hawks draft as 21+ sex-positive (sex club policy).
 * Mirrors applySanctuaryPolicy - same product locks, same enum form.
 */
export function applyHawksPolicy(draft: IngestEventDraft): IngestEventDraft {
  const tags = parseEventTypesJson(draft.eventTypes);
  const upper = new Set(tags.map(t => t.trim().toUpperCase().replace(/[\s-]+/g, "_")));
  for (const t of HAWKS_EVENT_TYPE_TAGS) {
    if (!upper.has(t)) {
      tags.push(t);
      upper.add(t);
    }
  }

  const adm = inferAdmissionFromText(draft.title, draft.description);
  // Never invent FREE: keep meaningful upstream values (demoting unconfirmed
  // FREE); when upstream had no signal (UNKNOWN), trust text inference - FREE
  // only survives when the listing text clearly says so.
  const admission =
    draft.admission && draft.admission !== "UNKNOWN" && draft.admission !== "ALL_AGES"
      ? draft.admission === "FREE" && adm.admission !== "FREE"
        ? adm.admission
        : draft.admission
      : adm.admission;

  const weakVenue =
    !draft.venueName ||
    draft.venueName === "TBA" ||
    /hawks/i.test(draft.venueName);

  const warnings = [...(draft.warnings || [])];
  if (draft.ageRequirement !== HAWKS_AGE_REQUIREMENT) {
    warnings.push("Age defaulted to 21_PLUS (Hawks sex club) - verify for 18+ nights");
  }
  if (!draft.isSexPositive || !draft.nudityOk) {
    warnings.push("Sex-positive + nudity flags set for Hawks PDX sex club");
  }
  if (adm.reason) warnings.push(adm.reason);

  return {
    ...draft,
    venueName: weakVenue ? HAWKS_VENUE : draft.venueName,
    address: draft.address?.trim() ? draft.address : HAWKS_ADDRESS,
    neighborhood: draft.neighborhood?.trim() ? draft.neighborhood : HAWKS_NEIGHBORHOOD,
    ageRequirement: HAWKS_AGE_REQUIREMENT,
    isSexPositive: true,
    nudityOk: true,
    eventTypes: JSON.stringify(tags),
    admission,
    warnings: Array.from(new Set(warnings)),
  };
}

/** Ensure the Squarespace collection URL asks for JSON. */
export function expandHawksJsonUrl(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    if (!u.searchParams.has("format")) u.searchParams.set("format", "json");
    return u.toString();
  } catch {
    return raw;
  }
}

export type FetchHawksDraftsOpts = {
  feedUrl?: string;
  includePast?: boolean;
};

/**
 * Squarespace JSON with pagination → drafts + sex-club policy.
 */
export async function fetchHawksDrafts(
  opts?: FetchHawksDraftsOpts,
): Promise<IngestEventDraft[]> {
  const feedUrl = expandHawksJsonUrl((opts?.feedUrl || DEFAULT_FEED).trim());
  let drafts: IngestEventDraft[] = [];

  let pageUrl: string | null = feedUrl;
  const seenPages = new Set<string>();
  for (let page = 0; page < MAX_SQ_PAGES && pageUrl && !seenPages.has(pageUrl); page++) {
    seenPages.add(pageUrl);
    try {
      const fetched = await fetchIngestSource(pageUrl);
      const parsed = parseSquarespaceJson(fetched.body, fetched.url || pageUrl);
      drafts.push(...parsed);
      let next: string | null = null;
      try {
        const data = JSON.parse(fetched.body);
        const rawNext =
          data?.pagination?.nextPageUrl ||
          data?.pagination?.nextPage ||
          null;
        if (typeof rawNext === "string" && rawNext) {
          next = expandHawksJsonUrl(new URL(rawNext, fetched.url || pageUrl).toString());
        }
      } catch {
        next = null;
      }
      pageUrl = next;
    } catch {
      break; // partial harvest fine; sync health reports zero-yield if empty
    }
  }

  if (!opts?.includePast) {
    drafts = drafts.filter(d => !isPastEventListing(d));
  }

  drafts = drafts.map(applyHawksPolicy);

  // De-dupe by title|day
  const seen = new Set<string>();
  return drafts.filter(d => {
    const key = `${d.title}|${(d.dateStart || "").slice(0, 10)}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
