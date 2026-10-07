import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

async function fixture(label,pitch=0){
 const handlers={},domHandlers={},canvas={width:400,height:800,style:{},parentNode:{insertBefore(){}}};
 const labels={style:{}};let frozen,removed=0;
 class Map{
  constructor(options){this.options=options;this.dragPan={isEnabled:()=>true};}
  on(event,fn){handlers[event]=fn;}
  getContainer(){return {querySelector:()=>canvas};}
  getCenter(){return {lng:-122.67,lat:45.52};}
  getZoom(){return 15;}
  getPitch(){return pitch;}
  getBearing(){return 0;}
  project(){return {x:200,y:400};}
 }
 const window={devicePixelRatio:3,maplibregl:{Map}};
 const document={
  addEventListener:(name,fn)=>domHandlers[name]=fn,
  getElementById:id=>id==='waypoint-lights-frozen'?{remove(){removed++;}}:id==='hologram-labels'?labels:canvas,
  createElement(){frozen={style:{},setAttribute(){},getContext:()=>({drawImage(){}})};return frozen;},
 };
 const path=label==='Mapz'?'../client/public/mapz-map/mapz-perf-preload.js':'../client/public/outzide-map/assets/map-perf-preload.js';
 vm.runInNewContext(await readFile(new URL(path,import.meta.url),'utf8'),{window,document,matchMedia:()=>({matches:true}),structuredClone});
 const map=new window.maplibregl.Map({style:{terrain:{source:'elevation'},sources:{elevation:{},terrain:{}},layers:[]}});
 assert.equal(map.options.pixelRatio,label==='Mapz'?1.25:1.5);assert.equal(map.options.style.terrain,undefined);
 assert.equal(map.options.style.sources.elevation,undefined);
 return {handlers,domHandlers,canvas,labels,get frozen(){return frozen;},get removed(){return removed;}};
}

test('Mapz keeps live pins visible and untransformed throughout camera motion',async()=>{
 const f=await fixture('Mapz',48);
 assert.equal(f.handlers.dragstart,undefined);
 for(const handler of [f.domHandlers.DOMContentLoaded,...['load','movestart','move','moveend'].map(name=>f.handlers[name])]){
  for(const el of [f.canvas,f.labels])Object.assign(el.style,{visibility:'hidden',transform:'translate(20px)',willChange:'transform'});
  handler();
  for(const el of [f.canvas,f.labels]){assert.equal(el.style.visibility,'');assert.equal(el.style.transform,'');assert.equal(el.style.willChange,'');}
 }
 assert.equal(f.removed,5);assert.equal(f.frozen,undefined);
});
test('Outzide uses a snapshot only for flat dragging and restores the live overlay',async()=>{
 const f=await fixture('Outzide');
 assert.equal(f.handlers.movestart,undefined);
 f.handlers.dragstart();assert.equal(f.canvas.style.visibility,'hidden');
 f.handlers.render();assert.match(f.frozen.style.transform,/translate/);
 f.handlers.moveend();assert.equal(f.canvas.style.visibility,'');assert.equal(f.frozen.style.display,'none');
});
test('Outzide never freezes a pitched camera into a drifting flat snapshot',async()=>{
 const f=await fixture('Outzide',48);
 f.handlers.dragstart();f.handlers.render();
 assert.equal(f.frozen,undefined);assert.notEqual(f.canvas.style.visibility,'hidden');
});
