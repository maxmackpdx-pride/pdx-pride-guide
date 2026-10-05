import {vectorStyle} from '../home-flight/city-map.js';
import {REFLECTION_COLORS,waterReflectionSegments} from './nightlife-materials.js?v=20260920-nightlife';

export const WATER_CYAN = '#389187'; // Five percent cooler and more saturated, with the same HSL lightness.
export const BUILDING_SOLIDITY = .98;
export const BUILDING_LIGHT_OCCLUSION = .98;
export const FOREST_COLORS = ['#06140e', '#0a1b12', '#0e2418'];
export const WOOD_FILL = '#0d1610';
export const GRASS_FILL = '#101812';
export const PARK_FILL = '#0d1812';
export const BUILDING_FILL = '#223c45';
export const BUILDING_OUTLINE = '#7397a0';
// Keep developed ground in the same cool night family as the water and
// buildings. Subtle green-blue differences retain land-use depth without the
// previous brown blocks reading as a separate material.
export const NIGHT_EARTH = '#080c0c';
export const COMMERCIAL_EARTH = '#101817';
export const INDUSTRIAL_EARTH = '#121b1a';
const GREEN_OPACITY = ['interpolate',['linear'],['zoom'],10,.55,14,.72,18,.85];
const URBAN_GREEN_OPACITY = ['interpolate',['linear'],['zoom'],10,.55,14,.72,15.75,.72,16.5,.2,17,0];

function quietGreenFills() {
  const wood = ['wood','forest'];
  const leaf = ['grass','scrub','heath','meadow','grassland'];
  const layers = [];
  for (const sourceLayer of ['landcover','landuse']) {
    layers.push({
      id: `forest-${sourceLayer}`,
      type: 'fill',
      source: 'terrain',
      'source-layer': sourceLayer,
      filter: ['in', ['get', 'class'], ['literal', wood]],
      paint: {'fill-color': WOOD_FILL, 'fill-opacity': GREEN_OPACITY, 'fill-antialias': true},
    });
    layers.push({
      id: `leaf-${sourceLayer}`,
      type: 'fill',
      source: 'terrain',
      'source-layer': sourceLayer,
      filter: ['in', ['get', 'class'], ['literal', leaf]],
      paint: {'fill-color': GRASS_FILL, 'fill-opacity': URBAN_GREEN_OPACITY, 'fill-antialias': true},
    });
  }
  layers.push({
    id: 'park-areas',
    type: 'fill',
    source: 'terrain',
    'source-layer': 'park',
    paint: {'fill-color': PARK_FILL, 'fill-opacity': URBAN_GREEN_OPACITY, 'fill-antialias': true},
  });
  return layers;
}

function nightEarthFills() {
  return [{
    id:'developed-earth',type:'fill',source:'terrain','source-layer':'landuse',
    filter:['in',['get','class'],['literal',['commercial','retail','industrial']]],
    paint:{
      'fill-color':['match',['get','class'],'commercial',COMMERCIAL_EARTH,'retail',COMMERCIAL_EARTH,'industrial',INDUSTRIAL_EARTH,NIGHT_EARTH],
      'fill-opacity':['interpolate',['linear'],['zoom'],10,.42,14,.56,18,.66],
      'fill-antialias':true,
    },
  }];
}

export const naturalWater = ['all', ['in', ['get', 'class'], ['literal', ['river', 'lake', 'pond']]], ['!=', ['get', 'intermittent'], 1]];

