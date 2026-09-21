import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {mapzSurfaceStyle} from '../client/public/zaydar-map/natural-surfaces.js';
import {waterReflectionSegments,createBuildingChrome} from '../client/public/zaydar-map/nightlife-materials.js';

test('street inlays stay on major surface roads, below buildings, without recoloring bridges',()=>{
  const require=createRequire(import.meta.url),mr=createRequire(require.resolve('maplibre-gl'));
  const {createExpression}=mr('@maplibre/maplibre-gl-style-spec');
  const style=mapzSurfaceStyle(),inlay=style.layers.find(l=>l.id==='night-street-inlays');
  const compiled=createExpression(inlay.filter);assert.equal(compiled.result,'success');
  const accepts=properties=>compiled.value.evaluate({zoom:16},{type:2,properties});
  assert.equal(accepts({class:'primary'}),true);assert.equal(accepts({class:'secondary'}),true);
  for(const properties of [{class:'minor'},{class:'path'},{class:'rail'},{class:'primary',brunnel:'bridge'},
    {class:'primary',brunnel:'tunnel'},{class:'primary',layer:-1}])assert.equal(accepts(properties),false);
  assert.ok(style.layers.indexOf(inlay)<style.layers.findIndex(l=>l.id==='skyline'));
});

test('water streaks are short, fragmented, and fixed to their geographic source',()=>{
  const anchor=[-122.675,45.52],segments=waterReflectionSegments(anchor);
  assert.deepEqual(waterReflectionSegments([...anchor]),segments);assert.equal(segments.length,6);
  const southOffsets=segments.map(s=>(anchor[1]-s.a[1])*111320);
  assert.ok(southOffsets.every((v,i)=>v>=16&&v<64&&(i===0||v-southOffsets[i-1]>=5)));
  for(const s of segments){
    const width=(s.b[0]-s.a[0])*111320*Math.cos(anchor[1]*Math.PI/180);
    assert.ok(width>=3.99&&width<=12.01);assert.equal(s.a[1],s.b[1]);assert.ok(s.group>=0&&s.group<9);
  }
});

test('chrome reuses wall paths at rest and rebuilds only when the camera changes',()=>{
  const OriginalPath=globalThis.Path2D;let paths=0,projections=0;
  globalThis.Path2D=class{constructor(){paths++;}moveTo(){}lineTo(){}closePath(){}};
  try{
    let bearing=0;
    const map={getCenter:()=>({lng:0,lat:45}),getZoom:()=>16,getPitch:()=>48,getBearing:()=>bearing,
      project:([x,y])=>{projections++;return {x:x*1000,y:-y*1000};}};
    const buildings=[{center:[0,45],height:45,ring:[[0,45],[.01,45],[.01,45.01],[0,45.01]]}];
    const alphas=[],ctx={canvas:{width:900,height:1200},save(){},restore(){},fill(){alphas.push(this.globalAlpha);}};
    const chrome=createBuildingChrome();chrome.draw(ctx,map,buildings,1);
    const first={paths,projections};
    for(let i=0;i<100;i++)chrome.draw(ctx,map,buildings,1);
    assert.deepEqual({paths,projections},first);
    assert.ok(alphas.every(a=>a>=0&&a<=.12));
    bearing=30;chrome.draw(ctx,map,buildings,1);assert.ok(paths>first.paths&&projections>first.projections);
  }finally{globalThis.Path2D=OriginalPath;}
});

test('actual hologram draw paints sky artwork after building occlusion',async()=>{
  const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  const source=renderer.slice(renderer.indexOf('function drawLights('),renderer.indexOf('// Gentle corridor:'));
  const operations=[],noop=()=>{},window={innerWidth:900,innerHeight:1200};
  const ctx=new Proxy({drawImage(image){operations.push(image);},createLinearGradient:()=>({addColorStop:noop}),
    createRadialGradient:()=>({addColorStop:noop})},{get:(target,key)=>key in target?target[key]:noop});
  const surface={width:900,height:1200,getContext:()=>ctx},map={getZoom:()=>15.5,project:()=>({x:450,y:700})};
  const color='#FF00CC',feature={geometry:{coordinates:[-122.675,45.52]},properties:{key:'demo',kind:'event',demoOpen:true,logo:'logo',phase:1,color,heightScale:1}};
  const logo={width:120,height:60,padding:1,outlined:'sky-logo',image:'artwork',silhouette:'mask'};
  const context=vm.createContext({window,parent:window,map,lights:surface,devicePixelRatio:1,Intl,Date,Map,Set,Math,
    hitTargets:[],viewTime:Date.now(),selectedKey:null,reduced:{matches:true},userLocation:null,lightFeatures:[feature],
    updateSurfaces:()=>({buildings:[{}],reflections:[]}),waterBloom:{draw:noop},drawUserLocationGlow:noop,
    citySparkles:{update:noop},buildingGlitter:()=>[],opacityControl:{value:1},motionDelta:1/30,pulseTime:1,
    hologramLiftScale:.7,hologramArtworkScale:3.15,hologramLayouts:new WeakMap(),hologramLabelWidth:68.4,
    smoothRange:(a,b,v)=>Math.max(0,Math.min(1,(v-a)/(b-a))),
    clusterPlaceMarkers:()=>({byKey:new Map()}),roofLift:()=>15,
    hologramBounds:()=>({halfWidth:60,halfHeight:80}),settleValue:(object,key,_velocity,goal)=>{object[key]=goal;},
    logoPointerOffset:()=>({x:0,y:0}),separateHolograms:noop,
    venueLogos:new Map([['logo',logo]]),logoFocus:{update:noop,active:new Map()},logoFit:()=>.2,logoMotionSeed:0,
    adultVenueColor:'#FF0000',hologramMaterials:{beams:new Map([[color,{}]])},drawProjectionBeam:()=>operations.push('beam'),
    applyBuildingOcclusion:()=>operations.push('building-mask'),buildingChrome:{draw:()=>operations.push('chrome')},
    drawSurfaceReflections:()=>operations.push('building-reflections'),drawUserLocationAvatar:noop,tell:noop,
  });
  vm.runInContext(source,context);vm.runInContext('drawLights(1)',context);
  assert.deepEqual(operations,['beam','building-mask','chrome','building-reflections','sky-logo']);
});
