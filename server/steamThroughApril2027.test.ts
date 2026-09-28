import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import Database from 'better-sqlite3';
import { steamThroughApril2027 } from './steamThroughApril2027';
import { seedSteamThroughApril2027, STEAM_APRIL_MIGRATION } from './seedSteamThroughApril2027';
const all = steamThroughApril2027();
const dates = (title: string) => all.filter(e => e.title === title).map(e => e.dateStart.slice(0,10));
function fixture() {
 const db = new Database(':memory:');
 db.exec(readFileSync(new URL('./storage.ts', import.meta.url),'utf8').match(/CREATE TABLE IF NOT EXISTS events \([\s\S]*?\n  \);/)![0]);
 db.exec('CREATE TABLE boot_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');return db;
}
test('weekly flyers, monthly anchors and November exception', () => {
 assert.deepEqual(dates('Sin City'), ['2026-10-24','2026-11-21','2026-12-26','2027-01-23','2027-02-27','2027-03-27','2027-04-24']);
 assert.deepEqual(dates('Hardwear'), ['2026-10-23','2026-11-20','2026-12-25','2027-01-22','2027-02-26','2027-03-26','2027-04-23']);
 assert.equal(dates('Radical Rubdown').length,31);
 assert.equal(dates('Morning Wood').length,124);
 assert.equal(dates('Hump Day').length,31);
 assert.ok(!dates('Blackout').includes('2026-11-21'));
 assert.ok(!dates('Afterglow').includes('2026-11-22'));
 assert.ok(dates('Afterglow').includes('2027-04-18'));
 assert.equal(new Set(all.map(e=>`${e.title}|${e.dateStart}`)).size,all.length);
 for(const e of all) {
  assert.ok(e.dateStart >= '2026-09-28' && e.dateStart < '2027-05-01');
  assert.ok(e.dateEnd > e.dateStart);
  if(e.posterImageUrl) assert.ok(existsSync(`client/public${e.posterImageUrl}`));
 }
 assert.equal(all.find(e=>e.title==='Hump Day')!.dateEnd,'2026-09-30T22:30');
 assert.equal(all.find(e=>e.title==='CumUnion Portland' && e.dateStart.startsWith('2027-03-13'))!.dateEnd,'2027-03-14T04:00');
});
test('unclaimed import is idempotent and preserves existing rows', () => {
 const db=fixture(), now=new Date('2026-09-28T18:00:00Z');
 assert.equal(seedSteamThroughApril2027(db,now),all.length);
 assert.equal(seedSteamThroughApril2027(db,now),0);
 db.prepare('DELETE FROM boot_migrations WHERE id=?').run(STEAM_APRIL_MIGRATION);
 db.exec("UPDATE events SET claimed_by='owner',description='Edited',status='HIDDEN'");
 assert.equal(seedSteamThroughApril2027(db,now),0);
 assert.equal((db.prepare("SELECT count(*) n FROM events WHERE description='Edited'").get() as any).n,all.length);
 db.close();
});
test('failed insert rolls back batch and marker',()=>{
 const db=fixture();db.exec("CREATE TRIGGER fail BEFORE INSERT ON events WHEN (SELECT count(*) FROM events)=1 BEGIN SELECT RAISE(ABORT,'fail'); END");
 assert.throws(()=>seedSteamThroughApril2027(db,new Date('2026-09-28T18:00:00Z')),/fail/);
 assert.equal((db.prepare('SELECT count(*) n FROM events').get() as any).n,0);
 assert.equal((db.prepare('SELECT count(*) n FROM boot_migrations').get() as any).n,0);
 db.close();
});
