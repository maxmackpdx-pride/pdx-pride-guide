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
  assert.match(renderer,/waypointGeometry\(p,selected,placezHoverLift\(target,feature,surfaces\),feature\.properties\.key\)/);
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

test('Placez swaps logo and type every 7 seconds with a short glitch',async()=>{
 const {WAYPOINT_SWAP_SECONDS,showWaypointLogo,waypointSwapGlitch}=await import('../client/public/zaydar-map/waypoint-markers.js');
 assert.equal(WAYPOINT_SWAP_SECONDS,7);
 for(const phase of [0,2.399963,10,50,900]){
  const origin=-phase*1.7+14*1000;
  assert.equal(showWaypointLogo(origin+1,phase),true);
  assert.equal(showWaypointLogo(origin+6.9,phase),true);
  assert.equal(showWaypointLogo(origin+7.1,phase),false);
  assert.equal(showWaypointLogo(origin+13.9,phase),false);
  assert.ok(waypointSwapGlitch(origin+7.02,phase)>0);
  assert.equal(waypointSwapGlitch(origin+7.5,phase),0);
  assert.equal(showWaypointLogo(origin+10,phase,true),true);
  assert.equal(waypointSwapGlitch(origin+7.02,phase,true),0);
 }
});

test('adult Placez use normal Placez markers; boards keep their families',async()=>{
 const {waypointFamilyShell}=await import('../client/public/zaydar-map/waypoint-markers.js');
 assert.equal(waypointFamilyShell('places','adult'),'place');
 assert.equal(waypointFamilyShell(undefined,'adult'),'place');
 assert.equal(waypointFamilyShell('places','bar'),'place');
 assert.equal(waypointFamilyShell('houz'),'house');
 assert.equal(waypointFamilyShell('mizzed'),'speech');
 assert.equal(waypointFamilyShell('gigz'),'shield');
});


test('Mapz cannot replace a place glyph with the retired age label',async()=>{
 const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
 const markers=await readFile(new URL('../client/public/zaydar-map/waypoint-markers.js',import.meta.url),'utf8');
 assert.doesNotMatch(renderer,/18\+|label:shell/);
 assert.doesNotMatch(markers,/extra\.label|ticket/);
});


test('waypoint outlines and glow retain category colors even with stale rainbow metadata',async()=>{
 const source=await readFile(new URL('../client/public/zaydar-map/waypoint-markers.js',import.meta.url),'utf8');
 const strokes=[];
 const canvasContext={scale(){},fill(){},stroke(){strokes.push(this.strokeStyle);}};
 const context=vm.createContext({
  motionPreference:{matches:false},document:{createElement:()=>({getContext:()=>canvasContext})},
  Path2D:class {},performance:{now:()=>1000},
 });
 vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export /g,''),context);
 const ctx={save(){},restore(){},drawImage(){}};
 context.ctx=ctx;
 for(const color of ['#FF0000','#00FFFF','#FF6600','#8800FF'])for(const selected of [false,true]){
  strokes.length=0;
  vm.runInContext(`drawWaypointHead(ctx,{x:100,y:100,size:42},'${color}',null,null,${selected},1,'place',{bloom:true})`,context);
  assert.deepEqual(strokes,[color,color]);
 }
});
