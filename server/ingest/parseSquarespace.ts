import type { IngestEventDraft } from "./types";
import { dayOfWeekFromStart, defaultEndFromStart, toPacificWallClock } from "./dates";
import { pickBestImageFromUnknown, preferFullQualityImageUrl } from "./posterQuality";

/**
 * Squarespace collection JSON (`?format=json` or full collection payload).
 */
export function parseSquarespaceJson(raw: string, sourceUrl: string | null = null): IngestEventDraft[] {
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }

  const items: any[] = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.upcoming)
      ? data.upcoming
      : Array.isArray(data)
        ? data
        : [];

  if (!items.length) return [];

  const drafts: IngestEventDraft[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const title = String(item.title || item.headline || "").trim();
    if (!title) continue;

    const warnings: string[] = [];
    let dateStart: string | null = null;
    let dateEnd: string | null = null;

    // SQ often uses epoch ms
    if (typeof item.startDate === "number") {
      dateStart = toPacificWallClock(new Date(item.startDate));
    } else if (item.startDate) {
      dateStart = toPacificWallClock(String(item.startDate));
    } else if (item.addedOn) {
      dateStart = toPacificWallClock(String(item.addedOn));
      warnings.push("No startDate — used addedOn");
    }

    if (typeof item.endDate === "number") {
      dateEnd = toPacificWallClock(new Date(item.endDate));
    } else if (item.endDate) {
      dateEnd = toPacificWallClock(String(item.endDate));
    }

    if (!dateStart) continue;
    if (!dateEnd) {
      dateEnd = defaultEndFromStart(dateStart);
      warnings.push("No endDate — defaulted +3h");
    }

    const loc = item.location || {};
    const venueName =
      String(loc.addressTitle || loc.locationName || loc.mapTitle || item.locationName || "").trim() ||
      "TBA";
    const addressParts = [
      loc.addressLine1,
      loc.addressLine2,
      loc.addressCountry ? null : loc.addressRegion,
      [loc.addressLocality, loc.addressRegion].filter(Boolean).join(", "),
    ].filter(Boolean);
    const address = addressParts.length
      ? addressParts.join(", ")
      : loc.addressLine1
        ? String(loc.addressLine1)
        : null;

    let description = "";
    if (typeof item.body === "string") {
      description = item.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    } else if (typeof item.excerpt === "string") {
      description = item.excerpt.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    if (!description) {
      description = `${title} at ${venueName}.`;
      warnings.push("No description — stub");
    }

    const path = item.fullUrl || item.url || item.websiteUrl || "";
    let eventPageUrl: string | null = null;
    if (typeof path === "string" && path.startsWith("http")) eventPageUrl = path;
    else if (typeof path === "string" && path.startsWith("/") && sourceUrl) {
      try {
        eventPageUrl = new URL(path, sourceUrl).toString();
      } catch {
        eventPageUrl = null;
      }
    }
    const ticketUrl = eventPageUrl || sourceUrl;

    // Prefer original/full asset over thumbnail — flyers must be full quality
    const poster =
      preferFullQualityImageUrl(
        pickBestImageFromUnknown(item.image) ||
          item.assetUrl ||
          item.originalSize ||
          item.systemDataVariants ||
          item.thumbnailUrl ||
          null,
      ) || null;

    const draft: IngestEventDraft = {
      title: title.slice(0, 200),
      description: description.slice(0, 8000),
      venueName: venueName.slice(0, 200),
      address: address ? String(address).slice(0, 300) : null,
      neighborhood: null,
      lat: typeof loc.mapLat === "number" ? loc.mapLat : null,
      lng: typeof loc.mapLng === "number" ? loc.mapLng : null,
      dateStart,
      dateEnd,
      dayOfWeek: dayOfWeekFromStart(dateStart),
      ageRequirement: "ALL_AGES",
      eventTypes: "[]",
      admission: "FREE",
      ticketUrl: ticketUrl ? ticketUrl.slice(0, 500) : null,
      eventPageUrl: eventPageUrl ? eventPageUrl.slice(0, 500) : null,
      isPublic: true,
      isPrivate: false,
      isHouseParty: false,
      isSexPositive: false,
      nudityOk: false,
      posterImageUrl: poster ? String(poster).slice(0, 800) : null,
      sourceUrl,
      parseSource: "squarespace",
      warnings,
    };

    const key = `${draft.title}|${draft.dateStart}|${draft.venueName}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    drafts.push(draft);
  }

  return drafts;
}

export function looksLikeSquarespaceJson(raw: string): boolean {
  if (!raw.trim().startsWith("{") && !raw.trim().startsWith("[")) return false;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data?.items) || Array.isArray(data?.upcoming)) return true;
    if (data?.collection && Array.isArray(data?.items)) return true;
    // Pride org / collection pages sometimes nest differently
    if (data?.website && Array.isArray(data?.items)) return true;
    return false;
  } catch {
    return false;
  }
}
