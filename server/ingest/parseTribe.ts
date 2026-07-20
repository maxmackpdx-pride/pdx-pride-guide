import type { IngestEventDraft } from "./types";
import { dayOfWeekFromStart, defaultEndFromStart, toPacificWallClock } from "./dates";
import { pickBestImageFromUnknown } from "./posterQuality";

/**
 * The Events Calendar (Tribe) REST: `/wp-json/tribe/events/v1/events`
 */
export function parseTribeEventsJson(raw: string, sourceUrl: string | null = null): IngestEventDraft[] {
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }

  const events: any[] = Array.isArray(data?.events)
    ? data.events
    : Array.isArray(data)
      ? data
      : [];

  if (!events.length) return [];

  const drafts: IngestEventDraft[] = [];
  const seen = new Set<string>();

  for (const evt of events) {
    if (!evt || typeof evt !== "object") continue;
    const title = String(evt.title || evt.name || "").trim();
    if (!title) continue;

    const warnings: string[] = [];
    const dateStart = toPacificWallClock(
      evt.start_date || evt.start_date_details?.date || evt.utc_start_date || evt.datetime_start,
    );
    if (!dateStart) continue;
    let dateEnd = toPacificWallClock(
      evt.end_date || evt.end_date_details?.date || evt.utc_end_date || evt.datetime_end,
    );
    if (!dateEnd) {
      dateEnd = defaultEndFromStart(dateStart);
      warnings.push("No end_date — defaulted +3h");
    }

    const venueObj = evt.venue || evt.venues?.[0] || {};
    const venueName = String(
      venueObj.venue || venueObj.name || venueObj.venue_name || "TBA",
    ).trim() || "TBA";
    const address = [
      venueObj.address,
      venueObj.city,
      venueObj.state || venueObj.province,
      venueObj.zip,
    ]
      .filter(Boolean)
      .join(", ") || null;

    let description = String(evt.description || evt.excerpt || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!description) {
      description = `${title} at ${venueName}.`;
      warnings.push("No description — stub");
    }

    const ticketUrl = evt.url || evt.website || sourceUrl || null;
    // Prefer full/original over medium/thumbnail sizes
    const poster =
      pickBestImageFromUnknown(evt.image) ||
      evt.image?.sizes?.full?.url ||
      evt.image?.sizes?.large?.url ||
      evt.image?.url ||
      null;

    const draft: IngestEventDraft = {
      title: title.slice(0, 200),
      description: description.slice(0, 8000),
      venueName: venueName.slice(0, 200),
      address: address ? address.slice(0, 300) : null,
      neighborhood: null,
      lat: venueObj.geo_lat != null ? Number(venueObj.geo_lat) : null,
      lng: venueObj.geo_lng != null ? Number(venueObj.geo_lng) : null,
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
      posterImageUrl: poster ? String(poster).slice(0, 800) : null,
      sourceUrl,
      parseSource: "tribe",
      warnings,
    };

    const key = `${draft.title}|${draft.dateStart}|${draft.venueName}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    drafts.push(draft);
  }

  return drafts;
}

export function looksLikeTribeJson(raw: string): boolean {
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data?.events) || (data?.total != null && Array.isArray(data?.events));
  } catch {
    return false;
  }
}
