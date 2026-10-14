import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import {ARCHIVE_BOARDS,boardArchivePurgeAt,createBoardArchive,isBoardArchived,withoutArchivedPosts,type ArchiveBoard} from "./boardArchive";
const tables:Record<ArchiveBoard,string>={housing:"housing_posts",gigz:"gig_posts",giftz:"gifting_posts",sellz:"sellz_posts",mizzed:"missed_connections"};
const now=new Date("2026-10-14T12:00:00.000Z"),DAY=86400000;
function fixture(){
 const db=new Database(":memory:");db.pragma("foreign_keys = ON");
 db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,display_name TEXT);
 INSERT INTO users VALUES(7,'real','Real'),(8,'other','Other'),(9,'hausing_demo','Guide'),(10,'person','Rowan Example');
 CREATE TABLE board_map_locations(board TEXT,post_id INTEGER,lat REAL,lng REAL);
 CREATE TABLE board_saves(board TEXT,post_id INTEGER,user_id INTEGER);
 CREATE TABLE board_post_motifs(board TEXT,post_id INTEGER,motif_choice TEXT);
 CREATE TABLE content_likes(content_type TEXT,content_id INTEGER,user_id INTEGER);
 CREATE TABLE content_replies(content_type TEXT,content_id INTEGER,body TEXT);
 CREATE TABLE messages(id INTEGER,body TEXT,context_id INTEGER);
 CREATE TABLE missed_connection_threads(thread_id TEXT,missed_connection_id INTEGER,poster_user_id INTEGER,replier_user_id INTEGER,poster_revealed INTEGER);`);
 for(const [board,table] of Object.entries(tables))db.exec(`CREATE TABLE ${table}(id INTEGER PRIMARY KEY,user_id INTEGER,status TEXT,created_at TEXT,title TEXT,headline TEXT,name TEXT,type TEXT,post_type TEXT,body TEXT,photo_urls TEXT,around_post_id INTEGER REFERENCES housing_posts(id),selected_interest_id INTEGER ${board==='giftz'?'REFERENCES gifting_interests(id)':''});`);
 for(const [table,parent] of Object.entries({gifting_interests:'gifting_posts',gifting_reports:'gifting_posts',sellz_interests:'sellz_posts',sellz_reports:'sellz_posts',sellz_saves:'sellz_posts',housing_members:'housing_posts',housing_saves:'housing_posts',housing_requests:'housing_posts',housing_dates:'housing_posts',housing_reports:'housing_posts'}))db.exec(`CREATE TABLE ${table}(id INTEGER PRIMARY KEY,post_id INTEGER REFERENCES ${parent}(id),note TEXT);`);
 db.exec(`CREATE TABLE housing_places(id INTEGER PRIMARY KEY,post_id INTEGER REFERENCES housing_posts(id),managed_post_id INTEGER REFERENCES housing_posts(id),title TEXT);
 CREATE TABLE housing_place_comments(id INTEGER,place_id INTEGER REFERENCES housing_places(id),body TEXT);
 CREATE TABLE housing_place_reactions(id INTEGER,place_id INTEGER REFERENCES housing_places(id),emoji TEXT);`);
 return db;
}
function add(db:Database.Database,board:ArchiveBoard,id=1,user=7,created=new Date(+now-90*DAY).toISOString(),status='ACTIVE'){
 db.prepare(`INSERT INTO ${tables[board]}(id,user_id,status,created_at,title,headline,name,type,post_type,body,photo_urls) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(id,user,status,created,"A title","A housing title","Person","FORMING","LOOKING_FOR_WORK","PRIVATE BODY",'["/private.jpg"]');
 db.prepare("INSERT INTO board_map_locations VALUES(?,?,45,-122)").run(board==='housing'?'houz':board,id);
}
test('guards work before initialization and bulk filtering isolates board identity',()=>{
 const db=fixture();try{
  const rows=[{id:1},{id:2}];assert.equal(isBoardArchived(db,'gigz',1),false);assert.equal(withoutArchivedPosts(db,'gigz',rows),rows);
  add(db,'housing');const a=createBoardArchive(db);a.archive('housing',1,7,now);
  assert.equal(isBoardArchived(db,'houz',1),true);assert.deepEqual(withoutArchivedPosts(db,'houz',rows),[{id:2}]);assert.deepEqual(withoutArchivedPosts(db,'gigz',rows),rows);
 }finally{db.close();}
});
test('all families archive at exactly 90 days, using actual sweep time and preserving demos/deleted records',()=>{
 const db=fixture();try{
  for(const board of ARCHIVE_BOARDS){add(db,board);add(db,board,2,7,new Date(+now-90*DAY+1).toISOString());add(db,board,3,9);add(db,board,4,10);add(db,board,5,7,undefined,'REMOVED');add(db,board,6,7,undefined,'DELETED');add(db,board,7,7,undefined,'REJECTED');}
  const a=createBoardArchive(db);assert.deepEqual(a.sweep(now),{archived:5,purged:0});
  assert.equal(a.list(7).length,5);assert.equal(a.list(8).length,0);
  for(const board of ARCHIVE_BOARDS){assert.equal(db.prepare(`SELECT status FROM ${tables[board]} WHERE id=1`).pluck().get(),'ARCHIVED');assert.equal(a.isArchived(board,2),false);assert.equal(a.isArchived(board,3),false);}
  assert.equal(db.prepare('SELECT COUNT(*) FROM board_map_locations WHERE post_id=1').pluck().get(),0);
  assert(a.list(7).every(row=>row.archivedAt===now.toISOString()&&row.purgeAt==='2027-10-14T12:00:00.000Z'));
  assert.deepEqual(a.sweep(now),{archived:0,purged:0});
 }finally{db.close();}
});
test('manual archive checks owner, excludes demos, stays idempotent and retains only minimal memory fields',()=>{
 const db=fixture();try{
  add(db,'gigz');add(db,'gigz',2,9);db.prepare('UPDATE gig_posts SET title=? WHERE id=1').run('x'.repeat(200));const a=createBoardArchive(db);
  assert.throws(()=>a.archive('gigz',1,8,now),/not found/);assert.throws(()=>a.archive('gigz',2,9,now),/examples/);
  const first=a.archive('gigz',1,7,now);assert.equal(first.title.length,160);
  assert.deepEqual(a.archive('gigz',1,7,new Date(+now+DAY)),first);assert.throws(()=>a.archive('gigz',1,8,now),/not found/);
  assert.deepEqual(Object.keys(a.memories(7)[0]).sort(),['archivedAt','board','createdAt','postId','purgedAt','title','type']);assert(!JSON.stringify(a.memories(7)).includes('PRIVATE BODY'));assert(!JSON.stringify(a.memories(7)).includes('private.jpg'));
 }finally{db.close();}
});
test('first rollout does not backdate overdue posts and purge waits a full calendar year',()=>{
 const db=fixture();try{
  add(db,'gigz',1,7,'2020-01-01T00:00:00Z');const a=createBoardArchive(db);a.sweep(now);
  assert.deepEqual(a.sweep(new Date('2027-10-14T11:59:59.999Z')),{archived:0,purged:0});
  assert.deepEqual(a.sweep(new Date('2027-10-14T12:00:00.000Z')),{archived:0,purged:1});
  assert.equal(db.prepare('SELECT COUNT(*) FROM gig_posts').pluck().get(),0);assert.equal(a.list(7).length,0);assert.equal(a.memories(7).length,1);assert.equal(a.memories(7)[0].purgedAt,'2027-10-14T12:00:00.000Z');assert.equal(a.isArchived('gigz',1),true);
  assert.deepEqual(a.sweep(new Date('2028-10-14T12:00:00.000Z')),{archived:0,purged:0});
 }finally{db.close();}
});
test('calendar-year deadline handles leap days and UTC date boundaries',()=>{
 assert.equal(boardArchivePurgeAt('2024-02-29T23:59:59.123Z'),'2025-02-28T23:59:59.123Z');
 assert.equal(boardArchivePurgeAt('2023-03-01T00:00:00Z'),'2024-03-01T00:00:00.000Z');
 assert.throws(()=>boardArchivePurgeAt('bad'));
});
test('purge cleans all post-owned relations with foreign keys, retaining unrelated data and inbox privacy',()=>{
 const db=fixture();try{
  const a=createBoardArchive(db);
  for(const board of ARCHIVE_BOARDS){add(db,board);add(db,board,2,8,now.toISOString());db.prepare('INSERT INTO board_saves VALUES(?,?,7)').run(board,1);db.prepare('INSERT INTO board_post_motifs VALUES(?,?,?)').run(board,1,'mesh');}
  for(const table of ['gifting_interests','gifting_reports','sellz_interests','sellz_reports','sellz_saves','housing_members','housing_saves','housing_requests','housing_dates','housing_reports'])db.prepare(`INSERT INTO ${table} VALUES(1,1,'private note')`).run();
  db.exec(`UPDATE gifting_posts SET selected_interest_id=1 WHERE id=1;
   UPDATE housing_posts SET around_post_id=1 WHERE id=2;
   INSERT INTO housing_places VALUES(11,1,NULL,'private place'),(12,2,1,'unrelated place');
   INSERT INTO housing_place_comments VALUES(1,11,'private comment');INSERT INTO housing_place_reactions VALUES(1,11,'heart');
   INSERT INTO content_likes VALUES('GIG',1,7),('HUB',1,7);INSERT INTO content_replies VALUES('GIG',1,'private reply'),('HUB',1,'unrelated reply');
   INSERT INTO messages VALUES(1,'inbox message',1);INSERT INTO missed_connection_threads VALUES('private-thread',1,7,8,0);`);
  a.sweep(now);const result=a.sweep(new Date('2027-10-14T12:00:00Z'));assert.equal(result.purged,5);
  for(const table of Object.values(tables))assert.equal(db.prepare(`SELECT COUNT(*) FROM ${table} WHERE id=1`).pluck().get(),0);
  for(const table of ['gifting_interests','gifting_reports','sellz_interests','sellz_reports','sellz_saves','housing_members','housing_saves','housing_requests','housing_dates','housing_reports','housing_place_comments','housing_place_reactions','board_saves','board_post_motifs'])assert.equal(db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get(),0,table);
  assert.equal(db.prepare('SELECT managed_post_id FROM housing_places WHERE id=12').pluck().get(),null);assert.equal(db.prepare('SELECT around_post_id FROM housing_posts WHERE id=2').pluck().get(),null);
  assert.equal(db.prepare('SELECT COUNT(*) FROM content_replies').pluck().get(),1);assert.equal(db.prepare('SELECT COUNT(*) FROM content_likes').pluck().get(),1);assert.equal(db.prepare('SELECT body FROM messages').pluck().get(),'inbox message');assert.equal(db.prepare('SELECT poster_revealed FROM missed_connection_threads').pluck().get(),0);
  assert.deepEqual(db.pragma('foreign_key_check'),[]);
 }finally{db.close();}
});
test('failed purge rolls back child deletion and keeps archive available',()=>{
 const db=fixture();try{
  add(db,'gigz');db.exec('CREATE TABLE future_relation(post_id INTEGER REFERENCES gig_posts(id));INSERT INTO future_relation VALUES(1);INSERT INTO content_replies VALUES(\'GIG\',1,\'still private\');');
  const a=createBoardArchive(db);a.archive('gigz',1,7,now);assert.throws(()=>a.sweep(new Date('2027-10-14T12:00:00Z')),/FOREIGN KEY/);
  assert.equal(a.list(7).length,1);assert.equal(db.prepare('SELECT COUNT(*) FROM gig_posts').pluck().get(),1);assert.equal(db.prepare('SELECT body FROM content_replies').pluck().get(),'still private');
 }finally{db.close();}
});

