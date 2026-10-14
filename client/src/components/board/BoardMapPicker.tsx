import { acquireBoardMapPicker } from "@/lib/boardMapPickerActivity";
import { withinHousingBounds } from "@shared/housing";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import MapzCanvas, { type MapzHandle, type MapView } from "../MapzCanvas";
import BoardPushPin from "./BoardPushPin";
import { apiRequest } from "@/lib/queryClient";
import "./BoardMapPlacement.css";
export type BoardMapPoint = {lat:number;lng:number;days?:number;venueId?:number|null;keepUntil?:string};
export type BoardMapVenue = {lat:number;lng:number;name:string;venueId:number};
const metres = (a:BoardMapPoint,b:BoardMapPoint) => Math.hypot((a.lat-b.lat)*111320,(a.lng-b.lng)*111320*Math.cos(a.lat*Math.PI/180));
export default function BoardMapPicker({value,housing=false,maxDays=14,renewal=false,venue,saving=false,error,confirmLabel="Save placement",onCancel,onConfirm}: {
 housing?:boolean;saving?:boolean;error?:string;confirmLabel?:string;value:BoardMapPoint|null;maxDays?:number;renewal?:boolean;venue?:BoardMapVenue|null;onCancel:()=>void;onConfirm:(p:BoardMapPoint)=>void;
}) {
 const dialog=useRef<HTMLDialogElement>(null),map=useRef<MapzHandle>(null);
 const initialPoint=useRef<BoardMapPoint>(value || venue || {lat:45.5231,lng:-122.6765});
 const [point,setPoint]=useState(initialPoint.current);
 const [chosen,setChosen]=useState(Boolean(value || venue));
 const [durationChanged,setDurationChanged]=useState(false);
 const [days,setDays]=useState(Math.min(value?.days || 7,maxDays));
 const [viewTime]=useState(Date.now);
 const [ready,setReady]=useState(false),[fine,setFine]=useState(false);
 const [atVenue,setAtVenue]=useState(Boolean(venue && (!value || value.venueId)));
 const camera=useRef<MapView>({center:[point.lat,point.lng],zoom:17,pitch:0,bearing:0,bounds:{south:45.2,north:45.85,west:-123.15,east:-122.15}});
 const waypoints=useQuery<Array<BoardMapPoint&{name:string}>>({queryKey:["/api/board-map-waypoints"],queryFn:()=>apiRequest("GET","/api/board-map-waypoints").then(r=>r.json())});
 const cancel=useRef(onCancel),busy=useRef(saving);cancel.current=onCancel;busy.current=saving;
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement;dialog.current?.showModal();
  const releaseMap=acquireBoardMapPicker();
  // Native top-layer dialog owns focus above a composer or card's custom trap.
  const keyboard=(e:KeyboardEvent)=>{if((e.key==="Escape"||e.key==="Tab")&&dialog.current?.open){e.stopPropagation();if(e.key==="Escape"){e.preventDefault();if(!busy.current)cancel.current();}}};
  window.addEventListener("keydown",keyboard,true);
  return()=>{releaseMap();window.removeEventListener("keydown",keyboard,true);previous?.focus();};
 },[]);
 const target=atVenue && venue?venue:point;
 const blocked=!atVenue && waypoints.data?.some(w=>metres(w,target)<18);
 const outside=housing?!withinHousingBounds(target.lat,target.lng):target.lat<45.2 || target.lat>45.85 || target.lng< -123.15 || target.lng> -122.15;
 const nudge=(lat:number,lng:number)=>{
   const next={...camera.current,center:[target.lat+lat,target.lng+lng] as [number,number]};
   setChosen(true);setPoint(p=>({...p,lat:next.center[0],lng:next.center[1]}));setAtVenue(false);
   map.current?.send("view",next);
 };
 const waypointColor=getComputedStyle(document.documentElement).getPropertyValue("--day-thu").trim();
 const rows=useMemo(()=>(waypoints.data || []).map((w,i)=>({key:`placement-${i}`,coordinates:[w.lng,w.lat],name:w.name,color:waypointColor,logo:"",kind:"place",waypointFamily:"places"})),[waypoints.data,waypointColor]);
 const keepExpiry=Boolean(value?.keepUntil && !durationChanged);
 const status=!ready?"Loading map…":waypoints.isPending?"Checking nearby waypoints…":!chosen?"Choose a spot before saving.":null;
 const close=()=>{if(!saving)onCancel();};
 return createPortal(<dialog ref={dialog} className="board-pin-picker" aria-labelledby="pin-picker-title" aria-describedby="pin-picker-help" onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{if(e.key==="Escape")e.stopPropagation();}}>
   <MapzCanvas ref={map} onEscape={close} rows={rows} selected={null} labelsEnabled viewTime={viewTime} initialCamera={camera.current} onSelect={()=>{}} onBoot={()=>setReady(true)} onView={v=>{
     camera.current={center:v.center,zoom:v.zoom,pitch:v.pitch,bearing:v.bearing,bounds:v.bounds};
     const next={lat:v.center[0],lng:v.center[1]};
     if(metres(initialPoint.current,next)>1)setChosen(true);
     setPoint(p=>({...p,...next}));
     if(venue && metres(venue,next)>2)setAtVenue(false);
   }} />
   <div className="board-pin-picker__heading"><h2 id="pin-picker-title">Place your pin</h2><button type="button" disabled={saving} onClick={close}>Cancel</button></div>
   <div className="board-pin-picker__target pdx-glass-rebind" aria-hidden="true"><BoardPushPin postKey="placement-preview"/><span>+</span></div>
   <div className="board-pin-picker__controls">
    <div className="board-pin-picker__body">
     <p id="pin-picker-help">{atVenue?`Beside ${venue?.name}`:"Move the map under your pin, or use Adjust position."}</p>
     <small>This pin is public. Choose a nearby corner for a private home or handoff.</small>
     {venue && <label><input type="checkbox" disabled={saving || !ready} checked={atVenue} onChange={e=>{setAtVenue(e.target.checked);if(e.target.checked){setChosen(true);map.current?.send("view",{...camera.current,center:[venue.lat,venue.lng]});}}}/> Place beside the linked venue</label>}
     <div className="board-pin-picker__row"><label>Duration <select aria-label="Days on map" disabled={saving} value={keepExpiry?"keep":days} onChange={e=>{setDurationChanged(e.target.value!=="keep");if(e.target.value!=="keep")setDays(Number(e.target.value));}}>
       {value?.keepUntil && <option value="keep">Keep current expiry</option>}
       {Array.from({length:maxDays},(_,i)=><option key={i+1} value={i+1}>{i+1} {i===0?"day":"days"}</option>)}
     </select></label><button type="button" disabled={saving || !ready} aria-expanded={fine} aria-controls="pin-position-buttons" onClick={()=>setFine(!fine)}>Adjust position</button></div>
     {fine && <div id="pin-position-buttons" className="board-pin-picker__fine" role="group" aria-label="Adjust pin position"><button type="button" disabled={saving} onClick={()=>map.current?.send("zoom",{delta:1})} aria-label="Zoom in">+</button><button type="button" disabled={saving} onClick={()=>map.current?.send("zoom",{delta:-1})} aria-label="Zoom out">−</button>{([["North",.000045,0],["West",0,-.000064],["East",0,.000064],["South",-.000045,0]] as const).map(([label,lat,lng])=><button type="button" disabled={saving} key={label} onClick={()=>nudge(lat,lng)} aria-label={`Move pin 5 metres ${label.toLowerCase()}`}>{label}</button>)}</div>}
     {keepExpiry && <small>Still expires {new Date(value!.keepUntil!).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}. Moving your pin won’t extend it.</small>}
     {renewal && <small>After the first 14 days, each new placement lasts up to 5 days.</small>}
    </div>
    <div className="board-pin-picker__feedback">
     {waypoints.isError?<p role="alert">Nearby waypoints couldn’t load. <button type="button" onClick={()=>void waypoints.refetch()}>Retry</button></p>:outside?<p role="alert">{housing?"Choose a point from the Portland metro area through Salem.":"Choose a point in the Portland metro area."}</p>:blocked?<p role="status">Move a little farther from the existing waypoint.</p>:status?<p role="status">{status}</p>:null}
     {error && <p role="alert">{error}</p>}
    </div>
    <button className="board-pin-picker__confirm" type="button" disabled={saving || !ready || !chosen || !waypoints.isSuccess || blocked || outside} onClick={()=>onConfirm({...target,days,venueId:atVenue?venue?.venueId:null,keepUntil:keepExpiry?value?.keepUntil:undefined})}>{saving?"Saving…":confirmLabel}</button>
   </div>
 </dialog>,document.body);
}
