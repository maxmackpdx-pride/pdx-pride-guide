/**
 * The home destination rail: ten cards, one shared anatomy.
 *
 * Ported from the "World cards design system redesign" Claude Design project
 * (World Cards.dc.html). The locked order is
 *   OUTZ -> EVENTZ -> OUR PLACEZ -> THE HAUZ -> GIFTZ -> GIGZ -> SELLZ
 *   -> MIZZED CONNECTION -> Z/SPACE -> NEXT
 * and every card carries: rainbow top seam, number ring plus eyebrow, the
 * product wordmark, one full-bleed motif, one slot, one action row. Per-card
 * accent comes from the destination page, as a token so calm mode works.
 *
 * This module is data only. Live wiring lives in `useHomeWorlds`, rendering in
 * `HomeWorldCard`. Demo rows below are the fallback that shows when a board has
 * nothing live yet; they always render with a DEMO sticker.
 */

export type WorldKey =
  | "outz"
  | "eventz"
  | "placez"
  | "hauz"
  | "giftz"
  | "gigz"
  | "sellz"
  | "mizzed"
  | "zspace"
  | "next";

/** Which body the card's middle slot renders. One per card, no mixing. */
export type WorldSlotKind =
  | "rows"
  | "flyer"
  | "marquee"
  | "postings"
  | "items"
  | "today"
  | "roadmap";

export type WorldSpec = {
  key: WorldKey;
  /** Locked rail position, shown in the number ring. */
  number: string;
  title: string;
  eyebrow: string;
  /** Blurb under the wordmark. Cards whose slot is the whole story omit it. */
  body?: string;
  /** Stands in for the wordmark on a card with no family mark (NEXT). */
  headline?: string;
  action: string;
  href: string;
  accent: string;
  /** Family wordmark, `/brand/family/*`. Null on cards that lead with copy. */
  mark: string | null;
  slot: WorldSlotKind;
};

/** OUTZ: one address per row, with today's check-in count. */
export type WorldRow = {
  id: string;
  href: string;
  name: string;
  stats: string;
  sub: string;
  /** "24 IN" - today's check-ins. Null while unknown. */
  count: number | null;
  isLive: boolean;
};

/** EVENTZ: one flyer in the rotation. */
export type WorldFlyer = {
  id: string;
  href: string;
  title: string;
  when: string;
  poster: string | null;
  /** Day token, so the TONIGHT chip matches the board. */
  dayColor: string;
  isLive: boolean;
};

/** OUR PLACEZ: one lit marquee panel. */
export type WorldPanel = {
  id: string;
  href: string;
  name: string;
  logo: string;
};

/** THE HAUZ / GIFTZ / GIGZ / MIZZED: one posting inside the slot. */
export type WorldPosting = {
  id: string;
  href: string;
  kicker: string;
  title: string;
  line: string;
  meta: string;
  action: string;
  photo: string | null;
  /** Stretch the title band edge to edge (MIZZED reads as a quote). */
  wide?: boolean;
  isLive: boolean;
};

/** SELLZ: one item tile. */
export type WorldItem = {
  id: string;
  href: string;
  price: string;
  cond: string;
  photo: string | null;
  reserved: boolean;
  isLive: boolean;
};

/**
 * Z/SPACE: one thing still to come today.
 *
 * `label` is the thing and `sub` is where it is, kept apart rather than joined
 * into one string, because the row sets them at two different sizes: the title
 * carries the reading and the venue is the second line under it.
 */
export type WorldTodayItem = {
  id: string;
  href: string;
  label: string;
  sub: string | null;
  time: string;
  accent: string;
  isLive: boolean;
};

/** NEXT: one unbuilt product on the blueprint. */
export type WorldRoadmapMark = {
  name: string;
  src: string;
  glow: string;
  /** Per-mark width: the three logos do not share an aspect ratio. */
  width: string;
  rotate: string;
};

/**
 * Accents are tokens, never raw hexes, so calm mode neutralises them. Each one
 * matches the accent its destination page already declares, so the rail can
 * never disagree with the board it links to.
 */
