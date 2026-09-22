import type Database from 'better-sqlite3';

export function waypointExpiry(duration: string, now = new Date()) {
  const end = new Date(now);
  if (duration === 'day' || duration === 'week') end.setUTCDate(end.getUTCDate() + (duration === 'day' ? 1 : 7));
  else if (duration === 'month' || duration === 'six-months') {
    const day = end.getUTCDate();
    end.setUTCDate(1); end.setUTCMonth(end.getUTCMonth() + (duration === 'month' ? 1 : 6));
    const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
    end.setUTCDate(Math.min(day, last));
  } else throw Error('Choose 1 day, 1 week, 1 month, or 6 months');
  return end.toISOString();
}
export function createWaypointStore(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS outz_waypoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT, place_id TEXT NOT NULL, user_id INTEGER NOT NULL,
    title TEXT NOT NULL, note TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL,
    created_at TEXT NOT NULL, expires_at TEXT NOT NULL
  ); CREATE INDEX IF NOT EXISTS outz_waypoint_place_expiry ON outz_waypoints(place_id, expires_at);`);
  return {
    list(placeId: string, viewer?: number, now = new Date()) {
      return (db.prepare('SELECT * FROM outz_waypoints WHERE place_id = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 500').all(placeId, now.toISOString()) as any[])
        .map(({ user_id, ...point }) => ({ ...point, canDelete: user_id === viewer }));
    },
    add(placeId: string, userId: number, input: any, now = new Date()) {
      const { lat, lng, duration } = input;
      const title = typeof input.title === 'string' ? input.title.trim() : '';
      const note = typeof input.note === 'string' ? input.note.trim() : '';
      if (!title || title.length > 80 || note.length > 500) throw Error('Use a title up to 80 characters and a note up to 500 characters');
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) throw Error('Choose a valid map location');
      const expires = waypointExpiry(duration, now);
      const count = db.prepare('SELECT count(*) AS n FROM outz_waypoints WHERE user_id = ? AND expires_at > ?').get(userId, now.toISOString()) as { n: number };
      if (count.n >= 100) throw Error('You already have 100 active waypoints. Remove one before adding another.');
      return db.prepare('INSERT INTO outz_waypoints (place_id,user_id,title,note,lat,lng,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?)').run(placeId,userId,title,note,lat,lng,now.toISOString(),expires).lastInsertRowid;
    },
    remove(id: number, userId: number) { return db.prepare('DELETE FROM outz_waypoints WHERE id = ? AND user_id = ?').run(id,userId).changes > 0; }
  };
}
