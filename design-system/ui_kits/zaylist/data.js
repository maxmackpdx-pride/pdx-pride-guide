/* Real Portland Festival 2026 content pulled from zaylist.com.
   A representative subset across all four days, community-board sample
   posts, and venue directory places. Loaded as window.PDX_DATA.
   Day accents follow the site's map legend:
   THU = cyan, FRI = magenta/pink, SAT = green, SUN = orange. */
(function () {
  var DAY_ACCENT = { THU: "cyan", FRI: "pink", SAT: "green", SUN: "orange" };

  const EVENTS = [
    // ---- THU JUL 16 (kickoff night) ----
    { id: 13, day: "THU", date: "Jul 16", hour: "8:00", ampm: "PM",
      title: "Sasha Colby Kick-Off", venue: "Star Theater", neighborhood: "Old Town",
      admission: "TICKETED", featured: true, going: 42, tags: ["Drag", "21+", "Headliner"],
      blurb: "Headline performance by drag superstar Sasha Colby for Kick-Off." },
    { id: 53, day: "THU", date: "Jul 16", hour: "7:00", ampm: "PM",
      title: "Sad Girl Summer, Festival Edition", venue: "Black Water", neighborhood: "NE Portland",
      admission: "TICKETED", going: 1, tags: ["Drag", "21+"],
      blurb: "Portland's biggest bummer of a drag show, back and sadder than ever. Bring tissues." },
    { id: 17, day: "THU", date: "Jul 16", hour: "7:05", ampm: "PM",
      title: "Portland Pickles Community Night", venue: "Walker Stadium", neighborhood: "SE Portland",
      admission: "TICKETED", tags: ["Sports", "All Ages"],
      blurb: "Community baseball vs. the Gresham Greywolves. On-field activities, vendors, from $12." },
    { id: 52, day: "THU", date: "Jul 16", hour: "9:00", ampm: "PM",
      title: "BANG: Queer Techno Transmission", venue: "Holocene", neighborhood: "SE Portland",
      admission: "TICKETED", tags: ["Techno", "21+"],
      blurb: "Kicking off the week with a BANG, a new queer-helmed techno night. DJs Sappho, Bro Hoe, Kraftwitch." },

    // ---- FRI JUL 17 ----
    { id: 51, day: "FRI", date: "Jul 17", hour: "5:00", ampm: "PM",
      title: "Midtown Beer Garden Bash", venue: "Midtown Beer Garden", neighborhood: "Downtown",
      admission: "FREE", tags: ["Outdoor", "All Ages"],
      blurb: "Official FestNW outdoor beer garden, open across events on Harvey Milk St." },
    { id: 27, day: "FRI", date: "Jul 17", hour: "7:00", ampm: "PM",
      title: "Darcelle XV Friday Night Show", venue: "Darcelle XV Showplace", neighborhood: "Old Town",
      admission: "TICKETED", featured: true, going: 18, tags: ["Drag", "Legendary"],
      blurb: "Portland's legendary drag cabaret, staging shows since 1967. Doors 7pm, show 8pm. $32." },
    { id: 9, day: "FRI", date: "Jul 17", hour: "9:00", ampm: "PM",
      title: "Horse Meat Disco TUFF", venue: "Crystal Ballroom", neighborhood: "Pearl District",
      admission: "TICKETED", tags: ["Disco", "21+"],
      blurb: "Official festival night celebrating underground dance floors and leather bars. DJ Nick Bertossi." },
    { id: 15, day: "FRI", date: "Jul 17", hour: "9:00", ampm: "PM",
      title: "Bearracuda Friday: Vaseline Alley", venue: "722 E Burnside", neighborhood: "Inner East",
      admission: "TICKETED", tags: ["Bears", "21+", "Sex Positive"],
      blurb: "Bearracuda Friday. Theme: Vaseline Alley. Harnesses and fetish gear encouraged." },

    // ---- SAT JUL 18 ----
    { id: 1, day: "SAT", date: "Jul 18", hour: "12:00", ampm: "PM",
      title: "Portland Waterfront Festival", venue: "Tom McCall Waterfront Park", neighborhood: "Downtown",
      admission: "SUGGESTED_DONATION", featured: true, going: 220, tags: ["Main Stage", "ASL", "All Ages"],
      blurb: "Official FestNW festival. 2026 theme: Made with Love. $10 suggested, no one turned away." },
    { id: 31, day: "SAT", date: "Jul 18", hour: "12:00", ampm: "PM",
      title: "Rose City Roller Derby: Blood, Sweat & Queers", venue: "The Hangar at Oaks Park", neighborhood: "SE Portland",
      admission: "TICKETED", tags: ["Sports"],
      blurb: "Rose City Roller Derby home-team championship Community Night. Food carts plus Plow Stop Bar." },
    { id: 18, day: "SAT", date: "Jul 18", hour: "1:00", ampm: "PM",
      title: "Old Town Block Party", venue: "Ankeny Alley", neighborhood: "Old Town",
      admission: "FREE", tags: ["Outdoor", "All Ages"],
      blurb: "Official FestNW Old Town activation. Unstoppable joy and radical love in Ankeny Alley." },
    { id: 47, day: "SAT", date: "Jul 18", hour: "5:00", ampm: "PM",
      title: "Dyke March Portland", venue: "Downtown Portland", neighborhood: "Downtown",
      admission: "FREE", tags: ["March", "All Ages"],
      blurb: "Official FestNW event. Check portlandfestival.org for the exact start and route before attending." },
    { id: 6, day: "SAT", date: "Jul 18", hour: "9:00", ampm: "PM",
      title: "RADIANCE by Gaylabration", venue: "McMenamins Crystal Ballroom", neighborhood: "Pearl District",
      admission: "TICKETED", tags: ["Dance", "21+"],
      blurb: "Headliner Matt Suave, with Poundstar, Mircat Dragonfae, and Bro Hoe Sappho." },

    // ---- SUN JUL 19 ----
    { id: 2, day: "SUN", date: "Jul 19", hour: "11:00", ampm: "AM",
      title: "Portland Festival Parade", venue: "North Park Blocks to Naito Pkwy", neighborhood: "Downtown",
      admission: "FREE", featured: true, going: 310, tags: ["Parade", "All Ages"],
      blurb: "Oregon's largest parade, drawing tens of thousands. Ends at the Waterfront festival." },
    { id: 35, day: "SUN", date: "Jul 19", hour: "2:00", ampm: "PM",
      title: "Portland Trans March", venue: "North Park Blocks", neighborhood: "Downtown",
      admission: "FREE", tags: ["March", "All Ages"],
      blurb: "Free, all ages, masks encouraged. Organized by and for the trans community." },
    { id: 21, day: "SUN", date: "Jul 19", hour: "1:00", ampm: "PM",
      title: "The Sports Bra Block Party", venue: "The Sports Bra", neighborhood: "NE Portland",
      admission: "TICKETED", tags: ["Outdoor", "All Ages"],
      blurb: "5th annual block party: DJ sets, lifting comp, dance, food carts, kid-friendly activities." },
    { id: 26, day: "SUN", date: "Jul 19", hour: "7:00", ampm: "PM",
      title: "Chai & Roses Dance Party", venue: "Holocene", neighborhood: "SE Portland",
      admission: "TICKETED", tags: ["QTBIPOC", "21+"],
      blurb: "Sunday tea dance for QTBIPOC and allies. DJs Suavecito and DJ Anjali. MC Armaan Singh." },
    { id: 22, day: "SUN", date: "Jul 19", hour: "9:00", ampm: "PM",
      title: "Yes Sir Gay Dance Party", venue: "REALM PDX", neighborhood: "SE Portland",
      admission: "TICKETED", tags: ["Dance", "21+", "Sex Positive"],
      blurb: "Secret warehouse gay underwear night featuring DJ Ottogyro. Location for ticket holders." },
  ].map(function (e) { return Object.assign({ accent: DAY_ACCENT[e.day] }, e); });

  const DAYS = [
    { key: "THU", label: "Thu", date: "Jul 16", accent: "cyan" },
    { key: "FRI", label: "Fri", date: "Jul 17", accent: "pink" },
    { key: "SAT", label: "Sat", date: "Jul 18", accent: "green" },
    { key: "SUN", label: "Sun", date: "Jul 19", accent: "orange" },
  ];

  // Venue / place directory (Places page)
  const PLACES = [
    { name: "Camp Bar PDX", category: "bars", grandOpening: true, address: "1125 SW Harvey Milk St",
      description: "Modern inclusive gay bar in downtown Portland's Gayborhood, taking over the historic former Scandals space on Harvey Milk Street. Grand opening June 2026.",
      website: "#", instagram: "@campbarpdx" },
    { name: "Friendship Kitchen", category: "food", address: "2333 NE Glisan St",
      description: "Wife-and-wife owned Vietnamese restaurant serving Impossible egg rolls, shaken beef or tofu, pho, and lemongrass chicken skewers.",
      website: "#", instagram: "@friendshipkitchen" },
    { name: "Either/Or", category: "cafes", address: "4003 N Williams Ave", hours: "Mon to Sun 8am to 2pm",
      description: "LGBTQ+-owned coffee bar known for creative coffee cocktails and zero-proof mocktails. A queer-welcoming neighborhood anchor in N Portland.",
      website: "#", instagram: "@eitherorcafe" },
    { name: "Alberta Rose Theatre", category: "venues", address: "3000 NE Alberta St",
      description: "Historic 300-seat theater on Alberta hosting music, burlesque, comedy, and community events with a strong queer presence.",
      events: [{ day: "SAT", date: "Sat, Jul 18 · 8:00 PM", title: "BOYeurism: Spectacular" }] },
    { name: "Jackie's", category: "bars", address: "930 SE Sandy Blvd",
      description: "Laid-back queer-friendly bar on SE Sandy. Regular host of LGBTQ+ community nights and festival events.",
      events: [{ day: "SUN", date: "Sun, Jul 19 · 3:00 PM", title: "Lumbertwink Plaid Patio Party" }] },
    { name: "CC Slaughters", category: "bars", address: "219 NW Davis St", hours: "Mon to Sun 2pm to 2:30am",
      phone: "(503) 248-9135",
      description: "Portland's beloved LGBTQ+ nightclub since 1981. Dance floor, drag shows, themed nights, and a welcoming crowd in the heart of Old Town.",
      website: "#", instagram: "@slaughterspdx" },
    { name: "Sanctuary Club", category: "venues", address: "33 NW 9th Ave",
      description: "LGBTQ+-centered event space and club in the Pearl. Hosts drag, dance parties, and community gatherings.",
      events: [{ day: "SAT", date: "Sat, Jul 18 · 9:00 PM", title: "Stank Yes Coach, PDX FEST" }] },
    { name: "Tin Shed Garden Cafe", category: "cafes", address: "1438 NE Alberta St",
      hours: "Mon to Fri 8am to 2pm, Sat to Sun 7am to 3pm", phone: "(503) 288-6966",
      description: "Eco-friendly, dog-friendly breakfast and brunch cafe run by Christie Griffin and Janette Kaden since 2002. Featured on Food Network.",
      instagram: "@tinshedgardencafe" },
  ];

  const PLACE_CATEGORIES = [
    { key: "all", label: "All" },
    { key: "bars", label: "Bars & Clubs" },
    { key: "food", label: "Restaurants" },
    { key: "cafes", label: "Cafes" },
    { key: "venues", label: "Venues" },
    { key: "services", label: "Services" },
    { key: "shops", label: "Shops" },
    { key: "hotels", label: "Hotels" },
  ];

  // Canonical accent per community board (mirrors the --board-* tokens):
  //   Missed Connections = magenta ("pink"), Gifting = acid yellow ("lime"), Gigs = violet ("purple").
  const BOARD_ACCENTS = { spotted: "pink", gifting: "lime", gigs: "purple" };

  // Community board (Missed Connections, Gifting / Free Board, Gigs)
  const COMMUNITY = {
    spotted: [
      { id: "s1", accent: "pink", where: "Dyke March", when: "Sat 5pm",
        text: "You: rainbow suspenders and a golden retriever. Me: handing out free water at the corner. You smiled. I short-circuited. Coffee?" },
      { id: "s2", accent: "cyan", where: "Sasha Colby line", when: "Thu",
        text: "Cutie in the mesh top who let me cut the line at Star Theater, I owe you a drink. You said your name and I forgot it immediately." },
      { id: "s3", accent: "purple", where: "Waterfront Festival", when: "Sat",
        text: "We danced near the north stage, then lost each other in the crowd. You had a hand-painted PROTEST sign." },
    ],
    freeboard: [
      { id: "f1", accent: "lime", title: "3 pairs of platform boots", size: "Size 9", where: "Pearl District",
        text: "Rehoming gently-worn club platforms. Porch pickup, no questions. Take one pair or all three." },
      { id: "f2", accent: "amber", title: "Glitter stash plus 2 flags", size: "Big box", where: "NE Portland",
        text: "Mostly-full biodegradable glitter, a Progress flag, and a Trans flag. Free to a good, sparkly home." },
      { id: "f3", accent: "cyan", title: "Parade cooler plus canopy", size: "10x10", where: "SE Portland",
        text: "Shade tent and a wheeled cooler. Borrow board: return it and pay it forward." },
    ],
    gigs: [
      { id: "g1", accent: "pink", role: "DJ, Sunday drag brunch", pay: "Paid", where: "Stag PDX",
        text: "Last-minute fill-in needed, Sun 11am to 3pm. Disco/pop, bring your own controller. Venmo same day." },
      { id: "g2", accent: "purple", role: "Muralist, Old Town alley", pay: "Small budget plus love", where: "Ankeny Alley",
        text: "Community wall for Block Party. We supply paint and lift. You supply the vision. Queer artists prioritized." },
      { id: "g3", accent: "lime", role: "ASL interpreters", pay: "Paid", where: "Waterfront main stage",
        text: "FestNW seeking certified interpreters for main and north stage rotations. Flexible shifts across the weekend." },
    ],
  };

  window.PDX_DATA = { EVENTS, DAYS, PLACES, PLACE_CATEGORIES, COMMUNITY, BOARD_ACCENTS };
})();
