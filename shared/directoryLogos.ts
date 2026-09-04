/** Map directory business names → static neon logo paths under /directory-logos. */

/** Bump when logo assets under /directory-logos change so browsers fetch fresh files. */
export const DIRECTORY_LOGO_VERSION = "2026-07-28";

/** Append soft cache-bust query to pack paths. Skip if already has a query string. */
function withLogoCacheBust(path: string): string {
  if (!path.startsWith("/directory-logos/")) return path;
  if (path.includes("?")) return path;
  return `${path}?v=${DIRECTORY_LOGO_VERSION}`;
}

const STEM_BY_NORMALIZED: Record<string, string> = {
  albertarosetheatre: "Alberta_Rose_Theatre",
  ariumbotanicals: "Arium_Botanicals",
  badlands: "Badlands",
  basicrightsoregon: "Basic_Rights_Oregon",
  bearracuda: "Bearracuda",
  // Yes Coach Productions — group / party collective (Tucker_PDmaX)
  yescoachproductions: "Yes_Coach_Productions",
  yescoach: "Yes_Coach_Productions",
  yescoachparties: "Yes_Coach_Productions",
  yescoachparty: "Yes_Coach_Productions",
  stankyescoach: "Yes_Coach_Productions",
  // Adult shops — red-glow neon pack
  // Foster shop (Tucker's favorite) — separate from the FANTASY chain
  fantasyland: "Fantasy_Land",
  fantasylandadult: "Fantasy_Land",
  fantasylandadultvideo: "Fantasy_Land",
  fantasyonfoster: "Fantasy_Land",
  fantasyonfosterportland: "Fantasy_Land",
  // FANTASY for Adults Only multi-location chain (Sandy, Burnside, Tigard, Clackamas)
  fantasyforadultsonly: "Fantasy_Adults_Only",
  fantasyadultsonly: "Fantasy_Adults_Only",
  fantasyadults: "Fantasy_Adults_Only",
  fantasyportland: "Fantasy_Adults_Only",
  fantasysandy: "Fantasy_Adults_Only",
  fantasyburnside: "Fantasy_Adults_Only",
  taboovideo: "Taboo_Video",
  taboo: "Taboo_Video",
  tabooadultvideo: "Taboo_Video",
  taboovideopdx: "Taboo_Video",
  mrpeeps: "Mr_Peeps",
  mrpeepsadultsuperstores: "Mr_Peeps",
  thepeephole: "Mr_Peeps",
  peephole: "Mr_Peeps",
  bowerybagels: "Bowery_Bagels",
  campbarpdx: "Camp_Bar_PDX",
  camp: "Camp_Bar_PDX",
  campbar: "Camp_Bar_PDX",
  camppdx: "Camp_Bar_PDX",
  cascadeaidsprojectcapandourhouse: "Cascade_AIDS_Project",
  cascadeaidsprojectcapourhouse: "Cascade_AIDS_Project",
  cascadeaidsproject: "Cascade_AIDS_Project",
  ccslaughters: "CC_Slaughters",
  coffeebeer: "Coffee_Beer",
  darcellexvshowplace: "Darcelle_XV_Showplace",
  darcellexv: "Darcelle_XV_Showplace",
  darcelle: "Darcelle_XV_Showplace",
  darcellexvplaza: "Darcelle_XV_Showplace",
  darcelleplaza: "Darcelle_XV_Showplace",
  eagleportland: "Eagle_Portland",
  eitheror: "Either_Or",
  escapebargrill: "Escape_Bar_and_Grill",
  escapebarandgrill: "Escape_Bar_and_Grill",
  friendshipkitchen: "Friendship_Kitchen",
  goldgritbarberco: "Gold_Grit_Barber_Co",
  happyluckyno1: "Happylucky_No_1",
  hawkspdx: "Hawks_PDX",
  hawks: "Hawks_PDX",
  holocene: "Holocene",
  honeyedwords: "Honeyed_Words",
  jackies: "Jackies",
  kann: "Kann",
  livingroomwines: "Living_Room_Wines",
  mistacones: "Mis_Tacones",
  newavenuesforyouthsmyrc: "New_Avenues_for_Youth_SMYRC",
  novapdx: "Nova_PDX",
  outsidein: "Outside_In",
  peacockpdx: "Peacock_PDX",
  pinkponies: "Pink_Ponies",
  burningmanpinkponies: "Pink_Ponies",
  pinkponiespdx: "Pink_Ponies",
  pizzathief: "Pizza_Thief",
  portlandgaymenschorus: "Portland_Gay_Mens_Chorus",
  pridenorthwest: "Pride_Northwest",
  realmpdx: "REALM_PDX",
  rootsandcrowns: "Roots_and_Crowns",
  rootscrowns: "Roots_and_Crowns",
  sanctuaryclub: "Sanctuary_Club",
  scandalseast: "Scandals_East",
  seagrapeapothecary: "Seagrape_Apothecary",
  silverado: "Silverado",
  speedocappuccino: "Speed_O_Cappuccino",
  stagpdx: "Stag_PDX",
  startheater: "Star_Theater",
  stemwinebar: "Stem_Wine_Bar",
  taquerialospunales: "Taqueria_Los_Punales",
  thegetdown: "The_Get_Down",
  thelodgebarandgrill: "The_Lodge_Bar_and_Grill",
  themarieequicenter: "The_Marie_Equi_Center",
  themariequicenter: "The_Marie_Equi_Center",
  themeetrack: "The_Meet_Rack",
  themeetrackatdarkroom: "The_Meet_Rack",
  meetrack: "The_Meet_Rack",
  meetrackatdarkroom: "The_Meet_Rack",
  thesportsbra: "The_Sports_Bra",
  tinshedgardencafe: "Tin_Shed_Garden_Cafe",
  underu4men: "UnderU4Men",
  werqtogether: "WERQ_Together",
  // ── 2026 Gay Pages + Process / Prism wave ──
  process: "Process",
  processpdx: "Process",
  processclub: "Process",
  prismhealth: "Prism_Health",
  prismhealthnw: "Prism_Health",
  prism: "Prism_Health",
  theautomaticbar: "The_Automatic_Bar",
  automaticbar: "The_Automatic_Bar",
  montavillastation: "Montavilla_Station",
  covertcafe: "Covert_Cafe",
  thecovertcafe: "Covert_Cafe",
  hunnybeez: "Hunny_Beez",
  qrestaurantbar: "Q_Restaurant_and_Bar",
  qrestaurantandbar: "Q_Restaurant_and_Bar",
  gigiscafe: "Gigis_Cafe",
  gigiscafepdx: "Gigis_Cafe",
  backstorybooksandyarn: "Backstory_Books_and_Yarn",
  backstorybooks: "Backstory_Books_and_Yarn",
  bridgecitymentors: "Bridge_City_Mentors",
  rebelhearttherapy: "Rebel_Heart_Therapy",
  fullspectrumtherapy: "Full_Spectrum_Therapy",
  sprouttherapypdx: "Sprout_Therapy_PDX",
  thecenterforcouplessextherapy: "The_Center_for_Couples_and_Sex_Therapy",
  thecenterforcouplesandsextherapy: "The_Center_for_Couples_and_Sex_Therapy",
  soldbyscott: "Sold_By_Scott",
  soldxscott: "Sold_By_Scott",
  pluspsychiatry: "Plus_Psychiatry",
  pluspsych: "Plus_Psychiatry",
  pluspsychiatryllc: "Plus_Psychiatry",
  // Camp TRC (Triangle Recreation Camp) — Granite Falls WA LGBTQ+ campground
  trianglerecreationcamp: "Triangle_Recreation_Camp",
  camptrc: "Triangle_Recreation_Camp",
  camptrcwashington: "Triangle_Recreation_Camp",
  trianglerc: "Triangle_Recreation_Camp",
  trccamp: "Triangle_Recreation_Camp",
  trcgranitefalls: "Triangle_Recreation_Camp",
};

