import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PORTLAND_BRIDGE_MODELS,ST_JOHNS_BEARING,ST_JOHNS_CENTER,ST_JOHNS_LENGTH_METERS,ST_JOHNS_MIN_ZOOM,estimateBridgePlacement,isStJohnsBridgeFeature,parseBridgeGlb,parseStJohnsBridgeGlb} from '../client/public/zaydar-map/st-johns-bridge.js';

const modelUrl=new URL('../client/public/zaydar-map/models/st-johns-bridge.glb',import.meta.url);

test('St. Johns model asset retains the supplied geometry and real-world scale',async()=>{
  const file=await readFile(modelUrl),buffer=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
  assert.equal(createHash('sha256').update(file).digest('hex'),'7c7e29a6dd2313b892b1ff53e8e78d68e24cbc6c91a57ca2468379231805ab6e');
  const model=parseStJohnsBridgeGlb(buffer);
  assert.equal(model.count,193284);
  assert.ok(Math.abs(model.bounds.length-ST_JOHNS_LENGTH_METERS)<1e-6);
  assert.ok(Math.abs(model.scale-630/630.4)<1e-6);
  let covariance=0;
  for(let index=0;index<model.vertices.length;index+=7)covariance+=model.vertices[index]*model.vertices[index+1];
  assert.ok(covariance<0,'northeast model axis must use negative Mercator Y');
});

test('St. Johns placement follows its OSM core alignment and building zoom threshold',()=>{
  assert.deepEqual(ST_JOHNS_CENTER,[-122.76327215,45.58579725]);
  assert.ok(Math.abs(ST_JOHNS_BEARING-54.24624408372691)<1e-9);
  assert.equal(ST_JOHNS_MIN_ZOOM,12);
  const bridge={geometry:{type:'LineString',coordinates:[[-122.7665109,45.5841653],[-122.7600334,45.5874292]]},properties:{class:'primary',brunnel:'bridge'}};
  const downtown={geometry:{type:'LineString',coordinates:[[-122.68,45.52],[-122.67,45.53]]},properties:{class:'primary',brunnel:'bridge'}};
  assert.equal(isStJohnsBridgeFeature(bridge),true);
  assert.equal(isStJohnsBridgeFeature(downtown),false);
});

test('all supplied Portland bridge models retain their authored meter scale',async()=>{
  const expected={
    'bnsf-5-1':[50364,545],'bnsf-9-6':[77688,864],broadway:[31212,499.6],burnside:[15948,248.2],fremont:[87636,664],
    'glenn-jackson':[29052,3588],hawthorne:[28872,422.9],interstate:[90360,1086],marquam:[24984,326],morrison:[15012,239.7],
    'ross-island':[33444,562],sellwood:[32292,609],steel:[41328,252],'tilikum-crossing':[22980,532],
  };
  assert.equal(PORTLAND_BRIDGE_MODELS.length,15);
  for(const definition of PORTLAND_BRIDGE_MODELS.slice(1)){
    const file=await readFile(new URL(`../client/public/zaydar-map/models/${definition.id}.glb`,import.meta.url));
    const model=parseBridgeGlb(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),definition.bearing,definition.length);
    assert.equal(model.count,expected[definition.id][0],definition.label);
    assert.ok(Math.abs(model.bounds.length-expected[definition.id][1])<1e-3,definition.label);
    assert.ok(Math.abs(model.scale-1)<1e-3,definition.label);
  }
});

test('bridge placement snaps GPS anchors to road centerlines and derives compass bearings',()=>{
  const anchor=[-122.7,45.5],metersToDegrees=([east,north])=>[anchor[0]+east/(111320*Math.cos(anchor[1]*Math.PI/180)),anchor[1]+north/111320];
  const feature={geometry:{type:'LineString',coordinates:[metersToDegrees([-140,-100]),metersToDegrees([140,100])]},properties:{class:'primary',brunnel:'bridge'}};
  const placement=estimateBridgePlacement([feature],{center:anchor,length:350});
  assert.ok(Math.hypot((placement.center[0]-anchor[0])*78000,(placement.center[1]-anchor[1])*111320)<.01);
  assert.ok(Math.abs(placement.bearing-54.46)<.1);
  assert.ok(Math.abs(placement.span-344.09)<.2);
});

