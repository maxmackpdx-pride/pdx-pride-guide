import {forwardRef,useCallback,useEffect,useImperativeHandle,useLayoutEffect,useMemo,useRef,useState} from 'react';
import './MapzBootNotice.css';
import MapBootLoader from './MapBootLoader';

export type MapzHandle={send:(type:string,data?:Record<string,unknown>)=>void};
export type MapView={center:[number,number];zoom:number;pitch:number;bearing:number;bounds:{south:number;north:number;west:number;east:number}};
type Row={key:string;coordinates:number[];name:string;color:string;typeIcon?:string;logo:string;alternateLogo?:string;time?:string;avatars?:Array<{url:string;initial:string;background:string;ring:string}>};
export type MapSelectionRect={left:number;top:number;width:number;height:number};
type CanvasProps={active?:boolean;onBrowse?:()=>void;onEscape?:()=>void;onBoot?:()=>void;initialCamera?:MapView|null;rows:Row[];selected:string|null;labelsEnabled:boolean;viewTime:number;onSelect:(key:string,rect?:MapSelectionRect)=>void;onBoardPins?:(keys:string[])=>void;onCluster?:(world:string,keys:string[],bounds:number[][],zoom:number)=>void;onMode?:(mode:string)=>void;onView:(view:MapView)=>void};
type ThreeDProps=CanvasProps&{attempt:number;initialView:MapView|null;onFailure:(message:string)=>void;onVisible:()=>void};
const MAP_SRC='/mapz-map/index.html?v=20261006-shared-map';
const MAX_3D_ATTEMPTS=3;

const Mapz3D=forwardRef<MapzHandle,ThreeDProps>(function Mapz3D({active=true,rows,selected,labelsEnabled,viewTime,attempt,initialView,onFailure,onVisible,onSelect,onCluster,onBoardPins,onMode,onView,onEscape},ref){
 const frame=useRef<HTMLIFrameElement>(null),latest=useRef({onFailure,onVisible,onSelect,onCluster,onBoardPins,onMode,onView,onEscape});latest.current={onFailure,onVisible,onSelect,onCluster,onBoardPins,onMode,onView,onEscape};
 const failed=useRef(false),restoreView=useRef(initialView),interactive=useRef(false),sentSelection=useRef<{key:string|null}|null>(null);
 const [phase,setPhase]=useState('loading'),[firstFrame,setFirstFrame]=useState(false),[ready,setReady]=useState(0);
 const post=(type:string,data:Record<string,unknown>={})=>frame.current?.contentWindow?.postMessage({source:'mapz-host',type,...data},window.location.origin);
 useImperativeHandle(ref,()=>({send:post}),[]);
 const fail=useCallback((reason:string)=>{
  if(failed.current)return;
  const fatal=String(reason).startsWith('3D error:');
  if(!fatal&&firstFrame)return;
  failed.current=true;latest.current.onFailure(reason);
 },[firstFrame]);
 useEffect(()=>{
  if(firstFrame)return;
  let timer:number|undefined;
  const arm=()=>{
   window.clearTimeout(timer);
   if(document.hidden||!active)return;
   const delay=phase==='loading'?25000:35000;
   timer=window.setTimeout(()=>fail(`No visible 3D frame after ${phase}.`),delay);
  };
  arm();document.addEventListener('visibilitychange',arm);
  return()=>{window.clearTimeout(timer);document.removeEventListener('visibilitychange',arm);};
 },[phase,firstFrame,fail,active]);
 useLayoutEffect(()=>{const receive=(event:MessageEvent)=>{
  if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='mapz-demo')return;
  if(event.data.type==='phase'&&typeof event.data.phase==='string')setPhase(event.data.phase);
  if(event.data.type==='first-frame'){failed.current=false;setFirstFrame(true);latest.current.onVisible();}
  if(event.data.type==='ready'){interactive.current=true;setReady(value=>value+1);}
  if(event.data.type==='escape')latest.current.onEscape?.();
  if(event.data.type==='view'){if(interactive.current)restoreView.current=event.data;latest.current.onView(event.data);}
  if(event.data.type==='fatal'){
   const detail=typeof event.data.message==='string'?event.data.message.slice(0,300):'Unknown graphics error.';
   fail(`3D error: ${detail}`);
  }
  if(event.data.type==='mode')latest.current.onMode?.(event.data.mode);
  if(event.data.type==='cluster'&&typeof event.data.world==='string'&&Array.isArray(event.data.keys))latest.current.onCluster?.(event.data.world,event.data.keys,event.data.bounds,event.data.zoom);
  if(event.data.type==='board-pins'&&Array.isArray(event.data.keys))latest.current.onBoardPins?.(event.data.keys);
  if(event.data.type==='select'){
   const source=event.data.rect,frameRect=frame.current?.getBoundingClientRect();
   const rect=source&&frameRect&&[source.left,source.top,source.width,source.height].every(Number.isFinite)
    ?{left:frameRect.left+source.left,top:frameRect.top+source.top,width:source.width,height:source.height}:undefined;
   latest.current.onSelect(event.data.key,rect);
  }
 };window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[fail]);
 const serialized=useMemo(()=>JSON.stringify(rows),[rows]);
 useEffect(()=>{if(ready&&active)post('data',{rows});},[ready,serialized,active]);
 useEffect(()=>{if(ready)post('visibility',{active});},[ready,active]);
 useEffect(()=>{if(ready&&restoreView.current)post('view',{center:restoreView.current.center,zoom:restoreView.current.zoom,pitch:restoreView.current.pitch,bearing:restoreView.current.bearing});},[ready]);
 useEffect(()=>{if(!ready||!active||sentSelection.current?.key===selected)return;sentSelection.current={key:selected};post('select',{key:selected});},[ready,selected,active]);
 useEffect(()=>{if(ready)post('labels',{enabled:labelsEnabled});},[ready,labelsEnabled]);
 useEffect(()=>{if(ready)post('time',{timestamp:viewTime});},[ready,viewTime]);
 useEffect(()=>{
  const node=frame.current;
  if(!node)return;
  const hello=()=>{failed.current=false;interactive.current=false;sentSelection.current=null;setReady(0);setFirstFrame(false);setPhase('loading');post('hello');};
  node.addEventListener('load',hello);
  if(node.contentDocument?.readyState==='complete')hello();
  return()=>node.removeEventListener('load',hello);
 },[attempt]);
 const cameraParams=useMemo(()=>initialView?new URLSearchParams({lat:String(initialView.center[0]),lng:String(initialView.center[1]),zoom:String(initialView.zoom),pitch:String(initialView.pitch??48),bearing:String(initialView.bearing??0)}).toString():"",[]);
 return <iframe ref={frame} src={`${MAP_SRC}&attempt=${attempt}&${cameraParams}${onEscape?"&escape=host":""}`} title="Zaylist interactive Portland metro map" className="mapz-demo-canvas"/>;
});

