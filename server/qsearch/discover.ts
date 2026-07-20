import { fetchIngestSource } from "../ingest/fetchSource";
import { previewIngest } from "../ingest";
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

  pushQ(opts.recipeUrl);
  pushQ(opts.resolvedUrl);
  pushQ(opts.primaryUrl);

  if (opts.allowExpand !== false) {
    for (const c of expandWebsiteScrapeCandidates(opts.primaryUrl)) pushQ(c);
  }

  let best: DiscoverHit = {
    url: opts.primaryUrl,
    eventCount: 0,
    parsers: [],
    drafts: [],
    sourceUrl: null,
  };

  // First pass: known URLs
  for (const url of queue.slice(0, 8)) {
    tried.push(url);
    try {
      const result = await previewIngest({ url, existingEvents: opts.existingEvents });
      if (!result.ok) continue;
      const drafts = result.events.map(e => e.draft);
      if (drafts.length > best.eventCount) {
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
              pushQ(d);
            }
          }
        } catch {
          /* ignore discover fetch errors */
        }
      }
      if (best.eventCount >= 3) break; // good enough early exit
    } catch {
      /* try next */
    }
  }

  // Second pass: newly discovered links not yet tried
  for (const url of queue) {
    if (tried.includes(url)) continue;
    if (tried.length >= 14) break;
    tried.push(url);
    try {
      const result = await previewIngest({ url, existingEvents: opts.existingEvents });
      if (!result.ok) continue;
      const drafts = result.events.map(e => e.draft);
      if (drafts.length > best.eventCount) {
        best = {
          url,
          eventCount: drafts.length,
          parsers: result.parseSources,
          drafts,
          sourceUrl: result.sourceUrl,
        };
      }
      if (best.eventCount >= 5) break;
    } catch {
      /* next */
    }
  }

  return { ...best, tried };
}
