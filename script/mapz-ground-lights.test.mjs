import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {intersectionLightPools,roofSparkles,streetSparkles,whiteSparkles,CITY_SPARKLE_MAX_ZOOM} from '../client/public/home-flight/roof-sparkles.js';
import {groundLightMesh,createGroundLightPools} from '../client/public/zaydar-map/ground-light-pools.js';
import {standaloneDemoRows} from '../client/public/zaydar-map/standalone-demo.js';
import {createCitySparkles} from '../client/public/home-flight/city-sparkles.js';
import {DAY_LIST} from '../client/public/zaydar-map/radix-map.js';
import {contourSignalOpacity,corridorGradient,selectSignalCorridors} from '../client/public/zaydar-map/ambient-signals.js';

const road=(coordinates,properties={})=>({geometry:{type:'LineString',coordinates},properties:{class:'minor',...properties}});
const intersection=[
  road([[-122.676,45.521],[-122.675,45.521],[-122.674,45.521]]),
  road([[-122.675,45.520],[-122.675,45.521],[-122.675,45.522]]),
];
test('thirty percent of colored sparkles turn white across sparse and dense cells',()=>{
  const candidates=[];
  for(let x=0;x<8;x++)for(let y=0;y<8;y++){
    for(let i=0;i<(x<4?20:2);i++){
      const point={coordinates:[-122.67+(x+.2+i*.025)*160/(111320*Math.cos(45.53*Math.PI/180)),45.53+(y+.4)*160/111320],
        height:9,phase:i,rate:1,star:false};
      candidates.push(point);
    }
  }
  const converted=whiteSparkles(candidates,30);
  assert.equal(converted.length,candidates.length);
  assert.equal(converted.filter(point=>point.white).length,Math.round(candidates.length*.3));
  const selected=converted.filter(point=>point.white).map(point=>point.coordinates.join(',')).sort();
  const reversed=whiteSparkles([...candidates].reverse(),30).filter(point=>point.white).map(point=>point.coordinates.join(',')).sort();
  assert.deepEqual(reversed,selected);
  const whiteCells=new Set(converted.filter(point=>point.white).map(point=>Math.floor((point.coordinates[1]-45.53)*111320/160)));
  assert.ok(whiteCells.size>=7);
});
test('white sparkle vertices append to the same batch without changing colored lights',()=>{
  const require=createRequire(import.meta.url),{MercatorCoordinate}=require('maplibre-gl');
  const layer=createCitySparkles({MercatorCoordinate},()=>0,{palette:DAY_LIST});
  const colored={coordinates:[-122.67,45.53],height:12,phase:3,rate:.8,star:true};
  layer.update([colored],0,false);const original=layer.vertices.slice();
  layer.update([colored,{...colored,coordinates:[-122.671,45.531],white:true,star:false}],1,false);
  assert.deepEqual(layer.vertices.slice(0,6),original);assert.equal(layer.vertices.length,12);
  assert.equal(layer.vertices[5],1);assert.equal(layer.vertices[11],2);
});
test('intersection anchors and materials survive reordered, reversed and duplicated tiles',()=>{
  const pools=intersectionLightPools(intersection);
  assert.equal(pools.length,1);assert.equal(pools[0].count,4);
  const reversed=intersection.map(f=>road([...f.geometry.coordinates].reverse()));
  assert.deepEqual(intersectionLightPools([...reversed,...intersection,...intersection]),pools);
  assert.deepEqual(pools[0].coordinates,[-122.675,45.521]);
  const bend=road([[-122.68,45.52],[-122.67,45.52],[-122.67,45.53]]);
  assert.equal(intersectionLightPools([bend,bend,bend]).length,0);
});
test('ground lights exclude elevated roads, tunnels and highway ramps',()=>{
  for(const properties of [{brunnel:'bridge'},{brunnel:'tunnel'},{layer:1},{layer:-1},{class:'motorway'},{class:'trunk'}]){
    assert.equal(intersectionLightPools(intersection.map(f=>road(f.geometry.coordinates,properties))).length,0);
  }
});
test('ambient signals stay sparse, geographic and restrained',()=>{
  const roads=Array.from({length:12},(_,index)=>road([
    [-122.70+index*.002,45.50],[-122.69+index*.002,45.54],
  ],{class:index%3===0?'motorway':index%3===1?'trunk':'primary',brunnel:index===0?'bridge':undefined}));
  const selected=selectSignalCorridors([...roads,...roads],6);
  assert.equal(selected.length,6);
  assert.ok(selected.some(feature=>feature.properties.bridge));
  assert.ok(selected.every(feature=>feature.geometry.type==='LineString'));
  assert.ok(contourSignalOpacity(4,0,13,false)<=.033);
  assert.equal(contourSignalOpacity(4,0,16,false),0);
  assert.equal(contourSignalOpacity(4,0,13,true),contourSignalOpacity(400,0,13,true));
  const gradient=corridorGradient(.5,false,.85);
  const stops=gradient.slice(3).filter((_,index)=>index%2===0);
  assert.ok(stops.every((stop,index)=>index===0||stop>stops[index-1]));
});
test('pool geometry stays flat and measured in ground meters',()=>{
  const pool={coordinates:[100,200],radiusMeters:18,angle:0};
  const mesh=groundLightMesh([pool],([x,y])=>({x,y}));
  const vertices=Array.from({length:6},(_,i)=>Array.from(mesh.slice(i*5,i*5+5)));
  assert.equal(Math.min(...vertices.map(v=>v[0])),82);
  assert.equal(Math.max(...vertices.map(v=>v[0])),118);
  assert.equal(Math.min(...vertices.map(v=>v[1])),182);
  assert.equal(Math.max(...vertices.map(v=>v[1])),218);
  assert.ok(vertices.every(v=>Math.abs(v[2]-.06)<1e-6));
  assert.deepEqual(vertices.map(v=>v.slice(3)),[[-1,-1],[1,-1],[-1,1],[-1,1],[1,-1],[1,1]]);
});
test('zoom changes only the pool projection; geometry stays anchored and never writes depth',()=>{
  const require=createRequire(import.meta.url),{MercatorCoordinate}=require('maplibre-gl');
  const layer=createGroundLightPools({MercatorCoordinate});
  const pools=intersectionLightPools(intersection);layer.update(pools);
  let uploads=0;const matrices=[],masks=[];
  const gl={ARRAY_BUFFER:1,STATIC_DRAW:2,DEPTH_WRITEMASK:3,CULL_FACE:4,TRIANGLES:5,
    bindBuffer(){},bufferData(){uploads++;},useProgram(){},bindVertexArray(){},
    uniformMatrix4fv(_location,_transpose,matrix){matrices.push(matrix);},
    getParameter(){return true;},isEnabled(){return true;},depthMask(value){masks.push(value);},disable(){},enable(){},
    drawArrays(mode,first,count){assert.equal(mode,5);assert.equal(count,6);},
  };
  const position=MercatorCoordinate.fromLngLat(pools[0].coordinates);
  const camera=scale=>({defaultProjectionData:{mainMatrix:[scale,0,0,0,0,scale,0,0,0,0,1,0,-position.x*scale,-position.y*scale,0,1]}});
  layer.render(gl,camera(4096));layer.update(intersectionLightPools([...intersection].reverse()));layer.render(gl,camera(1024));
  assert.equal(uploads,1);assert.deepEqual(masks,[false,true,false,true]);
  assert.ok(Math.abs(matrices[0][0]/matrices[1][0]-4)<1e-6);
  assert.ok(Math.abs(matrices[0][12]/matrices[1][12]-4)<1e-6);
});
test('sparse building tiles keep street sparkles at overview zooms through sixteen',async()=>{
  const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  const roads=Array.from({length:100},(_,i)=>road([[-122.675+i*.0001,45.52],[-122.675+i*.0001,45.522]]));
  const target={getCenter:()=>({lng:0,lat:45}),getBearing:()=>0,getLayer:()=>true,querySourceFeatures:(_source,{sourceLayer})=>sourceLayer==='building'?[]:roads,getZoom:()=>14,getPitch:()=>48};
  const context=vm.createContext({Map,Set,WeakMap,performance,window:{innerWidth:900,innerHeight:1200},matchMedia:()=>({matches:false}),
    lastExplorationMove:-Infinity,elevationDirty:false,surfaceRevision:0,waterBloom:{invalidate(){}},surfaceCache:new WeakMap(),glitterCache:new WeakMap(),bridgeLayer:{update(){}},portlandBridges:{update(){},models:[]},landmarkBuildings:{update(features){this.features=features},surfaceFeatures(){return this.features}},groundLightPools:{update(){}},ambientSignals:{update(){}},lightFeatures:[],
    PORTLAND_BRIDGE_MODELS:[],bridgeGlowSpans:()=>[],terrainHeight:()=>0,bridgeWater:{update(){}},naturalWater:[],
    createSpatialIndex:()=>()=>[],intersectionLightPools,roofSparkles,streetSparkles,whiteSparkles,CITY_SPARKLE_MAX_ZOOM,target,
  });
  vm.runInContext(renderer.slice(renderer.indexOf('function updateSurfaces('),renderer.indexOf('function drawSurfaceReflections(')),context);
  vm.runInContext(renderer.slice(renderer.indexOf('function buildingGlitter('),renderer.indexOf('const logoFocus=')),context);
  for(const zoom of [10,12,14,16]){
    target.getZoom=()=>zoom;
    const points=vm.runInContext('buildingGlitter(target,updateSurfaces(target))',context);
    assert.ok(points.length>20,`street glitter at zoom ${zoom}`);
  }
});
test('standalone holograms use real directory anchors and local artwork without fake event dates',async()=>{
  const directory=JSON.parse(await readFile(new URL('../client/public/zaydar-map/waypoints.json',import.meta.url),'utf8'));
  const rows=standaloneDemoRows().filter(row=>row.kind==='event');assert.equal(rows.length,2);
  for(const row of rows){
    const venue=directory.find(v=>v.name.toLowerCase().startsWith(row.name.toLowerCase()));
    assert.deepEqual(row.coordinates,venue.coordinates);assert.equal(row.logo,venue.logo);assert.equal(row.demoOpen,true);
    assert.equal(row.startsAt,undefined);assert.equal(row.eventDay,undefined);
    await access(new URL(`../client/public/zaydar-map/${row.logo}`,import.meta.url));
  }
});
