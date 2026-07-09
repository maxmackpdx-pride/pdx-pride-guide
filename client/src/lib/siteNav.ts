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
  { type: "link", href: "/events", label: "Events" },
  { type: "link", href: "/directory", label: "Directory" },
  {
    type: "dropdown",
    id: "boards",
    label: "Boards",
    items: [
      { href: "/pride-work", label: "Gig Board" },
      { href: "/gifting", label: "Gifting" },
      { href: "/spotted", label: "Spotted!" },
    ],
  },
  { type: "link", href: "/schedule", label: "Schedule" },
  { type: "link", href: "/about", label: "About" },
  { type: "link", href: "/submit", label: "Submit" },
];

export type PageHeaderMeta = {
  section: string;
  title: string;
};

/** Breadcrumb section + H1 title for interior pages. */
export const PAGE_HEADERS: Record<string, PageHeaderMeta> = {
  "/events": { section: "Events", title: "Events" },
  "/schedule": { section: "Events", title: "Schedule" },
  "/pride-work": { section: "Boards", title: "Gig Board" },
  "/gifting": { section: "Boards", title: "Gifting" },
  "/spotted": { section: "Boards", title: "Spotted!" },
  "/directory": { section: "Directory", title: "Queer Directory" },
  "/about": { section: "About", title: "About" },
  "/contact": { section: "About", title: "Contact" },
  "/sponsors": { section: "About", title: "Sponsors" },
  "/access": { section: "About", title: "Access & Safety" },
  "/submit": { section: "Submit", title: "Submit an Event" },
  "/dashboard": { section: "Account", title: "Your Hub" },
  "/settings/notifications": { section: "Account", title: "Notification settings" },
  "/inbox": { section: "Account", title: "Inbox" },
};

export function pageHeaderForPath(path: string): PageHeaderMeta | null {
  const base = path.split("?")[0].replace(/\/$/, "") || "/";
  if (PAGE_HEADERS[base]) return PAGE_HEADERS[base];
  if (base.startsWith("/submit/")) return { section: "Submit", title: "Submit" };
  if (base.startsWith("/u/")) return { section: "Account", title: "Profile" };
  return null;
}