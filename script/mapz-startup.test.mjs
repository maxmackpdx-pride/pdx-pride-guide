import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import {vectorStyle} from '../client/public/home-flight/city-map.js';
import {mapzSurfaceStyle} from '../client/public/mapz-map/natural-surfaces.js';
import {TERRAIN_STRENGTH} from '../client/public/mapz-map/terrain-elevation.js';
// Use the validator belonging to the installed MapLibre dependency, not a
// hand-written approximation of its zoom-expression rules.
const require=createRequire(import.meta.url);
const maplibreRequire=createRequire(require.resolve('maplibre-gl'));
const {validateStyleMin}=maplibreRequire('@maplibre/maplibre-gl-style-spec');
const renderer=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
const html=await readFile(new URL('../client/public/mapz-map/index.html',import.meta.url),'utf8');
const host=await readFile(new URL('../client/src/components/MapzCanvas.tsx',import.meta.url),'utf8');
const roofBoot=await readFile(new URL('../client/public/mapz-map/mapz-roof-boot.js',import.meta.url),'utf8');
const getStyle=()=>structuredClone(vectorStyle);
test('Mapz host and iframe use the same versioned asset and message contract',()=>{
 assert.match(host,/\/mapz-map\/index\.html\?v=20261005-first-frame/);
 assert.match(host,/source:'mapz-host'/);
 assert.match(host,/event\.data\?\.source!=='mapz-demo'/);
 assert.match(html,/source:'mapz-demo'/);
 assert.match(html,/event\.data\?\.source!=='mapz-host'/);
 assert.match(html,/river-flight\.js\?v=20261005-tonight-lift/g);
 assert.match(renderer,/source:'mapz-demo'/);
 assert.match(renderer,/event\.data\?\.source!=='mapz-host'/);
 assert.match(roofBoot,/event\.data\?\.source!=='mapz-host'/);
 for(const source of [host,html,renderer,roofBoot])assert.doesNotMatch(source,/zaydar-(?:host|demo|map)|Zaydar|__zaydarStartup/i);
});
test('home map retains vector buildings without added terrain or backgrounds',()=>{
 const style=getStyle();
 assert.deepEqual(Object.keys(style.sources),['terrain']);
 assert.equal(style.sources.terrain.url,'https://tiles.openfreemap.org/planet');
 assert.deepEqual(style.layers.map(l=>l.id),['water','banks','streams','streets','skyline','buildings']);
 assert.equal(style.light.color,'#c7d9ed');
});

