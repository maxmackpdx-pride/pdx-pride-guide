import {useSyncExternalStore} from 'react';
let now=Date.now();
let timer:ReturnType<typeof setTimeout>|undefined;
const listeners=new Set<()=>void>();
const snapshot=()=>now;
const serverSnapshot=()=>0;
function tick(){
 clearTimeout(timer);now=Date.now();for(const notify of listeners)notify();
 if(listeners.size&&!document.hidden)timer=setTimeout(tick,60000-now%60000);
}
function subscribe(notify:()=>void){
 listeners.add(notify);
 if(listeners.size===1){document.addEventListener('visibilitychange',tick);tick();}
 return()=>{listeners.delete(notify);if(!listeners.size){clearTimeout(timer);document.removeEventListener('visibilitychange',tick);}};
}
/** Bring the shared clock forward when a fresh query completes between minute ticks. */
export function refreshPlacezClock(freshAt:number){
 if(freshAt>now)tick();
}
/** Shared minute clock. Render reads a stable snapshot; hidden pages own no timer. */
export function usePlacezClock(previewNow?:number){const current=useSyncExternalStore(subscribe,snapshot,serverSnapshot);return previewNow??current;}
