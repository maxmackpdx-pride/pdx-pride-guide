import type { IngestEventDraft } from "./types";
import { dayOfWeekFromStart, defaultEndFromStart, toPacificWallClock } from "./dates";
import { pickBestImageFromUnknown, preferFullQualityImageUrl } from "./posterQuality";
import { inferAdmissionFromText } from "./admissionInfer";

/**
 * Best-effort extraction of Wix Events from embedded warmup / appsWarmupData blobs.
 * Handles modern Wix Events (`scheduling.config.startDate`) used by Eagle Portland etc.
 */

function stripHtml(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseWarmupDataFromHtml(html: string, sourceUrl: string | null = null): IngestEventDraft[] {
  const blobs: string[] = [];

  // Common patterns: warmupData = {...};  or "warmupData":{...}
  const reNamed =
    /(?:warmupData|wixBiSession|__INITIAL_STATE__|renderModel|appsWarmupData)\s*[=:]\s*(\{[\s\S]*?\})\s*(?:;|<\/script>)/gi;
  let m: RegExpExecArray | null;
  while ((m = reNamed.exec(html)) != null) {
    if (m[1] && m[1].length < 2_500_000) blobs.push(m[1]);
  }

  // Large JSON script tags that mention events / Wix scheduling
  const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = scriptRe.exec(html)) != null) {
    const body = m[1];
    const looksUseful =
      (body.includes("appsWarmupData") || body.includes("warmupData") || body.includes("events")) &&
      (body.includes("startDate") || body.includes("startDateISOFormatNotUTC") || body.includes("scheduling")) &&
      body.length > 500 &&
      body.length < 2_500_000;
    if (!looksUseful) continue;
    const jsonStart = body.indexOf("{");
    const jsonEnd = body.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      blobs.push(body.slice(jsonStart, jsonEnd + 1));
    }
  }

  const drafts: IngestEventDraft[] = [];
  const seen = new Set<string>();

  for (const blob of blobs) {
    for (const node of walkEvents(safeParse(blob))) {
      const draft = nodeToDraft(node, sourceUrl);
      if (!draft) continue;
      const key = `${draft.title}|${draft.dateStart}|${draft.venueName}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      drafts.push(draft);
    }
  }

  return drafts;
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(raw.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
}

/** Pull start/end from flat or Wix nested scheduling.config */
function extractStartEnd(node: Record<string, any>): { start: unknown; end: unknown } {
  const scheduling = node.scheduling && typeof node.scheduling === "object" ? node.scheduling : null;
  const config = scheduling?.config && typeof scheduling.config === "object" ? scheduling.config : null;
  const dateSettings =
    node.dateAndTimeSettings && typeof node.dateAndTimeSettings === "object"
      ? node.dateAndTimeSettings
      : null;

  const start =
    node.startDate ||
    node.start ||
    node.dateStart ||
    node.eventStartDate ||
    config?.startDate ||
    scheduling?.startDate ||
    dateSettings?.startDate ||
    null;

  const end =
    node.endDate ||
    node.end ||
    node.dateEnd ||
    node.eventEndDate ||
    config?.endDate ||
    scheduling?.endDate ||
    dateSettings?.endDate ||
    null;

  return { start, end };
}

function walkEvents(root: unknown, out: any[] = [], depth = 0): any[] {
  if (root == null || depth > 14) return out;
  if (Array.isArray(root)) {
    for (const item of root) walkEvents(item, out, depth + 1);
    return out;
  }
  if (typeof root !== "object") return out;
  const o = root as Record<string, unknown>;

  const title = o.title || o.name || o.eventTitle || o.eventName;
  const { start } = extractStartEnd(o as any);
  // Prefer real Wix event objects (slug + scheduling) over random title widgets
  if (title && start && typeof title === "string") {
    const looksLikeEvent =
      typeof o.slug === "string" ||
      o.scheduling != null ||
      o.mainImage != null ||
      o.registration != null ||
      o.location != null;
    if (looksLikeEvent || depth <= 4) {
      out.push(o);
    }
  }

  for (const v of Object.values(o)) {
    if (v && typeof v === "object") walkEvents(v, out, depth + 1);
  }
  return out;
}

function textField(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return stripHtml(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return stripHtml(String(o.plainText || o.text || o.content || o.html || ""));
  }
  return stripHtml(String(v));
}

function nodeToDraft(node: Record<string, any>, sourceUrl: string | null): IngestEventDraft | null {
  const title = String(node.title || node.name || node.eventTitle || "").trim();
  if (!title) return null;

  // Skip Wix UI chrome mis-detected as events
  if (/^(settings|my account|notifications|my orders|my wallet)$/i.test(title)) return null;

  const warnings: string[] = ["Parsed from Wix/warmup blob - verify times"];
  const { start: startRaw, end: endRaw } = extractStartEnd(node);

  const dateStart = toPacificWallClock(
    typeof startRaw === "object" && startRaw && (startRaw as any).timestamp
      ? new Date(Number((startRaw as any).timestamp))
      : startRaw,
  );
  if (!dateStart) return null;
  let dateEnd = toPacificWallClock(
    typeof endRaw === "object" && endRaw && (endRaw as any).timestamp
      ? new Date(Number((endRaw as any).timestamp))
      : endRaw,
  );
  if (!dateEnd) {
    dateEnd = defaultEndFromStart(dateStart);
    warnings.push("No end - defaulted +3h");
  }

  const loc = node.location || node.venue || node.eventLocation || {};
  const venueName = String(
    loc.name || loc.address || loc.formatted || loc.fullAddress?.formattedAddress || node.locationName || "TBA",
  ).slice(0, 200);
  const address =
    typeof loc.address === "string"
      ? loc.address
      : loc.formatted ||
        loc.fullAddress?.formattedAddress ||
        loc.addressLine ||
        null;
  const lat =
    typeof loc.coordinates?.lat === "number"
      ? loc.coordinates.lat
      : typeof loc.fullAddress?.geocode?.latitude === "number"
        ? loc.fullAddress.geocode.latitude
        : null;
  const lng =
    typeof loc.coordinates?.lng === "number"
      ? loc.coordinates.lng
      : typeof loc.fullAddress?.geocode?.longitude === "number"
        ? loc.fullAddress.geocode.longitude
        : null;

  let description =
    textField(node.description) || textField(node.about) || textField(node.summary);
  if (!description) description = `${title} at ${venueName}.`;

  // Event page: slug on eagle / Wix event-details
  let eventPageUrl: string | null = null;
  const rawPage = String(node.eventPageUrl || node.url || "").trim();
  if (rawPage.startsWith("http") && !/format=json|wp-json|\.ics/i.test(rawPage)) {
    eventPageUrl = rawPage.slice(0, 500);
  } else if (typeof node.slug === "string" && node.slug && sourceUrl) {
    try {
      const base = new URL(sourceUrl);
      eventPageUrl = `${base.origin}/event-details/${node.slug}`.slice(0, 500);
    } catch {
      /* ignore */
    }
  }
  const ticketUrl = eventPageUrl || sourceUrl;

  // Admission: never invent FREE
  const adm = inferAdmissionFromText(title, description);
  if (adm.reason) warnings.push(adm.reason);

  return {
    title: title.slice(0, 200),
    description: description.slice(0, 8000),
    venueName: venueName || "TBA",
    address: address ? String(address).slice(0, 300) : null,
    neighborhood: null,
    lat,
    lng,
    dateStart,
    dateEnd,
    dayOfWeek: dayOfWeekFromStart(dateStart),
    ageRequirement: "ALL_AGES",
    eventTypes: "[]",
    admission: adm.admission,
    ticketUrl: ticketUrl ? String(ticketUrl).slice(0, 500) : null,
    eventPageUrl,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl:
      preferFullQualityImageUrl(
        pickBestImageFromUnknown(node.mainImage) ||
          pickBestImageFromUnknown(node.coverImage) ||
          node.imageUrl ||
          node.coverImageUrl ||
          null,
      ) || null,
    sourceUrl,
    parseSource: "wix",
    warnings,
  };
}
