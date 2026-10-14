import test from 'node:test';import assert from 'node:assert/strict';import {pacificDayStart} from './inboxReportingTime';
test('Pacific reporting dates cross UTC midnight and DST correctly',()=>{
 assert.equal(pacificDayStart(new Date('2026-10-13T02:00:00Z')).toISOString(),'2026-10-12T07:00:00.000Z');
 assert.equal(pacificDayStart(new Date('2026-03-08T18:00:00Z')).toISOString(),'2026-03-08T08:00:00.000Z');
 assert.equal(pacificDayStart(new Date('2026-03-09T18:00:00Z'),1).toISOString(),'2026-03-08T08:00:00.000Z');
 assert.equal(pacificDayStart(new Date('2026-11-01T18:00:00Z')).toISOString(),'2026-11-01T07:00:00.000Z');
 assert.equal(pacificDayStart(new Date('2026-11-02T18:00:00Z')).toISOString(),'2026-11-02T08:00:00.000Z');
});
