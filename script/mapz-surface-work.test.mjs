import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurfaceWork} from '../client/public/mapz-map/surface-work.js';
import {createVenueRoofs} from '../client/public/mapz-map/venue-roofs.js';
import {prioritizeModels} from '../client/public/mapz-map/model-priority.js';
import {installCheapBridgeGlow} from '../client/public/mapz-map/bridge-water-glow.js';

test('tile, model and listing bursts produce one update with all invalidations',()=>{
 const frames=new Map(),calls=[];let id=0;
 const work=createSurfaceWork(dirty=>calls.push(dirty),fn=>{frames.set(++id,fn);return id;},key=>frames.delete(key));
 work.schedule({geometry:true});work.schedule({glow:true});work.schedule();
 assert.equal(frames.size,1);frames.get(1)();frames.delete(1);
 assert.deepEqual(calls,[{geometry:true,glow:true}]);
 work.schedule();frames.get(2)();frames.delete(2);
 assert.deepEqual(calls[1],{geometry:false,glow:false});
 work.schedule({glow:true});work.dispose();work.schedule({geometry:true});
 assert.equal(frames.size,0);
});

test('shared roof matches produce identical geometry and opacity to independent matching',()=>{
 const building={center:[0,0],height:20,ring:[[-.001,-.001],[.001,-.001],[.001,.001],[-.001,.001],[-.001,-.001]]};
 const feature={geometry:{coordinates:[0,0]},properties:{kind:'place',color:'#00FFFF'}};
 function fixture(){const writes=[];const source={setData:data=>writes.push(data)};return {writes,map:{getSource:()=>source,getLayer:()=>true,setPaintProperty:(...args)=>writes.push(args)}};}
 const a=fixture(),b=fixture();
 createVenueRoofs(a.map).update([building],[feature],.7);
 createVenueRoofs(b.map).update([building],[feature],.7,new Map([[feature,building]]));
 assert.deepEqual(a.writes,b.writes);
});

test('models on camera load first without changing the set or draw order',()=>{
 const models=[{center:[-5,50]},{center:[100,0]},{center:[50,50]},{center:[50,50]}];
 const original=[...models],map={getCanvas:()=>({clientWidth:100,clientHeight:100}),project:([x,y])=>({x,y})};
 assert.deepEqual(prioritizeModels(map,models),[models[2],models[3],models[1],models[0]]);
 assert.deepEqual(models,original);
});

test('unchanged bridge inputs reuse glow data; arriving water tiles invalidate it',()=>{
 const sources=new Map(),layers=new Map();let writes=0,water=[];
 const map={getStyle:()=>({}),querySourceFeatures:(_source,{sourceLayer})=>sourceLayer==='water'?water:[],getSource:id=>sources.get(id),getLayer:id=>layers.get(id),addLayer:layer=>layers.set(layer.id,layer),addSource:(id,source)=>sources.set(id,{...source,setData(){writes++;}})};
 installCheapBridgeGlow(map);installCheapBridgeGlow(map);assert.equal(writes,0);
 water=[{geometry:{type:'Polygon',coordinates:[[[-123,45],[-122,45],[-122,46],[-123,46],[-123,45]]]}}];
 installCheapBridgeGlow(map);assert.equal(writes,3);
 installCheapBridgeGlow(map);assert.equal(writes,3);
});
