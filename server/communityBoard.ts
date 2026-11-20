import type Database from "better-sqlite3";
import type { Express, RequestHandler } from "express";
import { moderateFields } from "@shared/contentModeration";
export function registerCommunityBoard(
  app: Express,
  db: Database.Database,
  auth: RequestHandler,
) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS community_board_members(community_id TEXT NOT NULL,user_id INTEGER NOT NULL,title TEXT NOT NULL,PRIMARY KEY(community_id,user_id))",
  );
  const path = "/api/communities/:slug/board";
  const scope: RequestHandler = (req, res, next) => {
    const user = req.session?.userId ?? 0;
    const row = db
      .prepare(
        `SELECT c.id,c.visibility,m.role FROM communities c LEFT JOIN community_memberships m ON m.community_id=c.id AND m.user_id=? AND m.status='active' WHERE c.slug=?`,
      )
      .get(user, req.params.slug) as
      | { id: string; visibility: string; role: string | null }
      | undefined;
    if (!row || (row.visibility === "private" && !row.role))
      return res.status(404).json({ error: "Community unavailable." });
    res.set("Cache-Control", "private, no-store");
    res.locals.community = row;
    next();
  };
  app.get(path, scope, (req, res) => {
    const user = req.session?.userId ?? 0;
    res.json(
      db
        .prepare(
          `SELECT u.id,u.username,COALESCE(NULLIF(u.display_name,''),u.username) AS name,b.title FROM community_board_members b JOIN community_memberships m ON m.community_id=b.community_id AND m.user_id=b.user_id AND m.status='active'
     JOIN users u ON u.id=b.user_id AND u.status='active' WHERE b.community_id=? AND NOT EXISTS
     (SELECT 1 FROM member_blocks x WHERE (x.blocker_user_id=? AND x.blocked_user_id=u.id) OR (x.blocked_user_id=? AND x.blocker_user_id=u.id)) ORDER BY b.rowid`,
        )
        .all(res.locals.community.id, user, user),
    );
  });
  app.put(path + "/:user", auth, scope, (req, res) => {
    const c = res.locals.community,
      user = Number(req.params.user);
    if (c.role !== "owner")
      return res
        .status(403)
        .json({ error: "Only the community owner can change board listings." });
    const title =
      typeof req.body.title === "string" ? req.body.title.trim() : null;
    if (
      title == null ||
      title.length > 80 ||
      moderateFields({ title }).verdict !== "ALLOW"
    )
      return res
        .status(400)
        .json({ error: "Enter a board title of up to 80 characters." });
    if (!title) {
      db.prepare(
        "DELETE FROM community_board_members WHERE community_id=? AND user_id=?",
      ).run(c.id, user);
      return res.json({ saved: true });
    }
    const active = db
      .prepare(
        "SELECT 1 FROM community_memberships m JOIN users u ON m.user_id=u.id AND u.status='active' WHERE m.community_id=? AND m.user_id=? AND m.status='active'",
      )
      .get(c.id, user);
    if (!active)
      return res
        .status(404)
        .json({ error: "Choose an active member of this group." });
    db.prepare(
      `INSERT INTO community_board_members VALUES(?,?,?) ON CONFLICT(community_id,user_id) DO UPDATE SET title=excluded.title`,
    ).run(c.id, user, title);
    res.json({ saved: true });
  });
}
