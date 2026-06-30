import { storage } from "./storage";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { eventUrl } from "@shared/eventSlug";
import { expandMultiDayEvents } from "@shared/multiDayEvents";
import type { Event } from "@shared/schema";

const SITE_URL = (process.env.SITE_URL || "https://www.prideguidepdx.com").replace(/\/$/, "");

type SeoEvent = {
  id: number;
  title: string;
  description?: string | null;
  venueName?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  admission?: string | null;
  ticketUrl?: string | null;
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
      admission: evt.admission,
      ticketUrl: evt.ticketUrl,
    }))
    .sort((a, b) => String(a.dateStart).localeCompare(String(b.dateStart)));
}

export function buildEventsJsonLd(events: SeoEvent[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Portland Pride 2026 Events — PDX Pride Guide",
    description: "Community-run directory of Portland Pride Weekend and year-round queer events.",
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
        image: resolveEventPosterUrl(evt.id, null) || undefined,
      },
    })),
  };
}

export function buildSeoHeadExtras(eventCount: number) {
  return [
    `<link rel="alternate" type="application/json" href="${SITE_URL}/api/events" title="PDX Pride Guide live events JSON" />`,
    `<link rel="alternate" type="text/plain" href="${SITE_URL}/llms.txt" title="PDX Pride Guide events for AI crawlers" />`,
    `<meta name="pdx-pride-guide:event-count" content="${eventCount}" />`,
  ].join("\n    ");
}

function formatEventLine(evt: SeoEvent) {
  const when = [evt.dateStart, evt.dateEnd].filter(Boolean).join(" – ");
  const where = [evt.venueName, evt.neighborhood].filter(Boolean).join(", ");
  return {
    when,
    where,
    html: `<li><strong>${escapeHtml(evt.title)}</strong> — ${escapeHtml(when)}${where ? ` @ ${escapeHtml(where)}` : ""}${evt.admission ? ` (${escapeHtml(evt.admission)})` : ""}</li>`,
  };
}

export function buildCrawlerEventDirectory(events: SeoEvent[]) {
  if (events.length === 0) {
    return `<section id="pdx-pride-event-directory" data-crawler-feed="true" aria-label="Portland Pride 2026 events"><p>No live events are listed yet. Visit ${SITE_URL}/api/events for the JSON feed or ${SITE_URL}/llms.txt for a plain-text listing.</p></section>`;
  }

  const items = events.map(evt => formatEventLine(evt).html).join("\n      ");

  return `<section id="pdx-pride-event-directory" data-crawler-feed="true" aria-label="Portland Pride 2026 events">
      <h1>PDX Pride Guide — Portland Pride 2026 Events</h1>
      <p>${events.length} live events listed for Portland Pride Weekend and summer 2026. Machine-readable feeds: <a href="${SITE_URL}/api/events">${SITE_URL}/api/events</a> · <a href="${SITE_URL}/llms.txt">${SITE_URL}/llms.txt</a></p>
      <ul>
      ${items}
      </ul>
    </section>`;
}

export function buildNoscriptEventDirectory(events: SeoEvent[]) {
  if (events.length === 0) {
    return `<noscript><p>Enable JavaScript for the full PDX Pride Guide experience, or visit <a href="${SITE_URL}/llms.txt">${SITE_URL}/llms.txt</a> for event listings.</p></noscript>`;
  }

  const items = events.map(evt => formatEventLine(evt).html).join("\n      ");

  return `<noscript>
    <section aria-label="Portland Pride 2026 events" style="max-width:960px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;color:#f5f5f0;background:#0a0a0a">
      <h1>PDX Pride Guide — Portland Pride 2026 Events</h1>
      <p>${events.length} live events listed for Portland Pride Weekend and summer 2026. Full JSON API: <a href="${SITE_URL}/api/events">${SITE_URL}/api/events</a></p>
      <ul>
      ${items}
      </ul>
    </section>
  </noscript>`;
}

export function buildLlmsTxt(events: SeoEvent[]) {
  const lines = [
    "# PDX Pride Guide",
    "",
    "> Portland's community-run Pride event directory for 2026.",
    "",
    `- Website: ${SITE_URL}`,
    `- Events page: ${SITE_URL}/events`,
    `- Live events JSON API: ${SITE_URL}/api/events`,
    `- Event count: ${events.length}`,
    "",
    "## Portland Pride 2026 — Live events",
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
  const staticPaths = ["/", "/events", "/gifting", "/pride-work", "/spotted", "/about", "/legal", "/submit"];
  const staticUrls = staticPaths
    .map(path => `  <url><loc>${SITE_URL}${path === "/" ? "/" : path}</loc><changefreq>daily</changefreq><priority>${path === "/" ? "1.0" : "0.8"}</priority></url>`)
    .join("\n");
  const eventUrls = events
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
    title: "PDX Pride Guide — Portland Pride 2026 Events",
    description: "Find Portland Pride 2026 events, support queer spaces, and build community in PDX. July 16–19 and year-round Pride listings.",
  },
  "/events": {
    title: "Portland Pride 2026 Events — PDX Pride Guide",
    description: "Browse every live Portland Pride 2026 event on the map and board. Filter PDX Pride events by day, type, and neighborhood.",
  },
  "/about": {
    title: "About PDX Pride Guide — Portland Pride 2026",
    description: "Community-run Portland Pride 2026 event directory for PDX. Built for queer Portland by submissions and local support.",
  },
  "/legal": {
    title: "Legal — PDX Pride Guide",
    description: "Terms of use, privacy policy, and community guidelines for PDX Pride Guide.",
  },
  "/gifting": {
    title: "Gift with Pride — PDX Pride Guide",
    description: "Free queer gifting board for Portland Pride 2026. Post gifts and in-search-of requests in PDX through July 26.",
  },
  "/pride-work": {
    title: "Pride Werk — Gigs & Jobs | PDX Pride Guide",
    description: "Portland Pride 2026 gig board and queer work listings. Post gigs or find Pride weekend work in PDX.",
  },
  "/spotted": {
    title: "Spotted — Missed Connections | PDX Pride Guide",
    description: "Missed connections and spotted posts from Portland Pride 2026 events. Reconnect after PDX Pride weekend.",
  },
  "/submit": {
    title: "Submit an Event — PDX Pride Guide",
    description: "Submit or claim a Portland Pride 2026 event listing on the community-run PDX Pride Guide.",
  },
  "/inbox": {
    title: "Inbox — PDX Pride Guide",
    description: "Private messages from missed connections, Pride Werk, event hosts, and check-ins on the PDX Pride Guide.",
  },
  "/dashboard": {
    title: "Dashboard — PDX Pride Guide",
    description: "Your PDX Pride Guide profile, submissions, gigs, gifting, and event check-ins.",
  },
};

