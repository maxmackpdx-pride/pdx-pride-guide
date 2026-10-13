// Preserve the scene's exact screen-space neighbor rule, without allocating a
// filtered crowd for every beacon. Compare each nearby pair once; both endpoints
// receive the same count used by the existing height/motion calculation.
export function screenNeighborCounts(items, radius=220) {
 const counts=new Uint32Array(items.length),bins=new Map();let checks=0;
 if(!Number.isFinite(radius)||radius<=0)return {counts,checks};
 for(let index=0;index<items.length;index++){
  const point=items[index].p;
  if(!Number.isFinite(point.x)||!Number.isFinite(point.y))continue;
  const x=Math.floor(point.x/radius),y=Math.floor(point.y/radius);
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
   const nearby=bins.get(`${x+dx}:${y+dy}`);if(!nearby)continue;
   for(const otherIndex of nearby){
    const other=items[otherIndex].p;checks++;
    if(Math.hypot(other.x-point.x,other.y-point.y)<radius){counts[index]++;counts[otherIndex]++;}
   }
  }
  const key=`${x}:${y}`,bucket=bins.get(key);
  if(bucket)bucket.push(index);else bins.set(key,[index]);
 }
 return {counts,checks};
}
