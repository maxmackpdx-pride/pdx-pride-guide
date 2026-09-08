import type {OutzDiscoveryPlace} from "@/pages/Outz";
import React,{useEffect,useState} from 'react';
import {MapContainer,Marker,Popup,useMap,useMapEvents} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CartoVectorBasemap from '@/components/CartoVectorBasemap';
import {waypointIcon,waypointSize} from '@/lib/livingMapWaypoints';
type Props={points:OutzDiscoveryPlace[];selected:OutzDiscoveryPlace;focusId:string|null;onSelect:(p:OutzDiscoveryPlace)=>void};
function Frame({points,selected,focusId}:Omit<Props,"onSelect">){const map=useMap();useEffect(()=>{const resize=new ResizeObserver(()=>map.invalidateSize({animate:false}));resize.observe(map.getContainer());return()=>resize.disconnect()},[map]);useEffect(()=>{if(points.length)map.fitBounds(points.map(p=>[p.lat!,p.lng!]),{padding:[35,35],maxZoom:10,animate:false})},[map,points]);useEffect(()=>{if(focusId&&Number.isFinite(selected?.lat)&&Number.isFinite(selected?.lng))map.setView([selected.lat!,selected.lng!],11,{animate:false})},[map,focusId,selected]);return null;}
function Waypoints({points,selected,onSelect}:Omit<Props,"focusId">){
 const map=useMap();const [zoom,setZoom]=useState(map.getZoom());
 useMapEvents({zoomend:()=>setZoom(map.getZoom())});
 return points.map(p=><Marker key={p.id} title={p.name} alt={p.name} position={[p.lat!,p.lng!]} zIndexOffset={selected?.id===p.id?1000:0} icon={waypointIcon({id:'outz',color:p.accent,selected:selected?.id===p.id,size:waypointSize(zoom,selected?.id===p.id)*0.4})} eventHandlers={{click:()=>onSelect(p)}}><Popup><strong>{p.name}</strong><p>{p.region}</p><a href={p.href}>Open destination ↗</a></Popup></Marker>);
}
export default function OutzDiscoveryMap({points,selected,onSelect,focusId}:Props){return <MapContainer center={[45.2,-122.6]} zoom={7} scrollWheelZoom={false} style={{height:'100%',width:'100%',background:'#050506'}}><CartoVectorBasemap accent={selected?.accent||'#00DFF5'}/><Frame points={points} selected={selected} focusId={focusId}/><Waypoints points={points} selected={selected} onSelect={onSelect}/></MapContainer>}
