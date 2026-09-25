import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createBuildingModelLayer} from '../client/public/zaydar-map/building-models.js';
import {createMapExploration,IOS_MAP_HANDLERS} from '../client/public/zaydar-map/map-exploration.js';

test('new tile remainder geometry does not reparse unchanged building filters',()=>{
 const layer=createBuildingModelLayer({});
 const model=layer.models[0];Object.assign(model,{count:3,bounds:{max:[10,10,20]},footprint:{min:[-10,-10],max:[10,10]}});
 const ring=([x,y],s=.00001)=>[[x-s,y-s],[x+s,y-s],[x+s,y+s],[x-s,y+s],[x-s,y-s]];
 const feature=offset=>({id:12,properties:{},geometry:{type:'MultiPolygon',coordinates:[[ring(model.center)],[ring([model.center[0]+offset,model.center[1]])]]}});
 let filters=0,dataWrites=0,zoom=16;
 layer.original=[{id:'buildings'},{id:'skyline'}];
 layer.map={getZoom:()=>zoom,setFilter:()=>filters++,getSource:()=>({setData:()=>dataWrites++})};
 layer.update([feature(.01)]);assert.equal(filters,2);assert.equal(dataWrites,1);
 layer.update([feature(.02)]);assert.equal(filters,2);assert.equal(dataWrites,2);
 layer.update([feature(.02)]);assert.equal(filters,2);assert.equal(dataWrites,2);
 zoom=11;layer.syncSurfaces();assert.equal(filters,4);assert.equal(layer.sceneFeatures.length,1);
});

test('tile arrivals retain the complete scene and cannot bypass its refresh interval',async()=>{
 const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
 let onData,frames=0,invalidations=0,timers=0;
 const map={},cached={time:100,buildings:[{height:20}]},surfaceCache=new WeakMap([[map,cached]]);
 map.on=(name,fn)=>{assert.equal(name,'sourcedata');onData=fn;};
 const context=vm.createContext({window:{setTimeout:()=>++timers},map,surfaceCache,scheduleFrame:()=>frames++,performance:{now:()=>200},terrainSamples:{invalidate:()=>invalidations++},groundLightPools:{invalidate:()=>invalidations++},bridgeLayer:{},waterBloom:{invalidate:()=>invalidations++}});
 vm.runInContext(renderer.slice(renderer.indexOf('let elevationDirty='),renderer.indexOf('// Neon colors')),context);
 const start=renderer.indexOf('function updateSurfaces('),end=renderer.indexOf('function drawSurfaceReflections',start);
 vm.runInContext(renderer.slice(start,end),context);
 for(let i=0;i<100;i++){onData({sourceId:'terrain',sourceDataType:'content'});onData({sourceId:'elevation',sourceDataType:'content'});assert.equal(vm.runInContext('updateSurfaces(map)',context),cached);}
 assert.equal(invalidations,0);assert.equal(frames,200);assert.equal(timers,1);
 context.performance.now=()=>2000;
 vm.runInContext('lastExplorationMove=1990',context);
 assert.equal(vm.runInContext('updateSurfaces(map)',context),cached);
 assert.equal(invalidations,0);
});

test('trackpad events coalesce into one camera update per frame and cancel on disposal',()=>{
 const listeners=new Map(),raf=new Map();let id=0,pans=[];
 const target={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener(){},classList:{toggle(){}},setAttribute(){}};
 const saved=Object.fromEntries(['window','document','localStorage','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));
 Object.assign(globalThis,{window:target,document:target,localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:fn=>{raf.set(++id,fn);return id;},cancelAnimationFrame:id=>raf.delete(id)});
 try{
 const map={getCanvasContainer:()=>target,getCanvas:()=>target,on(){},off(){},stop(){},panBy:offset=>pans.push(offset)};
 for(const name of IOS_MAP_HANDLERS)map[name]={enable(){},disable(){},enableRotation(){}};
 const controller=createMapExploration({map,pauseControl:{...target,checked:false},message:{},reduced:{matches:false},isReady:()=>true,onExplore(){},onMove(){}});
 listeners.get('pointerdown')({button:0,pointerId:1});
 const wheel=()=>listeners.get('wheel')({deltaX:2,deltaY:3,deltaMode:0,preventDefault(){},stopPropagation(){}});
 for(let i=0;i<20;i++)wheel();assert.equal(pans.length,0);assert.equal(raf.size,1);
 const callback=[...raf.values()][0];raf.clear();callback();assert.deepEqual(pans,[[40,60]]);
 wheel();controller.dispose();assert.equal(raf.size,0);
 }finally{for(const [key,value] of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
