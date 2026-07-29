/**
 * Admin ingest presets - machine-readable twin of docs/VENUE_SCRAPE_EXACT_URLS.md.
 * Keep curated URLs in lockstep with that doc.
 *
 * Directory websites are merged live via `buildDirectoryIngestSources` /
 * `GET /api/admin/events/ingest/sources` so new Places auto-appear in the tool.
 */
import { normalizeVenueKey, VENUE_WEBSITE_FALLBACKS } from "./venueLinks";
import {
  CLOSED_PERMANENT_VENUES,
  isClosedPermanentScrapeUrl,
  isClosedPermanentVenueName,
} from "./closedVenues";

export {
  CLOSED_PERMANENT_VENUES,
  isClosedPermanentScrapeUrl,
  isClosedPermanentVenueName,
} from "./closedVenues";

export type IngestSourceTier =
  | "1"
  | "2"
  | "3"
  | "agg"
  | "partiful"
  | "eventbrite"
  | "directory";

export type IngestSource = {
  id: string;
  label: string;
  /** Primary URL the server will fetch */
  url: string;
  tier: IngestSourceTier;
  /** Parser hint for UI + server logs */
  format:
    | "ics"
    | "jsonld"
    | "squarespace"
    | "tribe"
    | "wix"
    | "html"
    | "eventbrite"
    | "partiful"
    | "unknown";
  notes?: string;
  /** Star sources from the registry */
  priority?: boolean;
  /** Do not auto-trust without human check */
  caution?: boolean;
  /** Directory business id when auto-sourced from Places */
  businessId?: number;
  businessType?: string | null;
  /**
   * When true (or businessType is group without cityAllowlist), scan drops
   * non-Portland listings. Prefer cityAllowlist for multi-city brands.
   */
  portlandOnly?: boolean;
  /**
   * Multi-city brands (e.g. Bearracuda): keep events only in these cities.
   * Values: portland | seattle | … (see isAllowedCityEventListing).
   * When set, takes precedence over portlandOnly.
   */
  cityAllowlist?: string[];
};

/** Direct Sports Bra schedule scraping is paused regardless of registry/custom-source state. */
export function isSportsBraScrapeSource(
  source: Pick<IngestSource, "id" | "label" | "url">,
): boolean {
  const identity = normalizeVenueKey(`${source.id} ${source.label}`);
  if (/\bsports bra\b/.test(identity)) return true;
  try {
    const url = new URL(source.url.includes("://") ? source.url : `https://${source.url}`);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    return host === "thesportsbraofficial.com" || host.endsWith(".thesportsbraofficial.com");
  } catch {
    return false;
  }
}

/**
 * Portland Eventbrite identity keyword searches.
 * One source per term so Scan health shows which query actually yields.
 * Pattern: https://www.eventbrite.com/d/or--portland/{query}/
 * Never use /d/local/events/ or bare /events (city dumps).
 */
export const PORTLAND_EVENTBRITE_KEYWORDS: Array<{
  id: string;
  query: string;
  label: string;
  priority?: boolean;
  notes?: string;
}> = [
  { id: "eb-lgbtq", query: "lgbtq", label: "EB · LGBTQ (Portland)", priority: true },
  { id: "eb-gay", query: "gay", label: "EB · Gay (Portland)", priority: true },
  { id: "eb-lesbian", query: "lesbian", label: "EB · Lesbian (Portland)", priority: true },
  { id: "eb-queer", query: "queer", label: "EB · Queer (Portland)", priority: true },
  { id: "eb-trans", query: "trans", label: "EB · Trans (Portland)", priority: true },
  { id: "eb-transgender", query: "transgender", label: "EB · Transgender (Portland)" },
  { id: "eb-drag", query: "drag", label: "EB · Drag (Portland)", priority: true },
  { id: "eb-pride", query: "pride", label: "EB · Pride (Portland)", priority: true },
  { id: "eb-sapphic", query: "sapphic", label: "EB · Sapphic (Portland)" },
  { id: "eb-bisexual", query: "bisexual", label: "EB · Bisexual (Portland)" },
  { id: "eb-nonbinary", query: "nonbinary", label: "EB · Nonbinary (Portland)" },
  { id: "eb-ballroom", query: "ballroom", label: "EB · Ballroom (Portland)", notes: "House/ball culture" },
  { id: "eb-leather", query: "leather", label: "EB · Leather (Portland)" },
];

