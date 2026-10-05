import {fitBridgeRoad,sampleBridgeRoad} from './bridge-fit.js?v=20260921-layer-join';
import {PORTLAND_BRIDGE_MODELS} from './st-johns-bridge.js?v=20260929-mesh';

export const BRIDGE_GLOW_PALETTES={
 rainbow:['#ff145c','#ff7b16','#ffe42b','#19ff79','#08d5ff','#7250ff','#ed28ff'],
 trans:['#18d8ff','#ff69bf','#fff5ff','#ff69bf','#18d8ff'],
 lesbian:['#ff3919','#ff8547','#fff0f5','#ff53b5','#f51699'],
};
export const BRIDGE_GLOW_THEMES={
 'st-johns':'rainbow',
 broadway:'rainbow',steel:'trans',burnside:'lesbian',morrison:'rainbow',
 hawthorne:'trans',marquam:'lesbian','tilikum-crossing':'rainbow',
 'ross-island':'lesbian',sellwood:'trans',fremont:'lesbian',interstate:'trans',
};

export const BRIDGE_GLOW_SATURATION=1.5*1.2;
export const BRIDGE_GLOW_BRIGHTNESS=1.3;
export function saturateBridgeColor(rgb,gain=BRIDGE_GLOW_SATURATION){
 const high=Math.max(...rgb),low=Math.min(...rgb),range=high-low;
 if(!range)return [...rgb];
 const scale=Math.min(gain,high/range);
 return rgb.map(channel=>Math.round(high+(channel-high)*scale));
}
export function bridgeGlowColor(palette,fraction){
 const stops=BRIDGE_GLOW_PALETTES[palette]||BRIDGE_GLOW_PALETTES.rainbow;
 const position=Math.max(0,Math.min(1,fraction))*(stops.length-1);
 const index=Math.min(stops.length-2,Math.floor(position)),mix=position-index;
 const a=parseInt(stops[index].slice(1),16),b=parseInt(stops[index+1].slice(1),16);
 return saturateBridgeColor([16,8,0].map(shift=>((a>>shift)&255)*(1-mix)+((b>>shift)&255)*mix));
}

function pointInRing(point,ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];
  const hit=((a[1]>point[1])!==(b[1]>point[1]))&&(point[0]<(b[0]-a[0])*(point[1]-a[1])/((b[1]-a[1])||1e-12)+a[0]);
  if(hit)inside=!inside;
 }
 return inside;
}
function pointInWater(point,polygons){
 for(const polygon of polygons){
  if(!polygon[0]?.length||!pointInRing(point,polygon[0]))continue;
  let hole=false;
  for(let i=1;i<polygon.length;i++)if(pointInRing(point,polygon[i])){hole=true;break;}
  if(!hole)return true;
 }
 return false;
}

// Split at shoreline and island boundaries; never reconnect across dry land.
export function clipGlowLineToWater(samples, water) {
 const lines=[];
 let current=null;
 for(let i=1;i<samples.length;i++){
  const a=samples[i-1],b=samples[i],dx=b[0]-a[0],dy=b[1]-a[1],cuts=[0,1];
  for(const polygon of water)for(const ring of polygon)for(let j=0;j<ring.length;j++){
   const c=ring[j],d=ring[(j+1)%ring.length],ex=d[0]-c[0],ey=d[1]-c[1];
   const cross=dx*ey-dy*ex;
   if(Math.abs(cross)<1e-16)continue;
   const cx=c[0]-a[0],cy=c[1]-a[1];
   const t=(cx*ey-cy*ex)/cross,u=(cx*dy-cy*dx)/cross;
   if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);
  }
  cuts.sort((x,y)=>x-y);
  const point=t=>[a[0]+dx*t,a[1]+dy*t];
  for(let j=1;j<cuts.length;j++){
   if(cuts[j]-cuts[j-1]<1e-10)continue;
   if(!pointInWater(point((cuts[j]+cuts[j-1])/2),water)){current=null;continue;}
   const from=point(cuts[j-1]),to=point(cuts[j]);
   if(!current){current=[from];lines.push(current);}
   current.push(to);
  }
 }
 return lines;
}

function fittedGlowLines(model,features,water){
 const fit=model.fit||(features?.length?fitBridgeRoad(features,model,()=>0):null);
 const samples=fit
  ? Array.from({length:25},(_,i)=>sampleBridgeRoad(fit,i/24).coordinate)
  : Array.from({length:17},(_,i)=>{
   const t=i/16,rad=model.bearing*Math.PI/180,along=(t-0.5)*model.length;
   const lonPerM=1/(111320*Math.cos(model.center[1]*Math.PI/180));
   return [model.center[0]+Math.sin(rad)*along*lonPerM,model.center[1]+Math.cos(rad)*along*1/111320];
  });
 return clipGlowLineToWater(samples,water||[]);
}

