import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { createInboxDailyReminder } from './inboxDailyReminder';
test('empty inbox does not consume reminder; once per account across connections', () => {
 const db = new Database(':memory:'); const claim = createInboxDailyReminder(db);
 const now = new Date('2026-10-13T20:00:00Z');
 assert.equal(claim(1,0,0,true,now).show,false);
 assert.equal(claim(1,2,0,false,now).show,true);
 assert.equal(createInboxDailyReminder(db)(1,3,0,false,now).show,false);
 assert.equal(claim(2,1,0,false,now).show,true);
 db.close();
});
test('owner counts are private and zero owner-only work never alerts an admin', () => {
 const db = new Database(':memory:'); const claim = createInboxDailyReminder(db);
 assert.deepEqual([claim(1,0,3,false).show,claim(1,0,3,false).ownerCount],[false,0]);
 assert.equal(claim(1,0,3,true).show,true); db.close();
});
test('reminders reset at Pacific midnight, including DST day', () => {
 const db = new Database(':memory:'); const claim = createInboxDailyReminder(db);
 assert.equal(claim(1,1,0,false,new Date('2026-11-01T06:59:59Z')).show,true);
 assert.equal(claim(1,1,0,false,new Date('2026-11-01T07:00:00Z')).show,true);
 assert.equal(claim(1,1,0,false,new Date('2026-11-02T07:59:59Z')).show,false);
 assert.equal(claim(1,1,0,false,new Date('2026-11-02T08:00:00Z')).show,true); db.close();
});
