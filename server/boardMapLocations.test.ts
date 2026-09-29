import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { publicBoardMapLocations } from './boardMapLocations';

test('shared coordinates disappear with hidden, closed, deleted, expired and remote posts', () => {
 const db=new Database(':memory:');
 try {
  db.exec(`CREATE TABLE board_map_locations(board TEXT,post_id INTEGER,lat REAL,lng REAL);
   CREATE TABLE gig_posts(id INTEGER,status TEXT,is_remote INTEGER);
   CREATE TABLE gifting_posts(id INTEGER,status TEXT,expires_at TEXT);
   CREATE TABLE sellz_posts(id INTEGER,status TEXT,expires_at TEXT);
   CREATE TABLE missed_connections(id INTEGER,status TEXT,closes_at TEXT);
   CREATE TABLE housing_posts(id INTEGER,status TEXT,hidden INTEGER,gone INTEGER);
   INSERT INTO gig_posts VALUES (1,'LIVE',0),(2,'CLOSED',0),(3,'LIVE',1);
   INSERT INTO gifting_posts VALUES (1,'OPEN','2026-10-01'),(2,'PENDING',NULL),(3,'OPEN','2026-09-27');
   INSERT INTO sellz_posts VALUES (1,'ACTIVE','2026-10-01'),(2,'SOLD',NULL),(3,'ACTIVE','2026-09-27');
   INSERT INTO missed_connections VALUES (1,'ACTIVE',NULL),(2,'ARCHIVED',NULL),(3,'ACTIVE','2026-09-27');
   INSERT INTO housing_posts VALUES (1,'ACTIVE',0,0),(2,'ACTIVE',1,0),(3,'ACTIVE',0,1),(4,'REMOVED',0,0);`);
  for(const board of ['gigz','giftz','sellz','mizzed','houz'])for(let id=1;id<=5;id++)
   db.prepare('INSERT INTO board_map_locations VALUES (?,?,45.52,-122.67)').run(board,id);
  const rows=publicBoardMapLocations(db,new Date('2026-09-28T12:00:00Z')) as Array<{board:string;postId:number}>;
  assert.deepEqual(rows.map(r=>`${r.board}:${r.postId}`).sort(),['giftz:1','gigz:1','houz:1','mizzed:1','sellz:1']);
  db.exec('DELETE FROM housing_posts WHERE id=1');
  assert.equal((publicBoardMapLocations(db) as typeof rows).some(r=>r.board==='houz'),false);
 } finally {db.close();}
});
