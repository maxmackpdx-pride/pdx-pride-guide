import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mapzSurfaceStyle,forestPattern,FOREST_COLORS,WOOD_FILL,GRASS_FILL,PARK_FILL,NIGHT_EARTH,BUILDING_FILL,BUILDING_OUTLINE,BUILDING_SOLIDITY,BUILDING_LIGHT_OCCLUSION,applyBuildingOcclusion,inwardDistances} from '../client/public/zaydar-map/natural-surfaces.js';
import {vectorStyle} from '../client/public/home-flight/city-map.js';
import {CITY_SPARKLE_MAX_ZOOM,intersectionLightPools,roofSparkles,streetSparkles} from '../client/public/home-flight/roof-sparkles.js';
import {nextFlightPitchOffset,IOS_MAP_HANDLERS,trackpadGesture,trackpadPanDelta} from '../client/public/zaydar-map/map-exploration.js';
const require=createRequire(import.meta.url),mapRequire=createRequire(require.resolve('maplibre-gl'));
const {validateStyleMin}=mapRequire('@maplibre/maplibre-gl-style-spec');
test('hillshade and contours validate without deforming the vector city',()=>{
 const before=JSON.stringify(vectorStyle),style=mapzSurfaceStyle({demTiles:['dem://tiles'],contourTiles:['contour://tiles']});
 assert.deepEqual(validateStyleMin(style).map(e=>e.message),[]);
 assert.equal(style.sources.elevation.encoding,'terrarium');
 assert.equal(style.terrain,undefined);
 assert.equal(style.layers.find(l=>l.id==='land-relief').type,'hillshade');
 assert.equal(style.layers.find(l=>l.id==='elevation-contours').type,'line');
 const skyline=style.layers.find(l=>l.id==='skyline');
 assert.equal(skyline.paint['fill-extrusion-color'],BUILDING_FILL);
 assert.equal(style.layers.find(l=>l.id==='buildings').paint['line-color'],BUILDING_OUTLINE);
 assert.equal(BUILDING_SOLIDITY,.98);
 assert.equal(BUILDING_LIGHT_OCCLUSION,.98);
 assert.equal(skyline.paint['fill-extrusion-opacity'],.98);
 assert.ok(style.layers.findIndex(l=>l.id==='buildings')<style.layers.findIndex(l=>l.id==='skyline'));
 assert.equal(JSON.stringify(vectorStyle),before);
});

