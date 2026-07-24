export type NavLinkItem = { href: string; label: string };

export type NavDropdownGroup = {
  id: string;
  label: string;
  items: NavLinkItem[];
};

export type NavEntry =
  | { type: "link"; href: string; label: string }
  | { type: "dropdown"; id: string; label: string; items: NavLinkItem[] };

/** Primary nav — labels match on-page titles where possible. */
export const PRIMARY_NAV: NavEntry[] = [
  { type: "link", href: "/", label: "Home" },
  { type: "link", href: "/about", label: "About" },
  { type: "link", href: "/events", label: "Events" },
  { type: "link", href: "/directory", label: "Places" },
  { type: "link", href: "/nude-beaches", label: "Nude Beaches" },
  {
    type: "dropdown",
    id: "boards",
    label: "Boards",
    items: [
      { href: "/pride-work", label: "Gig Board" },
      { href: "/gifting", label: "Gifting" },
      { href: "/spotted", label: "Missed Connections" },
    ],
  },
  { type: "link", href: "/submit", label: "Promoters" },
];

export type PageHeaderMeta = {
  section: string;
  title: string;
};

/** Breadcrumb section + H1 title for interior pages. */
export const PAGE_HEADERS: Record<string, PageHeaderMeta> = {
  "/events": { section: "Events", title: "Events" },
  "/schedule": { section: "Events", title: "My Schedule" },
  "/pride-work": { section: "Boards", title: "Gig Board" },
  "/gifting": { section: "Boards", title: "Gifting" },
  "/spotted": { section: "Boards", title: "Missed Connections" },
  "/directory": { section: "Places", title: "Directory" },
  "/nude-beaches": { section: "Explore", title: "Nude Beaches" },
  "/about": { section: "About", title: "About" },
  "/resume": { section: "About", title: "Resume" },
  "/contact": { section: "About", title: "Contact" },
  "/sponsors": { section: "About", title: "Sponsors" },
  "/access": { section: "About", title: "Access & Safety" },
  "/submit": { section: "Submit", title: "Submit an Event" },
  "/dashboard": { section: "Account", title: "Your Hub" },
  "/settings/notifications": { section: "Account", title: "Notification settings" },
  "/inbox": { section: "Account", title: "Inbox" },
};

export const BOARD_NAV: NavLinkItem[] = [
  { href: "/pride-work", label: "Gig Board" },
  { href: "/gifting", label: "Gifting" },
  { href: "/spotted", label: "Missed Connections" },
];

/** Destinations behind the mobile footer "Events" tab sheet (Beaches folded in). */
export const EVENTS_NAV: NavLinkItem[] = [
  { href: "/events", label: "Events" },
  { href: "/schedule", label: "My Schedule" },
  { href: "/nude-beaches", label: "Nude Beaches" },
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