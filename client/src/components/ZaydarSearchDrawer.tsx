import {useRef,useState,lazy,Suspense,type CSSProperties,type ReactNode,type PointerEvent} from 'react';
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
 const gesture=useRef({y:0,height:0,max:0,moved:false}),suppressClick=useRef(false);
 const endDrag=(event:PointerEvent<HTMLButtonElement>)=>{
  if(!event.currentTarget.hasPointerCapture(event.pointerId))return;
  event.currentTarget.releasePointerCapture(event.pointerId);
  if(gesture.current.moved){const height=gesture.current.height+gesture.current.y-event.clientY;setLevel(height<160?'compact':height>Math.min(440,gesture.current.max*.75)?'full':'peek');suppressClick.current=true;}
  setDragHeight(null);
 };
 return <section ref={sheet} className={`zaydar-search-drawer is-${level}${dragHeight!==null?' is-dragging':''}`} aria-label="Search and map results" style={dragHeight===null?undefined:{height:dragHeight} as CSSProperties} onKeyDown={event=>{if(event.key==='Escape'){if(adding){setAdding(false);return;}if(filtersOpen)setFiltersOpen(false);else{setLevel('peek');input.current?.blur();}}}}>
  <button type="button" className="zaydar-drawer-handle" aria-label={level==='full'?'Collapse results drawer':'Expand results drawer'} aria-expanded={level==='full'} aria-controls="zaydar-drawer-content"
   onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}setLevel(level==='full'?'peek':'full');}}
   onKeyDown={event=>{if(event.key==='ArrowUp'){event.preventDefault();setLevel('full');}if(event.key==='ArrowDown'){event.preventDefault();setLevel(level==='full'?'peek':'compact');}}}
   onPointerDown={event=>{gesture.current={y:event.clientY,height:sheet.current!.getBoundingClientRect().height,max:(sheet.current!.parentElement!.clientHeight)*.92,moved:false};event.currentTarget.setPointerCapture(event.pointerId);}}
   onPointerMove={event=>{if(!event.currentTarget.hasPointerCapture(event.pointerId))return;const delta=gesture.current.y-event.clientY;if(Math.abs(delta)>8)gesture.current.moved=true;if(gesture.current.moved)setDragHeight(Math.max(92,Math.min(gesture.current.max,gesture.current.height+delta)));}}
   onPointerUp={endDrag} onPointerCancel={()=>setDragHeight(null)}><span/></button>
  <div className="zaydar-drawer-search-row">
   <label className="zaydar-drawer-search"><Search size={22}/><input ref={input} type="search" aria-label="Search Zaydar" placeholder="Search Zaydar" value={query} onFocus={()=>{setAdding(false);setLevel('full');}} onChange={event=>{onQuery(event.target.value);setLevel('full');}}/>{query&&<button type="button" onClick={()=>{onQuery('');input.current?.focus();}} aria-label="Clear search"><X size={18}/></button>}</label>
   <button type="button" className="zaydar-drawer-filter" aria-label="More map filters" aria-expanded={filtersOpen} onClick={()=>{setAdding(false);setFiltersOpen(v=>!v);setLevel('full');}}><SlidersHorizontal size={21}/></button>
  </div>
  <div id="zaydar-drawer-content" className="zaydar-drawer-scroll" hidden={level==='compact'&&dragHeight===null}>
   {adding?<Suspense fallback={<p role="status">Loading place form…</p>}><DirectoryAddPlaceForm embedded readOnly={Boolean((window as unknown as {__PDX_LOCAL_PREVIEW__?:number}).__PDX_LOCAL_PREVIEW__)} onClose={()=>setAdding(false)}/></Suspense>:<>
   <div className="zaydar-placez-heading"><h2>Placez</h2><ChevronRight size={20} aria-hidden="true"/>{placeType!=='all'&&<button type="button" onClick={()=>onPlaceType('all')}>Clear filter</button>}<button type="button" className="zaydar-add-place" aria-label="Add a place" onClick={()=>{setAdding(true);setLevel('full');}}><Plus size={22}/></button></div>
   <div className="zaydar-place-types" role="group" aria-label="Placez type filters">{ZAYDAR_PLACE_TYPES.map(type=><button type="button" key={type} aria-pressed={placeType===type} onClick={()=>{onPlaceType(type===placeType?'all':type);setLevel('full');}} style={{'--type-color':zaydarTypeColor(type)} as CSSProperties}><span className="zaydar-type-circle"><img src={zaydarTypeIcon(type)} style={type==='nonprofit'?{filter:'brightness(.2)'}:undefined} alt=""/></span><span>{zaydarTypeLabel(type)}</span></button>)}</div>
   {filtersOpen&&<div className="zaydar-drawer-advanced">{filters}</div>}
   <div className="zaydar-drawer-results">{children}</div>
   </>}
  </div>
 </section>;
}
