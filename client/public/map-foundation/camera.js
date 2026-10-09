export function captureCamera(map){
 const center=map.getCenter();
 return {center:[((center.lng+180)%360+360)%360-180,center.lat],zoom:map.getZoom(),pitch:map.getPitch(),bearing:map.getBearing()};
}
export function readSavedCamera(storage,key='outzide.map.camera.v1'){
 try{
  storage??=globalThis.localStorage;
  const value=JSON.parse(storage.getItem(key));
  if(!value||value.version!==1||!Array.isArray(value.center)||value.center.length!==2)return null;
  const [lng,lat]=value.center;
  if(![lng,lat,value.zoom,value.pitch,value.bearing].every(Number.isFinite)||Math.abs(lng)>180||Math.abs(lat)>85.051129||value.zoom<0||value.zoom>18||value.pitch<0||value.pitch>75||Math.abs(value.bearing)>360)return null;
  return {center:[lng,lat],zoom:value.zoom,pitch:value.pitch,bearing:value.bearing};
 }catch{return null;}
}
export function saveMapCamera(map,storage,key='outzide.map.camera.v1'){
 try{
  storage??=globalThis.localStorage;
  storage.setItem(key,JSON.stringify({version:1,...captureCamera(map)}));
 }catch{/* Storage restrictions must never interrupt map gestures. */}
}
export function rememberMapCamera(map,{key='outzide.map.camera.v1',scope=globalThis}={}){
 const save=()=>saveMapCamera(map,scope.localStorage,key);
 const hidden=()=>{if(scope.document.hidden)save();};
 map.on('moveend',save);
 scope.addEventListener('pagehide',save);
 scope.document.addEventListener('visibilitychange',hidden);
 const dispose=()=>{map.off('moveend',save);scope.removeEventListener('pagehide',save);scope.document.removeEventListener('visibilitychange',hidden);map.off('remove',dispose);};
 map.on('remove',dispose);
 return dispose;
}

// URLs carry the current view across modes, including a flat north-up camera.
export function readCameraParams(params) {
 const keys=['lng','lat','zoom'];
 if(keys.some(key=>params.get(key)===null||params.get(key).trim()===''))return null;
 const center=[Number(params.get('lng')),Number(params.get('lat'))];
 const zoom=Number(params.get('zoom')),pitch=Number(params.get('pitch')??48),bearing=Number(params.get('bearing')??0);
 if(![...center,zoom,pitch,bearing].every(Number.isFinite)||Math.abs(center[0])>180||Math.abs(center[1])>85.051129||zoom< -2||zoom>18||pitch<0||pitch>75||Math.abs(bearing)>360)return null;
 return {center,zoom,pitch,bearing};
}
export function cameraHref(href,camera) {
 const url=new URL(href,'https://map.invalid');
 for(const [key,value] of Object.entries({lng:camera.center[0],lat:camera.center[1],zoom:camera.zoom,pitch:camera.pitch,bearing:camera.bearing}))url.searchParams.set(key,String(value));
 // A mode switch returns to the map, with its drawers and selected listings closed.
 for(const key of ['restore','place','event','houz','mizzed','gig','gift','sell','layer'])url.searchParams.delete(key);
 return url.pathname+url.search;
}
