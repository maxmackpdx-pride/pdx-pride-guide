import { buildGoogleAnalyticsHead } from "./gaSnippet";
import { storage } from "./storage";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { eventUrl } from "@shared/eventSlug";
import { placeUrl } from "@shared/placeSlug";
import { expandMultiDayEvents } from "@shared/multiDayEvents";
import type { Event } from "@shared/schema";
import { resolveDirectoryLogo } from "@shared/directoryLogos";
import { defaultShareCardUrl, shareCardKeyForPath, shareCardUrl } from "@shared/shareCards";

const SITE_URL = (process.env.SITE_URL || "https://www.zaylist.com").replace(/\/$/, "");

type SeoEvent = {
  id: number;
  title: string;
  description?: string | null;
  venueName?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  dayOfWeek?: string | null;
  admission?: string | null;
  ticketUrl?: string | null;
  posterImageUrl?: string | null;
};

function pacificIso(date?: string | null) {
  if (!date) return undefined;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(date)) return date;
  return `${date}-07:00`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Decode common entities before re-escaping into meta/title tags. */
function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'");
}

export function getLiveEventsForSeo(): SeoEvent[] {
  return expandMultiDayEvents(storage.getEvents({ status: "LIVE" }))
    .map(evt => ({
      id: evt.id,
      title: evt.title,
      description: evt.description,
      venueName: evt.venueName,
      address: evt.address,
      neighborhood: evt.neighborhood,
      dateStart: evt.dateStart,
      dateEnd: evt.dateEnd,
      dayOfWeek: evt.dayOfWeek,
      admission: evt.admission,
      ticketUrl: evt.ticketUrl,
      posterImageUrl: evt.posterImageUrl,
    }))
    .sort((a, b) => String(a.dateStart).localeCompare(String(b.dateStart)));
}

export function buildEventsJsonLd(events: SeoEvent[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Portland Pride 2026 Events | Zaylist",
    description: "Community-run directory of Portland Pride Week and year-round queer events.",
    numberOfItems: events.length,
    itemListElement: events.map((evt, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: evt.title,
        description: evt.description || undefined,
        startDate: pacificIso(evt.dateStart),
        endDate: pacificIso(evt.dateEnd),
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: evt.venueName || undefined,
          address: evt.address || undefined,
        },
        offers: evt.admission
          ? { "@type": "Offer", price: evt.admission === "FREE" ? "0" : undefined, priceCurrency: "USD" }
          : undefined,
        url: eventUrl(evt.id, evt.title, SITE_URL),
        image: absoluteAssetUrl(resolveEventPosterUrl(evt.id, evt.posterImageUrl, evt.dayOfWeek)),
      },
    })),
  };
}

export function buildSeoHeadExtras(eventCount: number) {
  return [
    `<link rel="alternate" type="application/json" href="${SITE_URL}/api/events" title="Zaylist live events JSON" />`,
    `<link rel="alternate" type="text/plain" href="${SITE_URL}/llms.txt" title="Zaylist events for AI crawlers" />`,
    `<meta name="zaylist:event-count" content="${eventCount}" />`,
  ].join("\n    ");
}

function formatEventLine(evt: SeoEvent) {
  const when = [evt.dateStart, evt.dateEnd].filter(Boolean).join(" – ");
  const where = [evt.venueName, evt.neighborhood].filter(Boolean).join(", ");
  return {
    when,
    where,
    html: `<li><strong>${escapeHtml(evt.title)}</strong> · ${escapeHtml(when)}${where ? ` @ ${escapeHtml(where)}` : ""}${evt.admission ? ` (${escapeHtml(evt.admission)})` : ""}</li>`,
  };
}

// Inline visually-hidden style so the crawler feed never paints before the app
// bundle removes it - a stylesheet class would still flash while CSS loads.
const CRAWLER_FEED_HIDDEN_STYLE =
  "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";

