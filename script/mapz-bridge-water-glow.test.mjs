import test from 'node:test';
import assert from 'node:assert/strict';
import {BRIDGE_GLOW_PALETTES,BRIDGE_GLOW_SATURATION,BRIDGE_GLOW_BRIGHTNESS,saturateBridgeColor,bridgeGlowColor,bridgeGlowSpans,bridgeGlowGradient,bridgeGlowLineCollections,installCheapBridgeGlow} from '../client/public/zaydar-map/bridge-water-glow.js';
import {fitBridgeRoad} from '../client/public/zaydar-map/bridge-fit.js';
import {PORTLAND_BRIDGE_MODELS} from '../client/public/zaydar-map/st-johns-bridge.js';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const {MercatorCoordinate}=createRequire(import.meta.url)('maplibre-gl');

const center=[-122.67,45.52];
function fixture(reverse=false,length=600){
 const coordinates=[[-length/2,0],[0,15],[length/2,0]].map(([x,y])=>[center[0]+x/(111320*Math.cos(center[1]*Math.PI/180)),center[1]-y/111320]);
 const road={properties:{class:'primary',brunnel:'bridge'},geometry:{type:'LineString',coordinates:reverse?coordinates.reverse():coordinates}};
 return fitBridgeRoad([road],{id:'broadway',center,length:length*1.1},()=>12);
}

test('bridge gradients interpolate the rainbow, trans and lesbian flag stops continuously',()=>{
 for(const [name,colors] of Object.entries(BRIDGE_GLOW_PALETTES)){
  colors.forEach((hex,index)=>assert.deepEqual(bridgeGlowColor(name,index/(colors.length-1)),saturateBridgeColor(hex.slice(1).match(/../g).map(c=>parseInt(c,16)))));
  for(let i=1;i<=1000;i++)assert.ok(bridgeGlowColor(name,i/1000).every((value,j)=>Math.abs(value-bridgeGlowColor(name,(i-1)/1000)[j])<=3));
 }
 assert.deepEqual(bridgeGlowColor('trans',.5),[255,237,255]);
 assert.deepEqual(bridgeGlowColor('trans',.2),bridgeGlowColor('trans',.8));
});

test('only major crossings from Sellwood through St Johns get colored underglow; the disabled Interstate stays dark',()=>{
 const spans=bridgeGlowSpans(PORTLAND_BRIDGE_MODELS.map(model=>({...model,fit:fixture()})));
 assert.deepEqual(spans.map(s=>s.id).sort(),['st-johns','broadway','burnside','fremont','hawthorne','marquam','morrison','ross-island','sellwood','steel','tilikum-crossing'].sort());
 assert.deepEqual(new Set(spans.map(s=>s.palette)),new Set(['rainbow','trans','lesbian']));
 assert.deepEqual(bridgeGlowSpans([{id:'broadway',fit:null},{id:'interstate',fit:fixture()},{id:'unknown-overpass',fit:fixture()}]),[]);
});

test('glow follows fitted roads and retains geographic color direction when tile lines reverse',()=>{
 const a=bridgeGlowSpans([{id:'broadway',fit:fixture()}],()=>12)[0];
 const b=bridgeGlowSpans([{id:'broadway',fit:fixture(true)}],()=>12)[0];
 assert.ok(a.samples[0].coordinate[0]<center[0]);
 assert.ok(a.samples.at(-1).coordinate[0]>center[0]);
 for(const sample of a.samples){
  const match=b.samples.find(p=>Math.hypot(p.coordinate[0]-sample.coordinate[0],p.coordinate[1]-sample.coordinate[1])<1e-8);
  assert.ok(match);assert.ok(Math.abs(match.fraction-sample.fraction)<1e-8);

 }
 assert.ok(bridgeGlowSpans([{id:'st-johns',fit:fixture(false,4000)}])[0].samples.length<=73);
});

test('extra 20 percent vibrancy preserves neutral white and brightness increases separately',()=>{
 assert.equal(BRIDGE_GLOW_SATURATION,1.5*1.2);assert.equal(BRIDGE_GLOW_BRIGHTNESS,1.3);
 assert.deepEqual(saturateBridgeColor([120,180,200]),[56,164,200]);
 assert.deepEqual(saturateBridgeColor([255,255,255]),[255,255,255]);
 const rgb=saturateBridgeColor([10,100,240]);assert.equal(Math.max(...rgb),240);assert.equal(Math.min(...rgb),0);
});

const water=[[
 [[-122.68,45.51],[-122.66,45.51],[-122.66,45.53],[-122.68,45.53],[-122.68,45.51]],
 [[-122.671,45.519],[-122.670,45.519],[-122.670,45.520],[-122.671,45.520],[-122.671,45.519]],
]];

test('glow gradients run each flag along the line and unknown palettes fall back to rainbow',()=>{
 for(const [name,colors] of Object.entries(BRIDGE_GLOW_PALETTES)){
  const expr=bridgeGlowGradient(name);
  assert.deepEqual(expr.slice(0,3),['interpolate',['linear'],['line-progress']]);
  assert.equal(expr.length,3+colors.length*2);
  assert.equal(expr[3],0);assert.equal(expr.at(-2),1);
  assert.deepEqual(expr.filter((_,i)=>i>=3&&i%2===0),colors);
 }
 assert.deepEqual(bridgeGlowGradient('unknown'),bridgeGlowGradient('rainbow'));
});

