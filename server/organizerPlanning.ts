import type Database from "better-sqlite3";
import type {Express, RequestHandler} from "express";
import type {Event} from "@shared/schema";
import {parsePacificDateTime} from "@shared/missedConnections";
import {hasPublicEventFlags} from "@shared/publicEventVisibility";
import type {IStorage} from "./storage";
import type {ZaylistAccess} from "./zaylist";

type Prices = {standard:number;nonprofit:number};
type Application = {
  eventId:number; requester:number; state:"requested"|"active"|"revoked";
  org:string|null; ein:string|null; verification:"none"|"pending"|"verified"|"declined";
  amount:number|null; reference:string|null;
};

export function registerOrganizerPlanning(app:Express,db:Database.Database,storage:IStorage,auth:RequestHandler,
  accessFor:(event:number,user:number)=>ZaylistAccess,visible:(event:Event)=>boolean) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizer_planning_prices (
      id INTEGER PRIMARY KEY CHECK(id=1),standard INTEGER NOT NULL,nonprofit INTEGER NOT NULL,
      updated_by INTEGER NOT NULL REFERENCES users(id),CHECK(standard>nonprofit AND nonprofit>0)
    );
    CREATE TABLE IF NOT EXISTS organizer_planning_access (
      event_id INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,requested_by INTEGER NOT NULL REFERENCES users(id),
      state TEXT NOT NULL DEFAULT 'requested' CHECK(state IN ('requested','active','revoked')),
      organization TEXT,ein TEXT,verification TEXT NOT NULL CHECK(verification IN ('none','pending','verified','declined')),
      paid_cents INTEGER, payment_ref TEXT UNIQUE,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS organizer_planning_decisions (
      id INTEGER PRIMARY KEY,event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      actor_id INTEGER NOT NULL REFERENCES users(id),kind TEXT NOT NULL,detail TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS organizer_plan_items (
      id INTEGER PRIMARY KEY,event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      title TEXT NOT NULL,scheduled_at TEXT,completed INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER NOT NULL REFERENCES users(id),request_key TEXT NOT NULL,
      UNIQUE(event_id,created_by,request_key)
    );
  `);
  const selection=`SELECT event_id AS eventId,requested_by AS requester,state,organization AS org,
    ein,verification,paid_cents AS amount,payment_ref AS reference FROM organizer_planning_access`;
  const application=(eventId:number)=>db.prepare(selection+" WHERE event_id=?").get(eventId) as Application|undefined;
  const prices=()=>db.prepare("SELECT standard,nonprofit FROM organizer_planning_prices WHERE id=1").get() as Prices|undefined;
  function quote(r:Application, p:Prices|undefined) {
    if (r.amount !== null) return r.amount;
    if (!p || r.verification === "pending") return null;
    return r.verification === "verified" ? p.nonprofit : p.standard;
  }
  const actor:RequestHandler=(req,res,next)=>{
    const user=storage.getUserById(req.session.userId!);
    if(!user || user.status!=="active") return res.status(403).json({error:"Active account required"});
    res.set("Cache-Control","private, no-store");res.locals.actor=user;next();
  };
  const owner:RequestHandler=(_req,res,next)=>{
    if(!storage.isPrimarySiteOwner(res.locals.actor)) return res.status(403).json({error:"Only the platform owner manages planning access"});
    next();
  };
  const organizer:RequestHandler=(req,res,next)=>{
    const id=Number(req.params.id);
    const event=Number.isSafeInteger(id) && id>0 ? storage.getEvent(id) : undefined;
    if (!event || event.status!=="LIVE" || !hasPublicEventFlags(event) || !visible(event)) return res.status(404).json({error:"Event unavailable"});
    const access=accessFor(id,res.locals.actor.id);
    if(!access.isHost && !access.isOwner) return res.status(403).json({error:"Only this event’s organizers can access its plan"});
    res.locals.eventId=id;next();
  };
  const enabled:RequestHandler=(_req,res,next)=>{
    if(application(res.locals.eventId)?.state!=="active") return res.status(403).json({error:"Planning access is required"});
    next();
  };
  const path="/api/events/:id/organizer-plan";
  app.get(path,auth,actor,organizer,(_req,res)=>{
    const id=res.locals.eventId;
    const r=application(id),p=prices();
    res.json({prices:p||null,application:r ? {state:r.state,verification:r.verification,org:r.org,quote:quote(r,p),canCorrect:r.requester===res.locals.actor.id && r.state==="requested" && !!r.org} : null,
      items:r?.state==="active" ? db.prepare(`SELECT id,title,scheduled_at AS scheduledAt,completed FROM organizer_plan_items
        WHERE event_id=? ORDER BY scheduled_at IS NULL,scheduled_at,id`).all(id) : []});
  });
  app.post(path+"/request",auth,actor,organizer,(req,res)=>{
    const org=String(req.body?.organization||"").trim(),ein=String(req.body?.ein||"").trim().replace(/-/g,"");
    if(org.length>150 || (org || ein) && (!org || !/^\d{9}$/.test(ein))) return res.status(400).json({error:"Enter the organization’s name and nine-digit EIN"});
    const id=res.locals.eventId;
    const r=application(id);
    if(r && r.state!=="requested") return res.status(409).json({error:"This event already has a planning entitlement"});
    if(r && (r.org!==(org||null) || r.ein!==(ein||null))) {
      if (r.requester!==res.locals.actor.id) return res.status(403).json({error:"Only the requester can correct the application"});
      if (!org) return res.status(409).json({error:"Provide the corrected organization details"});
      db.prepare("UPDATE organizer_planning_access SET organization=?,ein=?,verification='pending',updated_at=CURRENT_TIMESTAMP WHERE event_id=?")
        .run(org,ein,id);
    }
    db.prepare(`INSERT OR IGNORE INTO organizer_planning_access(event_id,requested_by,organization,ein,verification) VALUES(?,?,?,?,?)`)
      .run(id,res.locals.actor.id,org||null,ein||null,org ? "pending":"none");
    res.status(r ? 200 : 201).json({ok:true});
  });
  app.post(path+"/items",auth,actor,organizer,enabled,(req,res)=>{
    const {title,scheduledAt,requestKey}=req.body||{};
    if(typeof title!=="string" || !title.trim() || title.trim().length>180 || typeof requestKey!=="string" || !/^[a-z\d-]{20,80}$/i.test(requestKey) ||
      scheduledAt!=null && (typeof scheduledAt!=="string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(scheduledAt) || parsePacificDateTime(scheduledAt)===null)) {
      return res.status(400).json({error:"Enter a task and a valid local time"});
    }
    const id=res.locals.eventId,user=res.locals.actor.id;
    const result=db.prepare("INSERT OR IGNORE INTO organizer_plan_items(event_id,title,scheduled_at,created_by,request_key) VALUES(?,?,?,?,?)")
      .run(id,title.trim(),scheduledAt??null,user,requestKey);
    if(!result.changes) {
      const prior=db.prepare("SELECT title,scheduled_at FROM organizer_plan_items WHERE event_id=? AND created_by=? AND request_key=?").get(id,user,requestKey) as {title:string;scheduled_at:string|null};
      if(prior.title!==title.trim() || prior.scheduled_at!==(scheduledAt??null)) return res.status(409).json({error:"Request already used"});
    }
    res.status(result.changes ? 201 : 200).json({ok:true});
  });
  app.patch(path+"/items/:item",auth,actor,organizer,enabled,(req,res)=>{
    if(typeof req.body?.completed!=="boolean") return res.status(400).json({error:"Choose a task state"});
    const changed=db.prepare("UPDATE organizer_plan_items SET completed=? WHERE event_id=? AND id=?")
      .run(Number(req.body.completed),res.locals.eventId,Number(req.params.item)).changes;
    if(!changed) return res.status(404).json({error:"Task unavailable"});
    res.json({ok:true});
  });
  const admin="/api/hub/planning-owner";
  app.get(admin,auth,actor,owner,(req,res)=>{
    const cursor=req.query.before===undefined ? Number.MAX_SAFE_INTEGER : Number(req.query.before);
    if(!Number.isSafeInteger(cursor) || cursor<1) return res.status(400).json({error:"Invalid cursor"});
    const p=prices();
    const rows=db.prepare(selection+" WHERE event_id<? ORDER BY event_id DESC LIMIT 51").all(cursor) as Application[];
    const applications=rows.slice(0,50).map(r=>({...r,eventTitle:storage.getEvent(r.eventId)?.title,quote:quote(r,p),
      decision:db.prepare(`SELECT d.kind,d.detail,d.created_at AS at,u.username AS actor FROM organizer_planning_decisions d
        JOIN users u ON u.id=d.actor_id WHERE d.event_id=? AND d.kind IN ('verify','decline') ORDER BY d.id DESC LIMIT 1`).get(r.eventId)||null}));
    res.json({prices:p||null,applications,next:rows.length>50 ? applications.at(-1)?.eventId : null});
  });
  app.put(admin+"/prices",auth,actor,owner,(req,res)=>{
    const {standard,nonprofit}=req.body||{};
    if(!Number.isSafeInteger(standard) || !Number.isSafeInteger(nonprofit) || nonprofit<=0 || nonprofit>=standard) {
      return res.status(400).json({error:"Set positive prices with a lower nonprofit amount"});
    }
    db.prepare(`INSERT INTO organizer_planning_prices VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET
      standard=excluded.standard,nonprofit=excluded.nonprofit,updated_by=excluded.updated_by`).run(standard,nonprofit,res.locals.actor.id);
    res.json({ok:true});
  });
  app.put(admin+"/requests/:id",auth,actor,owner,(req,res)=>{
    const id=Number(req.params.id),user=res.locals.actor.id,action=req.body?.action;
    const r=application(id);
    if(!r) return res.status(404).json({error:"Request unavailable"});
    const audit=(kind:string,detail:string)=>db.prepare("INSERT INTO organizer_planning_decisions(event_id,actor_id,kind,detail) VALUES(?,?,?,?)").run(id,user,kind,detail);
    if(action==="verify" || action==="decline") {
      const note=typeof req.body?.note==="string" ? req.body.note.trim() : "";
      if(!note || note.length>500) return res.status(400).json({error:"Record the basis for the review"});
      if(r.state!=="requested" || !r.ein) return res.status(409).json({error:"No nonprofit verification is available"});
      db.transaction(()=>{
        db.prepare("UPDATE organizer_planning_access SET verification=?,updated_at=CURRENT_TIMESTAMP WHERE event_id=?")
          .run(action==="verify" ? "verified":"declined",id);
        audit(action,note);
      }).immediate();
    } else if(action==="activate") {
      const reference=typeof req.body?.reference==="string" ? req.body.reference.trim() : "";
      const amount=req.body?.amount;
      if(!reference || reference.length>160 || !Number.isSafeInteger(amount) || amount<=0) return res.status(400).json({error:"Record a settled payment reference and amount"});
      if(r.state==="active" && r.reference===reference && r.amount===amount) return res.json({ok:true});
      if(r.state==="active" || amount!==quote(r,prices())) return res.status(409).json({error:"Confirm the current quote and nonprofit review"});
      if(db.prepare("SELECT 1 FROM organizer_planning_access WHERE payment_ref=? AND event_id!=?").get(reference,id)) return res.status(409).json({error:"That payment was already applied"});
      db.transaction(()=>{
        db.prepare("UPDATE organizer_planning_access SET state='active',paid_cents=?,payment_ref=?,updated_at=CURRENT_TIMESTAMP WHERE event_id=?").run(amount,reference,id);
        audit(action,String(amount));
      }).immediate();
    } else if(action==="revoke"){
      if(r.state!=="active") return res.status(409).json({error:"No active planning access"});
      db.transaction(()=>{
        db.prepare("UPDATE organizer_planning_access SET state='revoked',updated_at=CURRENT_TIMESTAMP WHERE event_id=?").run(id);
        audit(action,"Access withdrawn");
      }).immediate();
    } else return res.status(400).json({error:"Unknown owner action"});
    res.json({ok:true});
  });
}
