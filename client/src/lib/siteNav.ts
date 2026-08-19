export type NavLinkItem = { href: string; label: string };

export type NavDropdownGroup = {
  id: string;
  label: string;
  items: NavLinkItem[];
};

export type NavEntry =
  | { type: "link"; href: string; label: string }
  | { type: "dropdown"; id: string; label: string; items: NavLinkItem[] };

const Z_NAV: NavLinkItem[] = [
  { href: "/z", label: "All z/ addresses" },
  { href: "/z/happening", label: "z/happening · EVENTZ" },
  { href: "/z/hauz", label: "z/hauz · THE HAÜZ" },
  { href: "/z/sellz", label: "z/sellz · SELLZ" },
  { href: "/z/gifz", label: "z/gifz · GIFTZ" },
  { href: "/z/gigz", label: "z/gigz · GIGZ" },
  { href: "/z/mizzed", label: "z/mizzed · MIZZED CONNECTION" },
  { href: "/z/placez", label: "z/placez · OUR PLACEZ" },
  { href: "/z/out", label: "z/out · OUTZ" },
  { href: "/z/squadz", label: "z/squadz · MY SQUADZ" },
  { href: "/z/dark", label: "z/dark · ZAYDARK" },
];

/** Primary nav - labels match on-page titles where possible. */
export const PRIMARY_NAV: NavEntry[] = [
  { type: "link", href: "/about", label: "About" },
  {
    type: "dropdown",
    id: "events",
    label: "Events",
    items: [
      { href: "/events", label: "Events" },
      { href: "/schedule", label: "My Schedule" },
      { href: "/submit", label: "Promoters" },
    ],
  },
  {
    type: "dropdown",
    id: "places",
    label: "Places",
    items: [
      { href: "/directory", label: "Directory" },
    ],
  },
  {
    type: "dropdown",
    id: "z-addresses",
    label: "z/",
    items: Z_NAV,
  },
  { type: "link", href: "/next", label: "NEXT" },
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
