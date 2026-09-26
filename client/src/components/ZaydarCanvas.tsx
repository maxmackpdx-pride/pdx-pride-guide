import {forwardRef,useCallback,useEffect,useImperativeHandle,useLayoutEffect,useMemo,useRef,useState} from 'react';
import './ZaydarBootNotice.css';

export type ZaydarHandle={send:(type:string,data?:Record<string,unknown>)=>void};
export type MapView={center:[number,number];zoom:number;bounds:{south:number;north:number;west:number;east:number}};
type Row={key:string;coordinates:number[];name:string;color:string;typeIcon?:string;logo:string;alternateLogo?:string;time?:string;avatars?:Array<{url:string;initial:string;background:string;ring:string}>};
export type MapSelectionRect={left:number;top:number;width:number;height:number};
type CanvasProps={initialCamera?:MapView|null;rows:Row[];selected:string|null;labelsEnabled:boolean;viewTime:number;onSelect:(key:string,rect?:MapSelectionRect)=>void;onCluster?:(world:string,keys:string[],bounds:number[][],zoom:number)=>void;onMode?:(mode:string)=>void;onView:(view:MapView)=>void};
type ThreeDProps=CanvasProps&{attempt:number;initialView:MapView|null;onFailure:(message:string)=>void;onVisible:()=>void};
const MAP_SRC='/zaydar-map/index.html?v=20260926-flow-cut';
const BOOT_COPY='Your super gay city is loading.';
const MAX_3D_ATTEMPTS=3;
const ALIVE_PHASES=new Set(['map-created','map-loaded','first-frame']);

const Zaydar3D=forwardRef<ZaydarHandle,ThreeDProps>(function Zaydar3D({rows,selected,labelsEnabled,viewTime,attempt,initialView,onFailure,onVisible,onSelect,onCluster,onMode,onView},ref){
 const frame=useRef<HTMLIFrameElement>(null),latest=useRef({onFailure,onVisible,onSelect,onCluster,onMode,onView});latest.current={onFailure,onVisible,onSelect,onCluster,onMode,onView};
 const failed=useRef(false),restoreView=useRef(initialView);
 const [phase,setPhase]=useState('loading'),[firstFrame,setFirstFrame]=useState(false),[ready,setReady]=useState(false);
 const post=(type:string,data:Record<string,unknown>={})=>frame.current?.contentWindow?.postMessage({source:'zaydar-host',type,...data},window.location.origin);
 useImperativeHandle(ref,()=>({send:post}),[]);
 const fail=useCallback((reason:string)=>{
  if(failed.current)return;
  const fatal=String(reason).startsWith('3D error:');
  if(!fatal&&(firstFrame||ready||ALIVE_PHASES.has(phase)))return;
  failed.current=true;latest.current.onFailure(reason);
 },[firstFrame,phase,ready]);
 useEffect(()=>{
  if(firstFrame||ready)return;
  let timer:number|undefined;
  const arm=()=>{
   window.clearTimeout(timer);
   if(document.hidden)return;
   const delay=phase==='loading'?25000:60000;
   timer=window.setTimeout(()=>fail(`No visible 3D frame after ${phase}.`),delay);
  };
  arm();document.addEventListener('visibilitychange',arm);
  return()=>{window.clearTimeout(timer);document.removeEventListener('visibilitychange',arm);};
 },[phase,firstFrame,ready,fail]);
 useLayoutEffect(()=>{const receive=(event:MessageEvent)=>{
  if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='zaydar-demo')return;
  if(event.data.type==='phase'&&typeof event.data.phase==='string'){setPhase(event.data.phase);if(event.data.phase==='map-created'||event.data.phase==='map-loaded'||event.data.phase==='first-frame')latest.current.onVisible();}
  if(event.data.type==='first-frame'){failed.current=false;setFirstFrame(true);latest.current.onVisible();}
  if(event.data.type==='ready'){setReady(true);latest.current.onVisible();}
  if(event.data.type==='view')latest.current.onView(event.data);
  if(event.data.type==='fatal'){
   const detail=typeof event.data.message==='string'?event.data.message.slice(0,300):'Unknown graphics error.';
   fail(`3D error: ${detail}`);
  }
  if(event.data.type==='mode')latest.current.onMode?.(event.data.mode);
  if(event.data.type==='cluster'&&typeof event.data.world==='string'&&Array.isArray(event.data.keys))latest.current.onCluster?.(event.data.world,event.data.keys,event.data.bounds,event.data.zoom);
  if(event.data.type==='select'){
   const source=event.data.rect,frameRect=frame.current?.getBoundingClientRect();
   const rect=source&&frameRect&&[source.left,source.top,source.width,source.height].every(Number.isFinite)
    ?{left:frameRect.left+source.left,top:frameRect.top+source.top,width:source.width,height:source.height}:undefined;
   latest.current.onSelect(event.data.key,rect);
  }
 };window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[fail]);
 const serialized=useMemo(()=>JSON.stringify(rows),[rows]);
 useEffect(()=>{if(ready)post('data',{rows});},[ready,serialized]);
 useEffect(()=>{if(ready&&restoreView.current)post('view',{center:restoreView.current.center,zoom:restoreView.current.zoom});},[ready]);
 useEffect(()=>{if(ready)post('select',{key:selected});},[ready,selected]);
 useEffect(()=>{if(ready)post('labels',{enabled:labelsEnabled});},[ready,labelsEnabled]);
 useEffect(()=>{if(ready)post('time',{timestamp:viewTime});},[ready,viewTime]);
 useEffect(()=>{
  const node=frame.current;
  if(!node)return;
  const hello=()=>post('hello');
  node.addEventListener('load',hello);
  if(node.contentDocument?.readyState==='complete')hello();
  return()=>node.removeEventListener('load',hello);
 },[attempt]);
 return <iframe ref={frame} src={`${MAP_SRC}&attempt=${attempt}`} title="Zaylist interactive Portland metro map" className="zaydar-demo-canvas" onLoad={()=>post('hello')}/>;
});