export const WORLDS: WorldSpec[] = [
  {
    key: "outz",
    number: "01",
    title: "OUTZ",
    eyebrow: "Join the chat",
    body: "Camping, hiking, trailheads and beaches, with the access notes and the people who make the trip better. Every address has a check-in chat, plus a planning chat for a day you're booking ahead.",
    action: "Join the chat",
    href: "/outz",
    accent: "var(--neon-orange, #ff6600)",
    mark: "/brand/family/outz.svg",
    slot: "rows",
  },
  {
    key: "eventz",
    number: "02",
    title: "EVENTZ",
    eyebrow: "Flyers · Portland",
    action: "Open EVENTZ",
    href: "/events",
    accent: "var(--neon-cyan, #00ffff)",
    mark: "/brand/family/eventz.png",
    slot: "flyer",
  },
  {
    key: "placez",
    number: "03",
    title: "OUR PLACEZ",
    eyebrow: "The directory for us",
    body: "Queer-owned and queer-friendly Portland businesses, celebrated and not just indexed.",
    action: "Spend queer",
    href: "/directory",
    accent: "var(--neon-blue, #0044ff)",
    mark: "/brand/family/our-placez.svg",
    slot: "marquee",
  },
  {
    key: "hauz",
    number: "04",
    title: "THE HAÜZ",
    eyebrow: "Rooms and people",
    body: "Find a room, a roommate or the people to form a home with.",
    action: "Find your people",
    href: "/the-hauz",
    accent: "var(--panel-cyan, #19e3ff)",
    mark: "/brand/family/the-hauz.svg",
    slot: "postings",
  },
  {
    key: "giftz",
    number: "05",
    title: "GIFTZ",
    eyebrow: "Give and ask",
    body: "Useful things move directly between people, without a marketplace.",
    action: "Open GIFTZ",
    href: "/gifting",
    accent: "var(--board-gifting, #ccff00)",
    mark: "/brand/family/giftz.svg",
    slot: "postings",
  },
  {
    key: "gigz",
    number: "06",
    title: "GIGZ",
    eyebrow: "Hiring both ways",
    body: "Find paid work, or find the queer talent your event needs.",
    action: "Find a gig",
    href: "/pride-work",
    accent: "var(--board-gigs, #6e3dff)",
    mark: "/brand/family/gigz.svg",
    slot: "postings",
  },
  {
    key: "sellz",
    number: "07",
    title: "SELLZ",
    eyebrow: "Local marketplace",
    body: "Buy and sell with the scene. Simple listings, real people, local handoffs.",
    action: "Browse listings",
    href: "/sellz",
    accent: "var(--neon-green, #39ff14)",
    mark: "/brand/family/sellz.svg",
    slot: "items",
  },
  {
    key: "mizzed",
    number: "08",
    title: "MIZZED CONNECTION",
    eyebrow: "Say the thing",
    body: "Post who you saw. Replies stay private and consent comes first.",
    action: "See who got spotted",
    href: "/spotted",
    accent: "var(--board-spotted, #ff00cc)",
    mark: "/brand/family/mizzed-connection.svg",
    slot: "postings",
  },
  {
    key: "zspace",
    number: "09",
    title: "Z/ COMMUNITIES",
    /* Kept inside the eyebrow's one nowrap line: "Every board, one address"
       was the only kicker on the rail that ran past its box and ellipsed. */
    eyebrow: "Find your people",
    /* No wordmark by request: the headline carries this card, and the list
       below it is the subject. The eyebrow already names the destination.

       The body describes the list that is actually there, which is what is
       still to come today, and leaves the whole-namespace promise to the
       eyebrow and the action row. The old copy said "every address in the
       namespace, and everything on it today" over a list that is today's
       events, and a card should not promise more than it shows. */
    headline: "Where people belong",
    /* Two lines is the whole body box on this rail, and at rail card width
       that is about sixty characters, so this says one thing and stops. The
       whole-namespace promise is the eyebrow's and the action row's. */
    body: "Memberships, rules, posts, and the gatherings around them.",
    action: "Open Communities",
    href: "/z",
    accent: "var(--board-zspace, #8f5cff)",
    mark: null,
    slot: "today",
  },
  {
    key: "next",
    number: "10",
    title: "NEXT",
    /* No family wordmark exists for NEXT, so the headline carries the name and
       the card keeps the same lead-with-identity anatomy as the other nine. */
    headline: "Next",
    eyebrow: "What's coming",
    body: "Three more products in the family. Not built yet, shown as roadmap.",
    action: "See what's next",
    href: "/next",
    accent: "#ffffff",
    mark: null,
    slot: "roadmap",
  },
];

