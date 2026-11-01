// MapLibre 5.6.2 reads terrain depth for every Marker opacity update even
// when covered and uncovered opacity are identical. OutZide's always-visible
// waypoints have no MapLibre popup, so that synchronous GPU readback changes
// nothing. Preserve the vendor path if either behavior is subsequently changed.
export function avoidUnneededMarkerDepthReadback(marker,version){
 if(version!=='5.6.2'||typeof marker._updateOpacity!=='function')return marker;
 const update=marker._updateOpacity;
 marker._updateOpacity=function(...args){
  if(!this._map)return;
  if(this._opacity===this._opacityWhenCovered&&!this._popup?.isOpen()){
   const style=this.getElement().style;
   if(style.opacity!==this._opacity)style.opacity=this._opacity;
   return;
  }
  return update.apply(this,args);
 };
 return marker;
}