function buildPortlandEventbriteKeywordSources(): IngestSource[] {
  return PORTLAND_EVENTBRITE_KEYWORDS.map(k => ({
    id: k.id,
    label: k.label,
    url: `https://www.eventbrite.com/d/or--portland/${encodeURIComponent(k.query)}/`,
    tier: "eventbrite" as const,
    format: "eventbrite" as const,
    priority: k.priority,
    notes:
      k.notes ||
      "Portland-only Eventbrite keyword search. Never expand to /d/local/events/.",
  }));
}

/** EverOut Portland category/tag searches - parallel to EB keywords. */
export const PORTLAND_EVEROUT_CATEGORIES: Array<{
  id: string;
  label: string;
  url: string;
  priority?: boolean;
  notes?: string;
}> = [
  {
    id: "everout-drag",
    label: "EverOut · Drag (Portland)",
    url: "https://everout.com/portland/events/?category=performance-drag",
    priority: true,
  },
  {
    id: "everout-lgbtq",
    label: "EverOut · LGBTQ (Portland)",
    url: "https://everout.com/portland/events/?tag=lgbtq",
    priority: true,
  },
  {
    id: "everout-pride",
    label: "EverOut · Pride (Portland)",
    url: "https://everout.com/portland/events/?tag=pride",
  },
  {
    id: "everout-queer",
    label: "EverOut · Queer (Portland)",
    url: "https://everout.com/portland/events/?q=queer",
  },
  {
    id: "everout-gay",
    label: "EverOut · Gay (Portland)",
    url: "https://everout.com/portland/events/?q=gay",
  },
  {
    id: "everout-lesbian",
    label: "EverOut · Lesbian (Portland)",
    url: "https://everout.com/portland/events/?q=lesbian",
  },
  {
    id: "everout-trans",
    label: "EverOut · Trans (Portland)",
    url: "https://everout.com/portland/events/?q=trans",
  },
];

function buildPortlandEveroutCategorySources(): IngestSource[] {
  return PORTLAND_EVEROUT_CATEGORIES.map(k => ({
    id: k.id,
    label: k.label,
    url: k.url,
    tier: "agg" as const,
    format: "html" as const,
    priority: k.priority,
    notes: k.notes || "Portland EverOut identity/category search - not city-wide unfiltered.",
  }));
}

