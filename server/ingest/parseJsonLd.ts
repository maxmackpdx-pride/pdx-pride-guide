import type { IngestEventDraft } from "./types";
import { dayOfWeekFromStart, defaultEndFromStart, toPacificWallClock } from "./dates";
import { pickBestImageFromUnknown } from "./posterQuality";

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.name === "string") return o.name.trim();
    if (typeof o["@value"] === "string") return String(o["@value"]).trim();
    if (typeof o.text === "string") return o.text.trim();
  }
  return "";
}

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) != null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Some sites emit trailing commas or multi-root — try a soft fix.
      try {
        blocks.push(JSON.parse(raw.replace(/,\s*([}\]])/g, "$1")));
      } catch {
        /* skip */
      }
    }
  }
  return blocks;
}

function isEventType(type: unknown): boolean {
  const types = asArray(type).map(t => String(t).toLowerCase());
  return types.some(t =>
    t === "event" ||
    t.endsWith("/event") ||
    t === "musicEvent".toLowerCase() ||
    t === "socialevent" ||
    t === "danceevent" ||
    t === "festival" ||
    t === "theaterEvent".toLowerCase() ||
    t === "sportsEvent".toLowerCase() ||
    t === "screeningEvent".toLowerCase() ||
    t === "comedyEvent".toLowerCase() ||
    t === "foodEvent".toLowerCase() ||
    t === "exhibitionEvent".toLowerCase() ||
    t === "businessEvent".toLowerCase() ||
    t === "educationEvent".toLowerCase() ||
    t === "literaryEvent".toLowerCase() ||
    t === "visualArtsEvent".toLowerCase(),
  );
}

function collectNodes(root: unknown, out: unknown[] = []): unknown[] {
  if (root == null) return out;
  if (Array.isArray(root)) {
    for (const item of root) collectNodes(item, out);
    return out;
  }
  if (typeof root !== "object") return out;
  const obj = root as Record<string, unknown>;
  out.push(obj);
  if (obj["@graph"]) collectNodes(obj["@graph"], out);
  if (obj.mainEntity) collectNodes(obj.mainEntity, out);
  if (obj.itemListElement) {
    for (const el of asArray(obj.itemListElement)) {
      if (el && typeof el === "object" && "item" in (el as object)) {
        collectNodes((el as { item: unknown }).item, out);
      } else {
        collectNodes(el, out);
      }
    }
  }
  return out;
}

function placeFrom(node: Record<string, unknown>): {
  venueName: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
} {
  const loc = node.location;
  if (!loc) return { venueName: "TBA", address: null, lat: null, lng: null };

  if (typeof loc === "string") {
    return { venueName: loc.trim() || "TBA", address: null, lat: null, lng: null };
  }

  const places = asArray(loc).filter(p => p && typeof p === "object") as Array<Record<string, unknown>>;
  const place = places[0] || {};
  const venueName = textOf(place.name) || textOf(place) || "TBA";

  let address: string | null = null;
  const addr = place.address;
  if (typeof addr === "string") {
    address = addr.trim() || null;
  } else if (addr && typeof addr === "object") {
    const a = addr as Record<string, unknown>;
    const parts = [
      textOf(a.streetAddress),
      textOf(a.addressLocality),
      textOf(a.addressRegion),
      textOf(a.postalCode),
    ].filter(Boolean);
    address = parts.length ? parts.join(", ") : null;
  }

  let lat: number | null = null;
  let lng: number | null = null;
  const geo = place.geo;
  if (geo && typeof geo === "object") {
    const g = geo as Record<string, unknown>;
    const la = Number(g.latitude);
    const ln = Number(g.longitude);
    if (Number.isFinite(la) && Number.isFinite(ln)) {
      lat = la;
      lng = ln;
    }
  }

  return { venueName: venueName || "TBA", address, lat, lng };
}

function imageUrl(node: Record<string, unknown>): string | null {
  // Prefer largest ImageObject / contentUrl over thumbnails
  return (
    pickBestImageFromUnknown(node.image) ||
    pickBestImageFromUnknown(node.photo) ||
    pickBestImageFromUnknown(node.thumbnailUrl) ||
    null
  );
}

function offersUrl(node: Record<string, unknown>): string | null {
  for (const offer of asArray(node.offers)) {
    if (!offer || typeof offer !== "object") continue;
    const o = offer as Record<string, unknown>;
    const u = textOf(o.url) || textOf(o);
    if (u.startsWith("http")) return u;
  }
  const u = textOf(node.url);
  return u.startsWith("http") ? u : null;
}

