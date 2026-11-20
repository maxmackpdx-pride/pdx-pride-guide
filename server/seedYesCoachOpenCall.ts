import type Database from "better-sqlite3";

const migration = "yes_coach_anniversary_open_call_2026_11_29_v1";

// This owner-approved correction targets one catalog occurrence. A later admin
// reassignment or unlink must survive restarts once this receipt exists.
export function linkAnniversaryOpenCall(db: Database.Database, setPrimaryHost: (eventId: number, userId: number) => void) {
  return db.transaction(() => {
    if (db.prepare("SELECT 1 FROM boot_migrations WHERE id=?").get(migration)) return false;
    const target = db.prepare(`
      SELECT g.id AS gigId, e.id AS eventId, g.gig_date AS date, u.id AS ownerId
      FROM gig_posts g
      JOIN businesses venue ON venue.id=g.business_id AND venue.name='Sanctuary Club'
      JOIN events e ON e.id=2022 AND e.title='Yes Coach: 3-Year Anniversary'
        AND substr(e.date_start,1,10)=g.gig_date AND e.venue_name=venue.name
      JOIN businesses group_place ON group_place.id=93 AND group_place.name='Yes Coach Productions'
      JOIN users u ON u.id=group_place.owner_id AND lower(u.username)='tucker_pdmax'
      WHERE g.id=18 AND g.title='Open Call: Contribute an Idea' AND g.gig_date='2026-11-29'
        AND g.post_type='POSTING_GIG' AND (g.user_id IS NULL OR g.user_id=u.id)
        AND (coalesce(e.claimed_by,'')='' OR lower(e.claimed_by)=lower(u.username))
        AND NOT EXISTS (SELECT 1 FROM event_hosts WHERE event_id=e.id AND role='PRIMARY' AND user_id<>u.id)
        AND NOT EXISTS (SELECT 1 FROM event_gig_links WHERE gig_id=g.id AND (event_id<>e.id OR occurrence<>g.gig_date))
    `).get() as { gigId: number; eventId: number; date: string; ownerId: number } | undefined;
    if (!target) return false;
    setPrimaryHost(target.eventId, target.ownerId);
    db.prepare("UPDATE gig_posts SET user_id=? WHERE id=?").run(target.ownerId, target.gigId);
    db.prepare("INSERT OR IGNORE INTO event_gig_links(gig_id,event_id,occurrence) VALUES(?,?,?)")
      .run(target.gigId, target.eventId, target.date);
    db.prepare("INSERT INTO boot_migrations(id,applied_at) VALUES(?,?)").run(migration, new Date().toISOString());
    return true;
  }).immediate();
}