/** Shared Mapz surface treatment used by Mapz and the homepage flyover. */
export function mapzSurfaceStyle({demTiles,contourTiles,terrainStrength=0}={}) {
  if(!Number.isFinite(terrainStrength)||terrainStrength<0||terrainStrength>1)throw new RangeError('Terrain strength must be between zero and one');
  const style = structuredClone(vectorStyle);
  style.sources.elevation = {
    type: 'raster-dem',
    ...(demTiles?{tiles:demTiles,maxzoom:13}:{url:'https://tiles.mapterhorn.com/tilejson.json'}),
    encoding: 'terrarium', tileSize: 512,
    attribution: '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>',
  };
  if(contourTiles)style.sources.contours={type:'vector',tiles:contourTiles,maxzoom:15};
  // Terrain remains opt-in while road approaches and model anchors are verified.
  if(terrainStrength>0){
    style.terrain={source:'elevation',exaggeration:terrainStrength};
    // Terrain and hillshade need independent tile state in MapLibre. They can
    // share the DEM protocol/cache, but must not share a raster source instance.
    style.sources['hillshade-elevation']=structuredClone(style.sources.elevation);
  }
  style.layers.unshift(
    {id:'ground',type:'background',paint:{'background-color':NIGHT_EARTH,'background-opacity':1}},
    {id:'land-relief',type:'hillshade',source:terrainStrength>0?'hillshade-elevation':'elevation',paint:{'hillshade-exaggeration':['interpolate',['linear'],['zoom'],10,.34,14,.24,17,.16],'hillshade-shadow-color':'#07110d','hillshade-highlight-color':'#53675d','hillshade-accent-color':'#132a20'}},
    ...nightEarthFills(),
    ...quietGreenFills(),
    ...(contourTiles?[{id:'elevation-contours',type:'line',source:'contours','source-layer':'contours',minzoom:10,paint:{'line-color':'#35515a','line-opacity':['interpolate',['linear'],['zoom'],10,.08,12.5,.22,15,.14,18,.06],'line-width':['match',['get','level'],1,.85,.38]}}]:[]),
  );
  // Opaque terrain and water prevent the terrain framebuffer from exposing
  // lower surfaces. Underground transport must not be painted on top of land.
  const water = style.layers.find(layer=>layer.id==='water');
  water.paint = {'fill-color':['interpolate',['linear'],['zoom'],10,'#050e12',14,'#06171d',18,'#08222a'],'fill-opacity':1};
  const streets = style.layers.find(layer=>layer.id==='streets');
  streets.filter = ['all', streets.filter, ['!=',['get','brunnel'],'tunnel'], ['>=',['coalesce',['get','layer'],0],0]];
  streets.layout={'line-cap':'round','line-join':'round'};
  streets.paint['line-color']=['match',['get','class'],'motorway','#3c5565','trunk','#394f5e','primary','#354a58','secondary','#30434f','tertiary','#2b3b46','minor','#24333c','service','#1d2a32','path','#182329','rail','#293b45','#24333c'];
  streets.paint['line-opacity']=['match',['get','class'],'motorway',.97,'trunk',.94,'primary',.88,'secondary',.76,'tertiary',.64,'minor',.48,'service',.38,'path',.28,'rail',.54,.48];
  const streetIndex=style.layers.indexOf(streets);
  const casingWidth=structuredClone(streets.paint['line-width']);
  for(let i=4;i<casingWidth.length;i+=2)casingWidth[i]=['+',casingWidth[i],2];
  style.layers.splice(streetIndex,0,{...structuredClone(streets),id:'street-casings',paint:{'line-color':'#070a0b','line-opacity':.96,'line-width':casingWidth}});
  const highwayEdge={
    ...structuredClone(streets),id:'highway-edge-light',
    filter:['all',streets.filter,['in',['get','class'],['literal',['motorway','trunk']]]],
    paint:{'line-color':'#7993a1','line-opacity':['interpolate',['linear'],['zoom'],10,.12,15,.22,18,.17],
      'line-width':['interpolate',['linear'],['zoom'],10,.28,15,.46,18,.62],
      'line-gap-width':['interpolate',['exponential',2],['zoom'],8,0,12,.55,14,2,16,9,18,40,22,684]},
  };
  style.layers.splice(style.layers.indexOf(streets)+1,0,highwayEdge);
  const roadId=['to-number',['id'],0];
  style.layers.splice(style.layers.indexOf(streets)+1,0,{
    id:'night-street-inlays',type:'line',source:'terrain','source-layer':'transportation',minzoom:12,
    filter:['all',streets.filter,['in',['get','class'],['literal',['primary','secondary']]],['!=',['get','brunnel'],'bridge']],
    layout:{'line-cap':'round','line-join':'round'},
    paint:{
      'line-color':['case',['all',['>',roadId,0],['==',['%',roadId,11],0]],'#955285','#438b96'],
      'line-width':['interpolate',['exponential',2],['zoom'],12,.08,16,.55,18,1.25],
      'line-opacity':['interpolate',['linear'],['zoom'],12,0,14,.28,16,.42,18,.36],
    },
  });
  const banks = style.layers.find(layer=>layer.id==='banks');
  banks.filter = naturalWater;
  // Water polygons and narrow waterways use the water material alone. Vector
  // centerlines read as seams through rivers and streams at overview zooms.
  const streams = style.layers.find(layer=>layer.id==='streams');
  streams.layout = {'visibility':'none'};
  // Keep one restrained shoreline. The bloom is generated from the interior
  // water mask below, so no blurred line can leak onto land at sharp bends.
  banks.paint = {'line-color':WATER_CYAN,'line-opacity':['interpolate',['linear'],['zoom'],10,.2,15,.32,18,.26],'line-width':['interpolate',['linear'],['zoom'],10,.4,15,.6,18,.8]};
  const skyline=style.layers.find(layer=>layer.id==='skyline');
  skyline.paint['fill-extrusion-color'] = BUILDING_FILL;
  skyline.paint['fill-extrusion-opacity'] = BUILDING_SOLIDITY;
  // The flat footprint line must render below the extrusion. Above it, every
  // hidden footprint is painted across roofs and walls like transparent wire.
  const buildingOutlines=style.layers.find(layer=>layer.id==='buildings');
  buildingOutlines.paint['line-color'] = BUILDING_OUTLINE;
  style.layers.splice(style.layers.indexOf(buildingOutlines),1);
  style.layers.splice(style.layers.indexOf(skyline),0,buildingOutlines);
  return style;
}

