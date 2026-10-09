// Shared infrastructure. Product scenes retain their own styles and effects.
export function vectorFirstStyle(style) {
 const flat=structuredClone(style);
 delete flat.terrain;
 const deferred=new Set(['elevation','hillshade-elevation','contours']);
 for(const id of deferred)delete flat.sources?.[id];
 flat.layers=flat.layers.filter(layer=>!deferred.has(layer.source)&&!['land-relief','elevation-contours'].includes(layer.id));
 return flat;
}

export function createMap(options, {library=globalThis.maplibregl, onError}={}) {
 try{return new library.Map(options);}catch(error){onError?.(error);throw error;}
}

// `load` fires once; an already loaded or replaced style needs its own readiness.
export function whenStyleReady(map) {
 if(map.isStyleLoaded())return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const ready=()=>{if(map.isStyleLoaded()){cleanup();resolve();}};
  const removed=()=>{cleanup();reject(new Error('Map removed before style readiness'));};
  const cleanup=()=>{map.off('sourcedata',ready);map.off('styledata',ready);map.off('idle',ready);map.off('load',ready);map.off('remove',removed);};
  map.on('sourcedata',ready);map.on('styledata',ready);map.on('idle',ready);map.on('load',ready);map.on('remove',removed);
 });
}

export function observeMapSize(map, onResize=()=>{}, scope=globalThis) {
 let frame=0,previous='';
 const observer=new scope.ResizeObserver(entries=>{
  const box=entries[0]?.contentRect;
  const size=box?`${box.width}:${box.height}`:'';
  if(size===previous)return;
  previous=size;
  if(!frame)frame=scope.requestAnimationFrame(()=>{frame=0;map.resize();onResize();});
 });
 observer.observe(map.getContainer());
 const dispose=()=>{observer.disconnect();scope.cancelAnimationFrame(frame);map.off('remove',dispose);};
 map.on('remove',dispose);
 return dispose;
}

// A retained iframe can be offscreen while its document is still visible.
export function createMapActivity(map,{onChange=()=>{},scope=globalThis}={}){
 let onscreen=true;
 const activity={get visible(){return onscreen&&!scope.document.hidden;},dispose};
 let visible=activity.visible;
 const update=()=>{const next=activity.visible;if(next!==visible){visible=next;onChange(next);}};
 const observer=scope.IntersectionObserver?new scope.IntersectionObserver(entries=>{onscreen=entries[0]?.isIntersecting!==false;update();}):null;
 observer?.observe(map.getContainer());
 scope.document.addEventListener('visibilitychange',update);
 function dispose(){observer?.disconnect();scope.document.removeEventListener('visibilitychange',update);map.off('remove',dispose);}
 map.on('remove',dispose);
 return activity;
}

// Read every box before any effect writes, preventing per-marker layout flushes.
export function markerFrame(map, markers,measureHead=()=>false) {
 const container=map.getContainer().getBoundingClientRect();
 return markers.map(marker=>{
  const element=marker.getElement(),rect=element.getBoundingClientRect();
  const head=measureHead(marker)?element.querySelector('.waypoint-head')?.getBoundingClientRect():null;
  return {marker,element,head:head?{x:head.left-container.left+head.width/2,y:head.top-container.top+head.height/2,size:head.width}:null,anchor:{x:rect.left-container.left+rect.width/2,y:rect.top-container.top+rect.height/2}};
 });
}

// A render with loaded vector tiles is the boot gate; construction is not a frame.
export function whenMapRendered(map) {
 return new Promise((resolve,reject)=>{
  const ready=()=>{if(!map.loaded())return;cleanup();requestAnimationFrame(resolve);};
  const removed=()=>{cleanup();reject(new Error('Map removed before first frame'));};
  const cleanup=()=>{map.off('render',ready);map.off('remove',removed);};
  map.on('render',ready);map.on('remove',removed);map.triggerRepaint();
 });
}
// Preserve loaded vector tiles and GPU state while adding the deferred surface.
export function extendMapStyle(map,style) {
 for(const [id,source] of Object.entries(style.sources))if(!map.getSource(id))map.addSource(id,source);
 for(let index=style.layers.length-1;index>=0;index--){
  const layer=style.layers[index];
  if(!map.getLayer(layer.id))map.addLayer(layer,style.layers.slice(index+1).find(next=>map.getLayer(next.id))?.id);
 }
 if(style.terrain)map.setTerrain(style.terrain);
}

// Adding terrain during a flat-map ease leaves MapLibre's elevation target unset.
export function whenMapSettled(map) {
 return new Promise((resolve,reject)=>{
  let frame=0;
  const cleanup=()=>{cancelAnimationFrame(frame);map.off('moveend',check);map.off('remove',removed);};
  const check=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(map.isMoving())return;cleanup();resolve();});};
  const removed=()=>{cleanup();reject(new Error('Map removed before movement settled'));};
  map.on('moveend',check);map.on('remove',removed);check();
 });
}