test('buildings retain only two percent transparency to map and overlay light',()=>{
 const calls=[],ctx={save(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(rule){calls.push([this.globalCompositeOperation,this.globalAlpha,rule]);},restore(){}};
 const target={getZoom:()=>16,getPitch:()=>48,project:([x,y])=>({x,y})};
 applyBuildingOcclusion(ctx,target,[{height:12,center:[0,45],ring:[[0,0],[10,0],[10,10],[0,10]]}]);
 assert.deepEqual(calls,[['destination-out',.98,'evenodd']]);
});

test('wheel pitch control accumulates smoothly and clamps twenty degrees each way',()=>{
 assert.equal(nextFlightPitchOffset(0,120),3);
 assert.equal(nextFlightPitchOffset(0,-120),-3);
 assert.equal(nextFlightPitchOffset(19,120),20);
 assert.equal(nextFlightPitchOffset(-19,-120),-20);
 assert.equal(nextFlightPitchOffset(4,0),4);
 assert.ok(IOS_MAP_HANDLERS.includes('dragPan'));
 assert.ok(IOS_MAP_HANDLERS.includes('touchZoomRotate'));
 assert.ok(IOS_MAP_HANDLERS.includes('touchPitch'));
});
test('Mac trackpad gestures pan normally and preserve pinch zoom',()=>{
 assert.equal(trackpadGesture({ctrlKey:false,deltaX:12,deltaY:-8}),'pan');
 assert.equal(trackpadGesture({ctrlKey:true,deltaX:0,deltaY:-8}),'zoom');
 assert.equal(trackpadGesture({ctrlKey:false,deltaX:0,deltaY:0}),'none');
 assert.equal(trackpadPanDelta(2,1),32);
 assert.equal(trackpadPanDelta(2,2),240);
});
test('overview glitter follows building density with only two to four percent blooms',()=>{
 const buildings=Array.from({length:2000},(_,i)=>{
  const x=-123+(i%100)*.0001,y=45+Math.floor(i/100)*.0001;
  return {height:9,ring:[[x,y],[x+.00004,y],[x+.00004,y+.00004],[x,y+.00004],[x,y]]};
 });
 const points=roofSparkles(buildings,2000,{sampleModulo:1,lightsPerRoof:1,bloomPercent:3,distribute:true});
 const bloomRate=points.filter(point=>point.star).length/points.length;
 assert.equal(points.length,2000);
 assert.ok(bloomRate>=.02&&bloomRate<=.04);
 assert.deepEqual(points,roofSparkles(buildings,2000,{sampleModulo:1,lightsPerRoof:1,bloomPercent:3,distribute:true}));
});
test('street-density glitter remains available when low-zoom tiles omit buildings',()=>{
 const features=Array.from({length:2000},(_,i)=>({properties:{class:'minor'},geometry:{type:'LineString',coordinates:[[-123+(i%100)*.001,45+Math.floor(i/100)*.001],[-122.9995+(i%100)*.001,45.0005+Math.floor(i/100)*.001]]}}));
 const points=streetSparkles(features,2000,{sampleModulo:1,bloomPercent:3});
 const bloomRate=points.filter(point=>point.star).length/points.length;
 assert.equal(points.length,2000);
 assert.ok(bloomRate>=.02&&bloomRate<=.04);
 assert.equal(streetSparkles([{properties:{class:'motorway'},geometry:features[0].geometry}],10).length,0);
});
test('city glitter remains active four zoom levels beyond the 3D building entrance',()=>{
 assert.equal(vectorStyle.layers.find(layer=>layer.id==='skyline').minzoom,12);
 assert.equal(CITY_SPARKLE_MAX_ZOOM,16);
});
test('intersection light pools favor connected street nodes',()=>{
 const features=[
  {properties:{class:'minor'},geometry:{type:'LineString',coordinates:[[0,0],[1,1]]}},
  {properties:{class:'secondary'},geometry:{type:'LineString',coordinates:[[1,1],[2,1]]}},
  {properties:{class:'minor'},geometry:{type:'LineString',coordinates:[[1,1],[1,2]]}},
  {properties:{class:'rail'},geometry:{type:'LineString',coordinates:[[1,1],[3,3]]}},
 ];
 const pools=intersectionLightPools(features,10);
 assert.deepEqual(pools[0].coordinates,[1,1]);
 assert.equal(pools[0].count,3);
});
test('legacy forest texture stays deterministic while live green fills remain quiet',()=>{
 const image=forestPattern(),colors=new Set();
 for(let i=0;i<image.data.length;i+=4){colors.add('#'+[...image.data.slice(i,i+3)].map(c=>c.toString(16).padStart(2,'0')).join(''));assert.equal(image.data[i+3],255);}
 assert.deepEqual([...colors].sort(),[...FOREST_COLORS].sort());
 assert.deepEqual(image.data,forestPattern().data);
 assert.equal(image.width,48);
 const style=mapzSurfaceStyle(),layer=id=>style.layers.find(l=>l.id===id),opacity=['interpolate',['linear'],['zoom'],10,.55,14,.72,18,.85];
 assert.equal(layer('forest-landcover').paint['fill-color'],WOOD_FILL);
 assert.equal(layer('leaf-landcover').paint['fill-color'],GRASS_FILL);
 assert.equal(layer('park-areas').paint['fill-color'],PARK_FILL);
 assert.deepEqual(layer('forest-landcover').paint['fill-opacity'],opacity);
 assert.deepEqual(layer('leaf-landcover').paint['fill-opacity'].slice(-4),[16.5,.2,17,0]);
 assert.deepEqual(layer('park-areas').paint['fill-opacity'].slice(-4),[16.5,.2,17,0]);
});

test('roads have a legible hierarchy with dark casings and brighter major routes',()=>{
 const style=mapzSurfaceStyle(),layer=id=>style.layers.find(l=>l.id===id);
 assert.equal(layer('street-casings').paint['line-color'],'#070a0b');
 assert.equal(layer('streets').paint['line-color'][2],'motorway');
 assert.equal(layer('streets').paint['line-color'][3],'#3c5565');
 assert.equal(layer('streets').paint['line-opacity'][3],.97);
 assert.equal(layer('streets').layout['line-cap'],'round');
 assert.equal(layer('highway-edge-light').paint['line-color'],'#7993a1');
 assert.ok(style.layers.indexOf(layer('highway-edge-light'))>style.layers.indexOf(layer('streets')));
});
test('developed land uses layered night earth tones around buildings',()=>{
 const style=mapzSurfaceStyle(),layer=id=>style.layers.find(l=>l.id===id);
 assert.equal(layer('ground').paint['background-color'],NIGHT_EARTH);
 assert.ok(!layer('developed-earth').filter[2][1].includes('residential'));
 assert.deepEqual(layer('developed-earth').paint['fill-opacity'].slice(-4),[14,.56,18,.66]);
});
test('water glow stays inside water and decays from shore toward the center',()=>{
 const size=11,mask=new Uint8Array(size*size);
 for(let y=1;y<10;y++)for(let x=1;x<10;x++)mask[y*size+x]=1;
 const d=inwardDistances(mask,size,size);
 assert.equal(d[0],0);assert.equal(d[5*size+1],1);assert.equal(d[5*size+5],5);
 const alpha=i=>mask[i]?Math.exp(-d[i]/4):0;
 assert.equal(alpha(0),0);assert.ok(alpha(5*size+1)>alpha(5*size+5));
 // An island is land: no glow inside it, with an inward water edge beside it.
 mask[5*size+5]=0;const island=inwardDistances(mask,size,size);
 assert.equal(island[5*size+5],0);assert.equal(island[5*size+4],1);
});

test('ground and water are opaque with the moonlit mineral shoreline color',()=>{
 const style=mapzSurfaceStyle(),layer=id=>style.layers.find(l=>l.id===id);
 assert.equal(style.layers[0].id,'ground');
 assert.equal(layer('ground').paint['background-opacity'],1);
 assert.equal(layer('water').paint['fill-opacity'],1);
 assert.equal(layer('banks').paint['line-color'],'#389187');
 assert.deepEqual(layer('water').paint['fill-color'].slice(-4),[14,'#06171d',18,'#08222a']);
 assert.equal(layer('water-bloom-wide'),undefined);
 assert.equal(layer('water-bloom-tight'),undefined);
 assert.deepEqual(layer('banks').paint['line-opacity'],['interpolate',['linear'],['zoom'],10,.2,15,.32,18,.26]);
 assert.deepEqual(layer('streams').filter,['in',['get','class'],['literal',['stream','ditch','drain']]]);
 assert.deepEqual(layer('streets').filter.slice(-2),[
  ['!=',['get','brunnel'],'tunnel'],['>=',['coalesce',['get','layer'],0],0]
 ]);
});