export function buildCrawlerEventDirectory(events: SeoEvent[]) {
  if (events.length === 0) {
    return `<section id="pdx-pride-event-directory" data-crawler-feed="true" aria-label="Portland Pride 2026 events" style="${CRAWLER_FEED_HIDDEN_STYLE}"><p>No live events are listed yet. Visit ${SITE_URL}/api/events for the JSON feed or ${SITE_URL}/llms.txt for a plain-text listing.</p></section>`;
  }

  const items = events.map(evt => formatEventLine(evt).html).join("\n      ");

  return `<section id="pdx-pride-event-directory" data-crawler-feed="true" aria-label="Portland Pride 2026 events" style="${CRAWLER_FEED_HIDDEN_STYLE}">
      <h1>Zaylist | Portland Pride 2026 Events</h1>
      <p>${events.length} live events listed for Portland Pride Week and summer 2026. Machine-readable feeds: <a href="${SITE_URL}/api/events">${SITE_URL}/api/events</a> · <a href="${SITE_URL}/llms.txt">${SITE_URL}/llms.txt</a></p>
      <ul>
      ${items}
      </ul>
    </section>`;
}

export function buildNoscriptEventDirectory(events: SeoEvent[]) {
  if (events.length === 0) {
    return `<noscript><p>Enable JavaScript for the full Zaylist experience, or visit <a href="${SITE_URL}/llms.txt">${SITE_URL}/llms.txt</a> for event listings.</p></noscript>`;
  }

  const items = events.map(evt => formatEventLine(evt).html).join("\n      ");

  return `<noscript>
    <section aria-label="Portland Pride 2026 events" style="max-width:960px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;color:#f5f5f0;background:#0a0a0a">
      <h1>Zaylist | Portland Pride 2026 Events</h1>
      <p>${events.length} live events listed for Portland Pride Week and summer 2026. Full JSON API: <a href="${SITE_URL}/api/events">${SITE_URL}/api/events</a></p>
      <ul>
      ${items}
      </ul>
    </section>
  </noscript>`;
}

