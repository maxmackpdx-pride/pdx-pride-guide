import test from 'node:test';
import assert from 'node:assert/strict';
import {BRIDGE_GLOW_PALETTES,bridgeGlowColor,bridgeGlowSpans} from '../client/public/zaydar-map/bridge-water-glow.js';
import {fitBridgeRoad} from '../client/public/zaydar-map/bridge-fit.js';
import {PORTLAND_BRIDGE_MODELS} from '../client/public/zaydar-map/st-johns-bridge.js';
import {createWaterBloom} from '../client/public/zaydar-map/natural-surfaces.js';

const center=[-122.67,45.52];
function fixture(reverse=false,length=600){
 const coordinates=[[-length/2,0],[0,15],[length/2,0]].map(([x,y])=>[center[0]+x/(111320*Math.cos(center[1]*Math.PI/180)),center[1]-y/111320]);
 const road={properties:{class:'primary',brunnel:'bridge'},geometry:{type:'LineString',coordinates:reverse?coordinates.reverse():coordinates}};
 return fitBridgeRoad([road],{id:'broadway',center,length:length*1.1},()=>12);
}

test('bridge gradients interpolate the rainbow, trans and lesbian flag stops continuously',()=>{
 for(const [name,colors] of Object.entries(BRIDGE_GLOW_PALETTES)){
  colors.forEach((hex,index)=>assert.deepEqual(bridgeGlowColor(name,index/(colors.length-1)),hex.slice(1).match(/../g).map(c=>parseInt(c,16))));
  for(let i=1;i<=1000;i++)assert.ok(bridgeGlowColor(name,i/1000).every((value,j)=>Math.abs(value-bridgeGlowColor(name,(i-1)/1000)[j])<=2));
 }
 assert.deepEqual(bridgeGlowColor('trans',.5),[255,245,255]);
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
  assert.equal(sample.clearance,sample.height-12);
 }
 assert.ok(bridgeGlowSpans([{id:'interstate',fit:fixture(false,4000)}])[0].samples.length<=73);
});

function canvasFixture(){
 const canvases=[];
 const document={createElement(){
  const canvas={width:1,height:1},calls=[],stack=[];
  const ctx={globalAlpha:1,globalCompositeOperation:'source-over',
   save(){stack.push([this.globalAlpha,this.globalCompositeOperation]);},
   restore(){[this.globalAlpha,this.globalCompositeOperation]=stack.pop();},
   transform(...args){assert.ok(args.every(Number.isFinite));calls.push(['transform',...args]);},
   beginPath(){},moveTo(){},lineTo(){},closePath(){},clearRect(){},stroke(){},
   fill(){calls.push(['fill',this.globalCompositeOperation]);},fillRect(){},
   drawImage(source){calls.push(['image',this.globalCompositeOperation,source]);},
   createRadialGradient(){return {addColorStop(){}};},
   createLinearGradient(){return {addColorStop(){}};},
   getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4).fill(255)};},
   createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){},
  };
  canvas.getContext=()=>ctx;canvas.calls=calls;canvases.push(canvas);return canvas;
 }};
 return {document,canvases};
}

test('water glow caches stationary frames, masks land and decks, and reprojects on camera motion',t=>{
 const {document,canvases}=canvasFixture();
 t.mock.method(globalThis,'setTimeout',()=>{throw Error('glow must not start another animation loop');});
 const previousDocument=globalThis.document,previousPath=globalThis.Path2D;
 globalThis.document=document;globalThis.Path2D=class{moveTo(){}lineTo(){}};
 t.after(()=>{globalThis.document=previousDocument;globalThis.Path2D=previousPath;});
 let pan=0,zoom=14,pitch=48,bearing=0;
 const map={getCenter:()=>({lng:center[0]+pan/100000,lat:center[1]}),getZoom:()=>zoom,getPitch:()=>pitch,getBearing:()=>bearing,querySourceFeatures:()=>[],
  project:([lng,lat])=>{const x=(lng-center[0])*40000,y=(lat-center[1])*40000,angle=bearing*Math.PI/180;return {x:200+pan+x*Math.cos(angle)-y*Math.sin(angle),y:150+x*Math.sin(angle)+y*Math.cos(angle)};}};
 const bloom=createWaterBloom(),output=document.createElement('canvas').getContext('2d');
 const spans=bridgeGlowSpans([{id:'broadway',fit:fixture()}],()=>12);
 const draw=time=>bloom.draw(output,map,400,300,1,time,false,[],spans);
 draw(0);
 const cache=canvases.find(c=>c.calls.some(call=>call[0]==='transform'));
 assert.ok(cache);
 assert.ok(cache.calls.some(c=>c[0]==='fill'&&c[1]==='destination-out'),'bridge roadway is cut out');
 assert.equal(cache.calls.at(-1)[1],'destination-in','water/island mask is applied last');
 const initialCount=cache.calls.length,textureCount=canvases.length;
 draw(1);assert.equal(cache.calls.length,initialCount,'stationary animation only composites cached textures');
 assert.equal(canvases.length,textureCount);
 pan=20;bearing=35;pitch=60;zoom=15;draw(2);
 assert.ok(cache.calls.length>initialCount);
 assert.equal(canvases.length,textureCount,'camera motion reuses stamps');
 const rebuiltCount=cache.calls.length;
 bloom.invalidate();draw(3);assert.ok(cache.calls.length>rebuiltCount,'new source geometry invalidates water clipping');
 bloom.dispose();assert.ok(canvases.filter(c=>c.calls.some(call=>call[0]==='transform')).every(c=>c.width===1&&c.height===1));
});
