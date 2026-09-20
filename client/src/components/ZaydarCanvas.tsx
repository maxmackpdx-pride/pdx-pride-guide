import ZaydarEventLabel,{type EventLabel} from './ZaydarEventLabel';
import {forwardRef,lazy,Suspense,useEffect,useImperativeHandle,useRef,useState} from 'react';

export type ZaydarHandle={send:(type:string,data?:Record<string,unknown>)=>void};
export type ZaydarRenderer='3d'|'2d';
type View={center:[number,number];zoom:number;bounds:{south:number;north:number;west:number;east:number}};
type Row={key:string;coordinates:number[];name:string;color:string;typeIcon?:string;logo:string;alternateLogo?:string;time?:string};
type CanvasProps={rows:Row[];selected:string|null;renderer:ZaydarRenderer;labelsEnabled:boolean;onRendererChange:(renderer:ZaydarRenderer)=>void;onSelect:(key:string)=>void;onMode?:(mode:string)=>void;onView:(view:View)=>void};
type ThreeDProps={rows:Row[];selected:string|null;labelsEnabled:boolean;initialView:View|null;onFailure:(message:string)=>void;onNotice:(message:string)=>void;onSelect:(key:string)=>void;onMode:(mode:string)=>void;onView:(view:View)=>void};
const MAP_SRC='/zaydar-map/index.html?v=20260920-tile-proxy';
const DEFAULT_VIEW:View={center:[45.523,-122.676],zoom:13,bounds:{south:45.2,north:45.85,west:-123.15,east:-122.15}};
const ZaydarFallback=lazy(()=>import('./ZaydarFallback'));

const Zaydar3D=forwardRef<ZaydarHandle,ThreeDProps>(function Zaydar3D({rows,selected,labelsEnabled,initialView,onFailure,onNotice,onSelect,onMode,onView},ref){
 const [labels,setLabels]=useState<EventLabel[]>([]);
 const frame=useRef<HTMLIFrameElement>(null),latest=useRef({onFailure,onNotice,onSelect,onMode,onView});latest.current={onFailure,onNotice,onSelect,onMode,onView};
 const [phase,setPhase]=useState('loading'),[firstFrame,setFirstFrame]=useState(false),[ready,setReady]=useState(false);
 const post=(type:string,data:Record<string,unknown>={})=>frame.current?.contentWindow?.postMessage({source:'zaydar-host',type,...data},window.location.origin);
 useImperativeHandle(ref,()=>({send:post}),[]);
 useEffect(()=>{
  if(firstFrame)return;
  const delay=phase==='loading'?15000:45000;
  const timer=window.setTimeout(()=>latest.current.onFailure('3D view could not produce a visible frame. Showing the lightweight map.'),delay);
  return()=>window.clearTimeout(timer);
 },[phase,firstFrame]);
 useEffect(()=>{const receive=(event:MessageEvent)=>{
  if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='zaydar-demo')return;
  if(event.data.type==='phase'&&typeof event.data.phase==='string')setPhase(event.data.phase);
  if(event.data.type==='first-frame')setFirstFrame(true);
  if(event.data.type==='ready')setReady(true);
  if(event.data.type==='labels'){
   const canvas=frame.current,viewport=event.data.viewport;
   const sourceWidth=Number(viewport?.width),sourceHeight=Number(viewport?.height);
   const scaleX=canvas&&sourceWidth>0?canvas.clientWidth/sourceWidth:1,scaleY=canvas&&sourceHeight>0?canvas.clientHeight/sourceHeight:1;
   const offsetX=canvas?.offsetLeft||0,offsetY=canvas?.offsetTop||0;
   setLabels((event.data.labels||[]).map((label:EventLabel)=>({...label,x:offsetX+label.x*scaleX,y:offsetY+label.y*scaleY,scale:(label.scale||1)*scaleX,logoY:offsetY+label.logoY*scaleY,logoWidth:label.logoWidth*scaleX,logoHeight:label.logoHeight*scaleY})));
  }
  if(event.data.type==='view')latest.current.onView(event.data);
  if(event.data.type==='fatal')latest.current.onFailure('3D view unavailable. Showing the lightweight map.');
  if(event.data.type==='mode')latest.current.onMode(event.data.mode);
  if(event.data.type==='select')latest.current.onSelect(event.data.key);
  if(event.data.type==='error')latest.current.onNotice('Some map tiles could not load. Listings are still available in the layer sheet.');
 };window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[]);
 const serialized=JSON.stringify(rows);
 useEffect(()=>{if(ready)post('data',{rows});},[ready,serialized]);
 useEffect(()=>{if(ready)post('select',{key:selected});},[ready,selected]);
 useEffect(()=>{if(ready)post('labels',{enabled:labelsEnabled});},[ready,labelsEnabled]);
 useEffect(()=>{if(ready&&initialView)post('view',{center:initialView.center,zoom:initialView.zoom});},[ready]);
 return <><iframe ref={frame} src={MAP_SRC} title="Zaylist interactive Portland metro map" className="zaydar-demo-canvas"/>{labels.map(label=><ZaydarEventLabel key={label.key} label={label} onSelect={onSelect}/>)}</>;
});

export default forwardRef<ZaydarHandle,CanvasProps>(function ZaydarCanvas({rows,selected,renderer,labelsEnabled,onRendererChange,onSelect,onMode=()=>{},onView},ref){
 const activeControl=useRef<ZaydarHandle>(null),lastView=useRef<View|null>(null);
 const [error,setError]=useState('');
 const reportView=(view:View)=>{lastView.current=view;onView(view);};
 const failTo2D=(message:string)=>{setError(message);onRendererChange('2d');};
 useImperativeHandle(ref,()=>({send:(type,data={})=>activeControl.current?.send(type,data)}),[]);
 useEffect(()=>{if(renderer==='3d')setError('');},[renderer]);
 return <>
  {renderer==='3d'
   ?<Zaydar3D ref={activeControl} rows={rows} selected={selected} labelsEnabled={labelsEnabled} initialView={lastView.current} onFailure={failTo2D} onNotice={setError} onSelect={onSelect} onMode={onMode} onView={reportView}/>
   :<Suspense fallback={<p className="zaydar-demo-notice" role="status">Loading lightweight 2D map...</p>}><ZaydarFallback ref={activeControl} rows={rows} selected={selected} labelsEnabled={labelsEnabled} initialView={lastView.current||DEFAULT_VIEW} onSelect={onSelect} onView={reportView}/></Suspense>
  }
  {error&&renderer==='2d'&&<p className="zaydar-demo-notice" role="status">{error} <button onClick={()=>onRendererChange('3d')}>Retry 3D</button></p>}
  {error&&renderer==='3d'&&<p className="zaydar-demo-notice" role="status">{error}</p>}
 </>;
});
