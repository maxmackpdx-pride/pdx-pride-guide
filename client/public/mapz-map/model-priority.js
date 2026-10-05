// Schedule on-camera models before the existing prefetch margin. Do not change
// the visible set, render order, model detail, or concurrency limit.
export function prioritizeModels(map,models){
 const canvas=map.getCanvas(),width=canvas.clientWidth,height=canvas.clientHeight;
 return models.map((model,index)=>{const p=map.project(model.center);return {model,index,offscreen:p.x<0||p.y<0||p.x>width||p.y>height,distance:Math.hypot(p.x-width/2,p.y-height/2)};})
  .sort((a,b)=>Number(a.offscreen)-Number(b.offscreen)||a.distance-b.distance||a.index-b.index).map(item=>item.model);
}
