/**
 * Darcelle XV Showplace — The Events Calendar (Tribe) REST, ICS fallback.
 *
 * Primary: https://darcellexv.com/wp-json/tribe/events/v1/events
 *   - per-event `image.url` flyers (full sizes via image.sizes)
 *   - paginated via next_rest_url
 * Fallback: https://darcellexv.com/events/?ical=1 (ICS with ATTACH flyers)
 *
 * Policy: iconic drag showplace / cabaret. Evening shows are 21+; some
 * matinee/brunch shows admit younger with guardian — we default 21_PLUS
 * (conservative, restrictive direction) and leave a verify breadcrumb for
 * Review. Never invent FREE.
 */
import { getTrustedVenue } from "@shared/trustedVenues";
import type { IngestEventDraft } from "../types";
import { fetchIngestSource } from "../fetchSource";
import { parseTribeEventsJson } from "../parseTribe";
import { parseIcs, looksLikeIcs } from "../parseIcs";
import { isPastEventListing } from "../dates";
import { inferAdmissionFromText } from "../admissionInfer";

const DARCELLE_VENUE = "Darcelle XV Showplace";
const DARCELLE_ADDRESS = "208 NW 3rd Ave, Portland, OR";
const DARCELLE_NEIGHBORHOOD = "Old Town";
/** Conservative default — reviewer downgrades for all-ages/brunch shows. */
const DARCELLE_AGE = "21_PLUS" as const;
const DARCELLE_ICS_FALLBACK = "https://darcellexv.com/events/?ical=1";

const DEFAULT_FEED =
  getTrustedVenue("darcelle-tribe")?.feedUrl ||
  "https://darcellexv.com/wp-json/tribe/events/v1/events";

/** Max Tribe REST pages to follow (per_page=50 → up to 200 events). */
const MAX_TRIBE_PAGES = 4;

export function applyDarcellePolicy(draft: IngestEventDraft): IngestEventDraft {
  const adm = inferAdmissionFromText(draft.title, draft.description);
  // Never invent FREE: keep meaningful upstream values (demoting unconfirmed
  // FREE); when upstream had no signal (UNKNOWN), trust text inference — FREE
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
    /darcelle/i.test(draft.venueName);

  return {
    ...draft,
    venueName: weakVenue ? DARCELLE_VENUE : draft.venueName,
    address: draft.address?.trim() ? draft.address : DARCELLE_ADDRESS,
    neighborhood: draft.neighborhood?.trim() ? draft.neighborhood : DARCELLE_NEIGHBORHOOD,
    ageRequirement: DARCELLE_AGE,
    admission,
    warnings: Array.from(
      new Set([
        ...(draft.warnings || []),
        "Age defaulted to 21_PLUS (Darcelle evening shows) — verify for all-ages/brunch shows",
        ...(adm.reason ? [adm.reason] : []),
      ]),
    ),
  };
}

/** Append per_page when the Tribe REST URL doesn't set one. */
export function expandDarcelleTribeUrl(url: string, perPage = 50): string {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    if (!/\/tribe\/events\/v1\/events/i.test(u.pathname)) return raw;
    if (!u.searchParams.has("per_page")) u.searchParams.set("per_page", String(perPage));
    return u.toString();
  } catch {
    return raw;
  }
}

export type FetchDarcelleDraftsOpts = {
  feedUrl?: string;
  includePast?: boolean;
  /** ICS fallback URL override (tests). */
  icsFallbackUrl?: string | null;
};

/**
 * Tribe REST with pagination → drafts; ICS fallback when REST yields nothing.
 */
export async function fetchDarcelleDrafts(
  opts?: FetchDarcelleDraftsOpts,
): Promise<IngestEventDraft[]> {
  const feedUrl = expandDarcelleTribeUrl((opts?.feedUrl || DEFAULT_FEED).trim());
  let drafts: IngestEventDraft[] = [];

  // ── Tribe REST, following next_rest_url ──
  let pageUrl: string | null = feedUrl;
  const seenPages = new Set<string>();
  for (let page = 0; page < MAX_TRIBE_PAGES && pageUrl && !seenPages.has(pageUrl); page++) {
    seenPages.add(pageUrl);
    try {
      const fetched = await fetchIngestSource(pageUrl);
      const parsed = parseTribeEventsJson(fetched.body, fetched.url || pageUrl);
      drafts.push(...parsed);
      let next: string | null = null;
      try {
        const data = JSON.parse(fetched.body);
        next = typeof data?.next_rest_url === "string" ? data.next_rest_url : null;
      } catch {
        next = null;
      }
      pageUrl = next;
    } catch {
      break; // partial harvest is fine; ICS fallback below if empty
    }
  }

  // ── ICS fallback (ATTACH flyers) when REST gave us nothing ──
  if (!drafts.length) {
    const icsUrl =
      opts?.icsFallbackUrl === null
        ? null
        : (opts?.icsFallbackUrl || DARCELLE_ICS_FALLBACK).trim();
    if (icsUrl) {
      try {
        const fetched = await fetchIngestSource(icsUrl);
        if (fetched.body && looksLikeIcs(fetched.body)) {
          drafts = parseIcs(fetched.body, fetched.url || icsUrl).map(d => ({
            ...d,
            warnings: Array.from(
              new Set([...(d.warnings || []), "Tribe REST empty — ICS fallback used"]),
            ),
          }));
        }
      } catch {
        /* both paths failed — return empty, sync records the error */
      }
    }
  }

  if (!opts?.includePast) {
    drafts = drafts.filter(d => !isPastEventListing(d));
  }

  drafts = drafts.map(applyDarcellePolicy);

  // De-dupe by title|day
  const seen = new Set<string>();
  return drafts.filter(d => {
    const key = `${d.title}|${(d.dateStart || "").slice(0, 10)}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
