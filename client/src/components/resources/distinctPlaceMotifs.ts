import { placeWireframe, type PlaceWireframe } from "./placeWireframeGeometry";

const assignments: Record<string, string> = {
  'Badlands':'danceScreen', 'Camp Bar PDX':'gathering', 'CC Slaughters':'soundRoom',
  'Darcelle XV Showplace':'dragStage', 'Stag PDX':'antlers', 'Eagle Portland':'wingsLinks',
  'The Nest Lounge':'lounge', 'Silverado':'starStage', 'Kann':'fireWood', 'The Sports Bra':'trophyBall',
  'Mis Tacones':'taco', 'Taqueria Los Puñales':'taco', 'Friendship Kitchen':'bowlChopsticks',
  'Either/Or':'coffeeMix', 'Tin Shed Garden Cafe':'gardenBrunch', 'Speed-o Cappuccino':'espressoCart',
  'Coffee Beer':'coffeeBeer', 'Living Room Wines':'wineRoom', 'Stem Wine Bar':'wineTarot',
  'Roots & Crowns':'botanicalBottles', 'Arium Botanicals':'plantHouse',
  'Pizza Thief':'pizza', 'Peacock PDX':'peacockMic', 'Scandals East':'karaoke', 'Honeyed Words':'books',
  'Ring Ding Ding':'ringCocktail', 'Holocene':'soundRoom', 'Alberta Rose Theatre':'dragStage',
  "Jackie's":'lounge', 'Sanctuary Club':'dancePortal', 'Seagrape Apothecary':'botanicalBottles',
  'REALM PDX':'dancePortal', 'Nova PDX':'soundRoom', 'Star Theater':'starStage', 'The Get Down':'waves',
  'Happylucky No. 1':'lantern', 'Escape Bar & Grill':'poolDarts', 'The Lodge Bar and Grill':'poolDarts',
  'underU4men':'garment', 'The Meet Rack at Darkroom':'dancePortal', 'Hawks PDX':'spa',
  'Bowery Bagels':'bagel', 'Process':'soundRoom', 'The Automatic Bar':'ringCocktail',
  'Montavilla Station':'karaoke', 'Covert Café':'soundRoom', 'Hunny Beez':'bowlChopsticks',
  'Q Restaurant & Bar':'bowlChopsticks', "GiGi's Cafe":'waffle', 'Backstory Books & Yarn':'yarnBook',
  'Sold By Scott':'keysHome', 'Triangle Recreation Camp':'riverCamp', 'The Secret Warehouse':'film',
  'Fantasy Land':'film', 'Taboo Video':'film', 'Mr. Peeps':'film', 'FANTASY':'garment',
  'Inbundance Wealth Management':'wealth', 'Open Space Dance':'aerialStage', 'Echo Theater':'aerialStage',
  'SymbiOp':'plantHouse', 'Steam Portland':'spa', 'Club Privata':'dancePortal',
  'The Velvet Rope':'dancePortal', 'Best Coast Barber Co.':'scissors',
  // Owner-requested professional cards; same objects in Placez and NEEDZ.
  "Tattoos by Les": "tattooPen",
  "Fuzzy Pits Tattoo": "tattooPen",
  "Birdhouse Tattoo · Noble": "tattooPen",
  "Enjoy Co. Hair Studio": "scissors",
  "Little Wilma’s Hair Salon": "scissors",
  "Everybody’s Bodywork": "bodywork",
  "SomaSoul Healing": "bodywork",
  "trans bodycare": "bodywork",
  "Spring Tides Massage": "bodywork",
  "StephanieMadeIt": "designPlanes",
  "Courtney Ahn Design": "designPlanes",
  "NerdyKeppie": "designPlanes",
  "Sonny’s House of Tattoos and Treasures": "tattooPen",
  "Ritual Arts": "tattooPen",
  "Robot Piercing and Tattoo": "tattooPen",
  "Greenhouse Hair Collective": "scissors",
  "Limelight Salon": "scissors",
  "Love Salon PDX": "scissors",
  "Thrive Therapeutic Massage": "bodywork",
  "Wayward Massage Therapist": "bodywork",
  "Rest and Ritual": "bodywork",
  "Unlock Collective": "webConsole",
  "DoGoodBiz Studio": "webConsole",
  "Rainbow Forge": "webConsole",
  "Gay Thrive": "webConsole",
  "Smonday Studios": "webConsole",
  "Studio Anansi": "webConsole",
  "Max Burns UX": "webConsole",
  "Clau Studio": "webConsole",
  "Plush Tattoo & Intuitive Arts": "tattooPen",
  "Plush Tattoo": "tattooPen",
  "Fruit": "botanicalBottles",
  "Fruit Beauty": "botanicalBottles",
  "Jenson Sarr": "keysHome",
  "Jenson Sarr — Living Room Realty": "keysHome",
  "Jamis Minnis": "keysHome",
  "Jamis Minnis — Living Room Realty": "keysHome",
  "Tyler Marsing": "keysHome",
  "Bonnie Roseman / Roseman Team": "keysHome",
  "Bonnie Roseman": "keysHome",
  "Blake & Alder": "keysHome",
  "Blake & Alder Property Management": "keysHome",
  "Reconstructed Wellness": "careRibbon",
  "Bywater Health": "careRibbon",
  "Black Hole Body Piercing & Tattoo": "tattooPen",
  "Black Hole Tattoo and Piercing": "tattooPen",
  "Cockeye Kink": "garment",

};

