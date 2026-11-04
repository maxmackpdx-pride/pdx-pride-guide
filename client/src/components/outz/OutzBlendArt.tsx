import './OutzBlendArt.css';
import {Suspense, use, useEffect, useRef} from 'react';
import {blendedArtPhotoUrl} from '@/lib/outzBlendedArt';
import {cardResource, preinitCardStyle, preloadCardImage, preloadCardModule} from '@/components/cards/react19CardModel';

type BlendModule={hasBlend:(placeId:string,variant?:'tall'|'wide')=>boolean;mountBlend:(container:HTMLElement,placeId:string,opts?:{variant?:'tall'|'wide';hud?:boolean;signal?:AbortSignal})=>Promise<()=>void>};
const BLEND_CSS='/outzide-map/assets/blend-art.css?v=20261025-xerox-check';
const BLEND_SCRIPT='/outzide-map/assets/blend-art.js?v=20261025-xerox-check';
let engine:Promise<BlendModule>|undefined;
/** The blend engine is a plain ES module shared with the Outzide map, loaded like the photo motion script so both draw the same art. */
function loadEngine(){
 preinitCardStyle(BLEND_CSS);
 return engine??=new Promise<BlendModule>((resolve,reject)=>{
  const scope=window as Window&{__outzBlendArt?:BlendModule};
  if(scope.__outzBlendArt){resolve(scope.__outzBlendArt);return;}
  const script=document.createElement('script');script.type='module';script.src=BLEND_SCRIPT;
  script.onload=()=>scope.__outzBlendArt?resolve(scope.__outzBlendArt):reject(new Error('Blend art unavailable'));
  script.onerror=()=>reject(new Error('Blend art unavailable'));document.head.append(script);
 });
}
function blendResource(){return cardResource('outz-blend-engine',()=>loadEngine().then(mod=>mod).catch(()=>null));}
export async function blendAvailable(placeId:string,variant:'tall'|'wide'='tall'){try{return (await loadEngine()).hasBlend(placeId,variant)}catch{return false}}

/** Blended Outzide art for one place: dot halftone base, photo cutouts, topo, water and mesh lines, route HUD.
 *  Fills its parent, which must be position:relative. Renders nothing for places without a recipe. */
export function OutzBlendArt({placeId,variant='tall',hud=true,onUnavailable}:{placeId:string;variant?:'tall'|'wide';hud?:boolean;onUnavailable?:()=>void}){
 preloadCardModule(BLEND_SCRIPT);
 preinitCardStyle(BLEND_CSS);
 preloadCardImage(blendedArtPhotoUrl(placeId,variant),'high');
 return <Suspense fallback={<span className="outz-blend" data-outz-blend={placeId} aria-hidden="true"/>}><BlendMounted placeId={placeId} variant={variant} hud={hud} onUnavailable={onUnavailable}/></Suspense>;
}
function BlendMounted({placeId,variant,hud,onUnavailable}:{placeId:string;variant:'tall'|'wide';hud:boolean;onUnavailable?:()=>void}){
 const mod=use(blendResource());
 const host=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const node=host.current;
  if(!mod||!node){onUnavailable?.();return;}
  let disposed=false,dispose:(()=>void)|undefined;const controller=new AbortController();
  if(!mod.hasBlend(placeId,variant)){onUnavailable?.();return;}
  mod.mountBlend(node,placeId,{variant,hud,signal:controller.signal}).then(off=>{if(disposed)off();else dispose=off;}).catch(()=>{if(!disposed)onUnavailable?.();});
  return()=>{disposed=true;controller.abort();dispose?.()};
 },[mod,placeId,variant,hud,onUnavailable]);
 return <span ref={host} className="outz-blend" data-outz-blend={placeId} aria-hidden="true"/>;
}
