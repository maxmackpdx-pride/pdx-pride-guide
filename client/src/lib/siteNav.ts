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
     * OUTZ has an index plus two named outdoor destinations, so the group
     * provides a clear way to browse all currently published spots.
     */
    items: [
      { href: "/outz", label: "All OUTZ", accent: "orange" },
      { href: "/outz/rooster-rock", label: "Rooster Rock", accent: "orange" },
      { href: "/outz/sauvie-island", label: "Sauvie Island", accent: "orange" },
    ],
  },
  {
    type: "dropdown",
    id: "communities",
    label: "Z/ Communities",
    accent: "violet",
    /*
     * The featured card is retired: the panel is one plain column of pills
     * under a line of descriptive copy. Z/ now opens Communities only.
     */
    eyebrow: "Find your people",
    items: [
      { href: "/z", label: "All Communities", accent: "violet" },
    ],
  },
];

export type PageHeaderMeta = {
  section: string;
  title: string;
};

/** Breadcrumb section + H1 title for interior pages. */
export const PAGE_HEADERS: Record<string, PageHeaderMeta> = {
  "/events": { section: "EVENTZ", title: "EVENTZ" },
  "/schedule": { section: "EVENTZ", title: "My Schedule" },
  "/pride-work": { section: "Boards", title: "GIGZ" },
  "/gifting": { section: "Boards", title: "GIFTZ" },
  "/the-hauz": { section: "Boards", title: "THE HAÜZ" },
  "/spotted": { section: "Boards", title: "MIZZED CONNECTION" },
  "/directory": { section: "PLACEZ", title: "OUR PLACEZ" },
  "/outz": { section: "OUTZ", title: "Outdoors" },
  "/outz/rooster-rock": { section: "OUTZ", title: "Rooster Rock" },
  "/outz/sauvie-island": { section: "OUTZ", title: "Sauvie Island" },
  "/about": { section: "About", title: "About" },
  "/aboutz": { section: "About", title: "About" },
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
 * Destinations behind the mobile footer Z/ Communities tab sheet.
 *
 * Mirrors the desktop Communities menu. The phone bar has no Outz tab of its own,
 * so this sheet is also the door to OUTZ - but Outz is not in this list: it is
 * a drawer trigger the sheet renders itself, not a plain link.
 */
export const BOARD_NAV: NavLinkItem[] = [
  { href: "/z", label: "All Communities", accent: "violet" },
];

/**
 * OUTZ destinations for the mobile most-visited drawer, in list order.
 *
 * The handoff mock numbered three beaches, two of which are the same place
 * (the Sauvie Island page's beach is Collins Beach) and one of which has no
 * page at all. These are the OUTZ addresses that exist; the drawer numbers
 * them and closes with a link to the index.
 */
export const OUTZ_NAV: NavLinkItem[] = [
  { href: "/outz/rooster-rock", label: "Rooster Rock", accent: "orange" },
  { href: "/outz/sauvie-island", label: "Sauvie Island", accent: "orange" },
];

/** Where the drawer's "View All Outz" footer goes. */
export const OUTZ_INDEX = "/outz";

/** Destinations behind the mobile footer "Events" tab sheet. */
export const EVENTS_NAV: NavLinkItem[] = [
  { href: "/events", label: "Events" },
  { href: "/schedule", label: "My Schedule" },
  { href: "/submit", label: "Promoters" },
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