export function buildLlmsTxt(events: SeoEvent[]) {
  const lines = [
    "# Zaylist",
    "",
    "> Portland's Pride calendar, kept by the people who actually go.",
    "",
    `- Website: ${SITE_URL}`,
    `- Events page: ${SITE_URL}/events`,
    `- Live events JSON API: ${SITE_URL}/api/events`,
    `- Event count: ${events.length}`,
    "",
    "## Portland Pride 2026: Live events",
    "",
  ];

  for (const evt of events) {
    const when = [evt.dateStart, evt.dateEnd].filter(Boolean).join(" – ");
    const where = [evt.venueName, evt.neighborhood, evt.address].filter(Boolean).join(", ");
    lines.push(`### ${evt.title}`);
    lines.push(`- When: ${when || "TBA"}`);
    if (where) lines.push(`- Where: ${where}`);
    if (evt.admission) lines.push(`- Admission: ${evt.admission}`);
    lines.push(`- URL: ${eventUrl(evt.id, evt.title, SITE_URL)}`);
    if (evt.description) lines.push(`- ${evt.description.replace(/\s+/g, " ").trim()}`);
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

export function buildRobotsTxt() {
  return `User-agent: *
Allow: /
Allow: /api/events
Allow: /llms.txt
Disallow: /admin
Disallow: /dashboard
Disallow: /inbox
Disallow: /api/admin

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

export function buildSitemapXml(events: SeoEvent[]) {
  const staticPaths = [
    "/",
    "/events",
    "/schedule",
    "/directory",
    "/gifting",
    "/pride-work",
    "/spotted",
    "/hausing",
    "/about",
    "/contact",
    "/sponsors",
    "/access",
    "/nude-beaches",
    "/resume",
    "/legal",
    "/submit",
  ];
  const staticUrls = staticPaths
    .map(path => `  <url><loc>${SITE_URL}${path === "/" ? "/" : path}</loc><changefreq>daily</changefreq><priority>${path === "/" ? "1.0" : "0.8"}</priority></url>`)
    .join("\n");
  // Multi-day expand can emit the same event id once per day; sitemap wants one loc per event.
  const seenEventIds = new Set<number>();
  const uniqueEvents: SeoEvent[] = [];
  for (const evt of events) {
    if (seenEventIds.has(evt.id)) continue;
    seenEventIds.add(evt.id);
    uniqueEvents.push(evt);
  }
  const eventUrls = uniqueEvents
    .map(evt => `  <url><loc>${eventUrl(evt.id, evt.title, SITE_URL)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${eventUrls}
</urlset>
`;
}

export function buildCanonicalUrl(requestPath: string) {
  const path = (requestPath.split("?")[0]?.split("#")[0] || "/").trim() || "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? `${SITE_URL}/` : `${SITE_URL}${normalized}`;
}

const ROUTE_SEO: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Zaylist | Queer Portland, all in one place",
    description: "Portland's queer community hub — events and nightlife, housing and roommates, gigs, free stuff, missed connections, and a directory of queer-owned spots. All year round.",
  },
  "/events": {
    title: "Portland Queer Events | Zaylist",
    description: "Every Portland queer event in one place. Find the party, back the spaces that host it, all year round.",
  },
  "/about": {
    title: "About Zaylist | Portland's Queer Events Guide",
    description: "A community-run guide to Portland's queer events, all year. Built by one person for the scene, not a sponsor.",
  },
  "/resume": {
    title: "Tucker Max Resume | Zaylist",
    description: "Sales and operations leader with 12+ years in big tech and EV brands, now producing live events and building community platforms in Portland.",
  },
  "/contact": {
    title: "Contact | Zaylist",
    description: "One inbox, one guy. Reach Zaylist about listings, privacy, or help.",
  },
  "/sponsors": {
    title: "Sponsors | Zaylist",
    description: "Local businesses can help keep browsing free. Labeled support and ads — never pay-to-rank.",
  },
  "/access": {
    title: "Access & Safety | Zaylist",
    description: "What Zaylist listings cover, what we can't promise, and how to take care of each other when you go out.",
  },
  "/legal": {
    title: "Legal | Zaylist",
    description: "Terms of use, privacy policy, and community guidelines for Zaylist.",
  },
  "/gifting": {
    title: "Gift with Pride | Zaylist",
    description: "Free queer gifting board for Portland. Post gifts and in-search-of requests across PDX.",
  },
  "/pride-work": {
    title: "Gig Werk: Gigs & Jobs | Zaylist",
    description: "Portland queer gig board and work listings. Post a gig or find work in PDX.",
  },
  "/spotted": {
    title: "Missed Connections | Zaylist",
    description: "Missed connections from Portland's queer scene. Reconnect with someone you spotted out.",
  },
  "/submit": {
    title: "Submit an Event | Zaylist",
    description: "Submit or claim a Portland queer event listing on the community-run Zaylist.",
  },
  "/inbox": {
    title: "Inbox | Zaylist",
    description: "Private messages from missed connections, Gig Werk, event hosts, and check-ins on Zaylist.",
  },
  "/dashboard": {
    title: "Dashboard | Zaylist",
    description: "Your Zaylist profile, submissions, gigs, gifting, and event check-ins.",
  },
  "/directory": {
    title: "Queer Portland Directory | Zaylist",
    description: "Queer-owned and queer-friendly bars, restaurants, cafes, venues, and services in Portland.",
  },
  "/schedule": {
    title: "Portland Queer Events Schedule | Zaylist",
    description: "Your Portland queer event schedule. Filter by day, save favorites, and plan your week.",
  },
  "/nude-beaches": {
    title: "Nude Beaches near Portland | Zaylist",
    description: "River Brats guide to nude and clothing-optional beaches near Portland — local intel, not corporate maps.",
  },
  "/gigs": {
    title: "Gig Werk: Gigs & Jobs | Zaylist",
    description: "Portland queer gig board and work listings. Post a gig or find work in PDX.",
  },
  "/hausing": {
    title: "HAÜSING · Housing board | Zaylist",
    description:
      "Rooms, roommates, and people building a household together in queer Portland. A community board, not a listings site.",
  },
};

function parseEventIdFromPath(requestPath: string): number | null {
  const path = (requestPath.split("?")[0] || "/").trim();
  const match = path.match(/^\/events\/(\d+)(?:\/[^/]*)?$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function parsePlaceIdFromPath(requestPath: string): number | null {
  const path = (requestPath.split("?")[0] || "/").trim();
  const match = path.match(/^\/directory\/(\d+)(?:\/[^/]*)?$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function parseProfileUsernameFromPath(requestPath: string): string | null {
  const path = (requestPath.split("?")[0] || "/").trim();
  const match = path.match(/^\/u\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]).replace(/^@/, "").trim() || null;
  } catch {
    return match[1].replace(/^@/, "").trim() || null;
  }
}

function absoluteAssetUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return defaultShareCardUrl();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function truncateText(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function buildSingleEventJsonLd(evt: Event) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evt.title,
    description: evt.description || undefined,
    startDate: pacificIso(evt.dateStart),
    endDate: pacificIso(evt.dateEnd),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: evt.venueName || undefined,
      address: evt.address || undefined,
    },
    offers: evt.admission
      ? { "@type": "Offer", price: evt.admission === "FREE" ? "0" : undefined, priceCurrency: "USD" }
      : undefined,
    url: eventUrl(evt.id, evt.title, SITE_URL),
    image: absoluteAssetUrl(resolveEventPosterUrl(evt.id, evt.posterImageUrl, evt.dayOfWeek)),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zaylist",
    alternateName: ["Portland Zaylist", "PDX Pride 2026"],
    url: SITE_URL,
    description: "Community-run Portland Pride 2026 event directory for PDX.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/events?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "When is Portland Pride 2026?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Portland Pride Week 2026 runs July 13–19, 2026 (Monday through Sunday). Zaylist lists events across the full week and related summer listings.",
        },
      },
      {
        "@type": "Question",
        name: "Where can I find Portland Pride 2026 events?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Browse all live Portland Pride and PDX Pride events at ${SITE_URL}/events. Filter by day, neighborhood, and type, or open any event page for details and tickets.`,
        },
      },
      {
        "@type": "Question",
        name: "What is Zaylist?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Zaylist is a free, community-run directory of Portland Pride 2026 events, queer parties, festivals, and year-round PDX listings, independent from corporate Pride apps.",
        },
      },
      {
        "@type": "Question",
        name: "How do I add my event to the Portland Zaylist?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Promoters can submit a new event or claim an existing listing at ${SITE_URL}/submit after creating an account.`,
        },
      },
    ],
  };
}

