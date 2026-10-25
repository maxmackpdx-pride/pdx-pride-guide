// Hologram type for each venue, keyed by normalized venue name.
// Types map to approved designs: puck = E3c, totem = H5, tube = E1.
// Generated from waypoints.json. Edit a row to change a venue's type.
export const HOLOGRAM_TYPES = ["puck", "totem", "tube", "cube", "vortex", "halo"];
export const DEFAULT_HOLOGRAM_TYPE = "puck";
export const VENUE_HOLOGRAM_TYPES = new Map([
 ["cc slaughters", "puck"], // CC Slaughters
 ["darcelle xv showplace", "totem"], // Darcelle XV Showplace
 ["stag pdx", "puck"], // Stag PDX
 ["badlands", "puck"], // Badlands
 ["eagle portland", "puck"], // Eagle Portland
 ["the nest lounge", "puck"], // The Nest Lounge
 ["silverado", "puck"], // Silverado
 ["kann", "tube"], // Kann
 ["the sports bra", "totem"], // The Sports Bra
 ["mis tacones", "tube"], // Mis Tacones
 ["taqueria los pu ales", "tube"], // Taqueria Los Puñales
 ["friendship kitchen", "tube"], // Friendship Kitchen
 ["either or", "tube"], // Either/Or
 ["tin shed garden cafe", "tube"], // Tin Shed Garden Cafe
 ["speed o cappuccino", "tube"], // Speed-o Cappuccino
 ["coffee beer", "tube"], // Coffee Beer
 ["living room wines", "puck"], // Living Room Wines
 ["stem wine bar", "puck"], // Stem Wine Bar
 ["roots crowns", "tube"], // Roots & Crowns
 ["greenhouse hair collective", "tube"], // Greenhouse Hair Collective
 ["arium botanicals", "tube"], // Arium Botanicals
 ["pizza thief", "totem"], // Pizza Thief
 ["peacock pdx", "puck"], // Peacock PDX
 ["scandals east", "puck"], // Scandals East
 ["honeyed words", "tube"], // Honeyed Words
 ["camp bar pdx", "puck"], // Camp Bar PDX
 ["ring ding ding", "puck"], // Ring Ding Ding
 ["holocene", "tube"], // Holocene
 ["alberta rose theatre", "tube"], // Alberta Rose Theatre
 ["jackie s", "puck"], // Jackie's
 ["sanctuary club", "totem"], // Sanctuary Club
 ["seagrape apothecary", "tube"], // Seagrape Apothecary
 ["realm pdx", "tube"], // REALM PDX
 ["nova pdx", "tube"], // Nova PDX
 ["star theater", "tube"], // Star Theater
 ["the get down", "tube"], // The Get Down
 ["happylucky no 1", "puck"], // Happylucky No. 1
 ["escape bar grill", "puck"], // Escape Bar & Grill
 ["the lodge bar and grill", "puck"], // The Lodge Bar and Grill
 ["hawks pdx", "totem"], // Hawks PDX
 ["bowery bagels", "tube"], // Bowery Bagels
 ["process", "puck"], // Process
 ["prism health", "tube"], // Prism Health
 ["the automatic bar", "puck"], // The Automatic Bar
 ["montavilla station", "puck"], // Montavilla Station
 ["covert caf", "puck"], // Covert Café
 ["hunny beez", "tube"], // Hunny Beez
 ["q restaurant bar", "tube"], // Q Restaurant & Bar
 ["gigi s cafe", "tube"], // GiGi's Cafe
 ["backstory books yarn", "tube"], // Backstory Books & Yarn
 ["bridge city mentors", "tube"], // Bridge City Mentors
 ["rebel heart therapy", "tube"], // Rebel Heart Therapy
 ["full spectrum therapy", "tube"], // Full Spectrum Therapy
 ["sprout therapy pdx", "tube"], // Sprout Therapy PDX
 ["the center for couples sex therapy", "tube"], // The Center for Couples & Sex Therapy
 ["plus psychiatry", "tube"], // Plus Psychiatry
 ["triangle recreation camp", "tube"], // Triangle Recreation Camp
 ["pdx pah portland pets handlers", "tube"], // PDX PAH - Portland Pets & Handlers
 ["ori gallery", "tube"], // Ori Gallery
 ["yes coach productions", "tube"], // Yes Coach Productions
 ["the secret warehouse", "tube"], // The Secret Warehouse
 ["fantasy land", "totem"], // Fantasy Land
 ["taboo video", "totem"], // Taboo Video
 ["taboo video", "totem"], // Taboo Video
 ["taboo video", "totem"], // Taboo Video
 ["taboo video", "totem"], // Taboo Video
 ["mr peeps", "tube"], // Mr. Peeps
 ["mr peeps", "tube"], // Mr. Peeps
 ["mr peeps", "tube"], // Mr. Peeps
 ["fantasy", "totem"], // FANTASY
 ["fantasy", "totem"], // FANTASY
 ["fantasy", "totem"], // FANTASY
 ["fantasy", "totem"], // FANTASY
 ["business oregon", "tube"], // Business Oregon
 ["cash oregon", "tube"], // CASH Oregon
 ["prosper portland", "tube"], // Prosper Portland
 ["echo theater", "tube"], // Echo Theater
 ["independent publishing resource center", "tube"], // Independent Publishing Resource Center
 ["sincere studio", "tube"], // Sincere Studio
 ["symbiop", "tube"], // SymbiOp
 ["p ear", "tube"], // P:EAR
 ["portland playhouse", "tube"], // Portland Playhouse
 ["steam portland", "totem"], // Steam Portland
 ["club privata", "totem"], // Club Privata
 ["the velvet rope", "totem"], // The Velvet Rope
]);
export function normalizeVenueName(name){ return String(name||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }
export function hologramTypeForVenue(venueName){
 return VENUE_HOLOGRAM_TYPES.get(normalizeVenueName(venueName)) || DEFAULT_HOLOGRAM_TYPE;
}
