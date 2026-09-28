import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { correctHawksLockerSpecial, HAWKS_LOCKER_MIGRATION } from './correctHawksLockerSpecial';
import { HAWKS_LOCKER_SPECIAL, isHawksLockerSpecial } from './hawksLockerSpecial';
import { applyHawksPolicy } from './ingest/adapters/hawks';

function fixture() {
  const db = new Database(':memory:');
  db.exec(readFileSync(new URL('./storage.ts', import.meta.url), 'utf8').match(/CREATE TABLE IF NOT EXISTS events \([\s\S]*?\n  \);/)![0]);
  db.exec('CREATE TABLE boot_migrations(id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const insert = db.prepare(`INSERT INTO events(title, description, venue_name, date_start, date_end, status, admission, claimed_by, created_at, updated_at)
    VALUES (?, 'Original details', ?, '2026-10-01T19:00', '2026-10-02T02:00', 'LIVE', 'DOOR_FEE', 'owner', 'before', 'before')`);
  insert.run('Happy Hour Locker Special', 'Hawks PDX');
  insert.run('Thursdays Men4Men / Karaoke', 'Hawks PDX');
  insert.run('Happy Hour Locker Special', 'Another Venue');
  return db;
}

test('retires only Hawks standalone offers; appends details without changing event timing, admission or ownership', () => {
  const db = fixture(), now = new Date('2026-09-28T19:00:00Z');
  const before = db.prepare('SELECT * FROM events ORDER BY id').all() as any[];
  assert.deepEqual(correctHawksLockerSpecial(db, now), { hidden: 1, updated: 1 });
  const after = db.prepare('SELECT * FROM events ORDER BY id').all() as any[];
  assert.deepEqual(after[0], { ...before[0], status: 'HIDDEN', is_claimable: 0, updated_at: now.toISOString() });
  assert.deepEqual(after[1], { ...before[1], description: `Original details\n\n${HAWKS_LOCKER_SPECIAL}`, updated_at: now.toISOString() });
  assert.deepEqual(after[2], before[2]);
  assert.deepEqual(correctHawksLockerSpecial(db, now), { hidden: 0, updated: 0 });
  db.prepare('DELETE FROM boot_migrations WHERE id=?').run(HAWKS_LOCKER_MIGRATION);
  correctHawksLockerSpecial(db, now);
  assert.deepEqual(db.prepare('SELECT * FROM events ORDER BY id').all(), after);
  db.close();
});

test('migration failure rolls back retirement and marker', () => {
  const db = fixture();
  db.exec("CREATE TRIGGER fail BEFORE UPDATE ON events WHEN NEW.id=2 BEGIN SELECT RAISE(ABORT,'fail'); END");
  assert.throws(() => correctHawksLockerSpecial(db, new Date('2026-09-28T19:00:00Z')), /fail/);
  assert.equal((db.prepare('SELECT status FROM events WHERE id=1').get() as any).status, 'LIVE');
  assert.equal((db.prepare('SELECT count(*) n FROM boot_migrations').get() as any).n, 0);
  db.close();
});

test('ingestion attaches offer once without replacing admission and identifies standalone titles', () => {
  const draft = applyHawksPolicy({title: 'Karaoke', description: 'Door charge applies.', admission: 'DOOR_FEE'} as any);
  assert.equal(draft.admission, 'DOOR_FEE');
  assert.ok(draft.description?.includes(HAWKS_LOCKER_SPECIAL));
  assert.equal(applyHawksPolicy(draft).description, draft.description);
  assert.ok(isHawksLockerSpecial(' Happy Hour Locker Special! '));
  assert.ok(!isHawksLockerSpecial('Karaoke with Happy Hour Locker Special'));
});
