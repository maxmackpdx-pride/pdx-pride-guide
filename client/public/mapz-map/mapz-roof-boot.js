import {createSurfaceWork} from './surface-work.js';
import {createVenueRoofs,extrusionAmount,matchBuilding,isPlacezRow} from './venue-roofs.js?v=20260926-placez-roofs';
import {installCheapBridgeGlow} from './bridge-water-glow.js?v=20260929-mesh';

function rowsToFeatures(rows){
 return (rows||[]).filter(row=>Array.isArray(row.coordinates)&&row.coordinates.length>=2&&row.color).map(row=>({
  type:'Feature',
  geometry:{type:'Point',coordinates:row.coordinates},
  properties:{...row,color:row.color}
 }));
}

function buildingsFrom(map){
 if(window.__mapzSurfaceBuildings?.length)return window.__mapzSurfaceBuildings;
 const out=[],seen=new Set();
 let feats=[];
 try{
  feats=map.__mapzBuildingModels?.surfaceFeatures?.()||[];
  if(!feats.length)feats=map.querySourceFeatures('terrain',{sourceLayer:'building'})||[];
 }catch{}
 for(const feature of feats){
  const polygons=feature.geometry?.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiPolygon'?feature.geometry.coordinates:[];
  for(const polygon of polygons){
   const ring=polygon[0];
   if(!ring?.length)continue;
   const key=ring[0].join(',')+':'+ring.length;
   if(seen.has(key))continue;
   seen.add(key);
   const center=ring.reduce((acc,point)=>[acc[0]+point[0]/ring.length,acc[1]+point[1]/ring.length],[0,0]);
   const raw=Number(feature.properties?.render_height||feature.properties?.height);
   out.push({center,height:Number.isFinite(raw)&&raw>0?raw:9,ring});
  }
 }
 return out;
}

function coordKey(c){
 return `${Number(c[0]).toFixed(6)},${Number(c[1]).toFixed(6)}`;
}

function rebuildPlaceSnaps(map){
 const snaps=new Map(),roofHeights=new Map();
 const buildings=buildingsFrom(map);
 const features=window.__mapzVenueFeatures||[];
 const matches=new Map();
 for(const feature of features){
  if(!isPlacezRow(feature.properties||{}))continue;
  const c=feature.geometry?.coordinates;
  if(!Array.isArray(c)||c.length<2)continue;
  const best=matchBuilding(buildings,c);
  matches.set(feature,best);
  if(!best)continue;
  const key=coordKey(c);
  snaps.set(key,best.center);
  roofHeights.set(key,Math.max(8,Number(best.height)||9)+.5);
 }
 window.__mapzPlaceSnaps=snaps;
 window.__mapzPlaceRoofHeights=roofHeights;
 return {buildings,snaps,matches};
}

function sync(map,{geometry=false,glow=false}={}){
 if(!map)return;
 if(geometry||!map.__mapzRoofGeometry)map.__mapzRoofGeometry=rebuildPlaceSnaps(map);
 const {buildings,matches}=map.__mapzRoofGeometry;
 if(map._venueRoofs){
  const placeFeatures=(window.__mapzVenueFeatures||[]).filter(f=>isPlacezRow(f.properties||{}));
  map._venueRoofs.update(buildings,placeFeatures,extrusionAmount(map),matches);
 }
 if(glow)installCheapBridgeGlow(map);
}

if(!window.__mapzProjectSnap){
 window.__mapzProjectSnap=true;
 const patch=function(map){
  if(map.__placezProjectPatched)return;
  map.__placezProjectPatched=true;
  const original=map.project.bind(map);
  map.project=function(lngLat){
   let lng,lat;
   if(lngLat&&typeof lngLat==='object'&&!Array.isArray(lngLat)){
    lng=lngLat.lng??lngLat.lon;lat=lngLat.lat;
   }else if(Array.isArray(lngLat)){
    lng=lngLat[0];lat=lngLat[1];
   }
   if(Number.isFinite(lng)&&Number.isFinite(lat)){
    const snap=window.__mapzPlaceSnaps?.get(coordKey([lng,lat]));
    if(snap)return original(snap);
   }
   return original(lngLat);
  };
 };
 window.__mapzPatchProject=patch;
}

if(window.maplibregl?.Map&&!window.__mapzRoofBoot){
 window.__mapzRoofBoot=true;
 const Original=window.maplibregl.Map;
 window.maplibregl.Map=class MapzMap extends Original{
  constructor(options){
   super(options);
   window.__mapzMap=this;
   window.__mapzPatchProject?.(this);
   this.once('load',()=>{
    const work=createSurfaceWork(dirty=>sync(this,dirty));
    this.__mapzSurfaceWork=work;
    this.__mapzRefreshBuildingSurfaces=()=>work.schedule({geometry:true});
    this._venueRoofs=createVenueRoofs(this);
    work.schedule({geometry:true,glow:true});
    this.on('moveend',()=>work.schedule({geometry:true,glow:true}));
    this.once('remove',()=>work.dispose());
    this.on('sourcedata',event=>{
     if(event.sourceId==='terrain'&&event.sourceDataType==='content'&&event.isSourceLoaded)work.schedule({geometry:true,glow:true});
    });
   });
  }
 };
}

window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.data?.source!=='mapz-host')return;
 if(event.data.type==='data'&&Array.isArray(event.data.rows)){
  window.__mapzVenueFeatures=rowsToFeatures(event.data.rows);
  window.__mapzMap?.__mapzSurfaceWork?.schedule({geometry:true});
 }
});
