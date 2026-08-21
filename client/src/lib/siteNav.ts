/**
 * Nav accent names. Each maps to an existing token pair in index.css, so calm
 * mode desaturates the nav for free rather than needing its own overrides.
 */
export type NavAccent = "lime" | "magenta" | "cyan" | "blue" | "orange" | "violet" | "green";

export type NavLinkItem = { href: string; label: string; accent?: NavAccent };

export type NavDropdownGroup = {
  id: string;
  label: string;
  items: NavLinkItem[];
};

/** The panel beside a mega dropdown's item column. */
export type NavFeature = { kicker: string; title: string; body: string; href: string };

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
      feature?: NavFeature;
    };

/**
 * Primary nav - labels match on-page titles where possible.
 *
 * Every entry carries its own accent: the current page glows in it, and the
 * rest are hairline pills that light up in it on hover.
 */
export const PRIMARY_NAV: NavEntry[] = [
  { type: "link", href: "/", label: "Home", accent: "lime" },
  { type: "link", href: "/about", label: "About", accent: "magenta" },
  {
    type: "dropdown",
    id: "events",
    label: "Eventz",
    accent: "cyan",
    items: [
      { href: "/events", label: "All Eventz", accent: "cyan" },
      { href: "/schedule", label: "My Schedule", accent: "lime" },
      { href: "/submit", label: "Promoters", accent: "orange" },
    ],
  },
  { type: "link", href: "/directory", label: "Placez", accent: "blue" },
  {
    type: "dropdown",
    id: "outz",
    label: "Outz",
    accent: "orange",
    eyebrow: "Most Visited",
    /*
     * The mockup showed three destinations and a "View All Outz" footer. OUTZ
     * has exactly two addresses and no index page, so the list is the whole
     * set and the footer link would have nowhere to go.
     */
    items: [
      { href: "/z/out/rooster-rock", label: "Rooster Rock", accent: "orange" },
      { href: "/z/out/sauvie-island", label: "Sauvie Island", accent: "orange" },
    ],
  },
  {
    type: "dropdown",
    id: "zspace",
    label: "Z/Space",
    accent: "violet",
    items: [
      { href: "/the-hauz", label: "Housing", accent: "cyan" },
      { href: "/pride-work", label: "Gigz", accent: "violet" },
      { href: "/sellz", label: "Sellz", accent: "green" },
      { href: "/spotted", label: "Mizzed", accent: "magenta" },
      { href: "/gifting", label: "Giftz", accent: "lime" },
    ],
    feature: {
      kicker: "Featured",
      title: "Z/Space",
      body: "Every board, one place",
      href: "/z",
    },
  },
];

export type PageHeaderMeta = {
  section: string;
  title: string;
};

/** Breadcrumb section + H1 title for interior pages. */
export const PAGE_HEADERS: Record<string, PageHeaderMeta> = {
  "/events": { section: "Events", title: "EVENTZ" },
  "/schedule": { section: "Events", title: "My Schedule" },
  "/pride-work": { section: "Boards", title: "GIGZ" },
  "/gifting": { section: "Boards", title: "GIFTZ" },
  "/the-hauz": { section: "Boards", title: "THE HAÜZ" },
  "/spotted": { section: "Boards", title: "MIZZED CONNECTION" },
  "/directory": { section: "Places", title: "OUR PLACEZ" },
  "/z/out/rooster-rock": { section: "OUTZ", title: "Rooster Rock" },
  "/z/out/sauvie-island": { section: "OUTZ", title: "Sauvie Island" },
  "/next": { section: "Explore", title: "Next" },
  "/darkroom": { section: "Explore", title: "Next" },
  "/about": { section: "About", title: "About" },
  "/resume": { section: "About", title: "Resume" },
  "/contact": { section: "About", title: "Contact" },
  "/sponsors": { section: "About", title: "Sponsors" },
  "/access": { section: "About", title: "Access & Safety" },
  "/submit": { section: "Submit", title: "Submit an Event" },
  "/dashboard": { section: "Account", title: "Your Hub" },
  "/settings/notifications": { section: "Account", title: "Notification settings" },
  "/inbox": { section: "Account", title: "Inbox" },
  "/z": { section: "Zaylist", title: "z/" },
};

/**
 * Destinations behind the mobile footer "Boards" tab sheet.
 *
 * The desktop nav collapsed its Boards dropdown into a single /z link. The
 * mobile bar keeps a sheet, because its tab already opens one, so /z leads the
 * list rather than replacing it: on a phone a direct tap to a board is worth
 * keeping, and the namespace still gets a door.
 */
export const BOARD_NAV: NavLinkItem[] = [
  { href: "/z", label: "z/ all boards" },
  { href: "/pride-work", label: "GIGZ" },
  { href: "/gifting", label: "GIFTZ" },
  { href: "/the-hauz", label: "THE HAÜZ" },
  { href: "/spotted", label: "MIZZED CONNECTION" },
];

/** Destinations behind the mobile footer "Events" tab sheet. */
export const EVENTS_NAV: NavLinkItem[] = [
  { href: "/events", label: "Events" },
  { href: "/schedule", label: "My Schedule" },
  { href: "/submit", label: "Promoters" },
  { href: "/next", label: "Next" },
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
