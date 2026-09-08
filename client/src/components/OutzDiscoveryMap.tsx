import type {OutzDiscoveryPlace} from "@/pages/Outz";
import React,{useEffect,useState,useRef} from 'react';
import {MapContainer,Marker,Popup,useMap,useMapEvents} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CartoVectorBasemap from '@/components/CartoVectorBasemap';
import {waypointIcon,waypointSize} from '@/lib/livingMapWaypoints';
type Props={points:OutzDiscoveryPlace[];selected:OutzDiscoveryPlace;focusId:string|null;onSelect:(p:OutzDiscoveryPlace)=>void};
function Frame({selected,focusId}:Omit<Props,"onSelect">){
 const map=useMap();const framed=useRef(false);
 useEffect(()=>{
  const resize=()=>{map.invalidateSize({animate:false});const size=map.getSize();if(!framed.current&&size.x>0&&size.y>0){map.fitBounds([[41.99,-124.85],[49.05,-116.45]],{padding:[8,8],animate:false});framed.current=true}};
  const observer=new ResizeObserver(resize);observer.observe(map.getContainer());resize();return()=>observer.disconnect();
 },[map]);
 useEffect(()=>{if(focusId===selected.id&&Number.isFinite(selected.lat)&&Number.isFinite(selected.lng))map.setView([selected.lat!,selected.lng!],11,{animate:false})},[map,focusId,selected]);return null;
}
function Waypoints({points,selected,onSelect}:Omit<Props,"focusId">){
 const map=useMap();const [zoom,setZoom]=useState(map.getZoom());
 useMapEvents({zoomend:()=>setZoom(map.getZoom())});
 return points.map(p=><Marker key={p.id} title={p.name} alt={p.name} position={[p.lat!,p.lng!]} zIndexOffset={selected?.id===p.id?1000:0} icon={waypointIcon({id:'outz',color:p.accent,selected:selected?.id===p.id,size:waypointSize(zoom,selected?.id===p.id)*0.4})} eventHandlers={{click:()=>onSelect(p)}}><Popup><strong>{p.name}</strong><p>{p.region}</p><a href={p.href}>Open destination ↗</a></Popup></Marker>);
}
export default function OutzDiscoveryMap({points,selected,onSelect,focusId}:Props){return <MapContainer center={[45.52,-120.65]} zoom={6} zoomSnap={0.25} scrollWheelZoom={true} touchZoom={true} style={{height:'100%',width:'100%',background:'#050506'}}><CartoVectorBasemap waterColor="#385866" warmLand topographic cyanWater/><Frame points={points} selected={selected} focusId={focusId}/><Waypoints points={points} selected={selected} onSelect={onSelect}/></MapContainer>}
