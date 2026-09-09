import {useRef,useState,useLayoutEffect,lazy,Suspense,type CSSProperties,type ReactNode,type PointerEvent} from 'react';
import SmoothDrawer,{SmoothDrawerGroup,SmoothDrawerItem} from './ui/smooth-drawer';
import {NavGlassLayers,navGlassPointer} from './ui/nav-glass';
import {Search,SlidersHorizontal,X,ChevronRight,Plus} from 'lucide-react';
const DirectoryAddPlaceForm=lazy(()=>import('./DirectoryAddPlaceForm'));
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
 const [adding,setAdding]=useState(false);
 const sheet=useRef<HTMLElement>(null),input=useRef<HTMLInputElement>(null);
 const [track,setTrack]=useState<{height:number;desktop:boolean}|null>(null);
 useLayoutEffect(()=>{
  const parent=sheet.current?.parentElement;if(!parent)return;
  const desktop=window.matchMedia('(min-width:768px)');
  const measure=()=>setTrack(previous=>{
   const next={height:parent.clientHeight,desktop:desktop.matches};
   return previous?.height===next.height&&previous.desktop===next.desktop?previous:next;
  });
  const observer=new ResizeObserver(measure);observer.observe(parent);desktop.addEventListener('change',measure);measure();
  return()=>{observer.disconnect();desktop.removeEventListener('change',measure);};
 },[]);
 const fullHeight=track?Math.max(92,track.desktop?track.height-36:track.height*.92):undefined;
 const snapHeight=track?level==='compact'?92:level==='full'?fullHeight:Math.min(fullHeight!,track.desktop?380:Math.min(380,track.height*.52)):undefined;
 type HeaderGesture={pointerId:number;x:number;y:number;height:number;max:number;startedAt:number;level:typeof level;moved:boolean};
 const gesture=useRef<HeaderGesture|null>(null),suppressClick=useRef(false);
 const startDrag=(event:PointerEvent<HTMLDivElement>)=>{
  if(!event.isPrimary||event.button!==0)return;
  suppressClick.current=false;
  gesture.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY,height:sheet.current!.getBoundingClientRect().height,max:fullHeight??sheet.current!.parentElement!.clientHeight*.92,startedAt:event.timeStamp,level,moved:false};
  // Capture on the original control so taps stay native and fast drags cannot leave the header.
  (event.target as Element).setPointerCapture(event.pointerId);
 };
 const moveDrag=(event:PointerEvent<HTMLDivElement>)=>{
  const active=gesture.current;if(!active||active.pointerId!==event.pointerId)return;
  const delta=active.y-event.clientY;
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
 const cancelDrag=()=>{gesture.current=null;suppressClick.current=false;setDragHeight(null);};
 return <SmoothDrawer ref={sheet} height={dragHeight??snapHeight} dragging={dragHeight!==null} data-no-pull-to-refresh data-seam="top" onPointerMove={navGlassPointer} onPointerLeave={navGlassPointer} className={`zaydar-search-drawer z-glass is-${level}${dragHeight!==null?' is-dragging':''}`} aria-label="Search and map results" onKeyDown={event=>{if(event.key==='Escape'){if(adding){setAdding(false);return;}if(filtersOpen)setFiltersOpen(false);else{setLevel('peek');input.current?.blur();}}}}>
  <NavGlassLayers/>
  <div className="zaydar-drawer-header" role="group" aria-label="Drawer search and resize controls"
   onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={cancelDrag}
   onClickCapture={event=>{if(suppressClick.current&&event.detail>0){event.preventDefault();event.stopPropagation();suppressClick.current=false;}}}
   onClick={event=>{if(!(event.target as Element).closest('button,input,label'))setLevel(level==='full'?'peek':'full');}}>
  <button type="button" className="zaydar-drawer-handle" aria-label={level==='full'?'Collapse results drawer':'Expand results drawer'} aria-expanded={level==='full'} aria-controls="zaydar-drawer-content"
   onClick={()=>setLevel(level==='full'?'peek':'full')}
   onKeyDown={event=>{if(event.key==='ArrowUp'){event.preventDefault();setLevel('full');}if(event.key==='ArrowDown'){event.preventDefault();setLevel(level==='full'?'peek':'compact');}}}
   ><span/></button>
  <SmoothDrawerItem className="zaydar-drawer-search-row">
   <label className="zaydar-drawer-search"><Search size={22}/><input ref={input} type="search" aria-label="Search Zaydar" placeholder="Search Zaydar" value={query} onFocus={()=>{setAdding(false);setLevel('full');}} onChange={event=>{onQuery(event.target.value);setLevel('full');}}/>{query&&<button type="button" onClick={()=>{onQuery('');input.current?.focus();}} aria-label="Clear search"><X size={18}/></button>}</label>
   <button type="button" className="zaydar-drawer-filter" aria-label="More map filters" aria-expanded={filtersOpen} onClick={()=>{setAdding(false);setFiltersOpen(v=>!v);setLevel('full');}}><SlidersHorizontal size={21}/></button>
  </SmoothDrawerItem>
  </div>
  <SmoothDrawerGroup open={level!=='compact'||dragHeight!==null} id="zaydar-drawer-content" className="zaydar-drawer-scroll" hidden={level==='compact'&&dragHeight===null}>
   {adding?<Suspense fallback={<p role="status">Loading place form…</p>}><DirectoryAddPlaceForm embedded readOnly={Boolean((window as unknown as {__PDX_LOCAL_PREVIEW__?:number}).__PDX_LOCAL_PREVIEW__)} onClose={()=>setAdding(false)}/></Suspense>:<>
   <SmoothDrawerItem className="zaydar-placez-heading"><h2>Placez</h2><ChevronRight size={20} aria-hidden="true"/>{placeType!=='all'&&<button type="button" onClick={()=>onPlaceType('all')}>Clear filter</button>}<button type="button" className="zaydar-add-place" aria-label="Add a place" onClick={()=>{setAdding(true);setLevel('full');}}><Plus size={22}/></button></SmoothDrawerItem>
   <SmoothDrawerItem className="zaydar-place-types" role="group" aria-label="Placez type filters">{ZAYDAR_PLACE_TYPES.map(type=><button type="button" key={type} aria-pressed={placeType===type} onClick={()=>{onPlaceType(type===placeType?'all':type);setLevel('full');}} style={{'--type-color':zaydarTypeColor(type)} as CSSProperties}><span className="zaydar-type-circle"><img src={zaydarTypeIcon(type)} style={type==='nonprofit'?{filter:'brightness(.2)'}:undefined} alt=""/></span><span>{zaydarTypeLabel(type)}</span></button>)}</SmoothDrawerItem>
   {filtersOpen&&<SmoothDrawerItem className="zaydar-drawer-advanced">{filters}</SmoothDrawerItem>}
   <SmoothDrawerItem className="zaydar-drawer-results">{children}</SmoothDrawerItem>
   </>}
  </SmoothDrawerGroup>
 </SmoothDrawer>;
}
