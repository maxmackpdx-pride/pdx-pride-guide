import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
for(const [label,path] of [['Mapz','../client/public/zaydar-map/mapz-perf-preload.js'],['Outzide','../client/public/outzide-map/assets/map-perf-preload.js']]) {
 test(`${label} preload runs, caps pixels, and restores overlays after dragging`,async()=>{
  const handlers={},canvas={width:400,height:800,style:{},parentNode:{insertBefore(){}}};
  let frozen;
  class Map {
   constructor(options){this.options=options;this.dragPan={isEnabled:()=>true};}
   on(event,fn){handlers[event]=fn;}
   getContainer(){return {querySelector:()=>canvas};}
   getCenter(){return {lng:-122.67,lat:45.52};}
   getZoom(){return 15;}
   getBearing(){return 0;}
   project(){return {x:200,y:400};}
  }
  const window={devicePixelRatio:3,maplibregl:{Map}};
  const document={getElementById:()=>canvas,createElement(){frozen={style:{},setAttribute(){},getContext:()=>({drawImage(){}})};return frozen;}};
  vm.runInNewContext(await readFile(new URL(path,import.meta.url),'utf8'),{window,document,matchMedia:()=>({matches:true}),structuredClone});
  const map=new window.maplibregl.Map({style:{terrain:{source:'elevation'},sources:{elevation:{},terrain:{}},layers:[]}});
  assert.equal(map.options.pixelRatio,1.5);assert.equal(map.options.style.terrain,undefined);
  assert.equal(handlers.movestart,undefined,'programmatic camera motion must not freeze live overlays');
  handlers.dragstart();assert.equal(canvas.style.visibility,'hidden');
  handlers.render();assert.match(frozen.style.transform,/translate/);
  handlers.moveend();assert.equal(canvas.style.visibility,'');assert.equal(frozen.style.display,'none');
 });
}
