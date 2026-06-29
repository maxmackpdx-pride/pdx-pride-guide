import { storage } from "./storage";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { expandMultiDayEvents } from "@shared/multiDayEvents";

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
        url: `${SITE_URL}/#/events`,
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
    `- Events page: ${SITE_URL}/#/events`,
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

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

export function buildSitemapXml(events: SeoEvent[]) {
  const staticPaths = ["/", "/#/events", "/#/gifting", "/#/pride-work", "/#/spotted", "/#/about", "/#/submit"];
  const urls = staticPaths
    .map(path => `  <url><loc>${SITE_URL}${path}</loc><changefreq>daily</changefreq><priority>${path === "/" ? "1.0" : "0.8"}</priority></url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function injectSeoIntoHtml(html: string) {
  const events = getLiveEventsForSeo();
  const jsonLd = JSON.stringify(buildEventsJsonLd(events));
  const headExtras = buildSeoHeadExtras(events.length);
  const crawlerDirectory = buildCrawlerEventDirectory(events);
  const noscript = buildNoscriptEventDirectory(events);

  let out = html;
  if (!out.includes("pdx-pride-guide:event-count")) {
    out = out.replace("</head>", `    ${headExtras}\n  </head>`);
  }
  if (!out.includes("pdx-pride-event-directory")) {
    out = out.replace(
      '<div id="root"></div>',
      `${crawlerDirectory}\n    <div id="root"></div>`,
    );
    out = out.replace(
      "</body>",
      `    <script type="application/ld+json">${jsonLd}</script>\n    ${noscript}\n  </body>`,
    );
  }
  return out;
}