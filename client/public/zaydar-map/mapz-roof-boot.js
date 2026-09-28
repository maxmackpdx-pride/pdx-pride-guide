import {createVenueRoofs,extrusionAmount,matchBuilding,isPlacezRow} from './venue-roofs.js?v=20260926-placez-roofs';
import {installCheapBridgeGlow} from './bridge-water-glow.js?v=20260928-cheap-bridge-glow';

function rowsToFeatures(rows){
 return (rows||[]).filter(row=>Array.isArray(row.coordinates)&&row.coordinates.length>=2&&row.color).map(row=>({
  type:'Feature',
  geometry:{type:'Point',coordinates:row.coordinates},
  properties:{...row,color:row.color}
 }));
}

function buildingsFrom(map){
 const out=[],seen=new Set();
 let feats=[];
 try{
  feats=map.__zaydarBuildingModels?.surfaceFeatures?.()||[];
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

/** Build GPS → roof-center snaps for Placez only. */
function rebuildPlaceSnaps(map){
 const snaps=new Map(),roofHeights=new Map();
 const buildings=buildingsFrom(map);
 const features=window.__mapzVenueFeatures||[];
 for(const feature of features){
  if(!isPlacezRow(feature.properties||{}))continue;
  const c=feature.geometry?.coordinates;
  if(!Array.isArray(c)||c.length<2)continue;
  const best=matchBuilding(buildings,c);
  if(!best)continue;
  const key=coordKey(c);
  snaps.set(key,best.center);
  roofHeights.set(key,Math.max(8,Number(best.height)||9)+.5);
 }
 window.__mapzPlaceSnaps=snaps;
 window.__mapzPlaceRoofHeights=roofHeights;
 return {buildings,snaps};
}

function sync(map){
 if(!map)return;
 const {buildings}=rebuildPlaceSnaps(map);
 if(map._venueRoofs){
  const placeFeatures=(window.__mapzVenueFeatures||[]).filter(f=>isPlacezRow(f.properties||{}));
  map._venueRoofs.update(buildings,placeFeatures,extrusionAmount(map));
 }
 installCheapBridgeGlow(map);
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

if(!window.__mapzSpillScale){
 window.__mapzSpillScale=true;
 const original=CanvasRenderingContext2D.prototype.createRadialGradient;
 CanvasRenderingContext2D.prototype.createRadialGradient=function(x0,y0,r0,x1,y1,r1){
  if(r1>40&&r1<160){
   const amount=window.__mapzMap?extrusionAmount(window.__mapzMap):0;
   const scale=amount>0.18?0:0.3;
   return original.call(this,x0,y0,r0*scale,x1,y1,r1*scale);
  }
  return original.call(this,x0,y0,r0,x1,y1,r1);
 };
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
    this.__mapzRefreshBuildingSurfaces=()=>sync(this);
    this._venueRoofs=createVenueRoofs(this);
    sync(this);
    this.on('idle',()=>rebuildPlaceSnaps(this));
    this.on('moveend',()=>sync(this));
    this.on('sourcedata',event=>{
     if(event.sourceId==='terrain'&&event.isSourceLoaded)sync(this);
    });
   });
  }
 };
}

window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.data?.source!=='zaydar-host')return;
 if(event.data.type==='data'&&Array.isArray(event.data.rows)){
  window.__mapzVenueFeatures=rowsToFeatures(event.data.rows);
  sync(window.__mapzMap);
 }
});