/**
 * Verified brand artwork served by each organization's official website.
 * These cover newer directory records that were added after the local neon pack.
 * PlaceCard falls back to the category artwork if an upstream image is unavailable.
 */
const URL_BY_NORMALIZED: Record<string, string> = {
  pdxpahportlandpetsandhandlers:
    "https://images.squarespace-cdn.com/content/v1/59372f5bebbd1aec221c42ff/1496800600700-OGK3KNPJF7AT0E3SWVHK/banner_logo.jpg?format=1500w",
  oregonstateleathercontest:
    "https://images.squarespace-cdn.com/content/v1/61fc7ed13dd33145ef504fa9/f1f9736a-70d3-477e-b887-7c11d68fd655/OSLC%2B-%2BHorizontal%2B-%2BRGB.png?format=1500w",
  portlandleatheralliance: "https://www.portlandleather.org/plalogo.png",
  blackandbeyondthebinarycollective:
    "https://images.squarespace-cdn.com/content/v1/5fb42e75300426086615900b/1606164127712-KAVCH3UC9HWPQT23Y71C/49new-49.png?format=1500w",
  browngirlrise:
    "https://images.squarespace-cdn.com/content/v1/5ac57c1fb27e395f3f980cea/14b06364-03ac-4523-a614-69b7692ecc9e/My+project.png?format=1500w",
  origallery:
    "https://images.squarespace-cdn.com/content/v1/58db2b5129687fd202ac76be/84c72ac7-e2c5-4592-ac52-e583a82046f3/Ori-Gallery--logo-white.png?format=1500w",
  portlandfrontrunners:
    "https://images.squarespace-cdn.com/content/v1/5bf385d0d274cb3fb374ea2b/38dcdd58-185b-4172-8c57-b01413ff6613/Frontrunners_Est1982-05.png",
  portlandqueerartsfoundation:
    "https://portlandqueerarts.foundation/wp-content/themes/pqa/assets/images/brand-assets/logos/Foundation-Logo-Horizontal-Light-TransparentBG-1024.png",
  foundationforcontemporaryarts: "https://www.foundationforcontemporaryarts.org/favicon.ico?v2",
  businessoregon: "https://www.oregon.gov/biz/PublishingImages/Icons/biz-or-sm.png",
  oregonartscommission:
    "https://orcdn.govstatus.site/Application/CDN/Enterprise/images/icons/favicons/favicon-196x196.png?v=07072026",
  regionalartsandculturecouncil: "https://racc.org/wp-content/uploads/2023/10/RACC-Logo.png",
  qcenter:
    "https://static.wixstatic.com/media/312949_58ad0c6b069848179ae7323543083ee1~mv2.png/v1/fill/w_600,h_600,al_c,q_90/2026%20Q%20Logo1.png",
  queersocialclub:
    "https://images.squarespace-cdn.com/content/v1/62155dfcfc6583248de4ebac/e774f080-be22-41d3-a4d0-f8f31fefd7f0/2026+logo+white+transparent+bg.png",
  fertilegroundfestival:
    "https://fertilegroundpdx.org/wp-content/uploads/2025/09/FG-Logo-white-outline-1-e1756685300185.png",
  portlandareatheatrealliance:
    "https://portlandtheatre.com/wp-content/uploads/2022/08/PATA-Logo-Red.png",
  lesbiancultureclub:
    "https://lesbiancultureclub.com/cdn/shop/files/favicon-32x32_f0ccb5ec-6927-40e1-b9e3-fbb8621df825.png?crop=center&height=194&v=1718903222&width=194",
  radicalfaerieartsfest:
    "https://images.squarespace-cdn.com/content/v1/63e9327ea475597f7bbac5f8/ef1f5897-2f71-4f89-9bc7-6ece72bd14df/RADFAF+LOGO+FINAL6.jpg?format=1500w",
  oregonprideinbusiness:
    "https://images.squarespace-cdn.com/content/v1/6789c3b70c8e5900dcba6a4d/6623214f-0dcd-4ffd-a9a2-01381f26746e/cropped-NEW-ORPIB-LOGO-MAIN.png?format=1500w",
  cashoregon: "https://cdn.netraising1.com/images-mfs/site/favicons/apple-touch-icon.png",
  portlandsmallbusinessdevelopmentcenter:
    "https://oregonsbdc.org/wp-content/uploads/2023/01/Oregon_SBDC-Logo-Header.jpg",
  prosperportland:
    "https://prosperportland.us/wp-content/uploads/2024/11/ProsperPortland_FullColor_Banner.svg",
  openspacedance:
    "https://static.wixstatic.com/media/9e7ff1_189c22ca019b4321bb898ba605d5d9f3%7Emv2.png/v1/fill/w_192%2Ch_192%2Clg_1%2Cusm_0.66_1.00_0.01/9e7ff1_189c22ca019b4321bb898ba605d5d9f3%7Emv2.png",
  echotheater:
    "https://images.squarespace-cdn.com/content/v1/646fd8af9572cc7b4a12e649/b82cda6d-1c41-406e-89a0-98b3cb1b7fda/wordmark-white.png?format=1500w",
  independentpublishingresourcecenter:
    "https://images.squarespace-cdn.com/content/v1/65a04ea0c7342f223c8e2ea1/2693ff78-729f-4d94-a9d7-d6124cfa4a8a/favicon.ico?format=100w",
  iprc:
    "https://images.squarespace-cdn.com/content/v1/65a04ea0c7342f223c8e2ea1/2693ff78-729f-4d94-a9d7-d6124cfa4a8a/favicon.ico?format=100w",
  makewithpdx:
    "https://images.squarespace-cdn.com/content/v1/655e742f3e845e7ad0cd4702/f8bf7a3f-7fa9-4e3e-9979-8b2fe051c95c/MW_Wordmark_Cream_Small.png?format=1500w",
  sincerestudio:
    "https://static.wixstatic.com/media/e729e3_ba69bbd956a14b9b9ad57ce55fd1dc1c%7Emv2.png/v1/fill/w_192%2Ch_192%2Clg_1%2Cusm_0.66_1.00_0.01/e729e3_ba69bbd956a14b9b9ad57ce55fd1dc1c%7Emv2.png",
  symbiop:
    "https://symbiop.com/wp-content/uploads/2026/01/cropped-SymbiOp_Logomark-Colorblock-Oak-192x192.png",
  ilyouth2youth:
    "https://images.squarespace-cdn.com/content/v1/665fbcbf3db5c22170d57a4f/c43e0348-6b5e-46e9-9fa5-109ad09e0ecb/041924-ILYouth2-LogoALL-41.png?format=1500w",
  pear: "https://www.pearmentor.org/wp-content/themes/pear2021/img/pear-logo.png",
  portlandplayhouse: "https://portlandplayhouse.org/wp-content/uploads/2018/11/pp_logo_white.png",
};

