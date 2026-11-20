import type Database from "better-sqlite3";
import type { Express, RequestHandler, Response } from "express";
import type { IStorage } from "./storage";
import { pushAllowance, type PushAudience, type PushTier } from "@shared/hostPushPolicy";
import { buildDeclarativePayload, sendPushToSubscription } from "./push/send";
import { isPushConfigured } from "./push/vapid";
import { hasPublicEventFlags } from "@shared/publicEventVisibility";

type Campaign = { id: number; sender: number; audience: PushAudience; event_id: number | null; title: string; body: string; created: number };
type User = NonNullable<ReturnType<IStorage["getUserById"]>>;

export function registerHostPush(app: Express, db: Database.Database, storage: IStorage, auth: RequestHandler,
  existingPermission: (user: User) => boolean, moderate: (res: Response, board: string, fields: Record<string,string>) => boolean,
  transport = { configured: isPushConfigured, send: sendPushToSubscription }) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS host_push_memberships (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, tier TEXT NOT NULL CHECK(tier IN ('standard','paid')),
      granted_by INTEGER NOT NULL REFERENCES users(id), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS host_push_campaigns (
      id INTEGER PRIMARY KEY, sender INTEGER NOT NULL REFERENCES users(id), audience TEXT NOT NULL,
      event_id INTEGER REFERENCES events(id), title TEXT NOT NULL, body TEXT NOT NULL, created INTEGER NOT NULL,
      request_key TEXT NOT NULL, UNIQUE(sender,request_key)
    );
    CREATE INDEX IF NOT EXISTS idx_host_push_quota ON host_push_campaigns(sender,audience,created);
    CREATE TABLE IF NOT EXISTS host_push_deliveries (
      campaign INTEGER NOT NULL REFERENCES host_push_campaigns(id) ON DELETE CASCADE, device INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued', lease INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(campaign,device)
    );
    CREATE INDEX IF NOT EXISTS idx_host_push_pending ON host_push_deliveries(status,lease);
  `);
  function tierFor(user: User): PushTier | null {
    if (storage.isPrimarySiteOwner(user)) return "owner";
    const grant = db.prepare("SELECT tier FROM host_push_memberships WHERE user_id=?").get(user.id) as {tier: "standard" | "paid"} | undefined;
    return grant?.tier || (existingPermission(user) ? "standard" : null);
  }
  function remaining(userId: number, tier: PushTier, audience: PushAudience) {
    const {limit,windowDays} = pushAllowance(tier,audience);
    if (!Number.isFinite(limit)) return null;
    if (!limit) return 0;
    const used = db.prepare("SELECT COUNT(*) AS n FROM host_push_campaigns WHERE sender=? AND audience=? AND created>?")
      .get(userId,audience,Date.now()-windowDays*86400000) as {n:number};
    return Math.max(0,limit-used.n);
  }
  function subscribers(userId: number, audience: PushAudience, eventId: number | null) {
    let targets: Set<number> | null = null;
    if (audience === "followers") targets = new Set(storage.getFollowerUserIds(userId));
    if (audience === "rsvps") {
      const rows = eventId ? db.prepare(`SELECT DISTINCT user_id AS id FROM attendances WHERE event_id=? AND is_active=1
        AND (expires_at IS NULL OR julianday(expires_at)>julianday('now')) AND user_id IS NOT NULL`).all(eventId) as {id:number}[] : [];
      targets = new Set(rows.map(r => r.id));
    }
    const allowed = new Map<number,boolean>();
    return storage.getAllActivePushSubscriptions().filter(sub => {
      if (targets && !targets.has(sub.userId) || sub.userId === userId && audience !== "everyone") return false;
      if (!allowed.has(sub.userId)) allowed.set(sub.userId,
        storage.getUserById(sub.userId)?.status === "active" && !storage.isMemberInteractionBlocked(userId,sub.userId) &&
        storage.getNotificationPrefs(sub.userId)[audience === "everyone" ? "account" : "my_events"]);
      return allowed.get(sub.userId);
    });
  }
  function eventAllowed(id: number, user: User) {
    const event = storage.getEvent(id);
    return !!event && event.status === "LIVE" && hasPublicEventFlags(event) && storage.isUserEventHost(id,user.id);
  }
  const actor: RequestHandler = (req,res,next) => {
    res.set("Cache-Control","private, no-store");
    const user = storage.getUserById(req.session.userId!);
    if (!user || user.status !== "active") return res.sendStatus(403);
    res.locals.actor = user;
    res.locals.tier = tierFor(user);
    next();
  };
  const scope = "/api/hub/push";
  app.get(scope,auth,actor,(req,res) => {
    const user = res.locals.actor as User, tier = res.locals.tier as PushTier | null;
    if (!tier) return res.json({allowed:false});
    const eventId = Number(req.query.eventId) || null;
    if (eventId && !eventAllowed(eventId,user)) return res.sendStatus(403);
    const audiences: PushAudience[] = tier === "owner" ? ["followers","rsvps","everyone"] : ["followers","rsvps"];
    res.json({
      allowed:true, tier, configured:transport.configured(),
      audiences: audiences.map(key => ({ key, remaining:remaining(user.id,tier,key), ...pushAllowance(tier,key),
        reachable: new Set(subscribers(user.id,key,eventId).map(sub => sub.userId)).size })),
    });
  });
  function receipt(id: number) {
    const totals = db.prepare(`SELECT COUNT(*) AS devices, COALESCE(SUM(status='sent'),0) AS sent,
      COALESCE(SUM(status='queued'),0) AS queued, COALESCE(SUM(status='failed'),0) AS failed,
      COALESCE(SUM(status='skipped'),0) AS skipped FROM host_push_deliveries WHERE campaign=?`).get(id) as Record<string,number>;
    return {id,...totals};
  }
  app.post(scope,auth,actor,(req,res) => {
    const user = res.locals.actor as User, tier = res.locals.tier as PushTier | null;
    const {audience,title,body,requestKey} = req.body ?? {};
    const eventId = Number(req.body?.eventId) || null;
    if (!tier || audience === "everyone" && tier !== "owner") return res.sendStatus(403);
    if (!["followers","rsvps","everyone"].includes(audience) || typeof title !== "string" || !title.trim() || title.length>40 ||
      typeof body !== "string" || body.length>110 || typeof requestKey !== "string" || !/^[a-z\d-]{20,80}$/i.test(requestKey)) return res.status(400).json({error:"Choose an audience, title and message within the limits"});
    if ((audience === "rsvps" && !eventId) || eventId && !eventAllowed(eventId,user)) return res.status(403).json({error:"Choose one of your hosted events"});
    const previous = db.prepare("SELECT * FROM host_push_campaigns WHERE sender=? AND request_key=?").get(user.id,requestKey) as Campaign | undefined;
    if (previous) {
      if (previous.audience !== audience || previous.title !== title.trim() || previous.body !== body.trim() || previous.event_id !== eventId) return res.sendStatus(409);
      return res.json(receipt(previous.id));
    }
    if (!transport.configured()) return res.status(503).json({error:"Device push is unavailable"});
    if (moderate(res,"Host push",{title,body})) return;
    const devices = subscribers(user.id,audience,eventId);
    if (!devices.length) return res.status(409).json({error:"No subscribed devices in this audience"});
    const id = db.transaction(() => {
      if (remaining(user.id,tier,audience) === 0) return null;
      const info = db.prepare("INSERT INTO host_push_campaigns(sender,audience,event_id,title,body,created,request_key) VALUES(?,?,?,?,?,?,?)")
        .run(user.id,audience,eventId,title.trim(),body.trim(),Date.now(),requestKey);
      const add = db.prepare("INSERT INTO host_push_deliveries(campaign,device) VALUES(?,?)");
      for (const device of devices) add.run(info.lastInsertRowid,device.id);
      return Number(info.lastInsertRowid);
    }).immediate();
    if (id == null) return res.status(429).json({error:"You used all sends for this audience in the current window"});
    res.status(202).json(receipt(id));
    void drain().catch(() => console.warn("[host-push] queued delivery will retry"));
  });
  app.get(scope+"/:id/receipt",auth,actor,(req,res) => {
    const id = Number(req.params.id);
    if (!db.prepare("SELECT 1 FROM host_push_campaigns WHERE id=? AND sender=?").get(id,res.locals.actor.id)) return res.sendStatus(404);
    res.json(receipt(id));
  });
  app.put(scope+"/access",auth,actor,(req,res) => {
    if (res.locals.tier !== "owner") return res.sendStatus(403);
    const {username,tier} = req.body || {};
    if (typeof username !== "string" || !["off","standard","paid"].includes(tier)) return res.sendStatus(400);
    const user = storage.getUserByUsername(username.trim());
    if (!user || user.status !== "active") return res.status(404).json({error:"Active account not found"});
    if (storage.isPrimarySiteOwner(user)) return res.status(409).json({error:"The primary owner has permanent access"});
    if (tier === "off") db.prepare("DELETE FROM host_push_memberships WHERE user_id=?").run(user.id);
    else db.prepare(`INSERT INTO host_push_memberships(user_id,tier,granted_by) VALUES(?,?,?) ON CONFLICT(user_id)
      DO UPDATE SET tier=excluded.tier,granted_by=excluded.granted_by,updated_at=CURRENT_TIMESTAMP`).run(user.id,tier,res.locals.actor.id);
    res.json({username:user.username,tier:tierFor(user)});
  });
  async function drain() {
    if (!transport.configured()) return;
    const campaigns = db.prepare(`SELECT DISTINCT c.* FROM host_push_campaigns c JOIN host_push_deliveries d ON d.campaign=c.id
      WHERE d.status='queued' AND d.lease<=? ORDER BY c.id LIMIT 10`).all(Date.now()) as Campaign[];
    for (const c of campaigns) {
      const sender = storage.getUserById(c.sender);
      const tier = sender?.status === "active" ? tierFor(sender) : null;
      const allowed = tier && (c.audience !== "everyone" || tier === "owner") && (!c.event_id || eventAllowed(c.event_id,sender!));
      const devices = new Map((allowed ? subscribers(c.sender,c.audience,c.event_id) : []).map(s => [s.id,s]));
      const batch = db.prepare("SELECT device,attempts FROM host_push_deliveries WHERE campaign=? AND status='queued' AND lease<=? ORDER BY device LIMIT 100")
        .all(c.id,Date.now()) as {device:number;attempts:number}[];
      const payload = buildDeclarativePayload({title:c.title,body:c.body,navigate:c.event_id ? `/events/${c.event_id}` : "/events",tag:`host-push-${c.id}`});
      for (const {device,attempts} of batch) {
        const now = Date.now();
        const acquired = db.prepare("UPDATE host_push_deliveries SET lease=?,attempts=attempts+1 WHERE campaign=? AND device=? AND status='queued' AND lease<=?")
          .run(now+120000,c.id,device,now).changes;
        if (!acquired) continue;
        const sub = devices.get(device);
        let status = "skipped";
        if (sub) {
          const result = await transport.send(sub,payload);
          status = result.ok ? "sent" : result.gone || attempts>=3 ? "failed" : "queued";
          if (result.ok) storage.touchPushSubscription(device);
          else if (result.gone) storage.deactivatePushSubscription(device);
        }
        db.prepare("UPDATE host_push_deliveries SET status=?,lease=? WHERE campaign=? AND device=?").run(status,now+60000*(attempts+1),c.id,device);
      }
    }
  }
  return {drain, tierFor};
}