const buildingOcclusionCache=new WeakMap();

/** Remove overlay light where 3D roofs and camera-facing walls cover it. */
export function applyBuildingOcclusion(ctx,target,buildings,solidity=BUILDING_LIGHT_OCCLUSION) {
  if(!buildings.length||solidity<=0)return;
  const zoomScale=512*Math.pow(2,target.getZoom())/40075016.686,pitch=Math.sin(target.getPitch()*Math.PI/180);
  const center=target.getCenter();
  const key=[center.lng,center.lat,target.getZoom(),target.getPitch(),target.getBearing(),ctx.canvas.width,ctx.canvas.height].join(':');
  let cached=buildingOcclusionCache.get(target);
  if(!cached||cached.key!==key||cached.buildings!==buildings){
    // Build a detached path once per camera/geometry change. Appending thousands
    // of subpaths to the live canvas causes costly closePath work on every frame.
    const path=new Path2D();
    // Normalize winding so overlapping roofs and walls form one union. Even-odd
    // fill cancels their overlap and exposes rectangular strips of the beam.
    const polygon=points=>{
      const area=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a.x*b.y-b.x*a.y;},0);
      if(area<0)points.reverse();
      // fill() closes each subpath; closePath() repeatedly scans the growing city mask.
      points.forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));
    };
    for(const building of buildings){
      const lift=building.height*zoomScale/Math.cos(building.center[1]*Math.PI/180)*pitch;
      const footprint=building.ring.map(point=>target.project(point));
      polygon(footprint.map(p=>({x:p.x,y:p.y-lift})));
      const winding=footprint.reduce((sum,a,i)=>{const b=footprint[(i+1)%footprint.length];return sum+a.x*b.y-b.x*a.y;},0);
      for(let i=0;i<footprint.length;i++){
        const a=footprint[i],b=footprint[(i+1)%footprint.length];if((b.x-a.x)*winding>=0)continue;
        polygon([{x:a.x,y:a.y-lift},{x:b.x,y:b.y-lift},b,a]);
      }
    }
    cached={key,buildings,path};buildingOcclusionCache.set(target,cached);
  }
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=solidity;ctx.fillStyle='#000';ctx.fill(cached.path,'nonzero');ctx.restore();
}

