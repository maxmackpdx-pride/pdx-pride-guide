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
