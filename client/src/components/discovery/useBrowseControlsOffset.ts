import {useEffect, useRef} from 'react';

/** Desktop sidebars sit below the slim scroll dock. The full control stack is no
    longer sticky (it scrolls away and the ScrollDock pins in its place), so the
    offset is the dock's height, not the measured controls. */
export const SCROLL_DOCK_HEIGHT = 64;
export function useBrowseControlsOffset(active?: unknown) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const page=ref.current?.closest<HTMLElement>('.eb-page, .ab-page');
    if(!page) return;
    page.style.setProperty('--browse-controls-height',`${SCROLL_DOCK_HEIGHT}px`);
    return ()=>{page.style.removeProperty('--browse-controls-height');};
  },[active]);
  return ref;
}
