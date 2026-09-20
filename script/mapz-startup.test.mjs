import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import {applyMoonlight} from '../client/public/zaydar-map/moonlight.js';
import {radix} from '../client/public/zaydar-map/radix-map.js';
import {roadColor,roadLineWidth,outlinedRoadLineWidth,bridgeFilter} from '../client/public/zaydar-map/bridge-roads.js';
import {installRoadSurface} from '../client/public/zaydar-map/road-surface.js';

// Use the validator belonging to the installed MapLibre dependency, not a
// hand-written approximation of its zoom-expression rules.
const require=createRequire(import.meta.url);
const maplibreRequire=createRequire(require.resolve('maplibre-gl'));
const {validateStyleMin}=maplibreRequire('@maplibre/maplibre-gl-style-spec');
const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
const html=await readFile(new URL('../client/public/zaydar-map/index.html',import.meta.url),'utf8');
const styleSource=renderer.slice(renderer.indexOf('const maxExploreZoom='),renderer.indexOf('// OpenFreeMap vector geometry'));
const bindings={applyMoonlight,radix,roadColor,roadLineWidth,outlinedRoadLineWidth,bridgeFilter};
const getStyle=()=>vm.runInNewContext(styleSource+';vectorStyle',{...bindings});

test('the actual renderer initializes its style without optional terrain',()=>{
 const style=getStyle(); // This executed line reproduced the production TypeError.
 assert.ok(style.layers.find(layer=>layer.id==='skyline'));
 assert.equal(style.layers.find(layer=>layer.id==='terrain-shade'),undefined);
 assert.equal(style.light.color,'#eafcff');
 assert.equal(style.sources.elevation,undefined);
});

test('moonlight also supports a style with terrain already attached',()=>{
 const style=getStyle();
 const terrain={id:'terrain-shade',type:'hillshade',paint:{}};
 style.layers.push(terrain);
 applyMoonlight(style);
 assert.equal(terrain.paint['hillshade-illumination-direction'],315);
});

test('MapLibre accepts every base-city paint expression',()=>{
 assert.deepEqual(validateStyleMin(getStyle()).map(error=>error.message),[]);
});

test('the actual startup reaches MapLibre construction, with only one graphics context',()=>{
 const reached=new Error('Reached real map construction boundary');
 let options;
 const prefix=renderer.slice(renderer.indexOf('const startup='),renderer.indexOf('let deckLayers='));
 assert.throws(()=>vm.runInNewContext(prefix,{
  ...bindings,structuredClone,
  window:{__zaydarStartup:{phase(){},fatal(){}}},
  // No document canvas probe should be needed before the real map is created.
  maplibregl:{Map:class{constructor(value){options=value;throw reached;}}}
 }),error=>error===reached);
 assert.ok(options.pitch>0);
 assert.deepEqual(validateStyleMin(options.style).map(error=>error.message),[]);
});

test('MapLibre accepts optional road texture widths too',()=>{
 const style=getStyle();
 installRoadSurface({
  hasImage:()=>true,getLayer:()=>false,
  addLayer:layer=>style.layers.push(layer)
 },['!',bridgeFilter],roadLineWidth);
 assert.ok(style.layers.find(layer=>layer.id==='streets-texture'));
 assert.deepEqual(validateStyleMin(style).map(error=>error.message),[]);
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
 return {handlers,messages,status,dataset,ErrorEvent,startup:window.__zaydarStartup};
}

test('startup bridge surfaces the original error and deduplicates it',()=>{
 const b=bridge();
 b.handlers.get('error')(new b.ErrorEvent("Cannot read properties of undefined (reading 'paint')"));
 b.handlers.get('unhandledrejection')({reason:new Error('secondary rejection')});
 const errors=b.messages.filter(message=>message.type==='fatal');
 assert.equal(errors.length,1);
 assert.match(errors[0].message,/reading 'paint'/);
 assert.match(b.status.textContent,/reading 'paint'/);
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

test('a blank rendered canvas is not accepted as the city first frame',()=>{
 let onRender,frames=0;
 const canvas={width:390,height:720};
 let features=[];
 const context=vm.createContext({
  loaded:true,scheduleFrame:()=>frames++,
  map:{on:(type,fn)=>{assert.equal(type,'render');onRender=fn;},getCanvas:()=>canvas,queryRenderedFeatures:()=>features}
 });
 const start=renderer.indexOf('let firstFrameSent=false,baseFrameRendered=false;');
 const end=renderer.indexOf('function draw(now)',start);
 assert.ok(start>=0&&end>start);
 vm.runInContext(renderer.slice(start,end),context);
 onRender();
 assert.equal(vm.runInContext('baseFrameRendered',context),false);
 assert.equal(frames,0);
 features=[{layer:{id:'water'}}];canvas.width=0;
 onRender();
 assert.equal(vm.runInContext('baseFrameRendered',context),false);
 canvas.width=390;onRender();
 assert.equal(vm.runInContext('baseFrameRendered',context),true);
 assert.equal(frames,1);
});
