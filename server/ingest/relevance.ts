/**
 * Scan relevance filters — keep QSearch drafts on Portland queer nightlife,
 * not Eventbrite city dumps, German webinars, or random bar crawls.
 */
import type { IngestEventDraft } from "./types";
import { isPortlandEventListing } from "./index";

const FOREIGN_EB_HOST =
  /eventbrite\.(de|co\.uk|fr|es|it|nl|com\.br|com\.ar|com\.mx|com\.au|ca|at|ch|be|ie|pt|se|dk|fi|no|pl|cz|hu|ro|sg|hk|in|ph|za)\b/i;

const QUEER_SIGNAL =
  /\b(lgbtq?\+?|queer|gay|lesbian|sapphic|bisexual|\bbi\b|trans(?:gender)?|non[- ]?binary|enby|drag|pride|bear\b|cub\b|leather|kink|fetish|dyke|twink|femme|butch|ballroom|vogue|house of|poly(?:am)?|enm\b|t4t|wlw|mlm|same[- ]sex|rainbow|out@|coming out)\b/i;

const QUEER_VENUE =
  /\b(darcelle|stag(?:\s*pdx)?|badlands|eagle(?:\s*portland)?|silverado|cc\s*slaughters|slaughters|nova(?:\s*pdx)?|holocene|sanctuary|hawks|camp\s*bar|scandals|get\s*down|meet\s*rack|peacock|crush|nest\s*lounge|process|escape\s*bar|sports\s*bra|bar\s*cala|q\s*center|rose\s*court|bearracuda|steam(?:\s*pdx)?|montavilla\s*station|automatic\s*bar|covert\s*caf[eé]|living\s*room\s*wines)\b/i;

/** Generic Eventbrite "local events" dumps — never a valid resolved recipe. */
export function isGenericEventbriteDumpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (!host.includes("eventbrite")) return false;
    const path = u.pathname.toLowerCase();
    if (/^\/d\/local(\/|$)/.test(path)) return true;
    if (/^\/events\/?$/.test(path)) return true;
    if (/^\/d\/[^/]+\/events\/?$/.test(path) && !u.pathname.split("/").filter(Boolean)[2]) return true;
    return false;
  } catch {
    return false;
  }
}

/** Ticket/event page on a non-US Eventbrite locale (Berlin webinars, etc.). */
export function isForeignEventbriteUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url.includes("://") ? url : `https://${url}`).hostname.toLowerCase();
    return FOREIGN_EB_HOST.test(host);
  } catch {
    return FOREIGN_EB_HOST.test(url);
  }
}

export function hasQueerSignal(
  draft: Pick<IngestEventDraft, "title" | "description" | "venueName" | "address" | "neighborhood" | "sourceUrl" | "ticketUrl">,
): boolean {
  const blob = [
    draft.title,
    draft.venueName,
    draft.address,
    draft.neighborhood,
    draft.description?.slice(0, 500),
    draft.sourceUrl,
    draft.ticketUrl,
  ]
    .filter(Boolean)
    .join(" ");
  return QUEER_SIGNAL.test(blob) || QUEER_VENUE.test(blob);
}

/** Tokens from a venue-ish query: "escape-bar-and-grill" → ["escape","bar","grill"] */
export function tokensFromQuery(raw: string): string[] {
  const stop = new Set([
    "and",
    "the",
    "or",
    "at",
    "in",
    "of",
    "a",
    "an",
    "for",
    "event",
    "events",
    "portland",
    "pdx",
    "bar",
    "grill",
    "lounge",
    "club",
    "cafe",
    "café",
  ]);
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !stop.has(t));
}

/**
 * Venue/org-scoped Eventbrite sources: require the listing to actually
 * mention the venue (or land on a known queer venue for that source).
 */
/** Words too generic to identify a venue on their own (defeats "sports"→every sports event). */
const GENERIC_SCOPE_TOKEN =
  /^(sports?|dance|music|night|nights|bar|bars|club|clubs|party|parties|event|events|live|social|drag|show|shows|pride)$/i;

