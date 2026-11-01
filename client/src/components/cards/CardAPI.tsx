import { useLayoutEffect, useRef, useState, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BoardCardInline } from '../board/BoardCardContinuity';
import { CARD_SIZES, expansionPlacement, type CardSize } from './cardLayout';
import './CardAPI.css';
export { CARD_SIZES, type CardSize } from './cardLayout';

type Origin = { element: HTMLElement; trigger: HTMLElement | null; at: number };
let pendingOrigin: Origin | null = null;
/** Capture on the card root, before its category-specific open callback runs. */
export function rememberCardOrigin(event: MouseEvent<HTMLElement>) {
  const target = event.target as HTMLElement;
  if (target.closest('.zay-card-expanded')) return;
  pendingOrigin = { element: event.currentTarget, trigger: target.closest<HTMLElement>('button,a,[tabindex]'), at: Date.now() };
}
function consumeOrigin() {
  const origin = pendingOrigin;
  return origin && origin.element.isConnected && Date.now() - origin.at < 2000 ? origin : null;
}
/** Reusable visual API: categories provide their own face and native actions. */
export function CardShell({ size, category, children, className = '', ...props }: HTMLAttributes<HTMLDivElement> & {
  size: CardSize; category: string; children: ReactNode;
}) {
  return <div {...props} className={`zay-card-shell ${className}`} data-card-size={size} data-card-category={category}
    onClickCapture={event => { rememberCardOrigin(event); props.onClickCapture?.(event); }}>{children}</div>;
}

/** Details live in the clicked card's actual layout slot, never on document.body.
 * A direct URL with no source card renders at the caller's ordinary document position. */
