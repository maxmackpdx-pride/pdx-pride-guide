import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import {standaloneDowntownPlacez} from '../client/public/zaydar-map/standalone-demo.js';

test('standalone demo includes the real Downtown Placez set',()=>{
  const rows=standaloneDowntownPlacez();
  assert.equal(rows.length,18);
  assert.ok(rows.every(row=>row.kind==='place'&&row.key.startsWith('directory-')));
  assert.ok(rows.every(row=>row.coordinates.every(Number.isFinite)));
  assert.deepEqual(new Set(rows.map(row=>row.type)),new Set(['bar','venue','adult','nonprofit','shop','cafe','restaurant','service']));
});

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

test('non-event markers use the Outzide template while preserving roof clearance',async()=>{
  const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  assert.match(renderer,/waypointGeometry\(p,selected,placezHoverLift\(target,feature,surfaces\)\)/);
  assert.match(renderer,/const buildingVisibility=smoothRange\(12,15,target\.getZoom\(\)\)/);
  assert.doesNotMatch(renderer,/createWorldWaypointLayer|createHousingHologramLayer/);
  assert.match(renderer,/String\(a\.feature\.properties\.key\)\.localeCompare/);
});

test('waypoint heads stay at their map anchor and clear roof heights at every scale',async()=>{
  const {waypointGeometry}=await import('../client/public/zaydar-map/waypoint-markers.js');
  for(const selected of [false,true])for(const roof of [0,12,45,200]){
    const first=waypointGeometry({x:100,y:300},selected,roof);
    const moved=waypointGeometry({x:290,y:185},selected,roof);
    assert.equal(moved.x-first.x,190);assert.equal(moved.y-first.y,-115);
    assert.equal(first.size,selected?44:28);
    assert.ok(first.bottom<=300-roof);
    assert.equal(first.y+first.size/2,first.bottom);
  }
});

test('Placez alternates icon and white logo every 3–5 seconds without changing its anchor',async()=>{
 const {waypointLogoInterval,showWaypointLogo}=await import('../client/public/zaydar-map/waypoint-markers.js');
 for(const phase of [0,2.399963,10,50,900]){
  const interval=waypointLogoInterval(phase);assert.ok(interval>=3&&interval<=5);
  for(let i=1000;i<1005;i++){
   const boundary=i*interval-phase;
   assert.notEqual(showWaypointLogo(boundary-.001,phase),showWaypointLogo(boundary+.001,phase));
   assert.equal(showWaypointLogo(boundary+.001,phase),showWaypointLogo(boundary+interval-.001,phase));
  }
  assert.equal(showWaypointLogo(999,phase,true),true);
 }
});
