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
  {
    type: "dropdown",
    id: "portland",
    label: "Portland",
    items: [
      { href: "/directory", label: "Directory" },
      { href: "/schedule", label: "Schedule" },
      { href: "/about", label: "About" },
    ],
  },
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
  "/directory": { section: "Portland", title: "Queer Directory" },
  "/about": { section: "Portland", title: "About" },
  "/submit": { section: "Submit", title: "Submit an Event" },
  "/dashboard": { section: "Account", title: "Your Hub" },
  "/inbox": { section: "Account", title: "Inbox" },
};

export function pageHeaderForPath(path: string): PageHeaderMeta | null {
  const base = path.split("?")[0].replace(/\/$/, "") || "/";
  if (PAGE_HEADERS[base]) return PAGE_HEADERS[base];
  if (base.startsWith("/submit/")) return { section: "Submit", title: "Submit" };
  if (base.startsWith("/u/")) return { section: "Account", title: "Profile" };
  return null;
}