export const INGEST_SOURCES: IngestSource[] = [
  // ── Tier 1 ──────────────────────────────────────────────────────────────
  // Recipe research: docs/BAR_VENUE_SCAN_RECIPES.md (32 bars/venues/groups)
  {
    id: "sanctuary-calendar",
    label: "Sanctuary calendar",
    url: "https://pdxsanctuary.com/calendar/",
    tier: "1",
    format: "html",
    notes: "HTML calendar + ICS https://pdxsanctuary.com/events/calendar/sanctuary/ics/",
    priority: true,
  },
  {
    id: "sanctuary-ics",
    label: "Sanctuary (ICS)",
    url: "https://pdxsanctuary.com/events/calendar/sanctuary/ics/",
    tier: "1",
    format: "ics",
    priority: true,
    notes:
      "Dedicated adapter: ICS structure + per-event page flyers (budget 80) + series flyer reuse; venue forced to Sanctuary Club / Pearl",
  },
  {
    id: "darcelle-tribe",
    label: "Darcelle (Tribe JSON)",
    url: "https://darcellexv.com/wp-json/tribe/events/v1/events",
    tier: "1",
    format: "tribe",
    priority: true,
    notes: "Per-event image.url flyers; paginated",
  },
  {
    id: "darcelle-ics",
    label: "Darcelle (ICS)",
    url: "https://darcellexv.com/events/?ical=1",
    tier: "1",
    format: "ics",
    notes: "ATTACH flyer URLs",
  },
  {
    id: "steam-events",
    label: "Steam Portland",
    url: "https://www.steampdx.com/events",
    tier: "1",
    format: "wix",
    notes: "warmupData; flyers if empty",
    priority: true,
  },
  {
    id: "hawks-json",
    label: "Hawks PDX",
    url: "https://www.hawkspdx.com/hawks-events?format=json",
    tier: "1",
    format: "squarespace",
    priority: true,
    notes: "upcoming[].assetUrl posters; paginate nextPageUrl",
  },
  {
    id: "stag-eb",
    label: "Stag PDX (Eventbrite)",
    url: "https://www.eventbrite.com/o/stag-pdx-73608204703",
    tier: "1",
    format: "eventbrite",
    priority: true,
    notes: "Do NOT use stagportland.com/events?format=json (empty page). Nightly dancers not discrete rows.",
  },
  {
    id: "scandals-events",
    label: "Scandals East (flyer page)",
    url: "https://scandalspdx.com/events",
    tier: "1",
    format: "html",
    caution: true,
    notes: "Zyrosite flyer gallery - not Squarespace JSON. Harvest poster imgs / OCR. ?format=json returns HTML.",
  },
  {
    id: "badlands-api",
    label: "Badlands calendar API",
    url: "https://badlands-events.badlandsportland.workers.dev/api/calendar",
    tier: "1",
    format: "unknown",
    notes:
      "Worker JSON parseSource=badlands. photoUrl→flyer. Scan auto-expands ?from=today&to=+60d Pacific when missing. Browser UA.",
    priority: true,
  },
  {
    id: "cc-slaughters",
    label: "CC Slaughters",
    url: "https://www.ccslaughterspdx.com/",
    tier: "1",
    format: "html",
    notes: "Weeklies + carousel; prefer *_ADVERTICAL_* posters. No Tribe REST.",
  },
  {
    id: "eagle-events",
    label: "Eagle Portland",
    url: "https://www.eagleportland.com/what-s-happening",
    tier: "1",
    format: "wix",
    priority: true,
    notes:
      "Wix Events appsWarmupData; /event-details/{slug}. Trusted source. 21+ bar; cover UNKNOWN unless free in text.",
  },
  {
    id: "automatic-events",
    label: "Automatic Bar",
    url: "https://www.theautomaticbarpdx.com/",
    tier: "1",
    format: "wix",
    caution: true,
    notes: "/events 404 - homepage only. Often empty; trivia via EB/Untapped.",
  },
  {
    id: "montavilla",
    label: "Montavilla Station",
    url: "https://montavillastation.com/",
    tier: "1",
    format: "html",
    notes: "Parse #fun date/act lines; no flyers. FB for current weekends.",
  },
  {
    id: "silverado",
    label: "Silverado (homepage)",
    url: "https://www.silveradopdx.com/",
    tier: "1",
    format: "html",
    notes: "SQS /events is archive (upcoming empty). Live calendar ≈ IG/FB.",
    caution: true,
  },
  {
    id: "camp-bar",
    label: "Camp Bar PDX",
    url: "https://campbarpdx.com",
    tier: "1",
    format: "html",
    notes: "Static weeklies in #events; specials IG @campbarpdx only",
  },
  {
    id: "peacock-pdx",
    label: "Peacock PDX",
    url: "https://peacockpdx.com/",
    tier: "1",
    format: "html",
    priority: true,
    notes:
      "Year-round queer bar at 1400 SE Morrison (former Crush Bar, closed 2025-01-01). Events section + IG @peacock.pdx. Never scrape crushbarpdx / @crushbarpdx.",
  },
  {
    id: "camp-trc",
    label: "Camp TRC (Triangle Recreation Camp)",
    url: "https://camptrc.org/",
    tier: "1",
    format: "html",
    priority: true,
    notes:
      "Trusted lane. Homepage Event Calendar (theme weekends). WA campground; Wild Apricot event detail + RSS login-gated.",
  },
  {
    id: "covert-events",
    label: "Covert Café events",
    url: "https://www.thecovertcafe.com/events",
    tier: "1",
    format: "html",
    notes: "Drop titles 'We're open today…' (hours not events). No per-event flyers.",
  },
  {
    id: "process-schedule",
    label: "Process schedule",
    url: "https://www.processpdx.club/",
    tier: "1",
    format: "html",
    priority: true,
    notes: "Homepage Schedule + RA tickets; RA art better flyers. Secondary ra.co/promoters/141994",
  },
  {
    id: "living-room-eb",
    label: "Living Room Wines (Eventbrite)",
    url: "https://www.eventbrite.com/o/104468106391",
    tier: "1",
    format: "eventbrite",
    notes: "Ticketed classes. Free nights/dance → IG @livingroomwinespdx",
  },
  {
    id: "escape-weebly",
    label: "Escape (Weebly weeklies)",
    url: "https://escapebargrillpdx.weebly.com/events.html",
    tier: "1",
    format: "html",
    notes: "escapebarandgrill.com DNS dead. Ticketed specials: EB city search filtered to Escape venue.",
  },
  // ── Groups (Portland events only) ───────────────────────────────────────
  {
    id: "bearracuda",
    label: "Bearracuda (Portland + Seattle)",
    url: "https://bearracuda.com/",
    tier: "1",
    format: "html",
    priority: true,
    businessType: "group",
    cityAllowlist: ["portland", "seattle"],
    notes:
      "Multi-city brand — keep Portland + Seattle only (drop SF/LA/etc). Scrape #events /events/{slug}/. Flyers on WP uploads. Group can host at multiple venues (Nova, Sanctuary, …).",
  },
  {
    id: "rose-court",
    label: "Rose Court (ISRC)",
    url: "https://rosecourt.org/upcoming-events/",
    tier: "1",
    format: "html",
    priority: true,
    portlandOnly: true,
    businessType: "group",
    notes: "Partner venues per listing (often Darcelle). Also /coronation/ and /calendar-of-events/.",
  },

  // ── Tier 2 ──────────────────────────────────────────────────────────────
  {
    id: "star-theater",
    label: "Star Theater (site)",
    url: "https://www.startheaterportland.com/",
    tier: "2",
    format: "html",
    notes: "Homepage full list + /tm-event/{slug}/ Ticketweb; BIT secondary",
  },
  {
    id: "star-bit",
    label: "Star Theater (BIT)",
    url: "https://www.bandsintown.com/v/10001223-star-theater",
    tier: "2",
    format: "jsonld",
  },
  {
    id: "starlight-bit",
    label: "Starlight Patio (BIT)",
    url: "https://www.bandsintown.com/v/10243136-starlight-patio-and-lounge-at-the-star-theater",
    tier: "2",
    format: "jsonld",
  },
  {
    id: "holocene-events",
    label: "Holocene events",
    url: "https://www.holocene.org/events/",
    tier: "2",
    format: "html",
    priority: true,
    notes: "Own-site flyers better than BIT; etix links",
  },
  {
    id: "holocene-bit",
    label: "Holocene (BIT)",
    url: "https://www.bandsintown.com/v/10001836-holocene",
    tier: "2",
    format: "jsonld",
  },
  {
    id: "getdown-tixr",
    label: "The Get Down (Tixr)",
    url: "https://www.tixr.com/groups/thegetdownpdx",
    tier: "2",
    format: "jsonld",
    notes: "Per-event static.tixr.com art",
  },
  {
    id: "nova-tixr",
    label: "Nova PDX (Tixr)",
    url: "https://www.tixr.com/groups/novapdx",
    tier: "2",
    format: "jsonld",
    priority: true,
    notes: "novapdx.com is parked - Tixr is SoT. Queer parties + concerts.",
  },
  {
    id: "realm-events",
    label: "REALM PDX events",
    url: "https://realmpdx.com/events/",
    tier: "2",
    format: "html",
    notes: "Needs browser UA (403 bare). Tickets Eventim wl.eventim.us afflky=RealmNightclub",
    caution: true,
  },
  {
    id: "alberta-rose",
    label: "Alberta Rose calendar",
    url: "https://albertarosetheatre.com/calendar/",
    tier: "2",
    format: "html",
    notes: "Card flyers WP uploads; tickets etix",
  },
  {
    id: "white-owl-ra",
    label: "White Owl (RA)",
    url: "https://ra.co/clubs/93930",
    tier: "2",
    format: "jsonld",
  },

  // ── Tier 3 ──────────────────────────────────────────────────────────────
  {
    id: "portland-pride-2026",
    label: "Portland Pride 2026",
    url: "https://www.portlandpride.org/2026-portland-pride-official-events?format=json",
    tier: "3",
    format: "squarespace",
    notes: "Slug rolls yearly",
  },
  {
    id: "q-center-events",
    label: "Q Center events",
    url: "https://www.pdxqcenter.org/events",
    tier: "3",
    format: "html",
    priority: true,
    notes:
      "Year-round community gap fill. Site is Wix/Parastorage (old Tribe REST 404s). HTML/JSON-LD discover + list page; weekly groups may need IG. Never invent FREE. Legacy id q-center-tribe retired.",
  },
  // Keep old id as alias pointing at same page so health history / disabled flags still resolve
  {
    id: "q-center-tribe",
    label: "Q Center events (legacy id)",
    url: "https://www.pdxqcenter.org/events",
    tier: "3",
    format: "html",
    notes: "Alias of q-center-events — Tribe REST is dead (404). Prefer q-center-events.",
  },
  {
    id: "osl-calendar",
    label: "OSL Contest calendar",
    url: "https://www.oslcontest.org/calendar",
    tier: "3",
    format: "html",
    notes: "Extract Google Calendar ICS id",
  },
  // Venue-scoped Eventbrite (not city dumps - require venue match in scan filter)
  {
    id: "escape-eb",
    label: "Escape (Eventbrite venue)",
    url: "https://www.eventbrite.com/d/or--portland/escape-bar-and-grill/",
    tier: "3",
    format: "eventbrite",
    notes: "Venue-scoped only - not city-wide. Filter requires Escape in venue/title.",
  },
  {
    id: "bar-cala-eb",
    label: "Bar Cala (Eventbrite venue)",
    url: "https://www.eventbrite.com/d/or--portland/bar-cala/",
    tier: "3",
    format: "eventbrite",
    notes: "Venue-scoped drag brunches (NE Alberta). Require Bar Cala in venue fields.",
  },
  {
    id: "alberta-street-pub-eb",
    label: "Alberta Street Pub (Eventbrite venue)",
    url: "https://www.eventbrite.com/d/or--portland/alberta-street-pub/",
    tier: "3",
    format: "eventbrite",
    notes: "Drag Brunch PDX + live music. Venue-scoped only (not city dump).",
  },
  {
    id: "lipstick-divas-eb",
    label: "Lipstick Divas / 10 Barrel (Eventbrite)",
    url: "https://www.eventbrite.com/d/or--portland/lipstick-divas/",
    tier: "3",
    format: "eventbrite",
    notes: "Pearl drag brunch at 10 Barrel. Scope: lipstick / 10 barrel in venue or title.",
  },
  {
    id: "space-room-eb",
    label: "Space Room Lounge (Eventbrite venue)",
    url: "https://www.eventbrite.com/d/or--portland/space-room/",
    tier: "3",
    format: "eventbrite",
    notes: "Drag Bingo + lounge nights. Require Space Room in venue.",
  },
  {
    id: "escape-eb-org",
    label: "Escape Bar (Eventbrite venue keyword)",
    url: "https://www.eventbrite.com/d/or--portland/escape-bar/",
    tier: "3",
    format: "eventbrite",
    notes: "Sapphic mixers etc. Venue-scoped; pairs with escape-eb path.",
  },
  // ── Eventbrite keyword searches: REMOVED from the QSearch scan ───────────
  // Broad Eventbrite discovery pulled in non-queer / mislabeled noise, so it
  // no longer feeds QSearch. Eventbrite now lives ONLY in the Trusted lane
  // (trustedVenues fetchMode "eventbrite_org", e.g. Stag PDX). A guard in
  // scanJob (buildLiveSources) also drops any Eventbrite-format scan source.
  // (buildPortlandEventbriteKeywordSources retained but intentionally unused.)

  // ── Partiful ────────────────────────────────────────────────────────────
  {
    id: "partiful-pride-ride",
    label: "Partiful: Pride Ride",
    url: "https://partiful.com/e/RNgh9o2xBSbtN5ZzLHW0",
    tier: "partiful",
    format: "partiful",
  },
  {
    id: "partiful-wake-bake",
    label: "Partiful: Wake Bake Walk",
    url: "https://partiful.com/e/dbI1343XEB6XxzxSQciD",
    tier: "partiful",
    format: "partiful",
  },

  // ── Aggregators (queer-scoped feeds only - no city-wide dumps) ───────────
  {
    id: "dragpdx-tribe",
    label: "dragpdx (ask first)",
    url: "https://dragpdx.com/wp-json/tribe/events/v1/events",
    tier: "agg",
    format: "tribe",
    caution: true,
    notes: "Partnership ask before automated pull",
  },
  {
    id: "qsc-json",
    label: "Queer Social Club",
    url: "https://www.queersocialclub.com/events-portland?format=json",
    tier: "agg",
    format: "squarespace",
    notes: "Portland queer events feed",
  },
  // EverOut Portland - separate category searches (same idea as EB keywords)
  ...buildPortlandEveroutCategorySources(),
  {
    id: "ra-process",
    label: "RA Process",
    url: "https://ra.co/promoters/141994",
    tier: "agg",
    format: "jsonld",
    notes: "Process promoter page - not full RA city dump",
  },
];