export default forwardRef<ZaydarHandle,CanvasProps>(function ZaydarCanvas(props,ref){
 const activeControl=useRef<ZaydarHandle>(null),lastView=useRef<MapView|null>(props.initialCamera || null);
 const attempts=useRef(0),seenCity=useRef(false);
 const [generation,setGeneration]=useState(0),[notice,setNotice]=useState(BOOT_COPY),[stopped,setStopped]=useState(false);
 const reportView=(view:MapView)=>{lastView.current=view;props.onView(view);};
 const retry=()=>{attempts.current=0;seenCity.current=false;setStopped(false);setNotice(BOOT_COPY);setGeneration(value=>value+1);};
 const recover=(reason:string)=>{
  console.warn("Map loading failed:", reason);
  attempts.current+=1;
  if(attempts.current<MAX_3D_ATTEMPTS){
   setNotice('The map is taking longer than expected. Trying again.');
   setGeneration(value=>value+1);
  }else{setStopped(true);setNotice('The map couldn\u2019t load. You can still browse listings in Map controls.');}
 };
 useImperativeHandle(ref,()=>({send:(type,data={})=>activeControl.current?.send(type,data)}),[]);
 useEffect(()=>{
  seenCity.current=false;
  const later=window.setTimeout(()=>{if(!seenCity.current&&!stopped)setNotice('Loading map.');},12000);
  return()=>window.clearTimeout(later);
 },[generation,stopped]);
 const offerReload=stopped||notice.startsWith('Loading')||notice.startsWith('The map');
 return <>
  <Zaydar3D key={generation} ref={activeControl} {...props} attempt={generation} initialView={lastView.current} onFailure={recover} onVisible={()=>{seenCity.current=true;setNotice('');}} onView={reportView}/>
  {notice&&<p className="zaydar-demo-notice" role={stopped?'alert':'status'}><span>{notice}</span>{offerReload&&<button onClick={retry}>Reload map</button>}</p>}
 </>;
});
