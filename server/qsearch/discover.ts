import { fetchIngestSource } from "../ingest/fetchSource";
import { previewIngest } from "../ingest";
import { isAllowedDiscoveryUrl, isGenericEventbriteDumpUrl } from "../ingest/relevance";
import type { IngestEventDraft } from "../ingest/types";
import type { Event } from "@shared/schema";
import { expandWebsiteScrapeCandidates } from "@shared/ingestSources";

export type DiscoverHit = {
  url: string;
  eventCount: number;
  parsers: string[];
  drafts: IngestEventDraft[];
  sourceUrl: string | null;
};

const ABS_LINK_RE =
  /(?:href|content)\s*=\s*["'](https?:\/\/[^"']+\.(?:ics|ical)(?:\?[^"']*)?|webcal:\/\/[^"']+|https?:\/\/[^"']*(?:ical=1|format=json|tribe\/events\/v1\/events|calendar\/ical|\/events\/?|\/calendar\/?)[^"']*)["']/gi;

const REL_LINK_RE =
  /(?:href)\s*=\s*["'](\/[^"']*(?:ical=1|format=json|events|calendar|\.ics)[^"']*)["']/gi;

const ALT_CAL_RE =
  /<link[^>]+rel=["'][^"']*alternate[^"']*["'][^>]+type=["'](?:text\/calendar|application\/rss\+xml)["'][^>]+href=["']([^"']+)["']/gi;

const ALT_CAL_RE2 =
  /<link[^>]+href=["']([^"']+)["'][^>]+type=["']text\/calendar["']/gi;

function absUrl(base: string, href: string): string | null {
  try {
    if (href.startsWith("webcal://")) href = "https://" + href.slice("webcal://".length);
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

/** Extract candidate calendar/event URLs from HTML. */
export function extractDiscoveryUrls(html: string, pageUrl: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const u = absUrl(pageUrl, raw);
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };

  let m: RegExpExecArray | null;
  const abs = new RegExp(ABS_LINK_RE.source, "gi");
  while ((m = abs.exec(html)) != null) push(m[1]);
  const rel = new RegExp(REL_LINK_RE.source, "gi");
  while ((m = rel.exec(html)) != null) push(m[1]);
  const a1 = new RegExp(ALT_CAL_RE.source, "gi");
  while ((m = a1.exec(html)) != null) push(m[1]);
  const a2 = new RegExp(ALT_CAL_RE2.source, "gi");
  while ((m = a2.exec(html)) != null) push(m[1]);

  // Google calendar public ical embedded
  const gcal = html.matchAll(
    /https:\/\/calendar\.google\.com\/calendar\/ical\/[^"'\\\s]+\/public\/basic\.ics/gi,
  );
  for (const g of gcal) push(g[0]);

  return out.slice(0, 12);
}

/**
 * Try primary URL + recipe + expanded paths + HTML-discovered feeds.
 * Returns the best non-empty parse (most events), else empty last attempt.
 */
export async function discoverAndParse(opts: {
  primaryUrl: string;
  recipeUrl?: string | null;
  resolvedUrl?: string | null;
  existingEvents: Event[];
  allowExpand?: boolean;
}): Promise<DiscoverHit & { tried: string[] }> {
  const tried: string[] = [];
  const queue: string[] = [];
  const pushQ = (u: string | null | undefined) => {
    if (!u) return;
    if (queue.includes(u)) return;
    queue.push(u);
  };

  // Never re-use a poisoned "local events" dump as resolved recipe
  const safeResolved =
    opts.resolvedUrl && !isGenericEventbriteDumpUrl(opts.resolvedUrl) && isAllowedDiscoveryUrl(opts.primaryUrl, opts.resolvedUrl)
      ? opts.resolvedUrl
      : null;

  pushQ(opts.recipeUrl);
  pushQ(safeResolved);
  pushQ(opts.primaryUrl);

  if (opts.allowExpand !== false) {
    for (const c of expandWebsiteScrapeCandidates(opts.primaryUrl)) {
      if (isAllowedDiscoveryUrl(opts.primaryUrl, c)) pushQ(c);
    }
  }

  let best: DiscoverHit = {
    url: opts.primaryUrl,
    eventCount: 0,
    parsers: [],
    drafts: [],
    sourceUrl: null,
  };

  /** Prefer primary-path hits over generic high-count dumps. */
  function scoreHit(url: string, count: number): number {
    let s = count;
    try {
      const primary = new URL(opts.primaryUrl.includes("://") ? opts.primaryUrl : `https://${opts.primaryUrl}`);
      const u = new URL(url.includes("://") ? url : `https://${url}`);
      if (u.pathname === primary.pathname) s += 1000; // exact primary wins
      else if (primary.pathname.length > 1 && u.pathname.startsWith(primary.pathname.replace(/\/$/, ""))) s += 200;
      if (isGenericEventbriteDumpUrl(url)) s -= 10_000;
    } catch {
      /* keep count */
    }
    return s;
  }

  let bestScore = -Infinity;

  // First pass: known URLs
  for (const url of queue.slice(0, 8)) {
    if (!isAllowedDiscoveryUrl(opts.primaryUrl, url)) continue;
    tried.push(url);
    try {
      const result = await previewIngest({ url, existingEvents: opts.existingEvents });
      if (!result.ok) continue;
      const drafts = result.events.map(e => e.draft);
      const sc = scoreHit(url, drafts.length);
      if (sc > bestScore) {
        bestScore = sc;
        best = {
          url,
          eventCount: drafts.length,
          parsers: result.parseSources,
          drafts,
          sourceUrl: result.sourceUrl,
        };
      }
      // Discover more from HTML body when zero or low yield
      if (drafts.length === 0 || result.parseSources.length === 0) {
        try {
          const fetched = await fetchIngestSource(url);
          if (fetched.body && /<html|<link|href=/i.test(fetched.body)) {
            for (const d of extractDiscoveryUrls(fetched.body, fetched.url || url)) {
              if (isAllowedDiscoveryUrl(opts.primaryUrl, d)) pushQ(d);
            }
          }
        } catch {
          /* ignore discover fetch errors */
        }
      }
      // Good enough on the exact primary path — don't chase bigger dumps
      if (drafts.length >= 1 && scoreHit(url, drafts.length) >= 1000) break;
      if (best.eventCount >= 3 && bestScore >= 1000) break;
    } catch {
      /* try next */
    }
  }

  // Second pass: newly discovered links not yet tried
  for (const url of queue) {
    if (tried.includes(url)) continue;
    if (!isAllowedDiscoveryUrl(opts.primaryUrl, url)) continue;
    if (tried.length >= 14) break;
    tried.push(url);
    try {
      const result = await previewIngest({ url, existingEvents: opts.existingEvents });
      if (!result.ok) continue;
      const drafts = result.events.map(e => e.draft);
      const sc = scoreHit(url, drafts.length);
      if (sc > bestScore) {
        bestScore = sc;
        best = {
          url,
          eventCount: drafts.length,
          parsers: result.parseSources,
          drafts,
          sourceUrl: result.sourceUrl,
        };
      }
      if (best.eventCount >= 5 && bestScore >= 1000) break;
    } catch {
      /* next */
    }
  }

  return { ...best, tried };
}
