import type {Express,RequestHandler} from 'express';
import {sqlite,storage} from './storage';
import {communityEvents} from './communities';
import {placePath} from '@shared/placeSlug';
import {isDemoAuthor} from '@shared/demo';
import {getActiveOutzBoardMetadata} from './outzSocial';
import {getCommunityChatRoomsForUser} from './communityChat';
export function ensureCardNotificationTables(){sqlite.exec('CREATE TABLE IF NOT EXISTS directory_card_read(user_id INTEGER NOT NULL,kind TEXT NOT NULL,ref TEXT NOT NULL,gig_id INTEGER NOT NULL DEFAULT 0,mizzed_id INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,kind,ref));CREATE TABLE IF NOT EXISTS outz_card_read(user_id INTEGER NOT NULL,place_id TEXT NOT NULL,last_read_id INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,place_id))');}
export function outzCardNotifications(userId:number){
 const posts=getActiveOutzBoardMetadata(userId).filter(p=>p.userId!==userId);
 return (sqlite.prepare('SELECT f.place_id id,f.place_name name,f.created_at followedAt,COALESCE(r.last_read_id,0) lastReadId FROM outz_destination_follows f LEFT JOIN outz_card_read r ON r.user_id=f.user_id AND r.place_id=f.place_id WHERE f.user_id=?').all(userId) as any[]).map(f=>{
  const active=posts.filter(p=>p.placeId===f.id);const unread=active.filter(p=>p.id>f.lastReadId&&Date.parse(p.createdAt)>Date.parse(f.followedAt));
  return {kind:'OUTZ',id:f.id,title:f.name,href:`/outzide?place=${encodeURIComponent(f.id)}`,unreadCount:unread.length,lastVisibleId:Math.max(0,...active.map(p=>p.id)),counts:{mizzed:unread.filter(p=>p.postKind==='MISSED_CONNECTION').length,carpool:unread.filter(p=>p.postKind.startsWith('CARPOOL')).length,buddy:unread.filter(p=>!p.postKind.startsWith('CARPOOL')&&p.postKind!=='MISSED_CONNECTION').length}};
 });
}
export function directoryCardNotifications(userId:number){
 const visibleAuthor=(author:number|null|undefined)=>author!==userId&&(!author||!storage.isMemberInteractionBlocked(userId,author));
 const gigs=storage.getGigPosts('LIVE').filter(g=>visibleAuthor(g.userId)&&!isDemoAuthor({username:g.username,displayName:g.name}));
 const authors=new Map((sqlite.prepare('SELECT id,user_id FROM missed_connections').all() as any[]).map(m=>[m.id,m.user_id]));
 const publicEvents=new Set((sqlite.prepare("SELECT id FROM events WHERE status='LIVE' AND is_public=1 AND is_private=0").all() as any[]).map(e=>e.id));
 const mizzed=storage.getMissedConnections('ACTIVE',userId).filter((m:any)=>visibleAuthor(authors.get(m.id))&&(!m.eventId||publicEvents.has(m.eventId))&&!m.isDemo);
 const make=(kind:'placez'|'scenez',ref:string,title:string,href:string,since:string,gg:typeof gigs,mm:any[])=>{
  const cursor=sqlite.prepare('SELECT gig_id gigId,mizzed_id mizzedId FROM directory_card_read WHERE user_id=? AND kind=? AND ref=?').get(userId,kind,ref) as any;
  const fresh=(p:any,id:number)=>p.id>id&&Date.parse(p.createdAt)>Date.parse(since);
  const counts={gigz:gg.filter(g=>fresh(g,cursor?.gigId||0)).length,mizzed:mm.filter(m=>fresh(m,cursor?.mizzedId||0)).length};
  return {kind,id:ref,title,href,unreadCount:counts.gigz+counts.mizzed,counts,lastVisible:{gigz:Math.max(0,...gg.map(g=>g.id)),mizzed:Math.max(0,...mm.map(m=>m.id))}};
 };
 const followedPlaces=sqlite.prepare('SELECT b.id,b.name,b.type,f.created_at followedAt FROM business_follows f JOIN businesses b ON b.id=f.business_id WHERE f.follower_user_id=? AND b.active=1').all(userId) as Array<{id:number;name:string;type:string;followedAt:string}>;
 const placez=followedPlaces.filter(b=>b.type!=='group'&&b.type!=='nonprofit').map(b=>make('placez',String(b.id),b.name,placePath(b.id,b.name),b.followedAt,gigs.filter(g=>g.businessId===b.id),mizzed.filter((m:any)=>m.placeId===b.id)));
 const communities=sqlite.prepare("SELECT c.*,m.joined_at FROM communities c JOIN community_memberships m ON m.community_id=c.id WHERE m.user_id=? AND m.status='active' AND m.following=1").all(userId) as any[];
 const scenezBoards=communities.map(c=>{
  const related=sqlite.prepare("SELECT target_id FROM community_relationships WHERE community_id=? AND target_type='gig'").all(c.id) as any[];const gigIds=new Set(related.map(r=>Number(r.target_id)));
  const events=communityEvents(c.id);const eventIds=new Set([...events.upcoming,...events.past].map(e=>e.id));
  return make('scenez',c.slug,c.name,`/z/${encodeURIComponent(c.slug)}`,c.joined_at,gigs.filter(g=>(c.source_business_id&&g.businessId===c.source_business_id)||gigIds.has(g.id)),mizzed.filter((m:any)=>eventIds.has(m.eventId)));
 });
 return {placez,scenezBoards};
}
export function registerCardNotificationRoutes(app:Express,auth:RequestHandler){
 ensureCardNotificationTables();
 // Both the cards and Hub use this same persisted read-state contract.
 app.get('/api/card-notifications',auth,(req:any,res)=>{res.setHeader('Cache-Control','private, no-store');res.json({outzide:outzCardNotifications(req.session.userId),scenez:getCommunityChatRoomsForUser(req.session.userId),...directoryCardNotifications(req.session.userId)});});
 app.put('/api/card-notifications/directory/:kind/:id/read',auth,(req:any,res)=>{
  const kind=req.params.kind;if(kind!=='placez'&&kind!=='scenez')return res.sendStatus(404);
  const all=directoryCardNotifications(req.session.userId);const row=(kind==='placez'?all.placez:all.scenezBoards).find(r=>r.id===req.params.id);if(!row)return res.sendStatus(404);
  const value=req.body?.lastVisible;if(!value||!Number.isSafeInteger(value.gigz)||value.gigz<0||!Number.isSafeInteger(value.mizzed)||value.mizzed<0)return res.sendStatus(400);
  sqlite.prepare('INSERT INTO directory_card_read(user_id,kind,ref,gig_id,mizzed_id) VALUES(?,?,?,?,?) ON CONFLICT(user_id,kind,ref) DO UPDATE SET gig_id=MAX(gig_id,excluded.gig_id),mizzed_id=MAX(mizzed_id,excluded.mizzed_id)').run(req.session.userId,kind,row.id,Math.min(value.gigz,row.lastVisible.gigz),Math.min(value.mizzed,row.lastVisible.mizzed));res.sendStatus(204);
 });
 app.put('/api/card-notifications/outzide/:id/read',auth,(req:any,res)=>{
  const row=outzCardNotifications(req.session.userId).find(r=>r.id===req.params.id);if(!row)return res.sendStatus(404);
  const id=req.body?.lastVisibleId;if(!Number.isSafeInteger(id)||id<0)return res.sendStatus(400);
  sqlite.prepare('INSERT INTO outz_card_read(user_id,place_id,last_read_id) VALUES(?,?,?) ON CONFLICT(user_id,place_id) DO UPDATE SET last_read_id=MAX(last_read_id,excluded.last_read_id)').run(req.session.userId,row.id,Math.min(id,row.lastVisibleId));res.sendStatus(204);
 });
}
