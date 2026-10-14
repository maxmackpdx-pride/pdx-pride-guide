import { withinHousingBounds } from "@shared/housing";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import MapzCanvas, { type MapzHandle, type MapView } from "../MapzCanvas";
import BoardPushPin from "./BoardPushPin";
import { apiRequest } from "@/lib/queryClient";
import "./BoardMapPlacement.css";
export type BoardMapPoint = {lat:number;lng:number;days?:number;venueId?:number|null;keepUntil?:string};
export type BoardMapVenue = {lat:number;lng:number;name:string;venueId:number};
const metres = (a:BoardMapPoint,b:BoardMapPoint) => Math.hypot((a.lat-b.lat)*111320,(a.lng-b.lng)*111320*Math.cos(a.lat*Math.PI/180));
export default function BoardMapPicker({value,housing=false,maxDays=14,renewal=false,venue,saving=false,error,onCancel,onConfirm}: {
 housing?:boolean;saving?:boolean;error?:string;value:BoardMapPoint|null;maxDays?:number;renewal?:boolean;venue?:BoardMapVenue|null;onCancel:()=>void;onConfirm:(p:BoardMapPoint)=>void;
}) {
 const dialog=useRef<HTMLDialogElement>(null),map=useRef<MapzHandle>(null);
 const [point,setPoint]=useState<BoardMapPoint>(value || venue || {lat:45.5231,lng:-122.6765});
 const [durationChanged,setDurationChanged]=useState(false);
 const [days,setDays]=useState(Math.min(value?.days || 7,maxDays));
 const [ready,setReady]=useState(false),[fine,setFine]=useState(false);
 const [atVenue,setAtVenue]=useState(Boolean(venue && (!value || value.venueId)));
 const camera=useRef<MapView>({center:[point.lat,point.lng],zoom:17,pitch:0,bearing:0,bounds:{south:45.2,north:45.85,west:-123.15,east:-122.15}});
 const waypoints=useQuery<Array<BoardMapPoint&{name:string}>>({queryKey:["/api/board-map-waypoints"],queryFn:()=>apiRequest("GET","/api/board-map-waypoints").then(r=>r.json())});
 const cancel=useRef(onCancel);cancel.current=onCancel;
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement;dialog.current?.showModal();
  // Native top-layer dialog owns focus above a composer or card's custom trap.
  const keyboard=(e:KeyboardEvent)=>{if((e.key==="Escape"||e.key==="Tab")&&dialog.current?.open){e.stopPropagation();if(e.key==="Escape"){e.preventDefault();cancel.current();}}};
  window.addEventListener("keydown",keyboard,true);
  return()=>{window.removeEventListener("keydown",keyboard,true);previous?.focus();};
 },[]);
 const target=atVenue && venue?venue:point;
 const blocked=!atVenue && waypoints.data?.some(w=>metres(w,target)<18);
 const outside=housing?!withinHousingBounds(target.lat,target.lng):target.lat<45.2 || target.lat>45.85 || target.lng< -123.15 || target.lng> -122.15;
 const nudge=(lat:number,lng:number)=>{
   const next={...camera.current,center:[point.lat+lat,point.lng+lng] as [number,number]};
   map.current?.send("view",next);setAtVenue(false);
 };
 const rows=(waypoints.data || []).map((w,i)=>({key:`placement-${i}`,coordinates:[w.lng,w.lat],name:w.name,color:getComputedStyle(document.documentElement).getPropertyValue("--day-thu").trim(),logo:"",kind:"place",waypointFamily:"places"}));
 return createPortal(<dialog ref={dialog} className="board-pin-picker" aria-labelledby="pin-picker-title" onCancel={e=>{e.preventDefault();onCancel();}} onKeyDown={e=>{if(e.key==="Escape")e.stopPropagation();}}>
   <MapzCanvas ref={map} onEscape={onCancel} rows={rows} selected={null} labelsEnabled viewTime={Date.now()} initialCamera={camera.current} onSelect={()=>{}} onBoot={()=>setReady(true)} onView={v=>{camera.current={center:v.center,zoom:v.zoom,pitch:v.pitch,bearing:v.bearing,bounds:v.bounds};setPoint(p=>({...p,lat:v.center[0],lng:v.center[1]}));if(venue && metres(venue,{lat:v.center[0],lng:v.center[1]})>2)setAtVenue(false);}} />
   <div className="board-pin-picker__heading"><h2 id="pin-picker-title">Place your pin</h2><button type="button" onClick={onCancel}>Cancel</button></div>
   <div className="board-pin-picker__target pdx-glass-rebind" aria-hidden="true"><BoardPushPin postKey="placement-preview"/><span>+</span></div>
   <div className="board-pin-picker__controls">
     <p>{atVenue?`Beside ${venue?.name}`:"Move the map under your pin. Cross streets work well."}</p>
     {venue && <label><input type="checkbox" checked={atVenue} onChange={e=>{setAtVenue(e.target.checked);if(e.target.checked)map.current?.send("view",{...camera.current,center:[venue.lat,venue.lng]});}}/> Place beside the linked venue</label>}
     <div className="board-pin-picker__row"><label>On the map for <select aria-label="Days on map" value={days} onChange={e=>{setDurationChanged(true);setDays(Number(e.target.value));}}>{Array.from({length:maxDays},(_,i)=><option key={i+1} value={i+1}>{i+1} {i===0?"day":"days"}</option>)}</select></label>
       <button type="button" aria-expanded={fine} onClick={()=>setFine(!fine)}>Fine-tune</button></div>
     {fine && <div className="board-pin-picker__fine" aria-label="Adjust pin position"><button type="button" onClick={()=>map.current?.send("zoom",{delta:1})} aria-label="Zoom in">+</button><button type="button" onClick={()=>map.current?.send("zoom",{delta:-1})} aria-label="Zoom out">−</button>{([["North",.000045,0],["West",0,-.000064],["East",0,.000064],["South",-.000045,0]] as const).map(([label,lat,lng])=><button type="button" key={label} onClick={()=>nudge(lat,lng)} aria-label={`Move pin 5 metres ${label.toLowerCase()}`}>{label}</button>)}</div>}
     {value?.keepUntil && !durationChanged && <small>Keeps the current expiry: {new Date(value.keepUntil).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}.</small>}
     {renewal && <small>Replacements last up to 5 days at a time.</small>}
     {waypoints.isError?<p role="alert">Waypoints couldn’t load. <button type="button" onClick={()=>void waypoints.refetch()}>Retry</button></p>:outside?<p role="alert">{housing?"Choose a point from the Portland metro area through Salem.":"Choose a point in the Portland metro area."}</p>:blocked?<p role="status">Move a little farther from the existing waypoint.</p>:<small>This pin is public. Choose a nearby corner for a private home or handoff.</small>}
     {error && <p role="alert">{error}</p>}
     <button className="board-pin-picker__confirm" type="button" disabled={saving || !ready || !waypoints.isSuccess || blocked || outside} onClick={()=>onConfirm({...target,days,venueId:atVenue?venue?.venueId:null,keepUntil:!durationChanged?value?.keepUntil:undefined})}>{saving?"Saving…":"Confirm placement"}</button>
   </div>
 </dialog>,document.body);
}
