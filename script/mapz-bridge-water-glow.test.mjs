import test from 'node:test';
import assert from 'node:assert/strict';
import {BRIDGE_GLOW_PALETTES,BRIDGE_GLOW_SATURATION,BRIDGE_GLOW_BRIGHTNESS,saturateBridgeColor,bridgeGlowColor,bridgeGlowSpans,bridgeWaterPatch,createBridgeWaterLayer} from '../client/public/zaydar-map/bridge-water-glow.js';
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
 assert.ok(bridgeGlowSpans([{id:'interstate',fit:fixture(false,4000)}])[0].samples.length<=73);
});

test('extra 20 percent vibrancy preserves neutral white and brightness increases separately',()=>{
 assert.equal(BRIDGE_GLOW_SATURATION,1.5*1.2);assert.equal(BRIDGE_GLOW_BRIGHTNESS,1.3);
 assert.deepEqual(saturateBridgeColor([120,180,200]),[56,164,200]);
 assert.deepEqual(saturateBridgeColor([255,255,255]),[255,255,255]);
 const rgb=saturateBridgeColor([10,100,240]);assert.equal(Math.max(...rgb),240);assert.equal(Math.min(...rgb),0);
});

function canvasFixture(t){
 const canvases=[];
 const document={createElement(){
  const canvas={width:1,height:1},calls=[],stack=[];
  const ctx={globalAlpha:1,globalCompositeOperation:'source-over',
   save(){stack.push([this.globalAlpha,this.globalCompositeOperation]);},
   restore(){[this.globalAlpha,this.globalCompositeOperation]=stack.pop();},
   translate(){},scale(){},beginPath(){this.rings=0;},moveTo(){this.rings++;},lineTo(){},closePath(){},
   fill(rule){calls.push(['fill',this.globalCompositeOperation,rule,this.rings]);},fillRect(){calls.push(['rect',this.globalCompositeOperation]);},
   drawImage(source){calls.push(['image',this.globalCompositeOperation,source]);},
   createRadialGradient(){return {addColorStop(){}};},createLinearGradient(){return {addColorStop(){}};},
  };
  canvas.getContext=()=>ctx;canvas.calls=calls;canvases.push(canvas);return canvas;
 }};
 const previous=globalThis.document;globalThis.document=document;t.after(()=>{globalThis.document=previous;});
 return canvases;
}

const water=[{geometry:{type:'Polygon',coordinates:[
 [[-122.68,45.51],[-122.66,45.51],[-122.66,45.53],[-122.68,45.53],[-122.68,45.51]],
 [[-122.671,45.519],[-122.670,45.519],[-122.670,45.520],[-122.671,45.520],[-122.671,45.519]],
]}}];

test('reflection texture clips water and islands, and every vertex stays at water level',t=>{
 const canvases=canvasFixture(t),layer=createBridgeWaterLayer({MercatorCoordinate},()=>3);
 const spans=bridgeGlowSpans([{id:'broadway',fit:fixture()}]);layer.update(spans,water);
 const heights=[];for(let i=2;i<layer.vertices.length;i+=5)heights.push(layer.vertices[i]);
 assert.equal(heights.length,6);assert.ok(heights.every(z=>Math.abs(z-3.1)<.002));
 assert.ok(canvases.some(c=>c.calls.some(call=>call[0]==='fill'&&call[2]==='evenodd'&&call[3]===2)),'island hole belongs to the water mask');
 const painted=canvases.find(c=>c.calls.some(call=>call[0]==='rect'&&call[1]==='source-in'));
 assert.equal(painted.calls.at(-1)[1],'destination-in','only the water portion of the gradient survives');
 assert.ok(canvases[0].width*canvases[0].height*4<2*1024*1024,'shared atlas stays below 2MB');
 const patch=bridgeWaterPatch(spans[0],([x,y])=>({x,y}),()=>4);
 assert.ok(patch.corners.every(p=>p.z===4.1),'bridge deck height never becomes reflection height');
});

