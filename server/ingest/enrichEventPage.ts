import type { IngestEventDraft } from "./types";
import { fetchIngestSource } from "./fetchSource";
import { isIngestFeedUrl } from "./eventPageUrl";
import {
  preferFullQualityImageUrl,
  extractFlyerCandidatesFromHtml,
  extractSanctuaryFlyerUrls,
} from "./posterQuality";
import { toPacificWallClock, yearFromDateString } from "./dates";

function looksLikeSiteLogo(url: string | null | undefined): boolean {
  if (!url) return true;
  return /logo|cropped-|favicon|trans_color|t_color_full|apple-touch|elementor/i.test(url);
}

function metaContent(html: string, prop: string): string | null {
  const re1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    "i",
  );
  return html.match(re1)?.[1] || html.match(re2)?.[1] || null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#39;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/**
 * Pull flyer + full description from the public event page when ICS/API is thin.
 * Sanctuary ICS has DESCRIPTION text but no flyer; HTML has og:image + full copy.
 */
export async function enrichDraftFromEventPage(
  draft: IngestEventDraft,
): Promise<IngestEventDraft> {
  const page =
    draft.eventPageUrl ||
    (draft.ticketUrl && !isIngestFeedUrl(draft.ticketUrl) ? draft.ticketUrl : null);
  if (!page || !/^https?:\/\//i.test(page) || isIngestFeedUrl(page)) {
    return draft;
  }

  // Skip if we already have a solid poster + long description
  // Treat Sanctuary site LOGO as missing (Game Bang etc. use logo as og:image when no flyer)
  const hasPoster = Boolean(
    draft.posterImageUrl &&
      !draft.posterImageUrl.startsWith("data:") &&
      !looksLikeSiteLogo(draft.posterImageUrl),
  );
  const desc = (draft.description || "").replace(/&nbsp;/g, " ").trim();
  const hasRichDesc = desc.length >= 280 && !/generated stub|No description/i.test(desc);
  if (hasPoster && hasRichDesc) return draft;

  try {
    const fetched = await fetchIngestSource(page);
    const html = fetched.body;
    if (!html || html.length < 200) return draft;

    const warnings = [...(draft.warnings || [])];
    let posterImageUrl = draft.posterImageUrl;
    let description = draft.description;
    let eventPageUrl = draft.eventPageUrl || page;
    let dateStart = draft.dateStart;
    let dateEnd = draft.dateEnd;

    // Flyer: Sanctuary pattern first (wp-content/uploads/YYYY/MM/*.avif|jpg)
    // e.g. …/2025/12/JKPride.avif · …/2025/08/AlienOrgy-980x980-1.avif
    if (!hasPoster) {
      const isSanctuary = /pdxsanctuary\.com/i.test(page) || /pdxsanctuary\.com/i.test(fetched.url || "");
      if (isSanctuary) {
        const sanc = extractSanctuaryFlyerUrls(html, fetched.url || page);
        if (sanc[0] && !looksLikeSiteLogo(sanc[0])) {
          posterImageUrl = sanc[0];
          warnings.push("Flyer from Sanctuary WP uploads (og/avif)");
        }
      }
      if (!posterImageUrl || looksLikeSiteLogo(posterImageUrl)) {
        const og =
          metaContent(html, "og:image") ||
          metaContent(html, "og:image:url") ||
          metaContent(html, "twitter:image");
        const fromOg = og ? preferFullQualityImageUrl(decodeEntities(og)) : null;
        if (fromOg && !looksLikeSiteLogo(fromOg)) {
          posterImageUrl = fromOg;
          warnings.push("Flyer from event page og:image");
        } else {
          const cands = extractFlyerCandidatesFromHtml(html, fetched.url || page);
          const best = cands.find(u => !looksLikeSiteLogo(u));
          if (best) {
            posterImageUrl = best;
            warnings.push("Flyer from event page HTML");
          }
        }
      }
    }

    // Description: og:description or longest readable block
    const ogDesc = metaContent(html, "og:description") || metaContent(html, "twitter:description");
    if (ogDesc) {
      const clean = decodeEntities(ogDesc);
      if (clean.length > desc.length + 40 || !hasRichDesc) {
        description = clean.slice(0, 8000);
        warnings.push("Description from event page");
      }
    }
    // Prefer main content if still thin
    if ((description || "").length < 200) {
      const article =
        html.match(/<article[\s\S]{200,12000}?<\/article>/i)?.[0] ||
        html.match(/class=["'][^"']*entry-content[^"']*["'][\s\S]{200,12000}?<\/div>/i)?.[0] ||
        "";
      const text = stripTags(article);
      if (text.length > (description || "").length + 40) {
        description = text.slice(0, 8000);
        warnings.push("Description from event page body");
      }
    }

    // Canonical page URL
    const ogUrl = metaContent(html, "og:url");
    if (ogUrl && /^https?:\/\//i.test(ogUrl) && !isIngestFeedUrl(ogUrl)) {
      eventPageUrl = decodeEntities(ogUrl).slice(0, 500);
    }

    // Refine time-of-day from page ONLY when year matches the feed year.
    // Sanctuary pages list many events — never pick a 2025 widget date over a 2026 ICS year.
    const feedYear = yearFromDateString(draft.dateStart);
    const datetimes = [...html.matchAll(/datetime=["']([^"']+)["']/gi)].map(m => m[1]);
    const absolute = datetimes
      .map(d => ({ raw: d, wall: toPacificWallClock(d) }))
      .filter((x): x is { raw: string; wall: string } => Boolean(x.wall))
      .filter(x => /[zZ]|[+-]\d{2}:?\d{2}/.test(x.raw)); // require absolute offset

    if (feedYear != null && absolute.length) {
      const sameYear = absolute
        .filter(x => yearFromDateString(x.wall) === feedYear)
        .map(x => x.wall)
        .sort();
      if (sameYear.length >= 1) {
        // Keep feed calendar day if page only disagrees on hour after TZ noise
        const feedDay = (draft.dateStart || "").slice(0, 10);
        const pageDay = sameYear[0].slice(0, 10);
        if (pageDay === feedDay || !feedDay) {
          if (sameYear[0] !== dateStart) {
            dateStart = sameYear[0];
            warnings.push(`Time refined from event page (year ${feedYear} preserved)`);
          }
          const endCand = sameYear.find(d => d > sameYear[0]);
          if (endCand) dateEnd = endCand;
        }
        // If page day differs but year matches, prefer feed dateStart day + only use page if feed lacked TZ certainty
      }
    } else if (feedYear == null && absolute.length) {
      // No year from feed (shouldn't happen for ICS) — take earliest absolute
      const sorted = absolute.map(x => x.wall).sort();
      dateStart = sorted[0];
      if (sorted[1] && sorted[1] > sorted[0]) dateEnd = sorted[1];
      warnings.push("Dates taken from event page (feed had no year)");
    }

    return {
      ...draft,
      posterImageUrl,
      description: description || draft.description,
      eventPageUrl,
      dateStart,
      dateEnd,
      warnings: Array.from(new Set(warnings)),
    };
  } catch {
    return draft;
  }
}

/** Enrich many drafts with a small concurrency pool (avoids stampeding venues). */
export async function enrichDraftsFromEventPages(
  drafts: IngestEventDraft[],
  opts?: { concurrency?: number; maxPages?: number },
): Promise<IngestEventDraft[]> {
  const concurrency = Math.max(1, opts?.concurrency ?? 3);
  const maxPages = opts?.maxPages ?? 50;
  const out = drafts.map(d => ({ ...d }));
  const jobs: number[] = [];
  for (let i = 0; i < out.length; i++) {
    const d = out[i];
    const needs =
      !d.posterImageUrl ||
      (d.description || "").replace(/&nbsp;/g, " ").trim().length < 280 ||
      /generated stub|No description/i.test(d.description || "");
    const page = d.eventPageUrl || d.ticketUrl;
    if (needs && page && !isIngestFeedUrl(page)) jobs.push(i);
  }
  const limited = jobs.slice(0, maxPages);
  let cursor = 0;
  async function worker() {
    while (cursor < limited.length) {
      const my = cursor++;
      const i = limited[my];
      out[i] = await enrichDraftFromEventPage(out[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, limited.length) }, () => worker()));
  return out;
}
