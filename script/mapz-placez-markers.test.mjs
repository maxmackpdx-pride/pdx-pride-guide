import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('Placez clusters retain geographic bounds for fit-to-view taps',async()=>{
  const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  const start=renderer.indexOf('function clusterPlaceMarkers('),end=renderer.indexOf('function drawClusterCount(');
  const context=vm.createContext({Map,Math});vm.runInContext(renderer.slice(start,end),context);
  const item=(key,coordinates,p)=>({feature:{geometry:{coordinates},properties:{key}},p});
  const result=vm.runInContext(`clusterPlaceMarkers([
    ${JSON.stringify(item('a',[-122.68,45.51],{x:100,y:100}))},
    ${JSON.stringify(item('b',[-122.64,45.55],{x:112,y:108}))}
  ],null,13,900,1200)`,context);
  assert.deepEqual(Array.from(result.byKey.get('a').bounds[0]),[-122.68,45.51]);
  assert.deepEqual(Array.from(result.byKey.get('a').bounds[1]),[-122.64,45.55]);
  assert.match(renderer,/map\.fitBounds\(hit\.clusterBounds/);
});

test('Placez markers stay geographically locked three meters up with compact bloom',async()=>{
  const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  assert.match(renderer,/const placezScale=1\.625\*/);
  assert.match(renderer,/const PLACEZ_HOVER_METERS=3/);
  assert.match(renderer,/const markerY=isPlace\?p\.y-placezHoverLift\(target,feature\.geometry\.coordinates\):raisedY/);
  assert.match(renderer,/const placezBloomMax=\.02/);
  assert.match(renderer,/const markerBloom=isPlace\?Math\.min\(placezBloomMax,/);
  assert.match(renderer,/const PLACEZ_BLOOM_RADIUS_SCALE=\.35/);
  assert.match(renderer,/flat\?72\*PLACEZ_BLOOM_RADIUS_SCALE:126/);
  assert.match(renderer,/String\(a\.feature\.properties\.key\)\.localeCompare/);
});