/** Legacy canopy sprite. Unused by the live style. Kept so old imports do not throw. */
export function forestPattern(size=48) {
  const palette=FOREST_COLORS.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
  const data=new Uint8Array(size*size*4);
  const hash=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
  const lobes=[];
  for(let crown=0;crown<11;crown++){
    const cx=hash(crown*7+1)*size,cy=hash(crown*7+2)*size,radius=size*(.11+hash(crown*7+3)*.09);
    for(let lobe=0;lobe<5;lobe++){
      const angle=Math.PI*2*(lobe/5+hash(crown*19+lobe)*.12),spread=radius*(.18+.48*hash(crown*29+lobe));
      lobes.push({x:cx+Math.cos(angle)*spread,y:cy+Math.sin(angle)*spread,r:radius*(.62+.34*hash(crown*37+lobe))});
    }
  }
  const wrapped=(a,b)=>{const distance=Math.abs(a-b)%size;return Math.min(distance,size-distance);};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let canopy=-1;
    for(const lobe of lobes){const distance=Math.hypot(wrapped(x,lobe.x),wrapped(y,lobe.y));canopy=Math.max(canopy,1-distance/lobe.r);}
    const dapple=.12*Math.sin(x*.91+y*.37)+.08*Math.cos(y*1.17-x*.29),tone=canopy+dapple;
    const color=palette[tone<.08?0:tone>.47?2:1],i=(y*size+x)*4;
    data.set([...color,255],i);
  }
  return {width:size,height:size,data};
}

/** Distance to the union's shoreline, measured only inside water pixels. */
export function inwardDistances(mask,width,height) {
  const d=new Float32Array(mask.length),diagonal=Math.SQRT2;
  for(let i=0;i<d.length;i++)d[i]=mask[i]?1e6:0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=y*width+x;if(!mask[i])continue;
    if(x)d[i]=Math.min(d[i],d[i-1]+1);
    if(y)d[i]=Math.min(d[i],d[i-width]+1);
    if(x&&y)d[i]=Math.min(d[i],d[i-width-1]+diagonal);
    if(x+1<width&&y)d[i]=Math.min(d[i],d[i-width+1]+diagonal);
  }
  for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){
    const i=y*width+x;if(!mask[i])continue;
    if(x+1<width)d[i]=Math.min(d[i],d[i+1]+1);
    if(y+1<height)d[i]=Math.min(d[i],d[i+width]+1);
    if(x+1<width&&y+1<height)d[i]=Math.min(d[i],d[i+width+1]+diagonal);
    if(x&&y+1<height)d[i]=Math.min(d[i],d[i+width-1]+diagonal);
  }
  return d;
}