export const INGEST_TIER_LABELS: Record<IngestSourceTier, string> = {
  "1": "Tier 1 · Queer venues",
  "2": "Tier 2 · Music rooms",
  "3": "Tier 3 · Community",
  eventbrite: "Eventbrite",
  partiful: "Partiful",
  agg: "Aggregators",
  directory: "Directory · auto",
};

export function sourcesByTier(tier: IngestSourceTier, sources: IngestSource[] = INGEST_SOURCES): IngestSource[] {
  return sources.filter(s => s.tier === tier);
}

/** Host key for dedupe (strips www, lowercases). */
export function ingestHostKey(url: string): string | null {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function normalizeIngestWebsite(raw: string | null | undefined): string | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  // Skip pure social handles / non-http schemes
  if (s.startsWith("@") || s.startsWith("mailto:") || s.startsWith("tel:")) return null;
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    // Drop fragments; keep path (some listings are /events already)
    u.hash = "";
    return u.toString().replace(/\/$/, "") === `${u.protocol}//${u.host}`
      ? `${u.protocol}//${u.host}/`
      : u.toString();
  } catch {
    return null;
  }
}

const WEAK_SCRAPE_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "fb.me",
  "linktr.ee",
  "linktree.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "venmo.com",
  "onlyfans.com",
  "fetlife.com",
  "youtube.com",
  "youtu.be",
  "maps.google.com",
  "goo.gl",
];

