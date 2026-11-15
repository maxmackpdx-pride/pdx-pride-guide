import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS_NAV, PLACES_NAV, PRIMARY_NAV, mapWorldNeedsReload, navLinkActive } from './siteNav';

test('Places desktop and dock share exactly the three browse destinations', () => {
  assert.deepEqual(PLACES_NAV.map(item => [item.label, item.href]), [
    ['PlaceZ', '/directory'], ['SceneZ', '/scenez'], ['OutZide', '/outzide/places'],
  ]);
  const places = PRIMARY_NAV.find(item => item.type === 'dropdown' && item.id === 'places');
  assert.ok(places?.type === 'dropdown');
  assert.equal(places.items, PLACES_NAV);
  assert.equal(PLACES_NAV.some(item => item.href === '/outzide'), false);
});

test('desktop Maps retains all five map worlds, separately from outdoor browse', () => {
  const maps = PRIMARY_NAV.find(item => item.type === 'dropdown' && item.id === 'maps');
  assert.ok(maps?.type === 'dropdown');
  assert.equal(maps.items, MAPS_NAV);
  assert.deepEqual(MAPS_NAV.map(item => item.href), ['/map?mode=mapz', '/map?mode=outzide', '/map?mode=boardz', '/map?mode=afterz', '/map?mode=zaydark']);
  assert.equal(MAPS_NAV.some(item => navLinkActive('/outzide/places', item.href)), false);
});

test('map selection reflects mode and existing map aliases', () => {
  for (const selected of MAPS_NAV) {
    assert.deepEqual(MAPS_NAV.filter(item => navLinkActive(selected.href + '&zoom=12', item.href)), [selected]);
  }
  assert.equal(navLinkActive('/map', '/map?mode=mapz'), true);
  assert.equal(navLinkActive('/outzide', '/map?mode=outzide'), true);
  assert.equal(navLinkActive('/directory/9', '/directory'), true);
  assert.equal(navLinkActive('/scenez?q=test', '/scenez'), true);
});

test('map world changes reload only the mounted map; browse links remain SPA', () => {
  for (const current of ['/map', '/outzide', '/map?mode=boardz']) {
    assert.equal(mapWorldNeedsReload(current, '/map?mode=outzide'), true);
    assert.equal(mapWorldNeedsReload(current, '/outzide/places'), false);
    assert.equal(mapWorldNeedsReload(current, '/scenez'), false);
  }
  assert.equal(mapWorldNeedsReload('/outzide/places', '/map?mode=mapz'), false);
  assert.equal(mapWorldNeedsReload('/directory', '/map?mode=mapz'), false);
});
