import {createLogoFocus} from './logo-focus.js';
import {logoCoverage} from './logo-mask.js';
import {createHologramMaterials,drawProjectionBeam} from './hologram-materials.js';
import {createSpatialIndex} from './spatial-index.js';
import {settleValue} from './settling.js';
import {createMapExploration} from './map-exploration.js';
import {createCitySparkles} from './city-sparkles.js';
import {roofSparkles} from './roof-sparkles.js';
import {roadColor, roadLineWidth, bridgeFilter, createBridgeLayer} from './bridge-roads.js';
const vectorStyle={version:8,glyphs:'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',light:{anchor:'map',color:'#c7d9ed',intensity:.42,position:[1.15,210,38]},sources:{terrain:{type:'vector',url:'https://tiles.openfreemap.org/planet'}},layers:[
    {id:'water',type:'fill',source:'terrain','source-layer':'water',paint:{'fill-color':'#193645','fill-opacity':.35}},
    {id:'banks',type:'line',source:'terrain','source-layer':'water',paint:{'line-color':'#6d98ab','line-opacity':.5,'line-width':.8}},
    {id:'streams',type:'line',source:'terrain','source-layer':'waterway',paint:{'line-color':'#6291a4','line-opacity':.48,'line-width':.8}},
    {id:'streets',type:'line',source:'terrain','source-layer':'transportation',filter:['!',bridgeFilter],layout:{'line-cap':'butt','line-join':'round'},paint:{'line-color':roadColor,'line-opacity':1,'line-width':roadLineWidth}},
    {id:'skyline',type:'fill-extrusion',source:'terrain','source-layer':'building',minzoom:12,paint:{'fill-extrusion-color':'#203447','fill-extrusion-height':['coalesce',['get','render_height'],['get','height'],9],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':1,'fill-extrusion-vertical-gradient':true}},
    {id:'buildings',type:'line',source:'terrain','source-layer':'building',minzoom:12,paint:{'line-color':'#708da3','line-opacity':.21,'line-width':.5}}
  ]};
vectorStyle.layers.push(
 {id:'road-labels',type:'symbol',source:'terrain','source-layer':'transportation_name',minzoom:14,layout:{visibility:'none','symbol-placement':'line','text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':11},paint:{'text-color':'#b8ccd9','text-halo-color':'#07111a','text-halo-width':1.5}},
 {id:'place-labels',type:'symbol',source:'terrain','source-layer':'place',maxzoom:15,layout:{visibility:'none','text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':12},paint:{'text-color':'#b8ccd9','text-halo-color':'#07111a','text-halo-width':1.5}}
);
// OpenFreeMap vector geometry; no symbols, labels, land fill, or map background.
const map = new maplibregl.Map({container:'map',interactive:false,attributionControl:false,
  center:[-122.676,45.523],zoom:13.5,pitch:48,bearing:0,
  maxBounds:[[-123.15,45.2],[-122.15,45.85]],minZoom:10,maxZoom:20,
  style:structuredClone(vectorStyle)});
// Neon colors excluding yellow and royal blue. Random per page, stable during flight.
const adultVenueColor='#FF0000';
const baseColors=['#8800FF','#00FFFF','#FF00CC','#39FF14','#FF6600'];
let hologramMaterials=createHologramMaterials([...baseColors,adultVenueColor]);
const assetController=new AbortController();
function waypointHeightScale([longitude,latitude]){
 // Rise gradually outside downtown: +50% at 3 km, up to +75% at 10 km.
 const distance=111320*Math.hypot((longitude+122.674)*Math.cos((latitude+45.523)*Math.PI/360),latitude-45.523);
 return 1+.5*smoothRange(1500,3000,distance)+.25*smoothRange(3000,10000,distance);
}
const waypoints=Promise.resolve({type:'FeatureCollection',features:[]});
// Roads and raised decks share one material and physical widths; the custom
// mesh adds thin sides and gradual approaches without another canvas/context.
const surfaceCache=new WeakMap();
const bridgeLayer=createBridgeLayer(maplibregl);
const citySparkles=createCitySparkles(maplibregl);
map.on('load',()=>{map.addLayer(bridgeLayer,'skyline');map.addLayer(citySparkles);});
function updateSurfaces(target){
 const cached=surfaceCache.get(target),now=performance.now();
 if(cached && now-cached.time<1600)return cached;
 if(!target.getLayer('bridge-decks'))return {buildings:[]};
 const buildings=[],seen=new Set();
 for(const f of target.querySourceFeatures('terrain',{sourceLayer:'building'})){
  const ring=f.geometry.type==='Polygon'?f.geometry.coordinates[0]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates[0][0]:null;
  if(!ring?.length)continue;
  const key=JSON.stringify(ring);if(seen.has(key))continue;seen.add(key);
  const center=ring.reduce((a,p)=>[a[0]+p[0]/ring.length,a[1]+p[1]/ring.length],[0,0]);
  const height=Math.max(6,Number(f.properties.render_height||f.properties.height)||9),base=Number(f.properties.render_min_height)||0;
  const screen=target.project(center);
  if(screen.x < -200||screen.y < -200||screen.x > window.innerWidth+200||screen.y > window.innerHeight+400)continue;
  buildings.push({center,height,ring});
 }
 bridgeLayer.update(target.querySourceFeatures('terrain',{sourceLayer:'transportation',filter:bridgeFilter}));
 // Geographic light/building associations change only when the surface cache refreshes.
 const reflections=[];
 for(const building of buildings){
  let light=null,distance=Infinity;
  for(const candidate of nearbyLights(building.center)){const c=candidate.geometry.coordinates,d=Math.hypot((c[0]-building.center[0])*.7,c[1]-building.center[1]);if(d<distance){distance=d;light=candidate;}}
  if(light&&distance<(light.properties.isBar?.0012:.0004))reflections.push({building,light});
 }
 const roofs=new Map(),nearbyBuildings=createSpatialIndex(buildings,building=>building.center);
 for(const feature of lightFeatures){let roof=9;const c=feature.geometry.coordinates;
  for(const building of nearbyBuildings(c))if(Math.hypot((building.center[0]-c[0])*.7,building.center[1]-c[1])<.00075)roof=Math.max(roof,building.height);
  roofs.set(feature.properties.phase,roof);
 }
 const result={time:now,buildings,reflections,roofs};surfaceCache.set(target,result);return result;
}
function drawSurfaceReflections(ctx,target,reflections,fade){
 const zoomScale=512*Math.pow(2,target.getZoom())/40075016.686;
 for(const {building,light} of reflections){
  const c=target.project(light.geometry.coordinates),lift=building.height*zoomScale/Math.cos(building.center[1]*Math.PI/180)*Math.sin(target.getPitch()*Math.PI/180);
  ctx.save();ctx.beginPath();
  building.ring.forEach((point,i)=>{const p=target.project(point);if(i)ctx.lineTo(p.x,p.y-lift);else ctx.moveTo(p.x,p.y-lift);});ctx.closePath();ctx.clip();
  const radius=light.properties.isBar?48:18,color=light.properties.color;
  const glow=ctx.createRadialGradient(c.x,c.y-lift,0,c.x,c.y-lift,radius);
  glow.addColorStop(0,color+'66');glow.addColorStop(.35,color+'28');glow.addColorStop(1,color+'00');
  ctx.globalAlpha=fade*.55;ctx.fillStyle=glow;ctx.fillRect(c.x-radius,c.y-lift-radius,radius*2,radius*2);ctx.restore();
 }
}
function roofLift(target,feature,surfaces){
 const coordinates=feature.geometry.coordinates,roof=surfaces.roofs?.get(feature.properties.phase)??9;
 const metersPerPixel=40075016.686*Math.cos(coordinates[1]*Math.PI/180)/(512*Math.pow(2,target.getZoom()));
 return Math.max(12,(roof+12)/metersPerPixel*Math.sin(target.getPitch()*Math.PI/180));
}
// One direct canvas overlay; no duplicate map, smoke pass, or texture uploads.
const lights=document.querySelector('#waypoint-lights');
let lightFeatures=[];
let assetsReady=false,assetError='',nearbyLights=()=>[];
const lightSprites=new Map();
const venueLogos=new Map();
const logoLoads=new Map();
function loadVenueLogo(url,mode){
 if(!url||venueLogos.has(url))return Promise.resolve();
 if(logoLoads.has(url))return logoLoads.get(url);
 const promise=decodeVenueLogo(url,mode);logoLoads.set(url,promise);return promise;
}
async function decodeVenueLogo(url,mode){
 const image=new Image();image.src=url;
 try{
  await image.decode();
  if(disposed)return;
  // Fit the visible artwork, ignoring transparent padding in the supplied file.
  const canvas=document.createElement('canvas');
  // Resolve the ink edge above display resolution before masking tiny originals.
  const sampling=Math.max(image.width,image.height)<256?4:1;
  const sourceWidth=canvas.width=image.width*sampling,sourceHeight=canvas.height=image.height*sampling;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,sourceWidth,sourceHeight);
  const artwork=ctx.getImageData(0,0,sourceWidth,sourceHeight),pixels=artwork.data;
  // Suppress low-opacity baked glow; keep anti-aliased solid white artwork.
  for(let i=0;i<pixels.length;i+=4){
   const coverage=logoCoverage(pixels[i],pixels[i+1],pixels[i+2],pixels[i+3],mode);
   const tone=mode==='grayscale'?Math.round(.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2]):255;
   pixels[i]=pixels[i+1]=pixels[i+2]=tone;pixels[i+3]=Math.round(coverage*255);
  }
  ctx.putImageData(artwork,0,0);
  let left=sourceWidth,top=sourceHeight,right=0,bottom=0;
  for(let y=0;y<sourceHeight;y++)for(let x=0;x<sourceWidth;x++)if(pixels[(y*sourceWidth+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right>=left){
   const cropWidth=right-left+1,cropHeight=bottom-top+1,ratio=Math.min(1,512/Math.max(cropWidth,cropHeight));
   const clean=document.createElement('canvas');clean.width=Math.ceil(cropWidth*ratio);clean.height=Math.ceil(cropHeight*ratio);
   const painter=clean.getContext('2d');painter.imageSmoothingQuality='high';painter.drawImage(canvas,left,top,cropWidth,cropHeight,0,0,clean.width,clean.height);
   const silhouette=document.createElement('canvas');silhouette.width=clean.width;silhouette.height=clean.height;
   const ink=silhouette.getContext('2d');ink.drawImage(clean,0,0);ink.globalCompositeOperation='source-in';ink.fillStyle='#000';ink.fillRect(0,0,clean.width,clean.height);
   // Cache the exact outlined artwork once, preserving its original aspect ratio.
   const fit=Math.min((clean.width/clean.height>3?29:25)/clean.width,21/clean.height);
   const outlineRadius=.22/fit,padding=Math.ceil(outlineRadius)+1;
   const outlined=document.createElement('canvas');outlined.width=clean.width+padding*2;outlined.height=clean.height+padding*2;
   const outline=outlined.getContext('2d');
   for(let i=0;i<8;i++){const angle=i*Math.PI/4;outline.drawImage(silhouette,padding+Math.cos(angle)*outlineRadius,padding+Math.sin(angle)*outlineRadius);}
   outline.drawImage(clean,padding,padding);
   const chromatic=['#00FFFF','#FF00CC'].map(color=>{const channel=document.createElement('canvas');channel.width=clean.width;channel.height=clean.height;const ctx=channel.getContext('2d');ctx.drawImage(clean,0,0);ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,channel.width,channel.height);return channel;});
   venueLogos.set(url,{image:clean,silhouette,outlined,chromatic,padding,left:0,top:0,width:clean.width,height:clean.height});
   canvas.width=canvas.height=1;

  }
 }catch(error){console.warn('Venue logo unavailable',url,error);}
}
const logoMotionSeed=Math.random()*Math.PI*2;
let pulseTime=0,motionDelta=1/30;
const logoPointer={x:0,y:0,active:false};
function trackLogoPointer(event){
 logoPointer.active=event.pointerType!=='touch'&&!event.target?.closest?.('aside,.credit');
 logoPointer.x=event.clientX;logoPointer.y=event.clientY;
}
function clearLogoPointer(){logoPointer.active=false;}
function leaveLogoPointer(event){if(!event.relatedTarget)clearLogoPointer();}
window.addEventListener('pointermove',trackLogoPointer,{passive:true});
window.addEventListener('pointerout',leaveLogoPointer,{passive:true});
window.addEventListener('blur',clearLogoPointer);
function logoPointerOffset(x,y,phase,halfWidth,halfHeight){
 if(!logoPointer.active||reduced.matches)return {x:0,y:0};
 const dx=x-logoPointer.x,dy=y-logoPointer.y,distance=Math.hypot(dx,dy);
 const edgeDistance=Math.hypot(Math.max(0,Math.abs(dx)-halfWidth*.72),Math.max(0,Math.abs(dy)-halfHeight*.72));
 const strength=34*(1-smoothRange(0,100,edgeDistance));
 const angle=distance>.01?Math.atan2(dy,dx):phase+logoMotionSeed;
 return {x:Math.cos(angle)*strength,y:Math.sin(angle)*strength};
}
function ensureLightSprite(color){
 if(lightSprites.has(color))return;
 const sprite=document.createElement('canvas');sprite.width=sprite.height=216;
 const ctx=sprite.getContext('2d');ctx.scale(9,9);
 const glow=ctx.createRadialGradient(12,12,0,12,12,12);
 glow.addColorStop(0,color+'bb');glow.addColorStop(.2,color+'88');glow.addColorStop(.5,color+'30');glow.addColorStop(1,color+'00');
 ctx.fillStyle=glow;ctx.fillRect(0,0,24,24);
 ctx.beginPath();ctx.arc(12,12,2,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
 lightSprites.set(color,sprite);

}
for(const color of [...baseColors,adultVenueColor])ensureLightSprite(color);
// Two shared, softly colored cloud stamps; no particle simulation or per-frame blur.
const mistSprites=Array.from({length:2},(_,variant)=>{
 const sprite=document.createElement('canvas');sprite.width=256;sprite.height=192;
 const ctx=sprite.getContext('2d');
 for(let puff=0;puff<21;puff++){
  const angle=puff*2.399963+variant*1.7,hue=(puff*360/21+variant*53)%360;
  const x=128+Math.cos(angle)*(29+13*Math.sin(puff*1.3)),y=96+Math.sin(angle)*27;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle*.3);ctx.scale(1,.28+.12*Math.sin(puff*.8)**2);
  const radius=44+12*Math.sin(puff*1.7+variant)**2,cloud=ctx.createRadialGradient(0,0,0,0,0,radius);
  cloud.addColorStop(0,`hsla(${hue},100%,64%,.32)`);
  cloud.addColorStop(.38,`hsla(${hue},100%,57%,.16)`);
  cloud.addColorStop(1,`hsla(${hue},100%,50%,0)`);
  ctx.fillStyle=cloud;ctx.fillRect(-radius,-radius,radius*2,radius*2);ctx.restore();
 }
 return sprite;
});
function drawLightMist(ctx,x,y,phase,fade){
 if(x < -110||x > window.innerWidth+110||y < -100||y > window.innerHeight+100)return;
 const clock=reduced.matches?0:pulseTime;
 ctx.save();
 for(let layer=0;layer<2;layer++){
  const drift=clock*(.075+layer*.018)+phase+layer*2.1;
  const size=180+12*Math.sin(drift*.73);
  ctx.save();ctx.translate(x+7*Math.sin(drift),y-5+5*Math.cos(drift*.81));
  ctx.rotate(.16*Math.sin(drift*.57)+layer*.75);
  ctx.globalAlpha=fade*(.17+.025*Math.sin(drift+layer));
  ctx.drawImage(mistSprites[layer],-size/2,-size*.375,size,size*.75);ctx.restore();
 }
 ctx.restore();
}
waypoints.then(async data=>{
 if(disposed)return;
 lightFeatures=data.features;nearbyLights=createSpatialIndex(lightFeatures,feature=>feature.geometry.coordinates);
 // The city can appear as soon as tiles and waypoint positions are ready.
 // A slow logo must never hold the whole map behind the poster.
 assetsReady=true;surfaceCache.delete(map);updateSceneStatus();scheduleFrame();
 const center=map.getCenter();
 const distance=feature=>Math.hypot((feature.geometry.coordinates[0]-center.lng)*.7,feature.geometry.coordinates[1]-center.lat);
 const queue=[...lightFeatures].filter(feature=>feature.properties.logo).sort((a,b)=>distance(a)-distance(b));
 // Bound decoding work and let the browser draw between each logo.
 async function loadNext(){
  while(queue.length&&!disposed){
   const feature=queue.shift();
   await loadVenueLogo(feature.properties.logo,feature.properties.logoMode);
   if(disposed)return;
   scheduleFrame();
   await new Promise(resolve=>setTimeout(resolve,0));
  }
 }
 await Promise.all(Array.from({length:3},loadNext));
 if(disposed)return;
 const missing=lightFeatures.some(feature=>feature.properties.isBar&&feature.properties.logo&&!venueLogos.has(feature.properties.logo));
 if(missing)console.warn('Some venue logos could not load; the map remains available.');
}).catch(error=>{if(disposed)return;console.error(error);assetError='Directory lights unavailable. Refresh to retry.';assetsReady=true;updateSceneStatus();scheduleFrame();});
// Choose the same geographic roof corner regardless of polygon winding or start.
const glitterCache=new WeakMap();
function buildingGlitter(target,surfaces){
 const now=performance.now(),cached=glitterCache.get(target);
 if(cached && cached.surfaces===surfaces)return cached.points;
 const points=roofSparkles(surfaces.buildings??[]);
 glitterCache.set(target,{time:now,surfaces,points});return points;
}
const logoFocus=createLogoFocus();
const hologramLayouts=new WeakMap();
const logoSpacing=1.15;
function hologramBounds(feature,scale){
 const logo=venueLogos.get(feature.properties.logo);
 if(!logo)return {halfWidth:85*logoSpacing*scale,halfHeight:67.5*logoSpacing*scale};
 const fit=Math.min((logo.width/logo.height>3?29:25)/logo.width,21/logo.height)*5.25;
 // Keep the 15% breathing room, measured around the actual logo artwork.
 return {halfWidth:Math.max(feature.properties.time?90:0,Math.max(65,(logo.width*fit/2+10)*logoSpacing))*scale,
  halfHeight:Math.max(feature.properties.time?150:0,Math.max(42,(logo.height*fit/2+10)*logoSpacing))*scale};
}
function separateHolograms(items,width,height){
 const overlaps=(a,b)=>Math.abs(a.x-b.x)<a.halfWidth+b.halfWidth&&Math.abs(a.y-b.y)<a.halfHeight+b.halfHeight;
 const topLimit=item=>item.p&&item.p.y>=-80&&item.p.y<=height&&item.p.x>=0&&item.p.x<=width?20+item.halfHeight:-Infinity;
 const keepTopVisible=()=>{for(const item of items)item.y=Math.max(topLimit(item),item.y);};
 keepTopVisible();
 // Enforce spacing on the final animated positions, after easing and screen-edge pull.
 for(let pass=0;pass<18;pass++){
  let changed=false;
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
   const a=items[i],b=items[j];if(!overlaps(a,b))continue;
   const dx=b.x-a.x,dy=b.y-a.y;
   const pushX=a.halfWidth+b.halfWidth-Math.abs(dx)+.5;
   const pushY=a.halfHeight+b.halfHeight-Math.abs(dy)+.5;
   const yieldA=.5+(b.attention-a.attention)*.25;
   if(pushX<pushY){const sign=dx<0?-1:1;a.x-=sign*pushX*yieldA;b.x+=sign*pushX*(1-yieldA);}
   else{const sign=dy<0?-1:1;a.y-=sign*pushY*yieldA;b.y+=sign*pushY*(1-yieldA);}
   changed=true;
  }
  keepTopVisible();
  if(!changed)return;
 }
 // Dense clusters still get a free slot; never leave an unresolved overlap.
 const placed=[];
 for(const item of items){
  if(placed.some(other=>overlaps(item,other))){
   const candidates=[];
   for(const other of placed){
    const dx=item.halfWidth+other.halfWidth+1,dy=item.halfHeight+other.halfHeight+1;
    candidates.push({x:other.x-dx,y:item.y},{x:other.x+dx,y:item.y},{x:item.x,y:other.y-dy},{x:item.x,y:other.y+dy});
   }
   const free=candidates.filter(candidate=>candidate.y>=topLimit(item)&&placed.every(other=>!overlaps({...item,...candidate},other)));
   const cost=point=>Math.hypot(point.x-item.x,point.y-item.y)+2*(Math.max(0,item.halfWidth-point.x,point.x+item.halfWidth-width)+Math.max(0,item.halfHeight-point.y,point.y+item.halfHeight-height+120));
   free.sort((a,b)=>cost(a)-cost(b));
   // If the top is full, use a lower slot rather than clipping the logo crown.
   const slot=free[0]??{x:item.x,y:Math.max(...placed.map(other=>other.y+other.halfHeight))+item.halfHeight+1};
   item.x=slot.x;item.y=slot.y;
  }
  placed.push(item);
 }
}
function hologramVariation(time,phase,channel){
 const seed=phase*7.31+logoMotionSeed+channel*31.7;
 const random=step=>{const value=Math.sin(step*127.1+seed)*43758.5453;return value-Math.floor(value);};
 const clock=time/(10+8*random(-1))+random(-2)*10,step=Math.floor(clock),fraction=clock-step;
 const blend=fraction*fraction*fraction*(fraction*(fraction*6-15)+10);
 return random(step)*(1-blend)+random(step+1)*blend;
}
function drawLights(fade,target=map,surface=lights){
 hitTargets=[];
 const eventLabels=[];
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 const activeToday=feature=>feature.properties.eventDay===today&&feature.properties.autoToday!==false;
 const emergenceFor=feature=>feature.properties.key===selectedKey||activeToday(feature)?1:reveal;
 const lights=surface,lightsContext=surface.getContext('2d');
 const surfaces=updateSurfaces(target);
 const width=window.innerWidth,height=window.innerHeight,dpr=Math.min(devicePixelRatio||1,2);
 const viewportScale=Math.min(1,Math.max(.72,(width-32)/680));
 // Full size at street level; zooming out can only reduce the presentation.
 const zoomScale=Math.min(1,Math.pow(2,(target.getZoom()-15)*.65));
 const presentationScale=viewportScale*zoomScale;
 if(lights.width!==Math.round(width*dpr)||lights.height!==Math.round(height*dpr)){lights.width=Math.round(width*dpr);lights.height=Math.round(height*dpr);}
 lightsContext.setTransform(dpr,0,0,dpr,0,0);lightsContext.clearRect(0,0,width,height);
 drawSurfaceReflections(lightsContext,target,surfaces.reflections??[],fade);
 citySparkles.update(buildingGlitter(target,surfaces),pulseTime,reduced.matches);
 const mapOpacity=Number(opacityControl.value),coreAlpha=mapOpacity>0?Math.min(1,fade/mapOpacity):0;
 const pointerBlend=1-Math.exp(-motionDelta*3.16);
 lightsContext.globalAlpha=fade;
 // Ground effects first, then upright pins from farthest to nearest.
 const ordered=lightFeatures.map(feature=>({feature,p:target.project(feature.geometry.coordinates)})).filter(({feature,p})=>p.x>=-420&&p.y>=-420&&p.x<=width+420&&p.y<=height+420*(feature.properties.isBar?feature.properties.heightScale:1)).sort((a,b)=>a.p.y-b.p.y);
 let layout=hologramLayouts.get(target);if(!layout){layout=new Map();hologramLayouts.set(target,layout);}
 const reveal=smoothRange(14.5,16.5,target.getZoom());
 // Expand a few distinct locations; individual event rows remain discoverable as orbs.
 const candidates=ordered.filter(v=>v.feature.properties.isBar&&(activeToday(v.feature)||v.feature.properties.key===selectedKey)&&v.p.x>=0&&v.p.x<=width&&v.p.y>=0&&v.p.y<=height);
 candidates.sort((a,b)=>Number(b.feature.properties.key===selectedKey)-Number(a.feature.properties.key===selectedKey)||Number(activeToday(b.feature))-Number(activeToday(a.feature))||Math.hypot(a.p.x-width/2,a.p.y-height/2)-Math.hypot(b.p.x-width/2,b.p.y-height/2)||String(a.feature.properties.key).localeCompare(String(b.feature.properties.key)));
 const beacons=[];
 for(const item of candidates){

  const [lng,lat]=item.feature.geometry.coordinates;
  if(beacons.some(other=>{
   const [otherLng,otherLat]=other.feature.geometry.coordinates;
   const sameLocation=Math.hypot((lng-otherLng)*Math.cos(lat*Math.PI/180),lat-otherLat)<.00065;
   const tooClose=Math.hypot(item.p.x-other.p.x,item.p.y-other.p.y)<(width<768?150:180);
   return sameLocation||(tooClose&&!activeToday(item.feature));
  }))continue;
  beacons.push(item);
 }
 const expandedKeys=new Set(beacons.map(item=>item.feature.properties.key));
 for(const item of beacons){
  const phase=item.feature.properties.phase;
  // Each venue slowly takes a turn holding its ground while its neighbors yield.
  item.attention=reduced.matches?.5:.5+.5*Math.sin(pulseTime*(.13+.025*Math.sin(phase))+phase*1.83);
  const driftX=reduced.matches?0:29*Math.sin(pulseTime*(.17+.025*Math.cos(phase))+phase)+9*Math.sin(pulseTime*.09+phase*2.4);
  const driftY=reduced.matches?0:15*Math.sin(pulseTime*.12+phase*1.6)-22*item.attention;
  item.scaleGoal=emergenceFor(item.feature)*presentationScale*Math.min(1,1+(reduced.matches?0:.1*hologramVariation(pulseTime,phase,0)));
  item.boundsGoal=hologramBounds(item.feature,item.scaleGoal);
  const heightBoost=reduced.matches?0:.2*hologramVariation(pulseTime,phase,1);
  item.x=item.p.x+driftX*zoomScale;item.y=item.p.y-(roofLift(target,item.feature,surfaces)+178.5*presentationScale)*item.feature.properties.heightScale*(1+heightBoost)+driftY*zoomScale;
  item.neighbors=beacons.filter(v=>v!==item&&Math.hypot(v.p.x-item.p.x,v.p.y-item.p.y)<220).length;
  item.y-=item.neighbors?((item.feature.properties.phase*1.71)%3)*25:0;
 }
 // Relax overlapping logo bounds, with restrained displacement from each fixed anchor.
 for(let iteration=0;iteration<12;iteration++)for(let i=0;i<beacons.length;i++)for(let j=i+1;j<beacons.length;j++){
  const a=beacons[i],b=beacons[j],dx=b.x-a.x,dy=b.y-a.y;
  const gapX=a.boundsGoal.halfWidth+b.boundsGoal.halfWidth,gapY=a.boundsGoal.halfHeight+b.boundsGoal.halfHeight;
  if(Math.abs(dx)<gapX&&Math.abs(dy)<gapY){
   const push=(gapX-Math.abs(dx))*.24,sign=dx<0?-1:1;
   const aYield=.5+(b.attention-a.attention)*.25;
   a.x-=push*sign*aYield*2;b.x+=push*sign*(1-aYield)*2;
   a.x=Math.max(a.p.x-155,Math.min(a.p.x+155,a.x));b.x=Math.max(b.p.x-155,Math.min(b.p.x+155,b.x));
   a.y-=5;b.y+=2;
  }
 }
 for(const item of beacons){
  // Seek screen space briefly, then release as the actual address passes out of view.
  const outside=Math.max(0,-item.p.x,item.p.x-width,-item.p.y,item.p.y-height);
  const keepVisible=1-smoothRange(60,230,outside);
  const marginX=Math.min(width/2,118*item.scaleGoal),marginY=Math.min(height/3,94*item.scaleGoal);
  const safeX=Math.max(marginX,Math.min(width-marginX,item.x));
  const safeY=Math.max(32+marginY,Math.min(height-90-marginY,item.y));
  item.x+=Math.max(-180,Math.min(180,safeX-item.x))*keepVisible;
  item.y+=Math.max(-180,Math.min(180,safeY-item.y))*keepVisible;
  const key=item.feature.properties.phase,prev=layout.get(key)||{x:item.x-item.p.x,y:item.y-item.p.y,scale:item.scaleGoal,vx:0,vy:0,vs:0,avoidX:0,avoidY:0};
  settleValue(prev,'x','vx',item.x-item.p.x,2.3,motionDelta);
  settleValue(prev,'y','vy',item.y-item.p.y,2.3,motionDelta);
  settleValue(prev,'scale','vs',item.scaleGoal,2.8,motionDelta);
  prev.scale=Math.min(prev.scale,presentationScale);layout.set(key,prev);
  item.offset=prev;
 }
 for(const item of beacons){
  const phase=item.feature.properties.phase;
  item.hover=reduced.matches?0:4.5*Math.sin(pulseTime*(.38+.035*Math.sin(phase))+phase)+1.8*Math.sin(pulseTime*.21+phase*1.71);
  item.x=item.p.x+item.offset.x;item.y=item.p.y+item.offset.y-item.hover;
  Object.assign(item,hologramBounds(item.feature,item.offset.scale));
  const avoidance=logoPointerOffset(item.x,item.y,phase,item.halfWidth,item.halfHeight);
  item.offset.avoidX+=(avoidance.x-item.offset.avoidX)*pointerBlend;
  item.offset.avoidY+=(avoidance.y-item.offset.avoidY)*pointerBlend;
  item.x+=item.offset.avoidX;item.y+=item.offset.avoidY;
 const emergence=emergenceFor(item.feature);
 item.x=item.p.x+(item.x-item.p.x)*emergence;
 item.y=item.p.y+(item.y-item.p.y)*emergence;
 }
 separateHolograms(beacons,width,height);
 // Collision avoidance cannot stretch a projector indefinitely at wide zoom.
 for(const item of beacons){item.x=Math.max(item.p.x-155*zoomScale,Math.min(item.p.x+155*zoomScale,item.x));item.y=Math.max(item.p.y-300*presentationScale,Math.min(item.p.y-70*presentationScale,item.y));}
 // Keep the pointer's temporary offset separate so it cannot accumulate into drift.
 for(const item of beacons){
  const x=item.x-item.p.x-item.offset.avoidX,y=item.y-item.p.y+item.hover-item.offset.avoidY;
  // A collision correction must not carry momentum back into a neighboring logo.
  if(Math.abs(x-item.offset.x)>.01)item.offset.vx=0;
  if(Math.abs(y-item.offset.y)>.01)item.offset.vy=0;
  item.offset.x=x;item.offset.y=y;
 }
 // Only loaded artwork actually on camera can receive a tracking frame.
 const visibleLogos=fade>.01?beacons.filter(item=>venueLogos.has(item.feature.properties.logo)&&item.x>0&&item.x<width&&item.y>0&&item.y<height):[];
 logoFocus.update(pulseTime,visibleLogos.map(item=>item.feature.properties.phase));
 for(const pass of [0,1])for(const {feature,p,offset,neighbors=0} of ordered){
  const {color,phase}=feature.properties;
  const isBar=expandedKeys.has(feature.properties.key);
  const hover=reduced.matches?0:4.5*Math.sin(pulseTime*(.38+.035*Math.sin(phase))+phase)+1.8*Math.sin(pulseTime*.21+phase*1.71);
  const beaconScale=offset?.scale??1;
  const lift=roofLift(target,feature,surfaces),raisedY=offset?p.y+offset.y+offset.avoidY+178.5*beaconScale-hover:p.y-lift-hover;
  const logoX=p.x+(offset?.x||0)+(offset?.avoidX||0),beamAlpha=1/(1+neighbors*.38);
  const emergence=isBar?emergenceFor(feature):0;
  if(pass===0){
   // An expanded projector owns its ground footprint. Nearby event/place rows
   // must not stack bright discovery balls over the original rings and pin light.
   const orbY=p.y-8;
   const underProjector=beacons.some(beacon=>Math.hypot(p.x-beacon.p.x,orbY-beacon.p.y)<42);
   if(isBar){hitTargets.push({key:feature.properties.key,x:p.x,y:p.y,r:22});}
   else if(!underProjector){drawDiscoveryOrb(lightsContext,p.x,raisedY,color,phase,fade*(1-emergence),coreAlpha*(1-emergence));hitTargets.push({key:feature.properties.key,x:p.x,y:raisedY,r:22});}
  }
  if(!isBar)continue;
  const pulse=reduced.matches?1:.8+.12*Math.sin(pulseTime*.43+phase)+.08*Math.sin(pulseTime*.173+phase*1.7);
  lightsContext.globalAlpha=fade*pulse*beamAlpha;
  if(isBar){
   if(pass===0){
   // Wide, flattened light spill on the ground; the upright pin's tip is the anchor.
   lightsContext.save();lightsContext.translate(p.x,p.y);lightsContext.scale(1,.58);
   const radius=147*beaconScale*(.94+.12*pulse);
   const spill=lightsContext.createRadialGradient(0,0,0,0,0,radius);
   spill.addColorStop(0,color+'cc');spill.addColorStop(.25,color+'88');spill.addColorStop(.6,color+'33');spill.addColorStop(1,color+'00');
   lightsContext.fillStyle=spill;lightsContext.fillRect(-radius,-radius,radius*2,radius*2);lightsContext.restore();
   lightsContext.save();
   lightsContext.strokeStyle=color;lightsContext.globalAlpha=fade*pulse*.4;lightsContext.lineWidth=1;
   lightsContext.beginPath();lightsContext.moveTo(p.x,p.y);lightsContext.lineTo(logoX,raisedY);lightsContext.stroke();
   lightsContext.restore();
   // Project a soft cone from the exact ground anchor up to the floating artwork.
   lightsContext.save();
   const top=raisedY-178.5*beaconScale,halfWidth=61.25*beaconScale;
   lightsContext.globalAlpha=Math.min(1,fade*pulse*beamAlpha*(color===adultVenueColor?1:1.2));
   drawProjectionBeam(lightsContext,hologramMaterials.beams.get(color),p,logoX,top,halfWidth);
   lightsContext.beginPath();lightsContext.moveTo(p.x-2,p.y);lightsContext.lineTo(logoX-halfWidth,top);lightsContext.lineTo(logoX+halfWidth,top);lightsContext.lineTo(p.x+2,p.y);lightsContext.closePath();
   // Sparse TV interference stays inside the beam, underneath the crisp logo.
   lightsContext.save();lightsContext.clip();
   // Layered projection bands: a slow rising scan, fine ribbing, and broken signal lines.
   // These are inexpensive canvas strokes; the original logo stays on its clear upper layer.
   const beamHeight=p.y-top,scanClock=reduced.matches?phase:pulseTime*(.045+.009*Math.sin(phase))+phase;
   const scanPosition=scanClock-Math.floor(scanClock);
   for(let band=0;band<24;band++){
    const row=((band/24)+scanPosition)%1,y=top+beamHeight*row;
    lightsContext.globalAlpha=fade*beamAlpha*smoothRange(0,.14,row)*(.025+.035*Math.sin(band*1.9+phase)**2);
    lightsContext.fillStyle=band%4===0?(color===adultVenueColor?'#160000':'#050918'):color;
    lightsContext.fillRect(Math.min(p.x,logoX)-halfWidth,y,Math.abs(p.x-logoX)+halfWidth*2,band%4===0?1.4:.7);
   }
   const scanY=p.y-beamHeight*scanPosition;
   const sweep=lightsContext.createLinearGradient(0,scanY-9,0,scanY+9);
   sweep.addColorStop(0,color+'00');sweep.addColorStop(.5,color+'b0');sweep.addColorStop(1,color+'00');
   lightsContext.globalAlpha=fade*beamAlpha*.38*smoothRange(0,.14,1-scanPosition);lightsContext.fillStyle=sweep;
   lightsContext.fillRect(Math.min(p.x,logoX)-halfWidth,scanY-9,Math.abs(p.x-logoX)+halfWidth*2,18);
   const staticTick=reduced.matches?0:Math.floor(pulseTime*(3.2+.6*Math.sin(phase))+phase*7);
   for(let line=0;line<7;line++){
    const seed=Math.sin(phase*23.7+line*91.3+staticTick*7.1)*43758.5453;
    const noise=seed-Math.floor(seed),height=p.y-top;
    const y=top+height*(.12+.78*noise);
    lightsContext.globalAlpha=fade*beamAlpha*(.055+.055*noise);
    lightsContext.fillStyle=line%3===0?(color===adultVenueColor?'#100000':'#020510'):color;
    lightsContext.fillRect(Math.min(p.x,logoX)-halfWidth,y,Math.abs(p.x-logoX)+halfWidth*2,line%3===0?1.3:.7);
   }
   lightsContext.restore();
   lightsContext.strokeStyle=color;lightsContext.lineWidth=.6;lightsContext.globalAlpha=fade*.18*beamAlpha;
   lightsContext.beginPath();lightsContext.moveTo(p.x,p.y);lightsContext.lineTo(logoX+(p.x-logoX)*.08,top+(p.y-top)*.08);lightsContext.stroke();
   lightsContext.globalAlpha=fade*pulse;lightsContext.lineWidth=1.2;
   lightsContext.beginPath();lightsContext.ellipse(p.x,p.y,15.75,6.125,0,0,Math.PI*2);lightsContext.stroke();
   const projectorAngle=reduced.matches?phase:pulseTime*.14+phase;
   lightsContext.globalAlpha=fade*pulse*.45;lightsContext.lineWidth=.8;
   lightsContext.beginPath();lightsContext.ellipse(p.x,p.y,22,8.55,0,projectorAngle,projectorAngle+Math.PI*.72);lightsContext.stroke();
   // Two stationary light echoes breathe at independent rates; the address stays still.
   for(let echo=0;echo<2;echo++){
    const breath=reduced.matches?.45:.5+.5*Math.sin(pulseTime*(.31+echo*.047)+phase*1.43-echo*1.9);
    lightsContext.globalAlpha=fade*pulse*beamAlpha*(.04+.15*breath*breath);
    lightsContext.lineWidth=echo?1.1:1.8;
    lightsContext.beginPath();lightsContext.ellipse(p.x,p.y,27+echo*7,10.5+echo*2.7,0,0,Math.PI*2);lightsContext.stroke();
   }
   lightsContext.globalAlpha=fade*pulse;
   lightsContext.fillStyle=color===adultVenueColor?adultVenueColor:'#eaffff';lightsContext.beginPath();lightsContext.arc(p.x,p.y,2.8,0,Math.PI*2);lightsContext.fill();
   lightsContext.restore();
   continue;
   }

   // Floating hologram: only the artwork and fine corner guides, no pin body.
   lightsContext.save();lightsContext.globalAlpha=coreAlpha;
   lightsContext.translate(logoX,raisedY);lightsContext.scale(5.25*beaconScale,5.25*beaconScale);
   const canCycle=feature.properties.alternateLogo&&venueLogos.has(feature.properties.alternateLogo);
   const cycle=pulseTime/5,swapProgress=(pulseTime%5)/.48;
   const cycleIndex=Math.floor(cycle);
   const alternate=canCycle&&(cycleIndex>0&&swapProgress<.5?cycleIndex-1:cycleIndex)%2===1;
   const artUrl=alternate?feature.properties.alternateLogo:feature.properties.logo;
   const logoKey=alternate?feature.properties.alternateLogoKey:feature.properties.logoKey;
   if(logoKey)hitTargets.push({key:logoKey,x:logoX,y:raisedY-178.5*beaconScale,r:Math.max(28,70*beaconScale)});
   const logo=venueLogos.get(artUrl)||venueLogos.get(feature.properties.logo),focus=logoFocus.active.get(phase);
   if(focus&&logo){
   const age=pulseTime-focus.start,remaining=focus.end-pulseTime;
   const focusAlpha=coreAlpha*Math.max(0,Math.min(1,age/.12,remaining/.18));
   const fit=Math.min((logo.width/logo.height>3?29:25)/logo.width,21/logo.height);
   const acquire=reduced.matches?0:1-smoothRange(0,.65,age);
   const search=reduced.matches?0:Math.sin(age*5+focus.seed)*acquire;
   lightsContext.save();lightsContext.globalAlpha=focusAlpha;
   lightsContext.lineWidth=.58;lightsContext.strokeStyle=color;lightsContext.lineJoin='round';
   for(const side of [-1,1])for(const end of [-1,1]){
    const x=side*(logo.width*fit/2+2.2+acquire*3)+search,y=-34+end*(logo.height*fit/2+2.2+acquire*2);
    lightsContext.beginPath();lightsContext.moveTo(x-side*2.8,y);lightsContext.lineTo(x,y);lightsContext.lineTo(x,y-end*2.8);lightsContext.stroke();
   }
   // Deterministic per-venue digital fragments, each with its own clock and sequence.
   // Keep the entire logo clear; fragments live only outside its artwork bounds.
   const motifClock=reduced.matches?phase:pulseTime*(.38+.11*Math.sin(phase*1.37))+phase*3.7;
   const motifStep=Math.floor(motifClock);
   for(let bit=0;bit<12;bit++){
    const seed=Math.sin((bit+1)*127.1+phase*91.7+motifStep*13.3)*43758.5453;
    const random=seed-Math.floor(seed);
    if(random<.34)continue;
    const side=bit%2===0?-1:1;
    const x=side*(15.5+random*3),y=-45+Math.floor(bit/2)*4.3;
    const shimmer=.55+.45*Math.sin(motifClock*2.1+bit*1.9);
    lightsContext.globalAlpha=focusAlpha*(.35+.55*shimmer);
    lightsContext.fillStyle=color;
    if(bit%3===0){
     lightsContext.fillRect(x,y,.65,.65);lightsContext.fillRect(x+side*1.2,y,.65,.65);
    }else{
     lightsContext.fillRect(x,y,.35,1.2+random*1.8);
    }
   }
   lightsContext.globalAlpha=focusAlpha*.8;
   lightsContext.lineWidth=.22;
   const orbit=reduced.matches?phase:motifClock*.7;
   lightsContext.beginPath();lightsContext.ellipse(0,-34,20,15,0,orbit,orbit+.38);lightsContext.stroke();
   lightsContext.beginPath();lightsContext.ellipse(0,-34,20,15,0,orbit+Math.PI,orbit+Math.PI+.22);lightsContext.stroke();
   // A slow scanner beneath the logo suggests projection without obscuring its detail.
   const scan=reduced.matches?0:Math.sin(pulseTime*.5+phase)*3;
   lightsContext.globalAlpha=focusAlpha*.65;
   lightsContext.beginPath();lightsContext.moveTo(-8+scan,-19);lightsContext.lineTo(3+scan,-19);lightsContext.stroke();
   lightsContext.restore();
   }
   if(feature.properties.time&&logo&&coreAlpha>.1){
    const fit=Math.min((logo.width/logo.height>3?29:25)/logo.width,21/logo.height)*5.25*beaconScale;
    const labelWidth=logo.width*fit*.86;
    eventLabels.push({key:feature.properties.key,name:feature.properties.name,time:feature.properties.time,color,x:logoX,y:raisedY-34*5.25*beaconScale+logo.height*fit/2+5,width:labelWidth,logoKey,logoY:raisedY-34*5.25*beaconScale,logoWidth:logo.width*fit,logoHeight:logo.height*fit,opacity:coreAlpha});
   }
   lightsContext.globalAlpha=coreAlpha;
   if(logo){
    lightsContext.save();lightsContext.translate(0,-34);
    const angle=reduced.matches?0:Math.sin(pulseTime*(.12+.025*Math.sin(phase))+phase*2.37+logoMotionSeed)*Math.PI/9;
    // Horizontal yaw: keep the artwork upright while it turns left and right.
    lightsContext.transform(Math.cos(angle),0,Math.sin(angle)*.12,1,0,0);
    lightsContext.translate(0,34);
    const maxWidth=logo.width/logo.height>3?29:25;
    const scale=Math.min(maxWidth/logo.width,21/logo.height),w=logo.width*scale,h=logo.height*scale;
    lightsContext.imageSmoothingEnabled=true;lightsContext.imageSmoothingQuality='high';
    const padding=logo.padding*scale;
    const glitch=canCycle&&cycleIndex>0&&!reduced.matches&&swapProgress<1?Math.sin(Math.PI*swapProgress):0;
    if(glitch>0){
     lightsContext.save();lightsContext.globalCompositeOperation='screen';lightsContext.globalAlpha=coreAlpha*glitch*.8;
     const offset=glitch*(1.1+.4*Math.sin(pulseTime*63));
     logo.chromatic.forEach((channel,i)=>lightsContext.drawImage(channel,-w/2+(i?offset:-offset),-34-h/2+(i?-.25:.25)*glitch,w,h));
     lightsContext.restore();
    }
    lightsContext.globalAlpha=coreAlpha*(1-glitch*.4);
    lightsContext.drawImage(logo.outlined,-w/2-padding,-34-h/2-padding,w+padding*2,h+padding*2);
    if(glitch>0){
     lightsContext.save();lightsContext.globalAlpha=coreAlpha*glitch*.75;
     for(let band=0;band<3;band++){const sy=((band*.31+pulseTime*.8)%1)*logo.height,sh=Math.min(logo.height*.045,logo.height-sy);const shift=Math.sin(pulseTime*47+band*2)*glitch*1.6;lightsContext.drawImage(logo.image,0,sy,logo.width,sh,-w/2+shift,-34-h/2+sy*scale,w,sh*scale);}
     lightsContext.restore();
    }
    // Tiny low-contrast digital scan, confined to the artwork's alpha mask.
    if(!reduced.matches){
     const band=(Math.sin(pulseTime*.31+phase*5.1)*.5+.5)*logo.height;
     const bandHeight=Math.max(1,logo.height*.008);
     lightsContext.globalAlpha=coreAlpha*.07;
     lightsContext.drawImage(logo.silhouette,logo.left,logo.top+band,logo.width,Math.min(bandHeight,logo.height-band),-w/2,-34-h/2+band*scale,w,Math.min(bandHeight,logo.height-band)*scale);
    }
    lightsContext.restore();

   }
   lightsContext.restore();
  }else if(pass===0){
   const size=126*(.92+.1*pulse);
   lightsContext.drawImage(lightSprites.get(color),p.x-size/2,raisedY-size/2,size,size);
   drawLightMist(lightsContext,p.x,raisedY,phase,fade);
   lightsContext.globalAlpha=coreAlpha;
   lightsContext.drawImage(hologramMaterials.orbs.get(color),p.x-12.5,raisedY-12.5,25,25);
  }
 }
 if(performance.now()-lastLabelUpdate>80){tell('labels',{labels:eventLabels});lastLabelUpdate=performance.now();}
}
// Gentle corridor: Ross Island Bridge -> downtown -> directory clusters -> Eagle, continuing north only until it leaves the viewport.
// Broad turns center the Old Town bar cluster, then the Mississippi/Alberta bars and Eagle.
const route=[[-122.66544,45.5018],[-122.663,45.509],[-122.667,45.517],[-122.6735,45.5236],[-122.674,45.5305],[-122.6715,45.541],[-122.6685,45.552],[-122.671,45.562],[-122.675349125866,45.572],[-122.675349125866,45.577275827371],[-122.675349125866,45.593],[-122.675349125866,45.61],[-122.675349125866,45.65]];
// Densify with a low-tension Hermite spline for gentle turns, then sample
// by distance so the camera maintains an even speed through tight bends.
const flightPath=[];
for(let i=0;i<route.length-1;i++){
 const a=route[Math.max(0,i-1)],b=route[i],c=route[i+1],d=route[Math.min(route.length-1,i+2)];
 for(let k=0;k<40;k++){
  const t=k/40,t2=t*t,t3=t2*t;
  flightPath.push(b.map((v,j)=>(2*t3-3*t2+1)*v+(t3-2*t2+t)*.5*(c[j]-a[j])+(-2*t3+3*t2)*c[j]+(t3-t2)*.5*(d[j]-b[j])));
 }
}
flightPath.push(route.at(-1));
const lengths=[0];
for(let i=1;i<flightPath.length;i++){const a=flightPath[i-1],b=flightPath[i];lengths.push(lengths[i-1]+Math.hypot((b[0]-a[0])*.7,b[1]-a[1]));}
function point(t){
 const distance=Math.max(0,Math.min(1,t))*lengths.at(-1);
 let lo=1,hi=lengths.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(lengths[mid]<distance)lo=mid+1;else hi=mid;}
 const i=lo,f=(distance-lengths[i-1])/(lengths[i]-lengths[i-1]);
 return flightPath[i-1].map((v,j)=>v+(flightPath[i][j]-v)*f);
}
// Smooth downtown close-up along the river: Ross Island Bridge to Lloyd district.
const normalZoom=(13.8849625+Math.log2(1.25));
function smoothRange(a,b,value){const x=Math.max(0,Math.min(1,(value-a)/(b-a)));return x*x*x*(x*(x*6-15)+10);}
function downtownZoom(latitude){
 const enter=smoothRange(45.501,45.521,latitude);
 const leave=1-smoothRange(45.528,45.551,latitude);
 // Hold a 35% closer view from Peacock to CC, with long, smooth approach/departure.
 const barApproach=smoothRange(45.508,45.517140237003,latitude);
 const barDeparture=1-smoothRange(45.524612586064,45.548,latitude);
 return normalZoom+Math.log2(1.5)*enter*leave+Math.log2(1.35)*barApproach*barDeparture;
}
const status=document.querySelector('#map-status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let selectedKey=null,hitTargets=[],lastLabelUpdate=0;
const mapElement=document.querySelector('#map'),opacityControl=document.querySelector('#map-opacity'),pauseControl=document.querySelector('#pause-flight'),speedControl=document.querySelector('#speed');
let loaded=false,elapsed=0,travel=0,last=0,frame=0,exitAt=null,disposed=false,cameraDirty=true,revealTime=0,loopWaiting=false;
const frameInterval=1000/30;
function flightSpeed(latitude){
 const enter=smoothRange(45.523078444325,45.523878444325,latitude);
 const leave=1-smoothRange(45.5308,45.5318,latitude);
 return 1-.2*enter*leave;
}
const flightDuration=lengths.at(-1)/0.0012374391317241246;
const eagleCoordinates=[-122.675349125866, 45.577275827371];
function flightCamera(t){
 const center=point(t);
 const cityReveal=smoothRange(45.503,45.520,center[1])*(1-smoothRange(45.529,45.554,center[1]));
 return {center,zoom:downtownZoom(center[1]),pitch:48+4*cityReveal,bearing:0};
}
const exploration=createMapExploration({
 map,pauseControl,reduced,message:document.querySelector('#exploration-status'),
 isReady:()=>loaded&&assetsReady,
 onExplore:()=>{
  cameraDirty=false;loopWaiting=false;exitAt=null;revealTime=3;
  clearLogoPointer();scheduleFrame();
 },
 returnCamera:()=>flightCamera(0),
 onResume:()=>{
  travel=0;elapsed=0;exitAt=null;loopWaiting=false;revealTime=3;last=0;cameraDirty=false;
  surfaceCache.delete(map);glitterCache.delete(map);hologramLayouts.delete(map);
  scheduleFrame();
 },
 onMove:()=>scheduleFrame()
});
function updateSceneStatus(){
 status.textContent=assetError||(loaded&&assetsReady?'':'Preparing Portland…');
 document.body.classList.toggle('scene-ready',loaded&&assetsReady);
}
function scheduleFrame(){if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
map.on('load',()=>{loaded=true;cameraDirty=true;updateSceneStatus();scheduleFrame();});
map.on('idle',()=>{
 if(loopWaiting){
  surfaceCache.delete(map);glitterCache.delete(map);hologramLayouts.delete(map);
  loopWaiting=false;revealTime=0;last=0;scheduleFrame();
 }
 else if(reduced.matches)scheduleFrame();
});
map.on('error',()=>{if(!loaded)status.textContent='Map tiles unavailable — check connection';});
function draw(now){
 frame=0;
 if(disposed||document.hidden)return;
 if(last&&now-last<frameInterval-1){scheduleFrame();return;}
 const dt=last?Math.min((now-last)/1000,.1):0;last=now;
 motionDelta=dt;
 if(!reduced.matches)pulseTime+=dt;
 const ready=loaded&&assetsReady;
 if(ready&&!loopWaiting)revealTime+=dt;
 const moving=ready&&!loopWaiting&&exploration.mode==='flight'&&!reduced.matches&&!pauseControl.checked&&Number(speedControl.value)>0;
 if(moving){
  elapsed+=dt;
  const exitEase=exitAt===null?1:1-.85*smoothRange(0,3.5,elapsed-exitAt);
  travel+=dt*.7*(Number(speedControl.value)/.6)*flightSpeed(point(Math.min(travel/flightDuration,1))[1])*exitEase;
 }
 // End from the actual projected Eagle location, so the loop fits any viewport.
 if(exitAt!==null && elapsed-exitAt>=3.5){
  elapsed=0;travel=0;revealTime=0;exitAt=null;loopWaiting=true;cameraDirty=true;
  hologramLayouts.delete(map);surfaceCache.delete(map);glitterCache.delete(map);
 }
 const t=Math.min(travel/flightDuration,1);
 if(loaded&&exploration.mode==='flight'&&(moving||cameraDirty)){
  cameraDirty=false;
  map.jumpTo(flightCamera(t));
  const eagle=map.project(eagleCoordinates);
  // Forty percent is above screen center, so do not wait until the camera passes Eagle.
  const eagleAtEnd=eagle.y>=window.innerHeight*.4&&eagle.y<=window.innerHeight&&eagle.x>=0&&eagle.x<=window.innerWidth;
  if(exitAt===null && (eagleAtEnd || t>=1))exitAt=elapsed;
 }
 const fade=!ready||loopWaiting?0:exitAt===null?(reduced.matches?1:smoothRange(0,3,revealTime)):1-smoothRange(.5,3.5,elapsed-exitAt);
 const visibility=Number(opacityControl.value)*fade;
 mapElement.style.opacity=visibility;
 if(ready)drawLights(visibility);
 if(!reduced.matches||!ready)scheduleFrame();
}
scheduleFrame();
function onSceneInput(){
 const speedOutput=document.querySelector('#speed-value'),mapOutput=document.querySelector('#map-value');
 if(speedOutput)speedOutput.value=`${Math.round(Number(speedControl.value)/.6*100)}%`;
 if(mapOutput)mapOutput.value=`${Math.round(Number(opacityControl.value)*100)}%`;
 exploration.noteActivity();
 scheduleFrame();
}
function onSceneResize(){cameraDirty=true;surfaceCache.delete(map);scheduleFrame();}
function onReducedChange(){last=0;clearLogoPointer();scheduleFrame();}
for(const control of [opacityControl,pauseControl,speedControl])control.addEventListener('input',onSceneInput);
window.addEventListener('resize',onSceneResize,{passive:true});
reduced.addEventListener('change',onReducedChange);
function onVisibilityChange(){
 cancelAnimationFrame(frame);frame=0;last=0;clearLogoPointer();
 scheduleFrame();
}
document.addEventListener('visibilitychange',onVisibilityChange);
window.addEventListener('pagehide',()=>{
 disposed=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',onVisibilityChange);
 exploration.dispose();
 assetController.abort();reduced.removeEventListener('change',onReducedChange);window.removeEventListener('resize',onSceneResize);
 for(const control of [opacityControl,pauseControl,speedControl])control.removeEventListener('input',onSceneInput);
 window.removeEventListener('pointermove',trackLogoPointer);window.removeEventListener('pointerout',leaveLogoPointer);window.removeEventListener('blur',clearLogoPointer);
 for(const sprite of mistSprites)sprite.width=sprite.height=1;
 hologramMaterials.dispose();
 for(const logo of venueLogos.values())for(const canvas of [logo.image,logo.silhouette,logo.outlined,...logo.chromatic])canvas.width=canvas.height=1;
 for(const sprite of lightSprites.values())sprite.width=sprite.height=1;
 if(map.getLayer(citySparkles.id))map.removeLayer(citySparkles.id);
 map.remove();venueLogos.clear();logoLoads.clear();lightSprites.clear();lightFeatures=[];nearbyLights=()=>[];lights.width=lights.height=1;
},{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});

// Interactive adapter: isolated from the original studio and homepage.
function tell(type,payload={}){parent.postMessage({source:'zaydar-demo',type,...payload},location.origin);}
function viewState(){const c=map.getCenter(),b=map.getBounds();tell('view',{center:[c.lat,c.lng],zoom:map.getZoom(),bounds:{south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()}});}
// Use the original Zaydar orb materials, breathing glow, and drifting mist.
function drawDiscoveryOrb(ctx,x,y,color,phase,fade,alpha){
 if(alpha<=0)return;
 const pulse=reduced.matches?1:.8+.12*Math.sin(pulseTime*.43+phase)+.08*Math.sin(pulseTime*.173+phase*1.7);
 const size=126*(.92+.1*pulse);
 ctx.save();ctx.globalAlpha=fade*pulse;
 ctx.drawImage(lightSprites.get(color),x-size/2,y-size/2,size,size);
 drawLightMist(ctx,x,y,phase,fade);
 ctx.globalAlpha=alpha;
 ctx.drawImage(hologramMaterials.orbs.get(color),x-12.5,y-12.5,25,25);
 ctx.restore();
}
let sequence=0,phases=new Map(),dataGeneration=0,paletteKey='';
async function setListings(rows){
 const generation=++dataGeneration;
 const colors=[...new Set([...baseColors,adultVenueColor,...rows.map(row=>row.color)])];
 for(const color of colors)ensureLightSprite(color);
 const nextPalette=colors.slice().sort().join(',');if(nextPalette!==paletteKey){hologramMaterials.dispose();hologramMaterials=createHologramMaterials(colors);paletteKey=nextPalette;}
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const dailyVenues=new Map();
 for(const row of rows){if(row.eventDay!==today||!row.venueKey)continue;const prev=dailyVenues.get(row.venueKey);const rank=r=>r.key===selectedKey?-Infinity:(new Date(r.startsAt).getTime()>=Date.now()?new Date(r.startsAt).getTime()-Date.now():1e15-new Date(r.startsAt).getTime());if(!prev||rank(row)<rank(prev))dailyVenues.set(row.venueKey,row);}
 rows=rows.map(row=>({...row,autoToday:row.eventDay===today&&(!row.venueKey||dailyVenues.get(row.venueKey)===row)}));
 lightFeatures=rows.map(row=>{if(!phases.has(row.key))phases.set(row.key,sequence++*2.399963);return {type:'Feature',geometry:{type:'Point',coordinates:row.coordinates},properties:{...row,isBar:true,heightScale:waypointHeightScale(row.coordinates),phase:phases.get(row.key)}};});
 nearbyLights=createSpatialIndex(lightFeatures,f=>f.geometry.coordinates);assetsReady=true;surfaceCache.delete(map);updateSceneStatus();scheduleFrame();
 const center=map.getCenter();const queue=[...lightFeatures].sort((a,b)=>Math.hypot(a.geometry.coordinates[0]-center.lng,a.geometry.coordinates[1]-center.lat)-Math.hypot(b.geometry.coordinates[0]-center.lng,b.geometry.coordinates[1]-center.lat));
 await Promise.all(Array.from({length:3},async()=>{while(queue.length&&!disposed&&generation===dataGeneration){const f=queue.shift();await loadVenueLogo(f.properties.logo,f.properties.logoMode);if(f.properties.alternateLogo)await loadVenueLogo(f.properties.alternateLogo,f.properties.logoMode);scheduleFrame();await new Promise(r=>setTimeout(r,0));}}));
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent||event.data?.source!=='zaydar-host')return;
 const {type,...data}=event.data;
 if(type==='data'&&Array.isArray(data.rows))void setListings(data.rows);
 if(type==='select'){selectedKey=data.key;const feature=lightFeatures.find(f=>f.properties.key===selectedKey);if(feature){pauseControl.checked=true;pauseControl.dispatchEvent(new Event('input'));map.easeTo({center:feature.geometry.coordinates,zoom:Math.max(16.5,map.getZoom()),duration:700});}scheduleFrame();}
 if(type==='locate'){pauseControl.checked=true;pauseControl.dispatchEvent(new Event('input'));map.easeTo({center:data.coordinates,zoom:16,duration:700});}
 if(type==='zoom')map.zoomTo(Math.max(10,Math.min(20,map.getZoom()+data.delta)),{duration:300});
 if(type==='mode'){pauseControl.checked=data.mode!=='flight';pauseControl.dispatchEvent(new Event('input'));}
 if(type==='labels')for(const id of ['road-labels','place-labels'])if(map.getLayer(id))map.setLayoutProperty(id,'visibility',data.enabled?'visible':'none');
 if(type==='pitch')map.easeTo({pitch:data.flat?0:48,bearing:0,duration:600});
});
let down=null;
map.getCanvas().addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
map.getCanvas().addEventListener('pointerup',e=>{
 if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7){down=null;return;}down=null;
 const hit=[...hitTargets].reverse().find(h=>Math.hypot(e.clientX-h.x,e.clientY-h.y)<h.r);
 if(hit){if(!hit.key.startsWith('directory-'))selectedKey=hit.key;tell('select',{key:hit.key});scheduleFrame();}
});
map.on('moveend',viewState);
map.on('webglcontextlost',()=>tell('fatal'));
map.on('load',()=>{
 pauseControl.checked=true;pauseControl.dispatchEvent(new Event('input'));viewState();tell('ready');
});
map.on('error',event=>tell('error',{message:event.error?.message||'Map data unavailable'}));
tell('ready');
