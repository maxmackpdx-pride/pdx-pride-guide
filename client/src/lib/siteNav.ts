/**
 * Nav accent names. Each maps to an existing token pair in index.css, so calm
 * mode desaturates the nav for free rather than needing its own overrides.
 */
export type NavAccent =
  | "lime" | "magenta" | "cyan" | "blue" | "orange" | "violet" | "green"
  /* Room accents resolve to --room-* in ds/tokens/rooms.css. */
  | "gigz" | "giftz" | "sellz" | "hauz" | "mizzed";

export type NavLinkItem = { href: string; label: string; accent?: NavAccent };

export type NavDropdownGroup = {
  id: string;
  label: string;
  items: NavLinkItem[];
};

export type NavEntry =
  | { type: "link"; href: string; label: string; accent?: NavAccent }
  | {
      type: "dropdown";
      id: string;
      label: string;
      accent?: NavAccent;
      items: NavLinkItem[];
      /** Mono label above the items, e.g. "Most Visited". */
      eyebrow?: string;
    };

/** The shared Boards dropdown: housing and Z/ List are independent destinations. */
export const BOARD_NAV: NavLinkItem[] = [
  { href: "/mizzed", label: "Mizzed", accent: "mizzed" },
  { href: "/giftz", label: "Giftz", accent: "giftz" },
  { href: "/sellz", label: "Sellz", accent: "sellz" },
  { href: "/gigz", label: "Gigz", accent: "gigz" },
];

/** Every board room, including THE HAÜZ, for the Boards menus. */
export const BOARDS_MENU: NavLinkItem[] = [...BOARD_NAV, { href: "/the-hauz", label: "The Haüz", accent: "hauz" }];

/**
 * Primary nav - labels match on-page titles where possible.
 *
 * Every entry carries its own accent: current destinations use an accent rim,
 * with text-only buttons on desktop and icon captions in the mobile dock.
 */
export const PRIMARY_NAV: NavEntry[] = [
  { type: "link", href: "/", label: "Home", accent: "lime" },
  {
    type: "dropdown",
    id: "events",
    label: "Eventz",
    accent: "cyan",
    items: [
      { href: "/events", label: "All Eventz", accent: "cyan" },
      { href: "/schedule", label: "My Schedule", accent: "lime" },
      { href: "/submit", label: "Submit an Event", accent: "orange" },
    ],
  },
  { type: "link", href: "/map", label: "Mapz", accent: "blue" },
  {
    type: "dropdown",
    id: "outz",
    label: "OutZide",
    accent: "orange",
    eyebrow: "Most Visited",
    /*
     * OUTZ has an index plus two named outdoor destinations, so the group
     * provides a clear way to browse all currently published spots.
     */
    items: [
      { href: "/outzide", label: "All OutZide", accent: "orange" },
      { href: "/outzide/rooster-rock", label: "Rooster Rock", accent: "orange" },
      { href: "/outzide/sauvie-island", label: "Sauvie Island", accent: "orange" },
    ],
  },
  /* Guests reach every room from the top row; About lives in the footer. */
  { type: "dropdown", id: "boards", label: "Boards", accent: "magenta", items: BOARDS_MENU },
  { type: "link", href: "/z", label: "Z/Lists", accent: "violet" },
];

/** Phone header shares two dropdowns and the Z/Lists destination in one rail. */
export const MOBILE_TOP_NAV: NavEntry[] = [
  {
    type: "dropdown",
    id: "home",
    label: "Home",
    accent: "lime",
    items: [
      { href: "/", label: "Home", accent: "lime" },
      { href: "/about", label: "About", accent: "magenta" },
    ],
  },
  {
    type: "dropdown",
    id: "boards",
    label: "Boards",
    accent: "magenta",
    items: BOARDS_MENU,
  },
  { type: "link", href: "/z", label: "Z/Lists", accent: "violet" },
];

export type PageHeaderMeta = {
  section: string;
  title: string;
};

/** Breadcrumb section + H1 title for interior pages. */
export const PAGE_HEADERS: Record<string, PageHeaderMeta> = {
  "/events": { section: "EVENTZ", title: "EVENTZ" },
  "/schedule": { section: "EVENTZ", title: "My Schedule" },
  "/gigz": { section: "Boards", title: "GIGZ" },
  "/giftz": { section: "Boards", title: "GIFTZ" },
  "/sellz": { section: "Boards", title: "SELLZ" },
  "/the-hauz": { section: "Boards", title: "THE HAÜZ" },
  "/mizzed": { section: "Boards", title: "MIZZED CONNECTION" },
  "/directory": { section: "PLACEZ", title: "OUR PLACEZ" },
  "/outzide": { section: "OutZide", title: "OutZide" },
  "/outzide/rooster-rock": { section: "OutZide", title: "Rooster Rock" },
  "/outzide/sauvie-island": { section: "OutZide", title: "Sauvie Island" },
  "/about": { section: "About", title: "About" },
  "/aboutz": { section: "About", title: "About" },
  "/resume": { section: "About", title: "Resume" },
  "/contact": { section: "About", title: "Contact" },
  "/sponsors": { section: "About", title: "Sponsors" },
  "/access": { section: "About", title: "Access & Safety" },
  "/submit": { section: "Eventz", title: "Submit an Event" },
  "/dashboard": { section: "Account", title: "Your Hub" },
  "/settings/notifications": { section: "Account", title: "Notification settings" },
  "/inbox": { section: "Account", title: "Inbox" },
  "/z": { section: "Zaylist", title: "Z/ List" },
};

/**
 * OUTZ destinations for the mobile most-visited drawer, in list order.
 *
 * The handoff mock numbered three beaches, two of which are the same place
 * (the Sauvie Island page's beach is Collins Beach) and one of which has no
 * page at all. These are the OUTZ addresses that exist; the drawer numbers
 * them and closes with a link to the index.
 */
export const OUTZ_NAV: NavLinkItem[] = [
  { href: "/outzide/rooster-rock", label: "Rooster Rock", accent: "orange" },
  { href: "/outzide/sauvie-island", label: "Sauvie Island", accent: "orange" },
];

/** Where the drawer's "View All Outz" footer goes. */
export const OUTZ_INDEX = "/outzide";

/** Destinations behind the mobile footer "Events" tab sheet. */
export const EVENTS_NAV: NavLinkItem[] = [
  { href: "/events", label: "Eventz" },
  { href: "/schedule", label: "My Schedule" },
  { href: "/submit", label: "Submit an Event" },
];

export function navLinkActive(location: string, href: string) {
  // Home must not match every path (everything starts with "/").
  if (href === "/") {
    return location === "/" || location.startsWith("/?");
  }
  return location === href || location.startsWith(`${href}?`) || location.startsWith(`${href}/`);
}

export function pageHeaderForPath(path: string): PageHeaderMeta | null {
  const base = path.split("?")[0].replace(/\/$/, "") || "/";
  if (PAGE_HEADERS[base]) return PAGE_HEADERS[base];
  if (base.startsWith("/submit/")) return { section: "Submit", title: "Submit" };
  if (base.startsWith("/u/")) return { section: "Account", title: "Profile" };
  return null;
}
