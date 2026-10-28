// Restraint is shared by artwork, labels, beam and camera response.
// Camera-follow strength of the hologram offset spring. 1 = the old response, 0.2 = 20%.
// Offsets still settle on their pin-relative target, so anchoring and straight beams hold.
export const HOLOGRAM_CAMERA_FOLLOW=0.2;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function hologramPresence(distance,viewRadius,selected=false){
 const t=clamp((distance/Math.max(350,viewRadius)-.25)/1.25,0,1);
 const near=selected?1:1-t*t*(3-2*t);
 return {scale:.62+.38*near,opacity:.38+.62*near,motion:.35+.65*near};
}
export function hologramCameraDrift(previous,anchor,phase,delta,reduced=false){
 // Camera translation must move the complete hologram with its venue anchor.
 // Ambient sway is applied separately; camera inertia makes attached artwork slip.
 return {x:0,y:0};
}
export function boundedHologramPosition(anchor,position,scale,roof,ceiling){
 const side=Math.min(72,48*scale);
 return {x:clamp(position.x,anchor.x-side,anchor.x+side),
 y:clamp(position.y,anchor.y-roof-ceiling+32*scale,anchor.y-roof-10+32*scale)};
}
