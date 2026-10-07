import test from 'node:test';
import assert from 'node:assert/strict';
import {createMap,vectorFirstStyle,whenStyleReady,markerFrame,createMapActivity} from '../client/public/map-foundation/lifecycle.js';
import {setGeoJSON,registerImage,createFeatureInteraction} from '../client/public/map-foundation/layers.js';
import {mapzSurfaceStyle} from '../client/public/map-foundation/surface.js';
import {mapzSurfaceStyle as outzideSurface} from '../client/public/outzide-map/assets/outzide-surface.js';

test('vector boot removes only deferred terrain without mutating either scene',()=>{
 for(const make of [mapzSurfaceStyle,outzideSurface]){
  const style=make({terrainStrength:1,contourTiles:['contour://test']}),before=JSON.stringify(style),flat=vectorFirstStyle(style);
  assert.equal(JSON.stringify(style),before);
  assert.equal(flat.terrain,undefined);
  assert.equal(flat.sources.terrain.url,'https://tiles.openfreemap.org/planet');
  assert.ok(flat.layers.every(layer=>!layer.source||flat.sources[layer.source]));
  assert.ok(flat.layers.some(layer=>layer.id==='skyline'));
 }
});

test('creation preserves the scene options and exposes the original failure',()=>{
 const options={pitch:48,interactive:false};let actual;
 const map=createMap(options,{library:{Map:class{constructor(value){actual=value;}}}});
 assert.ok(map);assert.equal(actual,options);
 const failure=new Error('WebGL failed');let reported;
 assert.throws(()=>createMap(options,{library:{Map:class{constructor(){throw failure;}}},onError:error=>reported=error}),error=>error===failure);
 assert.equal(reported,failure);
});

test('style readiness handles cached load, style replacement and removal',async()=>{
 const listeners=new Map();let ready=false;
 const map={isStyleLoaded:()=>ready,on(type,fn){listeners.set(type,fn)},off(type){listeners.delete(type)}};
 const pending=whenStyleReady(map);
 listeners.get('styledata')();assert.equal(listeners.size,5);
 ready=true;listeners.get('idle')();await pending;assert.equal(listeners.size,0);
 await whenStyleReady(map);assert.equal(listeners.size,0);
 ready=false;const removed=whenStyleReady(map);listeners.get('remove')();await assert.rejects(removed,/removed/);assert.equal(listeners.size,0);
});

test('layout snapshot reads the container once and all marker boxes before effects',()=>{
 let containerReads=0;const reads=[];
 const map={getContainer:()=>({getBoundingClientRect(){containerReads++;return {left:10,top:20}}})};
 const markers=[1,2,3].map(id=>({getElement:()=>({getBoundingClientRect(){reads.push(id);return {left:30,top:40,width:20,height:20}}})}));
 const rows=markerFrame(map,markers);
 assert.equal(containerReads,1);assert.deepEqual(reads,[1,2,3]);
 assert.deepEqual(rows[0].anchor,{x:30,y:30});
});

test('GeoJSON and images avoid duplicate registration and allow retry',async()=>{
 let source,adds=0,updates=0,imageAdds=0,loads=0;
 const images=new Set(),map={getSource:()=>source,addSource(_id,value){adds++;source={setData(){updates++}}},hasImage:id=>images.has(id),addImage(id){images.add(id);imageAdds++}};
 const data={type:'FeatureCollection',features:[]};
 setGeoJSON(map,'points',data);setGeoJSON(map,'points',data);setGeoJSON(map,'points',{...data});
 assert.equal(adds,1);assert.equal(updates,1);
 await Promise.all([1,2,3].map(()=>registerImage(map,'pin',async()=>{loads++;return {};})));
 assert.equal(loads,1);assert.equal(imageAdds,1);
 images.clear();await registerImage(map,'pin',()=>{loads++;return {}});assert.equal(loads,1);assert.equal(imageAdds,2);
 await assert.rejects(registerImage(map,'retry',()=>{throw Error('network')}));
 await registerImage(map,'retry',()=>({}));assert.equal(imageAdds,3);
});

test('feature selection clears only the previous feature and deduplicates hover',()=>{
 const changes=[],map={getSource:()=>({}),setFeatureState:(target,value)=>changes.push([target.id,value])};
 const set=createFeatureInteraction(map,'points');
 set('selected',1);set('selected',2);set('hover',2);set('hover',2);set('hover',null);
 assert.deepEqual(changes,[[1,{selected:true}],[1,{selected:false}],[2,{selected:true}],[2,{hover:true}],[2,{hover:false}]]);
});

test('offscreen and document-hidden maps pause independently and dispose listeners',()=>{
 let intersect,visibility,disconnected=false,removed=false;const changes=[];
 const scope={document:{hidden:false,addEventListener(_type,fn){visibility=fn},removeEventListener(){removed=true}},IntersectionObserver:class{constructor(fn){intersect=fn}observe(){}disconnect(){disconnected=true}}};
 const map={getContainer:()=>({}),on(){},off(){}};
 const activity=createMapActivity(map,{scope,onChange:value=>changes.push(value)});
 intersect([{isIntersecting:false}]);assert.equal(activity.visible,false);
 scope.document.hidden=true;visibility();intersect([{isIntersecting:true}]);assert.equal(activity.visible,false);
 scope.document.hidden=false;visibility();assert.equal(activity.visible,true);
 assert.deepEqual(changes,[false,true]);activity.dispose();assert.equal(disconnected,true);assert.equal(removed,true);
});
