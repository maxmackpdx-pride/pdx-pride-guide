/**
 * Nav tripwire (board 34). Runs inside `npm run build`, so a nav that lost its
 * links, or a Nav.tsx swapped for a placeholder, fails before Railway ships it.
 *
 * - Every destination in the nav model (lib/siteNav.ts) must land on a route
 *   declared in App.tsx.
 * - Nav.tsx must still render the model inside the shared NavShell.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BOARD_NAV, MOBILE_TOP_NAV, PRIMARY_NAV, type NavEntry, type NavLinkItem } from "../client/src/lib/siteNav";

const ROOT = join(import.meta.dirname, "..");

export function navDestinations(): string[] {
  const hrefs = new Set<string>();
  const add = (item: NavLinkItem) => hrefs.add(item.href);
  const walk = (entries: NavEntry[]) => {
    for (const e of entries) {
      if (e.type === "link") add(e);
      else e.items.forEach(add);
    }
  };
  walk(PRIMARY_NAV);
  walk(MOBILE_TOP_NAV);
  BOARD_NAV.forEach(add);
  return [...hrefs];
}

export function appRoutePatterns(appSrc: string): RegExp[] {
  return [...appSrc.matchAll(/<Route\s+path="([^"]+)"/g)].map(([, path]) => {
    const body = path
      .split("/")
      .map((seg) => (seg.startsWith(":") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
      .join("/");
    return new RegExp(`^${body}/?$`);
  });
}

export function checkNav(
  appSrc = readFileSync(join(ROOT, "client/src/App.tsx"), "utf8"),
  navSrc = readFileSync(join(ROOT, "client/src/components/Nav.tsx"), "utf8"),
): string[] {
  const problems: string[] = [];
  const destinations = navDestinations();
  if (destinations.length < 8) problems.push(`nav model has only ${destinations.length} destinations`);
  const routes = appRoutePatterns(appSrc);
  for (const href of destinations) {
    const path = href.split(/[?#]/)[0] || "/";
    if (!routes.some((re) => re.test(path))) problems.push(`nav links to ${href}, which no App route serves`);
  }
  for (const [needle, why] of [
    ["<NavShell", "Nav.tsx no longer renders NavShell"],
    ["PRIMARY_NAV", "Nav.tsx no longer reads PRIMARY_NAV"],
    ["MOBILE_TOP_NAV", "Nav.tsx no longer reads MOBILE_TOP_NAV"],
  ] as const) {
    if (!navSrc.includes(needle)) problems.push(why);
  }
  if (navSrc.split("\n").length < 200) problems.push("Nav.tsx looks like a stub");
  return problems;
}

export function assertNav(): number {
  const problems = checkNav();
  if (problems.length) throw new Error(`nav tripwire:\n  ${problems.join("\n  ")}`);
  return navDestinations().length;
}
