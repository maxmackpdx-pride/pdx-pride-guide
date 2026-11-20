import { parsePacificDateTime } from "@shared/missedConnections";
import { registerRosterChats } from "./rosterChats";
import { registerOrganizerPlanning } from "./organizerPlanning";
import type Database from "better-sqlite3";
import type { Express, RequestHandler } from "express";
import type { Business, Event, MissedConnection } from "@shared/schema";
import { hasPublicEventFlags } from "@shared/publicEventVisibility";
import type { IStorage } from "./storage";
import type { ZaylistAccess, ZaylistStore } from "./zaylist";
import { eventMatchesBusiness, normalizeVenueKey } from "./venueCoordinates";

export function ownedVenueMatch(event: Event, place: Business) {
  // Authority requires an active, owned directory record and a named venue match.
  // The public map's looser coordinate-only fallback is unsuitable here.
  return !!place.active && !!place.ownerId && !!normalizeVenueKey(event.venueName) &&
    normalizeVenueKey(event.venueName) === normalizeVenueKey(place.name) && eventMatchesBusiness(event,place);
}

export function registerHostWorkspace(app:Express, db:Database.Database, storage:IStorage, auth:RequestHandler,
  list:ZaylistStore, accessFor:(id:number,user:number)=>ZaylistAccess, visible:(event:Event)=>boolean) {
  db.exec(`CREATE TABLE IF NOT EXISTS hosted_connection_prefs (
    kind TEXT NOT NULL, object_id INTEGER NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id),
    enabled INTEGER NOT NULL, PRIMARY KEY(kind,object_id,user_id)
  );
  CREATE TABLE IF NOT EXISTS hosted_connection_actions (
    post_id INTEGER PRIMARY KEY REFERENCES missed_connections(id), actor INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);
  db.exec(`CREATE TABLE IF NOT EXISTS event_host_notes (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),stage TEXT NOT NULL CHECK(stage IN ('Interest','Commitment')),
    body TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(event_id,user_id,stage))`);
  registerOrganizerPlanning(app,db,storage,auth,accessFor,visible);
  registerRosterChats(app, db, storage, auth, accessFor);
  const base="/api/hub/workspace";
  const active:RequestHandler=(req,res,next)=>{
    const viewer=storage.getUserById(req.session.userId!);
    if (!viewer || viewer.status!=="active") return res.sendStatus(403);
    res.locals.viewer=viewer;res.set("Cache-Control","private, no-store");next();
  };
  function numeric(query:string,...args:(number|string)[]) {
    return (db.prepare(query).get(...args) as {n:number}).n;
  }
  app.get("/api/hub/member-stats",auth,active,(_req,res)=>{
    const id=res.locals.viewer.id;
    const ids=(db.prepare("SELECT DISTINCT event_id AS id FROM attendances WHERE user_id=? AND is_active=1 AND (expires_at IS NULL OR julianday(expires_at)>julianday('now'))").all(id) as {id:number}[]);
    const going=ids.map(row=>storage.getEvent(row.id)).filter((e):e is Event=>!!e && e.status==="LIVE" && visible(e) && hasPublicEventFlags(e));
    res.json({
      interested:numeric("SELECT COUNT(*) AS n FROM card_hearts WHERE user_id=? AND kind='event'",id),
      going:going.map(e=>({id:e.id,title:e.title})),
      privateEventSaves:numeric("SELECT COUNT(*) AS n FROM event_saves WHERE user_id=?",id),
      followers:numeric(`SELECT COUNT(*) AS n FROM follows f JOIN users u ON u.id=f.follower_user_id WHERE f.following_user_id=?
        AND u.status='active' AND NOT EXISTS (SELECT 1 FROM member_blocks b WHERE (b.blocker_user_id=? AND b.blocked_user_id=u.id) OR (b.blocked_user_id=? AND b.blocker_user_id=u.id))`,id,id,id),
      gigReplies:numeric(`SELECT COUNT(DISTINCT m.thread_id) AS n FROM messages m WHERE m.to_user_id=? AND m.context_type='GIG' AND m.is_read=0 AND m.deleted_by_to=0
        AND NOT EXISTS (SELECT 1 FROM member_blocks b WHERE (b.blocker_user_id=? AND b.blocked_user_id=m.from_user_id) OR (b.blocked_user_id=? AND b.blocker_user_id=m.from_user_id))`,id,id,id),
      admitted:numeric("SELECT COUNT(*) AS n FROM zaylist_entries WHERE user_id=? AND state='redeemed'",id),
    });
  });
  function stats(id:number) {
    return {
      interested:numeric("SELECT COUNT(*) AS n FROM card_hearts WHERE kind='event' AND ref=?",String(id)),
      going:numeric("SELECT COUNT(DISTINCT user_id) AS n FROM attendances WHERE event_id=? AND is_active=1 AND (expires_at IS NULL OR julianday(expires_at)>julianday('now'))",id),
      ...list.counts(id),
      drinksServed:numeric("SELECT COUNT(*) AS n FROM zaylist_redemptions WHERE event_id=? AND kind='drink'",id),
      gifted:numeric("SELECT COUNT(*) AS n FROM zaylist_entries WHERE event_id=? AND state='gifted'",id),
    };
  }
  const signal="/api/events/:id/host-signal";
  const editor:RequestHandler=(req,res,next)=>{
    const id=Number(req.params.id), event=Number.isSafeInteger(id) && id>0 ? storage.getEvent(id) : undefined;
    if(!event || event.status!=="LIVE" || !hasPublicEventFlags(event) || !visible(event)) return res.status(404).json({error:"Event unavailable"});
    if(!accessFor(id,res.locals.viewer.id).editor) return res.status(403).json({error:"Only this event’s editors can view its stages"});
    res.locals.event=event;next();
  };
  app.get(signal,auth,active,editor,(_req,res)=>{
    const event=res.locals.event as Event,id=event.id;
    const m=stats(id),now=Date.now(),start=parsePacificDateTime(event.dateStart),end=parsePacificDateTime(event.dateEnd);
    const finish=end ?? (start===null ? null : start+86400000);
    const stage=finish!==null&&finish<now ? "After" : start!==null&&start<=now ? "Night of" : m.going||m.accepted ? "Commitment" : m.interested ? "Interest" : "Listed";
    const latest=db.prepare("SELECT MAX(created_at) AS at FROM attendances WHERE event_id=? AND is_active=1 AND (expires_at IS NULL OR julianday(expires_at)>julianday('now'))").get(id) as {at:string|null};
    const repeatGuests=numeric(`SELECT COUNT(DISTINCT current.user_id) AS n FROM zaylist_entries current
      JOIN zaylist_redemptions arrival ON arrival.entry_id=current.id AND arrival.kind='entry'
      WHERE current.event_id=? AND EXISTS(SELECT 1 FROM zaylist_entries prior
        JOIN zaylist_redemptions earlier ON earlier.entry_id=prior.id AND earlier.kind='entry'
        JOIN event_hosts h ON h.event_id=prior.event_id JOIN event_hosts co ON co.event_id=current.event_id AND co.user_id=h.user_id
        WHERE prior.user_id=current.user_id AND prior.event_id!=current.event_id AND earlier.id<arrival.id)`,id);
    const notes=db.prepare("SELECT stage,body,revision FROM event_host_notes WHERE event_id=? AND user_id=?").all(id,res.locals.viewer.id);
    res.json({stage,notes,age:event.ageRequirement,latestGoing:latest.at,repeatGuests,
      openGigs:numeric("SELECT COUNT(*) AS n FROM event_gig_links l JOIN gig_posts g ON g.id=l.gig_id WHERE l.event_id=? AND g.status='LIVE'",id),
      lineupPending:numeric("SELECT COUNT(*) AS n FROM event_talent WHERE event_id=? AND status='PENDING'",id)});
  });
  app.put(signal+"/note",auth,active,editor,(req,res)=>{
    const id=res.locals.event.id,user=res.locals.viewer.id,{stage,body,revision}=req.body||{};
    if(!["Interest","Commitment"].includes(stage) || typeof body!=="string" || body.length>800 || !Number.isSafeInteger(revision) || revision<0) return res.status(400).json({error:"Invalid stage or note"});
    const result = db.transaction(()=>{
      const current=db.prepare("SELECT body,revision FROM event_host_notes WHERE event_id=? AND user_id=? AND stage=?").get(id,user,stage) as {body:string;revision:number}|undefined;
      if(current?.body===body) return current.revision;
      if((current?.revision??0)!==revision) return null;
      db.prepare(`INSERT INTO event_host_notes(event_id,user_id,stage,body,revision) VALUES(?,?,?,?,1)
        ON CONFLICT(event_id,user_id,stage) DO UPDATE SET body=excluded.body,revision=event_host_notes.revision+1`).run(id,user,stage,body);
      return revision+1;
    }).immediate();
    if(result===null) return res.status(409).json({error:"This note changed in another session. Load the saved version before editing."});
    res.json({revision:result});
  });
  app.get(base,auth,active,(req,res)=>{
    const viewer=res.locals.viewer;
    const mine=storage.getUserOwnedBusinesses(viewer.id);
    const explicit=new Set((db.prepare(`SELECT event_id FROM event_hosts WHERE user_id=@id
      UNION SELECT event_id FROM zaylist_allowances WHERE user_id=@id
      UNION SELECT event_id FROM zaylist_access_grants WHERE user_id=@id AND revoked_at IS NULL
      UNION SELECT event_id FROM event_talent WHERE user_id=@id AND status='LIVE'`).all({id:viewer.id}) as {event_id:number}[]).map(r=>r.event_id));
    const legacy = db.prepare(`SELECT id FROM events WHERE status='LIVE' AND (
      lower(claimed_by) IN (lower(?),lower(?)) OR lower(submitted_by) IN (lower(?),lower(?)))`)
      .all(viewer.username,viewer.email,viewer.username,viewer.email) as {id:number}[];
    legacy.forEach(e=>explicit.add(e.id));
    if(mine.length) {
      const venues=db.prepare(`SELECT id,venue_name AS venueName,address,lat,lng FROM events WHERE status='LIVE'`).all() as Event[];
      venues.forEach(e=>{if(mine.some(p=>ownedVenueMatch(e,p))) explicit.add(e.id);});
    }
    const rows=[...explicit].map(id=>storage.getEvent(id)).filter((e):e is Event=>!!e && e.status==="LIVE" && visible(e) && hasPublicEventFlags(e));
    const events=rows.flatMap(e=>{
      const access=accessFor(e.id,viewer.id);
      if (!access.team) return [];
      return [{id:e.id,title:e.title,venueName:e.venueName,address:e.address,neighborhood:e.neighborhood,dateStart:e.dateStart,dateEnd:e.dateEnd,
        admission:e.admission,ticketUrl:e.ticketUrl,description:e.description,posterImageUrl:e.posterImageUrl,
        canEditEvent:access.isHost,canManageTeam:access.isOwner,canManageList:access.editor,role:access.isOwner ? "Owner" : access.fullAccess ? "List manager" : access.isHost ? "Host" : access.allowance?.role || "Talent",
        metrics:stats(e.id)}];
    }).sort((a,b)=>{
      const now=new Date().toISOString().slice(0,10);
      const pastA=a.dateStart.slice(0,10)<now, pastB=b.dateStart.slice(0,10)<now;
      return pastA!==pastB ? Number(pastA)-Number(pastB) : (pastA ? -1:1)*a.dateStart.localeCompare(b.dateStart);
    });
    res.json({events,venues:mine.map(p=>({id:p.id,name:p.name,logoImageUrl:p.imageUrl})),
      personal:{
        interested:numeric("SELECT COUNT(*) AS n FROM card_hearts WHERE user_id=? AND kind='event'",viewer.id),
        going:numeric("SELECT COUNT(DISTINCT event_id) AS n FROM attendances WHERE user_id=? AND is_active=1 AND (expires_at IS NULL OR julianday(expires_at)>julianday('now'))",viewer.id),
        admitted:numeric("SELECT COUNT(*) AS n FROM zaylist_entries WHERE user_id=? AND state='redeemed'",viewer.id),
      }});
  });

  function scope(kind:string,id:number,viewerId:number) {
    if (!Number.isSafeInteger(id)||id<=0) return null;
    if (kind==="places") {
      const place=storage.getUserOwnedBusinesses(viewerId).find(p=>p.id===id);
      if (place) return {name:place.name,column:"place_id"};
    }
    if (kind==="events") {
      const event=storage.getEvent(id);
      if (event && event.status==="LIVE" && visible(event) && hasPublicEventFlags(event) && accessFor(id,viewerId).editor) return {name:event.title,column:"event_id"};
    }
    return null;
  }
  const context:RequestHandler=(req,res,next)=>{
    const id=Number(req.params.id);
    const item=scope(String(req.params.kind),id,res.locals.viewer.id);
    if (!item) return res.sendStatus(404);
    res.locals.item=item;next();
  };
  const path=base+"/:kind/:id/connections";
  app.get(path,auth,active,context,(req,res)=>{
    const id=Number(req.params.id);
    const items=db.prepare(`SELECT id,title,body,created_at AS createdAt FROM missed_connections m WHERE ${res.locals.item.column}=? AND status='ACTIVE'
      AND NOT EXISTS(SELECT 1 FROM member_blocks b WHERE (b.blocker_user_id=m.user_id AND b.blocked_user_id=?) OR (b.blocked_user_id=m.user_id AND b.blocker_user_id=?))
      ORDER BY created_at DESC LIMIT 100`).all(id,res.locals.viewer.id,res.locals.viewer.id);
    const pref=db.prepare("SELECT enabled FROM hosted_connection_prefs WHERE kind=? AND object_id=? AND user_id=?").get(req.params.kind,id,res.locals.viewer.id) as {enabled:number}|undefined;
    res.json({items,alerts:pref?.enabled!==0});
  });
  app.put(path+"/alerts",auth,active,context,(req,res)=>{
    if(typeof req.body?.enabled!=="boolean") return res.sendStatus(400);
    db.prepare("INSERT INTO hosted_connection_prefs VALUES(?,?,?,?) ON CONFLICT(kind,object_id,user_id) DO UPDATE SET enabled=excluded.enabled")
      .run(req.params.kind,Number(req.params.id),res.locals.viewer.id,Number(req.body.enabled));
    res.json({enabled:req.body.enabled});
  });
  app.delete(path+"/:post",auth,active,context,(req,res)=>{
    const affected=db.transaction(()=>{
      const updated=db.prepare(`UPDATE missed_connections SET status='ARCHIVED' WHERE id=? AND ${res.locals.item.column}=? AND status='ACTIVE'`)
        .run(Number(req.params.post),Number(req.params.id)).changes;
      if(updated) db.prepare("INSERT OR IGNORE INTO hosted_connection_actions(post_id,actor) VALUES(?,?)").run(Number(req.params.post),res.locals.viewer.id);
      return updated;
    }).immediate();
    if (!affected) return res.sendStatus(404);
    res.json({archived:true});
  });

  app.delete(base+"/events/:id/hosts/:target",auth,active,(req,res)=>{
    const id=Number(req.params.id),target=Number(req.params.target);
    const access=accessFor(id,res.locals.viewer.id);
    if (!access.isOwner) return res.sendStatus(403);
    const changed=db.prepare("DELETE FROM event_hosts WHERE event_id=? AND user_id=? AND role='COHOST'").run(id,target).changes;
    if (!changed) return res.status(409).json({error:"Only a co-host can be removed here"});
    res.json({removed:true});
  });

  function notifyConnection(post:MissedConnection) {
    if(post.status!=="ACTIVE" || (!post.eventId && !post.placeId)) return;
    const recipients=new Set<number>();
    let label="",kind="",id=0;
    if(post.eventId) {
      const event=storage.getEvent(post.eventId);
      if(!event || !visible(event) || !hasPublicEventFlags(event)) return;
      kind="events";id=event.id;label=event.title;
      storage.getEventHosts(id).forEach(h=>recipients.add(h.userId));
      const owner=storage.resolveEventPrimaryHostUser(id);if(owner) recipients.add(owner.id);
      const venue=storage.resolveVenueOwnerUser(event);
      if(venue && storage.getUserOwnedBusinesses(venue.user.id).some(p=>ownedVenueMatch(event,p))) recipients.add(venue.user.id);
      const delegates=db.prepare(`SELECT user_id AS id FROM zaylist_access_grants WHERE event_id=? AND revoked_at IS NULL
        UNION SELECT user_id FROM zaylist_allowances WHERE event_id=? AND role='promoter'`).all(id,id) as {id:number}[];
      delegates.forEach(r=>recipients.add(r.id));
    } else {
      const place=storage.getBusiness(post.placeId!);
      if(!place?.active || !place.ownerId) return;
      kind="places";id=place.id;label=place.name;recipients.add(place.ownerId);
    }
    for(const userId of recipients) {
      if(userId===post.userId || storage.isMemberInteractionBlocked(userId,post.userId)) continue;
      const muted=db.prepare("SELECT 1 FROM hosted_connection_prefs WHERE kind=? AND object_id=? AND user_id=? AND enabled=0").get(kind,id,userId);
      if(!muted) storage.sendAsGuideAdmin(userId,`Missed connection · ${label}`,"A new missed connection is visible on your card. Open your host hub to review it.",{contextType:"HOST_CONNECTION",contextId:id,contextLabel:label});
    }
  }
  return { notifyConnection };
}