export function matchesVenueScope(
  draft: Pick<IngestEventDraft, "title" | "description" | "venueName" | "address" | "sourceUrl" | "ticketUrl">,
  scopeTokens: string[],
): boolean {
  if (!scopeTokens.length) return true;
  const blob = [
    draft.title,
    draft.venueName,
    draft.address,
    draft.description?.slice(0, 300),
    draft.sourceUrl,
    draft.ticketUrl,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Where the event actually IS — venue name, address, and the event's own
  // Eventbrite slug — as opposed to what its title/description happen to say.
  // A generic word like "Sports" in a *title* must never scope-match The
  // Sports Bra; only a location field (or the event's own EB slug) counts.
  const locBlob = [draft.venueName, draft.address, draft.sourceUrl, draft.ticketUrl]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const primary = scopeTokens[0];
  // "Stags' Leap" wine dinners are NOT Stag PDX
  if (primary === "stag" || scopeTokens.includes("stag")) {
    if (/\bstags?\s*['']?\s*leap\b/i.test(blob)) return false;
    return /\bstag(?:\s*pdx)?\b/i.test(blob) || /\bbroadway'?s\s+finest\b/i.test(blob);
  }

  // Multi-token venue (sports + bra): need the distinctive pair to appear in the
  // LOCATION fields, not merely in a title. "Kellogg Creek Ward Sports Night"
  // (title has "sports", venue is a church) and "StrongFirst Barbell Cert"
  // (at Hardstyle Strength) must both fail — they are not AT The Sports Bra.
  if (scopeTokens.length >= 2) {
    const hits = scopeTokens.filter(t => new RegExp(`\\b${escapeRe(t)}\\b`, "i").test(locBlob));
    if (hits.length >= 2) return true;
    // concatenated form e.g. "sportbra" rare — also allow full phrase (location fields)
    const phrase = scopeTokens.join("\\s+");
    if (new RegExp(`\\b${phrase}\\b`, "i").test(locBlob)) return true;
    // A single distinctive token can stand in for the venue (e.g. "escape",
    // "sanctuary") — but NOT a generic word like "sports"/"dance"/"night", or
    // every sports/dance/night event city-wide would pass.
    const distinctive = scopeTokens.filter(t => t.length >= 5 && !GENERIC_SCOPE_TOKEN.test(t));
    if (distinctive.some(t => new RegExp(`\\b${escapeRe(t)}\\b`, "i").test(blob))) return true;
    return false;
  }

  if (primary && new RegExp(`\\b${escapeRe(primary)}\\b`, "i").test(blob)) return true;
  return false;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type SourceRelevanceContext = {
  sourceId: string;
  label: string;
  url: string;
  tier: string;
};

/**
 * Infer how strict to be for this source.
 * - venue: Eventbrite org or city search named after a place
 * - keyword: city LGBTQ keyword searches (gay, drag, …)
 * - general: aggregators / loose city feeds — queer + Portland
 * - open: trusted venue calendars (Sanctuary HTML, Tribe, …) — only drop foreign EB + non-events
 */
export function relevanceModeForSource(ctx: SourceRelevanceContext): "venue" | "keyword" | "general" | "open" {
  const id = ctx.sourceId.toLowerCase();
  const url = (ctx.url || "").toLowerCase();
  const tier = (ctx.tier || "").toLowerCase();

  // Portland identity keyword searches (lgbtq, gay, lesbian, queer, trans, drag, …)
  if (
    /^eb-(gay|drag|lgbtq|queer|lesbian|trans|pride|sapphic|bisexual|nonbinary|ballroom|leather)/i.test(
      id,
    ) ||
    /\/d\/[^/]+\/(gay|drag|lgbtq|queer|lesbian|trans|transgender|pride|sapphic|bisexual|nonbinary|ballroom|leather)\/?$/i.test(
      url,
    ) ||
    /^everout-(gay|drag|lgbtq|queer|lesbian|trans|pride)/i.test(id)
  ) {
    return "keyword";
  }
  if (
    /eventbrite\.com\/o\//i.test(url) ||
    /-eb$/i.test(id) ||
    /eventbrite\.com\/d\//i.test(url)
  ) {
    return "venue";
  }
  if (tier === "eventbrite" || tier === "agg" || tier === "partiful") {
    return "general";
  }
  return "open";
}

/** Scope tokens for venue mode (from EB path or label). */
export function venueScopeTokens(ctx: SourceRelevanceContext): string[] {
  const url = ctx.url || "";
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    // /o/stag-pdx-73608204703
    const org = u.pathname.match(/\/o\/([a-z0-9-]+)/i);
    if (org) {
      const slug = org[1].replace(/-\d+$/, ""); // drop trailing org id
      return tokensFromQuery(slug);
    }
    // /d/or--portland/escape-bar-and-grill/
    const city = u.pathname.match(/\/d\/[^/]+\/([^/]+)/i);
    if (city) {
      const q = decodeURIComponent(city[1]);
      if (!/^(gay|drag|lgbtq|queer|events?)(-event)?$/i.test(q)) {
        return tokensFromQuery(q);
      }
    }
  } catch {
    /* fall through */
  }
  // Label: "Stag PDX (Eventbrite)" → stag, pdx
  return tokensFromQuery(ctx.label.replace(/\(.*?\)/g, " "));
}

/**
 * Keep draft for this source? false = drop as noise.
 */
export function isRelevantScanDraft(
  draft: IngestEventDraft,
  ctx: SourceRelevanceContext,
): { keep: boolean; reason?: string } {
  const urls = [draft.ticketUrl, draft.sourceUrl, draft.eventPageUrl].filter(Boolean) as string[];
  for (const u of urls) {
    if (isForeignEventbriteUrl(u)) {
      return { keep: false, reason: "foreign_eventbrite" };
    }
    if (isGenericEventbriteDumpUrl(u)) {
      return { keep: false, reason: "generic_eb_dump" };
    }
  }

  const mode = relevanceModeForSource(ctx);

  if (mode === "open") {
    return { keep: true };
  }

  // Commercial bar-crawl spam often bleeds into venue-named EB city searches
  const title = String(draft.title || "");
  if (
    /\b(bar\s*crawl|santacon|pub\s*crawl|crawl\s*202\d)\b/i.test(title) &&
    !hasQueerSignal(draft)
  ) {
    return { keep: false, reason: "bar_crawl_noise" };
  }

  if (mode === "venue") {
    const tokens = venueScopeTokens(ctx);
    if (tokens.length && !matchesVenueScope(draft, tokens)) {
      return { keep: false, reason: "venue_mismatch" };
    }
    // Still require Portland-ish when address claims another city
    if (draft.address && !isPortlandEventListing(draft) && !hasQueerSignal(draft)) {
      // Soft: if venue matched "stag" locally, keep; if only random Portland address without venue, already dropped
    }
    return { keep: true };
  }

  if (mode === "keyword") {
    if (!hasQueerSignal(draft)) {
      return { keep: false, reason: "no_queer_signal" };
    }
    // Keyword city searches should stay in PDX
    if (!isPortlandEventListing(draft) && draft.address) {
      // isPortland false with address often means out of market
      if (
        /\b(berlin|munich|hamburg|london|paris|seattle|san francisco|los angeles|nyc|new york)\b/i.test(
          [draft.address, draft.venueName, draft.title].join(" "),
        )
      ) {
        return { keep: false, reason: "out_of_market" };
      }
    }
    return { keep: true };
  }

  // general aggregators
  if (!hasQueerSignal(draft)) {
    return { keep: false, reason: "no_queer_signal" };
  }
  if (!isPortlandEventListing(draft)) {
    // Allow if venue is known queer (signal already true) and no foreign city
    const blob = [draft.address, draft.venueName, draft.title].join(" ");
    if (
      /\b(berlin|munich|seattle|san francisco|los angeles|nyc|new york|chicago|austin)\b/i.test(blob) &&
      !/\b(portland|pdx|oregon)\b/i.test(blob)
    ) {
      return { keep: false, reason: "out_of_market" };
    }
  }
  return { keep: true };
}

/**
 * Whether a candidate discovery URL is allowed given the primary source URL.
 * Blocks Eventbrite local dumps when primary was an organizer/city query.
 */
export function isAllowedDiscoveryUrl(primaryUrl: string, candidateUrl: string): boolean {
  if (isGenericEventbriteDumpUrl(candidateUrl)) return false;
  if (isForeignEventbriteUrl(candidateUrl) && !isForeignEventbriteUrl(primaryUrl)) return false;

  try {
    const p = new URL(primaryUrl.includes("://") ? primaryUrl : `https://${primaryUrl}`);
    const c = new URL(candidateUrl.includes("://") ? candidateUrl : `https://${candidateUrl}`);
    const ph = p.hostname.replace(/^www\./i, "").toLowerCase();
    const ch = c.hostname.replace(/^www\./i, "").toLowerCase();

    if (ph.includes("eventbrite") && ch.includes("eventbrite")) {
      // Organizer page: only same /o/{slug} or same host event detail pages
      const pOrg = p.pathname.match(/\/o\/([^/]+)/i)?.[1];
      if (pOrg) {
        const cOrg = c.pathname.match(/\/o\/([^/]+)/i)?.[1];
        if (cOrg && cOrg !== pOrg) return false;
        if (/^\/d\//i.test(c.pathname)) return false; // never promote city search from org
        return true;
      }
      // City search: only same /d/.../query path prefix
      const pCity = p.pathname.match(/\/d\/([^/]+)\/([^/]+)/i);
      if (pCity) {
        const cCity = c.pathname.match(/\/d\/([^/]+)\/([^/]+)/i);
        if (!cCity) return /^\/e\//i.test(c.pathname); // event detail ok
        return cCity[1] === pCity[1] && cCity[2] === pCity[2];
      }
    }
  } catch {
    /* allow */
  }
  return true;
}
