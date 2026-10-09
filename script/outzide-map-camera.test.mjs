import test from 'node:test';import assert from 'node:assert/strict';
import {readSavedCamera,saveMapCamera,readCameraParams,cameraHref} from '../client/public/map-foundation/camera.js';
test('returning visitor restores center zoom tilt and bearing, including flat north-up view',()=>{
 let value=null;const storage={getItem:()=>value,setItem:(_,next)=>value=next};
 assert.equal(readSavedCamera(storage),null);
 saveMapCamera({getCenter:()=>({lng:-122.67,lat:45.52}),getZoom:()=>12.75,getPitch:()=>0,getBearing:()=>0},storage);
 const camera=readSavedCamera(storage);assert.ok(Math.abs(camera.center[0]+122.67)<1e-9);assert.equal(camera.center[1],45.52);assert.equal(camera.zoom,12.75);assert.equal(camera.pitch,0);assert.equal(camera.bearing,0);
});
test('corrupt or invalid saved views fall back to the Northwest overview',()=>{
 for(const data of ['bad','null',JSON.stringify({version:1,center:[0,99],zoom:10,pitch:35,bearing:0}),JSON.stringify({version:1,center:[-122,45],zoom:'12',pitch:35,bearing:0})])assert.equal(readSavedCamera({getItem:()=>data}),null);
});
test('blocked storage leaves map usable',()=>{
 const storage={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};
 assert.equal(readSavedCamera(storage),null);
 assert.doesNotThrow(()=>saveMapCamera({getCenter:()=>({lng:0,lat:0}),getZoom:()=>6,getPitch:()=>35,getBearing:()=>0},storage));
});

test('mode links carry precise center, zoom, flat pitch and bearing and clear selections',()=>{
 const camera={center:[-123.14235174,48.82375419],zoom:6.712375,pitch:0,bearing:-32.125};
 for(const href of ['/map?lat=45&lng=-122&zoom=14&place=77&layer=places','/outzide?restore=1&place=old']){
  const url=new URL(cameraHref(href,camera),'https://example.test');
  assert.deepEqual(readCameraParams(url.searchParams),camera);
  for(const key of ['restore','place','layer'])assert.equal(url.searchParams.has(key),false);
 }
});
test('invalid camera URLs never supply a partial or nonfinite view',()=>{
 for(const query of ['lat=45&lng=-122','lat=&lng=-122&zoom=10','lat=99&lng=-122&zoom=10','lat=45&lng=-122&zoom=Infinity','lat=45&lng=-122&zoom=10&pitch=NaN'])assert.equal(readCameraParams(new URLSearchParams(query)),null);
});
