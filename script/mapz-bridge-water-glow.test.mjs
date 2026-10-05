import test from 'node:test';
import assert from 'node:assert/strict';
import {BRIDGE_GLOW_PALETTES,BRIDGE_GLOW_SATURATION,BRIDGE_GLOW_BRIGHTNESS,saturateBridgeColor,bridgeGlowColor,bridgeGlowSpans,clipGlowLineToWater,installCheapBridgeGlow,bridgeGlowGradient} from '../client/public/mapz-map/bridge-water-glow.js';
import {fitBridgeRoad} from '../client/public/mapz-map/bridge-fit.js';
import {PORTLAND_BRIDGE_MODELS} from '../client/public/mapz-map/st-johns-bridge.js';

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

test('only major crossings from Sellwood through St Johns and I-5 get colored underglow',()=>{
 const spans=bridgeGlowSpans(PORTLAND_BRIDGE_MODELS.map(model=>({...model,fit:fixture()})));
 assert.deepEqual(spans.map(s=>s.id).sort(),['st-johns','broadway','burnside','fremont','hawthorne','interstate','marquam','morrison','ross-island','sellwood','steel','tilikum-crossing'].sort());
 assert.deepEqual(new Set(spans.map(s=>s.palette)),new Set(['rainbow','trans','lesbian']));
 assert.deepEqual(bridgeGlowSpans([{id:'broadway',fit:null},{id:'unknown-overpass',fit:fixture()}]),[]);
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
 assert.ok(bridgeGlowSpans([{id:'broadway',fit:fixture(false,4000)}])[0].samples.length<=73);
});

test('extra 20 percent vibrancy preserves neutral white and brightness increases separately',()=>{
 assert.equal(BRIDGE_GLOW_SATURATION,1.5*1.2);assert.equal(BRIDGE_GLOW_BRIGHTNESS,1.3);
 assert.deepEqual(saturateBridgeColor([120,180,200]),[56,164,200]);
 assert.deepEqual(saturateBridgeColor([255,255,255]),[255,255,255]);
 const rgb=saturateBridgeColor([10,100,240]);assert.equal(Math.max(...rgb),240);assert.equal(Math.min(...rgb),0);
});


test('water clipping separates islands and never falls back to dry land',()=>{
 const water=[[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,2],[6,2],[6,8],[4,8],[4,2]]]];
 assert.deepEqual(clipGlowLineToWater([[-2,5],[12,5]],water),[[[0,5],[4,5]],[[6,5],[10,5]]]);
 assert.deepEqual(clipGlowLineToWater([[-2,12],[12,12]],water),[]);
 assert.deepEqual(clipGlowLineToWater([[0,5],[10,5]],[]),[]);
});
test('cheap glow installs reusable line layers below buildings with valid gradients',()=>{
 const sources=new Map(),layers=new Map(),before=[];
 const map={getStyle:()=>({}),querySourceFeatures:()=>[],getSource:id=>sources.get(id),
  addSource(id,source){sources.set(id,{...source,setData(data){this.data=data;}});},
  getLayer:id=>id==='buildings'||layers.get(id),addLayer(layer,anchor){layers.set(layer.id,layer);before.push(anchor);}};
 installCheapBridgeGlow(map);installCheapBridgeGlow(map);
 assert.equal(layers.size,3);assert.ok(before.every(id=>id==='buildings'));
 for(const [id,source] of sources){assert.equal(source.lineMetrics,true);assert.deepEqual(source.data.features,[]);assert.equal(layers.get(id).type,'line');}
 for(const theme of Object.keys(BRIDGE_GLOW_PALETTES))assert.equal(bridgeGlowGradient(theme)[0],'interpolate');
});
