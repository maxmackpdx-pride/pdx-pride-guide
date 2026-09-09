import ZaydarEventLabel,{type EventLabel} from './ZaydarEventLabel';
import ZaydarFallback from './ZaydarFallback';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
export type ZaydarHandle={send:(type:string,data?:Record<string,unknown>)=>void};
type View={center:[number,number];zoom:number;bounds:{south:number;north:number;west:number;east:number}};
type Row={key:string;coordinates:number[];name:string;color:string;logo:string;alternateLogo?:string;time?:string};
export default forwardRef<ZaydarHandle,{rows:Row[];selected:string|null;onSelect:(key:string)=>void;onMode:(mode:string)=>void;onView:(view:View)=>void}>(function ZaydarCanvas({rows,selected,onSelect,onMode,onView},ref){
 const [labels,setLabels]=useState<EventLabel[]>([]);
 const fallbackControl=useRef<ZaydarHandle>(null);
 const frame=useRef<HTMLIFrameElement>(null),latest=useRef({rows,onSelect,onMode,onView});latest.current={rows,onSelect,onMode,onView};
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[fallback,setFallback]=useState(false);
 const send=(type:string,data:Record<string,unknown>={})=>{fallbackControl.current?.send(type,data);frame.current?.contentWindow?.postMessage({source:'zaydar-host',type,...data},window.location.origin);};
 useImperativeHandle(ref,()=>({send}),[]);
 useEffect(()=>{const receive=(event:MessageEvent)=>{
  if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='zaydar-demo')return;
  if(event.data.type==='ready'){setReady(true);send('data',{rows:latest.current.rows});}
  if(event.data.type==='labels')setLabels(event.data.labels);
  if(event.data.type==='view')latest.current.onView(event.data);
  if(event.data.type==='fatal'){setFallback(true);setError('3D view unavailable. Showing the lightweight map.');}
  if(event.data.type==='mode')latest.current.onMode(event.data.mode);
  if(event.data.type==='select')latest.current.onSelect(event.data.key);
  if(event.data.type==='error')setError('Some map tiles could not load. Listings are still available in Results.');
 };window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[]);
 const serialized=JSON.stringify(rows);
 useEffect(()=>{if(!ready)return;send('data',{rows});const timer=window.setInterval(()=>send('data',{rows:latest.current.rows}),60000);return()=>window.clearInterval(timer);},[ready,serialized]);
 useEffect(()=>{if(ready)send('select',{key:selected});},[ready,selected]);
 return <>{fallback?<ZaydarFallback ref={fallbackControl} rows={rows} onSelect={onSelect} onView={onView}/>:<iframe ref={frame} src="/zaydar-map/index.html" title="Zaydar interactive Portland metro map" className="zaydar-demo-canvas" onLoad={()=>send('data',{rows:latest.current.rows})}/>} {!fallback&&labels.map(label=><ZaydarEventLabel key={label.key} label={label} onSelect={onSelect}/>)} {error&&<p className="zaydar-demo-notice" role="status">{error} <button onClick={()=>{setError('');setFallback(false);if(frame.current)frame.current.src='/zaydar-map/index.html';}}>Retry map</button></p>}</>;
});
