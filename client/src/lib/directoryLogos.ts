/** Map directory business names → static neon logo paths under /directory-logos. */

const STEM_BY_NORMALIZED: Record<string, string> = {
  albertarosetheatre: "Alberta_Rose_Theatre",
  ariumbotanicals: "Arium_Botanicals",
  badlands: "Badlands",
  basicrightsoregon: "Basic_Rights_Oregon",
  campbarpdx: "Camp_Bar_PDX",
  cascadeaidsprojectcapandourhouse: "Cascade_AIDS_Project",
  cascadeaidsprojectcapourhouse: "Cascade_AIDS_Project",
  cascadeaidsproject: "Cascade_AIDS_Project",
  ccslaughters: "CC_Slaughters",
  coffeebeer: "Coffee_Beer",
  darcellexvshowplace: "Darcelle_XV_Showplace",
  eagleportland: "Eagle_Portland",
  eitheror: "Either_Or",
  escapebargrill: "Escape_Bar_and_Grill",
  escapebarandgrill: "Escape_Bar_and_Grill",
  friendshipkitchen: "Friendship_Kitchen",
  goldgritbarberco: "Gold_Grit_Barber_Co",
  happyluckyno1: "Happylucky_No_1",
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
  const stem = STEM_BY_NORMALIZED[normalizeDirectoryName(name)];
  if (stem) return `/directory-logos/${stem}.png`;
  if (imageUrl && imageUrl.trim()) return imageUrl.trim();
  return null;
}

export function directoryFallbackLogo(type: string): string {
  return FALLBACK_BY_TYPE[type] || FALLBACK_BY_TYPE.venue;
}

export function hasDirectoryLogo(name: string, imageUrl?: string | null): boolean {
  if (STEM_BY_NORMALIZED[normalizeDirectoryName(name)]) return true;
  return Boolean(imageUrl && imageUrl.trim());
}
