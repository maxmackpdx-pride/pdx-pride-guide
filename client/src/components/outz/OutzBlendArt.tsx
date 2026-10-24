import './OutzBlendArt.css';
import {useEffect,useRef} from 'react';

type BlendModule={hasBlend:(placeId:string,variant?:'tall'|'wide')=>boolean;mountBlend:(container:HTMLElement,placeId:string,opts?:{variant?:'tall'|'wide';hud?:boolean})=>Promise<()=>void>};
let engine:Promise<BlendModule>|undefined;
let styles=false;
/** The blend engine is a plain ES module shared with the Outzide map, loaded like the photo motion script so both draw the same art. */
function loadEngine(){
 if(!styles){styles=true;const link=document.createElement('link');link.rel='stylesheet';link.href='/outzide-map/assets/blend-art.css?v=20261024-redo';document.head.append(link);}
 return engine??=new Promise<BlendModule>((resolve,reject)=>{
  const scope=window as Window&{__outzBlendArt?:BlendModule};
  if(scope.__outzBlendArt){resolve(scope.__outzBlendArt);return;}
  const script=document.createElement('script');script.type='module';script.src='/outzide-map/assets/blend-art.js?v=20261024-redo';
  script.onload=()=>scope.__outzBlendArt?resolve(scope.__outzBlendArt):reject(new Error('Blend art unavailable'));
  script.onerror=()=>reject(new Error('Blend art unavailable'));document.head.append(script);
 });
}
export async function blendAvailable(placeId:string,variant:'tall'|'wide'='tall'){try{return (await loadEngine()).hasBlend(placeId,variant)}catch{return false}}

/** Blended Outzide art for one place: dot halftone base, photo cutouts, topo, water and mesh lines, route HUD.
 *  Fills its parent, which must be position:relative. Renders nothing for places without a recipe. */
export function OutzBlendArt({placeId,variant='tall',hud=true,onUnavailable}:{placeId:string;variant?:'tall'|'wide';hud?:boolean;onUnavailable?:()=>void}){
 const host=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  let disposed=false,dispose:(()=>void)|undefined;
  loadEngine().then(async mod=>{
   if(disposed||!host.current)return;
   if(!mod.hasBlend(placeId,variant)){onUnavailable?.();return;}
   const off=await mod.mountBlend(host.current,placeId,{variant,hud});
   if(disposed)off();else dispose=off;
  }).catch(()=>{onUnavailable?.();});
  return()=>{disposed=true;dispose?.()};
 },[placeId,variant,hud,onUnavailable]);
 return <span ref={host} className="outz-blend" data-outz-blend={placeId} aria-hidden="true"/>;
}
