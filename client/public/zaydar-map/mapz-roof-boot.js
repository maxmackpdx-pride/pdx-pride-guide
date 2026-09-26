import {createVenueRoofs,extrusionAmount} from './venue-roofs.js?v=20260925-roof-waypoints';
import {createBridgeWaterLayer,bridgeGlowSpans} from './bridge-water-glow.js';
import {PORTLAND_BRIDGE_MODELS} from './st-johns-bridge.js?v=20260921-layer-join';

function rowsToFeatures(rows){
 return (rows||[]).filter(row=>Array.isArray(row.coordinates)&&row.coordinates.length>=2&&row.color).map(row=>({
  type:'Feature',
  geometry:{type:'Point',coordinates:row.coordinates},
  properties:{color:row.color}
 }));
}

function buildingsFrom(map){
 const out=[],seen=new Set();
 let feats=[];
 try{feats=map.querySourceFeatures('terrain',{sourceLayer:'building'})||[];}catch{}
 for(const feature of feats){
  const ring=feature.geometry?.type==='Polygon'?feature.geometry.coordinates[0]:feature.geometry?.type==='MultiPolygon'?feature.geometry.coordinates[0][0]:null;
  if(!ring?.length)continue;
  const key=ring[0].join(',')+':'+ring.length;
  if(seen.has(key))continue;
  seen.add(key);
  const center=ring.reduce((acc,point)=>[acc[0]+point[0]/ring.length,acc[1]+point[1]/ring.length],[0,0]);
  const raw=Number(feature.properties?.render_height||feature.properties?.height);
  out.push({center,height:Number.isFinite(raw)&&raw>0?raw:9,ring});
 }
 return out;
}

function attachBridgeGlow(map){
 if(!map)return;
 if(!map._bridgeWater){
  map._bridgeWater=createBridgeWaterLayer(window.maplibregl,coordinate=>{
   try{return map.queryTerrainElevation(coordinate)||0;}catch{return 0;}
  });
 }
 if(!map.getLayer('bridge-water-reflections')){
  const before=['bridge-decks','skyline','buildings'].find(id=>map.getLayer(id));
  if(before)map.addLayer(map._bridgeWater,before);
  else if(map.getStyle())map.addLayer(map._bridgeWater);
 }
 if(!map.getLayer('bridge-water-reflections'))return;
 let water=[];
 try{water=map.querySourceFeatures('terrain',{sourceLayer:'water'})||[];}catch{}
 map._bridgeWater.update(bridgeGlowSpans(PORTLAND_BRIDGE_MODELS),water);
}

function sync(map){
 if(!map)return;
 if(map._venueRoofs)map._venueRoofs.update(buildingsFrom(map),window.__mapzVenueFeatures||[],extrusionAmount(map));
 attachBridgeGlow(map);
}

if(window.maplibregl?.Map&&!window.__mapzRoofBoot){
 window.__mapzRoofBoot=true;
 const Original=window.maplibregl.Map;
 window.maplibregl.Map=class MapzMap extends Original{
  constructor(options){
   super(options);
   window.__mapzMap=this;
   this.once('load',()=>{
    this._venueRoofs=createVenueRoofs(this);
    sync(this);
    this.on('idle',()=>attachBridgeGlow(this));
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
