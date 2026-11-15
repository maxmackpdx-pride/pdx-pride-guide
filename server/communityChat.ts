import type { Express, RequestHandler } from 'express';
import { sqlite, storage } from './storage';
import { moderateFields, moderationMessage } from '@shared/contentModeration';

export function ensureCommunityChatTables() {
  sqlite.transaction(() => {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS community_chat_settings(community_id TEXT PRIMARY KEY,mode TEXT NOT NULL DEFAULT 'off');
      CREATE TABLE IF NOT EXISTS community_chat_members(community_id TEXT NOT NULL,user_id INTEGER NOT NULL,muted INTEGER NOT NULL DEFAULT 0,last_read_id INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(community_id,user_id));
      CREATE TABLE IF NOT EXISTS community_chat_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,community_id TEXT NOT NULL,user_id INTEGER NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS community_chat_feed ON community_chat_messages(community_id,id);`);
  })();
}
const community = (slug:string) => sqlite.prepare('SELECT * FROM communities WHERE slug=?').get(slug) as any;
const membership = (id:string,userId:number) => sqlite.prepare("SELECT * FROM community_memberships WHERE community_id=? AND user_id=? AND status='active'").get(id,userId) as any;
export function communityChatState(id:string,userId?:number) {
  const mode=(sqlite.prepare('SELECT mode FROM community_chat_settings WHERE community_id=?').get(id) as any)?.mode || 'off';
  const m=userId ? membership(id,userId):null;
  const joined=userId ? sqlite.prepare('SELECT * FROM community_chat_members WHERE community_id=? AND user_id=?').get(id,userId) as any:null;
  const eligible=Boolean(m && m.following!==0 && mode!=='off');
  const unread=eligible&&joined ? (sqlite.prepare('SELECT user_id FROM community_chat_messages WHERE community_id=? AND id>? AND user_id!=?').all(id,joined.last_read_id,userId) as any[]).filter(m=>!storage.isMemberInteractionBlocked(userId!,m.user_id)).length:0;
  return {mode,canJoin:eligible,joined:Boolean(eligible&&joined),muted:Boolean(joined?.muted),unreadCount:unread,canPost:eligible&&Boolean(joined)&&(mode==='chat'||m?.role==='owner'||m?.role==='moderator')};
}
export function getCommunityChatRoomsForUser(userId:number) {
  return (sqlite.prepare(`SELECT c.id,c.slug,c.name FROM communities c JOIN community_chat_members cm ON cm.community_id=c.id WHERE cm.user_id=?`).all(userId) as any[]).flatMap(c=>{
    const state=communityChatState(c.id,userId);
    return state.joined ? [{kind:'COMMUNITY',id:c.slug,title:c.name,state:'OPEN',opensAt:null,closesAt:null,href:`/z/${c.slug}`,unreadCount:state.unreadCount,muted:state.muted,mode:state.mode}]:[];
  });
}
export function registerCommunityChatRoutes(app:Express,requireAuth:RequestHandler) {
  ensureCommunityChatTables();
  app.get('/api/community-chats/mine',requireAuth,(req:any,res)=>{res.setHeader('Cache-Control','no-store');res.json(getCommunityChatRoomsForUser(req.session.userId));});
  app.use('/api/communities/:slug/chat',(_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
  app.get('/api/communities/:slug/chat',requireAuth,(req:any,res)=>{
    const c=community(req.params.slug); if(!c)return res.sendStatus(404);
    const state=communityChatState(c.id,req.session.userId); if(!state.joined)return res.status(403).json({error:'Follow and join this chat first'});
    const messages=(sqlite.prepare(`SELECT m.id,m.body,m.created_at createdAt,u.username,u.display_name displayName,u.photo_url photoUrl,m.user_id userId FROM community_chat_messages m JOIN users u ON u.id=m.user_id WHERE community_id=? ORDER BY m.id DESC LIMIT 100`).all(c.id) as any[]).reverse().filter(m=>m.userId===req.session.userId||!storage.isMemberInteractionBlocked(req.session.userId,m.userId)).map(({userId,...m})=>({...m,isMine:userId===req.session.userId}));
    res.json({...state,messages});
  });
  app.put('/api/communities/:slug/chat/settings',requireAuth,(req:any,res)=>{
    const c=community(req.params.slug); if(!c)return res.sendStatus(404);
    if(membership(c.id,req.session.userId)?.role!=='owner')return res.sendStatus(403);
    if(!['off','news','chat'].includes(req.body?.mode))return res.status(400).json({error:'Invalid chat mode'});
    sqlite.prepare('INSERT INTO community_chat_settings(community_id,mode) VALUES(?,?) ON CONFLICT(community_id) DO UPDATE SET mode=excluded.mode').run(c.id,req.body.mode);
    res.json(communityChatState(c.id,req.session.userId));
  });
  app.post('/api/communities/:slug/chat/join',requireAuth,(req:any,res)=>{
    const c=community(req.params.slug);if(!c)return res.sendStatus(404);
    if(!communityChatState(c.id,req.session.userId).canJoin)return res.status(403).json({error:'Follow this page before joining its chat'});
    sqlite.prepare('INSERT OR IGNORE INTO community_chat_members(community_id,user_id,last_read_id) VALUES(?,?,COALESCE((SELECT MAX(id) FROM community_chat_messages WHERE community_id=?),0))').run(c.id,req.session.userId,c.id);
    res.json(communityChatState(c.id,req.session.userId));
  });
  app.delete('/api/communities/:slug/chat/membership',requireAuth,(req:any,res)=>{
    const c=community(req.params.slug);if(!c)return res.sendStatus(404);
    sqlite.prepare('DELETE FROM community_chat_members WHERE community_id=? AND user_id=?').run(c.id,req.session.userId);res.sendStatus(204);
  });
  app.patch('/api/communities/:slug/chat/membership',requireAuth,(req:any,res)=>{
    const c=community(req.params.slug);if(!c)return res.sendStatus(404);
    if(!communityChatState(c.id,req.session.userId).joined)return res.sendStatus(403);
    if(typeof req.body?.muted!=='boolean')return res.sendStatus(400);
    sqlite.prepare('UPDATE community_chat_members SET muted=? WHERE community_id=? AND user_id=?').run(req.body.muted?1:0,c.id,req.session.userId);res.json(communityChatState(c.id,req.session.userId));
  });
  app.put('/api/communities/:slug/chat/read',requireAuth,(req:any,res)=>{
    const c=community(req.params.slug);if(!c)return res.sendStatus(404);
    if(!communityChatState(c.id,req.session.userId).joined)return res.sendStatus(403);
    const id=Number(req.body?.lastReadId);if(!Number.isSafeInteger(id)||id<0)return res.sendStatus(400);
    const max=Number((sqlite.prepare('SELECT COALESCE(MAX(id),0) id FROM community_chat_messages WHERE community_id=?').get(c.id) as any).id);
    sqlite.prepare('UPDATE community_chat_members SET last_read_id=MAX(last_read_id,?) WHERE community_id=? AND user_id=?').run(Math.min(id,max),c.id,req.session.userId);res.sendStatus(204);
  });
  app.post('/api/communities/:slug/chat',requireAuth,(req:any,res)=>{
    const c=community(req.params.slug);if(!c)return res.sendStatus(404);
    if(!communityChatState(c.id,req.session.userId).canPost)return res.status(403).json({error:'This feed is read-only or membership is required'});
    const body=String(req.body?.body||'').trim();if(!body||body.length>500)return res.status(400).json({error:'Write a message of 1–500 characters'});
    const verdict=moderateFields({body});if(verdict.verdict!=='ALLOW')return res.status(400).json({error:moderationMessage(verdict.reasons[0]?.category||"OTHER")});
    const recent=sqlite.prepare("SELECT COUNT(*) n FROM community_chat_messages WHERE user_id=? AND julianday(created_at)>julianday('now','-1 minute')").get(req.session.userId) as any;
    if(recent.n>=20)return res.status(429).json({error:'Please wait before sending more messages'});
    const result=sqlite.prepare('INSERT INTO community_chat_messages(community_id,user_id,body,created_at) VALUES(?,?,?,?)').run(c.id,req.session.userId,body,new Date().toISOString());res.status(201).json({id:Number(result.lastInsertRowid)});
  });
}