const key = (name: string) => name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").trim().toLowerCase();
const namedForms = new Map(Object.entries(assignments).map(([name, form]) => [key(name), placeWireframe(form, .8)]));
export function distinctPlaceMotif(name: string): PlaceWireframe | undefined {
  return namedForms.get(key(name));
}

// A second, related object occupies its own offset plane behind the logo.
const supportingForms: Record<string, string> = {
 danceScreen: 'ringCocktail', gathering: 'pineTree', dragStage: 'starStage', antlers: 'wineRoom',
 wingsLinks: 'ringCocktail', lounge: 'wineRoom', starStage: 'karaoke', fireWood: 'bowlChopsticks',
 trophyBall: 'coffeeBeer', taco: 'fireWood', bowlChopsticks: 'plantHouse', coffeeMix: 'bagel',
 gardenBrunch: 'coffeeMix', espressoCart: 'coffeeMix', coffeeBeer: 'coffeeMix', wineRoom: 'plantHouse',
 wineTarot: 'wineRoom', botanicalBottles: 'wineRoom', scissors: 'comb', plantHouse: 'gardenBrunch',
 pizza: 'fireWood', peacockMic: 'karaoke', karaoke: 'wineRoom', books: 'coffeeMix',
 ringCocktail: 'wineRoom', soundRoom: 'karaoke', aerialStage: 'starStage', lantern: 'wineRoom',
 dancePortal: 'soundRoom', waves: 'soundRoom', poolDarts: 'coffeeBeer', garment: 'ringCocktail',
 spa: 'plantHouse', bagel: 'coffeeMix', waffle: 'coffeeMix', yarnBook: 'books', keysHome: 'keyRing',
 riverCamp: 'fireWood', film: 'starStage', wealth: 'keysHome',
 tattooPen: 'inkVessel', inkVessel: 'tattooPen', comb: 'scissors', bodywork: 'plantHouse',
 designPlanes: 'books', webConsole: 'designPlanes', keyRing: 'keysHome', careRibbon: 'bodywork',
};
const supportingByName = new Map(Object.entries(assignments).map(([name, form]) => [key(name), placeWireframe(key(name) === key('Cockeye Kink') || key(name) === key('NerdyKeppie') ? 'threadSpool' : supportingForms[form], .6, .38)]));
export function distinctPlaceSupportingMotif(name: string): PlaceWireframe | undefined {
 return supportingByName.get(key(name));
}
