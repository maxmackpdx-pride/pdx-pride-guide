// Same frame delta as the map: no extra timers, no camera-dependent resets.
export function smoothCardVisibility(current,visible,delta,calm=false){
 const target=visible?1:0;
 return calm?target:current+(target-current)*(1-Math.exp(-Math.max(0,Math.min(delta,.1))*8));
}
