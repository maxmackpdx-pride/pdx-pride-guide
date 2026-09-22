const KEY='outzide.map.camera.v1';
export function readSavedCamera(storage){
 try{
  storage??=globalThis.localStorage;
  const value=JSON.parse(storage.getItem(KEY));
  if(!value||value.version!==1||!Array.isArray(value.center)||value.center.length!==2)return null;
  const [lng,lat]=value.center;
  if(![lng,lat,value.zoom,value.pitch,value.bearing].every(Number.isFinite)||Math.abs(lng)>180||Math.abs(lat)>85.051129||value.zoom<0||value.zoom>18||value.pitch<0||value.pitch>75||Math.abs(value.bearing)>360)return null;
  return {center:[lng,lat],zoom:value.zoom,pitch:value.pitch,bearing:value.bearing};
 }catch{return null;}
}
export function saveMapCamera(map,storage){
 try{
  storage??=globalThis.localStorage;
  const center=map.getCenter();
  storage.setItem(KEY,JSON.stringify({version:1,center:[((center.lng+180)%360+360)%360-180,center.lat],zoom:map.getZoom(),pitch:map.getPitch(),bearing:map.getBearing()}));
 }catch{/* Storage restrictions must never interrupt map gestures. */}
}
export function rememberMapCamera(map){
 const save=()=>saveMapCamera(map);
 map.on('moveend',save);
 window.addEventListener('pagehide',save);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
}
