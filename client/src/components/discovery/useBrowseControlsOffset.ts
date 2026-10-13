import {useEffect, useRef} from 'react';

/** Keep sticky sidebars below the complete control stack, including wrapped actions. */
export function useBrowseControlsOffset(active?: unknown) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const controls=ref.current;
    const page=controls?.closest<HTMLElement>('.eb-page, .ab-page');
    if(!controls || !page) return;
    const update=()=>page.style.setProperty('--browse-controls-height',`${controls.getBoundingClientRect().height}px`);
    const observer=new ResizeObserver(update);
    observer.observe(controls);update();
    return ()=>{observer.disconnect();page.style.removeProperty('--browse-controls-height');};
  },[active]);
  return ref;
}
