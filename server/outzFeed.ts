import { sqlite, storage } from "./storage";
import "./outzSocial";
import { beachCheckinDateOptions, formatRiverBratsHour } from "@shared/riverBrats";
import { outzPlaceHref, type OutzSnapshot } from "@shared/outz";
import type { OutzFeedItem } from "@shared/outzFeed";

/** Only public destination walls and public carpools; never private chat content. */
export function getOutzCommunityFeed(snapshot: OutzSnapshot, viewerUserId?: number, now = Date.now()): OutzFeedItem[] {
  const places = new Map([...snapshot.destinations, ...snapshot.catalog, ...snapshot.communityStays].map(p => [p.id, p]));
  const beaches = [{ id: "rooster-rock", name: "Rooster Rock" }, { id: "sauvie-island", name: "Sauvie Island" }];
  const name = (id: string) => places.get(id)?.name || beaches.find(b => b.id === id)?.name;
  const href = (id: string) => beaches.some(b => b.id === id) ? `/outz/${id}` : outzPlaceHref({ id, name: name(id)! });
  const allowed = (id: number) => viewerUserId == null || viewerUserId === id || !storage.isMemberInteractionBlocked(viewerUserId, id);
  const dates = beachCheckinDateOptions(now), today = dates[0], lastDay = dates[dates.length - 1];
  const items: OutzFeedItem[] = [];
  const posts = sqlite.prepare(`SELECT p.*, u.display_name AS displayName, u.username
    FROM outz_wall_posts p JOIN users u ON u.id=p.user_id
    WHERE p.created_at >= ? ORDER BY p.created_at DESC`).all(new Date(now - 30 * 86400_000).toISOString()) as Array<{
      id: number; place_id: string; user_id: number; post_kind: string; body: string; trip_date: string | null;
      created_at: string; displayName: string | null; username: string;
    }>;
  for (const p of posts) {
    if (p.post_kind === "CARPOOL" && p.trip_date && p.trip_date > lastDay) continue;
    if (!name(p.place_id) || !allowed(p.user_id) || (p.post_kind !== "TRIP_NOTE" && p.trip_date && p.trip_date < today)) continue;
    items.push({ id: `post:${p.id}`, kind: p.post_kind === "CARPOOL" ? "carpool" : "post",
      title: p.post_kind === "CARPOOL" ? "Carpool" : p.post_kind === "LOOKING_FOR_COMPANY" ? "Looking for company" : "Trip note",
      body: p.body, author: p.displayName || p.username, placeName: name(p.place_id)!, href: `${href(p.place_id)}#outz-wall-heading`,
      createdAt: p.created_at, ...(p.trip_date ? { tripDate: p.trip_date } : {}) });
  }
  const checkins = sqlite.prepare(`SELECT user_id, place_id, calendar_date, created_at FROM outz_checkins
    WHERE is_active=1 AND expires_at > ? AND calendar_date BETWEEN ? AND ?
    UNION ALL SELECT user_id, beach_id AS place_id, calendar_date, created_at FROM beach_checkins
    WHERE is_active=1 AND expires_at > ? AND calendar_date BETWEEN ? AND ?`).all(
      new Date(now).toISOString(), today, lastDay, new Date(now).toISOString(), today, lastDay,
    ) as Array<{user_id: number; place_id: string; calendar_date: string; created_at: string}>;
  const groups = new Map<string, {placeId: string; date: string; users: Set<number>; createdAt: string}>();
  for (const c of checkins) {
    if (!name(c.place_id) || !allowed(c.user_id)) continue;
    const key = `${c.place_id}:${c.calendar_date}`;
    const g = groups.get(key) || { placeId: c.place_id, date: c.calendar_date, users: new Set<number>(), createdAt: c.created_at };
    g.users.add(c.user_id); if (c.created_at > g.createdAt) g.createdAt = c.created_at; groups.set(key, g);
  }
  for (const [key, g] of groups) items.push({ id: `checkin:${key}`, kind: "checkin", title: `${g.users.size} ${g.users.size === 1 ? "person planning" : "people planning"} a visit`,
    body: "Open the destination to see the plan or add your check-in.", placeName: name(g.placeId)!, href: href(g.placeId), createdAt: g.createdAt, tripDate: g.date });
  for (const beach of beaches) for (const date of dates) {
    for (const p of storage.getBeachCarpoolPosts(beach.id, date, viewerUserId)) {
      items.push({ id: `beach-carpool:${p.id}`, kind: "carpool", title: p.post_type === "OFFERING_RIDE" ? "Offering a ride" : "Looking for a ride",
        body: [p.direction === "FROM_BEACH" ? "From the beach" : "To the beach", p.departure_area, formatRiverBratsHour(p.leave_hour), p.note].filter(Boolean).join(" · "),
        author: p.displayName || p.username, placeName: beach.name, href: href(beach.id), tripDate: date, createdAt: p.created_at });
    }
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
