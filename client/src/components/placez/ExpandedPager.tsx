import {useEffect,useLayoutEffect,useId,useRef,useState,type KeyboardEvent,type ReactNode} from 'react';

export const EXPANDED_PAGES=['Feed','Info','Events + nearby','Maps','People'] as const;
export function pageForKey(key:string,current:number,count=5){
  if(key==='ArrowRight')return Math.min(count-1,current+1);
  if(key==='ArrowLeft')return Math.max(0,current-1);
  if(key==='Home')return 0;
  if(key==='End')return count-1;
  return null;
}
export function pageFromScroll(left:number,width:number,count=5){
  return width>0?Math.max(0,Math.min(count-1,Math.round(left/width))):0;
}

export default function ExpandedPager({pages,motion=true,initialPage=1,resetKey=0,onPageChange}:{pages:ReactNode[];motion?:boolean;initialPage?:number;resetKey?:number;onPageChange?:(page:number)=>void}) {
  const initial=Math.max(0,Math.min(Number.isInteger(initialPage)?initialPage:1,pages.length-1));
  const id=useId(),[active,setActive]=useState(initial),activeRef=useRef(initial);
  const viewport=useRef<HTMLDivElement>(null),tabs=useRef<(HTMLButtonElement|null)[]>([]),panels=useRef<(HTMLDivElement|null)[]>([]);
  const settle=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const select=(index:number,focus=false,scroll=true)=>{
    const next=Math.max(0,Math.min(pages.length-1,index)),previous=activeRef.current;
    const focusedInside=typeof document!=='undefined'&&panels.current[previous]?.contains(document.activeElement);
    activeRef.current=next;setActive(next);onPageChange?.(next);
    if(focus||(focusedInside&&next!==previous))tabs.current[next]?.focus({preventScroll:true});
    if(scroll&&viewport.current){
      const calm=!motion||typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      viewport.current.scrollTo({left:next*viewport.current.clientWidth,behavior:calm?'auto':'smooth'});
    }
  };
  useLayoutEffect(()=>{
    activeRef.current=initial;setActive(initial);onPageChange?.(initial);
    viewport.current?.scrollTo({left:initial*(viewport.current?.clientWidth||0),behavior:"auto"});
  },[initialPage,resetKey]);
  useLayoutEffect(()=>{
    const element=viewport.current;if(!element)return;
    const align=()=>element.scrollTo({left:activeRef.current*element.clientWidth,behavior:'auto'});
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(align):null;
    align();observer?.observe(element);window.addEventListener('resize',align);
    return()=>{observer?.disconnect();window.removeEventListener('resize',align);clearTimeout(settle.current);};
  },[]);
  useEffect(()=>{
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop=()=>{if((!motion||preference.matches)&&viewport.current)viewport.current.scrollTo({left:activeRef.current*viewport.current.clientWidth,behavior:'auto'});};
    stop();preference.addEventListener('change',stop);
    return()=>preference.removeEventListener('change',stop);
  },[motion]);
  const onKeys=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
    const next=pageForKey(event.key,index,pages.length);if(next!==null){event.preventDefault();select(next,true);}
  };
  return <div className="pz-expanded-pager">
    <div className="pz-page-tabs" role="tablist" aria-label="Place details pages">{EXPANDED_PAGES.slice(0,pages.length).map((label,index)=><button key={label} ref={element=>{tabs.current[index]=element;}} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={active===index} tabIndex={active===index?0:-1} onKeyDown={event=>onKeys(event,index)} onClick={()=>select(index)}>{label}</button>)}</div>
    <div className="pz-page-viewport" ref={viewport} onScroll={()=>{
      clearTimeout(settle.current);settle.current=setTimeout(()=>{const element=viewport.current;if(element)select(pageFromScroll(element.scrollLeft,element.clientWidth,pages.length),false,false);},90);
    }}>{pages.map((page,index)=><div className="pz-page-panel" ref={element=>{panels.current[index]=element;}} key={index} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} aria-hidden={active!==index} inert={active!==index} tabIndex={active===index?0:-1}>{page}</div>)}</div>
    <div className="pz-page-controls"><button type="button" onClick={()=>select(active-1)} disabled={active===0} aria-label="Previous details page">←</button><span className="pz-page-indicators" aria-hidden="true">{pages.map((_,index)=><span key={index} className="pz-page-dot" data-active={active===index}/>)}</span><span className="pz-page-status" aria-live="polite">Page {active}: {EXPANDED_PAGES[active]}</span><button type="button" onClick={()=>select(active+1)} disabled={active===pages.length-1} aria-label="Next details page">→</button></div>
  </div>;
}