test('purge queues only local upload candidates without removing shared user or inbox data',()=>{
 const db=fixture();try{
  add(db,'giftz');db.prepare('UPDATE gifting_posts SET photo_urls=?').run(JSON.stringify(['/uploads/shared.jpg','https://elsewhere.test/photo.jpg','/brand/logo.svg','/uploads/%2e%2e/private.jpg','/uploads/shared.jpg']));
  db.exec("ALTER TABLE users ADD COLUMN photo_url TEXT;UPDATE users SET photo_url='/uploads/shared.jpg' WHERE id=7;");
  const a=createBoardArchive(db);a.archive('giftz',1,7,now);assert.equal(db.prepare('SELECT COUNT(*) FROM board_archive_upload_cleanup').pluck().get(),0);
  a.sweep(new Date('2027-10-14T12:00:00Z'));
  assert.deepEqual(db.prepare('SELECT upload_path FROM board_archive_upload_cleanup').pluck().all(),['/uploads/shared.jpg']);
  assert.equal(db.prepare('SELECT photo_url FROM users WHERE id=7').pluck().get(),'/uploads/shared.jpg');
 }finally{db.close();}
});

test('SQLite UTC timestamps and invalid dates do not shift the ninety-day boundary',()=>{
 const db=fixture();try{
  add(db,'gigz',1,7,'2026-07-16 12:00:00');add(db,'gigz',2,7,'not a date');const a=createBoardArchive(db);
  assert.deepEqual(a.sweep(new Date('2026-10-14T11:59:59.999Z')),{archived:0,purged:0});
  assert.deepEqual(a.sweep(now),{archived:1,purged:0});assert.equal(a.memories(7)[0].createdAt,'2026-07-16T12:00:00.000Z');
 }finally{db.close();}
});
