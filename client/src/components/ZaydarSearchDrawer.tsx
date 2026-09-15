import {useEffect,useRef,useState,useLayoutEffect,type CSSProperties,type ReactNode,type PointerEvent} from 'react';
import SmoothDrawer,{SmoothDrawerGroup,SmoothDrawerItem} from './ui/smooth-drawer';
import {NavGlassLayers,navGlassPointer} from './ui/nav-glass';
import {Search,SlidersHorizontal,X,ChevronRight,ChevronDown} from 'lucide-react';
import {DIRECTORY_TYPE_LABELS,directoryTypeColor} from '@shared/directoryTheme';

export const ZAYDAR_PLACE_TYPES=['all','bar','restaurant','cafe','venue','shop','service','hotel','nonprofit','healthcare','realestate','campground','adult'];
export const zaydarTypeIcon=(type:string)=>`/zaydar-map/icons/types/${ZAYDAR_PLACE_TYPES.includes(type)?type:'venue'}.svg`;
export const zaydarTypeLabel=(type:string)=>type==='all'?'All placez':type==='adult'?'Adult':DIRECTORY_TYPE_LABELS[type]||'Venues';
export const zaydarTypeColor=(type:string)=>type==='adult'?'#FF0000':type==='all'?'#63798B':directoryTypeColor(type);

