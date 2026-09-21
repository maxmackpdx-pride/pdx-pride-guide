// Keep animation and map geometry on separate budgets: animated light never
// requires re-reading unchanged vector tiles.
export const mapPixelRatio=dpr=>Math.min(2,Math.max(1,Number(dpr)||1));
export function reuseSurfaceCache(cached,now,cameraKey,revision){
 if(!cached)return false;
 if(cached.revision===revision&&cached.cameraKey===cameraKey)return true;
 // Coalesce tile bursts without postponing a completed view indefinitely.
 return now-cached.time<(cached.revision===revision?1600:250);
}
export function surfaceCameraKey(map,width,height){
 const c=map.getCenter();return [c.lng,c.lat,map.getZoom(),map.getPitch(),map.getBearing(),width,height].join(':');
}
