import { sqlite, storage } from "./storage";
import {
  formatBeachGoingChip,
  pacificTodayDate,
  riverBratsChatAccessFromDates,
  riverBratsChatClosesAtIso,
} from "@shared/riverBrats";

type OutzCheckinInput = {
  userId: number;
  placeId: string;
  arrivalHour: number;
  departHour: number;
  note: string | null;
  calendarDate: string;
  isAnonymous: boolean;
};

function ensureOutzSocialSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS outz_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        place_id TEXT NOT NULL,
        arrival_hour INTEGER NOT NULL,
        depart_hour INTEGER NOT NULL,
        note TEXT,
        calendar_date TEXT NOT NULL,
        is_anonymous INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT ''
      );
      CREATE UNIQUE INDEX IF NOT EXISTS outz_checkin_user_day_idx
        ON outz_checkins(user_id, place_id, calendar_date);
      CREATE INDEX IF NOT EXISTS outz_checkin_place_day_idx
        ON outz_checkins(place_id, calendar_date, is_active);
      CREATE TABLE IF NOT EXISTS outz_chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place_id TEXT NOT NULL,
        calendar_date TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS outz_chat_place_date_idx
        ON outz_chat_messages(place_id, calendar_date, created_at);
      CREATE TABLE IF NOT EXISTS outz_place_ratings (
        place_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        updated_at TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (place_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS outz_wall_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        post_kind TEXT NOT NULL,
        body TEXT NOT NULL,
        trip_date TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS outz_wall_posts_place_idx
        ON outz_wall_posts(place_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS outz_wall_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS outz_wall_comments_post_idx
        ON outz_wall_comments(post_id, created_at ASC);
    `);
  } catch (error) {
    console.error("[outz-social] schema migration failed:", error);
  }
}
ensureOutzSocialSchema();

export function expireOutzCheckins() {
  sqlite.prepare("UPDATE outz_checkins SET is_active = 0 WHERE is_active = 1 AND expires_at <= ?")
    .run(new Date().toISOString());
}

export function getOutzCheckins(placeId: string, calendarDate: string, viewerUserId?: number) {
  expireOutzCheckins();
  const rows = sqlite.prepare(`
    SELECT c.id, c.user_id AS userId, c.place_id AS placeId, c.arrival_hour AS arrivalHour,
           c.depart_hour AS departHour, c.note, c.calendar_date AS calendarDate,
           c.is_anonymous AS isAnonymous, c.created_at AS createdAt,
           u.username, u.display_name AS displayName, u.avatar_choice AS avatarChoice, u.photo_url AS photoUrl
    FROM outz_checkins c
    JOIN users u ON u.id = c.user_id
    WHERE c.place_id = ? AND c.calendar_date = ? AND c.is_active = 1
    ORDER BY c.arrival_hour ASC, c.created_at ASC
  `).all(placeId, calendarDate) as any[];
  const visibleRows = viewerUserId == null
    ? rows
    : rows.filter(row => row.userId === viewerUserId || !storage.isMemberInteractionBlocked(viewerUserId, row.userId));
  const viewerCheckedIn = viewerUserId != null && visibleRows.some(row => row.userId === viewerUserId);
  return visibleRows.map(row => {
    const isMine = viewerUserId != null && row.userId === viewerUserId;
    const shouldMask = !isMine && (!viewerCheckedIn || Boolean(row.isAnonymous));
    return shouldMask
      ? { ...row, username: "anonymous", displayName: "Anonymous", photoUrl: null, avatarChoice: null, isAnonymous: true, masked: true, isMine: false }
      : { ...row, isAnonymous: Boolean(row.isAnonymous), masked: false, isMine };
  });
}

export function getOutzCheckinByUser(placeId: string, userId: number, calendarDate: string) {
  expireOutzCheckins();
  return sqlite.prepare(`
    SELECT * FROM outz_checkins
    WHERE place_id = ? AND user_id = ? AND calendar_date = ? AND is_active = 1
  `).get(placeId, userId, calendarDate) as any | undefined;
}

export function getOutzChatDatesForUser(placeId: string, userId: number) {
  expireOutzCheckins();
  const now = new Date().toISOString();
  const rows = sqlite.prepare(`
    SELECT calendar_date AS calendarDate FROM outz_checkins
    WHERE place_id = ? AND user_id = ? AND is_active = 1 AND is_anonymous = 0 AND expires_at > ?
    ORDER BY calendar_date ASC
  `).all(placeId, userId, now) as Array<{ calendarDate: string }>;
  return rows.map(row => String(row.calendarDate));
}

export function upsertOutzCheckin(data: OutzCheckinInput) {
  const createdAt = new Date().toISOString();
  const expiresAt = riverBratsChatClosesAtIso(data.calendarDate);
  const existing = sqlite.prepare(`
    SELECT id FROM outz_checkins WHERE user_id = ? AND place_id = ? AND calendar_date = ?
  `).get(data.userId, data.placeId, data.calendarDate) as { id: number } | undefined;
  if (existing) {
    sqlite.prepare(`
      UPDATE outz_checkins
      SET arrival_hour = ?, depart_hour = ?, note = ?, is_anonymous = ?, is_active = 1, expires_at = ?, created_at = ?
      WHERE id = ?
    `).run(data.arrivalHour, data.departHour, data.note, data.isAnonymous ? 1 : 0, expiresAt, createdAt, existing.id);
    return { id: existing.id };
  }
  const result = sqlite.prepare(`
    INSERT INTO outz_checkins (user_id, place_id, arrival_hour, depart_hour, note, calendar_date, is_anonymous, is_active, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(data.userId, data.placeId, data.arrivalHour, data.departHour, data.note, data.calendarDate, data.isAnonymous ? 1 : 0, expiresAt, createdAt);
  return { id: Number(result.lastInsertRowid) };
}

export function deleteOutzCheckin(id: number, userId: number) {
  const result = sqlite.prepare("UPDATE outz_checkins SET is_active = 0 WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return result.changes > 0;
}

export function getOutzChatMessages(placeId: string, viewerUserId: number) {
  const myDates = getOutzChatDatesForUser(placeId, viewerUserId);
  const access = riverBratsChatAccessFromDates(myDates);
  if (!myDates.length || !access.open) {
    return { messages: [], members: [], expiresAt: access.closesAt, chatOpen: false };
  }
  const historyFrom = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
  const rows = sqlite.prepare(`
    SELECT m.id, m.user_id AS userId, m.body, m.created_at AS createdAt,
           u.username, u.display_name AS displayName, u.photo_url AS photoUrl, u.avatar_choice AS avatarChoice
    FROM outz_chat_messages m
    JOIN users u ON u.id = m.user_id
    WHERE m.place_id = ? AND m.calendar_date >= ?
    ORDER BY m.created_at ASC
    LIMIT 300
  `).all(placeId, historyFrom) as any[];
  const memberRows = sqlite.prepare(`
    SELECT DISTINCT c.user_id AS userId, u.username, u.display_name AS displayName, u.photo_url AS photoUrl, u.avatar_choice AS avatarChoice
    FROM outz_checkins c JOIN users u ON u.id = c.user_id
    WHERE c.place_id = ? AND c.is_active = 1 AND c.is_anonymous = 0 AND c.expires_at > ?
    ORDER BY c.created_at ASC
  `).all(placeId, new Date().toISOString()) as any[];
  const allowed = (row: any) => row.userId === viewerUserId || !storage.isMemberInteractionBlocked(viewerUserId, row.userId);
  return {
    messages: rows.filter(allowed).map(row => ({ ...row, isMine: row.userId === viewerUserId })),
    members: memberRows.filter(allowed),
    expiresAt: access.closesAt,
    chatOpen: true,
  };
}

export function postOutzChatMessage(placeId: string, calendarDate: string, userId: number, body: string) {
  const dates = getOutzChatDatesForUser(placeId, userId);
  const access = riverBratsChatAccessFromDates(dates);
  if (!access.open) throw new Error("Active check-in required");
  const stampDate = dates.includes(calendarDate) ? calendarDate : dates[0] || pacificTodayDate();
  const createdAt = new Date().toISOString();
  const result = sqlite.prepare(`
    INSERT INTO outz_chat_messages (place_id, calendar_date, user_id, body, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(placeId, stampDate, userId, body, createdAt);
  return { id: Number(result.lastInsertRowid), body, createdAt, isMine: true };
}

export function purgeExpiredOutzChatMessages() {
  const cutoff = new Date(Date.now() - 21 * 86_400_000).toISOString().slice(0, 10);
  sqlite.prepare("DELETE FROM outz_chat_messages WHERE calendar_date < ?").run(cutoff);
}

export function getOutzPlaceRating(placeId: string, viewerUserId?: number) {
  const summary = sqlite.prepare(`
    SELECT COUNT(*) AS count, AVG(rating) AS average FROM outz_place_ratings WHERE place_id = ?
  `).get(placeId) as { count: number; average: number | null };
  const mine = viewerUserId == null ? null : sqlite.prepare(`
    SELECT rating FROM outz_place_ratings WHERE place_id = ? AND user_id = ?
  `).get(placeId, viewerUserId) as { rating: number } | undefined;
  return { count: Number(summary.count || 0), average: summary.average == null ? null : Number(summary.average), mine: mine?.rating ?? null };
}

export function upsertOutzPlaceRating(placeId: string, userId: number, rating: number) {
  sqlite.prepare(`
    INSERT INTO outz_place_ratings (place_id, user_id, rating, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(place_id, user_id) DO UPDATE SET rating = excluded.rating, updated_at = excluded.updated_at
  `).run(placeId, userId, rating, new Date().toISOString());
  return getOutzPlaceRating(placeId, userId);
}

export function getOutzWallPosts(placeId: string, viewerUserId?: number) {
  const posts = sqlite.prepare(`
    SELECT p.id, p.place_id AS placeId, p.user_id AS userId, p.post_kind AS postKind, p.body,
           p.trip_date AS tripDate, p.created_at AS createdAt, u.username, u.display_name AS displayName,
           u.photo_url AS photoUrl, u.avatar_choice AS avatarChoice
    FROM outz_wall_posts p JOIN users u ON u.id = p.user_id
    WHERE p.place_id = ? ORDER BY p.created_at DESC LIMIT 80
  `).all(placeId) as any[];
  const allowed = (row: any) => viewerUserId == null || row.userId === viewerUserId || !storage.isMemberInteractionBlocked(viewerUserId, row.userId);
  const visiblePosts = posts.filter(allowed);
  const postIds = visiblePosts.map(post => Number(post.id));
  const comments = postIds.length ? sqlite.prepare(`
    SELECT c.id, c.post_id AS postId, c.user_id AS userId, c.body, c.created_at AS createdAt,
           u.username, u.display_name AS displayName
    FROM outz_wall_comments c JOIN users u ON u.id = c.user_id
    WHERE c.post_id IN (${postIds.map(() => "?").join(",")}) ORDER BY c.created_at ASC
  `).all(...postIds) as any[] : [];
  const commentsByPost = new Map<number, any[]>();
  for (const comment of comments.filter(allowed)) {
    const list = commentsByPost.get(Number(comment.postId)) ?? [];
    list.push({ ...comment, isMine: comment.userId === viewerUserId });
    commentsByPost.set(Number(comment.postId), list);
  }
  return visiblePosts.map(post => ({ ...post, isMine: post.userId === viewerUserId, comments: commentsByPost.get(Number(post.id)) ?? [] }));
}

export function createOutzWallPost(input: { placeId: string; userId: number; postKind: string; body: string; tripDate: string | null }) {
  const result = sqlite.prepare(`
    INSERT INTO outz_wall_posts (place_id, user_id, post_kind, body, trip_date, created_at) VALUES (?, ?, ?, ?, ?, ?)
  `).run(input.placeId, input.userId, input.postKind, input.body, input.tripDate, new Date().toISOString());
  return { id: Number(result.lastInsertRowid) };
}

export function createOutzWallComment(input: { postId: number; userId: number; body: string }) {
  const post = sqlite.prepare("SELECT id FROM outz_wall_posts WHERE id = ?").get(input.postId) as { id: number } | undefined;
  if (!post) throw new Error("Post not found");
  const result = sqlite.prepare(`
    INSERT INTO outz_wall_comments (post_id, user_id, body, created_at) VALUES (?, ?, ?, ?)
  `).run(input.postId, input.userId, input.body, new Date().toISOString());
  return { id: Number(result.lastInsertRowid) };
}