type Props={query:string;onQuery:(query:string)=>void;placeType:string;onPlaceType:(type:string)=>void;filters:ReactNode;children:ReactNode};
export default function ZaydarSearchDrawer({query,onQuery,placeType,onPlaceType,filters,children}:Props){
 const [level,setLevel]=useState<'compact'|'peek'|'full'>('peek');
 const [dragHeight,setDragHeight]=useState<number|null>(null);
 const [filtersOpen,setFiltersOpen]=useState(false);
 const [dockCollapsed,setDockCollapsed]=useState(()=>typeof document!=='undefined'&&document.documentElement.dataset.mobileDock==='collapsed');
 const sheet=useRef<HTMLElement>(null),input=useRef<HTMLInputElement>(null);
 const [track,setTrack]=useState<{height:number;desktop:boolean}|null>(null);
 const initialized=useRef(false);
 useEffect(()=>{
  const sync=()=>setDockCollapsed(document.documentElement.dataset.mobileDock==='collapsed');
  sync();window.addEventListener('zaylist:mobile-dock',sync);
  return()=>window.removeEventListener('zaylist:mobile-dock',sync);
 },[]);
 useLayoutEffect(()=>{
  const parent=sheet.current?.parentElement;if(!parent)return;
  const desktop=window.matchMedia('(min-width:768px)');
  const measure=()=>setTrack(previous=>{
   const next={height:parent.clientHeight,desktop:desktop.matches};
   if(!initialized.current){initialized.current=true;if(!next.desktop)setLevel('full');}
   return previous?.height===next.height&&previous.desktop===next.desktop?previous:next;
  });
  const observer=new ResizeObserver(measure);observer.observe(parent);desktop.addEventListener('change',measure);measure();
  return()=>{observer.disconnect();desktop.removeEventListener('change',measure);};
 },[]);
 const fullHeight=track?Math.max(56,track.desktop?track.height-36:track.height-116):undefined;
 const snapHeight=track?level==='compact'?(track.desktop?92:56):level==='full'?fullHeight:Math.min(fullHeight!,track.desktop?380:fullHeight!):undefined;
 type HeaderGesture={pointerId:number;x:number;y:number;height:number;max:number;startedAt:number;level:typeof level;moved:boolean};
 const gesture=useRef<HeaderGesture|null>(null),suppressClick=useRef(false);
 const startDrag=(event:PointerEvent<HTMLDivElement>)=>{
  if(!track?.desktop)return;
  if(!event.isPrimary||event.button!==0)return;
  suppressClick.current=false;
  gesture.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY,height:sheet.current!.getBoundingClientRect().height,max:fullHeight??sheet.current!.parentElement!.clientHeight*.92,startedAt:event.timeStamp,level,moved:false};
  // Capture on the original control so taps stay native and fast drags cannot leave the header.
  (event.target as Element).setPointerCapture(event.pointerId);
 };
 const moveDrag=(event:PointerEvent<HTMLDivElement>)=>{
  const active=gesture.current;if(!active||active.pointerId!==event.pointerId)return;
  const delta=active.y-event.clientY;
  if(Math.hypot(event.clientX-active.x,delta)>=8)suppressClick.current=true;
  if(!active.moved){
   if(Math.abs(delta)<8||Math.abs(delta)<=Math.abs(event.clientX-active.x))return;
   active.moved=true;suppressClick.current=true;event.currentTarget.setPointerCapture(event.pointerId);
   input.current?.blur();
  }
  event.preventDefault();
  setDragHeight(Math.max(92,Math.min(active.max,active.height+delta)));
 };
 const endDrag=(event:PointerEvent<HTMLDivElement>)=>{
  const active=gesture.current;if(!active||active.pointerId!==event.pointerId)return;
  gesture.current=null;
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  if(active.moved){
   const delta=active.y-event.clientY,height=Math.max(92,Math.min(active.max,active.height+delta));
   const snaps=[{level:'compact' as const,height:92},{level:'peek' as const,height:Math.min(active.max,track?.desktop?380:Math.min(380,(track?.height??730)*.52))},{level:'full' as const,height:active.max}];
   const velocity=Math.abs(delta)/Math.max(1,event.timeStamp-active.startedAt);
   if(Math.abs(delta)>35&&velocity>.35){
    const index=snaps.findIndex(snap=>snap.level===active.level);
    setLevel(snaps[Math.max(0,Math.min(2,index+(delta>0?1:-1)))].level);
   }else setLevel(snaps.reduce((nearest,snap)=>Math.abs(snap.height-height)<Math.abs(nearest.height-height)?snap:nearest).level);
  }
  setDragHeight(null);
 };
 const cancelDrag=()=>{gesture.current=null;suppressClick.current=true;setDragHeight(null);};
 // Native scrolling owns the body. A pointer that moved or was cancelled must not also tap a filter.
 const contentGesture=useRef<{pointerId:number;x:number;y:number;scrolled:boolean}|null>(null);
 const trackContentMovement=(event:PointerEvent<HTMLDivElement>)=>{
  const active=contentGesture.current;
  if(active?.pointerId===event.pointerId&&Math.hypot(event.clientX-active.x,event.clientY-active.y)>=8)active.scrolled=true;
 };
 const drawerOpen=level!=='compact';
 useEffect(()=>{
  const root=document.documentElement;
  const state=drawerOpen?'open':'compact';
  root.dataset.zaylistDrawer=state;
  window.dispatchEvent(new CustomEvent('zaylist:drawer',{detail:{open:drawerOpen}}));
  return()=>{if(root.dataset.zaylistDrawer===state)delete root.dataset.zaylistDrawer;};
 },[drawerOpen]);
 const toggleDrawer=()=>setLevel(drawerOpen?'compact':'full');
 return <SmoothDrawer ref={sheet} height={dragHeight??snapHeight} dragging={dragHeight!==null} data-no-pull-to-refresh data-seam="top" onPointerMove={navGlassPointer} onPointerLeave={navGlassPointer} className={`zaydar-search-drawer z-glass is-${level}${dockCollapsed?' dock-is-collapsed':' dock-is-expanded'}${dragHeight!==null?' is-dragging':''}`} aria-label="Search and map results" onKeyDown={event=>{if(event.key==='Escape'){if(filtersOpen)setFiltersOpen(false);else{setLevel(track?.desktop?'peek':'compact');input.current?.blur();}}}}>
  <NavGlassLayers/>
  <div className="zaydar-drawer-header" role="group" aria-label="Drawer search and resize controls"
   onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={cancelDrag}
   onClickCapture={event=>{if(suppressClick.current&&event.detail>0){event.preventDefault();event.stopPropagation();suppressClick.current=false;}}}
   onClick={event=>{if(!(event.target as Element).closest('button,input,label'))setLevel(track?.desktop?(level==='full'?'peek':'full'):(drawerOpen?'compact':'full'));}}>
  <button type="button" className="zaydar-drawer-handle" aria-label={drawerOpen?'Collapse results drawer':'Expand results drawer'} aria-expanded={drawerOpen} aria-controls="zaydar-drawer-content"
   onClick={()=>track?.desktop?setLevel(level==='full'?'peek':'full'):toggleDrawer()}
   onKeyDown={event=>{if(event.key==='ArrowUp'){event.preventDefault();setLevel('full');}if(event.key==='ArrowDown'){event.preventDefault();setLevel(level==='full'?'peek':'compact');}}}
   ><span/></button>
  <SmoothDrawerItem className="zaydar-drawer-search-row">
   <label className="zaydar-drawer-search"><Search size={22}/><input ref={input} type="search" aria-label="Search Zaylist" placeholder="Search Zaylist" value={query} onFocus={()=>setLevel('full')} onChange={event=>{onQuery(event.target.value);setLevel('full');}}/>{query&&<button type="button" onClick={()=>{onQuery('');input.current?.focus();}} aria-label="Clear search"><X size={18}/></button>}</label>
   <button type="button" className="zaydar-drawer-filter" aria-label="More map filters" aria-expanded={filtersOpen} onClick={()=>{setFiltersOpen(v=>!v);setLevel('full');}}><SlidersHorizontal size={21}/></button>
  </SmoothDrawerItem>
  </div>
  <SmoothDrawerGroup open={level!=='compact'||dragHeight!==null} id="zaydar-drawer-content" className="zaydar-drawer-scroll"
   onPointerDownCapture={event=>{if(event.isPrimary)contentGesture.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY,scrolled:false};}}
   onPointerMoveCapture={trackContentMovement} onPointerUpCapture={trackContentMovement}
   onPointerCancelCapture={()=>{if(contentGesture.current)contentGesture.current.scrolled=true;}}
   onScrollCapture={()=>{if(contentGesture.current)contentGesture.current.scrolled=true;}}
   onClickCapture={event=>{if(event.detail>0&&contentGesture.current?.scrolled){event.preventDefault();event.stopPropagation();}}}
   hidden={level==='compact'&&dragHeight===null}>
   <SmoothDrawerItem className="zaydar-placez-heading"><h2>Placez</h2><ChevronRight size={20} aria-hidden="true"/>{placeType!=='all'&&<button type="button" onClick={()=>onPlaceType('all')}>Clear filter</button>}</SmoothDrawerItem>
   <SmoothDrawerItem className="zaydar-place-types" role="group" aria-label="Placez type filters">{ZAYDAR_PLACE_TYPES.map(type=><button type="button" key={type} aria-pressed={placeType===type} onClick={()=>{onPlaceType(type===placeType?'all':type);setLevel('full');}} style={{'--type-color':zaydarTypeColor(type)} as CSSProperties}><span className="zaydar-type-circle"><img draggable={false} src={zaydarTypeIcon(type)} style={type==='nonprofit'?{filter:'brightness(.2)'}:undefined} alt=""/></span><span>{zaydarTypeLabel(type)}</span></button>)}</SmoothDrawerItem>
   {filtersOpen&&<SmoothDrawerItem className="zaydar-drawer-advanced">{filters}</SmoothDrawerItem>}
   <SmoothDrawerItem className="zaydar-drawer-results">{children}</SmoothDrawerItem>
  </SmoothDrawerGroup>
  {track&&!track.desktop&&drawerOpen&&<button type="button" className="zaydar-drawer-close-corner" aria-label="Collapse results drawer to search" aria-controls="zaydar-drawer-content" onClick={toggleDrawer}><ChevronDown size={24}/></button>}
 </SmoothDrawer>;
}
