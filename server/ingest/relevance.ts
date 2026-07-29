/**
 * Scan relevance filters - keep QSearch drafts on Portland queer nightlife,
 * not Eventbrite city dumps, German webinars, or random bar crawls.
 */
import type { IngestEventDraft } from "./types";
import { isPortlandEventListing } from "./index";
import { matchClosedVenue } from "@shared/closedVenues";
import { normalizeVenueKey } from "@shared/venueLinks";

const FOREIGN_EB_HOST =
  /eventbrite\.(de|co\.uk|fr|es|it|nl|com\.br|com\.ar|com\.mx|com\.au|ca|at|ch|be|ie|pt|se|dk|fi|no|pl|cz|hu|ro|sg|hk|in|ph|za)\b/i;

const EXPLICIT_QUEER_EVENT_SIGNAL =
  /\b(lgbtq?\+?|queer|gay|lesbian|sapphic|bisexual|\bbi\b|trans(?:gender)?|non[- ]?binary|enby|drag|pride|bear\b|cub\b|leather|kink|fetish|dyke|twink|femme|butch|ballroom|vogue|house of|poly(?:am)?|enm\b|t4t|wlw|mlm|same[- ]sex|rainbow|out@|coming out)\b/i;

/**
 * Dedicated LGBTQ+ venues where the venue identity itself is sufficient
 * relevance evidence. These are exact aliases, not a keyword regex: an event
 * at "Badlands" qualifies, while "Badlands Golf Club" does not.
 *
 * General venues (Holocene, The Get Down, etc.) intentionally do not appear
 * here. Their events need explicit LGBTQ+ wording or an explicit queer host.
 */
const DEDICATED_QUEER_VENUE_ALIASES = new Set(
  [
    "Badlands",
    "Badlands Portland",
    "Camp Bar",
    "Camp Bar PDX",
    "CC Slaughters",
    "Darcelle XV",
    "Darcelle XV Showplace",
    "Darcelle XV Plaza",
    "Eagle",
    "Eagle Portland",
    "Hawks",
    "Hawks PDX",
    "Peacock PDX",
    "Q Center",
    "Sanctuary",
    "Sanctuary Club",
    "PDX Sanctuary",
    "Scandals",
    "Scandals East",
    "Silverado",
    "Stag",
    "Stag PDX",
    "Steam",
    "Steam Portland",
    "The Meet Rack",
    "The Meet Rack at Darkroom",
    "The Nest Lounge",
    "The Sports Bra",
    "Triangle Recreation Camp",
    "Camp TRC",
  ].map(normalizeVenueKey),
);

/** Official hosts for dedicated LGBTQ+ venues. Shared ticket platforms never qualify. */
const DEDICATED_QUEER_VENUE_HOSTS = new Set([
  "badlandsportland.com",
  "campbarpdx.com",
  "camptrc.org",
  "ccslaughterspdx.com",
  "darcellexv.com",
  "eagleportland.com",
  "hawkspdx.com",
  "meetrack.org",
  "pdxqcenter.org",
  "pdxsanctuary.com",
  "peacockpdx.com",
  "scandalspdx.com",
  "silveradopdx.com",
  "stagportland.com",
  "steampdx.com",
  "thesportsbraofficial.com",
]);

function urlHost(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname
      .replace(/^www\./i, "")
      .toLowerCase();
  } catch {
    return null;
  }
}

export function hasExplicitQueerEventSignal(
  draft: Pick<IngestEventDraft, "title" | "description">,
): boolean {
  return EXPLICIT_QUEER_EVENT_SIGNAL.test(
    [draft.title, draft.description?.slice(0, 800)].filter(Boolean).join(" "),
  );
}

export function isDedicatedQueerVenueListing(
  draft: Pick<IngestEventDraft, "venueName" | "sourceUrl" | "eventPageUrl">,
): boolean {
  const venueKey = normalizeVenueKey(draft.venueName);
  if (venueKey && DEDICATED_QUEER_VENUE_ALIASES.has(venueKey)) return true;

  for (const value of [draft.sourceUrl, draft.eventPageUrl]) {
    const host = urlHost(value);
    if (host && DEDICATED_QUEER_VENUE_HOSTS.has(host)) return true;
  }
  return false;
}

