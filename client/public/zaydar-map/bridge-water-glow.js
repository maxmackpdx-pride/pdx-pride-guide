import {fitBridgeRoad,sampleBridgeRoad} from './bridge-fit.js?v=20260921-layer-join';
import {PORTLAND_BRIDGE_MODELS} from './st-johns-bridge.js?v=20260921-layer-join';

export const BRIDGE_GLOW_PALETTES={
 rainbow:['#ff145c','#ff7b16','#ffe42b','#19ff79','#08d5ff','#7250ff','#ed28ff'],
 trans:['#18d8ff','#ff69bf','#fff5ff','#ff69bf','#18d8ff'],
 lesbian:['#ff3919','#ff8547','#fff0f5','#ff53b5','#f51699'],
};
export const BRIDGE_GLOW_THEMES={
 'st-johns':'rainbow',
 broadway:'rainbow',steel:'trans',burnside:'lesbian',morrison:'rainbow',
 hawthorne:'trans',marquam:'lesbian','tilikum-crossing':'rainbow',
 'ross-island':'lesbian',sellwood:'trans',fremont:'lesbian',
 interstate:'trans',
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

function bridgeSpanLine(model){
 const rad=model.bearing*Math.PI/180,half=model.length/2;
 const east=Math.sin(rad)*half,north=Math.cos(rad)*half;
 const lonPerM=1/(111320*Math.cos(model.center[1]*Math.PI/180));
 const latPerM=1/111320;
 return [
  [model.center[0]-east*lonPerM,model.center[1]-north*latPerM],
  [model.center[0]+east*lonPerM,model.center[1]+north*latPerM],
 ];
}

function fittedGlowLine(model,features){
 const fit=model.fit||(features?.length?fitBridgeRoad(features,model,()=>0):null);
 if(!fit)return bridgeSpanLine(model);
 const steps=Math.max(12,Math.min(36,Math.ceil(fit.length/24)));
 return Array.from({length:steps+1},(_,i)=>sampleBridgeRoad(fit,i/steps).coordinate);
}

export function bridgeGlowGradient(palette){
 const stops=BRIDGE_GLOW_PALETTES[palette]||BRIDGE_GLOW_PALETTES.rainbow;
 const expr=['interpolate',['linear'],['line-progress']];
 stops.forEach((hex,index)=>expr.push(index/(stops.length-1),hex));
 return expr;
}

export function bridgeGlowLineCollections(features){
 const byTheme={};
 for(const model of PORTLAND_BRIDGE_MODELS){
  if(model.disabled||!Object.hasOwn(BRIDGE_GLOW_THEMES,model.id))continue;
  const palette=BRIDGE_GLOW_THEMES[model.id];
  (byTheme[palette]??=[]).push({
   type:'Feature',
   properties:{id:model.id,palette},
   geometry:{type:'LineString',coordinates:fittedGlowLine(model,features)},
  });
 }
 return byTheme;
}

function transportationBridges(map){
 try{
  return (map.querySourceFeatures('terrain',{sourceLayer:'transportation'})||[])
   .filter(feature=>feature.properties?.brunnel==='bridge');
 }catch{
  return [];
 }
}

export function installCheapBridgeGlow(map){
 if(!map||!map.getStyle())return;
 const features=transportationBridges(map);
 const collections=bridgeGlowLineCollections(features);
 const before=['waterway','buildings','skyline','bridge-decks'].find(id=>map.getLayer(id));
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
    id:sourceId,type:'line',source:sourceId,minzoom:12.2,maxzoom:18,
    layout:{'line-cap':'round','line-join':'round'},
    paint:{
     'line-width':['interpolate',['linear'],['zoom'],12,3,15,10,17,16],
     'line-blur':['interpolate',['linear'],['zoom'],12,2.5,15,8,17,12],
     'line-opacity':['interpolate',['linear'],['zoom'],12,.22,14.5,.5,17,.38],
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
