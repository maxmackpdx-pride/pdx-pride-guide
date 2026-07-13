/** Normalize venue names for fuzzy directory matching. */
export function normalizeVenueKey(value: string | null | undefined): string {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Hand-maintained fallbacks for common Pride venues not always in directory. */
export const VENUE_WEBSITE_FALLBACKS: Record<string, string> = {
  "star theater": "https://www.startheaterportland.com/",
  "star theater and starlight lounge": "https://www.startheaterportland.com/",
  holocene: "https://www.holocene.org/",
  sanctuary: "https://www.pdxsanctuary.com/",
  "crystal ballroom": "https://www.mcmenamins.com/crystal-ballroom",
  "mcmenamins crystal ballroom": "https://www.mcmenamins.com/crystal-ballroom",
  "mcmenamins crystal ballroom hotel": "https://www.mcmenamins.com/crystal-ballroom",
  "nova pdx": "https://www.novapdx.com/",
  "722 e burnside": "https://www.novapdx.com/",
  "realm pdx": "https://realmpdx.com/",
  "white owl social club": "https://www.whiteowlsocialclub.com/",
  "the get down": "https://www.thegetdownpdx.com/",
  "alberta rose theatre": "https://albertarosetheatre.com/",
  "q center": "https://www.pdxqcenter.org/",
  "midtown beer garden": "https://www.midtownbeergarden.com/",
  "tom mccall waterfront park": "https://portlandpride.org/",
  "walker stadium": "https://www.portlandpicklesbaseball.com/",
  "escape bar grill": "https://www.escapebarandgrill.com/",
  "escape bar and grill": "https://www.escapebarandgrill.com/",
  "black water": "https://www.blackwaterpdx.com/",
  "seagrape apothecary": "https://www.seagrapeapothecary.com/",
  "the sports bra": "https://thesportsbraofficial.com/",
  "redd on salmon": "https://www.reddon.com/",
  "jackies": "https://www.jackiespdx.com/",
  "jackie s": "https://www.jackiespdx.com/",
  "bullard tavern": "https://www.bullardtavern.com/",
  "happylucky now serving": "https://www.happyluckynowserving.com/",
  "formerly opaline": "https://www.instagram.com/infernopdx/",
  "bar cala": "https://www.barcala.com/",
  "mcmenamins mission theater": "https://www.mcmenamins.com/mission-theater",
  "the hangar at oaks amusement park": "https://rosecityrollers.com/",
  "north park blocks to naito pkwy": "https://portlandpride.org/pride-parade-1",
  "north park blocks": "https://portlandpride.org/",
  "ankeny alley": "https://portlandpride.org/",
  "darcelle xv plaza": "https://darcellexv.com/",
  "darcelle xv showplace": "https://darcellexv.com/",
  "badlands": "https://www.badlandsportland.com/",
  "badlands portland": "https://www.badlandsportland.com/",
  "eagle portland": "https://www.eagleportland.com/",
  "cc slaughters": "https://ccslaughterspdx.com/",
  "stag pdx": "https://www.stagportland.com/",
  "silverado": "https://www.silveradopdx.com/",
  "peacock pdx": "https://peacockpdx.com/",
  "hawks pdx": "https://hawkspdx.com/",
  hawks: "https://hawkspdx.com/",
  "scandals east": "https://scandalspdx.com/",
  "camp bar pdx": "https://campbarpdx.com/",
  "camp": "https://campbarpdx.com/",
  "the ritz carlton portland": "https://www.ritzcarlton.com/en/hotels/pdxrz-the-ritz-carlton-portland/",
  "ritz carlton portland": "https://www.ritzcarlton.com/en/hotels/pdxrz-the-ritz-carlton-portland/",
  "trek bicycle portland slabtown": "https://www.trekbikes.com/us/en_US/retail/portland_slabtown/",
  "gents in lents": "https://www.gentsinlents.com/",
  "meetrack": "https://www.meetrack.com/",
  "maker s market at waterfront festival": "https://portlandpride.org/2026-portland-pride-official-events",
  "portland pride parade": "https://portlandpride.org/pride-parade-1",
  "portland pride parade pdx pah contingent": "https://www.instagram.com/pdxpahofficial/",
  "downtown portland": "https://portlandpride.org/",
  "ne 30th ave": "https://portlandpride.org/",
  "gay blvd": "https://www.eventbrite.com/e/divapalooza-pdx-pride-2026-tickets-1991334196186",
  "virtual google meet": "https://www.oslcontest.org/calendar",
  process: "https://www.processpdx.club",
  "process pdx": "https://www.processpdx.club",
  "the automatic bar": "https://www.theautomaticbarpdx.com/",
  "automatic bar": "https://www.theautomaticbarpdx.com/",
  "montavilla station": "https://montavillastation.com/",
  "covert cafe": "https://www.thecovertcafe.com/",
  "covert café": "https://www.thecovertcafe.com/",
  "hunny beez": "https://hunnybeezpdx.com/",
  "q restaurant bar": "https://q-portland.com/",
  "q restaurant and bar": "https://q-portland.com/",
};

export type VenueWebsiteSource = {
  name?: string | null;
  website?: string | null;
  active?: boolean | null;
};

export function buildVenueWebsiteIndex(businesses: VenueWebsiteSource[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, url] of Object.entries(VENUE_WEBSITE_FALLBACKS)) {
    map.set(key, url);
  }
  for (const biz of businesses) {
    if (biz.active === false) continue;
    const website = String(biz.website || "").trim();
    if (!website) continue;
    const key = normalizeVenueKey(biz.name);
    if (key) map.set(key, website);
    // Also index without common suffixes
    const short = key
      .replace(/\bportland\b/g, "")
      .replace(/\bpdx\b/g, "")
      .replace(/\bshowplace\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (short && short !== key) map.set(short, website);
  }
  return map;
}

export function resolveVenueWebsite(
  venueName: string | null | undefined,
  index?: Map<string, string> | null,
): string | null {
  const key = normalizeVenueKey(venueName);
  if (!key) return null;
  if (index?.has(key)) return index.get(key) || null;
  if (VENUE_WEBSITE_FALLBACKS[key]) return VENUE_WEBSITE_FALLBACKS[key];
  // Fuzzy contains match
  const pool = index ? Array.from(index.entries()) : Object.entries(VENUE_WEBSITE_FALLBACKS);
  for (const [k, url] of pool) {
    if (!k) continue;
    if (key.includes(k) || k.includes(key)) return url;
  }
  return null;
}
