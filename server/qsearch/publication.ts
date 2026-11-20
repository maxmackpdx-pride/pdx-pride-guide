import { hasPublicEventFlags } from "@shared/publicEventVisibility";
import { resolveBusinessLocations } from "@shared/businessLocations";
import { hasRegistrationOnlyLocation, REGISTRATION_ADDRESS } from "@shared/registrationOnlyVenue";
import { TRUSTED_VENUES } from "@shared/trustedVenues";
import { sqlite, storage } from "../storage";
import { addressCore, venueNamesExplicitlyMatch } from "./directoryBrands";

type Facts = Record<string, unknown>;
type Observation = { field: string; source_url: string; authority_level: string; observed_value_json: string; excerpt?: string | null };

const sanctuary = TRUSTED_VENUES.find(venue => venue.sourceId === "sanctuary-ics")!;

export function republishesEvent(before: Facts, after: Facts) {
  return after.status === "LIVE" && (before.status !== "LIVE" ||
    (!hasPublicEventFlags(before) && hasPublicEventFlags(after)));
}

function usableAddress(value: unknown): value is string {
  return typeof value === "string" && !!value.trim()
    && !/^(?:unknown|unverified|tbd|tba|n\/?a|portland(?:,?\s*(?:or|oregon))?(?:\s+\d{5})?|p\.?\s*o\.?\s*box\b.*)$/i.test(value.trim());
}

function sanctuaryLocation(values: Facts) {
  return venueNamesExplicitlyMatch(String(values.venueName), sanctuary.venueName)
    && addressCore(String(values.address || "")) === addressCore(sanctuary.address);
}

/** Inherit only from a single physical directory location with an exact identity. */
export function publicationDefaults(values: Facts, newEvent: boolean): Facts {
  const defaults: Facts = {};
  if (values.status !== "LIVE") return defaults;
  if (!String(values.address || "").trim()) {
    if (hasRegistrationOnlyLocation(values)) defaults.address = REGISTRATION_ADDRESS;
    else {
      const matches = storage.getBusinesses().filter(place => place.active && !["group", "nonprofit"].includes(place.type)
        && venueNamesExplicitlyMatch(String(values.venueName || ""), place.name));
      const addresses = new Set(matches.flatMap(place => resolveBusinessLocations(place).map(location => location.address)));
      if (addresses.size === 1) {
        const [address] = addresses;
        if (usableAddress(address)) defaults.address = address;
      }
    }
  }
  if (newEvent && sanctuaryLocation({ ...values, ...defaults })) {
    if (values.ageRequirement == null || values.ageRequirement === "UNVERIFIED") defaults.ageRequirement = "21_PLUS";
    if (values.isSexPositive == null) defaults.isSexPositive = true;
  }
  return defaults;
}

export function publicationAddressIssue(values: Facts): string | null {
  if (values.status !== "LIVE") return null;
  if (hasRegistrationOnlyLocation(values)) {
    return hasRegistrationOnlyLocation({ address: values.address }) && values.lat == null && values.lng == null
      ? null : "registrationOnlyAddress";
  }
  return usableAddress(values.address) ? null : "address";
}

function httpUrl(raw: unknown): URL | null {
  try {
    const url = new URL(String(raw || ""));
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    url.hash = "";
    return url;
  } catch { return null; }
}

function listingKey(url: URL): string | null {
  if (!/(^|\.)fetlife\.com$/i.test(url.hostname)) return null;
  const path = url.pathname.replace(/\/+$/, "");
  if (!/^\/events\/.+$/i.test(path)) return null;
  const query = new URLSearchParams(url.search);
  for (const name of [...query.keys()]) {
    if (/^(?:utm_.*|fbclid|gclid|dclid|msclkid)$/i.test(name)) query.delete(name);
  }
  query.sort();
  return query.size ? path + "?" + query.toString() : path;
}

export function historicalFetlifeSources(target: { eventId?: number; candidateKey?: string }): string[] {
  // A new run or an unrelated edit must not erase the originating platform.
  const rows = target.eventId
    ? sqlite.prepare("SELECT DISTINCT source_url FROM agent_field_evidence WHERE event_id = ? AND authority_level = 'primary' AND lower(source_url) LIKE '%fetlife.com%'").all(target.eventId)
    : sqlite.prepare("SELECT DISTINCT source_url FROM agent_field_evidence WHERE entity_key = ? AND event_id IS NULL AND authority_level = 'primary' AND lower(source_url) LIKE '%fetlife.com%'").all(target.candidateKey!);
  const urls = (rows as {source_url: string}[]).map(row => row.source_url);
  if (target.eventId && sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='agent_event_change_log'").get()) {
    const historical = sqlite.prepare(`SELECT DISTINCT json_extract(receipt.value, '$.sourceUrl') AS url
      FROM agent_event_change_log log, json_each(log.evidence_receipts_json) receipt
      WHERE log.event_id = ? AND log.rolled_back_at IS NULL AND lower(log.evidence_receipts_json) LIKE '%fetlife.com%'`).all(target.eventId) as {url: string}[];
    urls.push(...historical.map(row => row.url));
  }
  return urls.filter(url => /(^|\.)fetlife\.com$/i.test(httpUrl(url)?.hostname || ""));
}

/** The scoped research agent records its observation and quotes the listing.
 * Classification and access are independently reviewed on the exact occurrence. */
export function publicationReviews(values: Facts, observations: Observation[], sources: string[], history: string[]) {
  const artwork = new Set<string>();
  const listings = new Set<string>();
  const latest = new Map<string, Observation>();
  let fetlife = /^fetlife(?:$|[-_:])/i.test(String(values.source || ""));
  function sourcePage(raw: unknown, checkArtwork: boolean) {
    const url = httpUrl(raw);
    if (!url) return;
    if (checkArtwork) artwork.add(url.href);
    if (!/(^|\.)fetlife\.com$/i.test(url.hostname)) return;
    fetlife = true;
    const listing = listingKey(url);
    if (listing) listings.add(listing);
  }
  for (const url of history) sourcePage(url, false);
  for (const url of [...sources, values.ticketUrl]) sourcePage(url, true);
  for (const row of observations) {
    if (row.authority_level !== "primary") continue;
    const url = httpUrl(row.source_url);
    if (!url) continue;
    sourcePage(url.href, true);
    const key = row.field + "|" + (row.field === "artwork-review" ? url.href : listingKey(url) || url.href);
    if (!latest.has(key)) latest.set(key, row);
  }
  const uncheckedArtworkPages = values.posterImageUrl ? [] : [...artwork].filter(url =>
    latest.get("artwork-review|" + url)?.observed_value_json !== '"no-official-image"');
  const missingFetlifeEvidence: string[] = [];
  if (fetlife) {
    if (!listings.size) missingFetlifeEvidence.push("fetlife-listing");
    for (const listing of listings) {
      const confirmed = (field: string, value: string) => {
        const row = latest.get(field + "|" + listing);
        return row?.observed_value_json === JSON.stringify(value) && !!row.excerpt?.trim();
      };
      if (values.isPublic === false || !confirmed("public-access", "public")) missingFetlifeEvidence.push(listing + " public-access");
      const credited = confirmed("organizer-credit", "Portland Leather Alliance")
        && /\b(?:Portland Leather Alliance|The-PLA)\b/i.test(latest.get("organizer-credit|" + listing)?.excerpt || "");
      if (!sanctuaryLocation(values) && !credited && !confirmed("lgbtq-relevance", "explicit")) {
        missingFetlifeEvidence.push(listing + " lgbtq-relevance");
      }
    }
  }
  return { uncheckedArtworkPages, missingFetlifeEvidence };
}