function admissionFrom(node: Record<string, unknown>): string {
  for (const offer of asArray(node.offers)) {
    if (!offer || typeof offer !== "object") continue;
    const o = offer as Record<string, unknown>;
    const price = o.price;
    if (price === 0 || price === "0" || String(o.priceCurrency || "").toUpperCase() === "FREE") {
      return "FREE";
    }
    if (price != null && String(price).trim() !== "") {
      // Explicit non-zero price → ticketed (don't invent FREE)
      return "TICKETED";
    }
  }
  const isAccessible = node.isAccessibleForFree;
  if (isAccessible === true || isAccessible === "true") return "FREE";
  if (isAccessible === false || isAccessible === "false") return "TICKETED";
  // No offer / free signal → unknown (never assume free)
  return "UNKNOWN";
}

function nodeToDraft(node: Record<string, unknown>, sourceUrl: string | null): IngestEventDraft | null {
  if (!isEventType(node["@type"]) && !node.startDate) return null;

  const title = textOf(node.name) || textOf(node.headline);
  if (!title) return null;

  const warnings: string[] = [];
  const dateStart = toPacificWallClock(textOf(node.startDate) || textOf(node.doorTime));
  if (!dateStart) {
    warnings.push("Missing or unparseable startDate");
    return null;
  }
  let dateEnd = toPacificWallClock(textOf(node.endDate));
  if (!dateEnd) {
    dateEnd = defaultEndFromStart(dateStart);
    warnings.push("No endDate — defaulted to start + 3 hours");
  }

  const place = placeFrom(node);
  let description = textOf(node.description);
  if (description.includes("<")) description = stripHtml(description);
  if (!description) {
    description = `${title} at ${place.venueName}.`;
    warnings.push("No description — generated stub");
  }

  const poster = imageUrl(node);
  const eventPage =
    textOf(node.url) ||
    textOf(node.mainEntityOfPage) ||
    (typeof node["@id"] === "string" && /^https?:/i.test(node["@id"]) ? node["@id"] : null);
  const offers = offersUrl(node);
  const ticketUrl = offers || eventPage || sourceUrl;
  // Prefer event page over feed/list URL for human "open listing"
  const eventPageUrl =
    eventPage && /^https?:/i.test(eventPage) && !/format=json|wp-json|\.ics/i.test(eventPage)
      ? eventPage.slice(0, 500)
      : null;

  return {
    title: title.slice(0, 200),
    description: description.slice(0, 8000),
    venueName: place.venueName.slice(0, 200) || "TBA",
    address: place.address ? place.address.slice(0, 300) : null,
    neighborhood: null,
    lat: place.lat,
    lng: place.lng,
    dateStart,
    dateEnd,
    dayOfWeek: dayOfWeekFromStart(dateStart),
    ageRequirement: "ALL_AGES",
    eventTypes: "[]",
    admission: admissionFrom(node),
    ticketUrl: ticketUrl ? ticketUrl.slice(0, 500) : null,
    eventPageUrl,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: poster ? poster.slice(0, 800) : null,
    sourceUrl,
    parseSource: "jsonld",
    warnings,
  };
}

export function parseJsonLdFromHtml(html: string, sourceUrl: string | null = null): IngestEventDraft[] {
  const blocks = extractJsonLdBlocks(html);
  const drafts: IngestEventDraft[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    for (const node of collectNodes(block)) {
      if (!node || typeof node !== "object") continue;
      const draft = nodeToDraft(node as Record<string, unknown>, sourceUrl);
      if (!draft) continue;
      const key = `${draft.title}|${draft.dateStart}|${draft.venueName}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      drafts.push(draft);
    }
  }
  return drafts;
}

/** Parse raw application/ld+json body (not wrapped in HTML). */
export function parseJsonLdDocument(raw: string, sourceUrl: string | null = null): IngestEventDraft[] {
  try {
    const data = JSON.parse(raw);
    const drafts: IngestEventDraft[] = [];
    const seen = new Set<string>();
    for (const node of collectNodes(data)) {
      if (!node || typeof node !== "object") continue;
      const draft = nodeToDraft(node as Record<string, unknown>, sourceUrl);
      if (!draft) continue;
      const key = `${draft.title}|${draft.dateStart}|${draft.venueName}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      drafts.push(draft);
    }
    return drafts;
  } catch {
    return [];
  }
}