function mockGl(){
 const gl={},calls={uploads:0,textures:0,matrices:[],draws:[],depth:[],shaders:[]};
 for(const name of ['ARRAY_BUFFER','STATIC_DRAW','DEPTH_WRITEMASK','CULL_FACE','TRIANGLES','ACTIVE_TEXTURE','TEXTURE0','TEXTURE_BINDING_2D','TEXTURE_2D','UNPACK_PREMULTIPLY_ALPHA_WEBGL','UNPACK_FLIP_Y_WEBGL','RGBA','UNSIGNED_BYTE','TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER','LINEAR','TEXTURE_WRAP_S','TEXTURE_WRAP_T','CLAMP_TO_EDGE','VERTEX_SHADER','FRAGMENT_SHADER','COMPILE_STATUS','LINK_STATUS','FLOAT'])gl[name]=name;
 for(const name of ['bindBuffer','useProgram','bindVertexArray','uniform1i','disable','enable','activeTexture','bindTexture','pixelStorei','texParameteri','deleteBuffer','deleteVertexArray','deleteTexture','deleteProgram','compileShader','attachShader','linkProgram','deleteShader','enableVertexAttribArray','vertexAttribPointer'])gl[name]=()=>{};
 for(const name of ['createShader','createProgram','createBuffer','createVertexArray','createTexture'])gl[name]=()=>({});
 gl.shaderSource=(_,source)=>calls.shaders.push(source);gl.getShaderParameter=gl.getProgramParameter=()=>true;gl.getUniformLocation=(_,name)=>name;gl.getAttribLocation=()=>0;
 gl.bufferData=()=>calls.uploads++;gl.texImage2D=()=>calls.textures++;
 gl.uniformMatrix4fv=(_location,_transpose,matrix)=>calls.matrices.push(matrix.slice());
 gl.getParameter=name=>name===gl.DEPTH_WRITEMASK;gl.isEnabled=()=>true;gl.depthMask=value=>calls.depth.push(value);
 gl.drawArrays=(mode,first,count)=>calls.draws.push({mode,count});
 return {gl,calls};
}

test('camera changes only the shared map matrix, never the reflection coordinates or textures',t=>{
 canvasFixture(t);const layer=createBridgeWaterLayer({MercatorCoordinate},()=>0),{gl,calls}=mockGl();
 layer.onAdd({triggerRepaint(){}},gl);
 const spans=bridgeGlowSpans([{id:'broadway',fit:fixture()}]);layer.update(spans,water);const vertices=layer.vertices.slice();
 const camera=(scale,angle=0,pan=0)=>({defaultProjectionData:{mainMatrix:[scale*Math.cos(angle),scale*Math.sin(angle),0,0,-scale*Math.sin(angle),scale*Math.cos(angle),0,0,0,0,scale,0,pan,-pan,0,1]}});
 layer.render(gl,camera(4096));layer.update(spans,water);layer.render(gl,camera(1024,.5,2));
 assert.deepEqual(layer.vertices,vertices);assert.equal(calls.uploads,1);assert.equal(calls.textures,1);
 assert.equal(calls.draws.length,2);assert.ok(calls.draws.every(d=>d.count===6));
 assert.notDeepEqual(calls.matrices[0],calls.matrices[1]);assert.deepEqual(calls.depth,[false,true,false,true]);
 assert.ok(calls.shaders.every(s=>s.includes('#version 300 es')));
 assert.ok(calls.shaders.some(s=>s.includes('glow.rgb*alpha*1.30')));
 layer.update([],[]);layer.render(gl,camera(1024));assert.equal(layer.count,0,'removed bridges leave no stale reflection');
 layer.onRemove({},gl);assert.equal(layer.count,0);assert.equal(layer.vertices,null);
});

test('water polygons project once across bridges and stay cached for repeated updates',t=>{
 canvasFixture(t);let projections=0;
 const counted={MercatorCoordinate:{fromLngLat(coordinate){projections++;return MercatorCoordinate.fromLngLat(coordinate);}}};
 const layer=createBridgeWaterLayer(counted),fit=fixture();
 const spans=bridgeGlowSpans(['broadway','burnside','morrison'].map(id=>({id,fit})));
 const ring=Array.from({length:1001},(_,i)=>{const a=i/1000*Math.PI*2;return [center[0]+.01*Math.cos(a),center[1]+.01*Math.sin(a)];});
 const polygon={geometry:{type:'Polygon',coordinates:[ring]}};
 projections=0;layer.update(spans,[polygon,polygon]);const first=projections;
 projections=0;layer.update(spans,[polygon]);const repeated=projections;
 assert.equal(first-repeated,ring.length,'duplicates and additional bridges must not repeat geographic water projection');
 assert.ok(repeated<100,'unchanged updates only project the small bridge footprints');
});

test('water reflections render underneath both bridge decks and models',async()=>{
 const source=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
 const layers=['water','buildings','skyline'],context={map:{addLayer(layer,before){layers.splice(layers.indexOf(before),0,layer.id);}},
  ambientSignals:{install(){}},groundLightPools:{id:'pools'},bridgeLayer:{id:'bridge-decks'},bridgeWater:{id:'bridge-water-reflections'},portlandBridges:{id:'models'},landmarkBuildings:{id:'landmarks'},portlandLandmarks:{id:'icons'},citySparkles:{id:'sparkles'}};
 vm.runInNewContext(source.slice(source.indexOf('function installSceneExtras('),source.indexOf("map.on('load'"))+';installSceneExtras();',context);
 assert.ok(layers.indexOf('water')<layers.indexOf('bridge-water-reflections'));
 assert.ok(layers.indexOf('bridge-water-reflections')<layers.indexOf('bridge-decks'));
 assert.ok(layers.indexOf('bridge-water-reflections')<layers.indexOf('models'));
 assert.doesNotMatch(source,/surfaces\.bridgeGlow/,'reflection is no longer painted on the screen overlay');
});
