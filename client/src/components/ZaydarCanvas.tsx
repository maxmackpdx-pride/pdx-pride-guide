import ZaydarEventLabel,{type EventLabel} from './ZaydarEventLabel';
import ZaydarFallback from './ZaydarFallback';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
export type ZaydarHandle={send:(type:string,data?:Record<string,unknown>)=>void};
type View={center:[number,number];zoom:number;bounds:{south:number;north:number;west:number;east:number}};
type Row={key:string;coordinates:number[];name:string;color:string;typeIcon?:string;logo:string;alternateLogo?:string;time?:string};
const MAP_SRC='/zaydar-map/index.html?v=20260919-boot';
export default forwardRef<ZaydarHandle,{rows:Row[];selected:string|null;onSelect:(key:string)=>void;onMode?:(mode:string)=>void;onView:(view:View)=>void}>(function ZaydarCanvas({rows,selected,onSelect,onMode=()=>{},onView},ref){
 const [labels,setLabels]=useState<EventLabel[]>([]);
 const fallbackControl=useRef<ZaydarHandle>(null);
 const frame=useRef<HTMLIFrameElement>(null),latest=useRef({rows,onSelect,onMode,onView});latest.current={rows,onSelect,onMode,onView};
 const [booted,setBooted]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(''),[fallback,setFallback]=useState(false);
 const send=(type:string,data:Record<string,unknown>={})=>{fallbackControl.current?.send(type,data);frame.current?.contentWindow?.postMessage({source:'zaydar-host',type,...data},window.location.origin);};
 useImperativeHandle(ref,()=>({send}),[]);
 useEffect(()=>{
  if(booted||ready||fallback)return;
  const timer=window.setTimeout(()=>{setFallback(true);setError('3D view took too long to start. Showing the lightweight map.');},15000);
  return()=>window.clearTimeout(timer);
 },[booted,ready,fallback]);
 useEffect(()=>{const receive=(event:MessageEvent)=>{
  if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='zaydar-demo')return;
  if(event.data.type==='booted')setBooted(true);
  if(event.data.type==='ready')setReady(true);
  if(event.data.type==='labels'){
   const canvas=frame.current,viewport=event.data.viewport;
   const sourceWidth=Number(viewport?.width),sourceHeight=Number(viewport?.height);
   const scaleX=canvas&&sourceWidth>0?canvas.clientWidth/sourceWidth:1,scaleY=canvas&&sourceHeight>0?canvas.clientHeight/sourceHeight:1;
   const offsetX=canvas?.offsetLeft||0,offsetY=canvas?.offsetTop||0;
   setLabels((event.data.labels||[]).map((label:EventLabel)=>({...label,x:offsetX+label.x*scaleX,y:offsetY+label.y*scaleY,scale:(label.scale||1)*scaleX,logoY:offsetY+label.logoY*scaleY,logoWidth:label.logoWidth*scaleX,logoHeight:label.logoHeight*scaleY})));
  }
  if(event.data.type==='view')latest.current.onView(event.data);
  if(event.data.type==='fatal'){setFallback(true);setError('3D view unavailable. Showing the lightweight map.');}
  if(event.data.type==='mode')latest.current.onMode(event.data.mode);
  if(event.data.type==='select')latest.current.onSelect(event.data.key);
  if(event.data.type==='error')setError('Some map tiles could not load. Listings are still available in the search drawer.');
 };window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[]);
 const serialized=JSON.stringify(rows);
 useEffect(()=>{if(ready)send('data',{rows});},[ready,serialized]);
 useEffect(()=>{if(ready)send('select',{key:selected});},[ready,selected]);
 return <>{fallback?<ZaydarFallback ref={fallbackControl} rows={rows} onSelect={onSelect} onView={onView}/>:<iframe ref={frame} src={MAP_SRC} title="Zaylist interactive Portland metro map" className="zaydar-demo-canvas"/>} {!fallback&&labels.map(label=><ZaydarEventLabel key={label.key} label={label} onSelect={onSelect}/>)} {error&&<p className="zaydar-demo-notice" role="status">{error} <button onClick={()=>{setBooted(false);setReady(false);setError('');setFallback(false);if(frame.current)frame.current.src=MAP_SRC;}}>Retry map</button></p>}</>;
});