const FALLBACK_BY_TYPE: Record<string, string> = {
  bar: "/directory-logos/fallback_bars.png",
  restaurant: "/directory-logos/fallback_restaurants.png",
  cafe: "/directory-logos/fallback_cafes.png",
  venue: "/directory-logos/fallback_venues.png",
  service: "/directory-logos/fallback_services.png",
  shop: "/directory-logos/fallback_shops.png",
  nonprofit: "/directory-logos/fallback_nonprofits.png",
  hotel: "/directory-logos/fallback_venues.png",
  healthcare: "/directory-logos/fallback_healthcare.png",
  realestate: "/directory-logos/fallback_realestate.png",
  group: "/directory-logos/fallback_groups.png",
  campground: "/directory-logos/fallback_campgrounds.png",
};

export function normalizeDirectoryName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * Resolve logo for a directory place.
 * Prefer static neon pack under /directory-logos (redesign source of truth),
 * then fall back to DB imageUrl when no pack match exists.
 */
export function resolveDirectoryLogo(
  name: string,
  imageUrl?: string | null,
): string | null {
  const norm = normalizeDirectoryName(name);
  let stem = STEM_BY_NORMALIZED[norm];
  // Safe prefix only (venue name starts with a known stem). Never substring /
  // reverse-prefix - those false-match ("Not Darcelle", "Night Hawks").
  // Prefer longest key so "campbarpdx" wins over "camp" if both ever applied.
  if (!stem && norm.length >= 6) {
    let bestKey = "";
    for (const [key, value] of Object.entries(STEM_BY_NORMALIZED)) {
      if (key.length < 6) continue;
      if (norm.startsWith(key) && key.length > bestKey.length) {
        bestKey = key;
        stem = value;
      }
    }
  }
  if (stem) return withLogoCacheBust(`/directory-logos/${stem}.png`);
  const officialUrl = URL_BY_NORMALIZED[norm];
  if (officialUrl) return officialUrl;
  if (imageUrl && imageUrl.trim()) {
    const url = imageUrl.trim();
    // Only bust our static pack paths; leave external/CDN URLs alone.
    return url.startsWith("/directory-logos/") ? withLogoCacheBust(url) : url;
  }
  return null;
}

export function directoryFallbackLogo(type: string): string {
  return withLogoCacheBust(FALLBACK_BY_TYPE[type] || FALLBACK_BY_TYPE.venue);
}

export function hasDirectoryLogo(name: string, imageUrl?: string | null): boolean {
  const norm = normalizeDirectoryName(name);
  if (STEM_BY_NORMALIZED[norm] || URL_BY_NORMALIZED[norm]) return true;
  return Boolean(imageUrl && imageUrl.trim());
}
