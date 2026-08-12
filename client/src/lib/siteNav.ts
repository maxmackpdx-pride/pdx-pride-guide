export type NavLinkItem = { href: string; label: string };

export type NavDropdownGroup = {
  id: string;
  label: string;
  items: NavLinkItem[];
};

export type NavEntry =
  | { type: "link"; href: string; label: string }
  | { type: "dropdown"; id: string; label: string; items: NavLinkItem[] };

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
  /**
   * Boards is one address, not a dropdown. Every board already has a z/ address
   * (ZF-Z-NAMESPACE-2026-08-11), and /z lists all of them with live counts, so a
   * four item menu was a shorter, staler copy of a page that already exists.
   * navLinkActive matches /z and every /z/... address, so this stays lit on any
   * board reached through the namespace.
   */
  { type: "link", href: "/z", label: "z/" },
  { type: "link", href: "/next", label: "NEXT" },
];

export type PageHeaderMeta = {
  section: string;
  title: string;
};

/** Breadcrumb section + H1 title for interior pages. */
export const PAGE_HEADERS: Record<string, PageHeaderMeta> = {
  "/events": { section: "Events", title: "Events" },
  "/schedule": { section: "Events", title: "My Schedule" },
  "/pride-work": { section: "Boards", title: "Gigz" },
  "/gifting": { section: "Boards", title: "GifZ" },
  "/the-hauz": { section: "Boards", title: "THE HAÜZ" },
  "/spotted": { section: "Boards", title: "Mizzed Connection" },
  "/directory": { section: "Places", title: "Directory" },
  "/z/out/rooster-rock": { section: "Z/OUT", title: "Rooster Rock" },
  "/z/out/sauvie-island": { section: "Z/OUT", title: "Sauvie Island" },
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
  { href: "/pride-work", label: "Gigz" },
  { href: "/gifting", label: "GifZ" },
  { href: "/the-hauz", label: "THE HAÜZ" },
  { href: "/spotted", label: "Mizzed Connection" },
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
