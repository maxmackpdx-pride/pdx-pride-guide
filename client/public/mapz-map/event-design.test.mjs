import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DESIGN_LAYOUT,EVENT_DESIGNS,eventDesignFor,eventDayKey,hologramLayoutForDesign} from './event-design.js';

const day=(iso)=>Date.parse(iso+'T20:00:00-07:00');

test('same event, same day: same design every time', () => {
  const a=eventDesignFor('mapz:halloween-open-house',day('2026-10-30'));
  for(let i=0;i<5;i++) assert.equal(eventDesignFor('mapz:halloween-open-house',day('2026-10-30')),a);
});

test('a new date re-rolls the design for the same event', () => {
  const designs=new Set();
  for(let d=1;d<=28;d++) designs.add(eventDesignFor('mapz:masquerade',day(`2026-11-${String(d).padStart(2,'0')}`)));
  assert.ok(designs.size>1, 'expected more than one design across dates');
});

test('every pick is an approved design and all designs are reachable', () => {
  const seen=new Set();
  for(let i=0;i<2000;i++) seen.add(eventDesignFor(`event-${i}`,day('2026-10-24')));
  assert.equal(seen.size,EVENT_DESIGNS.length);
  for(const d of seen) assert.ok(EVENT_DESIGNS.includes(d));
});

test('day key uses Portland local date', () => {
  // 02:00 UTC on Oct 31 is still Oct 30 evening in Portland.
  assert.equal(eventDayKey(Date.parse('2026-10-31T02:00:00Z')),'2026-10-30');
});

test('every approved design has its own silhouette, and an unknown id stays a puck', () => {
  const layouts=EVENT_DESIGNS.map(hologramLayoutForDesign);
  assert.deepEqual(layouts,Object.values(DESIGN_LAYOUT));
  assert.equal(new Set(layouts).size,EVENT_DESIGNS.length);
  assert.equal(hologramLayoutForDesign('not-a-design'),'puck');
});