export function CardDetails({ children, onClose, mobileViewport = false }: { children: ReactNode; onClose?: () => void; mobileViewport?: boolean }) {
  const close = useRef(onClose); close.current=onClose;
  const identity=useRef(Symbol("card"));
  useLayoutEffect(()=>{
    const receive=(event:Event)=>{if((event as CustomEvent).detail!==identity.current)close.current?.();};
    window.dispatchEvent(new CustomEvent("zay-card-open",{detail:identity.current}));
    window.addEventListener("zay-card-open",receive);
    return()=>window.removeEventListener("zay-card-open",receive);
  },[]);
  const [origin] = useState(consumeOrigin);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const mount = useRef<HTMLElement | null>(null);
  const [layoutRevision,setLayoutRevision]=useState(0);
  const fallback = useRef<HTMLDivElement>(null);
  const directShown=useRef(false);
  useLayoutEffect(() => {
    if (!origin?.element.isConnected) return;
    if (pendingOrigin === origin) pendingOrigin = null;
    const source = origin.element;
    let item = source;
    // Find the collection, not a one-child flex wrapper around an artwork face.
    // Never promote an isolated card to a whole page section.
    let candidate=source;
    for(let depth=0;depth<6 && candidate.parentElement && candidate.parentElement!==document.body;depth++){
      const container=candidate.parentElement,style=getComputedStyle(container);
      if(style.display.includes('grid') || (style.display.includes('flex') && style.flexDirection.startsWith('row') && container.children.length>1)){item=candidate;break;}
      candidate=container;
    }
    const parent = item.parentElement;
    if (!parent || item === document.body) return;
    const originalStyle = item.getAttribute('style');
    const originalExpanded = item.getAttribute('data-card-expanded');
    const originalAnchor = item.getAttribute('data-card-anchor');
    const originalClass = item.className;
    // A responsive relayout first restores the closed styles. Sample the source
    // only after cancelling any transition from the previous expanded margin;
    // otherwise sourceRect sees that old margin while the sibling layout pass
    // below snaps it away, adding the same baseline offset on every resize.
    item.style.setProperty('transition','none','important');
    item.style.setProperty('animation','none','important');
    const parentStyle = getComputedStyle(parent);
    const sourceRect = source.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    // Collapsed browse lanes keep later cards mounted with display:none. Their
    // zero rectangles are not a real row: counting them shifts every open card
    // down one track. Hidden siblings must not participate in placement/reflow.
    const siblings = Array.from(parent.children).filter((el):el is HTMLElement=>
      el instanceof HTMLElement && el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0
    ).map(element=>{
      const style=element.getAttribute('style'),visualRect=element.getBoundingClientRect();
      // Pinboard decoration can rotate/nudge an object without changing its row.
      // Measure layout synchronously without those decorations, then restore them.
      // Disable transitions first: otherwise reading immediately after setting
      // rotate:none can still return the first animated (rotated) frame.
      element.style.setProperty('transition','none','important');
      element.style.setProperty('animation','none','important');
      for(const property of ['transform','rotate','translate'])element.style.setProperty(property,'none','important');
      const rect=element.getBoundingClientRect();
      if(style===null)element.removeAttribute('style');else element.setAttribute('style',style);
      return {element,rect,visualRect,style};
    });
    const layoutRect=siblings.find(s=>s.element===item)?.rect || sourceRect;
    const originalParentStyle=parent.getAttribute('style');
    let convertedFlex=false;
    const rowTops = [...new Set(siblings.map(({rect})=>Math.round(rect.top)))].sort((a,b)=>a-b);
    const target = mount.current || (mount.current=document.createElement('div')); target.className = 'zay-card-detail-mount';
    const hidden: Array<[HTMLElement,string,string]> = [];
    // Hide only the closed face. Preserve its React instance, state and handlers.
    const faces = item === source ? Array.from(item.children) : [source];
    for (const face of faces) if (face instanceof HTMLElement) { hidden.push([face, face.style.getPropertyValue('display'), face.style.getPropertyPriority('display')]); face.style.setProperty('display','none','important'); }
    item.appendChild(target);
    item.dataset.cardExpanded = 'true'; item.classList.add('zay-card-expanded-slot');
    item.style.setProperty('height','auto','important');
    item.style.setProperty('max-height','none','important');
    item.style.setProperty('min-width','0','important');
    item.style.setProperty('overflow','visible','important');
    item.style.setProperty('align-self','start','important');
    const nudgeY=sourceRect.top-layoutRect.top;
    if(Math.abs(nudgeY)>.1)item.style.setProperty('margin-top',`${(parseFloat(getComputedStyle(item).marginTop)||0)+nudgeY}px`,'important');
    const tracks = parentStyle.gridTemplateColumns.split(/\s+/).map(parseFloat).filter(Number.isFinite);
    if (parentStyle.display.includes('grid') && tracks.length) {
      let gap = parseFloat(parentStyle.columnGap) || 0;
      const padLeft=parseFloat(parentStyle.paddingLeft)||0,padRight=parseFloat(parentStyle.paddingRight)||0;
      const inner=parent.clientWidth-padLeft-padRight;
      const free=Math.max(0,inner-tracks.reduce((a,b)=>a+b,0)-gap*(tracks.length-1));
      let alignment=0;
      if(parentStyle.justifyContent==='center')alignment=free/2;
      else if(['end','flex-end','right'].includes(parentStyle.justifyContent))alignment=free;
      else if(parentStyle.justifyContent==='space-between'&&tracks.length>1)gap+=free/(tracks.length-1);
      else if(parentStyle.justifyContent==='space-around'){const extra=free/tracks.length;alignment=extra/2;gap+=extra;}
      else if(parentStyle.justifyContent==='space-evenly'){const extra=free/(tracks.length+1);alignment=extra;gap+=extra;}
      const left = parentRect.left + parent.clientLeft + padLeft + alignment;
      let offset = left, column = 1, nearest = Infinity;
      for (let i=0;i<tracks.length;i++) { const distance=Math.abs(sourceRect.left-offset); if(distance<nearest){nearest=distance;column=i+1;} offset+=tracks[i]+gap; }
      const row = rowTops.indexOf(Math.round(layoutRect.top))+1;
      const plan = expansionPlacement({columns:tracks.length,column,trackWidth:tracks[column-1],gap});
      item.dataset.cardAnchor = plan.anchor;
      item.style.gridColumn = `${plan.start} / span ${plan.span}`; item.style.gridRow = String(row);
      const spanLeft=left+tracks.slice(0,plan.start-1).reduce((a,b)=>a+b+gap,0);
      const spanRight=spanLeft+tracks.slice(plan.start-1,plan.start-1+plan.span).reduce((a,b)=>a+b,0)+gap*(plan.span-1);
      const inset=plan.anchor==='right'?Math.max(0,spanRight-sourceRect.right):Math.max(0,sourceRect.left-spanLeft);
      const available=plan.anchor==='right'?sourceRect.right-spanLeft:spanRight-sourceRect.left;
      item.style.setProperty('width',`${Math.min(plan.width,available)}px`,'important');
      item.style.setProperty('max-width',`calc(100% - ${inset}px)`,'important');
      item.style.setProperty(plan.anchor==='right'?'margin-right':'margin-left',`${inset}px`,'important');
      item.style.justifySelf=plan.anchor==='right'?'end':'start';
    } else if(parentStyle.display.includes('flex') && parentStyle.flexWrap !== 'nowrap') {
      // Preserve the measured mixed-size pinboard, using real grid tracks while
      // open. Only colliding/later cards reflow; no fixed/absolute overlay exists.
      convertedFlex=true;
      const inset=parseFloat(parentStyle.paddingLeft)||0;
      const inner=Math.max(1,Math.floor(parent.clientWidth-inset-(parseFloat(parentStyle.paddingRight)||0)));
      const left=parentRect.left+inset;
      const gap=parseFloat(parentStyle.columnGap)||0;
      const rowGap=parseFloat(parentStyle.rowGap)||0;
      const sameRow=siblings.filter(({rect})=>Math.abs(rect.top-layoutRect.top)<3);
      const rightmost=sameRow.length>1 && sameRow.every(({rect})=>rect.right<=layoutRect.right+2);
      const x=sourceRect.left-left;
      const right=sourceRect.right-left;
      const width=Math.min(760,rightmost?right:inner-x);
      const start=rightmost?right-width:x;
      item.dataset.cardAnchor=rightmost?'right':'left';
      // A gap transition can override even inline !important during interpolation,
      // turning each 1px track into a 25px stride on repeated openings.
      parent.style.setProperty('transition','none','important');
      parent.style.setProperty('animation','none','important');
      parent.style.setProperty('display','grid','important');
      parent.style.setProperty('grid-template-columns',`repeat(${inner},1px)`,'important');
      parent.style.setProperty('column-gap','0px','important');
      parent.style.setProperty('row-gap',`${rowGap}px`,'important');
      parent.style.setProperty('justify-content','start','important');
      const sourceRow=rowTops.indexOf(Math.round(layoutRect.top))+1;
      const later:typeof siblings=[];
      const place=(element:HTMLElement,px:number,row:number,w:number)=>{
        element.style.gridColumn=`${Math.round(px)+1} / span ${Math.max(1,Math.ceil(w))}`;
        element.style.gridRow=String(row); element.style.justifySelf='start';
        element.style.setProperty('width',`${w}px`,'important');
        element.style.setProperty('max-width','100%','important');
      };
      for(const sibling of siblings){
        if(sibling.element===item)continue;
        const row=rowTops.indexOf(Math.round(sibling.rect.top))+1;
        const sx=Math.max(0,Math.round(sibling.rect.left-left));
        if(row<sourceRow || (row===sourceRow && (sx+sibling.rect.width<=start || sx>=start+width))) place(sibling.element,sx,row,sibling.rect.width);
        else later.push(sibling);
      }
      const gridStart=Math.max(0,Math.round(start));
      place(item,gridStart,sourceRow,width);
      // Rotated closed artwork can extend outside the collection edge. Preserve
      // that visual corner with an in-flow margin rather than clamping it away.
      item.style.setProperty('margin-left',`${start-gridStart}px`,'important');
      let row=sourceRow+1,cursor=0;
      for(const sibling of later){
        const w=Math.min(inner,sibling.rect.width);
        if(cursor>0 && cursor+w>inner){row++;cursor=0;}
        place(sibling.element,cursor,row,w);cursor+=w+gap;
      }
    } else {
      item.dataset.cardAnchor='left';
      const width=Math.min(760,Math.max(sourceRect.width,parent.clientWidth));
      item.style.setProperty('width',`${width}px`,'important');
      item.style.setProperty('flex',`0 0 ${width}px`,'important');
      item.style.setProperty('max-width','100%','important');
    }
    setHost(target);
    let observedWidth=parent.clientWidth;
    const resize=new ResizeObserver(()=>{const next=parent.clientWidth;if(Math.abs(next-observedWidth)>1){observedWidth=next;setLayoutRevision(v=>v+1);}});
    resize.observe(parent);
    return () => {
      resize.disconnect();
      target.remove();
      if(convertedFlex){
        if(originalParentStyle===null)parent.removeAttribute("style");else parent.setAttribute("style",originalParentStyle);
        for(const sibling of siblings)if(sibling.element!==item){if(sibling.style===null)sibling.element.removeAttribute("style");else sibling.element.setAttribute("style",sibling.style);}
      }
      for (const [face,display,priority] of hidden) {
        if(display)face.style.setProperty('display',display,priority);else face.style.removeProperty('display');
      }
      if (originalStyle===null) item.removeAttribute('style'); else item.setAttribute('style',originalStyle);
      // Restore the closed geometry atomically. Re-enabling its normal CSS
      // transition before removing the expansion margin briefly adds that margin
      // to the restored inline face's baseline, visibly moving the closed card.
      item.style.setProperty('transition','none','important');
      item.className=originalClass;
      if (originalExpanded===null) delete item.dataset.cardExpanded; else item.dataset.cardExpanded=originalExpanded;
      if (originalAnchor===null) delete item.dataset.cardAnchor; else item.dataset.cardAnchor=originalAnchor;
      void item.getBoundingClientRect();
      // Restore the exact declaration (including absence/priority) only after the
      // closed geometry is committed, without permanently disabling motion.
      if (originalStyle===null) item.removeAttribute('style'); else item.setAttribute('style',originalStyle);
      queueMicrotask(()=>{if (!target.isConnected && origin.trigger?.isConnected) origin.trigger.focus({preventScroll:true});});
    };
  }, [origin,layoutRevision]);
  useLayoutEffect(() => {
    const panel=(host || fallback.current)?.querySelector<HTMLElement>('[role="dialog"]');
    panel?.focus({preventScroll:true});
    if(!origin && !directShown.current && fallback.current){directShown.current=true;fallback.current.scrollIntoView({block:"start",behavior:"auto"});}
  },[host]);
  useLayoutEffect(() => {
    if(!mobileViewport)return;
    const container=host || fallback.current;
    const expanded=container?.querySelector<HTMLElement>('.zay-card-expanded');
    if(!expanded)return;
    let frame=0;
    const viewport=window.visualViewport;
    const update=()=>{
      cancelAnimationFrame(frame);
      if(!window.matchMedia('(max-width:767px), (max-width:1023px) and (max-height:500px) and (pointer:coarse)').matches){
        delete expanded.dataset.cardMobileViewport;
        expanded.style.removeProperty('--card-viewport-height');return;
      }
      const top=viewport?.offsetTop || 0,bottom=top+(viewport?.height || window.innerHeight);
      let usableTop=top,usableBottom=bottom;
      for(const chrome of document.querySelectorAll<HTMLElement>('.site-header,.z-mobile-dock,.site-hub-mobile-bar,[data-card-viewport-edge]')){
        const style=getComputedStyle(chrome),rect=chrome.getBoundingClientRect();
        if(!['fixed','sticky'].includes(style.position) || style.visibility==='hidden' || Number(style.opacity)===0 || !rect.height || !rect.width || rect.bottom<=top || rect.top>=bottom)continue;
        // The production dock floats 8px above the safe-area edge, so touching
        // the viewport edge is not required for recognized navigation chrome.
        if(chrome.matches('.site-header,[data-card-viewport-edge=top]'))usableTop=Math.max(usableTop,rect.bottom);
        if(chrome.matches('.z-mobile-dock,.site-hub-mobile-bar,[data-card-viewport-edge=bottom]'))usableBottom=Math.min(usableBottom,rect.top);
      }
      const probe=document.createElement('div');
      probe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
      document.body.appendChild(probe);
      const safe=getComputedStyle(probe);
      // Chrome already includes its safe-area padding; reserve insets only at an
      // otherwise unobstructed viewport edge.
      if(usableTop===top)usableTop+=parseFloat(safe.paddingTop)||0;
      if(usableBottom===bottom)usableBottom-=parseFloat(safe.paddingBottom)||0;
      probe.remove();
      usableTop+=8;usableBottom-=8;
      expanded.dataset.cardMobileViewport='true';
      expanded.style.setProperty('--card-viewport-height',`${Math.max(1,Math.min(720,usableBottom-usableTop))}px`);
      // This is ordinary document scrolling, never a floating or relocated card.
      // Run on opening/viewport resize only; internal scrolling must not pan page.
      frame=requestAnimationFrame(()=>{
        const panel=expanded.querySelector<HTMLElement>('[role="dialog"],.home-outz-modal,.ab-open-card') || expanded;
        const rect=panel.getBoundingClientRect();
        if(rect.top<usableTop || rect.bottom>usableBottom){
          window.scrollBy({top:rect.top-usableTop,behavior:'instant'});
        }
      });
    };
    update();
    const chromeSelector='.site-header,.z-mobile-dock,.site-hub-mobile-bar,[data-card-viewport-edge]';
    const chromeResize=new ResizeObserver(update);
    let chromeNodes=new Set<HTMLElement>();
    const observeChrome=()=>{
      const next=new Set(document.querySelectorAll<HTMLElement>(chromeSelector));
      const changed=next.size!==chromeNodes.size || [...next].some(node=>!chromeNodes.has(node));
      if(!changed)return;
      for(const node of chromeNodes)if(!next.has(node))chromeResize.unobserve(node);
      for(const node of next)if(!chromeNodes.has(node))chromeResize.observe(node);
      chromeNodes=next;update();
    };
    observeChrome();
    const mutations=new MutationObserver(observeChrome);mutations.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('resize',update);viewport?.addEventListener('resize',update);
    return()=>{cancelAnimationFrame(frame);chromeResize.disconnect();mutations.disconnect();window.removeEventListener('resize',update);viewport?.removeEventListener('resize',update);};
  },[host,mobileViewport,layoutRevision]);
  const contents = <BoardCardInline.Provider value={true}><div className="zay-card-expanded">{children}</div></BoardCardInline.Provider>;
  return host ? createPortal(contents,host) : origin ? null : <div ref={fallback} className="zay-card-direct-details">{contents}</div>;
}
