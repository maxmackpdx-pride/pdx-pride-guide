// Project the actual screen planes, using the same per-hologram camera shear as
// the WebGL draw. No scene readback and no rectangles covering transparent beams.
export function projectedHologramQuad(elements,width,height){
 const points=[];
 for(const [x,y] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){
  const w=elements[3]*x+elements[7]*y+elements[15];
  if(!(w>0))return null;
  const z=(elements[2]*x+elements[6]*y+elements[14])/w;
  if(z < -1 || z > 1)return null;
  points.push({x:((elements[0]*x+elements[4]*y+elements[12])/w+1)*width/2,y:(1-(elements[1]*x+elements[5]*y+elements[13])/w)*height/2,z});
 }
 return {points,left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y)),farDepth:Math.max(...points.map(p=>p.z))};
}
// Foreground display surfaces cover waypoint hardware regardless of its ground depth.
// Keep clipping and hit testing identical so covered pins cannot steal screen clicks.
export function pointBehindHologram(point,depth,regions){
 if(!Number.isFinite(depth)&&!regions.some(region=>region.foreground))return false;
 return regions.some(region=>{
  if((!region.foreground&&!(depth>region.farDepth+1e-7))||point.x<region.left||point.x>region.right||point.y<region.top||point.y>region.bottom)return false;
  let inside=false;const polygon=region.points;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
   const a=polygon[i],b=polygon[j];
   if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
 });
}
export function clipBehindHolograms(ctx,depth,regions,width,height,bounds=null){
 if(!Number.isFinite(depth)&&!regions.some(region=>region.foreground))return;
 for(const region of regions){
  if((!region.foreground&&!(depth>region.farDepth+1e-7))||bounds&&(region.right<bounds.left||region.left>bounds.right||region.bottom<bounds.top||region.top>bounds.bottom))continue;
  // Separate clips make overlapping surfaces a union, rather than XOR holes.
  ctx.beginPath();ctx.rect(-1,-1,width+2,height+2);
  region.points.forEach((point,i)=>i?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));ctx.closePath();ctx.clip('evenodd');
 }
}