/* ── Demo fallbacks ──────────────────────────────────────────────────────
   Every board keeps its demo material so a card is never empty, and live data
   always wins. Anything rendered from these carries a DEMO sticker. */

export const DEMO_OUTZ_ROWS: WorldRow[] = [
  {
    id: "rooster-rock",
    href: "/outz/rooster-rock",
    name: "Rooster Rock",
    stats: "EASY · RIVER BEACH · THE GORGE",
    sub: "The River Brats crew. NUDE BEACH. Join today's group chat here.",
    count: 24,
    isLive: false,
  },
  {
    id: "sauvie-island",
    href: "/outz/sauvie-island",
    name: "Sauvie Island · Collins Beach",
    stats: "EASY · ISLAND BEACH · 0.5 MI WALK-IN",
    sub: "The Sauvie Sirens crew. NUDE BEACH. Join today's group chat here.",
    count: 9,
    isLive: false,
  },
  {
    id: "angels-rest",
    href: "/outz",
    name: "Angel's Rest Trailhead",
    stats: "MODERATE · 4.8 MI · 1,500 FT GAIN",
    sub: "Columbia Gorge. Views over the river at the top. Join today's group chat here.",
    count: 3,
    isLive: false,
  },
];

export const DEMO_FLYER: WorldFlyer = {
  id: "demo-eventz-flyer",
  href: "/events",
  title: "Sasha Colby Live",
  when: "Darcelle XV Showplace · Fri 9:00 PM",
  poster: "/home/flyers/sasha-colby-live.jpg",
  dayColor: "var(--day-fri, #ff00cc)",
  isLive: false,
};

/** Fills the 3x3 marquee before the directory has loaded. */
export const DEMO_PLACE_LOGOS = [
  "Alberta_Rose_Theatre",
  "Badlands",
  "CC_Slaughters",
  "Darcelle_XV_Showplace",
  "Eagle_Portland",
  "Holocene",
  "Kann",
  "Nova_PDX",
  "Outside_In",
  "Peacock_PDX",
  "Mis_Tacones",
  "Bearracuda",
  "Camp_Bar_PDX",
  "Gold_Grit_Barber_Co",
  "Pizza_Thief",
  "Jackies",
  "Basic_Rights_Oregon",
  "Coffee_Beer",
];

export const DEMO_POSTINGS: Record<"hauz" | "giftz" | "gigz" | "mizzed", WorldPosting[]> = {
  hauz: [
    {
      id: "demo-hauz-1",
      href: "/the-hauz",
      kicker: "Forming a haüs",
      title: "Wildrose Haüs",
      line: "Southeast. Big kitchen, one very polite beagle.",
      meta: "$850 · FEB 1 · 2 IN 2 TO GO",
      action: "Ask to join",
      photo: "/home/hausing/room-forming.jpg",
      isLive: false,
    },
    {
      id: "demo-hauz-2",
      href: "/the-hauz",
      kicker: "Forming a haüs",
      title: "Cully Room Open",
      line: "Quiet room in a shared craftsman near the Cully Kitchen.",
      meta: "2H AGO · 1 IN 3 TO GO",
      action: "Raise hand",
      photo: "/hausing/demo/room-offering.jpg",
      isLive: false,
    },
  ],
  giftz: [
    {
      id: "demo-giftz-1",
      href: "/gifting",
      kicker: "On the board now",
      title: "Free moving boxes (about 20)",
      line: "SE Portland. Take them all, they are clean and flat.",
      meta: "24M AGO · 0 OF 3 HANDS UP",
      action: "Raise hand",
      photo: "/home/gifting/gift-boxes.jpg",
      isLive: false,
    },
    {
      id: "demo-giftz-2",
      href: "/gifting",
      kicker: "On the board now",
      title: "Kid's bike, age 6",
      line: "Outgrown, good condition, needs a new home before the garage sale.",
      meta: "5H AGO · 0 OF 3 HANDS UP",
      action: "Raise hand",
      photo: "/hausing/demo/gift-fridge.jpg",
      isLive: false,
    },
  ],
  gigz: [
    {
      id: "demo-gigz-1",
      href: "/pride-work",
      kicker: "Hiring",
      title: "Coat check, two people, 9pm to 2am",
      line: "Paid cash at the end of the night. Tips are yours.",
      meta: "SAT · SOUTHEAST · $25/HR",
      action: "Say hi",
      photo: "/home/flyers/certified-freak-block-party.jpg",
      isLive: false,
    },
    {
      id: "demo-gigz-2",
      href: "/pride-work",
      kicker: "Looking",
      title: "DJ available weekends",
      line: "Two years spinning house and ballroom sets for queer parties citywide.",
      meta: "POSTED 3D AGO · 1 ASK",
      action: "Ask about it",
      photo: null,
      isLive: false,
    },
  ],
  mizzed: [
    {
      id: "demo-mizzed-1",
      href: "/spotted",
      kicker: "Missed connections",
      title: "Blue buzzcut, back patio, two waters",
      line: "You gave one to me. I did not get your name.",
      meta: "2H AGO · FRI · PEARL DISTRICT",
      action: "Reply",
      photo: null,
      wide: true,
      isLive: false,
    },
    {
      id: "demo-mizzed-2",
      href: "/spotted",
      kicker: "Found",
      title: "Left at the bar on 12th",
      line: "You forgot your jacket, I'm holding onto it at the front bar.",
      meta: "4H AGO · 2 REPLIES",
      action: "Reply privately",
      photo: null,
      wide: true,
      isLive: false,
    },
  ],
};