export default forwardRef<MapzHandle,CanvasProps>(function MapzCanvas(props,ref){
 const activeControl=useRef<MapzHandle>(null),lastView=useRef<MapView|null>(props.initialCamera || null);
 const attempts=useRef(0),visible=useRef(false),pendingRecovery=useRef<string|null>(null);
 const active=props.active!==false;
 const [generation,setGeneration]=useState(0),[bootError,setBootError]=useState(''),[stopped,setStopped]=useState(false),[shown,setShown]=useState(false);
 // Bound consecutive failures, without exhausting recovery after a healthy visit.
 useEffect(()=>{
  if(!shown||stopped)return;
  const timer=window.setTimeout(()=>{attempts.current=0;},30000);
  return()=>window.clearTimeout(timer);
 },[shown,stopped,generation]);
 const reportView=(view:MapView)=>{lastView.current=view;props.onView(view);};
 const retry=()=>{attempts.current=0;visible.current=false;setStopped(false);setShown(false);setBootError('');setGeneration(value=>value+1);};
 const recover=(reason:string)=>{
  if(!active){pendingRecovery.current=reason;return;}
  console.warn("Map loading failed:", reason);
  attempts.current+=1;
  if(attempts.current<MAX_3D_ATTEMPTS){
   visible.current=false;setShown(false);
   setGeneration(value=>value+1);
  }else{setStopped(true);setBootError('The map couldn’t load. Try loading it again.');}
 };
 useEffect(()=>{if(active&&pendingRecovery.current){const reason=pendingRecovery.current;pendingRecovery.current=null;recover(reason);}},[active]);
 useImperativeHandle(ref,()=>({send:(type,data={})=>activeControl.current?.send(type,data)}),[]);
 return <>
  <Mapz3D key={generation} ref={activeControl} {...props} attempt={generation} initialView={lastView.current} onFailure={recover} onVisible={()=>{if(visible.current)return;visible.current=true;setShown(true);props.onBoot?.();window.dispatchEvent(new CustomEvent('zaylist:map-ready',{detail:{map:'mapz'}}));}} onView={reportView}/>
  {!shown&&active&&<MapBootLoader map="mapz" overlay error={stopped?bootError:undefined} onRetry={retry} onBrowse={props.onBrowse}/>}
 </>;
});