export function isWeakScrapeHost(url: string): boolean {
  const host = ingestHostKey(url);
  if (!host) return true;
  return WEAK_SCRAPE_HOSTS.some(h => host === h || host.endsWith(`.${h}`));
}

export type DirectoryBusinessForIngest = {
  id: number;
  name: string;
  website?: string | null;
  type?: string | null;
  active?: boolean | null;
};

export type DirectoryWebsiteResolution = {
  url: string | null;
  /** Where the URL came from */
  source: "field" | "fallback" | "none";
};

/**
 * Resolve a scrape URL for a directory place:
 * 1) listing.website field
 * 2) shared/venueLinks VENUE_WEBSITE_FALLBACKS (hand-maintained known homes)
 */
export function resolveDirectoryWebsite(
  biz: DirectoryBusinessForIngest,
  fallbacks?: Record<string, string>,
): DirectoryWebsiteResolution {
  const fromField = normalizeIngestWebsite(biz.website);
  if (fromField) return { url: fromField, source: "field" };

  // Lazy import avoided - caller can pass map; default loaded below in helper
  const map = fallbacks || VENUE_WEBSITE_FALLBACKS;
  const key = normalizeVenueKey(biz.name);
  if (!key) return { url: null, source: "none" };

  const direct = map[key];
  if (direct) {
    const url = normalizeIngestWebsite(direct);
    return url ? { url, source: "fallback" } : { url: null, source: "none" };
  }

  // Soft match: fallback key contained in name or vice versa
  for (const [fk, furl] of Object.entries(map)) {
    if (!fk) continue;
    if (key.includes(fk) || fk.includes(key)) {
      const url = normalizeIngestWebsite(furl);
      if (url) return { url, source: "fallback" };
    }
  }
  return { url: null, source: "none" };
}

