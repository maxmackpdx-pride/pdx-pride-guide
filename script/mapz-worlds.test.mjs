import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {parseHousingHologramGlb,createWorldWaypointLayer} from '../client/public/zaydar-map/housing-holograms.js';

async function moduleFrom(path){
  const result=await build({entryPoints:[new URL(path,import.meta.url).pathname],bundle:true,write:false,platform:'node',format:'esm'});
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
const {locateWorldRow,filterWorldRows,legacyWorldMapHref,readMapCamera,inMapBounds}=await moduleFrom('../client/src/lib/mapWorlds.ts');
const {housingDisplayName}=await moduleFrom('../shared/housing.ts');
const places=[{id:1,name:'Test Venue',lat:45.52,lng:-122.67,neighborhood:'Pearl District'},{id:2,name:'Other Venue',lat:45.54,lng:-122.69,neighborhood:'Pearl District'}];

test('world locations prefer public venues and keep remote/private addresses off pins',()=>{
  const exact=locateWorldRow({id:3,venueHint:'Test Venue'},'mizzed',places,[]);
  assert.equal(exact.lat,45.52);
  const event=locateWorldRow({id:4,eventId:20,eventLat:45.51,eventLng:-122.66},'mizzed',places,[]);
  assert.equal(event.lat,45.51);
  const area=locateWorldRow({id:5,neighborhood:'Pearl',pickupPreference:'Private apartment address'},'giftz',places,[]);
  assert.equal(area.approximate,true);assert.match(area.locationLabel,/approximate/);assert.ok(Math.abs(area.lat-45.53)<1e-6);
  const missing=locateWorldRow({id:6,neighborhood:'Unknown',address:'Private address'},'sellz',places,[]);
  assert.equal(missing.lat,null);
  const remote=locateWorldRow({id:7,isRemote:true,lat:45.5,lng:-122.6},'gigz',places,[]);
  assert.equal(remote.lat,null);assert.equal(remote.locationLabel,'Remote');
});
test('world filters are independent and preserve owner, saved, and cluster selection',()=>{
  const rows=[{id:1,title:'Desk',priceCents:2000,isMine:true},{id:2,title:'Chair',priceCents:4000},{id:3,title:'Lamp',priceCents:11000}];
  const filters=new URLSearchParams('giftz.q=Lamp&sellz.price=UNDER25');
  assert.deepEqual(filterWorldRows(rows,'sellz',filters).map(r=>r.id),[1]);
  assert.deepEqual(filterWorldRows(rows,'sellz',new URLSearchParams('sellz.view=saved'),new Set([2])).map(r=>r.id),[2]);
  assert.deepEqual(filterWorldRows(rows,'sellz',new URLSearchParams('sellz.view=mine')).map(r=>r.id),[1]);
  assert.deepEqual(filterWorldRows(rows,'sellz',new URLSearchParams('sellz.ids=2,3')).map(r=>r.id),[2,3]);
  assert.equal(filterWorldRows([{id:8,postType:'GIFT',pickupPreference:'Open grab'}],'giftz',new URLSearchParams('giftz.type=GRAB')).length,1);
});
test('viewport containment and shared camera state handle invalid values',()=>{
  assert.equal(inMapBounds({lat:45.52,lng:-122.67},{south:45.51,north:45.53,west:-122.68,east:-122.66}),true);
  assert.equal(inMapBounds({lat:45.54,lng:-122.67},{south:45.51,north:45.53,west:-122.68,east:-122.66}),false);
  assert.equal(inMapBounds({lat:5,lng:-175},{south:0,north:10,west:170,east:-170}),true);
  assert.equal(readMapCamera(new URLSearchParams('lat=45.52&lng=-122.67&zoom=15')).zoom,15);
  for(const query of ['lat=&lng=&zoom=15','lat=100&lng=0&zoom=15','lat=45&lng=-122&zoom=99'])assert.equal(readMapCamera(new URLSearchParams(query)),null);
});
test('legacy bookmarks retain details, filters, compose and use map URLs',()=>{
  for(const [world,key] of [['places','place'],['mizzed','mizzed'],['gigz','gig'],['giftz','gift'],['sellz','sell']]){
    const url=new URL(legacyWorldMapHref(world,'?post=42&q=chair&view=MINE'), 'https://example.test');
    assert.equal(url.pathname,'/map');assert.equal(url.searchParams.get(key),'42');assert.equal(url.searchParams.get(`${world}.q`),'chair');assert.equal(url.searchParams.get(`${world}.view`),'mine');
    assert.equal(new URL(legacyWorldMapHref(world,'',undefined,'compose'),'https://example.test').searchParams.get('compose'),world);
  }
  assert.equal(new URL(legacyWorldMapHref('places','?type=bar','12'),'https://example.test').searchParams.get('place'),'12');
});
test('Haüz names normalize legacy suffixes without doubling them',()=>{
  for(const suffix of ['HAUS','HAUZ','HOUS','HOÜS','HAÜS','HAÜZ'])assert.equal(housingDisplayName('FORMING',`Test ${suffix}`),'Test HAÜZ');
});
test('all four waypoint meshes fit the GPU budget, retain normals and use no textures',async()=>{
  for(const id of ['mizzed','gigz','giftz','sellz']){
    const bytes=await readFile(new URL(`../client/public/zaydar-map/models/waypoints/${id}.glb`,import.meta.url));
    assert.ok(bytes.byteLength<300000,id);
    const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
    assert.equal(json.images?.length||0,0,id);
    const model=parseHousingHologramGlb(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),50);
    assert.ok(model.count/3<=6000,id);assert.ok(model.vertices.every(Number.isFinite),id);assert.ok(Math.abs(model.height-50)<.01,id);
  }
  const layer=createWorldWaypointLayer({},()=>0,{matches:true});
  layer.update([{key:'place',waypointFamily:'places',coordinates:[-122.67,45.52]},{key:'sell',waypointFamily:'sellz',coordinates:[-122.67,45.52]}]);
  assert.deepEqual(layer.instances.map(row=>row.key),['sell']);
  for(let i=0;i<48;i++)assert.equal(layer.setLayout(String(i),{scale:1}),true);
  assert.equal(layer.setLayout('overflow',{scale:1}),false);layer.beginLayouts();assert.equal(layer.layouts.size,0);
});
