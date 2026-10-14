// Restraint is shared by artwork, labels, beam and camera response.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function hologramPresence(distance,viewRadius,selected=false){
 const t=clamp((distance/Math.max(350,viewRadius)-.25)/1.25,0,1);
 const near=selected?1:1-t*t*(3-2*t);
 return {scale:.62+.38*near,opacity:.38+.62*near,motion:.35+.65*near};
}
export function hologramCameraDrift(previous,anchor,phase,delta,reduced=false){
 if(!previous||!Number.isFinite(previous.anchorX)||!Number.isFinite(previous.anchorY)||reduced||Math.floor(Math.abs(phase)*7)%3!==0)return {x:0,y:0};
 const decay=Math.exp(-Math.min(.1,Math.max(0,delta))*8);
 return {x:clamp(((previous.cameraX||0)+previous.anchorX-anchor.x)*decay,-12,12),
 y:clamp(((previous.cameraY||0)+previous.anchorY-anchor.y)*decay,-7,7)};
}
export function boundedHologramPosition(anchor,position,scale,roof,ceiling){
 const side=Math.min(72,48*scale);
 return {x:clamp(position.x,anchor.x-side,anchor.x+side),
 y:clamp(position.y,anchor.y-roof-ceiling+32*scale,anchor.y-roof-10+32*scale)};
}