export type DirectoryCoverageRow = {
  businessId: number;
  name: string;
  type: string | null;
  websiteField: string | null;
  resolvedUrl: string | null;
  resolution: "field" | "fallback" | "none";
  inScrapeList: boolean;
  absorbedByCurated: boolean;
};

/** Full directory coverage report - all active places, not only those with a website field. */
export function buildDirectoryCoverage(
  businesses: DirectoryBusinessForIngest[],
  curated: IngestSource[] = INGEST_SOURCES,
): DirectoryCoverageRow[] {
  const curatedHosts = new Set(
    curated.map(s => ingestHostKey(s.url)).filter(Boolean) as string[],
  );
  const sorted = [...businesses]
    .filter(b => b && b.active !== false && !isClosedPermanentVenueName(b.name))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }));

  return sorted.map(biz => {
    const res = resolveDirectoryWebsite(biz);
    const host = res.url ? ingestHostKey(res.url) : null;
    const absorbed = !!(host && curatedHosts.has(host));
    return {
      businessId: biz.id,
      name: biz.name,
      type: biz.type ?? null,
      websiteField: biz.website ? String(biz.website) : null,
      resolvedUrl: res.url,
      resolution: res.source,
      inScrapeList: !!res.url,
      absorbedByCurated: absorbed,
    };
  });
}