export const DEMO_ITEMS: WorldItem[] = [
  { id: "demo-sellz-1", href: "/sellz", price: "$40", cond: "Good · Alberta", photo: null, reserved: false, isLive: false },
  { id: "demo-sellz-2", href: "/sellz", price: "$120", cond: "Fair · St. Johns", photo: null, reserved: false, isLive: false },
  { id: "demo-sellz-3", href: "/sellz", price: "$60", cond: "Like new · SE", photo: null, reserved: true, isLive: false },
  { id: "demo-sellz-4", href: "/sellz", price: "$8", cond: "Good · N Portland", photo: null, reserved: false, isLive: false },
];

export const DEMO_TODAY: WorldTodayItem[] = [
  { id: "demo-today-1", href: "/z", label: "Drag brunch", sub: "Darcelle XV", time: "11 AM", accent: "var(--day-thu, #00ffff)", isLive: false },
  { id: "demo-today-2", href: "/z", label: "Vendor setup", sub: "Block Party", time: "2 PM", accent: "var(--board-gigs, #6e3dff)", isLive: false },
  { id: "demo-today-3", href: "/z", label: "Sasha Colby Live", sub: "Darcelle XV Showplace", time: "9 PM", accent: "var(--neon-green, #39ff14)", isLive: false },
  { id: "demo-today-4", href: "/z", label: "Afterparty", sub: "CC Slaughters", time: "11 PM", accent: "var(--board-spotted, #ff00cc)", isLive: false },
  { id: "demo-today-5", href: "/z", label: "Late skate", sub: "Oaks Park", time: "12 AM", accent: "var(--board-gifting, #ccff00)", isLive: false },
];

/**
 * NEXT is the teaser for the three unbuilt products. THE HAÜZ, OUTZ and
 * Z/SPACE graduated into the rail above, so they are not restated here.
 * `#next-preview` further down the page stays the detail view.
 */
export const ROADMAP_MARKS: WorldRoadmapMark[] = [
  { name: "ZAYDARK", src: "/brand/family/zaydark.svg", glow: "#ff1f1f", width: "82%", rotate: "0deg" },
  { name: "AFTERZ", src: "/brand/family/afterz.svg", glow: "#ffb400", width: "82%", rotate: "0deg" },
  { name: "ZENEGADES", src: "/brand/family/zenegades.svg", glow: "#ff2d2d", width: "94%", rotate: "-3deg" },
];

/** How many live records each slot asks its API for. */
export const WORLD_FEED_LIMITS = {
  /** EVENTZ flyer rotation: the next ten events, nothing further out. */
  events: 10,
  /** Z/SPACE: the next ten things still to come today, nothing tomorrow. */
  today: 10,
  /** Two postings read as a board; one blown up reads as an advert. */
  postings: 2,
  /** Three addresses fit the OUTZ slot at the locked card height. */
  outzRows: 3,
  /** The marquee is a 3x3 grid. */
  panels: 9,
  /** The item grid is 2x2. */
  items: 4,
} as const;
