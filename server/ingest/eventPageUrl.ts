import type { IngestEventDraft } from "./types";

/** True for feed/API endpoints that are not human event pages. */
export function isIngestFeedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /format=json|wp-json|\/tribe\/events\/v1|\.ics(\?|$)|\/ics\/?(\?|$)|\/api\/calendar|ical=1|warmup|\/calendar\/.*ics/i.test(
    url,
  );
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Fill eventPageUrl when parsers only have a feed URL.
 * Sanctuary ICS has no URL property — public pages follow /events/{slug}/.
 */
export function enrichEventPageUrl(draft: IngestEventDraft): IngestEventDraft {
  if (draft.eventPageUrl && !isIngestFeedUrl(draft.eventPageUrl)) {
    return draft;
  }

  // Prefer ticket/source if already a human page
  for (const u of [draft.ticketUrl, draft.sourceUrl]) {
    if (u && /^https?:\/\//i.test(u) && !isIngestFeedUrl(u)) {
      return { ...draft, eventPageUrl: u.slice(0, 500) };
    }
  }

  // Only infer Sanctuary slugs when ICS omitted URL (prefer ICS URL; do not invent -2 duplicates)
  const src = draft.sourceUrl || "";
  if (/pdxsanctuary\.com/i.test(src) && !draft.ticketUrl) {
    const slug = titleToSlug(draft.title || "");
    if (slug) {
      const page = `https://pdxsanctuary.com/events/${slug}/`;
      return {
        ...draft,
        eventPageUrl: page,
        warnings: Array.from(
          new Set([...(draft.warnings || []), "Event page URL inferred from Sanctuary slug"]),
        ),
      };
    }
  }

  return draft;
}