/**
 * One ingest source per directory listing with a resolvable website
 * (field or venueLinks fallback). New Places appear on the next sources fetch.
 */
export function buildDirectoryIngestSources(
  businesses: DirectoryBusinessForIngest[],
): IngestSource[] {
  const out: IngestSource[] = [];
  const seenHosts = new Set<string>();

  const sorted = [...businesses]
    .filter(
      b =>
        b &&
        b.active !== false &&
        !isClosedPermanentVenueName(b.name) &&
        // status CLOSED (when present on row) never auto-scrapes
        String((b as { status?: string }).status || "OPEN").toUpperCase() !== "CLOSED",
    )
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }));

  for (const biz of sorted) {
    const resolved = resolveDirectoryWebsite(biz);
    const url = resolved.url;
    if (!url) continue;
    if (isClosedPermanentScrapeUrl(url)) continue;
    const host = ingestHostKey(url);
    if (!host) continue;
    // One chip per host (multiple listings sharing a parent site → first name wins)
    if (seenHosts.has(host)) continue;
    seenHosts.add(host);

    const weak = isWeakScrapeHost(url);
    const isGroup = String(biz.type || "").toLowerCase() === "group";
    const notes = [
      resolved.source === "fallback"
        ? "Website filled from venue link map (missing on directory card)"
        : weak
          ? "Social / link-in-bio URL - low structured-data yield"
          : "Auto from directory website",
      isGroup ? "GROUP: Portland-metro events only (drop other cities)" : null,
    ]
      .filter(Boolean)
      .join(" · ");

    out.push({
      id: `directory-${biz.id}`,
      label: biz.name || host,
      url,
      tier: "directory",
      format: weak ? "unknown" : "html",
      businessId: biz.id,
      businessType: biz.type ?? null,
      caution: weak || resolved.source === "fallback",
      portlandOnly: isGroup || undefined,
      notes,
    });
  }

  return out;
}

/**
 * Curated registry + live directory websites.
 * Directory entries whose host already exists in curated stay as curated only
 * (keeps specialized Tribe/Squarespace URLs preferred).
 */
export function mergeIngestSources(
  curated: IngestSource[] = INGEST_SOURCES,
  directory: IngestSource[] = [],
): IngestSource[] {
  const curatedHosts = new Set<string>();
  for (const s of curated) {
    const h = ingestHostKey(s.url);
    if (h) curatedHosts.add(h);
  }

  const dirOnly = directory.filter(s => {
    const h = ingestHostKey(s.url);
    return h && !curatedHosts.has(h);
  });

  return [...curated, ...dirOnly];
}

/**
 * Candidate event-page URLs derived from a homepage (used by server preview expand).
 * Homepage is always first.
 */
/** Platforms where /events expansion is a city-wide dump, not this listing's calendar. */
const NO_PATH_EXPAND_HOSTS = [
  "eventbrite.com",
  "eventbrite.de",
  "eventbrite.co.uk",
  "eventbrite.ca",
  "eventbrite.com.au",
  "tixr.com",
  "partiful.com",
  "bandsintown.com",
  "ra.co",
  "dice.fm",
  "ticketmaster.com",
  "etix.com",
];

function isNoPathExpandHost(url: string): boolean {
  const host = ingestHostKey(url);
  if (!host) return true;
  return NO_PATH_EXPAND_HOSTS.some(h => host === h || host.endsWith(`.${h}`));
}

export function expandWebsiteScrapeCandidates(website: string): string[] {
  const base = normalizeIngestWebsite(website);
  if (!base) return [];
  if (isWeakScrapeHost(base)) return [base];
  // Eventbrite/Tixr/etc.: never expand to /events - that becomes a local dump
  // and discovery used to "win" on event count (Stag → /d/local/events/).
  if (isNoPathExpandHost(base)) return [base];

  let origin: string;
  try {
    origin = new URL(base).origin;
  } catch {
    return [base];
  }

  const candidates = [
    base,
    `${origin}/events`,
    `${origin}/events/`,
    `${origin}/events?format=json`,
    `${origin}/calendar`,
    `${origin}/calendar/`,
    `${origin}/upcoming-events`,
    `${origin}/wp-json/tribe/events/v1/events`,
  ];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    const key = c.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
