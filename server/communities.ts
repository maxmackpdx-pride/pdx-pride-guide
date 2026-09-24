import type { Express, RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { sqlite, storage } from "./storage";
import { COMMUNITY_RULES, communitySlug, type CommunityRole } from "@shared/community";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { moderateFields, moderationMessage } from "@shared/contentModeration";
import { redgifsMedia } from "@shared/communityMedia";
import { parsePacificDateTime } from "@shared/missedConnections";

const now = () => new Date().toISOString();
const VISIBILITY = new Set(["public", "discoverable", "private"]);
const POLICY = new Set(["open", "request", "invite"]);
const TARGETS = new Set(["event", "sellz", "gig", "place", "guide"]);
const RESERVED = new Set(["new", "events", "eventz", "sellz", "gigz", "outz", "guides", "dark", "zaydark", "space", "spaces"]);

export function ensureCommunityTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS communities (id TEXT PRIMARY KEY,slug TEXT NOT NULL UNIQUE,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',image_url TEXT,neighborhood TEXT,visibility TEXT NOT NULL DEFAULT 'public',membership_policy TEXT NOT NULL DEFAULT 'open',rules TEXT NOT NULL DEFAULT '[]',source_business_id INTEGER UNIQUE,created_at TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS community_memberships (community_id TEXT NOT NULL,user_id INTEGER NOT NULL,role TEXT NOT NULL DEFAULT 'member',status TEXT NOT NULL DEFAULT 'active',following INTEGER NOT NULL DEFAULT 1,rules_version TEXT NOT NULL DEFAULT '1',joined_at TEXT NOT NULL DEFAULT '',PRIMARY KEY (community_id,user_id));
    CREATE INDEX IF NOT EXISTS idx_community_memberships_user ON community_memberships(user_id,status);
    CREATE TABLE IF NOT EXISTS community_posts (id INTEGER PRIMARY KEY AUTOINCREMENT,community_id TEXT NOT NULL,user_id INTEGER NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'published',created_at TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT '');
    CREATE INDEX IF NOT EXISTS idx_community_posts_feed ON community_posts(community_id,status,created_at DESC);
    CREATE TABLE IF NOT EXISTS community_post_votes (post_id INTEGER NOT NULL,user_id INTEGER NOT NULL,value INTEGER NOT NULL CHECK(value IN (-1,1)),PRIMARY KEY (post_id,user_id));
    CREATE INDEX IF NOT EXISTS idx_community_post_votes_post ON community_post_votes(post_id);
    CREATE TABLE IF NOT EXISTS community_relationships (community_id TEXT NOT NULL,target_type TEXT NOT NULL,target_id TEXT NOT NULL,relationship_type TEXT NOT NULL DEFAULT 'related',created_at TEXT NOT NULL DEFAULT '',PRIMARY KEY (community_id,target_type,target_id,relationship_type));
    CREATE TABLE IF NOT EXISTS community_reports (id INTEGER PRIMARY KEY AUTOINCREMENT,community_id TEXT NOT NULL,post_id INTEGER,reporter_user_id INTEGER NOT NULL,reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',resolution_note TEXT,resolved_by INTEGER,created_at TEXT NOT NULL DEFAULT '',resolved_at TEXT);
    CREATE INDEX IF NOT EXISTS idx_community_reports_queue ON community_reports(community_id,status,created_at DESC);
    CREATE TABLE IF NOT EXISTS community_moderation_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,community_id TEXT NOT NULL,actor_user_id INTEGER NOT NULL,action TEXT NOT NULL,target_type TEXT NOT NULL,target_id TEXT,detail TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT '');
  `);
  const cols = sqlite.prepare("PRAGMA table_info(community_posts)").all() as any[];
  if (!cols.some(c => c.name === "parent_post_id")) sqlite.exec("ALTER TABLE community_posts ADD COLUMN parent_post_id INTEGER");
  if (!cols.some(c => c.name === "title")) sqlite.exec("ALTER TABLE community_posts ADD COLUMN title TEXT NOT NULL DEFAULT ''");
  if (!cols.some(c => c.name === "media_url")) sqlite.exec("ALTER TABLE community_posts ADD COLUMN media_url TEXT");
  const memberCols = sqlite.prepare("PRAGMA table_info(community_memberships)").all() as any[];
  if (!memberCols.some(c => c.name === "following")) sqlite.exec("ALTER TABLE community_memberships ADD COLUMN following INTEGER NOT NULL DEFAULT 1");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_community_posts_parent ON community_posts(community_id,parent_post_id,status)");
  if (!cols.some(c => c.name === "updated_at")) sqlite.exec("ALTER TABLE community_posts ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''");
  const groups = sqlite.prepare("SELECT id,name,description,image_url,neighborhood,owner_id,created_at FROM businesses WHERE type='group' AND active=1 AND COALESCE(status,'OPEN')!='CLOSED' ORDER BY id").all() as any[];
  const used = new Set((sqlite.prepare("SELECT slug FROM communities").all() as any[]).map(r => r.slug));
  const insert = sqlite.prepare("INSERT OR IGNORE INTO communities (id,slug,name,description,image_url,neighborhood,visibility,membership_policy,rules,source_business_id,created_at,updated_at) VALUES (?,?,?,?,?,?,'public','open',?,?,?,?)");
  const owner = sqlite.prepare("INSERT OR IGNORE INTO community_memberships (community_id,user_id,role,status,rules_version,joined_at) VALUES (?,?,'owner','active','1',?)");
  const place = sqlite.prepare("INSERT OR IGNORE INTO community_relationships (community_id,target_type,target_id,relationship_type,created_at) VALUES (?,'place',?,'source',?)");
  sqlite.transaction(() => { for (const g of groups) { let slug=communitySlug(g.name), n=2; while(used.has(slug)) slug=`${communitySlug(g.name)}-${n++}`; const id=`com_${g.id}`, stamp=g.created_at||now(); const result=insert.run(id,slug,g.name,g.description||"",g.image_url||null,g.neighborhood||null,JSON.stringify(COMMUNITY_RULES),g.id,stamp,stamp); if(result.changes) used.add(slug); place.run(id,String(g.id),stamp); if(g.owner_id) owner.run(id,g.owner_id,stamp); } })();
  const candidateColumns=sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='qsearch_candidates'").get()
    ? (sqlite.prepare("PRAGMA table_info(qsearch_candidates)").all() as Array<{name:string}>).map(column=>column.name) : [];
  if(["brands_json","committed_event_id"].every(name=>candidateColumns.includes(name))){
    const committed=sqlite.prepare("SELECT committed_event_id eventId,brands_json brands FROM qsearch_candidates WHERE committed_event_id IS NOT NULL AND status='committed'").all() as Array<{eventId:number;brands:string}>;
    for(const candidate of committed){try{const brands=JSON.parse(candidate.brands);if(Array.isArray(brands))linkQSearchCommunityEvent(candidate.eventId,brands);}catch{/* Ignore an invalid historical candidate. */}}
  }
}

function rules(value: unknown): string[] { try { const x=JSON.parse(String(value||"[]")); return Array.isArray(x)?x.map(String):[...COMMUNITY_RULES]; } catch { return [...COMMUNITY_RULES]; } }
function bySlug(value: unknown) { return sqlite.prepare("SELECT * FROM communities WHERE slug=?").get(String(value||"").toLowerCase()) as any; }
function member(id:string,userId?:number){ return userId ? sqlite.prepare("SELECT role,status,following FROM community_memberships WHERE community_id=? AND user_id=?").get(id,userId) as any : null; }
function role(id:string,userId?:number):CommunityRole|null { const m=member(id,userId); return m?.status==="active"?m.role:null; }
function isMod(id:string,userId?:number){ const r=role(id,userId); return r==="owner"||r==="moderator"; }
function readable(row:any,userId?:number){ return row.visibility!=="private"||Boolean(role(row.id,userId)); }
function text(value:unknown,max:number){ return String(value||"").trim().slice(0,max); }
function audit(id:string,actor:number,action:string,targetType:string,targetId?:string|number|null,detail:any={}){ sqlite.prepare("INSERT INTO community_moderation_audit (community_id,actor_user_id,action,target_type,target_id,detail,created_at) VALUES (?,?,?,?,?,?,?)").run(id,actor,action,targetType,targetId==null?null:String(targetId),JSON.stringify(detail),now()); }
function moderator(req:any,res:any,row:any){ if(!isMod(row.id,req.session?.userId)){res.status(403).json({error:"Community moderator access required"});return false;} return true; }
function allowed(fields:Record<string,string>,res:any){ const m=moderateFields(fields); if(m.verdict==="ALLOW")return true; res.status(400).json({error:moderationMessage(m.reasons[0]?.category||"OTHER")}); return false; }
function limited(id:string,userId:number,table:"community_posts"|"community_reports",limit:number){ const col=table==="community_posts"?"user_id":"reporter_user_id"; const r=sqlite.prepare(`SELECT COUNT(*) count FROM ${table} WHERE community_id=? AND ${col}=? AND datetime(created_at)>=datetime('now','-1 hour')`).get(id,userId) as any; return Number(r?.count||0)>=limit; }

function claimState(row:any){
  if(!row.source_business_id)return {isClaimable:false,hasPendingClaim:false};
  const source=sqlite.prepare("SELECT owner_id FROM businesses WHERE id=? AND active=1").get(row.source_business_id) as {owner_id:number|null}|undefined;
  const owner=sqlite.prepare("SELECT 1 FROM community_memberships WHERE community_id=? AND role='owner' AND status='active'").get(row.id);
  const pending=sqlite.prepare("SELECT 1 FROM business_claims WHERE business_id=? AND status='PENDING' LIMIT 1").get(row.source_business_id);
  return {isClaimable:Boolean(source&&!source.owner_id&&!owner),hasPendingClaim:Boolean(pending)};
}
function summary(row:any,viewerId?:number){ const count=sqlite.prepare("SELECT COUNT(*) count FROM community_memberships WHERE community_id=? AND status='active'").get(row.id) as any; const viewer=member(row.id,viewerId); return {id:row.id,slug:row.slug,name:row.name,description:row.description,imageUrl:row.image_url||null,neighborhood:row.neighborhood||null,visibility:row.visibility,membershipPolicy:row.membership_policy,memberCount:Number(count?.count||0),viewerRole:role(row.id,viewerId),viewerMembershipStatus:viewer?.status||null,viewerFollowing:viewer?.status==="active"&&viewer.following!==0,canManage:isMod(row.id,viewerId),sourcePlaceId:row.source_business_id||null,...claimState(row)}; }
export function linkQSearchCommunityEvent(eventId:number,brands:Array<{businessId:number;role:string}>){
  if(!Number.isSafeInteger(eventId)||eventId<1)return;
  // Keep approvals linked before publication; the events tab displays only live, public listings.
  if(!sqlite.prepare("SELECT 1 FROM events WHERE id=? AND status!='REMOVED'").get(eventId))return;
  const find=sqlite.prepare("SELECT c.id FROM communities c JOIN businesses b ON b.id=c.source_business_id WHERE c.source_business_id=? AND b.type IN ('group','nonprofit') AND b.active=1");
  const insert=sqlite.prepare("INSERT OR IGNORE INTO community_relationships (community_id,target_type,target_id,relationship_type,created_at) VALUES (?,'event',?,'qsearch',?)");
  for(const brand of brands){if(brand.role!=="group"&&brand.role!=="place")continue;const community=find.get(brand.businessId) as {id:string}|undefined;if(community)insert.run(community.id,String(eventId),now());}
}
export function linkQSearchCandidateEvent(candidateId:string,eventId:number){
  const row=sqlite.prepare("SELECT brands_json FROM qsearch_candidates WHERE id=?").get(candidateId) as {brands_json:string}|undefined;
  if(!row)return;
  try{const brands=JSON.parse(row.brands_json);if(Array.isArray(brands))linkQSearchCommunityEvent(eventId,brands);}catch{/* Malformed archived candidate. */}
}
function communityEvents(id:string){
  const rows=sqlite.prepare(`SELECT DISTINCT e.id,e.title,e.date_start dateStart,e.date_end dateEnd,e.venue_name venueName,e.poster_image_url posterImageUrl FROM community_relationships r JOIN events e ON e.id=CAST(r.target_id AS INTEGER) WHERE r.community_id=? AND r.target_type='event' AND e.status='LIVE' AND e.is_public=1 AND e.is_private=0 ORDER BY e.date_start DESC LIMIT 180`).all(id) as Array<{id:number;title:string;dateStart:string;dateEnd:string;venueName:string;posterImageUrl:string|null}>;
  const upcoming:Array<typeof rows[number]&{url:string}>=[],past:typeof upcoming=[];
  for(const row of rows){const end=parsePacificDateTime(row.dateEnd||row.dateStart)??Date.parse(row.dateEnd||row.dateStart);const entry={...row,url:eventPath(row.id,row.title)};(Number.isFinite(end)&&end<Date.now()?past:upcoming).push(entry);}
  upcoming.sort((a,b)=>a.dateStart.localeCompare(b.dateStart));
  return {upcoming:upcoming.slice(0,60),past:past.slice(0,60)};
}
function relationships(id:string){ const rels=sqlite.prepare("SELECT target_type targetType,target_id targetId,relationship_type relationshipType FROM community_relationships WHERE community_id=? ORDER BY target_type,created_at").all(id) as any[]; return rels.map(rel=>{ let item:any=null; if(rel.targetType==="event"){item=sqlite.prepare("SELECT id,title name,date_start meta FROM events WHERE id=? AND status='LIVE'").get(Number(rel.targetId));if(item)item.url=eventPath(item.id,item.name);} if(rel.targetType==="place"){item=sqlite.prepare("SELECT id,name,neighborhood meta FROM businesses WHERE id=? AND active=1").get(Number(rel.targetId));if(item)item.url=placePath(item.id,item.name);} if(rel.targetType==="sellz"){item=sqlite.prepare("SELECT id,title name,neighborhood meta FROM sellz_posts WHERE id=? AND status IN ('ACTIVE','RESERVED')").get(Number(rel.targetId));if(item)item.url=`/sellz?post=${item.id}`;} if(rel.targetType==="gig"){item=sqlite.prepare("SELECT id,title name,location meta FROM gig_posts WHERE id=? AND status='LIVE'").get(Number(rel.targetId));if(item)item.url=`/pride-work?post=${item.id}`;} if(rel.targetType==="guide"){const path=text(rel.targetId,120).replace(/^\//,"");if(path)item={id:path,name:path.split("/").pop()!.replace(/[-_]/g," ").replace(/\b\w/g,c=>c.toUpperCase()),meta:"Guide",url:`/${path}`};} return item?{type:rel.targetType,relationshipType:rel.relationshipType,...item}:null; }).filter(Boolean); }
function detail(row:any,viewerId?:number){
  const mod=isMod(row.id,viewerId), active=Boolean(role(row.id,viewerId));
  const moderators=sqlite.prepare("SELECT u.id,u.username,u.display_name displayName,cm.role FROM community_memberships cm JOIN users u ON u.id=cm.user_id WHERE cm.community_id=? AND cm.status='active' AND cm.role IN ('owner','moderator') ORDER BY CASE cm.role WHEN 'owner' THEN 0 ELSE 1 END,u.username").all(row.id);
  const select="SELECT cp.id,cp.parent_post_id parentPostId,cp.title,cp.body,cp.media_url mediaUrl,cp.created_at createdAt,cp.updated_at updatedAt,u.id userId,u.username,u.display_name displayName,u.photo_url photoUrl FROM community_posts cp JOIN users u ON u.id=cp.user_id";
  const parents=sqlite.prepare(`${select} WHERE cp.community_id=? AND cp.status='published' AND cp.parent_post_id IS NULL ORDER BY cp.created_at DESC,cp.id DESC LIMIT 50`).all(row.id) as any[];
  const repliesByParent=new Map(parents.map(p=>[p.id,sqlite.prepare(`${select} WHERE cp.community_id=? AND cp.parent_post_id=? AND cp.status='published' ORDER BY cp.created_at,cp.id`).all(row.id,p.id) as any[]]));
  const ids=parents.flatMap(p=>[p.id,...(repliesByParent.get(p.id)||[]).map(reply=>reply.id)]);
  const voteRows:Array<{postId:number;userId:number;value:number}>=[];
  for(let start=0;start<ids.length;start+=500){const batch=ids.slice(start,start+500);voteRows.push(...sqlite.prepare(`SELECT post_id postId,user_id userId,value FROM community_post_votes WHERE post_id IN (${batch.map(()=>"?").join(",")})`).all(...batch) as typeof voteRows);}
  const scores=new Map<number,number>(), viewerVotes=new Map<number,-1|1>();
  for(const vote of voteRows){scores.set(vote.postId,(scores.get(vote.postId)||0)+vote.value);if(vote.userId===viewerId)viewerVotes.set(vote.postId,vote.value as -1|1);}
  const serialize=(p:any)=>({id:p.id,title:p.title||"",body:p.body,mediaUrl:p.mediaUrl||null,score:scores.get(p.id)||0,viewerVote:viewerVotes.get(p.id)||0,createdAt:p.createdAt,updatedAt:p.updatedAt||null,canEdit:active&&viewerId===p.userId,canModerate:mod,author:{id:p.userId,username:p.username,displayName:p.displayName,photoUrl:p.photoUrl}});
  const posts=parents.map(p=>({...serialize(p),replies:(repliesByParent.get(p.id)||[]).map(serialize)}));
  return {...summary(row,viewerId),rules:rules(row.rules),moderators,posts,events:communityEvents(row.id),related:relationships(row.id).filter(entry=>entry.relationshipType!=="qsearch")};
}
export function communityRelationshipFromUrl(value:unknown){
  try {
    const raw=String(value||"").trim();
    if(!raw || (!raw.startsWith("/")&&!/^https?:\/\//i.test(raw)))return null;
    const url=new URL(raw,"https://www.zaylist.com");
    if(!["zaylist.com","www.zaylist.com","prideguidepdx.com","www.prideguidepdx.com"].includes(url.hostname)||url.username||url.password)return null;
    const path=url.pathname.replace(/\/$/,"");
    const match=path.match(/^\/(event|events|directory)\/(\d+)(?:\/[^/]*)?$/);
    if(match)return {targetType:match[1]==="directory"?"place":"event",targetId:match[2]};
    if(["/sellz","/pride-work"].includes(path)&&/^\d+$/.test(url.searchParams.get("post")||""))return {targetType:path==="/sellz"?"sellz":"gig",targetId:url.searchParams.get("post")!};
    if(/^\/(?:outz(?:\/[-a-z0-9]+)?|guides\/[-a-z0-9]+)$/.test(path))return {targetType:"guide",targetId:path.slice(1)};
    return null;
  }catch{return null;}
}
function validRelationship(type:string,id:string){ if(!TARGETS.has(type))return false; if(type==="guide")return /^[-a-z0-9/]{1,120}$/.test(id.replace(/^\//,"")); const table=type==="event"?"events":type==="place"?"businesses":type==="sellz"?"sellz_posts":"gig_posts"; return Boolean(sqlite.prepare(`SELECT 1 FROM ${table} WHERE id=?`).get(Number(id))); }
export function searchCommunities(q:string,viewerId?:number){ const like=`%${q.replace(/[%_]/g,"")}%`; const rows=sqlite.prepare("SELECT * FROM communities WHERE visibility IN ('public','discoverable') AND (name LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE OR COALESCE(neighborhood,'') LIKE ? COLLATE NOCASE) ORDER BY name COLLATE NOCASE LIMIT 8").all(like,like,like) as any[]; return rows.map(row=>({id:row.id,name:row.name,subtitle:[row.neighborhood,`${summary(row,viewerId).memberCount} members`].filter(Boolean).join(" · "),href:`/z/${row.slug}`})); }

export function registerCommunityRoutes(app:Express,requireAuth:RequestHandler){
  ensureCommunityTables();
  app.get("/api/communities",(req:any,res)=>{const rows=sqlite.prepare("SELECT * FROM communities WHERE visibility IN ('public','discoverable') OR id IN (SELECT community_id FROM community_memberships WHERE user_id=? AND status='active') ORDER BY name COLLATE NOCASE").all(req.session?.userId||-1);res.json(rows.map(row=>summary(row,req.session?.userId)));});
  app.post("/api/communities",requireAuth,(req:any,res)=>{const owned=sqlite.prepare("SELECT COUNT(*) count FROM community_memberships WHERE user_id=? AND role='owner' AND joined_at>=datetime('now','-1 day')").get(req.session.userId) as any;if(Number(owned?.count||0)>=3)return res.status(429).json({error:"Community creation limit reached. Try again tomorrow."});const name=text(req.body?.name,100),description=text(req.body?.description,1200),slug=communitySlug(req.body?.slug||name);if(name.length<3||description.length<10)return res.status(400).json({error:"Name and a meaningful description are required"});if(RESERVED.has(slug)||bySlug(slug))return res.status(409).json({error:"That community address is reserved or already used"});if(!allowed({name,description},res))return;const visibility=VISIBILITY.has(req.body?.visibility)?req.body.visibility:"public",policy=POLICY.has(req.body?.membershipPolicy)?req.body.membershipPolicy:"open",id=`com_${randomUUID()}`,stamp=now();sqlite.transaction(()=>{sqlite.prepare("INSERT INTO communities (id,slug,name,description,image_url,neighborhood,visibility,membership_policy,rules,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(id,slug,name,description,text(req.body?.imageUrl,500)||null,text(req.body?.neighborhood,100)||null,visibility,policy,JSON.stringify(COMMUNITY_RULES),stamp,stamp);sqlite.prepare("INSERT INTO community_memberships (community_id,user_id,role,status,rules_version,joined_at) VALUES (?,?,'owner','active','1',?)").run(id,req.session.userId,stamp);audit(id,req.session.userId,"community_created","community",id,{visibility,policy});})();res.status(201).json(detail(bySlug(slug),req.session.userId));});
  app.get("/api/communities/:slug",(req:any,res)=>{const row=bySlug(req.params.slug);if(!row||!readable(row,req.session?.userId))return res.status(404).json({error:"Community not found"});res.json(detail(row,req.session?.userId));});
  app.post("/api/communities/:slug/claim",requireAuth,(req:any,res)=>{
    const row=bySlug(req.params.slug);
    if(!row||!readable(row,req.session.userId))return res.status(404).json({error:"Community not found"});
    const state=claimState(row);
    if(!state.isClaimable)return res.status(409).json({error:"This community is already owned or cannot be claimed."});
    if(state.hasPendingClaim)return res.status(409).json({error:"This community already has a pending claim."});
    const reason=text(req.body?.claimReason,500);
    if(reason.length<10)return res.status(400).json({error:"Tell us how you're connected to this community (10+ characters)."});
    if(!allowed({claimReason:reason},res))return;
    const result=storage.createBusinessClaim(row.source_business_id,req.session.userId,`Z/List community: ${reason}`);
    if("error" in result)return res.status(409).json({error:result.error});
    audit(row.id,req.session.userId,"community_claim_requested","community",row.id);
    res.status(201).json({ok:true,hasPendingClaim:true});
  });
  app.patch("/api/communities/:slug",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug);if(!row)return res.status(404).json({error:"Community not found"});if(!moderator(req,res,row))return;const name=req.body?.name===undefined?row.name:text(req.body.name,100),description=req.body?.description===undefined?row.description:text(req.body.description,1200);if(name.length<3||description.length<10)return res.status(400).json({error:"Name and a meaningful description are required"});if(!allowed({name,description},res))return;const visibility=VISIBILITY.has(req.body?.visibility)?req.body.visibility:row.visibility,policy=POLICY.has(req.body?.membershipPolicy)?req.body.membershipPolicy:row.membership_policy,newRules=Array.isArray(req.body?.rules)?req.body.rules.map((x:unknown)=>text(x,240)).filter(Boolean).slice(0,12):rules(row.rules);sqlite.prepare("UPDATE communities SET name=?,description=?,image_url=?,neighborhood=?,visibility=?,membership_policy=?,rules=?,updated_at=? WHERE id=?").run(name,description,req.body?.imageUrl===undefined?row.image_url:text(req.body.imageUrl,500)||null,req.body?.neighborhood===undefined?row.neighborhood:text(req.body.neighborhood,100)||null,visibility,policy,JSON.stringify(newRules),now(),row.id);audit(row.id,req.session.userId,"community_updated","community",row.id,{visibility,policy});res.json(detail(bySlug(req.params.slug),req.session.userId));});
  app.post("/api/communities/:slug/join",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug);if(!row)return res.status(404).json({error:"Community not found"});const existing=member(row.id,req.session.userId);if(existing?.status==="active")return res.json(detail(row,req.session.userId));if(existing?.status==="removed"||existing?.status==="rejected")return res.status(403).json({error:"Ask a community moderator to restore your membership"});if(row.membership_policy==="invite")return res.status(409).json({error:"This community is invite only"});const status=row.membership_policy==="request"?"pending":"active";sqlite.prepare("INSERT INTO community_memberships (community_id,user_id,role,status,following,rules_version,joined_at) VALUES (?,?,'member',?,1,'1',?) ON CONFLICT(community_id,user_id) DO UPDATE SET status=excluded.status,role='member',following=1,joined_at=excluded.joined_at").run(row.id,req.session.userId,status,now());audit(row.id,req.session.userId,status==="active"?"member_joined":"membership_requested","membership",req.session.userId);res.json(detail(row,req.session.userId));});
  app.delete("/api/communities/:slug/membership",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug);if(!row)return res.status(404).json({error:"Community not found"});const m=member(row.id,req.session.userId);if(m?.role==="owner")return res.status(409).json({error:"Transfer ownership before leaving"});sqlite.prepare("UPDATE community_memberships SET status='left' WHERE community_id=? AND user_id=?").run(row.id,req.session.userId);audit(row.id,req.session.userId,"member_left","membership",req.session.userId);res.status(204).end();});
  app.put("/api/communities/:slug/follow",requireAuth,(req:any,res)=>{
    const row=bySlug(req.params.slug);
    if(!row||!readable(row,req.session.userId))return res.status(404).json({error:"Community not found"});
    if(!role(row.id,req.session.userId))return res.status(403).json({error:"Join this community to follow its feed"});
    if(typeof req.body?.following!=="boolean")return res.status(400).json({error:"following must be true or false"});
    sqlite.prepare("UPDATE community_memberships SET following=? WHERE community_id=? AND user_id=? AND status='active'").run(req.body.following?1:0,row.id,req.session.userId);
    res.json({viewerFollowing:req.body.following});
  });
  app.get("/api/communities/:slug/manage",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug);if(!row)return res.status(404).json({error:"Community not found"});if(!moderator(req,res,row))return;const members=sqlite.prepare("SELECT u.id,u.username,u.display_name displayName,cm.role,cm.status,cm.joined_at joinedAt FROM community_memberships cm JOIN users u ON u.id=cm.user_id WHERE cm.community_id=? ORDER BY CASE cm.status WHEN 'pending' THEN 0 ELSE 1 END,cm.joined_at").all(row.id);const reports=sqlite.prepare("SELECT cr.*,u.username reporterUsername FROM community_reports cr JOIN users u ON u.id=cr.reporter_user_id WHERE cr.community_id=? ORDER BY CASE cr.status WHEN 'pending' THEN 0 ELSE 1 END,cr.created_at DESC LIMIT 100").all(row.id);const log=sqlite.prepare("SELECT a.*,u.username actorUsername FROM community_moderation_audit a JOIN users u ON u.id=a.actor_user_id WHERE a.community_id=? ORDER BY a.created_at DESC LIMIT 100").all(row.id);res.json({members,reports,audit:log,relationships:relationships(row.id)});});
  app.patch("/api/communities/:slug/members/:userId",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug);if(!row)return res.status(404).json({error:"Community not found"});if(!moderator(req,res,row))return;const actor=role(row.id,req.session.userId),targetId=Number(req.params.userId),target=member(row.id,targetId);if(!target)return res.status(404).json({error:"Membership not found"});const status=["active","removed","rejected"].includes(req.body?.status)?req.body.status:target.status,nextRole=["member","moderator"].includes(req.body?.role)?req.body.role:target.role;if(target.role==="owner"||(nextRole==="moderator"&&actor!=="owner"))return res.status(403).json({error:"Only the owner can change moderator roles"});sqlite.prepare("UPDATE community_memberships SET status=?,role=? WHERE community_id=? AND user_id=?").run(status,nextRole,row.id,targetId);audit(row.id,req.session.userId,"membership_updated","membership",targetId,{status,role:nextRole});res.json({ok:true});});
  app.post("/api/communities/:slug/transfer-ownership",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug);if(!row)return res.status(404).json({error:"Community not found"});if(role(row.id,req.session.userId)!=="owner")return res.status(403).json({error:"Only the owner can transfer ownership"});const targetId=Number(req.body?.userId),target=member(row.id,targetId);if(!target||target.status!=="active")return res.status(409).json({error:"New owner must be an active member"});sqlite.transaction(()=>{sqlite.prepare("UPDATE community_memberships SET role='moderator' WHERE community_id=? AND user_id=?").run(row.id,req.session.userId);sqlite.prepare("UPDATE community_memberships SET role='owner' WHERE community_id=? AND user_id=?").run(row.id,targetId);audit(row.id,req.session.userId,"ownership_transferred","membership",targetId);})();res.json({ok:true});});
  app.post("/api/communities/:slug/relationships",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug);if(!row)return res.status(404).json({error:"Community not found"});if(!moderator(req,res,row))return;const linked=req.body?.url ? communityRelationshipFromUrl(req.body.url) : null;if(req.body?.url&&!linked)return res.status(400).json({error:"Paste a Zaylist event, place, listing, or OUTZ guide link"});const targetType=linked?.targetType||text(req.body?.targetType,20).toLowerCase(),targetId=linked?.targetId||text(req.body?.targetId,120);if(!validRelationship(targetType,targetId))return res.status(400).json({error:"Choose a valid EVENTZ, SELLZ, GIGZ, Place, or Guide object"});sqlite.prepare("INSERT OR IGNORE INTO community_relationships (community_id,target_type,target_id,relationship_type,created_at) VALUES (?,?,?,'related',?)").run(row.id,targetType,targetId,now());audit(row.id,req.session.userId,"relationship_added",targetType,targetId);res.status(201).json(relationships(row.id));});
  app.delete("/api/communities/:slug/relationships/:targetType/:targetId",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug);if(!row)return res.status(404).json({error:"Community not found"});if(!moderator(req,res,row))return;sqlite.prepare("DELETE FROM community_relationships WHERE community_id=? AND target_type=? AND target_id=? AND relationship_type='related'").run(row.id,req.params.targetType,req.params.targetId);audit(row.id,req.session.userId,"relationship_removed",req.params.targetType,req.params.targetId);res.status(204).end();});
  app.post("/api/communities/:slug/posts",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug);if(!row||!readable(row,req.session.userId))return res.status(404).json({error:"Community not found"});if(!role(row.id,req.session.userId))return res.status(403).json({error:"Join this community before posting"});if(limited(row.id,req.session.userId,"community_posts",12))return res.status(429).json({error:"Posting limit reached. Try again later."});const title=text(req.body?.title,160),body=text(req.body?.body,2000),mediaRaw=String(req.body?.mediaUrl||"").trim(),media=redgifsMedia(mediaRaw);if(mediaRaw&&!media)return res.status(400).json({error:"Use a RedGIFs photo or video link"});if(!title&&!body&&!media)return res.status(400).json({error:"A title, post body, or RedGIFs link is required"});if(!allowed({title,post:body},res))return;const stamp=now(),result=sqlite.prepare("INSERT INTO community_posts (community_id,user_id,title,body,media_url,status,created_at,updated_at) VALUES (?,?,?,?,?,'published',?,?)").run(row.id,req.session.userId,title,body,media?.watchUrl||null,stamp,stamp);audit(row.id,req.session.userId,"post_created","post",Number(result.lastInsertRowid));res.status(201).json(detail(row,req.session.userId));});
  app.post("/api/communities/:slug/posts/:postId/replies",requireAuth,(req:any,res)=>{
    const row=bySlug(req.params.slug);
    if(!row||!readable(row,req.session.userId))return res.status(404).json({error:"Community not found"});
    if(!role(row.id,req.session.userId))return res.status(403).json({error:"Join this community before replying"});
    const parent=sqlite.prepare("SELECT id FROM community_posts WHERE id=? AND community_id=? AND status='published' AND parent_post_id IS NULL").get(Number(req.params.postId),row.id) as any;
    if(!parent)return res.status(404).json({error:"Post not found"});
    if(limited(row.id,req.session.userId,"community_posts",12))return res.status(429).json({error:"Posting limit reached. Try again later."});
    const body=text(req.body?.body,2000);
    if(!body)return res.status(400).json({error:"Reply body is required"});
    if(!allowed({reply:body},res))return;
    const stamp=now();
    const result=sqlite.prepare("INSERT INTO community_posts (community_id,user_id,parent_post_id,body,status,created_at,updated_at) VALUES (?,?,?,?,'published',?,?)").run(row.id,req.session.userId,parent.id,body,stamp,stamp);
    audit(row.id,req.session.userId,"reply_created","post",Number(result.lastInsertRowid),{parentPostId:parent.id});
    res.status(201).json(detail(row,req.session.userId));
  });
  app.put("/api/communities/:slug/posts/:postId/vote",requireAuth,(req:any,res)=>{
    const row=bySlug(req.params.slug);
    if(!row||!readable(row,req.session.userId))return res.status(404).json({error:"Community not found"});
    if(!role(row.id,req.session.userId))return res.status(403).json({error:"Join this community before voting"});
    const postId=Number(req.params.postId),value=req.body?.value;
    if(!Number.isSafeInteger(postId)||postId<1||![0,1,-1].includes(value))return res.status(400).json({error:"Invalid vote"});
    const found=sqlite.prepare("SELECT id FROM community_posts WHERE id=? AND community_id=? AND status='published' AND (parent_post_id IS NULL OR parent_post_id IN (SELECT id FROM community_posts WHERE community_id=? AND status='published'))").get(postId,row.id,row.id);
    if(!found)return res.status(404).json({error:"Post not found"});
    if(value===0)sqlite.prepare("DELETE FROM community_post_votes WHERE post_id=? AND user_id=?").run(postId,req.session.userId);
    else sqlite.prepare("INSERT INTO community_post_votes (post_id,user_id,value) VALUES (?,?,?) ON CONFLICT(post_id,user_id) DO UPDATE SET value=excluded.value").run(postId,req.session.userId,value);
    res.json({ok:true});
  });
  app.patch("/api/communities/:slug/posts/:postId",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug),post=sqlite.prepare("SELECT * FROM community_posts WHERE id=? AND community_id=? AND status='published' AND (parent_post_id IS NULL OR parent_post_id IN (SELECT id FROM community_posts WHERE status='published'))").get(Number(req.params.postId),row?.id||"") as any;if(!row||!readable(row,req.session.userId)||!post)return res.status(404).json({error:"Post not found"});if(!role(row.id,req.session.userId))return res.status(403).json({error:"Active community membership required"});if(post.user_id!==req.session.userId)return res.status(403).json({error:"Only the author can edit this post"});const title=post.parent_post_id?"":text(req.body?.title===undefined?post.title:req.body.title,160),body=text(req.body?.body,2000),mediaRaw=post.parent_post_id?"":String(req.body?.mediaUrl===undefined?post.media_url||"":req.body.mediaUrl||"").trim(),media=redgifsMedia(mediaRaw);if(mediaRaw&&!media)return res.status(400).json({error:"Use a RedGIFs photo or video link"});if(!title&&!body&&!media)return res.status(400).json({error:"A title, post body, or RedGIFs link is required"});if(!allowed({title,post:body},res))return;sqlite.prepare("UPDATE community_posts SET title=?,body=?,media_url=?,updated_at=? WHERE id=?").run(title,body,media?.watchUrl||null,now(),post.id);audit(row.id,req.session.userId,"post_edited","post",post.id);res.json(detail(row,req.session.userId));});
  app.delete("/api/communities/:slug/posts/:postId",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug),post=sqlite.prepare("SELECT * FROM community_posts WHERE id=? AND community_id=? AND status='published' AND (parent_post_id IS NULL OR parent_post_id IN (SELECT id FROM community_posts WHERE status='published'))").get(Number(req.params.postId),row?.id||"") as any;if(!row||!readable(row,req.session.userId)||!post)return res.status(404).json({error:"Post not found"});if(!role(row.id,req.session.userId))return res.status(403).json({error:"Active community membership required"});if(post.user_id!==req.session.userId&&!isMod(row.id,req.session.userId))return res.status(403).json({error:"Post author or moderator access required"});sqlite.prepare("UPDATE community_posts SET status='removed',updated_at=? WHERE id=?").run(now(),post.id);audit(row.id,req.session.userId,"post_removed","post",post.id);res.status(204).end();});
  app.post("/api/communities/:slug/posts/:postId/report",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug),post=sqlite.prepare("SELECT id FROM community_posts WHERE id=? AND community_id=? AND status='published' AND (parent_post_id IS NULL OR parent_post_id IN (SELECT id FROM community_posts WHERE status='published'))").get(Number(req.params.postId),row?.id||"") as any;if(!row||!readable(row,req.session.userId)||!post)return res.status(404).json({error:"Post not found"});if(!role(row.id,req.session.userId))return res.status(403).json({error:"Active community membership required"});if(limited(row.id,req.session.userId,"community_reports",8))return res.status(429).json({error:"Reporting limit reached. Try again later."});const reason=text(req.body?.reason,500);if(reason.length<5)return res.status(400).json({error:"Tell moderators what is wrong"});sqlite.prepare("INSERT INTO community_reports (community_id,post_id,reporter_user_id,reason,status,created_at) VALUES (?,?,?,?,'pending',?)").run(row.id,post.id,req.session.userId,reason,now());audit(row.id,req.session.userId,"post_reported","post",post.id);res.status(201).json({ok:true});});
  app.patch("/api/communities/:slug/reports/:reportId",requireAuth,(req:any,res)=>{const row=bySlug(req.params.slug);if(!row)return res.status(404).json({error:"Community not found"});if(!moderator(req,res,row))return;const status=req.body?.status==="actioned"?"actioned":"dismissed";sqlite.prepare("UPDATE community_reports SET status=?,resolution_note=?,resolved_by=?,resolved_at=? WHERE id=? AND community_id=?").run(status,text(req.body?.note,500)||null,req.session.userId,now(),Number(req.params.reportId),row.id);audit(row.id,req.session.userId,"report_resolved","report",req.params.reportId,{status});res.json({ok:true});});
}