test('home flyover uses the Mapz surface materials without replacing its hologram system',async()=>{
 const homeRenderer=await readFile(new URL('../client/public/home-flight/river-flight.js',import.meta.url),'utf8');
 const homeHtml=await readFile(new URL('../client/public/home-flight/index.html',import.meta.url),'utf8');
 assert.match(homeRenderer,/mapzSurfaceStyle\(\{/);
 assert.match(homeRenderer,/createWaterBloom/);
 assert.match(homeRenderer,/createBuildingChrome/);
 assert.match(homeRenderer,/style:surfaceStyle/);
 assert.match(homeRenderer,/createHologramMaterials\(\[\.\.\.dayColors,adultVenueColor\]\)/);
 assert.match(homeRenderer,/flightCamera\(t\)/);
 assert.match(homeHtml,/maplibre-contour-0\.1\.0\.js/);
 assert.match(homeHtml,/Mapterhorn/);
});

test('MapLibre accepts every base-city paint expression',()=>{
 assert.deepEqual(validateStyleMin(getStyle()).map(error=>error.message),[]);
});

test('the actual startup reaches MapLibre construction, with only one graphics context',()=>{
 const reached=new Error('Reached real map construction boundary');
 let options;
 const prefix=renderer.slice(renderer.indexOf('const startup='),renderer.indexOf('const waterBloom='));
 assert.throws(()=>vm.runInNewContext(prefix,{
  mapzSurfaceStyle,structuredClone,URLSearchParams,TERRAIN_STRENGTH,location:{search:'?terrain=1'},
  window:{__mapzStartup:{phase(){},fatal(){}}},
  mlcontour:{DemSource:class{setupMaplibre(){} get sharedDemProtocolUrl(){return 'dem://tiles';} contourProtocolUrl(){return 'contour://tiles';}}},
  // No document canvas probe should be needed before the real map is created.
  maplibregl:{Map:class{constructor(value){options=value;throw reached;}}}
 }),error=>error===reached);
 assert.ok(options.pitch>0);
 assert.equal(options.style.terrain,undefined);
 assert.equal(options.style.sources.elevation,undefined);
 assert.deepEqual(validateStyleMin(options.style).map(error=>error.message),[]);
});

function bridge(){
 const handlers=new Map(),messages=[],status={textContent:''},dataset={};
 class ErrorEvent{constructor(message){this.message=message;}}
 const window={addEventListener:(type,fn)=>handlers.set(type,fn)};
 vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{
  window,ErrorEvent,location:{origin:'https://www.zaylist.com'},
  document:{documentElement:{dataset},getElementById:()=>status},
  parent:{postMessage:value=>messages.push(value)}
 });
 return {handlers,messages,status,dataset,ErrorEvent,startup:window.__mapzStartup};
}

test('startup bridge surfaces the original error and deduplicates it',()=>{
 const b=bridge();
 b.handlers.get('error')(new b.ErrorEvent("Cannot read properties of undefined (reading 'paint')"));
 b.handlers.get('unhandledrejection')({reason:new Error('secondary rejection')});
 const errors=b.messages.filter(message=>message.type==='fatal');
 assert.equal(errors.length,1);
 assert.match(errors[0].message,/reading 'paint'/);
 assert.equal(b.status.hidden,true);
 assert.equal(b.dataset.mapError,errors[0].message);
});

test('missing image resources do not kill 3D startup',()=>{
 const b=bridge();
 b.handlers.get('error')({target:{tagName:'IMG',src:'/missing-logo.png'}});
 assert.equal(b.messages.filter(message=>message.type==='fatal').length,0);
});

test('explicit context loss remains recoverable even after a visible frame',()=>{
 const b=bridge();
 b.startup.phase('first-frame');
 b.handlers.get('unhandledrejection')({reason:new Error('optional asset')});
 assert.equal(b.messages.filter(message=>message.type==='fatal').length,0);
 b.startup.fatal('The 3D graphics context was lost.');
 assert.equal(b.messages.filter(message=>message.type==='fatal').length,1);
});

test('base-city readiness uses idle or its bounded fallback without terrain or feature queries',()=>{
 let onLoad,onIdle,fallback,frames=0;
 const canvas={width:0,height:0};
 const context=vm.createContext({
  loaded:false,baseFrameRendered:false,cameraDirty:false,revealTime:0,
  startup:{phase(){}},updateSceneStatus(){},scheduleFrame:()=>frames++,parent:{},
  window:{setTimeout(fn,delay){assert.equal(delay,250);fallback=fn;}},
  map:{on(type,fn){assert.equal(type,'load');onLoad=fn;},once(type,fn){assert.equal(type,'idle');onIdle=fn;},getCanvas:()=>canvas},
 });
 const start=renderer.indexOf("map.on('load',()=>{");
 const end=renderer.indexOf('function updateSurfaces(',start);
 vm.runInContext(renderer.slice(start,end),context);
 onLoad();assert.equal(context.loaded,true);assert.equal(frames,1);
 onIdle();assert.equal(context.baseFrameRendered,false);
 canvas.width=390;canvas.height=720;
 fallback();assert.equal(context.baseFrameRendered,true);assert.equal(frames,2);
 onIdle();assert.equal(frames,2,'readiness must only be announced once');
});