export function createWaterBloom() {
  const surface=document.createElement('canvas'),interior=document.createElement('canvas'),reflection=document.createElement('canvas');
  const ctx=surface.getContext('2d',{willReadFrequently:true}),maskContext=interior.getContext('2d'),reflectionContext=reflection.getContext('2d');
  let signature='',revision=0,reflectionSignature='',reflectionPaths=[];
  return {
    invalidate(){revision++;},
    draw(output,map,width,height,fade,time=0,reduced=false,lightSources=[]){
      const center=map.getCenter();
      const key=[revision,width,height,center.lng,center.lat,map.getZoom(),map.getBearing(),map.getPitch()].join(':');
      const scale=Math.max(2,Math.max(width,height)/384),pad=32;
      if(signature!==key){
        signature=key;
        surface.width=interior.width=reflection.width=Math.ceil(width/scale)+pad*2;
        surface.height=interior.height=reflection.height=Math.ceil(height/scale)+pad*2;
        ctx.fillStyle='#fff';
        const features=map.querySourceFeatures('terrain',{sourceLayer:'water',filter:naturalWater});
        // Fill all fragments into one union before computing distance: tile seams
        // are not shorelines. Even-odd polygon fill keeps islands dry.
        for(const feature of features){
          const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates:[];
          for(const polygon of polygons){
            ctx.beginPath();
            for(const ring of polygon){ring.forEach((point,i)=>{const p=map.project(point);if(i)ctx.lineTo(p.x/scale+pad,p.y/scale+pad);else ctx.moveTo(p.x/scale+pad,p.y/scale+pad);});ctx.closePath();}
            ctx.fill('evenodd');
          }
        }
        const pixels=ctx.getImageData(0,0,surface.width,surface.height),mask=new Uint8Array(surface.width*surface.height);
        for(let i=0;i<mask.length;i++)mask[i]=pixels.data[i*4+3]>127?1:0;
        const distances=inwardDistances(mask,surface.width,surface.height);
        const falloff=Math.max(3.5,24/scale);
        for(let i=0;i<mask.length;i++){
          const alpha=mask[i]?Math.round(52*Math.exp(-Math.max(0,distances[i]-1)/falloff)):0;
          pixels.data.set([56,145,135,alpha],i*4);
        }
        ctx.putImageData(pixels,0,0);
        const centerMask=maskContext.createImageData(interior.width,interior.height);
        for(let i=0;i<mask.length;i++){
          const depth=mask[i]?Math.max(0,Math.min(1,(distances[i]-2)/(14/scale))):0;
          centerMask.data.set([255,255,255,Math.round(255*depth)],i*4);
        }
        maskContext.putImageData(centerMask,0,0);
      }
      output.save();output.globalCompositeOperation='screen';output.globalAlpha=fade*.45;output.drawImage(surface,-pad*scale,-pad*scale,surface.width*scale,surface.height*scale);output.restore();
      reflectionContext.clearRect(0,0,reflection.width,reflection.height);
      const coordinates=lightSources.slice(0,120).map(source=>source.geometry?.coordinates??source.coordinates).filter(Boolean);
      const reflectionKey=key+':'+coordinates.map(c=>c.join(',')).join(';');
      if(reflectionSignature!==reflectionKey){
        reflectionSignature=reflectionKey;reflectionPaths=Array.from({length:9},()=>new Path2D());
        for(const coordinate of coordinates){
          const anchor=map.project(coordinate);
          if(anchor.x<-160||anchor.x>width+160||anchor.y<-160||anchor.y>height+160)continue;
          for(const segment of waterReflectionSegments(coordinate)){
            const a=map.project(segment.a),b=map.project(segment.b),path=reflectionPaths[segment.group];
            path.moveTo(a.x/scale+pad,a.y/scale+pad);path.lineTo(b.x/scale+pad,b.y/scale+pad);
          }
        }
      }
      reflectionContext.globalCompositeOperation='screen';reflectionContext.lineCap='round';
      reflectionContext.lineWidth=2.2*512*Math.pow(2,map.getZoom())/(40075016.686*Math.cos(center.lat*Math.PI/180)*scale);
      reflectionPaths.forEach((path,i)=>{
        reflectionContext.strokeStyle=REFLECTION_COLORS[Math.floor(i/3)];
        reflectionContext.globalAlpha=reduced?.38:.32+.12*Math.sin(time*.55+i*2.1);
        reflectionContext.stroke(path);
      });
      reflectionContext.globalAlpha=1;
      reflectionContext.globalCompositeOperation='destination-in';reflectionContext.drawImage(interior,0,0);reflectionContext.globalCompositeOperation='source-over';
      output.save();output.globalCompositeOperation='screen';output.globalAlpha=fade*.48;output.drawImage(reflection,-pad*scale,-pad*scale,reflection.width*scale,reflection.height*scale);output.restore();
    },
    dispose(){for(const canvas of [surface,interior,reflection])canvas.width=canvas.height=1;},
  };
}
