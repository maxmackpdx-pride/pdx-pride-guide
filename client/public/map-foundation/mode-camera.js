import {cameraHref,readSavedCamera} from './camera.js';
// Authored DirectoryMap Portland metro coverage, [SW, NE] in longitude/latitude.
export const PORTLAND_MAP_BOUNDS=[[-122.92,45.35],[-122.42,45.70]];
export const PORTLAND_CAMERA={center:[-122.676,45.523],zoom:13.5+Math.log2(1.25),pitch:48,bearing:0};
export const modeCameraKey=mode=>`zaylist.map-mode.${mode}.camera.v1`;
export function insidePortlandMap(center){
 return Array.isArray(center)&&center.length===2&&center.every(Number.isFinite)&&center[0]>=PORTLAND_MAP_BOUNDS[0][0]&&center[0]<=PORTLAND_MAP_BOUNDS[1][0]&&center[1]>=PORTLAND_MAP_BOUNDS[0][1]&&center[1]<=PORTLAND_MAP_BOUNDS[1][1];
}
export function switchMapCameraHref(current,href,camera,storage){
 try{storage?.setItem(modeCameraKey(current),JSON.stringify({version:1,...camera}));}catch{/* Switching works with restricted storage. */}
 const target=current==='mapz'?'outz':'mapz';
 // OutZide has its own remembered exploration, never overwritten by the city camera.
 const destination=target==='outz'?(readSavedCamera(storage,modeCameraKey('outz'))||camera):insidePortlandMap(camera.center)?camera:PORTLAND_CAMERA;
 const next=new URL(cameraHref(href,destination),'https://map.invalid');
 const previous=new URL(href,'https://map.invalid');
 // Returning to a room preserves its filter scope, but never opens an old composer.
 if(target==='mapz'&&previous.searchParams.has('layer'))next.searchParams.set('layer',previous.searchParams.get('layer'));
 for(const key of ['compose','houzCompose','spotted','sellz'])next.searchParams.delete(key);
 return next.pathname+next.search;
}