test('procedural bridge decks remain enabled as connected model approaches',async()=>{
  const source=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  assert.match(source,/portlandBridges\.update\(allBridgeFeatures\)/);
  assert.match(source,/bridgeLayer\.update\(bridgeFeatures\)/);
  assert.doesNotMatch(source,/bridgeLayer\.update\([^\n]*isStJohnsBridgeFeature/);
});

const {fitBridgeRoad,sampleBridgeRoad}=await import('../client/public/zaydar-map/bridge-fit.js');
const {deckHeight}=await import('../client/public/home-flight/bridge-roads.js');
function roadFeature(points,properties={}){
 const anchor=[-122.7,45.5];
 return {properties:{class:'primary',brunnel:'bridge',...properties},geometry:{type:'LineString',coordinates:points.map(([x,y])=>[anchor[0]+x/(111320*Math.cos(anchor[1]*Math.PI/180)),anchor[1]-y/111320])}};
}
test('model fitting follows road curves and the exact road ramp profile',()=>{
 const feature=roadFeature([[-300,0],[-100,0],[100,35],[300,35]]);
 const fit=fitBridgeRoad([feature],{id:'test',center:[-122.7,45.5],length:700});
 assert.ok(fit);
 const start=sampleBridgeRoad(fit,0),end=sampleBridgeRoad(fit,1),middle=sampleBridgeRoad(fit,.5);
 assert.ok(Math.abs(start.x+300)<.001);assert.ok(Math.abs(end.x-300)<.001);
 assert.ok(Math.abs(end.y-35)<.001);
 assert.equal(start.width,8);assert.equal(end.width,8);
 assert.equal(start.height,deckHeight(0,true));assert.equal(end.height,deckHeight(0,true));
 assert.equal(middle.height,deckHeight(150,true));
});
test('fitting ignores nearby footpaths and supports MapLibre geometry getters',()=>{
 const road=roadFeature([[-300,8],[300,8]]),footpath=roadFeature([[-300,0],[300,0]],{class:'path'});
 const wrapper={properties:road.properties};Object.defineProperty(wrapper,'geometry',{get:()=>road.geometry});
 const fit=fitBridgeRoad([wrapper,footpath],{id:'test',center:[-122.7,45.5],length:600});
 assert.ok(fit);assert.ok(Math.abs(sampleBridgeRoad(fit,.5).y-8)<.001);
});
test('fitted road models omit the authored second deck and contain only finite geometry',async()=>{
 const fit=fitBridgeRoad([roadFeature([[-400,0],[400,0]])],{id:'test',center:[-122.7,45.5],length:630});
 const file=await readFile(modelUrl),buffer=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
 const original=parseStJohnsBridgeGlb(buffer),fitted=parseBridgeGlb(buffer,90,630,fit);
 assert.equal(original.count-fitted.count,108,'all St Johns road/sidewalk triangles are replaced by the connected road mesh');
 for(const value of fitted.vertices)assert.ok(Number.isFinite(value));
 let maximumSide=0;for(let i=0;i<fitted.vertices.length;i+=7)maximumSide=Math.max(maximumSide,Math.abs(fitted.vertices[i+1]));
 assert.ok(maximumSide<6,'structure width fits the 8m road rather than the original 21m deck');
});

test('rail ground strokes are hidden only after the raised replacement is ready, and restored below building zoom',async()=>{
 const {createPortlandBridgeLayer}=await import('../client/public/zaydar-map/st-johns-bridge.js');
 const layer=createPortlandBridgeLayer({},()=>0,[{id:'bnsf-test',center:[-122.7,45.5],length:600}]);
 const filters=new Map([['streets',['==',['get','class'],'rail']],['street-casings',null]]);let zoom=15;
 layer.map={getZoom:()=>zoom,getLayer:id=>filters.has(id),getFilter:id=>filters.get(id),setFilter:(id,value)=>filters.set(id,value),triggerRepaint(){}};
 layer.update([roadFeature([[-300,0],[300,0]],{class:'rail'})]);
 layer.syncRailSurfaces();assert.deepEqual(filters.get('streets'),['==',['get','class'],'rail']);
 layer.models[0].count=36;layer.syncRailSurfaces();
 assert.equal(filters.get('streets')[0],'all');assert.match(JSON.stringify(filters.get('streets')),/within/);
 zoom=11;layer.syncRailSurfaces();assert.deepEqual(filters.get('streets'),['==',['get','class'],'rail']);assert.equal(filters.get('street-casings'),null);
});

test('Glenn Jackson fits its whole roadway rather than expanding a narrow median',async()=>{
 const definition=PORTLAND_BRIDGE_MODELS.find(d=>d.id==='glenn-jackson');
 const fit=fitBridgeRoad([roadFeature([[-1800,0],[1800,0]],{class:'motorway'})],{...definition,center:[-122.7,45.5]});
 const file=await readFile(new URL(definition.url)),model=parseBridgeGlb(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),90,definition.length,fit);
 let width=0;for(let i=0;i<model.vertices.length;i+=7)width=Math.max(width,Math.abs(model.vertices[i+1])*2);
 assert.ok(width<9.2,`the 9m road must not acquire a ${width}m-wide bridge`);
});
