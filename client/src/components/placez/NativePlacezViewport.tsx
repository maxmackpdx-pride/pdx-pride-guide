import {useLayoutEffect,useRef,type ReactNode} from 'react';
import {cardEdgeFrames} from '@/components/board/BoardCardContinuity';

type Rect={left:number;top:number;width:number;height:number};
const quiet=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('calm-mode')||document.documentElement.dataset.calm==='true';

/** Native top layer owns its motion: an in-flow ancestor cannot morph its bounds. */
export default function NativePlacezViewport({children,label,onClose,originRect}:{children:(close:()=>void)=>ReactNode;label:string;onClose:()=>void;originRect?:Rect|null}){
  const dialog=useRef<HTMLDialogElement>(null),animation=useRef<Animation|null>(null),closing=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const latestClose=useRef(onClose);latestClose.current=onClose;
  const finish=()=>{clearTimeout(timer.current);animation.current?.cancel();animation.current=null;latestClose.current();};
  const requestClose=()=>{
    if(closing.current)return;closing.current=true;
    const element=dialog.current;
    if(!element||quiet()||!originRect||typeof element.animate!=='function'){finish();return;}
    animation.current?.cancel();
    const frames=cardEdgeFrames(originRect,element.getBoundingClientRect());
    if(!frames){finish();return;}
    element.dataset.placezMotion='closing';
    try{
      animation.current=element.animate([...frames].reverse(),{duration:240,easing:'cubic-bezier(.4,0,.8,.2)',fill:'both'});
      animation.current.onfinish=finish;timer.current=setTimeout(finish,320);
    }catch{finish();}
  };
  useLayoutEffect(()=>{
    const element=dialog.current;if(!element)return;
    closing.current=false;
    let frame=0,cancelled=false;
    // Activity recreates effects before CardDetails has replaced its portal host.
    // Wait until after the parent layout effects and never show a detached dialog.
    const show=()=>{
      if(cancelled)return;
      if(!element.isConnected){frame=requestAnimationFrame(show);return;}
      if(!element.open)element.showModal();
    const frames=originRect?cardEdgeFrames(originRect,element.getBoundingClientRect()):null;
    element.dataset.placezMotion=quiet()?'quiet':frames?'opening':'direct';
    if(frames&&!quiet()&&typeof element.animate==='function'){
      try{
        animation.current=element.animate(frames,{duration:280,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
        animation.current.onfinish=()=>{animation.current?.cancel();animation.current=null;element.dataset.placezMotion='open';};
      }catch{element.dataset.placezMotion='open';}
    }
    };
    frame=requestAnimationFrame(show);
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop=()=>{if(!quiet())return;animation.current?.cancel();animation.current=null;element.dataset.placezMotion='quiet';if(closing.current)finish();};
    preference.addEventListener('change',stop);
    const observer=new MutationObserver(stop);observer.observe(document.documentElement,{attributes:true,attributeFilter:['class','data-calm']});
    return()=>{cancelled=true;cancelAnimationFrame(frame);clearTimeout(timer.current);observer.disconnect();preference.removeEventListener('change',stop);animation.current?.cancel();animation.current=null;if(element.open)element.close();};
  },[]);
  return <dialog ref={dialog} className="pz-native-viewport" aria-label={label} data-placez-source-rect={originRect?JSON.stringify(originRect):undefined} onCancel={event=>{event.preventDefault();requestClose();}} onClick={event=>{
    if(event.target!==event.currentTarget)return;
    const bounds=event.currentTarget.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)requestClose();
  }}>{children(requestClose)}</dialog>;
}
