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

// Sign height that won't flicker. A sign with a close neighbor rises to dodge it. The old rule flipped the
// instant a neighbor crossed 220 px, so a sign panned along that edge jumped between two heights every few frames.
// Hysteresis: a sign starts dodging inside SIGN_LIFT_ENTER_PX but only drops back once its nearest neighbor is
// past SIGN_LIFT_EXIT_PX, and whichever way it goes it holds for SIGN_LIFT_HOLD_MS first.
export const SIGN_LIFT_ENTER_PX = 220;
export const SIGN_LIFT_EXIT_PX = 275;
export const SIGN_LIFT_HOLD_MS = 900;
// Ease time constant in seconds: about 63% of the way there in this time, frame-rate independent.
export const SIGN_LIFT_EASE_S = .45;
// The total sign rise above its pin (sky rise plus dodge) never passes this fraction of the sky ceiling.
export const SIGN_RISE_MAX_OF_CEILING = 1;

/** Total sign rise above the pin. Over the cap the shared sky rise gives way first, so each sign keeps its own dodge
 * on top and close neighbors never get flattened to one height (the cluster stagger survives the cap). */
export function signRise(skyRise, dodge, ceiling, maxDodge) {
 return Math.max(0,Math.min(skyRise,ceiling-maxDodge))+Math.max(0,dodge);
}

export function createSignLift({hold=SIGN_LIFT_HOLD_MS, ease=SIGN_LIFT_EASE_S, ttl=5000}={}) {
 const state=new Map();
 return {
  // near: neighbor count inside the enter radius. far: inside the exit radius. lift: px to rise when crowded.
  step(key, near, far, lift, nowMs, dtSeconds) {
   let s=state.get(key);
   if(!s){s={crowded:near>0,since:nowMs,value:near>0?lift:0,seen:nowMs};state.set(key,s);}
   const want=s.crowded?far>0:near>0;
   if(want!==s.crowded&&nowMs-s.since>=hold){s.crowded=want;s.since=nowMs;}
   const goal=s.crowded?lift:0,k=1-Math.exp(-Math.max(0,dtSeconds||0)/ease);
   s.value+=(goal-s.value)*k;
   if(Math.abs(goal-s.value)<.05)s.value=goal;
   s.seen=nowMs;
   return s.value;
  },
  prune(nowMs){for(const [key,s] of state)if(nowMs-s.seen>ttl)state.delete(key);},
  get size(){return state.size;}
 };
}
