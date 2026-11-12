import {useEffect,useRef} from 'react';

// One shared observer and media listener for the entire mounted card collection.
// CSS transforms do the frame work. No requestAnimationFrame or scroll handlers.
const cards=new Map<HTMLElement,boolean>();
let observer:IntersectionObserver|undefined;
let reduced:MediaQueryList|undefined;
function update(){
  for(const [node,visible] of cards)node.dataset.motion=visible&&!document.hidden&&!reduced?.matches?'running':'paused';
}
export function registerArtworkMotion(node:HTMLElement){
  if(cards.size===0){
    reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.addEventListener('change',update);
    document.addEventListener('visibilitychange',update);
    if('IntersectionObserver' in window)observer=new IntersectionObserver(entries=>{
      for(const e of entries)cards.set(e.target as HTMLElement,e.isIntersecting);
      update();
    },{rootMargin:'0px',threshold:0});
  }
  cards.set(node,!observer);observer?.observe(node);update();
  return()=>{
    observer?.unobserve(node);cards.delete(node);
    if(!cards.size){observer?.disconnect();observer=undefined;reduced?.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);reduced=undefined;}
  };
}
export function useArtworkMotion(enabled=true){
  const ref=useRef<HTMLElement>(null);
  useEffect(()=>{if(enabled&&ref.current)return registerArtworkMotion(ref.current);},[enabled]);
  return ref;
}
