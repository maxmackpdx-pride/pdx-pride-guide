import { apiRequest } from "@/lib/queryClient";
import type { DrawerTopEvent } from "@shared/drawerTop";
import { featuredFromFeeds, type OutzideBuddy, type OutzideFeedItem } from "@shared/outzideDrawer";

/** Agent-callable helpers that load the live Outzide featured feeds. */
export async function fetchOutzideFeatured(): Promise<ReturnType<typeof featuredFromFeeds>> {
  const [buddies, feed] = await Promise.all([
    apiRequest("GET", "/api/outz/buddies").then(r => r.json() as Promise<OutzideBuddy[]>),
    apiRequest("GET", "/api/outz/feed").then(async r => {
      const body = await r.json();
      return (Array.isArray(body) ? body : body?.items ?? []) as OutzideFeedItem[];
    }),
  ]);
  return featuredFromFeeds(buddies ?? [], feed ?? []);
}

export function openOutzideCountdownItem(
  item: DrawerTopEvent & { href?: string },
  assign: (href: string) => void = href => { window.location.assign(href); },
): string {
  const href = item.href || `/events?event=${item.id}`;
  assign(href);
  return href;
}

export function outzideDrawerApi() {
  return { fetchOutzideFeatured, openOutzideCountdownItem };
}
