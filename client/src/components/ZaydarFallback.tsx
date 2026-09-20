import {forwardRef,useEffect,useImperativeHandle,useState} from 'react';
import {MapContainer,TileLayer,CircleMarker,Marker,Tooltip,useMap,useMapEvents} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {divIcon} from 'leaflet';
import {cartoDarkTileUrl,CARTO_ATTRIBUTION} from '@/lib/mapTiles';
import type {ZaydarHandle} from './ZaydarCanvas';

type Row={key:string;coordinates:number[];name:string;color:string;typeIcon?:string};
type View={center:[number,number];zoom:number;bounds:{south:number;north:number;west:number;east:number}};
type Props={rows:Row[];selected:string|null;labelsEnabled:boolean;initialView:View;onSelect:(key:string)=>void;onView:(view:View)=>void};

const Controls=forwardRef<ZaydarHandle,{rows:Row[];onLabels:(enabled:boolean)=>void;onView:(view:View)=>void}>(function Controls({rows,onLabels,onView},ref){
 const map=useMap();
 useImperativeHandle(ref,()=>({send(type,data={}){
  if(type==='zoom')map.setZoom(map.getZoom()+Number(data.delta),{animate:false});
  if(type==='labels')onLabels(Boolean(data.enabled));
  const coords=type==='select'?rows.find(row=>row.key===data.key)?.coordinates:type==='locate'?data.coordinates as number[]:null;
  if(coords)map.setView([coords[1],coords[0]],16,{animate:false});
 }}),[map,rows,onLabels]);
 const sync=()=>{const center=map.getCenter(),bounds=map.getBounds();onView({center:[center.lat,center.lng],zoom:map.getZoom(),bounds:{south:bounds.getSouth(),north:bounds.getNorth(),west:bounds.getWest(),east:bounds.getEast()}});};
 useMapEvents({moveend:sync});useEffect(sync,[map]);return null;
});

export default forwardRef<ZaydarHandle,Props>(function ZaydarFallback({rows,selected,labelsEnabled,initialView,onSelect,onView},ref){
 const [labels,setLabels]=useState(labelsEnabled);
 useEffect(()=>setLabels(labelsEnabled),[labelsEnabled]);
 return <MapContainer center={initialView.center} zoom={initialView.zoom} minZoom={10} maxBounds={[[45.2,-123.15],[45.85,-122.15]]} zoomControl={false} preferCanvas zoomAnimation={false} fadeAnimation={false} markerZoomAnimation={false} style={{position:'absolute',inset:0,zIndex:0}}>
  <TileLayer url={cartoDarkTileUrl()} attribution={CARTO_ATTRIBUTION} subdomains="abcd" maxZoom={20} updateWhenIdle keepBuffer={1}/>
  <Controls ref={ref} rows={rows} onLabels={setLabels} onView={onView}/>
  {rows.map(row=>{
   const chosen=row.key===selected,color=/^#[0-9a-f]{6}$/i.test(row.color)?row.color:'#19E3FF';
   const tooltip=<Tooltip permanent={labels||chosen} direction="top" opacity={.95}>{row.name}</Tooltip>;
   return row.typeIcon
    ?<Marker key={row.key} position={[row.coordinates[1],row.coordinates[0]]} zIndexOffset={chosen?1000:0} icon={divIcon({className:'',iconSize:chosen?[34,34]:[28,28],iconAnchor:chosen?[17,17]:[14,14],html:`<span class="zaydar-fallback-type" data-selected="${chosen}" style="--type-color:${color}"><img src="${row.typeIcon.replace(/["<>]/g,'')}" alt=""/></span>`})} eventHandlers={{click:()=>onSelect(row.key)}}>{tooltip}</Marker>
    :<CircleMarker key={row.key} center={[row.coordinates[1],row.coordinates[0]]} radius={chosen?10:7} pathOptions={{color,fillColor:color,fillOpacity:.9}} eventHandlers={{click:()=>onSelect(row.key)}}>{tooltip}</CircleMarker>;
  })}
 </MapContainer>;
});
