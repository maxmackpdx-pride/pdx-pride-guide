import {sampleBridgeRoad} from './bridge-fit.js?v=20260921-layer-join';
import {PORTLAND_BRIDGE_MODELS} from './st-johns-bridge.js?v=20260921-layer-join';

export const BRIDGE_GLOW_PALETTES={
 rainbow:['#ff145c','#ff7b16','#ffe42b','#19ff79','#08d5ff','#7250ff','#ed28ff'],
 trans:['#18d8ff','#ff69bf','#fff5ff','#ff69bf','#18d8ff'],
 lesbian:['#ff3919','#ff8547','#fff0f5','#ff53b5','#f51699'],
};
// Major crossings only: Sellwood through St. Johns and north to I-5.
// Steel and Tilikum carry people/transit; the BNSF railway bridges are excluded.
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

export function bridgeGlowGradient(palette){
 const stops=BRIDGE_GLOW_PALETTES[palette]||BRIDGE_GLOW_PALETTES.rainbow;
 const expr=['interpolate',['linear'],['line-progress']];
 stops.forEach((hex,index)=>expr.push(index/(stops.length-1),hex));
 return expr;
}

/** Static GeoJSON spans. No water query, no custom shader, no idle rebuild. */
export function bridgeGlowLineCollections(){
 const byTheme={};
 for(const model of PORTLAND_BRIDGE_MODELS){
  if(model.disabled||!Object.hasOwn(BRIDGE_GLOW_THEMES,model.id))continue;
  const palette=BRIDGE_GLOW_THEMES[model.id];
  (byTheme[palette]??=[]).push({
   type:'Feature',
   properties:{id:model.id,palette},
   geometry:{type:'LineString',coordinates:bridgeSpanLine(model)},
  });
 }
 return byTheme;
}

export function installCheapBridgeGlow(map){
 if(!map||map.__mapzCheapBridgeGlow||!map.getStyle())return;
 const collections=bridgeGlowLineCollections();
 const before=['waterway','buildings','skyline','bridge-decks'].find(id=>map.getLayer(id));
 for(const [palette,features] of Object.entries(collections)){
  const sourceId=`mapz-bridge-glow-${palette}`;
  if(!map.getSource(sourceId)){
   map.addSource(sourceId,{type:'geojson',lineMetrics:true,data:{type:'FeatureCollection',features}});
  }
  if(!map.getLayer(sourceId)){
   const layer={
    id:sourceId,type:'line',source:sourceId,minzoom:12.2,maxzoom:18,
    layout:{'line-cap':'round','line-join':'round'},
    paint:{
     'line-width':['interpolate',['linear'],['zoom'],12,4,15,14,17,22],
     'line-blur':['interpolate',['linear'],['zoom'],12,3,15,10,17,16],
     'line-opacity':['interpolate',['linear'],['zoom'],12,.2,14.5,.48,17,.36],
     'line-gradient':bridgeGlowGradient(palette),
    },
   };
   if(before)map.addLayer(layer,before);else map.addLayer(layer);
  }
 }
 map.__mapzCheapBridgeGlow=true;
}

/** Sample the same fitted road as the real bridge, never a screen-space guess. */
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

// One small atlas and one draw call for all crossings. Every corner lives in
// Mercator meters, so the map projects the water and the bridges together.
const TILE_WIDTH=256,TILE_HEIGHT=96,GUTTER=2,COLUMNS=3;
export function bridgeWaterPatch(span,project,elevation=()=>0){
 const start=span.samples.reduce((a,b)=>a.fraction<b.fraction?a:b),end=span.samples.reduce((a,b)=>a.fraction>b.fraction?a:b);
 const origin=project(start.coordinate),last=project(end.coordinate);
 const length=Math.hypot(last.x-origin.x,last.y-origin.y)||1,axis={x:(last.x-origin.x)/length,y:(last.y-origin.y)/length};
 const localPoint=p=>{const x=p.x-origin.x,y=p.y-origin.y;return {x:x*axis.x+y*axis.y,y:-x*axis.y+y*axis.x};};
 const local=coordinate=>localPoint(project(coordinate));
 const points=span.samples.map(sample=>({...local(sample.coordinate),fraction:sample.fraction}));
 const along=Math.max(18,span.step*1.2),across=32;
 const bounds={left:Math.min(...points.map(p=>p.x))-along,right:Math.max(...points.map(p=>p.x))+along,top:Math.min(...points.map(p=>p.y))-across,bottom:Math.max(...points.map(p=>p.y))+across};
 const height=elevation(span.samples[Math.floor(span.samples.length/2)].coordinate)+.1;
 const world=(x,y)=>({x:origin.x+x*axis.x-y*axis.y,y:origin.y+x*axis.y+y*axis.x,z:height});
 return {span,points,along,across,bounds,local,localPoint,length,corners:[world(bounds.left,bounds.top),world(bounds.right,bounds.top),world(bounds.left,bounds.bottom),world(bounds.right,bounds.bottom)]};
}

