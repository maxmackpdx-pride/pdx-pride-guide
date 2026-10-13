// Animated holograms share stationary camera projections. Moving, resized or
// terrain-adjusted cameras invalidate immediately; replacement rows are new keys.
export function createProjectionCache(map) {
 let revision=0,cache=new WeakMap(),disposed=false;
 const invalidate=()=>{revision++;};
 const events=['move','resize','terrain'];
 for(const event of events)map.on(event,invalidate);
 function dispose(){if(disposed)return;disposed=true;cache=new WeakMap();for(const event of events)map.off(event,invalidate);map.off('remove',dispose);}
 map.on('remove',dispose);
 return {
  project(feature){
   const coordinates=feature.geometry.coordinates,entry=cache.get(feature);
   if(entry&&entry.revision===revision&&entry.x===coordinates[0]&&entry.y===coordinates[1])return entry.point;
   const point=map.project(coordinates);
   cache.set(feature,{revision,x:coordinates[0],y:coordinates[1],point});return point;
  },
  invalidate,dispose,
 };
}
