import type { IngestEventDraft } from "./types";
import { dayOfWeekFromStart, defaultEndFromStart, toPacificWallClock } from "./dates";
import { pickBestImageFromUnknown, preferFullQualityImageUrl } from "./posterQuality";

/**
 * Best-effort extraction of Wix Events from embedded `warmupData` / similar JSON blobs.
 * Wix page structure changes often — treat yields as provisional.
 */
export function parseWarmupDataFromHtml(html: string, sourceUrl: string | null = null): IngestEventDraft[] {
  const blobs: string[] = [];

  // Common patterns: warmupData = {...};  or "warmupData":{...}
  const reNamed =
    /(?:warmupData|wixBiSession|__INITIAL_STATE__|renderModel)\s*[=:]\s*(\{[\s\S]*?\})\s*(?:;|<\/script>)/gi;
  let m: RegExpExecArray | null;
  while ((m = reNamed.exec(html)) != null) {
    if (m[1] && m[1].length < 2_000_000) blobs.push(m[1]);
  }

  // Also grab large JSON script tags that mention events
  const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = scriptRe.exec(html)) != null) {
    const body = m[1];
    if (body.includes("events") && body.includes("start") && body.length > 200 && body.length < 1_500_000) {
      const jsonStart = body.indexOf("{");
      const jsonEnd = body.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        blobs.push(body.slice(jsonStart, jsonEnd + 1));
      }
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
    // Soft: trailing commas
    try {
      return JSON.parse(raw.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
}

function walkEvents(root: unknown, out: any[] = [], depth = 0): any[] {
  if (root == null || depth > 12) return out;
  if (Array.isArray(root)) {
    for (const item of root) walkEvents(item, out, depth + 1);
    return out;
  }
  if (typeof root !== "object") return out;
  const o = root as Record<string, unknown>;

  const title = o.title || o.name || o.eventTitle || o.eventName;
  const scheduling = (o.scheduling && typeof o.scheduling === "object")
    ? (o.scheduling as Record<string, unknown>)
    : null;
  const dateSettings = (o.dateAndTimeSettings && typeof o.dateAndTimeSettings === "object")
    ? (o.dateAndTimeSettings as Record<string, unknown>)
    : null;
  const start =
    o.startDate || o.start || o.dateStart || o.eventStartDate
    || scheduling?.startDate || dateSettings?.startDate;
  if (title && start && typeof title === "string") {
    out.push(o);
  }

  for (const v of Object.values(o)) {
    if (v && typeof v === "object") walkEvents(v, out, depth + 1);
  }
  return out;
}

function nodeToDraft(node: Record<string, any>, sourceUrl: string | null): IngestEventDraft | null {
  const title = String(node.title || node.name || node.eventTitle || "").trim();
  if (!title) return null;

  const warnings: string[] = ["Parsed from Wix/warmup blob — verify times"];
  const startRaw =
    node.startDate ||
    node.start ||
    node.dateStart ||
    node.eventStartDate ||
    node.scheduling?.startDate ||
    node.dateAndTimeSettings?.startDate;
  const endRaw =
    node.endDate ||
    node.end ||
    node.dateEnd ||
    node.eventEndDate ||
    node.scheduling?.endDate ||
    node.dateAndTimeSettings?.endDate;

  const dateStart = toPacificWallClock(
    typeof startRaw === "object" && startRaw?.timestamp
      ? new Date(Number(startRaw.timestamp))
      : startRaw,
  );
  if (!dateStart) return null;
  let dateEnd = toPacificWallClock(
    typeof endRaw === "object" && endRaw?.timestamp
      ? new Date(Number(endRaw.timestamp))
      : endRaw,
  );
  if (!dateEnd) {
    dateEnd = defaultEndFromStart(dateStart);
    warnings.push("No end — defaulted +3h");
  }

  const loc = node.location || node.venue || node.eventLocation || {};
  const venueName = String(
    loc.name || loc.address || loc.formatted || node.locationName || "TBA",
  ).slice(0, 200);
  const address =
    typeof loc.address === "string"
      ? loc.address
      : loc.formatted || loc.addressLine || null;

  let description = String(node.description || node.about || node.summary || "").replace(/<[^>]+>/g, " ").trim();
  if (!description) description = `${title} at ${venueName}.`;

  const ticketUrl = node.eventPageUrl || node.url || node.slug
    ? (String(node.eventPageUrl || node.url || "").startsWith("http")
        ? String(node.eventPageUrl || node.url)
        : sourceUrl)
    : sourceUrl;

  return {
    title: title.slice(0, 200),
    description: description.slice(0, 8000),
    venueName: venueName || "TBA",
    address: address ? String(address).slice(0, 300) : null,
    neighborhood: null,
    lat: null,
    lng: null,
    dateStart,
    dateEnd,
    dayOfWeek: dayOfWeekFromStart(dateStart),
    ageRequirement: "ALL_AGES",
    eventTypes: "[]",
    admission: "FREE",
    ticketUrl: ticketUrl ? String(ticketUrl).slice(0, 500) : null,
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
