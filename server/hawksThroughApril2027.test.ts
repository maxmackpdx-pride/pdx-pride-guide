import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import Database from 'better-sqlite3';
import {hawksThroughApril2027} from './hawksThroughApril2027';
import {seedHawksThroughApril2027,HAWKS_APRIL_MIGRATION} from './seedHawksThroughApril2027';
const all=hawksThroughApril2027();
function fixture(){const d=new Database(':memory:');d.exec(readFileSync(new URL('./storage.ts',import.meta.url),'utf8').match(/CREATE TABLE IF NOT EXISTS events \([\s\S]*?\n  \);/)![0]);d.exec('CREATE TABLE boot_migrations(id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');return d;}
test('all supplied recurrences through April with exact fifth Saturdays and no duplicate screenshot events',()=>{
 assert.equal(all.length,554);
 assert.equal(new Set(all.map(e=>e.title+'|'+e.dateStart)).size,554);
 assert.deepEqual(all.filter(e=>e.title==='5th Saturday Puppy Pileup').map(e=>e.dateStart),['2026-10-31','2027-01-30']);
 assert.equal(all.filter(e=>e.title==='TranSocial').length,7);
 assert.equal(all.filter(e=>e.title==='Saturday Bears and Cubs').length,14);
 assert.ok(all.every(e=>e.dateStart>='2026-09-28'&&e.dateStart<'2027-05-01'));
 assert.equal(all.find(e=>e.title==='Thursdays Men4Men / Karaoke')!.dateEnd,'2026-10-02T02:00');
 assert.ok(all.filter(e=>!e.dateStart.includes('T')).every(e=>e.description.includes('time unconfirmed')&&!e.dateEnd));
});
test('unclaimed additions hold unspecified times and preserve existing rows on repeat',()=>{
 const db=fixture(),now=new Date('2026-09-28T18:00:00Z');
 assert.equal(seedHawksThroughApril2027(db,now),554);
 assert.equal((db.prepare("SELECT count(*) n FROM events WHERE status='LIVE'").get() as any).n,308);
 assert.equal((db.prepare("SELECT count(*) n FROM events WHERE status='HIDDEN'").get() as any).n,246);
 assert.equal((db.prepare("SELECT count(*) n FROM events WHERE is_claimable=1 AND claimed_by IS NULL").get() as any).n,554);
 assert.equal((db.prepare("SELECT count(*) n FROM events WHERE admission='FREE' AND is_sex_positive=0").get() as any).n,31);
 assert.equal(seedHawksThroughApril2027(db,now),0);
 db.prepare('DELETE FROM boot_migrations WHERE id=?').run(HAWKS_APRIL_MIGRATION);
 db.exec("UPDATE events SET claimed_by='owner',description='Edited'");
 assert.equal(seedHawksThroughApril2027(db,now),0);
 assert.equal((db.prepare("SELECT count(*) n FROM events WHERE description='Edited'").get() as any).n,554);
 db.close();
});
test('failure rolls back all additions',()=>{const db=fixture();db.exec("CREATE TRIGGER fail BEFORE INSERT ON events WHEN (SELECT count(*) FROM events)=1 BEGIN SELECT RAISE(ABORT,'fail');END");assert.throws(()=>seedHawksThroughApril2027(db,new Date('2026-09-28T18:00:00Z')),/fail/);assert.equal((db.prepare('SELECT count(*) n FROM events').get() as any).n,0);db.close();});
