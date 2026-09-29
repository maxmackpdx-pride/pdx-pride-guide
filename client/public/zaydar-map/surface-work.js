// Tile, model and listing updates often arrive together. Merge their invalidations
// into one frame, retaining the strongest request and cancelling on map removal.
export function createSurfaceWork(run,request=requestAnimationFrame,cancel=cancelAnimationFrame){
 let frame=0,geometry=false,glow=false,disposed=false;
 return {
  schedule({geometry:nextGeometry=false,glow:nextGlow=false}={}){
   if(disposed)return;
   geometry ||= nextGeometry;glow ||= nextGlow;
   if(frame)return;
   frame=request(()=>{frame=0;const dirty={geometry,glow};geometry=glow=false;run(dirty);});
  },
  dispose(){disposed=true;if(frame)cancel(frame);frame=0;},
 };
}
