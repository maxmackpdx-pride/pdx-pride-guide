import {forwardRef,useEffect,useImperativeHandle} from 'react';
import {MapContainer,TileLayer,CircleMarker,Marker,Tooltip,useMap,useMapEvents} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {divIcon} from 'leaflet';
import {cartoDarkTileUrl,CARTO_ATTRIBUTION} from '@/lib/mapTiles';
import type {ZaydarHandle} from './ZaydarCanvas';
type Row={key:string;coordinates:number[];name:string;color:string;typeIcon?:string};
type View={center:[number,number];zoom:number;bounds:{south:number;north:number;west:number;east:number}};
const Controls=forwardRef<ZaydarHandle,{rows:Row[];onView:(view:View)=>void}>(function Controls({rows,onView},ref){
 const map=useMap();
 useImperativeHandle(ref,()=>({send(type,data={}){
  if(type==='zoom')map.setZoom(map.getZoom()+Number(data.delta));
  const coords=type==='select'?rows.find(r=>r.key===data.key)?.coordinates:type==='locate'?data.coordinates as number[]:null;
  if(coords)map.setView([coords[1],coords[0]],16);
 }}),[map,rows]);
 const sync=()=>{const c=map.getCenter(),b=map.getBounds();onView({center:[c.lat,c.lng],zoom:map.getZoom(),bounds:{south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()}});};
 useMapEvents({moveend:sync});useEffect(sync,[map]);return null;
});
export default forwardRef<ZaydarHandle,{rows:Row[];onSelect:(key:string)=>void;onView:(view:View)=>void}>(function ZaydarFallback({rows,onSelect,onView},ref){
 return <MapContainer center={[45.523,-122.676]} zoom={13} minZoom={10} maxBounds={[[45.2,-123.15],[45.85,-122.15]]} zoomControl={false} style={{position:'absolute',inset:0,zIndex:0}}>
 <TileLayer url={cartoDarkTileUrl()} attribution={CARTO_ATTRIBUTION} subdomains="abcd" maxZoom={20}/><Controls ref={ref} rows={rows} onView={onView}/>
  {rows.map(row=>row.typeIcon?<Marker key={row.key} position={[row.coordinates[1],row.coordinates[0]]} icon={divIcon({className:'',iconSize:[28,28],iconAnchor:[14,14],html:`<span class="zaydar-fallback-type" style="--type-color:${/^#[0-9a-f]{6}$/i.test(row.color)?row.color:'#19E3FF'}"><img src="${row.typeIcon.replace(/["<>]/g,'')}" alt=""/></span>`})} eventHandlers={{click:()=>onSelect(row.key)}}><Tooltip>{row.name}</Tooltip></Marker>:<CircleMarker key={row.key} center={[row.coordinates[1],row.coordinates[0]]} radius={7} pathOptions={{color:row.color,fillColor:row.color,fillOpacity:.9}} eventHandlers={{click:()=>onSelect(row.key)}}><Tooltip>{row.name}</Tooltip></CircleMarker>)}
 </MapContainer>;
});
