import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import express from 'express';

// Actual router and storage against a disposable copy, never the tracked seed or live database.
mkdirSync('.local', { recursive: true });
const directory = mkdtempSync(path.resolve('.local/community-privacy-'));
process.env.DATABASE_PATH = path.join(directory, 'data.db');
copyFileSync('data.db', process.env.DATABASE_PATH);
const { sqlite } = await import('./storage');
const { registerCommunityRoutes } = await import('./communities');
const {registerCardNotificationRoutes}=await import('./cardNotifications');
const app = express(); app.use(express.json());
app.use((req:any, _res, next) => { req.session = { userId: Number(req.get('x-fixture-user')) || undefined }; next(); });
registerCommunityRoutes(app, (req:any,res,next) => req.session.userId ? next() : res.sendStatus(401));
registerCardNotificationRoutes(app,(req:any,res,next)=>req.session.userId?next():res.sendStatus(401));
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${(server.address() as {port:number}).port}`;
after(async () => { await new Promise<void>((resolve,reject) => server.close(e => e ? reject(e) : resolve())); sqlite.close(); rmSync(directory,{recursive:true,force:true}); });
async function call(method:string, endpoint:string, userId?:number, body?:unknown) {
  const response = await fetch(base + endpoint, {method, headers:{'content-type':'application/json', ...(userId ? {'x-fixture-user':String(userId)} : {})}, ...(body === undefined ? {} : {body:JSON.stringify(body)})});
  return { status:response.status, body:response.status===204 ? null : await response.text().then(t=>{try{return JSON.parse(t)}catch{return t}}) as any };
}
function user(name:string) { return Number(sqlite.prepare('INSERT INTO users(username,email,password_hash) VALUES(?,?,?)').run(`privacy_${name}`,`${name}@privacy.invalid`,'not-a-password').lastInsertRowid); }
const owner=user('owner'), applicant=user('applicant'), member=user('member');
function community(slug:string, visibility='private', policy='request') {
  const id=`com_privacy_${slug}`;
  sqlite.prepare('INSERT INTO communities(id,slug,name,description,visibility,membership_policy,rules) VALUES(?,?,?,?,?,?,?)').run(id,slug,slug,'Synthetic privacy fixture',visibility,policy,'["PRIVATE RULE"]');
  for(const [uid,role] of [[owner,'owner'],[member,'member']] as const) sqlite.prepare("INSERT INTO community_memberships(community_id,user_id,role,status) VALUES(?,?,?,'active')").run(id,uid,role);
  const postId=Number(sqlite.prepare("INSERT INTO community_posts(community_id,user_id,title,body,media_url,status) VALUES(?,?,'PRIVATE TITLE','PRIVATE BODY','https://example.invalid/PRIVATE','published')").run(id,owner).lastInsertRowid);
  sqlite.prepare("INSERT INTO community_posts(community_id,user_id,parent_post_id,body,status) VALUES(?,?,?,'PRIVATE REPLY','published')").run(id,owner,postId);
  return id;
}


test('chat joins require active followers and owner-enabled mode; private pending cannot read',async()=>{
 const id=community('chat-access');const url='/api/communities/chat-access/chat';
 assert.equal((await call('POST',url+'/join',member,{})).status,403);
 assert.equal((await call('PUT',url+'/settings',member,{mode:'chat'})).status,403);
 assert.equal((await call('PUT',url+'/settings',owner,{mode:'chat'})).status,200);
 await call('POST','/api/communities/chat-access/join',applicant,{});
 assert.equal((await call('POST',url+'/join',applicant,{})).status,403);
 assert.equal((await call('GET',url,applicant)).status,403);
 assert.equal((await call('POST',url+'/join',member,{})).body.joined,true);
 assert.equal((await call('POST',url+'/join',owner,{})).body.joined,true);
 assert.equal((await call('POST',url,owner,{body:'Hello members'})).status,201);
 const feed=await call('GET',url,member);assert.equal(feed.body.unreadCount,1);assert.equal(feed.body.messages[0].body,'Hello members');
 assert.equal((await call('PATCH',url+'/membership',member,{muted:true})).body.muted,true);
 const rooms=await call('GET','/api/community-chats/mine',member);assert.equal(rooms.body[0].id,'chat-access');assert.equal(rooms.body[0].unreadCount,1);
 await call('PUT',url+'/read',member,{lastReadId:9999999});assert.equal((await call('GET',url,member)).body.unreadCount,0);
 await call('PUT',url+'/read',member,{lastReadId:0});assert.equal((await call('GET',url,member)).body.unreadCount,0);
 await call('POST',url,owner,{body:'Second message'});assert.equal((await call('GET',url,member)).body.unreadCount,1);
 await call('PUT','/api/communities/chat-access/follow',member,{following:false});
 assert.equal((await call('GET',url,member)).status,403);assert.equal((await call('GET','/api/community-chats/mine',member)).body.length,0);
});
test('news mode prevents member posting; leave and removal revoke inbox content',async()=>{
 const id=community('chat-news','public','open'),url='/api/communities/chat-news/chat';
 await call('PUT',url+'/settings',owner,{mode:'news'});
 for(const uid of [owner,member])await call('POST',url+'/join',uid,{});
 assert.equal((await call('POST',url,member,{body:'Not allowed'})).status,403);
 assert.equal((await call('POST',url,owner,{body:'News update'})).status,201);
 assert.equal((await call('GET',url,applicant)).status,403);
 await call('DELETE',url+'/membership',member);
 assert.equal((await call('GET',url,member)).status,403);
 await call('POST',url+'/join',member,{});
 sqlite.prepare("UPDATE community_memberships SET status='removed' WHERE community_id=? AND user_id=?").run(id,member);
 assert.equal((await call('GET',url,member)).status,403);
 assert.equal((await call('POST',url+'/join',member,{})).status,403);
});

test('OutZ card unread state is follower-scoped, persistent and excludes own or expired activity',async()=>{
 const place='notification-fixture';sqlite.prepare('INSERT INTO outz_destination_follows(user_id,place_id,place_name,created_at) VALUES(?,?,?,?)').run(member,place,'Fixture','2020-01-01T00:00:00Z');
 const insert=sqlite.prepare('INSERT INTO outz_wall_posts(place_id,user_id,post_kind,body,created_at,trip_date) VALUES(?,?,?,?,?,?)');
 const id=Number(insert.run(place,owner,'CARPOOL','A ride',new Date().toISOString(),null).lastInsertRowid);
 insert.run(place,member,'HIKE_BUDDY','Own post',new Date().toISOString(),null);
 insert.run(place,owner,'HIKE_BUDDY','Expired',new Date().toISOString(),'2020-01-01');
 const card=(await call('GET','/api/card-notifications',member)).body.outzide.find((r:any)=>r.id===place);
 assert.equal(card.unreadCount,1);assert.equal(card.counts.carpool,1);
 assert.equal((await call('PUT',`/api/card-notifications/outzide/${place}/read`,applicant,{lastVisibleId:id})).status,404);
 await call('PUT',`/api/card-notifications/outzide/${place}/read`,member,{lastVisibleId:id});
 assert.equal((await call('GET','/api/card-notifications',member)).body.outzide.find((r:any)=>r.id===place).unreadCount,0);
 insert.run(place,owner,'HIKE_BUDDY','New buddy post',new Date().toISOString(),null);
 assert.equal((await call('GET','/api/card-notifications',member)).body.outzide.find((r:any)=>r.id===place).counts.buddy,1);
});

test('SceneZ Boardz only returns linked live gigs and strips workflow contact data',async()=>{
 const id=community('boardz-real','public','open');
 const g=Number(sqlite.prepare("INSERT INTO gig_posts(type,role,location,title,name,contact_email,description,status,admin_notes,created_at) VALUES('POSTING_GIG','Fixture role','Portland','Fixture gig','Poster','SECRET CONTACT','Useful work','LIVE','SECRET NOTE',?)").run(new Date().toISOString()).lastInsertRowid);
 sqlite.prepare("INSERT INTO community_relationships(community_id,target_type,target_id,relationship_type) VALUES(?,'gig',?,'related')").run(id,String(g));
 const response=await call('GET','/api/communities/boardz-real/boardz');
 assert.equal(response.status,200);assert.equal(response.body.gigz[0].id,g);assert.equal(response.body.gigz[0].status,'LIVE');
 assert.ok(!JSON.stringify(response.body).includes('SECRET'));
 assert.equal((await call('GET','/api/communities/chat-access/boardz',applicant)).status,404);
});

test('directory BoardZ counts only actual followed-place and SceneZ relationships, and read state is per user',async()=>{
 const business=sqlite.prepare("SELECT id,name FROM businesses WHERE active=1 AND type NOT IN ('group','nonprofit') LIMIT 1").get() as any;assert.ok(business);
 sqlite.prepare('INSERT OR IGNORE INTO business_follows(follower_user_id,business_id,created_at) VALUES(?,?,?)').run(member,business.id,'2020-01-01T00:00:00Z');
 const scene=community('notice-scene','public','open');sqlite.prepare("UPDATE community_memberships SET joined_at='2020-01-01T00:00:00Z' WHERE community_id=?").run(scene);
 const add=sqlite.prepare("INSERT INTO gig_posts(type,role,title,name,contact_email,description,location,status,created_at,user_id,business_id) VALUES('POSTING_GIG','Fixture','Notice gig','Author','private@example.invalid','Task','Portland','LIVE',?,?,?)");
 const id=Number(add.run(new Date().toISOString(),owner,business.id).lastInsertRowid);
 sqlite.prepare("INSERT INTO community_relationships(community_id,target_type,target_id,relationship_type) VALUES(?,'gig',?,'related')").run(scene,String(id));
 add.run(new Date().toISOString(),member,business.id); // Own post never counts.
 let response=(await call('GET','/api/card-notifications',member)).body;
 const place=response.placez.find((r:any)=>r.id===String(business.id)),sc=response.scenezBoards.find((r:any)=>r.id==='notice-scene');
 assert.ok(place.counts.gigz>=1);assert.equal(sc.counts.gigz,1);assert.ok(!JSON.stringify(response).includes('private@example.invalid'));
 const route=`/api/card-notifications/directory/placez/${business.id}/read`;
 assert.equal((await call('PUT',route,applicant,{lastVisible:place.lastVisible})).status,404);
 assert.equal((await call('PUT',route,member,{lastVisible:{gigz:-1,mizzed:0}})).status,400);
 assert.equal((await call('PUT',route,member,{lastVisible:place.lastVisible})).status,204);
 response=(await call('GET','/api/card-notifications',member)).body;assert.equal(response.placez.find((r:any)=>r.id===String(business.id)).unreadCount,0);assert.equal(response.scenezBoards.find((r:any)=>r.id==='notice-scene').counts.gigz,1);
 await call('PUT','/api/card-notifications/directory/scenez/notice-scene/read',member,{lastVisible:sc.lastVisible});
 assert.equal((await call('GET','/api/card-notifications',member)).body.scenezBoards.find((r:any)=>r.id==='notice-scene').unreadCount,0);
 sqlite.prepare("UPDATE community_memberships SET status='removed' WHERE community_id=? AND user_id=?").run(scene,member);
 assert.equal((await call('PUT','/api/card-notifications/directory/scenez/notice-scene/read',member,{lastVisible:sc.lastVisible})).status,404);
});

test('OutZ aggregate counts and unread survive more than 120 unrelated newer posts',async()=>{
 const {getOutzBoardCounts}=await import('./outzSocial');const place='uncapped-fixture';
 sqlite.prepare('INSERT INTO outz_destination_follows(user_id,place_id,place_name,created_at) VALUES(?,?,?,?)').run(member,place,'Uncapped','2020-01-01T00:00:00Z');
 const insert=sqlite.prepare('INSERT INTO outz_wall_posts(place_id,user_id,post_kind,body,created_at,trip_date) VALUES(?,?,?,?,?,?)');
 insert.run(place,owner,'CARPOOL_OFFER','Real older active',new Date(Date.now()-86400000).toISOString(),null);
 for(let n=0;n<125;n++)insert.run('other-fixture',owner,'HIKE_BUDDY','Other destination',new Date().toISOString(),null);
 insert.run(place,owner,'MISSED_CONNECTION','Expired trip',new Date().toISOString(),'2000-01-01');
 insert.run(place,owner,'CAMP_BUDDY','Expired age','2000-01-01T00:00:00Z',null);
 insert.run(place,member,'LOOKING_FOR_COMPANY','My active post',new Date().toISOString(),null);
 const counts=getOutzBoardCounts(member).items.find(r=>r.placeId===place)!;
 assert.deepEqual(counts,{placeId:place,carpool:1,mizzed:0,buddy:1,total:2});
 const notification=(await call('GET','/api/card-notifications',member)).body.outzide.find((r:any)=>r.id===place);
 assert.equal(notification.unreadCount,1);assert.equal(notification.counts.carpool,1);
 sqlite.prepare('INSERT INTO member_blocks(blocker_user_id,blocked_user_id,created_at) VALUES(?,?,?)').run(member,owner,new Date().toISOString());
 assert.equal(getOutzBoardCounts(member).items.find(r=>r.placeId===place)?.total,1); // Own post stays visible.
 assert.equal(getOutzBoardCounts().items.find(r=>r.placeId===place)?.total,2);
 assert.equal((await call('GET','/api/card-notifications',member)).body.outzide.find((r:any)=>r.id===place).unreadCount,0);
 sqlite.prepare('DELETE FROM member_blocks WHERE blocker_user_id=? AND blocked_user_id=?').run(member,owner);
});

 test('OutZ save authorization includes older active posts beyond feed limit and excludes blocked/expired/missing',async()=>{
 const {canSaveOutzBoardPost,getOutzBoardPosts}=await import('./outzSocial');
 const insert=sqlite.prepare('INSERT INTO outz_wall_posts(place_id,user_id,post_kind,body,created_at,trip_date) VALUES(?,?,?,?,?,?)');
 const id=Number(insert.run('save-uncapped-fixture',owner,'CARPOOL_OFFER','Older active save target',new Date(Date.now()-86400000).toISOString(),null).lastInsertRowid);
 for(let n=0;n<125;n++)insert.run('save-newer-fixture',owner,'HIKE_BUDDY','Newer',new Date().toISOString(),null);
 assert.equal(getOutzBoardPosts(member).some(p=>p.id===id),false);
 assert.equal(canSaveOutzBoardPost(member,id),true);
 const expired=Number(insert.run('save-uncapped-fixture',owner,'CARPOOL_OFFER','Expired',new Date().toISOString(),'2000-01-01').lastInsertRowid);
 assert.equal(canSaveOutzBoardPost(member,expired),false);
 assert.equal(canSaveOutzBoardPost(member,999999999),false);
 sqlite.prepare('INSERT INTO member_blocks(blocker_user_id,blocked_user_id,created_at) VALUES(?,?,?)').run(member,owner,new Date().toISOString());
 try{assert.equal(canSaveOutzBoardPost(member,id),false);assert.equal(canSaveOutzBoardPost(owner,id),true);}finally{sqlite.prepare('DELETE FROM member_blocks WHERE blocker_user_id=? AND blocked_user_id=?').run(member,owner);}
 });
