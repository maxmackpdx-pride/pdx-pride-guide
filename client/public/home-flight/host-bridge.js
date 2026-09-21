// Only the same-origin homepage may control the embedded flight's lifecycle.
const media=matchMedia('(prefers-reduced-motion: reduce)');
let active=window.parent===window,still=false;
export const flightVisible=()=>active&&!document.hidden;
export const flightMotion={
  get matches(){return still||media.matches;},
  addEventListener(type,listener){media.addEventListener(type,listener);window.addEventListener('flightmotionchange',listener);},
  removeEventListener(type,listener){media.removeEventListener(type,listener);window.removeEventListener('flightmotionchange',listener);}
};
function receive(event){
  if(event.source!==window.parent||event.origin!==location.origin||event.data?.type!=='zaylist:flight-state')return;
  const previousActive=active,previousStill=still;
  active=event.data.active===true;
  if(typeof event.data.still==='boolean')still=event.data.still;
  for(const [name,value] of [['top',event.data.topInset],['bottom',event.data.bottomInset]])
    if(Number.isFinite(value))document.documentElement.style.setProperty(`--flight-${name}-inset`,`${Math.max(0,value)}px`);
  if(previousStill!==still)window.dispatchEvent(new Event('flightmotionchange'));
  if(previousActive!==active)window.dispatchEvent(new Event('flightvisibilitychange'));
}
window.addEventListener('message',receive);
window.addEventListener('pagehide',()=>window.removeEventListener('message',receive),{once:true});
export function flightReady(){window.parent.postMessage({type:'zaylist:flight-ready'},location.origin);}
window.addEventListener('error',()=>window.parent.postMessage({type:'zaylist:flight-error'},location.origin));