/** Generic Eventbrite "local events" dumps - never a valid resolved recipe. */
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
  draft: Pick<
    IngestEventDraft,
    "title" | "description" | "venueName" | "sourceUrl" | "eventPageUrl"
  >,
): boolean {
  return hasExplicitQueerEventSignal(draft) || isDedicatedQueerVenueListing(draft);
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

  // Where the event actually IS - venue name, address, and the event's own
  // Eventbrite slug - as opposed to what its title/description happen to say.
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
  // (at Hardstyle Strength) must both fail - they are not AT The Sports Bra.
  if (scopeTokens.length >= 2) {
    const hits = scopeTokens.filter(t => new RegExp(`\\b${escapeRe(t)}\\b`, "i").test(locBlob));
    if (hits.length >= 2) return true;
    // concatenated form e.g. "sportbra" rare - also allow full phrase (location fields)
    const phrase = scopeTokens.join("\\s+");
    if (new RegExp(`\\b${phrase}\\b`, "i").test(locBlob)) return true;
    // A single distinctive token can stand in for the venue (e.g. "escape",
    // "sanctuary") - but NOT a generic word like "sports"/"dance"/"night", or
    // every sports/dance/night event city-wide would pass.
    // Prefer LOCATION fields for the distinctive token (title-only is how
    // church "Sports Night" used to leak when "sports" was the only match).
    const distinctive = scopeTokens.filter(t => t.length >= 5 && !GENERIC_SCOPE_TOKEN.test(t));
    if (distinctive.some(t => new RegExp(`\\b${escapeRe(t)}\\b`, "i").test(locBlob))) return true;
    // EB slug may still name the venue when venueName is empty
    const urlBlob = [draft.sourceUrl, draft.ticketUrl].filter(Boolean).join(" ").toLowerCase();
    if (distinctive.some(t => new RegExp(`\\b${escapeRe(t)}\\b`, "i").test(urlBlob))) return true;
    return false;
  }

  // Single token: never keep on a generic word alone ("sports", "night", …)
  if (primary && GENERIC_SCOPE_TOKEN.test(primary)) return false;
  if (primary && new RegExp(`\\b${escapeRe(primary)}\\b`, "i").test(locBlob)) return true;
  if (primary && new RegExp(`\\b${escapeRe(primary)}\\b`, "i").test(blob)) {
    // Title-only match for a single distinctive venue token is OK (e.g. "stag")
    if (primary.length >= 5 && !GENERIC_SCOPE_TOKEN.test(primary)) return true;
  }
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
  /** Directory/curated identity; an LGBTQ+ group source is explicit host evidence. */
  businessType?: string | null;
};

function sourceHasExplicitQueerIdentity(ctx: SourceRelevanceContext): boolean {
  const type = String(ctx.businessType || "").toLowerCase();
  if (type === "group" || type === "nonprofit") return true;

  const labelKey = normalizeVenueKey(ctx.label.replace(/\(.*?\)/g, ""));
  if (labelKey && DEDICATED_QUEER_VENUE_ALIASES.has(labelKey)) return true;

  const host = urlHost(ctx.url);
  return Boolean(host && DEDICATED_QUEER_VENUE_HOSTS.has(host));
}

/**
 * Infer how strict to be for this source.
 * - venue: Eventbrite org or city search named after a place
 * - keyword: city LGBTQ keyword searches (gay, drag, …)
 * - general: aggregators / loose city feeds - queer + Portland
 * - open: own-site / pasted sources - still require queer event or exact queer venue evidence
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
 * Hard off-scene noise that must never land on Zaylist — even via open-mode
 * URL paste / generic Eventbrite discovery. Not queer nightlife; not our board.
 *
 * How Kellogg / Golf Scramble / Pro Wrestling / Playmakers got LIVE: source
 * `url_ingest` with open relevance (no queer check). Sports-Bra venue mode
 * already drops church "Sports Night"; open mode did not.
 */
