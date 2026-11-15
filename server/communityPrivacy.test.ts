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
const app = express(); app.use(express.json());
app.use((req:any, _res, next) => { req.session = { userId: Number(req.get('x-fixture-user')) || undefined }; next(); });
registerCommunityRoutes(app, (req:any,res,next) => req.session.userId ? next() : res.sendStatus(401));
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${(server.address() as {port:number}).port}`;
after(async () => { await new Promise<void>((resolve,reject) => server.close(e => e ? reject(e) : resolve())); sqlite.close(); rmSync(directory,{recursive:true,force:true}); });
async function call(method:string, endpoint:string, userId?:number, body?:unknown) {
  const response = await fetch(base + endpoint, {method, headers:{'content-type':'application/json', ...(userId ? {'x-fixture-user':String(userId)} : {})}, ...(body === undefined ? {} : {body:JSON.stringify(body)})});
  return { status:response.status, body:response.status===204 ? null : await response.json() as any };
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

test('private request join returns pending status without posts, replies, media, rules or member identities; approval restores access',async()=>{
  const id=community('privacy-request'); const route='/api/communities/privacy-request';
  assert.equal((await call('GET',route)).status,404);
  for(let i=0;i<2;i++) {
    const r=await call('POST',`${route}/join`,applicant,{}); assert.equal(r.status,200);
    assert.equal(r.body.viewerMembershipStatus,'pending'); assert.equal(r.body.viewerRole,null);
    for(const key of ['posts','moderators','rules','related']) assert.deepEqual(r.body[key],[]);
    assert.deepEqual(r.body.events,{upcoming:[],past:[]});
    assert.ok(!JSON.stringify(r.body).includes('PRIVATE'));
    assert.equal((await call('GET',route,applicant)).status,404);
  }
  for(const uid of [owner,member]) { const r=await call('GET',route,uid); assert.equal(r.status,200); assert.equal(r.body.posts[0].body,'PRIVATE BODY'); assert.equal(r.body.posts[0].replies[0].body,'PRIVATE REPLY'); }
  assert.equal((await call('PATCH',`${route}/members/${applicant}`,owner,{status:'active'})).status,200);
  assert.equal((await call('GET',route,applicant)).body.posts[0].body,'PRIVATE BODY');
  assert.equal((await call('PATCH',`${route}/members/${applicant}`,owner,{status:'removed'})).status,200);
  assert.equal((await call('POST',`${route}/join`,applicant,{})).status,403);
  assert.equal((await call('GET',route,applicant)).status,404);
  assert.equal((sqlite.prepare('SELECT status FROM community_memberships WHERE community_id=? AND user_id=?').get(id,applicant) as any).status,'removed');
});

test('public request join stays readable and invite-only private membership stays closed',async()=>{
  community('privacy-public','public'); community('privacy-invite','private','invite');
  const pub=await call('POST','/api/communities/privacy-public/join',applicant,{});
  assert.equal(pub.status,200); assert.equal(pub.body.viewerMembershipStatus,'pending'); assert.equal(pub.body.posts[0].body,'PRIVATE BODY');
  assert.equal((await call('POST','/api/communities/privacy-invite/join',applicant,{})).status,409);
  assert.equal((await call('GET','/api/communities/privacy-invite',applicant)).status,404);
});

test('community event feed and related metadata exclude private/nonpublic/conflicting events for visitors and managers',async()=>{
  const id=community('privacy-events','public','open');
  const expected:number[]=[];
  for(const [name,status,pub,priv] of [['PUBLIC','LIVE',1,0],['PRIVATE','LIVE',0,1],['NONPUBLIC','LIVE',0,0],['CONFLICT','LIVE',1,1],['DRAFT','DRAFT',1,0]] as const) {
    const eventId=Number(sqlite.prepare('INSERT INTO events(title,description,venue_name,date_start,date_end,status,is_public,is_private) VALUES(?,?,?,?,?,?,?,?)').run(name,`${name} body`,'Fixture venue','2099-01-01T12:00:00Z','2099-01-01T13:00:00Z',status,pub,priv).lastInsertRowid);
    sqlite.prepare("INSERT INTO community_relationships(community_id,target_type,target_id,relationship_type) VALUES(?,'event',?,'related')").run(id,String(eventId));
    if(name==='PUBLIC') expected.push(eventId);
  }
  for(const uid of [undefined,applicant,owner]) {
    const r=await call('GET','/api/communities/privacy-events',uid); assert.equal(r.status,200);
    assert.deepEqual(r.body.related.map((x:any)=>x.id),expected); assert.deepEqual(r.body.events.upcoming.map((x:any)=>x.id),expected);
  }
  const managed=await call('GET','/api/communities/privacy-events/manage',owner);
  assert.equal(managed.status,200); assert.deepEqual(managed.body.relationships.map((x:any)=>x.id),expected);
  sqlite.prepare('UPDATE events SET is_private=1 WHERE id=?').run(expected[0]);
  const changed=await call('GET','/api/communities/privacy-events');
  assert.deepEqual(changed.body.related,[]); assert.deepEqual(changed.body.events.upcoming,[]);
});

test('public GigZ relationships keep working independently of event-only privacy fields',async()=>{
  const id=community('privacy-gig','public','open');
  const gigId=Number(sqlite.prepare("INSERT INTO gig_posts(type,role,title,name,contact_email,description,location,status) VALUES('POSTING_GIG','Fixture role','Fixture gig','Fixture','fixture@example.invalid','Synthetic gig fixture','Portland','LIVE')").run().lastInsertRowid);
  sqlite.prepare("INSERT INTO community_relationships(community_id,target_type,target_id,relationship_type) VALUES(?,'gig',?,'related')").run(id,String(gigId));
  for(const uid of [undefined,owner]) {
    const r=await call('GET','/api/communities/privacy-gig',uid);
    assert.equal(r.status,200); assert.deepEqual(r.body.related.map((x:any)=>({id:x.id,type:x.type})),[{id:gigId,type:'gig'}]);
  }
});