export function bridgeGlowGradient(palette){
 const stops=BRIDGE_GLOW_PALETTES[palette]||BRIDGE_GLOW_PALETTES.rainbow;
 const expr=['interpolate',['linear'],['line-progress']];
 stops.forEach((hex,index)=>expr.push(index/(stops.length-1),hex));
 return expr;
}

export function bridgeGlowLineCollections(features,water){
 const byTheme={};
 for(const model of PORTLAND_BRIDGE_MODELS){
  if(model.disabled||!Object.hasOwn(BRIDGE_GLOW_THEMES,model.id))continue;
  const palette=BRIDGE_GLOW_THEMES[model.id];
  const rows=byTheme[palette]??=[];
  for(const coordinates of fittedGlowLines(model,features,water))rows.push({
   type:'Feature',
   properties:{id:model.id,palette},
   geometry:{type:'LineString',coordinates},
  });
 }
 return byTheme;
}

function transportationBridges(map){
 try{
  return (map.querySourceFeatures('terrain',{sourceLayer:'transportation'})||[])
   .filter(feature=>feature.properties?.brunnel==='bridge'&&!['rail','path'].includes(feature.properties?.class));
 }catch{
  return [];
 }
}
function waterPolygons(map){
 try{
  const features=map.querySourceFeatures('terrain',{sourceLayer:'water'})||[];
  const polygons=[];
  for(const feature of features){
   const rings=feature.geometry?.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiPolygon'?feature.geometry.coordinates:[];
   for(const polygon of rings)if(polygon[0]?.length>3)polygons.push(polygon);
  }
  return polygons;
 }catch{
  return [];
 }
}

const glowInputs=new WeakMap();
export function installCheapBridgeGlow(map){
 if(!map||!map.getStyle())return;
 const features=transportationBridges(map);
 const water=waterPolygons(map);
 const signature=JSON.stringify([features,water]);
 if(glowInputs.get(map)===signature&&map.getLayer('mapz-bridge-glow-rainbow'))return;
 glowInputs.set(map,signature);
 const collections=bridgeGlowLineCollections(features,water);
 const before=['bridge-decks','skyline','buildings'].find(id=>map.getLayer(id));
 for(const [palette,rows] of Object.entries(collections)){
  const sourceId=`mapz-bridge-glow-${palette}`;
  const data={type:'FeatureCollection',features:rows};
  if(!map.getSource(sourceId)){
   map.addSource(sourceId,{type:'geojson',lineMetrics:true,data});
  }else{
   map.getSource(sourceId).setData(data);
  }
  if(!map.getLayer(sourceId)){
   const layer={
    id:sourceId,type:'line',source:sourceId,minzoom:12.4,maxzoom:17.4,
    layout:{'line-cap':'butt','line-join':'round'},
    paint:{
     'line-width':['interpolate',['linear'],['zoom'],12.4,6,15,16,17,22],
     'line-blur':['interpolate',['linear'],['zoom'],12.4,4,15,11,17,14],
     'line-opacity':['interpolate',['linear'],['zoom'],12.4,.18,14.8,.42,17.2,.28],
     'line-gradient':bridgeGlowGradient(palette),
    },
   };
   if(before)map.addLayer(layer,before);else map.addLayer(layer);
  }
 }
 map.__mapzCheapBridgeGlow=true;
}

export function bridgeGlowSpans(models){
 return models.filter(model=>model.fit&&Object.hasOwn(BRIDGE_GLOW_THEMES,model.id)).map(model=>{
  const count=Math.max(8,Math.min(72,Math.ceil(model.fit.length/32)));
  const first=sampleBridgeRoad(model.fit,0).coordinate,last=sampleBridgeRoad(model.fit,1).coordinate;
  const reverse=first[0]>last[0]||(first[0]===last[0]&&first[1]>last[1]);
  return {id:model.id,palette:BRIDGE_GLOW_THEMES[model.id],step:model.fit.length/count,
   samples:Array.from({length:count+1},(_,i)=>{
    const sample=sampleBridgeRoad(model.fit,i/count);
    return {...sample,fraction:reverse?1-i/count:i/count};
   })};
 });
}