test('glow lines still draw for every themed bridge before road tiles load',()=>{
 const collections=bridgeGlowLineCollections([],[]);
 const rows=Object.values(collections).flat();
 assert.ok(rows.length>0);
 for(const [palette,features] of Object.entries(collections)){
  assert.ok(Object.hasOwn(BRIDGE_GLOW_PALETTES,palette));
  for(const feature of features){
   assert.equal(feature.properties.palette,palette);
   assert.equal(feature.geometry.type,'LineString');
   assert.ok(feature.geometry.coordinates.length>=2);
   assert.ok(feature.geometry.coordinates.flat().every(Number.isFinite));
  }
 }
 const ids=new Set(rows.map(row=>row.properties.id));
 for(const model of PORTLAND_BRIDGE_MODELS)if(model.disabled)assert.ok(!ids.has(model.id),model.id+' is disabled');
});

test('glow keeps only the part of a bridge that crosses water, and skips island holes',()=>{
 const model=PORTLAND_BRIDGE_MODELS.find(m=>m.id==='broadway'&&!m.disabled);
 const [lng,lat]=model.center,d=.05;
 const eastRiver=[[[lng,lat-d],[lng+d,lat-d],[lng+d,lat+d],[lng,lat+d],[lng,lat-d]]];
 const line=rows=>rows.find(f=>f.properties.id==='broadway').geometry.coordinates;
 const east=line(bridgeGlowLineCollections([],[eastRiver]).rainbow);
 assert.ok(east.length>=2);assert.ok(east.every(([x])=>x>=lng),'west bank stays dark');
 const full=line(bridgeGlowLineCollections([],[[[[lng-d,lat-d],[lng+d,lat-d],[lng+d,lat+d],[lng-d,lat+d],[lng-d,lat-d]]]]).rainbow);
 const [hx,hy]=full[Math.floor(full.length/2)],h=1e-5;
 const island=[[[lng-d,lat-d],[lng+d,lat-d],[lng+d,lat+d],[lng-d,lat+d],[lng-d,lat-d]],[[hx-h,hy-h],[hx+h,hy-h],[hx+h,hy+h],[hx-h,hy+h],[hx-h,hy-h]]];
 const skipped=line(bridgeGlowLineCollections([],[island]).rainbow);
 assert.equal(skipped.length,full.length-1);assert.ok(!skipped.some(([x,y])=>x===hx&&y===hy),'island point is dropped');
});

function mockMap(layerIds=['water','buildings','bridge-decks','skyline']){
 const layers=[...layerIds],sources=new Map(),calls={setData:0};
 return {calls,layers,sources,
  getStyle:()=>({}),getLayer:id=>layers.includes(id)?{id}:undefined,
  getSource:id=>sources.get(id),
  addSource(id,source){sources.set(id,{...source,setData(){calls.setData++;}});},
  addLayer(layer,before){before?layers.splice(layers.indexOf(before),0,layer.id):layers.push(layer.id);this[`layer:${layer.id}`]=layer;},
  querySourceFeatures:()=>[],
 };
}

test('cheap glow installs one line-metric source per flag underneath the bridge decks',()=>{
 const map=mockMap();installCheapBridgeGlow(map);
 const ids=[...map.sources.keys()];
 assert.ok(ids.length>0);assert.equal(map.__mapzCheapBridgeGlow,true);
 for(const id of ids){
  assert.equal(map.sources.get(id).lineMetrics,true,'line-gradient needs line metrics');
  assert.ok(map.layers.indexOf(id)<map.layers.indexOf('bridge-decks'),id+' draws under the decks');
  assert.equal(map[`layer:${id}`].paint['line-gradient'][2][0],'line-progress');
 }
 const before=map.layers.length;installCheapBridgeGlow(map);
 assert.equal(map.layers.length,before,'repeat syncs never duplicate layers');
 assert.equal(map.calls.setData,ids.length,'repeat syncs refresh data in place');
});

test('cheap glow waits for a style and survives failed tile queries',()=>{
 installCheapBridgeGlow(null);
 const empty=mockMap();empty.getStyle=()=>null;installCheapBridgeGlow(empty);assert.equal(empty.sources.size,0);
 const broken=mockMap(['buildings']);broken.querySourceFeatures=()=>{throw new Error('tiles');};
 installCheapBridgeGlow(broken);assert.ok(broken.sources.size>0);
 assert.ok([...broken.sources.keys()].every(id=>broken.layers.indexOf(id)<broken.layers.indexOf('buildings')));
});

test('bridge glow is installed from the roof sync, not the retired reflection layer',async()=>{
 const boot=await readFile(new URL('../client/public/zaydar-map/mapz-roof-boot.js',import.meta.url),'utf8');
 const flight=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
 assert.match(boot,/installCheapBridgeGlow\(map\)/);
 assert.doesNotMatch(flight,/bridgeWater|surfaces\.bridgeGlow/);
});