function replaceTitle(html: string, title: string) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

function replaceMeta(html: string, attr: "name" | "property", key: string, content: string) {
  const pattern = new RegExp(`<meta ${attr}="${key}" content="[^"]*" */?>`, "i");
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function applySocialMeta(
  html: string,
  opts: {
    title: string;
    description: string;
    url: string;
    image: string;
    imageAlt: string;
    type?: string;
    imageWidth?: number;
    imageHeight?: number;
    /** When set, overrides shell default (index.html hardcodes image/jpeg for og-preview.jpg). */
    imageType?: string;
  },
) {
  let out = replaceTitle(html, opts.title);
  out = replaceMeta(out, "name", "description", opts.description);
  out = replaceMeta(out, "property", "og:title", opts.title);
  out = replaceMeta(out, "property", "og:description", opts.description);
  out = replaceMeta(out, "property", "og:url", opts.url);
  out = replaceMeta(out, "property", "og:image", opts.image);
  out = replaceMeta(out, "property", "og:image:secure_url", opts.image);
  if (opts.imageType) out = replaceMeta(out, "property", "og:image:type", opts.imageType);
  if (opts.imageWidth) out = replaceMeta(out, "property", "og:image:width", String(opts.imageWidth));
  if (opts.imageHeight) out = replaceMeta(out, "property", "og:image:height", String(opts.imageHeight));
  out = replaceMeta(out, "property", "og:image:alt", opts.imageAlt);
  out = replaceMeta(out, "property", "og:type", opts.type || "website");
  out = replaceMeta(out, "property", "og:site_name", "Zaylist");
  out = replaceMeta(out, "name", "twitter:card", "summary_large_image");
  out = replaceMeta(out, "name", "twitter:title", opts.title);
  out = replaceMeta(out, "name", "twitter:description", opts.description);
  out = replaceMeta(out, "name", "twitter:image", opts.image);
  out = replaceMeta(out, "name", "twitter:image:alt", opts.imageAlt);
  return out;
}

export function injectSeoIntoHtml(html: string, requestPath = "/") {
  const events = getLiveEventsForSeo();
  const canonical = buildCanonicalUrl(requestPath);
  const pathKey = (requestPath.split("?")[0] || "/").replace(/\/$/, "") || "/";
  const eventId = parseEventIdFromPath(requestPath);
  const dbEvent = eventId != null ? storage.getEvent(eventId) : null;
  const liveEvent = dbEvent?.status === "LIVE" ? dbEvent : null;
  const placeId = parsePlaceIdFromPath(requestPath);
  const place = placeId != null ? storage.getBusiness(placeId) : null;
  const livePlace = place && place.active !== false ? place : null;
  const profileUsername = parseProfileUsernameFromPath(requestPath);
  const profileUser = profileUsername ? storage.getUserByUsername(profileUsername) : null;
  const liveProfile =
    profileUser && String(profileUser.status || "").toLowerCase() === "active" ? profileUser : null;

  // Directory place paths map to /directory SEO base when no place id
  const routeKey =
    pathKey.startsWith("/directory/") && !livePlace
      ? "/directory"
      : pathKey.startsWith("/directory/")
        ? "/directory"
        : pathKey.startsWith("/u/")
          ? "/dashboard"
          : pathKey.startsWith("/hausing")
            ? "/hausing"
            : pathKey;
  const routeSeo = ROUTE_SEO[routeKey] || ROUTE_SEO["/"];

  const pageTitle = liveEvent
    ? `${liveEvent.title} | Portland Queer Events | Zaylist`
    : livePlace
      ? `${livePlace.name} | Queer Portland Directory | Zaylist`
      : liveProfile
        ? `${liveProfile.displayName || liveProfile.username} (@${liveProfile.username}) | Zaylist`
        : routeSeo.title;
  const pageDescription = liveEvent
    ? truncateText(
        `${liveEvent.venueName || "Portland"}${liveEvent.neighborhood ? ` · ${liveEvent.neighborhood}` : ""}. ${liveEvent.description || ""}`,
        160,
      )
    : livePlace
      ? truncateText(
          [livePlace.neighborhood, livePlace.type, livePlace.description].filter(Boolean).join(" · ") ||
            `${livePlace.name} on Zaylist.`,
          160,
        )
      : liveProfile
        ? truncateText(
            liveProfile.bio
              || `${liveProfile.displayName || liveProfile.username} on Zaylist - Portland queer community member.`,
            160,
          )
        : routeSeo.description;
  const pageUrl = liveEvent
    ? eventUrl(liveEvent.id, liveEvent.title, SITE_URL)
    : livePlace
      ? placeUrl(livePlace.id, livePlace.name, SITE_URL)
      : liveProfile
        ? `${SITE_URL}/u/${encodeURIComponent(liveProfile.username)}`
        : canonical;
  const placeLogo = livePlace
    ? resolveDirectoryLogo(livePlace.name, livePlace.imageUrl)
    : null;
  // Branded 1200×630 cards: per-entity dynamic OG, else static board share art, else home fallback.
  const boardShareKey =
    !liveEvent && !livePlace && !liveProfile ? shareCardKeyForPath(pathKey) : null;
  const pageImage = liveEvent
    ? `${SITE_URL}/api/og/event/${liveEvent.id}`
    : livePlace
      ? `${SITE_URL}/api/og/place/${livePlace.id}`
      : liveProfile
        // v= query busts crawler caches after OG renderer fixes (remote Google avatars, etc.)
        ? `${SITE_URL}/api/og/profile/${encodeURIComponent(liveProfile.username)}?v=2`
        : boardShareKey
          ? shareCardUrl(boardShareKey)
          : defaultShareCardUrl();
  const pageImageIsCard = !!(liveEvent || livePlace || liveProfile || boardShareKey);

  const jsonLdBlocks = [
    buildWebSiteJsonLd(),
    buildFaqJsonLd(),
    liveEvent ? buildSingleEventJsonLd(liveEvent) : buildEventsJsonLd(events),
    livePlace
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: livePlace.name,
          description: livePlace.description || undefined,
          address: livePlace.address || undefined,
          url: placeUrl(livePlace.id, livePlace.name, SITE_URL),
          image: absoluteAssetUrl(placeLogo),
        }
      : null,
  ].filter(Boolean);
  const jsonLdScripts = jsonLdBlocks.map(block => `<script type="application/ld+json">${JSON.stringify(block)}</script>`).join("\n    ");

  const headExtras = [
    `<link rel="canonical" href="${pageUrl}" />`,
    buildSeoHeadExtras(events.length),
    process.env.GOOGLE_SITE_VERIFICATION
      ? `<meta name="google-site-verification" content="${escapeHtml(process.env.GOOGLE_SITE_VERIFICATION)}" />`
      : "",
    process.env.BING_SITE_VERIFICATION
      ? `<meta name="msvalidate.01" content="${escapeHtml(process.env.BING_SITE_VERIFICATION)}" />`
      : "",
    buildGoogleAnalyticsHead(),
  ].filter(Boolean).join("\n    ");

  const crawlerDirectory = buildCrawlerEventDirectory(events);
  const noscript = buildNoscriptEventDirectory(events);

  // og:type: profile only for member pages; events/places are article; generic is website.
  const ogType = liveProfile ? "profile" : liveEvent || livePlace ? "article" : "website";
  let out = applySocialMeta(html, {
    title: decodeHtmlEntities(pageTitle),
    description: decodeHtmlEntities(pageDescription),
    url: pageUrl,
    image: pageImage,
    imageAlt: decodeHtmlEntities(
      liveEvent
        ? liveEvent.title
        : livePlace
          ? livePlace.name
          : liveProfile
            ? `${liveProfile.displayName || liveProfile.username} on Zaylist`
            : "Zaylist | Portland Pride Week: Events, Gigs, Community, Directory",
    ),
    type: ogType,
    // Board share cards + dynamic OG are PNG; legacy jpeg only if something else sneaks in
    imageType: pageImageIsCard || pageImage.includes("/og/") ? "image/png" : "image/jpeg",
    imageWidth: 1200,
    imageHeight: 630,
  });

  if (!out.includes("zaylist:event-count")) {
    out = out.replace("</head>", `    ${headExtras}\n  </head>`);
  }
  if (!out.includes("pdx-pride-event-directory")) {
    out = out.replace(
      '<div id="root"></div>',
      `${crawlerDirectory}\n    <div id="root"></div>`,
    );
    out = out.replace("</body>", `    ${jsonLdScripts}\n    ${noscript}\n  </body>`);
  }
  return out;
}