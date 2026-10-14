/** Boardz hardware: one pin per overlapping group, independent material clocks. */
export function groupBoardPins(items, radius=30) {
 const groups=[],cells=new Map(),venues=new Map();
 const cellSize=Math.max(1,radius),distanceLimit=radius*radius;
 for(const item of [...items].sort((a,b)=>String(a.feature.properties.key).localeCompare(String(b.feature.properties.key)))) {
  const venue=item.feature.properties.venueWaypointKey,x=item.p.x,y=item.p.y;
  const cellX=Math.floor(x/cellSize),cellY=Math.floor(y/cellSize);
  let group=venue?venues.get(venue):undefined;
  // Keep the original first-match grouping, but inspect only nearby anchors.
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const candidate of cells.get(`${cellX+dx}:${cellY+dy}`)||[]){
   if((!group || candidate.order<group.order) && (candidate.x-x)**2+(candidate.y-y)**2<distanceLimit)group=candidate;
  }
  if(group)group.items.push(item);
  else {
   group={x,y,venue,items:[item]};
   Object.defineProperty(group,'order',{value:groups.length});
   groups.push(group);
   const key=`${cellX}:${cellY}`,bucket=cells.get(key)||[];bucket.push(group);cells.set(key,bucket);
   if(venue&&!venues.has(venue))venues.set(venue,group);
  }
 }
 return groups;
}
export function pinMaterial(key,seconds,reduced=false) {
 const seed=Array.from(key).reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0);
 const timing=Math.imul(seed^(seed>>>16),0x45d9f3b)>>>0,cycle=8.2+(timing%4901)/1000;
 const phase=((seconds+((timing>>>7)%13001)/1000)%cycle)/cycle;
 return {variant:seed%4,wire:!reduced&&(phase>=.6&&phase<.63 || phase>=.66&&phase<.81),jitter:reduced?0:Math.sin(seconds*21+seed)>.97?1.5:0};
}
const solid=[['#254851','m10 24 7-8 1-8 10 3-4 9 6 10-11 4-10-5Z'],['color','m10 24 10-3 10 9-11 4-10-5Z'],['#173039','m17 16 1-8 10 3-4 9-4 1Z'],['color','m12 7 3-4 16 5 1 6-9 4-11-5Z'],['#d2ffff','m12 7 10-4 9 5-9 5Z']];
const wire='m12 7 10-4 9 5 1 6-9 4-11-5V7Zm0 0 10 6 9-5m-9 5 1 5m-6-2 3 5 4-1 4-9M17 16l-7 8-1 5 10 5 11-4-6-10M10 24l10-3 10 9m-11 4 1-13m-4-16 11 6m-8-7 11 5M14 10l9 5 8-4M16 18l8 5m-10-2 12 5m-14 0 7 4 8-3m-13-4 5 11m4-12 2 9';
let cachedPaths;
function pinPaths() {
 return cachedPaths ||= {
  needle:new Path2D('M18 27 24 29 20 40Z'),solid:solid.map(([fill,path])=>[fill,new Path2D(path)]),wire:new Path2D(wire),
  side:new Path2D('m22 3 9 5 1 6-9 4-1-5V3Zm0 10 9-5m-8 10 1 2 6 10-11 4 1-13 4-1m-4 1 10 9m-11 4 5-14'),
  glitch:new Path2D('M27 8h8m-13 9h8M9 26h9m7 4h9')
 };
}
export function drawBoardPin(ctx,x,y,color,key,seconds,reduced=false,count=1,wireColor=color,cyanColor=color) {
 const material=pinMaterial(key,seconds,reduced),paths=pinPaths();
 ctx.save();ctx.translate(x-20,y-40);ctx.shadowColor='#000b';ctx.shadowBlur=6;ctx.shadowOffsetY=4;
 ctx.fillStyle='#9fc0c3';ctx.fill(paths.needle);ctx.translate(20,24);ctx.rotate((material.variant-1.5)*.05);ctx.translate(-20,-24);
 if(!material.wire)for(const [fill,path]of paths.solid){ctx.fillStyle=fill==='color'?color:fill;ctx.fill(path);}
 const wirePaint=ctx.createLinearGradient(10,5,30,34);wirePaint.addColorStop(0,cyanColor);wirePaint.addColorStop(.45,cyanColor);wirePaint.addColorStop(1,wireColor);
 ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle=wirePaint;ctx.lineWidth=.85;
 if(material.wire)ctx.stroke(paths.wire);
 ctx.translate(material.jitter,0);ctx.strokeStyle=wirePaint;ctx.stroke(paths.side);
 if(material.jitter){ctx.strokeStyle=wireColor;ctx.stroke(paths.glitch);}
 ctx.restore();
 if(count>1){ctx.save();ctx.fillStyle='#061217';ctx.strokeStyle=color;ctx.beginPath();ctx.arc(x+15,y-34,10,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(count),x+15,y-34);ctx.restore();}
}