export function isOffSceneNoiseDraft(
  draft: Pick<
    IngestEventDraft,
    "title" | "description" | "venueName" | "address" | "neighborhood"
  >,
  sourceHasQueerIdentity = false,
): { noise: boolean; reason?: string } {
  const blob = [
    draft.title,
    draft.venueName,
    draft.address,
    draft.neighborhood,
    draft.description?.slice(0, 400),
  ]
    .filter(Boolean)
    .join(" ");

  // Faith-org sports nights (LDS ward pickleball, etc.)
  if (
    /\b(church of jesus christ|latter[- ]day saints|\blds\b|ward sports|ward pickleball|stake center|kingdom hall)\b/i.test(
      blob,
    )
  ) {
    return { noise: true, reason: "faith_org_noise" };
  }
  // Generic golf fundraisers / municipal courses (not queer league)
  if (
    /\b(golf scramble|golf tournament|golf fundraiser|golf course)\b/i.test(blob) &&
    !sourceHasQueerIdentity && !hasQueerSignal(draft as IngestEventDraft)
  ) {
    return { noise: true, reason: "golf_noise" };
  }
  // Indie pro-wrestling schools (not our scene)
  if (
    /\b(pro(?:fessional)?\s+wrestling|wrestling school|oregon pro wrestling)\b/i.test(blob) &&
    !sourceHasQueerIdentity && !hasQueerSignal(draft as IngestEventDraft)
  ) {
    return { noise: true, reason: "wrestling_noise" };
  }
  // Random sports bars outside the queer map (Hazel Dell Playmakers sip-n-paint, etc.)
  if (
    /\bplaymakers\s+sports\s+bar\b/i.test(blob) ||
    (/\bhazel\s*dell\b/i.test(blob) &&
      /\b(sports\s+bar|sip\s*[&+]\s*paint|paint night)\b/i.test(blob) &&
      !sourceHasQueerIdentity && !hasQueerSignal(draft as IngestEventDraft))
  ) {
    return { noise: true, reason: "off_map_sports_bar" };
  }
  // Generic fitness / civic EB dumps (jiu-jitsu comps, beer runs, rock gyms, Shriners)
  if (
    !sourceHasQueerIdentity &&
    !hasQueerSignal(draft as IngestEventDraft) &&
    /\b(jiu[- ]?jitsu|no[- ]?gi|bjj\b|rock gym|climbing experience|beer run|brewery running|shriners|sports consortium|art\s*&\s*wine walk|women\s+golf\s+outing|hosts?\s*&\s*home\s*teams)\b/i.test(
      blob,
    )
  ) {
    return { noise: true, reason: "generic_civic_fitness_noise" };
  }
  return { noise: false };
}

/**
 * Keep draft for this source? false = drop as noise.
 */
export function isRelevantScanDraft(
  draft: IngestEventDraft,
  ctx: SourceRelevanceContext,
): { keep: boolean; reason?: string } {
  const sourceHasQueerIdentity = sourceHasExplicitQueerIdentity(ctx);
  const hasQueerEvidence = hasQueerSignal(draft) || sourceHasQueerIdentity;
  const urls = [draft.ticketUrl, draft.sourceUrl, draft.eventPageUrl].filter(Boolean) as string[];
  for (const u of urls) {
    if (isForeignEventbriteUrl(u)) {
      return { keep: false, reason: "foreign_eventbrite" };
    }
    if (isGenericEventbriteDumpUrl(u)) {
      return { keep: false, reason: "generic_eb_dump" };
    }
  }

  // Dead / relocated venues (all modes including open trusted calendars)
  const closed = matchClosedVenue({
    venueName: draft.venueName,
    address: draft.address,
    title: draft.title,
  });
  if (closed) {
    return { keep: false, reason: closed.reason };
  }

  // Off-scene noise (churches, golf scrambles, pro wrestling, random sports bars)
  const off = isOffSceneNoiseDraft(draft, sourceHasQueerIdentity);
  if (off.noise) {
    return { keep: false, reason: off.reason };
  }

  const mode = relevanceModeForSource(ctx);

  if (mode === "open") {
    // "Open" used to mean every event on an ordinary venue site passed. That
    // pulled unrelated concerts/classes into Zaylist. Exact dedicated queer
    // venues pass by identity; every other venue needs explicit event wording.
    if (!hasQueerEvidence) {
      return { keep: false, reason: "no_queer_signal" };
    }
    return { keep: true };
  }

  // Commercial bar-crawl spam often bleeds into venue-named EB city searches
  const title = String(draft.title || "");
  if (
    /\b(bar\s*crawl|santacon|pub\s*crawl|crawl\s*202\d)\b/i.test(title) &&
    !hasQueerEvidence
  ) {
    return { keep: false, reason: "bar_crawl_noise" };
  }

  if (mode === "venue") {
    const tokens = venueScopeTokens(ctx);
    if (tokens.length && !matchesVenueScope(draft, tokens)) {
      return { keep: false, reason: "venue_mismatch" };
    }
    if (!hasQueerEvidence) {
      return { keep: false, reason: "no_queer_signal" };
    }
    // Still require Portland-ish when address claims another city
    if (draft.address && !isPortlandEventListing(draft) && !hasQueerEvidence) {
      // Soft: if venue matched "stag" locally, keep; if only random Portland address without venue, already dropped
    }
    return { keep: true };
  }

  if (mode === "keyword") {
    if (!hasQueerEvidence) {
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
  if (!hasQueerEvidence) {
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
