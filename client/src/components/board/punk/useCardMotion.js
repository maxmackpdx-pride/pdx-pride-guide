import {useEffect} from 'react';

// One scroll read per visible card; ambient animation is CSS-only.
const cards=new Map();
let observer,preference,frame=0;
function schedule(){
  if(frame||document.hidden)return;
  frame=requestAnimationFrame(()=>{
    frame=0;
    const positions=[];
    for(const [card,entry] of cards){
      if(!entry.visible||entry.calm||preference.matches)continue;
      const rect=card.getBoundingClientRect();
      const progress=Math.max(-1,Math.min(1,(innerHeight/2-rect.top-rect.height/2)/(innerHeight/2+rect.height/2)));
      const small=card.dataset.size==='small';
      const board=card.matches('.board,.bz-card');
      positions.push([card,progress*(board?(small?5:10):(small?2:4))]);
    }
    for(const [card,y] of positions)card.style.setProperty('--card-photo-y',`${y.toFixed(3)}px`);
  });
}
function refresh(){
  for(const [card,entry] of cards){
    const enabled=!entry.calm&&!preference.matches;
    const playing=enabled&&entry.visible&&!document.hidden?'running':'paused';
    card.style.setProperty('--card-ambient-playing',playing);
    card.closest('.demo-pinned')?.style.setProperty('--pin-playing',playing);
    card.dataset.motionDisabled=String(!enabled);
    if(!enabled)card.style.setProperty('--card-photo-y','0px');
  }
  if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();
}
export function useCardMotion(ref,key,calm=false){
  useEffect(()=>{
    const card=ref.current;
    if(!card)return;
    if(!observer){
      preference=matchMedia('(prefers-reduced-motion: reduce)');
      observer=new IntersectionObserver(changes=>{
        for(const change of changes){const entry=cards.get(change.target);if(entry)entry.visible=change.isIntersecting;}
        refresh();
      });
      preference.addEventListener('change',refresh);
      document.addEventListener('visibilitychange',refresh);
      window.addEventListener('scroll',schedule,{passive:true});
      window.addEventListener('resize',schedule,{passive:true});
    }
    const seed=Array.from(String(key)).reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
    card.style.setProperty('--network-phase',`${-(seed%170)/10}s`);
    card.style.setProperty('--nodes-phase',`${-((seed>>>8)%230)/10}s`);
    card.dataset.cardMotion='';
    cards.set(card,{visible:false,calm});observer.observe(card);refresh();
    return()=>{
      observer.unobserve(card);cards.delete(card);
      if(!cards.size){
        observer.disconnect();observer=undefined;
        preference.removeEventListener('change',refresh);
        document.removeEventListener('visibilitychange',refresh);
        window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);
        cancelAnimationFrame(frame);frame=0;
      }
    };
  },[ref,key,calm]);
}
