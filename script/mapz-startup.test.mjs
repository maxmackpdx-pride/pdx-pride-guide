import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import {vectorStyle} from '../client/public/home-flight/city-map.js';
import {mapzSurfaceStyle} from '../client/public/zaydar-map/natural-surfaces.js';
// Use the validator belonging to the installed MapLibre dependency, not a
// hand-written approximation of its zoom-expression rules.
const require=createRequire(import.meta.url);
const maplibreRequire=createRequire(require.resolve('maplibre-gl'));
const {validateStyleMin}=maplibreRequire('@maplibre/maplibre-gl-style-spec');
const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
const html=await readFile(new URL('../client/public/zaydar-map/index.html',import.meta.url),'utf8');
const getStyle=()=>structuredClone(vectorStyle);
test('home map retains vector buildings without added terrain or backgrounds',()=>{
 const style=getStyle();
 assert.deepEqual(Object.keys(style.sources),['terrain']);
 assert.equal(style.sources.terrain.url,'https://tiles.openfreemap.org/planet');
 assert.deepEqual(style.layers.map(l=>l.id),['water','banks','streams','streets','skyline','buildings']);
 assert.equal(style.light.color,'#c7d9ed');
});

test('MapLibre accepts every base-city paint expression',()=>{
 assert.deepEqual(validateStyleMin(getStyle()).map(error=>error.message),[]);
});

test('the actual startup reaches MapLibre construction, with only one graphics context',()=>{
 const reached=new Error('Reached real map construction boundary');
 let options;
 const prefix=renderer.slice(renderer.indexOf('const startup='),renderer.indexOf('const waterBloom='));
 assert.throws(()=>vm.runInNewContext(prefix,{
  mapzSurfaceStyle,structuredClone,
  window:{__zaydarStartup:{phase(){},fatal(){}}},
  // No document canvas probe should be needed before the real map is created.
  maplibregl:{Map:class{constructor(value){options=value;throw reached;}}}
 }),error=>error===reached);
 assert.ok(options.pitch>0);
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
