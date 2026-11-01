import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {copyFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import {defaultProfileLayout,profileLayoutSchema,publicProfileLayout} from '../shared/profileLayout';
import {createProfileLayoutStore} from './profileLayout';
mkdirSync('.local',{recursive:true});const dir=mkdtempSync(path.resolve('.local/profile-wall-test-'));process.env.DATABASE_PATH=path.join(dir,'data.db');copyFileSync('data.db',process.env.DATABASE_PATH);
const {storage,sqlite}=await import('./storage');after(()=>{sqlite.close();rmSync(dir,{recursive:true,force:true});});
const makeUser=(name:string)=>Number(sqlite.prepare('INSERT INTO users(username,email,password_hash) VALUES(?,?,?)').run(name,`${name}@example.test`,'test').lastInsertRowid);
const owner=makeUser('wall_owner'),friend=makeUser('wall_friend'),stranger=makeUser('wall_stranger');
const events=['public','friends','anonymous'].map((visibility,i)=>{const id=Number(sqlite.prepare("INSERT INTO events(title,description,venue_name,date_start,date_end,status,is_public,is_private) VALUES(?,?,?,'2099-01-01T20:00','2099-01-02T02:00','LIVE',1,0)").run(`Wall ${visibility}`,'Fixture','Fixture').lastInsertRowid);sqlite.prepare('INSERT INTO attendances(event_id,user_id,handle,message,avatar_seed,visibility,is_anonymous,is_active) VALUES(?,?,?,?,?,?,?,1)').run(id,owner,'wall_owner','Fixture','test',visibility,i===2?1:0);return id;});
test('profile cards and counters obey RSVP visibility, block boundaries and owner-only anonymity',()=>{
 const profile=(viewer?:number)=>storage.getPublicProfile('wall_owner',viewer??null)!;
 assert.deepEqual(profile().activity.goingTo.map((e:any)=>e.id),[events[0]]);assert.equal(profile().stats.checkIns,1);
 assert.equal(profile(owner).activity.goingTo.length,3);assert.equal(profile(stranger).activity.goingTo.length,1);
 storage.followUser(friend,owner);assert.equal(profile(friend).activity.goingTo.length,2);
 storage.blockMember(friend,owner);assert.equal(profile(friend).activity.goingTo.length,0);
 sqlite.prepare('UPDATE events SET is_private=1 WHERE id=?').run(events[0]);assert.equal(profile().activity.goingTo.length,0);assert.equal(profile(owner).activity.goingTo.length,3);
 sqlite.prepare("UPDATE events SET status='HIDDEN' WHERE id=?").run(events[1]);assert.equal(profile(owner).activity.goingTo.length,2);
 assert.deepEqual(profile().activity.spotted,[]);assert.equal('outzAdventures' in profile(),false);
});
test('layout migration is idempotent and concurrent revision writes never overwrite',()=>{
 const store=createProfileLayoutStore(sqlite);createProfileLayoutStore(sqlite);const draft=defaultProfileLayout();assert.equal(profileLayoutSchema.safeParse(draft).success,true);
 const saved=store.save(owner,draft);assert.equal(saved.conflict,false);assert.equal(saved.current.revision,1);
 assert.equal(store.save(owner,{...draft,palette:'cyan'}).conflict,true);assert.equal(store.read(owner).palette,'pride');
 assert.equal(store.read(stranger).revision,0);const changed=structuredClone(saved.current);changed.widgets[0].mobile.x=120;assert.equal(store.save(owner,changed).current.widgets[0].desktop.x,20);
});
test('layout rejects unsupported variants, copied data, duplicate widgets, oversized positions and invalid IDs',()=>{
 for(const mutate of [(d:any)=>d.widgets[0].desktop.variant='fake-large',(d:any)=>d.widgets[0].body='private words',(d:any)=>d.widgets.push(d.widgets[0]),(d:any)=>d.widgets[0].mobile.x=500,(d:any)=>d.widgets[0].source={kind:'event',id:-1}]){const d=defaultProfileLayout();mutate(d);assert.equal(profileLayoutSchema.safeParse(d).success,false);}
 const draft=defaultProfileLayout();draft.widgets.push({...draft.widgets[0],id:'private-trip',objectId:'component:data-display/ProfileActivity',source:{kind:'trip',id:999}});const visitor=publicProfileLayout(draft,ref=>ref.kind==='profile');assert.ok(!JSON.stringify(visitor).includes('999'));assert.ok(!visitor.widgets.some(w=>w.objectId.includes('FavoritePlaces')));
});
test('future layout schema is preserved and cannot be overwritten by this client',()=>{
 const store=createProfileLayoutStore(sqlite);sqlite.prepare('INSERT INTO profile_layouts(user_id,schema_version,revision,document,updated_at) VALUES(?,2,7,?,?)').run(stranger,JSON.stringify({schemaVersion:2,privateFutureField:'preserve'}),new Date().toISOString());assert.equal(store.supported(stranger),false);assert.equal(store.save(stranger,{...defaultProfileLayout(),revision:7}).conflict,true);assert.match((sqlite.prepare('SELECT document FROM profile_layouts WHERE user_id=?').get(stranger) as any).document,/privateFutureField/);
});
test('archived BoardZ references and blocked-member references never project as live trail cards',async()=>{
 const {createBoardArchive}=await import('./boardArchive');const columns=(sqlite.prepare('PRAGMA table_info(gig_posts)').all() as {name:string}[]).map(c=>c.name).filter(c=>c!=='id');const values=columns.map(c=>c==='user_id'?String(owner):c==='status'?"'LIVE'":c==='name'?"'Wall owner'":c==='created_at'?"datetime('now')":c);const id=Number(sqlite.prepare(`INSERT INTO gig_posts(${columns.join(',')}) SELECT ${values.join(',')} FROM gig_posts LIMIT 1`).run().lastInsertRowid);
 assert.ok(storage.getPublicProfile('wall_owner',stranger)!.boardReferences.some((r:any)=>r.category==='gigz'&&r.id===id));storage.blockMember(stranger,owner);assert.deepEqual(storage.getPublicProfile('wall_owner',stranger)!.boardReferences,[]);
 createBoardArchive(sqlite).archive('gigz',id,owner);sqlite.prepare("UPDATE gig_posts SET status='LIVE' WHERE id=?").run(id);assert.ok(!storage.getPublicProfile('wall_owner',owner)!.boardReferences.some((r:any)=>r.category==='gigz'&&r.id===id));
});
test('historical hosted flyers remain hosting and never become attendance',()=>{
 const profile=storage.getPublicProfile('tucker_pdmax')!;assert.ok(profile.activity.hostedEventsPast.some((e:any)=>e.id<0));assert.ok(profile.activity.attendedPast.every((e:any)=>e.id>0));assert.equal(profile.stats.checkIns,profile.activity.attendedPast.length+profile.activity.goingTo.length);
});
