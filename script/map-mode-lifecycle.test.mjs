import test from 'node:test';
import assert from 'node:assert/strict';
import {whenMapRendered,whenMapSettled,extendMapStyle} from '../client/public/map-foundation/lifecycle.js';

test('boot waits for loaded geography on a render and removes its listeners',async()=>{
 const events=new Map();let loaded=false,resolved=false;
 const map={on:(event,fn)=>events.set(event,fn),off:event=>events.delete(event),loaded:()=>loaded,triggerRepaint(){}};
 const previous=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=fn=>queueMicrotask(fn);
 try{const ready=whenMapRendered(map).then(()=>resolved=true);events.get('render')();await Promise.resolve();assert.equal(resolved,false);loaded=true;events.get('render')();await ready;assert.equal(resolved,true);assert.equal(events.size,0);}
 finally{globalThis.requestAnimationFrame=previous;}
});
test('deferred surface retains the base source and layer objects and inserts effects in style order',()=>{
 const base={id:'water'},sources=new Map([['vector',{loaded:true}]]),layers=[base],terrain=[];
 const map={getSource:id=>sources.get(id),addSource:(id,source)=>sources.set(id,source),getLayer:id=>layers.find(layer=>layer.id===id),addLayer:(layer,before)=>layers.splice(before?layers.findIndex(existing=>existing.id===before):layers.length,0,layer),setTerrain:value=>terrain.push(value)};
 const vector=sources.get('vector');
 const style={sources:{vector:{loaded:false},dem:{type:'raster-dem'}},layers:[{id:'relief'},{id:'water'},{id:'contour'},{id:'labels'}],terrain:{source:'dem',exaggeration:1}};
 extendMapStyle(map,style);extendMapStyle(map,style);
 assert.equal(sources.get('vector'),vector);assert.equal(map.getLayer('water'),base);assert.deepEqual(layers.map(layer=>layer.id),['relief','water','contour','labels']);assert.deepEqual(terrain[0],style.terrain);assert.equal(layers.length,4);
});

test('terrain waits for a flat-map ease to finish, including another gesture before its next frame',async()=>{
 const events=new Map(),frames=[];let moving=true,resolved=false;
 const map={on:(event,fn)=>events.set(event,fn),off:event=>events.delete(event),isMoving:()=>moving};
 const previousFrame=globalThis.requestAnimationFrame,previousCancel=globalThis.cancelAnimationFrame;
 globalThis.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};globalThis.cancelAnimationFrame=()=>{};
 try{
  const ready=whenMapSettled(map).then(()=>resolved=true);frames.shift()();await Promise.resolve();assert.equal(resolved,false);
  moving=false;events.get('moveend')();moving=true;frames.shift()();await Promise.resolve();assert.equal(resolved,false);
  moving=false;events.get('moveend')();frames.shift()();await ready;assert.equal(resolved,true);assert.equal(events.size,0);
 }finally{globalThis.requestAnimationFrame=previousFrame;globalThis.cancelAnimationFrame=previousCancel;}
});