function collectWater(features){
 const unique=new Map();
 for(const feature of features){
  const rings=feature.geometry?.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiPolygon'?feature.geometry.coordinates:[];
  for(const polygon of rings)if(polygon[0]?.length){const key=JSON.stringify(polygon);if(!unique.has(key))unique.set(key,polygon);}
 }
 return [...unique].sort(([a],[b])=>a.localeCompare(b));
}
function pointBounds(points){
 const b={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
 for(const p of points){b.left=Math.min(b.left,p.x);b.right=Math.max(b.right,p.x);b.top=Math.min(b.top,p.y);b.bottom=Math.max(b.bottom,p.y);}
 return b;
}
function overlaps(a,b){return a.right>=b.left&&a.left<=b.right&&a.bottom>=b.top&&a.top<=b.bottom;}
function waterRings(projected,patch){
 const bounds=pointBounds(patch.corners),polygons=[];
 for(const polygon of projected){
  if(!overlaps(polygon.bounds,bounds))continue;
  const rings=polygon.rings.map(ring=>ring.map(patch.localPoint));
  if(overlaps(pointBounds(rings[0]),patch.bounds))polygons.push({key:polygon.key,rings});
 }
 return polygons;
}

function paintWaterPatch(canvas,mask,patch,polygons){
 canvas.width=mask.width=TILE_WIDTH;canvas.height=mask.height=TILE_HEIGHT;
 const ctx=canvas.getContext('2d'),water=mask.getContext('2d'),b=patch.bounds;
 const sx=TILE_WIDTH/(b.right-b.left),sy=TILE_HEIGHT/(b.bottom-b.top);
 const pixel=p=>({x:(p.x-b.left)*sx,y:(p.y-b.top)*sy});
 for(const polygon of polygons){
  water.beginPath();
  for(const ring of polygon.rings){ring.forEach((p,i)=>{const q=pixel(p);if(i)water.lineTo(q.x,q.y);else water.moveTo(q.x,q.y);});water.closePath();}
  water.fillStyle='#fff';water.fill('evenodd');
 }
 for(const point of patch.points){
  const p=pixel(point);ctx.save();ctx.translate(p.x,p.y);ctx.scale(patch.along*sx,patch.across*sy);
  const feather=ctx.createRadialGradient(0,0,0,0,0,1);
  feather.addColorStop(0,'rgba(255,255,255,.28)');feather.addColorStop(.25,'rgba(255,255,255,.22)');
  feather.addColorStop(.6,'rgba(255,255,255,.065)');feather.addColorStop(1,'rgba(255,255,255,0)');
  ctx.globalAlpha=Math.sin(Math.PI*point.fraction)**.4;ctx.fillStyle=feather;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
 const color=ctx.createLinearGradient(-b.left*sx,0,(patch.length-b.left)*sx,0);
 for(let i=0;i<=96;i++)color.addColorStop(i/96,`rgb(${bridgeGlowColor(patch.span.palette,i/96).join(',')})`);
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,TILE_WIDTH,TILE_HEIGHT);
 ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-over';
}

export function createBridgeWaterLayer(maplibre,elevation=()=>0){
 const origin=maplibre.MercatorCoordinate.fromLngLat([-122.67,45.53]),unit=origin.meterInMercatorCoordinateUnits();
 const project=coordinate=>{const p=maplibre.MercatorCoordinate.fromLngLat(coordinate);return {x:(p.x-origin.x)/unit,y:(p.y-origin.y)/unit};};
 const waterHeight=coordinate=>{const p=maplibre.MercatorCoordinate.fromLngLat(coordinate);return elevation(coordinate)*p.meterInMercatorCoordinateUnits()/unit;};
 const atlas=document.createElement('canvas'),tile=document.createElement('canvas'),mask=document.createElement('canvas');
 const cache=new Map(),localMatrix=new Float32Array(16);
 let waterSignature='',projectedWater=[],geometrySignature='';
 return {
  id:'bridge-water-reflections',type:'custom',renderingMode:'3d',count:0,signature:'',dirty:false,
  update(){return;},
  onAdd(){},
  render(){},
  onRemove(){
   for(const canvas of [atlas,tile,mask,...[...cache.values()].map(v=>v.image)])canvas.width=canvas.height=1;
   cache.clear();projectedWater=[];waterSignature='';geometrySignature='';this.vertices=null;this.count=0;this.map=null;this.signature='';
  },
 };
}
