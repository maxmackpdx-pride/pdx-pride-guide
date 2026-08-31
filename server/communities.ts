import type { Express, RequestHandler } from "express";
import { sqlite } from "./storage";
import { COMMUNITY_RULES, communitySlug } from "@shared/community";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { moderateFields, moderationMessage } from "@shared/contentModeration";

const now = () => new Date().toISOString();

export function ensureCommunityTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT,
      neighborhood TEXT,
      visibility TEXT NOT NULL DEFAULT 'public',
      membership_policy TEXT NOT NULL DEFAULT 'open',
      rules TEXT NOT NULL DEFAULT '[]',
      source_business_id INTEGER UNIQUE,
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS community_memberships (
      community_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      status TEXT NOT NULL DEFAULT 'active',
      rules_version TEXT NOT NULL DEFAULT '1',
      joined_at TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (community_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_community_memberships_user
      ON community_memberships(user_id, status);
    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_community_posts_feed
      ON community_posts(community_id, status, created_at DESC);
    CREATE TABLE IF NOT EXISTS community_relationships (
      community_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      relationship_type TEXT NOT NULL DEFAULT 'related',
      created_at TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (community_id, target_type, target_id, relationship_type)
    );
  `);

  const groups = sqlite.prepare(`
    SELECT id, name, description, image_url, neighborhood, owner_id, created_at
    FROM businesses
    WHERE type = 'group' AND active = 1 AND COALESCE(status, 'OPEN') != 'CLOSED'
    ORDER BY id
  `).all() as any[];
  const used = new Set((sqlite.prepare("SELECT slug FROM communities").all() as any[]).map(row => row.slug));
  const insert = sqlite.prepare(`
    INSERT OR IGNORE INTO communities
      (id, slug, name, description, image_url, neighborhood, visibility,
       membership_policy, rules, source_business_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'public', 'open', ?, ?, ?, ?)
  `);
  const addOwner = sqlite.prepare(`
    INSERT OR IGNORE INTO community_memberships
      (community_id, user_id, role, status, rules_version, joined_at)
    VALUES (?, ?, 'owner', 'active', '1', ?)
  `);
  const relatePlace = sqlite.prepare(`
    INSERT OR IGNORE INTO community_relationships
      (community_id, target_type, target_id, relationship_type, created_at)
    VALUES (?, 'place', ?, 'source', ?)
  `);
  const tx = sqlite.transaction(() => {
    for (const group of groups) {
      let slug = communitySlug(group.name);
      let suffix = 2;
      while (used.has(slug)) slug = `${communitySlug(group.name)}-${suffix++}`;
      const id = `com_${group.id}`;
      const stamp = group.created_at || now();
      const result = insert.run(id, slug, group.name, group.description || "", group.image_url || null,
        group.neighborhood || null, JSON.stringify(COMMUNITY_RULES), group.id, stamp, stamp);
      if (result.changes) used.add(slug);
      relatePlace.run(id, String(group.id), stamp);
      if (group.owner_id) addOwner.run(id, group.owner_id, stamp);
    }
  });
  tx();
}

function parseRules(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map(String) : [...COMMUNITY_RULES];
  } catch {
    return [...COMMUNITY_RULES];
  }
}

function summary(row: any, viewerId?: number) {
  const role = viewerId ? sqlite.prepare(`
    SELECT role FROM community_memberships
    WHERE community_id = ? AND user_id = ? AND status = 'active'
  `).get(row.id, viewerId) as any : null;
  const count = sqlite.prepare(`
    SELECT COUNT(*) AS count FROM community_memberships
    WHERE community_id = ? AND status = 'active'
  `).get(row.id) as any;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url || null,
    neighborhood: row.neighborhood || null,
    visibility: row.visibility,
    membershipPolicy: row.membership_policy,
    memberCount: Number(count?.count || 0),
    viewerRole: role?.role || null,
    sourcePlaceId: row.source_business_id || null,
  };
}

function communityDetail(row: any, viewerId?: number) {
  const moderators = sqlite.prepare(`
    SELECT u.id, u.username, u.display_name AS displayName
    FROM community_memberships cm JOIN users u ON u.id = cm.user_id
    WHERE cm.community_id = ? AND cm.status = 'active' AND cm.role IN ('owner', 'moderator')
    ORDER BY CASE cm.role WHEN 'owner' THEN 0 ELSE 1 END, u.username
  `).all(row.id);
  const posts = sqlite.prepare(`
    SELECT cp.id, cp.body, cp.created_at AS createdAt, u.id AS userId,
           u.username, u.display_name AS displayName, u.photo_url AS photoUrl
    FROM community_posts cp JOIN users u ON u.id = cp.user_id
    WHERE cp.community_id = ? AND cp.status = 'published'
    ORDER BY cp.created_at DESC LIMIT 50
  `).all(row.id).map((post: any) => ({
    id: post.id, body: post.body, createdAt: post.createdAt,
    author: { id: post.userId, username: post.username, displayName: post.displayName, photoUrl: post.photoUrl },
  }));
  const events = sqlite.prepare(`
    SELECT e.id, e.title, e.date_start AS dateStart
    FROM community_relationships cr JOIN events e ON e.id = CAST(cr.target_id AS INTEGER)
    WHERE cr.community_id = ? AND cr.target_type = 'event' AND e.status = 'LIVE'
    ORDER BY e.date_start ASC LIMIT 12
  `).all(row.id).map((event: any) => ({ ...event, url: eventPath(event.id, event.title) }));
  return {
    ...summary(row, viewerId),
    rules: parseRules(row.rules),
    moderators,
    posts,
    related: {
      place: row.source_business_id
        ? { id: row.source_business_id, name: row.name, url: placePath(row.source_business_id, row.name) }
        : null,
      events,
    },
  };
}

export function registerCommunityRoutes(app: Express, requireAuth: RequestHandler) {
  ensureCommunityTables();

  app.get("/api/communities", (req: any, res) => {
    const rows = sqlite.prepare(`
      SELECT * FROM communities WHERE visibility = 'public' ORDER BY name COLLATE NOCASE
    `).all();
    res.json(rows.map(row => summary(row, req.session?.userId)));
  });

  app.get("/api/communities/:slug", (req: any, res) => {
    const row = sqlite.prepare("SELECT * FROM communities WHERE slug = ?").get(String(req.params.slug).toLowerCase()) as any;
    if (!row || (row.visibility !== "public" && !req.session?.userId)) return res.status(404).json({ error: "Community not found" });
    res.json(communityDetail(row, req.session?.userId));
  });

  app.post("/api/communities/:slug/join", requireAuth, (req: any, res) => {
    const row = sqlite.prepare("SELECT * FROM communities WHERE slug = ?").get(String(req.params.slug).toLowerCase()) as any;
    if (!row) return res.status(404).json({ error: "Community not found" });
    if (row.membership_policy !== "open") return res.status(409).json({ error: "This community requires an invitation or approval" });
    sqlite.prepare(`
      INSERT INTO community_memberships (community_id, user_id, role, status, rules_version, joined_at)
      VALUES (?, ?, 'member', 'active', '1', ?)
      ON CONFLICT(community_id, user_id) DO UPDATE SET status = 'active'
    `).run(row.id, req.session.userId, now());
    res.json(communityDetail(row, req.session.userId));
  });

  app.delete("/api/communities/:slug/membership", requireAuth, (req: any, res) => {
    const row = sqlite.prepare("SELECT * FROM communities WHERE slug = ?").get(String(req.params.slug).toLowerCase()) as any;
    if (!row) return res.status(404).json({ error: "Community not found" });
    const membership = sqlite.prepare("SELECT role FROM community_memberships WHERE community_id = ? AND user_id = ?").get(row.id, req.session.userId) as any;
    if (membership?.role === "owner") return res.status(409).json({ error: "A community owner cannot leave until ownership is transferred" });
    sqlite.prepare("UPDATE community_memberships SET status = 'left' WHERE community_id = ? AND user_id = ?").run(row.id, req.session.userId);
    res.status(204).end();
  });

  app.post("/api/communities/:slug/posts", requireAuth, (req: any, res) => {
    const row = sqlite.prepare("SELECT * FROM communities WHERE slug = ?").get(String(req.params.slug).toLowerCase()) as any;
    if (!row) return res.status(404).json({ error: "Community not found" });
    const member = sqlite.prepare(`SELECT 1 FROM community_memberships WHERE community_id = ? AND user_id = ? AND status = 'active'`).get(row.id, req.session.userId);
    if (!member) return res.status(403).json({ error: "Join this community before posting" });
    const body = String(req.body?.body || "").trim();
    if (body.length < 1 || body.length > 2000) return res.status(400).json({ error: "Posts must be between 1 and 2,000 characters" });
    const moderation = moderateFields({ post: body });
    if (moderation.verdict !== "ALLOW") {
      const category = moderation.reasons[0]?.category || "OTHER";
      return res.status(400).json({ error: moderationMessage(category) });
    }
    sqlite.prepare("INSERT INTO community_posts (community_id, user_id, body, status, created_at) VALUES (?, ?, ?, 'published', ?)")
      .run(row.id, req.session.userId, body, now());
    res.status(201).json(communityDetail(row, req.session.userId));
  });
}
