import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import Database from 'better-sqlite3';
import {seedHawksThroughApril2027} from './seedHawksThroughApril2027';
import {seedHawksReviewedTimes20260928,HAWKS_REVIEWED_MIGRATION} from './seedHawksReviewedTimes20260928';
import {resolveEventPosterUrl} from '../shared/eventPoster';
const now=new Date('2026-09-28T19:00:00Z');
function fixture(){const d=new Database(':memory:');d.exec(readFileSync(new URL('./storage.ts',import.meta.url),'utf8').match(/CREATE TABLE IF NOT EXISTS events \([\s\S]*?\n  \);/)![0]);d.exec('CREATE TABLE boot_migrations(id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');return d;}
test('adds exactly 246 approved dates without changing the original 308, with weekday defaults',()=>{
 const d=fixture();assert.equal(seedHawksThroughApril2027(d,now),308);
 const before=d.prepare('SELECT * FROM events ORDER BY id').all();
 assert.equal(seedHawksReviewedTimes20260928(d,now),246);
 assert.deepEqual(d.prepare('SELECT * FROM events WHERE id<=308 ORDER BY id').all(),before);
 const added=d.prepare('SELECT * FROM events WHERE id>308').all() as any[];
 for(const e of added){assert.equal(e.status,'LIVE');assert.equal(e.is_claimable,1);assert.equal(e.claimed_by,null);assert.equal(e.poster_image_url,null);assert.ok(e.date_end>e.date_start);assert.ok(!e.description.includes('Event time unconfirmed'));assert.ok(existsSync('client/public'+resolveEventPosterUrl(e.id,e.poster_image_url,e.day_of_week)));}
 assert.equal(d.prepare("SELECT date_end FROM events WHERE title='Bear Mondays' AND date_start='2026-09-28T10:00'").get().date_end,'2026-09-29T02:00');
 assert.equal(d.prepare("SELECT date_end FROM events WHERE title='GENDER GLOW Fridays!' AND date_start='2027-04-30T14:00'").get().date_end,'2027-05-01T08:00');
 assert.equal(seedHawksReviewedTimes20260928(d,now),0);
 d.prepare('DELETE FROM boot_migrations WHERE id=?').run(HAWKS_REVIEWED_MIGRATION);
 d.exec("UPDATE events SET claimed_by='owner',description='edited' WHERE id>308");
 assert.equal(seedHawksReviewedTimes20260928(d,now),0);
 assert.equal(d.prepare('SELECT count(*) n FROM events').get().n,554);d.close();
});
test('rolls back partial batch and migration marker on failure',()=>{const d=fixture();d.exec("CREATE TRIGGER fail BEFORE INSERT ON events WHEN (SELECT count(*) FROM events)=1 BEGIN SELECT RAISE(ABORT,'fail');END");assert.throws(()=>seedHawksReviewedTimes20260928(d,now),/fail/);assert.equal(d.prepare('SELECT count(*) n FROM events').get().n,0);assert.equal(d.prepare('SELECT count(*) n FROM boot_migrations').get().n,0);d.close();});