function parseEventIdFromPath(requestPath: string): number | null {
  const path = (requestPath.split("?")[0] || "/").trim();
  const match = path.match(/^\/events\/(\d+)(?:\/[^/]*)?$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function absoluteAssetUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return `${SITE_URL}/og-preview.jpg`;
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
    image: absoluteAssetUrl(resolveEventPosterUrl(evt.id, evt.posterImageUrl)),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PDX Pride Guide",
    alternateName: ["Portland Pride Guide", "PDX Pride 2026"],
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
          text: "Portland Pride Weekend 2026 runs July 16–19, 2026 (Thursday through Sunday). PDX Pride Guide lists events across the full weekend and related summer listings.",
        },
      },
      {
        "@type": "Question",
        name: "Where can I find Portland Pride 2026 events?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Browse all live Portland Pride and PDX Pride events at prideguidepdx.com/events — filter by day, neighborhood, and type, or open any event page for details and tickets.",
        },
      },
      {
        "@type": "Question",
        name: "What is PDX Pride Guide?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "PDX Pride Guide is a free, community-run directory of Portland Pride 2026 events, queer parties, festivals, and year-round PDX listings — independent from corporate Pride apps.",
        },
      },
      {
        "@type": "Question",
        name: "How do I add my event to the Portland Pride Guide?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Promoters can submit a new event or claim an existing listing at prideguidepdx.com/submit after creating an account.",
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
  opts: { title: string; description: string; url: string; image: string; imageAlt: string; type?: string },
) {
  let out = replaceTitle(html, opts.title);
  out = replaceMeta(out, "name", "description", opts.description);
  out = replaceMeta(out, "property", "og:title", opts.title);
  out = replaceMeta(out, "property", "og:description", opts.description);
  out = replaceMeta(out, "property", "og:url", opts.url);
  out = replaceMeta(out, "property", "og:image", opts.image);
  out = replaceMeta(out, "property", "og:type", opts.type || "website");
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

  const routeSeo = ROUTE_SEO[pathKey] || ROUTE_SEO["/"];
  const pageTitle = liveEvent
    ? `${liveEvent.title} — Portland Pride 2026 | PDX Pride Guide`
    : routeSeo.title;
  const pageDescription = liveEvent
    ? truncateText(
        `${liveEvent.venueName || "Portland"}${liveEvent.neighborhood ? ` · ${liveEvent.neighborhood}` : ""}. ${liveEvent.description || ""}`,
        160,
      )
    : routeSeo.description;
  const pageUrl = liveEvent ? eventUrl(liveEvent.id, liveEvent.title, SITE_URL) : canonical;
  const pageImage = liveEvent
    ? absoluteAssetUrl(resolveEventPosterUrl(liveEvent.id, liveEvent.posterImageUrl))
    : `${SITE_URL}/og-preview.jpg`;

  const jsonLdBlocks = [
    buildWebSiteJsonLd(),
    buildFaqJsonLd(),
    liveEvent ? buildSingleEventJsonLd(liveEvent) : buildEventsJsonLd(events),
  ];
  const jsonLdScripts = jsonLdBlocks.map(block => `<script type="application/ld+json">${JSON.stringify(block)}</script>`).join("\n    ");

  const headExtras = [
    `<link rel="canonical" href="${canonical}" />`,
    buildSeoHeadExtras(events.length),
    process.env.GOOGLE_SITE_VERIFICATION
      ? `<meta name="google-site-verification" content="${escapeHtml(process.env.GOOGLE_SITE_VERIFICATION)}" />`
      : "",
    process.env.BING_SITE_VERIFICATION
      ? `<meta name="msvalidate.01" content="${escapeHtml(process.env.BING_SITE_VERIFICATION)}" />`
      : "",
  ].filter(Boolean).join("\n    ");

  const crawlerDirectory = buildCrawlerEventDirectory(events);
  const noscript = buildNoscriptEventDirectory(events);

  let out = applySocialMeta(html, {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    image: pageImage,
    imageAlt: liveEvent ? liveEvent.title : "PDX Pride Guide July 16-19 social preview graphic",
    type: liveEvent ? "article" : "website",
  });

  if (!out.includes("pdx-pride-guide:event-count")) {
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