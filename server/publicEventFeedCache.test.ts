import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { createPublicEventFeedCache, parseEventFeedQuery, selectEventFeed, EventFeedChangedError, EventFeedQueryError } from './publicEventFeedCache';
const schema = `
 CREATE TABLE events(id INTEGER PRIMARY KEY,status TEXT,title TEXT,is_public INTEGER,is_private INTEGER,day TEXT);
 CREATE TABLE businesses(id INTEGER PRIMARY KEY,website TEXT,lat REAL,active INTEGER);
 CREATE TABLE submissions(id INTEGER PRIMARY KEY,type TEXT,status TEXT,event_id INTEGER,description TEXT);
 CREATE TABLE event_talent(id INTEGER PRIMARY KEY,event_id INTEGER,user_id INTEGER,role TEXT,status TEXT);
 CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,display_name TEXT,bio TEXT);
 CREATE TABLE analytics(id INTEGER PRIMARY KEY,hits INTEGER);
 INSERT INTO events VALUES(1,'LIVE','Historical event',1,0,'MON');
 INSERT INTO businesses VALUES(1,'old.example',1,1);
 INSERT INTO submissions VALUES(1,'CLAIM','PENDING',1,'claim');
 INSERT INTO users VALUES(1,'dj','DJ','bio');
 INSERT INTO event_talent VALUES(1,1,1,'DJ','LIVE');
 INSERT INTO analytics VALUES(1,1);
`;
function fixture(file = ':memory:') {
 const db = new Database(file); db.exec(schema);
 let builds = 0;
 const build = () => { builds++; return db.prepare(`SELECT e.id,e.title,e.day AS dayOfWeek,e.is_public AS isPublic,e.is_private AS isPrivate,
 (SELECT COUNT(*) FROM submissions s WHERE s.type='CLAIM' AND s.status='PENDING' AND s.event_id=e.id) AS pendingClaims,
 (SELECT group_concat(website || ':' || lat || ':' || active) FROM businesses) AS business,
 (SELECT group_concat(u.username || ':' || u.display_name || ':' || et.role) FROM event_talent et JOIN users u ON u.id=et.user_id WHERE et.event_id=e.id AND et.status='LIVE') AS talent
 FROM events e WHERE e.status='LIVE' ORDER BY e.id`).all() as any[]; };
 return {db,build,get builds(){return builds;}};
}
test('canonical cache, 30s TTL, immutable returned values, concurrent coalescing', async () => {
 const f=fixture(); let now=0; const c=createPublicEventFeedCache(f.db,async()=>{const rows=f.build(); await new Promise(r=>setImmediate(r)); return rows;},{now:()=>now});
 try { const results=await Promise.all(Array.from({length:20},()=>c.get())); assert.equal(f.builds,1); assert.equal(results[0].status,'MISS'); assert.equal(results[19].status,'HIT'); results[0].rows[0].title='mutated'; assert.equal((await c.get()).rows[0].title,'Historical event'); now=29_999; await c.get(); assert.equal(f.builds,1); now=30_000; assert.equal((await c.get()).status,'MISS'); assert.equal(f.builds,2); } finally {c.dispose();f.db.close();}
});
const mutations = [
 ['events insert',"INSERT INTO events VALUES(2,'LIVE','new',1,0,'TUE')"],
 ['events update',"UPDATE events SET title='changed' WHERE id=1"],
 ['events hide',"UPDATE events SET status='HIDDEN' WHERE id=1"],
 ['events cancel',"UPDATE events SET status='CANCELLED' WHERE id=1"],
 ['events delete','DELETE FROM events WHERE id=1'],
 ['business insert',"INSERT INTO businesses VALUES(2,'two',2,1)"],
 ['business website',"UPDATE businesses SET website='new'"],
 ['business coordinates','UPDATE businesses SET lat=3'],
 ['business active','UPDATE businesses SET active=0'],
 ['business delete','DELETE FROM businesses'],
 ['claim insert',"INSERT INTO submissions VALUES(2,'CLAIM','PENDING',1,'new')"],
 ['claim approve',"UPDATE submissions SET status='APPROVED'"],
 ['claim reject',"UPDATE submissions SET status='REJECTED'"],
 ['claim type',"UPDATE submissions SET type='EDIT'"],
 ['claim target','UPDATE submissions SET event_id=2'],
 ['claim delete','DELETE FROM submissions'],
 ['talent insert',"INSERT INTO event_talent VALUES(2,1,1,'HOST','LIVE')"],
 ['talent status',"UPDATE event_talent SET status='PENDING'"],
 ['talent role',"UPDATE event_talent SET role='HOST'"],
 ['talent delete','DELETE FROM event_talent'],
 ['user insert',"INSERT INTO users VALUES(2,'new','New','bio')"],
 ['user primary key','UPDATE users SET id=2'],
 ['user username',"UPDATE users SET username='renamed'"],
 ['user display name',"UPDATE users SET display_name='New Name'"],
 ['user delete','DELETE FROM users'],
] as const;
for(const [name,sql] of mutations) test(`same-connection invalidation: ${name}`,async()=>{
 const f=fixture();const c=createPublicEventFeedCache(f.db,f.build);try{await c.get();f.db.exec(sql);const result=await c.get();assert.equal(result.status,'MISS');assert.equal(f.builds,2);assert.deepEqual(result.rows,f.build());}finally{c.dispose();f.db.close();}
});
test('unrelated same-connection analytics, sessions-equivalent table, user bio and claim description do not invalidate',async()=>{
 const f=fixture();const c=createPublicEventFeedCache(f.db,f.build);try{await c.get();f.db.exec("UPDATE analytics SET hits=hits+1; UPDATE users SET bio='new'; UPDATE submissions SET description='new'; CREATE TABLE sessions(id INTEGER); INSERT INTO sessions VALUES(1)");assert.equal((await c.get()).status,'HIT');assert.equal(f.builds,1);}finally{c.dispose();f.db.close();}
});
test('external connection mutation invalidates via data_version; TEMP objects not persistent',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'feed-test-'));const path=join(dir,'test.db');const f=fixture(path);const c=createPublicEventFeedCache(f.db,f.build);const second=new Database(path);try{await c.get();assert.equal((second.prepare("SELECT count(*) n FROM sqlite_master WHERE name LIKE 'public_feed_%'").get() as any).n,0);second.exec("UPDATE events SET status='HIDDEN'");assert.deepEqual((await c.get()).rows,[]);assert.equal(f.builds,2);}finally{c.dispose();second.close();f.db.close();rmSync(dir,{recursive:true,force:true});}
});
test('hide during await cannot return stale snapshot to owner or coalesced callers',async()=>{
 const f=fixture();let release!:()=>void;const gate=new Promise<void>(r=>release=r);let first=true;const c=createPublicEventFeedCache(f.db,async()=>{const rows=f.build();if(first){first=false;await gate;}return rows;});try{const a=c.get();const b=c.get();f.db.exec("UPDATE events SET status='HIDDEN'");release();assert.deepEqual((await a).rows,[]);assert.deepEqual((await b).rows,[]);assert.equal(f.builds,2);}finally{c.dispose();f.db.close();}
});
test('continuous writes fail boundedly rather than returning stale data',async()=>{
 const f=fixture();const c=createPublicEventFeedCache(f.db,async()=>{const rows=f.build();await Promise.resolve();f.db.exec('UPDATE events SET id=id');return rows;});try{await assert.rejects(c.get(),EventFeedChangedError);assert.equal(f.builds,3);}finally{c.dispose();f.db.close();}
});
test('build rejection clears in-flight state and recovers',async()=>{
 const f=fixture();let fail=true;const c=createPublicEventFeedCache(f.db,async()=>{if(fail)throw Error('test failure');return f.build();});try{const results=await Promise.allSettled([c.get(),c.get()]);assert.ok(results.every(r=>r.status==='rejected'));fail=false;assert.equal((await c.get()).status,'MISS');assert.equal((await c.get()).status,'HIT');}finally{c.dispose();f.db.close();}
});
for (const [name,change] of [['private','UPDATE events SET is_private=1'],['nonpublic','UPDATE events SET is_public=0']] as const) test(`${name} rows bypass retention and coalesced sharing`,async()=>{
 const f=fixture();f.db.exec(change);const c=createPublicEventFeedCache(f.db,f.build);try{const r=await Promise.all([c.get(),c.get(),c.get()]);assert.ok(r.every(x=>x.status==='BYPASS'));assert.equal(f.builds,3);assert.equal(r[0].rows.length,1);}finally{c.dispose();f.db.close();}
});
test('missing public flags bypass and oversized UTF-8 payload bypasses; exact byte boundary retains',async()=>{
 const f=fixture();for(const [row,maxBytes,expected] of [[{title:'x'},1000,'BYPASS'],[{isPublic:true,isPrivate:false,title:'é'},1,'BYPASS'],[{isPublic:true,isPrivate:false,title:'é'},Buffer.byteLength(JSON.stringify([{isPublic:true,isPrivate:false,title:'é'}])),'MISS']] as const){let n=0;const c=createPublicEventFeedCache(f.db,()=>{n++;return [row];},{maxBytes});try{assert.equal((await c.get()).status,expected);await c.get();assert.equal(n,expected==='MISS'?1:2);}finally{c.dispose();}}f.db.close();
});
test('rollback restores revision and payload; dispose cleans only TEMP state',async()=>{
 const f=fixture();const c=createPublicEventFeedCache(f.db,f.build);await c.get();f.db.exec("BEGIN; UPDATE events SET title='wrong'; ROLLBACK");assert.equal((await c.get()).status,'HIT');c.dispose();c.dispose();await assert.rejects(c.get(),/disposed/);assert.equal((f.db.prepare("SELECT count(*) n FROM sqlite_temp_master WHERE name LIKE 'public_feed_%'").get() as any).n,0);f.db.close();
});
test('query validation rejects malformed and repeated parameters',()=>{
 for(const key of ['offset','limit'])for(const value of ['-1','1.5','x','','1e2','Infinity','9007199254740992',['1','2'],{},1])assert.throws(()=>parseEventFeedQuery({[key]:value}),EventFeedQueryError);
 assert.throws(()=>parseEventFeedQuery({limit:'501'}));assert.equal(parseEventFeedQuery({day:['MON','TUE']}).day,undefined);assert.equal(parseEventFeedQuery({day:{}}).day,undefined);assert.equal(parseEventFeedQuery({limit:'500'}).limit,500);
});
test('no-limit preserves historical rows, multi-day instance identity and ordering; day then pagination',()=>{
 const rows=[{id:1,listingInstanceKey:'1:old',dayOfWeek:'MON',date:'2020-01-01'},{id:1,listingInstanceKey:'1:new',dayOfWeek:'TUE',date:'2026-11-02'},{id:2,listingInstanceKey:'2:new',dayOfWeek:'MON',date:'2026-11-02'}];
 assert.deepEqual(selectEventFeed(rows,parseEventFeedQuery({})),rows);assert.deepEqual(selectEventFeed(rows,parseEventFeedQuery({day:''})),rows);assert.deepEqual(selectEventFeed(rows,parseEventFeedQuery({day:'MON',offset:'1',limit:'1'})),[rows[2]]);assert.deepEqual(selectEventFeed(rows,parseEventFeedQuery({offset:'1'})),rows.slice(1));assert.deepEqual(selectEventFeed(rows,parseEventFeedQuery({limit:'0'})),[]);assert.deepEqual(selectEventFeed(rows,parseEventFeedQuery({day:'unknown'})),[]);assert.deepEqual(selectEventFeed(rows,parseEventFeedQuery({offset:'9007199254740991',limit:'500'})),[]);
});
test('mutation between compute completion and get continuation is rechecked',async()=>{
 const f=fixture();let first=true;const c=createPublicEventFeedCache(f.db,()=>{const rows=f.build();if(first){first=false;queueMicrotask(()=>queueMicrotask(()=>f.db.exec("UPDATE events SET status='HIDDEN'")));}return rows;});try{assert.deepEqual((await c.get()).rows,[]);assert.equal(f.builds,2);}finally{c.dispose();f.db.close();}
});
test('external hide during asynchronous enrichment is rechecked',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'feed-race-'));const f=fixture(join(dir,'test.db'));const other=new Database(join(dir,'test.db'));let first=true;const c=createPublicEventFeedCache(f.db,async()=>{const rows=f.build();await Promise.resolve();if(first){first=false;other.exec("UPDATE events SET status='HIDDEN'");}return rows;});try{assert.deepEqual((await c.get()).rows,[]);assert.equal(f.builds,2);}finally{c.dispose();other.close();f.db.close();rmSync(dir,{recursive:true,force:true});}
});
test('default 8 MiB bound bypasses oversized payloads',async()=>{
 const f=fixture();let builds=0;const c=createPublicEventFeedCache(f.db,()=>{builds++;return [{isPublic:true,isPrivate:false,text:'x'.repeat(8*1024*1024)}];});try{assert.equal((await c.get()).status,'BYPASS');assert.equal((await c.get()).status,'BYPASS');assert.equal(builds,2);}finally{c.dispose();f.db.close();}
});
test('dispose during pending computation safely rejects and removes TEMP state',async()=>{
 const f=fixture();let release!:()=>void;const gate=new Promise<void>(r=>release=r);const c=createPublicEventFeedCache(f.db,async()=>{const rows=f.build();await gate;return rows;});const result=c.get();c.dispose();release();await assert.rejects(result,/disposed/);assert.equal((f.db.prepare("SELECT count(*) n FROM sqlite_temp_master WHERE name LIKE 'public_feed_%'").get() as any).n,0);f.db.close();
});
test('initialization failure removes partial TEMP objects; multiple instances coexist',async()=>{
 const missing=new Database(':memory:');assert.throws(()=>createPublicEventFeedCache(missing,()=>[]));assert.equal((missing.prepare("SELECT count(*) n FROM sqlite_temp_master").get() as any).n,0);missing.close();
 const f=fixture();const a=createPublicEventFeedCache(f.db,f.build);const b=createPublicEventFeedCache(f.db,f.build);await a.get();await b.get();a.dispose();f.db.exec("UPDATE events SET title='new'");assert.equal((await b.get()).rows[0].title,'new');b.dispose();f.db.close();
});
test('invalid cache options rejected',()=>{
 const f=fixture();for(const options of [{maxBytes:-1},{maxBytes:1.5},{ttlMs:0},{ttlMs:Infinity},{maxAttempts:0},{maxAttempts:1.5}])assert.throws(()=>createPublicEventFeedCache(f.db,f.build,options),RangeError);f.db.close();
});
test('transaction revision reuse cannot retain or expose rolled-back uncommitted data',async()=>{
 const f=fixture();const c=createPublicEventFeedCache(f.db,f.build);try{await c.get();f.db.exec("BEGIN; UPDATE events SET title='uncommitted'");await assert.rejects(c.get(),EventFeedChangedError);assert.equal(f.builds,1);f.db.exec("ROLLBACK; UPDATE events SET title='committed'");const result=await c.get();assert.equal(result.status,'MISS');assert.equal(result.rows[0].title,'committed');}finally{if(f.db.inTransaction)f.db.exec('ROLLBACK');c.dispose();f.db.close();}
});
test('transaction opened during await invalidates and rejects; rollback and later write recover',async()=>{
 const f=fixture();let first=true;const c=createPublicEventFeedCache(f.db,async()=>{const rows=f.build();await Promise.resolve();if(first){first=false;f.db.exec("BEGIN; UPDATE events SET title='uncommitted'");}return rows;});try{await assert.rejects(c.get(),EventFeedChangedError);f.db.exec("ROLLBACK; UPDATE events SET title='committed'");assert.equal((await c.get()).rows[0].title,'committed');}finally{if(f.db.inTransaction)f.db.exec('ROLLBACK');c.dispose();f.db.close();}
});
test('transaction opened in compute/get microtask gap cannot return cached data',async()=>{
 const f=fixture();let first=true;const c=createPublicEventFeedCache(f.db,()=>{const rows=f.build();if(first){first=false;queueMicrotask(()=>queueMicrotask(()=>f.db.exec("BEGIN; UPDATE events SET title='uncommitted'")));}return rows;});try{await assert.rejects(c.get(),EventFeedChangedError);f.db.exec("ROLLBACK; UPDATE events SET title='committed'");const result=await c.get();assert.equal(result.status,'MISS');assert.equal(result.rows[0].title,'committed');}finally{if(f.db.inTransaction)f.db.exec('ROLLBACK');c.dispose();f.db.close();}
});
test('external analytics conservatively invalidates via data_version',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'feed-analytics-'));const path=join(dir,'test.db');const f=fixture(path);const other=new Database(path);const c=createPublicEventFeedCache(f.db,f.build);try{const original=await c.get();other.exec('UPDATE analytics SET hits=hits+1');const after=await c.get();assert.equal(after.status,'MISS');assert.equal(f.builds,2);assert.deepEqual(after.rows,original.rows);}finally{c.dispose();other.close();f.db.close();rmSync(dir,{recursive:true,force:true});}
});
test('legacy malformed day parameters remain ignored without changing feed',()=>{
 const rows=[{dayOfWeek:'MON'},{dayOfWeek:'TUE'}];for(const day of [['MON','TUE'],{},null,42])assert.deepEqual(selectEventFeed(rows,parseEventFeedQuery({day})),rows);
});

test('dispose after connection closes is harmless and idempotent',async()=>{
 const f=fixture();const c=createPublicEventFeedCache(f.db,f.build);await c.get();f.db.close();assert.doesNotThrow(()=>c.dispose());assert.doesNotThrow(()=>c.dispose());await assert.rejects(c.get(),/disposed/);
});
