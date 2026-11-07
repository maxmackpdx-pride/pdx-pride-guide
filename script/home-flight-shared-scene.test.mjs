/** Independent homepage/shared-scene tests retained when retired map apps are removed.
 * Five-mode rendering lives in zaylist-maps; native host contracts in map-release. */
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {vectorStyle} from '../client/public/home-flight/city-map.js';
import {mapzSurfaceStyle} from '../client/public/mapz-map/natural-surfaces.js';
import {waterReflectionSegments,createBuildingChrome} from '../client/public/mapz-map/nightlife-materials.js';
import {createTerrainSampler,approachBaseline} from '../client/public/mapz-map/terrain-elevation.js';
const require=createRequire(import.meta.url),maplibreRequire=createRequire(require.resolve('maplibre-gl'));
const {validateStyleMin}=maplibreRequire('@maplibre/maplibre-gl-style-spec');
const getStyle=()=>structuredClone(vectorStyle);
const previousWindow=globalThis.window;globalThis.window={};
after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
test('home map retains vector buildings without added terrain or backgrounds',()=>{
 const style=getStyle();
 assert.deepEqual(Object.keys(style.sources),['terrain']);
 assert.equal(style.sources.terrain.url,'https://tiles.openfreemap.org/planet');
 assert.deepEqual(style.layers.map(l=>l.id),['water','banks','streams','streets','skyline','buildings']);
 assert.equal(style.light.color,'#c7d9ed');
});

test('home flyover uses the Mapz surface materials without replacing its hologram system',async()=>{
 const homeRenderer=await readFile(new URL('../client/public/home-flight/river-flight.js',import.meta.url),'utf8');
 const homeHtml=await readFile(new URL('../client/public/home-flight/index.html',import.meta.url),'utf8');
 assert.match(homeRenderer,/mapzSurfaceStyle\(\{/);
 assert.match(homeRenderer,/createWaterBloom/);
 assert.match(homeRenderer,/createBuildingChrome/);
 assert.match(homeRenderer,/style:surfaceStyle/);
 assert.match(homeRenderer,/createHologramMaterials\(\[\.\.\.dayColors,adultVenueColor\]\)/);
 assert.match(homeRenderer,/flightCamera\(t\)/);
 assert.match(homeHtml,/maplibre-contour-0\.1\.0\.js/);
 assert.match(homeHtml,/Mapterhorn/);
});

test('MapLibre accepts every base-city paint expression',()=>{
 assert.deepEqual(validateStyleMin(getStyle()).map(error=>error.message),[]);
});

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


test('Vite preserves homepage fingerprinting without rebuilding retired map apps',()=>{
 const source=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8');
 assert.match(source,/hashFlight\(flightSource\)/);assert.match(source,/fs\.cpSync\(flightSource/);assert.match(source,/home-flight-manifest\.json/);assert.match(source,/__HOME_FLIGHT_BASE__/);
 assert.doesNotMatch(source,/prepareMapz|prepareOutzide|mapz-build|__MAPZ_ASSETS__|__OUTZIDE_ASSETS__|mapz\?\.write|outzide\?\.write/);
});
test('shared terrain scales once, retains known heights and bounds its cache',()=>{
 let reads=0,raw=200;const terrain=createTerrainSampler(()=>{reads++;return raw;},{capacity:2});
 for(let frame=0;frame<1800;frame++)assert.equal(terrain.sample([-122.7,45.5]).height,100);assert.equal(reads,1);
 raw=null;terrain.invalidate();assert.equal(terrain.sample([-122.7,45.5]).height,100);terrain.sample([0,0]);terrain.sample([1,0]);assert.equal(terrain.size,2);
 assert.equal(approachBaseline(10,30,0),10);assert.equal(approachBaseline(10,30,1),30);assert.equal(approachBaseline(10,30,.5),20);
});
