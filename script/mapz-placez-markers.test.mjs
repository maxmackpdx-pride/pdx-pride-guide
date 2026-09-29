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

test('non-event markers use assigned roof heights and preserve equal roof clearance',async()=>{
  const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  const roofBoot=await readFile(new URL('../client/public/zaydar-map/mapz-roof-boot.js',import.meta.url),'utf8');
  assert.match(renderer,/waypointGeometry\(p,selected,placezHoverLift\(target,feature,surfaces\)\)/);
  assert.match(renderer,/const buildingVisibility=extrusionAmount\(target\)/);
  assert.match(renderer,/window\.__mapzPlaceRoofHeights\?\.get\(key\)/);
  assert.match(roofBoot,/roofHeights\.set\(key,Math\.max\(8,Number\(best\.height\)\|\|9\)\+\.5\)/);
  assert.doesNotMatch(renderer,/createWorldWaypointLayer|createHousingHologramLayer/);
  assert.match(renderer,/String\(a\.feature\.properties\.key\)\.localeCompare/);
});

test('waypoint heads keep equal roof clearance while following different roof heights',async()=>{
  const {waypointGeometry}=await import('../client/public/zaydar-map/waypoint-markers.js');
  const previousWindow=globalThis.window;
  globalThis.window={__mapzMap:{getZoom:()=>15.35,getPitch:()=>34}};
  try{
    for(const selected of [false,true])for(const roof of [8,12,45,200]){
      const first=waypointGeometry({x:100,y:300},selected,roof);
      const moved=waypointGeometry({x:290,y:185},selected,roof);
      assert.equal(moved.x-first.x,190);assert.ok(Math.abs(moved.y-first.y+115)<1e-9);
      // Waypoint pack sizes: 31 at rest growing to 42 by zoom 16, 57 selected.
      assert.equal(first.size,selected?57:40);
      assert.equal(300-first.bottom,roof*2);
      // The shell's integrated tip (34% of the size) touches the top of the beam.
      assert.ok(Math.abs(first.y+first.size/2+first.size*.34-first.bottom)<1e-9);
    }
  }finally{
    if(previousWindow===undefined)delete globalThis.window;
    else globalThis.window=previousWindow;
  }
});

test('Placez cycles icon and white logo without changing its anchor',async()=>{
 const {waypointLogoInterval,showWaypointLogo}=await import('../client/public/zaydar-map/waypoint-markers.js');
 for(const phase of [0,2.399963,10,50,900]){
  const cycle=waypointLogoInterval(phase);assert.ok(cycle>=3&&cycle<=5);
  for(let i=1000;i<1005;i++){
   const origin=i*cycle-phase*1.7;
   assert.equal(showWaypointLogo(origin+.1*cycle,phase),false);
   assert.equal(showWaypointLogo(origin+.5*cycle,phase),true);
   assert.equal(showWaypointLogo(origin+.9*cycle,phase),false);
  }
  assert.equal(showWaypointLogo(999,phase,true),true);
 }
});
