import test from 'node:test';
import assert from 'node:assert/strict';
import { isMapzRoute, retainedMapSearch, accountSafeMapSearch } from './mapRouteRetention';

test('retains only the Mapz routes, never an unrelated page', () => {
  assert.equal(isMapzRoute('/map'),true);
  assert.equal(isMapzRoute('/map-demo/?layer=places'),true);
  assert.equal(isMapzRoute('/mapz-map/index.html'),false);
  assert.equal(isMapzRoute('/boards'),false);
});
test('plain returns retain filters and camera without reopening old cards or composers',()=>{
  const next=new URLSearchParams(retainedMapSearch('', 'layer=places&hideEvents=1&places.q=coffee&place=9&compose=giftz&houzCompose=FORMING', {center:[45.52,-122.67],zoom:15.75,pitch:42,bearing:17}));
  assert.equal(next.get('layer'),'places');
  assert.equal(next.get('places.q'),'coffee');
  assert.equal(next.get('zoom'),'15.75');
  assert.equal(next.get('pitch'),'42');
  assert.equal(next.get('bearing'),'17');
  assert.equal(next.has('place'),false);
  assert.equal(next.has('compose'),false);
  assert.equal(next.has('houzCompose'),false);
});
test('explicit doorway filters, camera and deep links win over retained state',()=>{
  const door='layer=rezources&hidePlaces=1&lat=45.6&lng=-122.6&zoom=16&place=5';
  assert.equal(retainedMapSearch(door,'layer=places&zoom=12',{center:[45.52,-122.67],zoom:13,pitch:48,bearing:0}),door);
});
test('non-finite camera data cannot corrupt a valid retained view',()=>{
  assert.equal(retainedMapSearch('', 'layer=places&zoom=14',{center:[NaN,-122.67],zoom:15,pitch:48,bearing:0}),'layer=places&zoom=14');
});

test('account changes preserve safe filters while clearing private detail and saved/mine views',()=>{
 const params=new URLSearchParams(accountSafeMapSearch('layer=houz&lat=45.52&lng=-122.67&zoom=16&houz=19&housingSaved=1&gigz.view=mine&giftz.view=mine&sellz.view=saved&housingType=FORMING'));
 assert.equal(params.get('layer'),'houz');assert.equal(params.get('zoom'),'16');assert.equal(params.get('housingType'),'FORMING');
 for(const key of ['houz','housingSaved','gigz.view','giftz.view','sellz.view'])assert.equal(params.has(key),false);
});
