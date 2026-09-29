import type Database from "better-sqlite3";

/** Coordinates inherit the public lifetime of their post, including expiry. */
export function publicBoardMapLocations(db: Database.Database, now = new Date()) {
  return db.prepare(`
    SELECT m.board, m.post_id AS postId, m.lat, m.lng
    FROM board_map_locations m
    WHERE (m.board = 'gigz' AND EXISTS (
      SELECT 1 FROM gig_posts p WHERE p.id = m.post_id AND p.status = 'LIVE' AND p.is_remote = 0
    )) OR (m.board = 'giftz' AND EXISTS (
      SELECT 1 FROM gifting_posts p WHERE p.id = m.post_id
      AND p.status IN ('OPEN','THREE_INTERESTED','POSTER_CHOOSING','PICKUP_PENDING','REOPENED','LOOKING','OFFER_PENDING')
      AND (p.status = 'PICKUP_PENDING' OR p.expires_at IS NULL OR datetime(p.expires_at) > datetime(@now))
    )) OR (m.board = 'sellz' AND EXISTS (
      SELECT 1 FROM sellz_posts p WHERE p.id = m.post_id AND p.status IN ('ACTIVE','RESERVED')
      AND (p.status = 'RESERVED' OR p.expires_at IS NULL OR datetime(p.expires_at) > datetime(@now))
    )) OR (m.board = 'mizzed' AND EXISTS (
      SELECT 1 FROM missed_connections p WHERE p.id = m.post_id AND p.status = 'ACTIVE'
      AND (p.closes_at IS NULL OR datetime(p.closes_at) > datetime(@now))
    )) OR (m.board = 'houz' AND EXISTS (
      SELECT 1 FROM housing_posts p WHERE p.id = m.post_id
      AND p.status IN ('ACTIVE','FILLED') AND p.hidden = 0 AND p.gone = 0
    ))
  `).all({ now: now.toISOString() });
}
