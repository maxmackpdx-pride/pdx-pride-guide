/**
 * The `z/` address system.
 *
 * Every board has one typeable, lowercase address in a single namespace. The
 * point is that a person can type `z/gifz` and land, and that the whole set
 * reads as one system rather than as a nav menu.
 *
 * Founder decision 2026-08-11. Supersedes the earlier position that `Z/` names
 * containers only (ZF-Z-NAMESPACE-2026-08-06 in the Foundation Library).
 *
 * Shared by client and server. Keep it free of imports and of anything read
 * from disk: the server bundles to a single CJS file, so a module-load disk
 * read works in dev and crashes the Railway deploy.
 */

export const Z_PREFIX = "z";

export type ZAddress = {
  /**
   * Canonical path after `z/`, ASCII and lowercase. Carries one slash for a
   * nested address (`out/nudest`).
   */
  path: string;
  /**
   * How the address is written for a person. This is the typeable ASCII address;
   * product identity may still use characters such as the umlaut in THE HAÜZ.
   */
  display: string;
  /** Human board name, matching the label already used in siteNav. */
  board: string;
  /**
   * The existing app route this address resolves to. Null means the address is
   * spoken for but no board is built yet.
   */
  route: string | null;
};

/**
 * The address map. Order is the order the namespace is presented in.
 *
 * Every entry is a board Tucker has approved. A routeless entry means the
 * product exists on the public roadmap at /next but has no page yet, so the
 * address resolves and says so.
 *
 * Do not add an address for a product that has not been approved, and never
 * write copy suggesting an address is reserved, held, or available to acquire.
 * Zaylist does not sell `z/` addresses and has approved no model in which it
 * ever would. An unbuilt address says the board is not built. Nothing more.
 */
export const Z_ADDRESSES: ZAddress[] = [
  { path: "happening", display: "z/happening", board: "Events", route: "/events" },
  { path: "hauz", display: "z/hauz", board: "THE HAÜZ", route: "/the-hauz" },
  { path: "market", display: "z/market", board: "For sale", route: null },
  { path: "gifz", display: "z/gifz", board: "GifZ", route: "/gifting" },
  { path: "gigz", display: "z/gigz", board: "Gigz", route: "/pride-work" },
  { path: "mizzed", display: "z/mizzed", board: "Mizzed Connection", route: "/spotted" },
  { path: "directory", display: "z/directory", board: "Directory", route: "/directory" },
  { path: "out", display: "z/out", board: "Outdoors", route: null },
  { path: "out/nudest", display: "z/out/nudest", board: "Nude beaches", route: "/nude-beaches" },
  { path: "spaces", display: "z/spaces", board: "Clubs and groups", route: null },
];

/**
 * `z/haüz` resolves to the ASCII `z/hauz`, and the umlaut is display only.
 *
 * A percent-encoded canonical URL (`/z/ha%C3%BCz`) is hostile to typing, to
 * sharing in plain text, and to reading analytics. Both forms must not live as
 * separate pages, so the encoded form redirects to this one.
 */
export const Z_ENCODED_ALIASES: Record<string, string> = {
  "/z/ha%C3%BCz": "/z/hauz",
  "/z/haüz": "/z/hauz",
  // Singular shipped briefly before Tucker confirmed the plural address.
  "/z/space": "/z/spaces",
};

/**
 * Slugs nobody may ever hold. A namespace without a reserved list is one where
 * somebody takes `z/admin`. Nothing user-creatable ships yet; the list exists so
 * the door is shut before it can be walked through.
 */
export const Z_RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // Every address in the map, including the first segment of nested ones.
  ...Z_ADDRESSES.flatMap(a => a.path.split("/")),
  // Platform and account surfaces.
  "admin", "api", "settings", "dashboard", "inbox",
  "login", "logout", "signup", "u", "new", "edit", "delete",
  // Marketing and static pages.
  "about", "contact", "legal", "access", "sponsors", "next", "darkroom",
  "help", "support",
  // The brand itself.
  "zaylist", "zay", "z",
]);

/** Full in-app URL for an address path. `zUrl("gifz")` gives `/z/gifz`. */
export function zUrl(path: string): string {
  return `/${Z_PREFIX}/${path}`;
}

/** The address at this path, or undefined. */
export function findZAddress(path: string): ZAddress | undefined {
  const clean = path.replace(/^\/+|\/+$/g, "").toLowerCase();
  return Z_ADDRESSES.find(a => a.path === clean);
}

/** The address that points at an existing app route, for board headers. */
export function zAddressForRoute(route: string): ZAddress | undefined {
  const clean = route.split("?")[0].replace(/\/+$/, "") || "/";
  return Z_ADDRESSES.find(a => a.route === clean);
}

/**
 * True when a slug may not be handed out. Checked case-insensitively against
 * the first path segment, so `z/admin/anything` is refused too.
 */
export function isReservedZSlug(slug: string): boolean {
  const first = slug.replace(/^\/+/, "").split("/")[0]?.toLowerCase() ?? "";
  return first.length === 0 || Z_RESERVED_SLUGS.has(first);
}

/** Addresses with a board behind them today. */
export function routedZAddresses(): ZAddress[] {
  return Z_ADDRESSES.filter(a => a.route !== null);
}
