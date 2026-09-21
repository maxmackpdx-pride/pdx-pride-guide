import ZaydarEventLabel,{type EventLabel} from './ZaydarEventLabel';
import {forwardRef,useCallback,useEffect,useImperativeHandle,useRef,useState} from 'react';

export type ZaydarHandle={send:(type:string,data?:Record<string,unknown>)=>void};
type View={center:[number,number];zoom:number;bounds:{south:number;north:number;west:number;east:number}};
type Row={key:string;coordinates:number[];name:string;color:string;typeIcon?:string;logo:string;alternateLogo?:string;time?:string};
type CanvasProps={rows:Row[];selected:string|null;labelsEnabled:boolean;viewTime:number;onSelect:(key:string)=>void;onMode?:(mode:string)=>void;onView:(view:View)=>void};
type ThreeDProps=CanvasProps&{attempt:number;initialView:View|null;onFailure:(message:string)=>void;onVisible:()=>void};
const MAP_SRC='/zaydar-map/index.html?v=20260920-placez-fit-v3';
const MAX_3D_ATTEMPTS=3;

const Zaydar3D=forwardRef<ZaydarHandle,ThreeDProps>(function Zaydar3D({rows,selected,labelsEnabled,viewTime,attempt,initialView,onFailure,onVisible,onSelect,onMode,onView},ref){
 const [labels,setLabels]=useState<EventLabel[]>([]);
 const frame=useRef<HTMLIFrameElement>(null),latest=useRef({onFailure,onVisible,onSelect,onMode,onView});latest.current={onFailure,onVisible,onSelect,onMode,onView};
 const failed=useRef(false),restoreView=useRef(initialView);
 const [phase,setPhase]=useState('loading'),[firstFrame,setFirstFrame]=useState(false),[ready,setReady]=useState(false);
 const post=(type:string,data:Record<string,unknown>={})=>frame.current?.contentWindow?.postMessage({source:'zaydar-host',type,...data},window.location.origin);
 useImperativeHandle(ref,()=>({send:post}),[]);
 const fail=useCallback((reason:string)=>{
  if(failed.current)return;
  failed.current=true;latest.current.onFailure(reason);
 },[]);
 useEffect(()=>{
  if(firstFrame)return;
  let timer:number|undefined;
  const arm=()=>{
   window.clearTimeout(timer);
   // Background tabs cannot render frames. Do not count suspended time as a failure.
   if(document.hidden)return;
   const delay=phase==='loading'?25000:60000;
   timer=window.setTimeout(()=>fail(`No visible 3D frame after ${phase}.`),delay);
  };
  arm();document.addEventListener('visibilitychange',arm);
  return()=>{window.clearTimeout(timer);document.removeEventListener('visibilitychange',arm);};
 },[phase,firstFrame,fail]);
 useEffect(()=>{const receive=(event:MessageEvent)=>{
  if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='zaydar-demo'||failed.current)return;
  if(event.data.type==='phase'&&typeof event.data.phase==='string')setPhase(event.data.phase);
  if(event.data.type==='first-frame'){setFirstFrame(true);latest.current.onVisible();}
  if(event.data.type==='ready')setReady(true);
  if(event.data.type==='labels'){
   const canvas=frame.current,viewport=event.data.viewport;
   const sourceWidth=Number(viewport?.width),sourceHeight=Number(viewport?.height);
   const scaleX=canvas&&sourceWidth>0?canvas.clientWidth/sourceWidth:1,scaleY=canvas&&sourceHeight>0?canvas.clientHeight/sourceHeight:1;
   const offsetX=canvas?.offsetLeft||0,offsetY=canvas?.offsetTop||0;
   setLabels((event.data.labels||[]).map((label:EventLabel)=>({...label,x:offsetX+label.x*scaleX,y:offsetY+label.y*scaleY,scale:(label.scale||1)*scaleX,logoY:offsetY+label.logoY*scaleY,logoWidth:label.logoWidth*scaleX,logoHeight:label.logoHeight*scaleY})));
  }
  if(event.data.type==='view')latest.current.onView(event.data);
  if(event.data.type==='fatal'){
   const detail=typeof event.data.message==='string'?event.data.message.slice(0,300):'Unknown graphics error.';
   fail(`3D error: ${detail}`);
  }
  if(event.data.type==='mode')latest.current.onMode?.(event.data.mode);
  if(event.data.type==='select')latest.current.onSelect(event.data.key);
 };window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[fail]);
 const serialized=JSON.stringify(rows);
 useEffect(()=>{if(ready)post('data',{rows});},[ready,serialized]);
 useEffect(()=>{if(ready&&restoreView.current)post('view',{center:restoreView.current.center,zoom:restoreView.current.zoom});},[ready]);
 useEffect(()=>{if(ready)post('select',{key:selected});},[ready,selected]);
 useEffect(()=>{if(ready)post('labels',{enabled:labelsEnabled});},[ready,labelsEnabled]);
 useEffect(()=>{if(ready)post('time',{timestamp:viewTime});},[ready,viewTime]);
 return <><iframe ref={frame} src={`${MAP_SRC}&attempt=${attempt}`} title="Zaylist interactive Portland metro map" className="zaydar-demo-canvas"/>{labels.map(label=><ZaydarEventLabel key={label.key} label={label} onSelect={onSelect}/>)}</>;
});

// Leaflet is deliberately disconnected. Its component is retained separately,
// but this route never imports, mounts, preloads, or falls back to it.
export default forwardRef<ZaydarHandle,CanvasProps>(function ZaydarCanvas(props,ref){
 const activeControl=useRef<ZaydarHandle>(null),lastView=useRef<View|null>(null);
 const attempts=useRef(0);
 const [generation,setGeneration]=useState(0),[notice,setNotice]=useState(''),[stopped,setStopped]=useState(false);
 const reportView=(view:View)=>{lastView.current=view;props.onView(view);};
 const retry=()=>{attempts.current=0;setStopped(false);setNotice('Restarting 3D map…');setGeneration(value=>value+1);};
 const recover=(reason:string)=>{
  attempts.current+=1;
  if(attempts.current<MAX_3D_ATTEMPTS){
   setNotice(`Restarting 3D (${attempts.current+1}/${MAX_3D_ATTEMPTS}). ${reason}`);
   setGeneration(value=>value+1);
  }else{setStopped(true);setNotice(reason);}
 };
 useImperativeHandle(ref,()=>({send:(type,data={})=>activeControl.current?.send(type,data)}),[]);
 return <>
  <Zaydar3D key={generation} ref={activeControl} {...props} attempt={generation} initialView={lastView.current} onFailure={recover} onVisible={()=>setNotice('')} onView={reportView}/>
  {notice&&<p className="zaydar-demo-notice" role={stopped?'alert':'status'}>{notice} {stopped&&<button onClick={retry}>Retry 3D</button>}</p>}
 </>;
});
