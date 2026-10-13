import { filterHubFeedItems, type HubFeedItem, type HubFeedResponse, type HubFeedTab } from "./hubFeed";

/** SQLite CURRENT_TIMESTAMP is UTC; normalize it before comparing with ISO timestamps. */
export function hubActivityTime(value: string): number {
  const normalized = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)
    ? value.replace(" ", "T") + "Z" : value;
  return Date.parse(normalized);
}

export function decodeHubCursor(cursor?: string): { time: number; id: string | null } | null {
  if (!cursor) return null;
  const separator = cursor.indexOf("|");
  const time = hubActivityTime(separator < 0 ? cursor : cursor.slice(0, separator));
  if (!Number.isFinite(time)) return null;
  return { time, id: separator < 0 ? null : cursor.slice(separator + 1) };
}

export function pageHubActivity(items: HubFeedItem[], tab: HubFeedTab, limit: number, cursor?: string): Pick<HubFeedResponse, "items" | "nextCursor"> {
  const position = decodeHubCursor(cursor);
  const seen = new Set<string>();
  const eligible = filterHubFeedItems(items, tab).filter(item => {
    const time = hubActivityTime(item.createdAt);
    if (!Number.isFinite(time) || seen.has(item.id)) return false;
    seen.add(item.id);
    return !position || time < position.time || (time === position.time && position.id !== null && item.id < position.id);
  }).sort((a, b) => hubActivityTime(b.createdAt) - hubActivityTime(a.createdAt) || (a.id === b.id ? 0 : a.id < b.id ? 1 : -1));
  const page = eligible.slice(0, limit);
  const last = page[page.length - 1];
  return {
    items: page,
    nextCursor: eligible.length > limit && last ? `${new Date(hubActivityTime(last.createdAt)).toISOString()}|${last.id}` : null,
  };
}
