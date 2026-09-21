import {vectorStyle} from '../home-flight/city-map.js';

export const WATER_CYAN = '#3a8f83'; // Moonlit mineral teal: oxidized copper softened for the night palette.
export const FOREST_COLORS = ['#06140e', '#0a1b12', '#0e2418'];
export const WOOD_FILL = '#0d1610';
export const GRASS_FILL = '#101812';
export const PARK_FILL = '#0e1712';
const GREEN_OPACITY = ['interpolate',['linear'],['zoom'],10,.55,14,.72,18,.85];

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
      paint: {'fill-color': GRASS_FILL, 'fill-opacity': GREEN_OPACITY, 'fill-antialias': true},
    });
  }
  layers.push({
    id: 'park-areas',
    type: 'fill',
    source: 'terrain',
    'source-layer': 'park',
    paint: {'fill-color': PARK_FILL, 'fill-opacity': GREEN_OPACITY, 'fill-antialias': true},
  });
  return layers;
}

export const naturalWater = ['all', ['in', ['get', 'class'], ['literal', ['river', 'lake', 'pond']]], ['!=', ['get', 'intermittent'], 1]];

/** Mapz extends the home city without mutating the homepage's materials. */
export function mapzSurfaceStyle({demTiles,contourTiles}={}) {
  const style = structuredClone(vectorStyle);
  style.sources.elevation = {
    type: 'raster-dem',
    ...(demTiles?{tiles:demTiles,maxzoom:13}:{url:'https://tiles.mapterhorn.com/tilejson.json'}),
    encoding: 'terrarium', tileSize: 512,
    attribution: '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>',
  };
  if(contourTiles)style.sources.contours={type:'vector',tiles:contourTiles,maxzoom:15};
  // Use the DEM for relief shading without warping the vector city onto a 3D
  // mesh. Draping these layers creates vertical curtains at polygon/tile edges.
  style.layers.unshift(
    {id:'ground',type:'background',paint:{'background-color':'#050506','background-opacity':1}},
    {id:'land-relief',type:'hillshade',source:'elevation',paint:{'hillshade-exaggeration':['interpolate',['linear'],['zoom'],10,.34,14,.24,17,.16],'hillshade-shadow-color':'#07110d','hillshade-highlight-color':'#53675d','hillshade-accent-color':'#132a20'}},
    ...quietGreenFills(),
    ...(contourTiles?[{id:'elevation-contours',type:'line',source:'contours','source-layer':'contours',minzoom:10,paint:{'line-color':'#35515a','line-opacity':['interpolate',['linear'],['zoom'],10,.08,12.5,.22,15,.14,18,.06],'line-width':['match',['get','level'],1,.85,.38]}}]:[]),
  );
  // Opaque terrain and water prevent the terrain framebuffer from exposing
  // lower surfaces. Underground transport must not be painted on top of land.
  const water = style.layers.find(layer=>layer.id==='water');
  water.paint = {'fill-color':['interpolate',['linear'],['zoom'],10,'#050e12',14,'#07171c',18,'#092229'],'fill-opacity':1};
  const streets = style.layers.find(layer=>layer.id==='streets');
  streets.filter = ['all', streets.filter, ['!=',['get','brunnel'],'tunnel'], ['>=',['coalesce',['get','layer'],0],0]];
  streets.paint['line-color']=['match',['get','class'],'motorway','#567386','trunk','#506c7e','primary','#486374','secondary','#3e5666','tertiary','#344a57','minor','#293a44','service','#213039','path','#1a272e','rail','#30434e','#293a44'];
  streets.paint['line-opacity']=['match',['get','class'],'motorway',1,'trunk',.96,'primary',.9,'secondary',.78,'tertiary',.66,'minor',.5,'service',.4,'path',.3,'rail',.58,.5];
  const streetIndex=style.layers.indexOf(streets);
  const casingWidth=structuredClone(streets.paint['line-width']);
  for(let i=4;i<casingWidth.length;i+=2)casingWidth[i]=['+',casingWidth[i],2];
  style.layers.splice(streetIndex,0,{...structuredClone(streets),id:'street-casings',paint:{'line-color':'#050b0e','line-opacity':.92,'line-width':casingWidth}});
  const banks = style.layers.find(layer=>layer.id==='banks');
  banks.filter = naturalWater;
  // Polygon rivers already carry a shoreline and interior material. Suppress
  // their centerline geometry while retaining genuinely narrow waterways.
  const streams = style.layers.find(layer=>layer.id==='streams');
  streams.filter = ['in',['get','class'],['literal',['stream','ditch','drain']]];
  const banksIndex=style.layers.indexOf(banks);
  // Native line layers remain continuous across vector-tile boundaries. Their
  // positive offset keeps almost all blur inside clockwise water polygons.
  style.layers.splice(banksIndex,0,
    {id:'water-bloom-wide',type:'line',source:'terrain','source-layer':'water',filter:naturalWater,paint:{'line-color':WATER_CYAN,'line-opacity':['interpolate',['linear'],['zoom'],10,.08,15,.14,18,.1],'line-width':['interpolate',['linear'],['zoom'],10,10,15,24,18,34],'line-blur':['interpolate',['linear'],['zoom'],10,7,15,14,18,20],'line-offset':['interpolate',['linear'],['zoom'],10,5,15,12,18,17]}},
    {id:'water-bloom-tight',type:'line',source:'terrain','source-layer':'water',filter:naturalWater,paint:{'line-color':WATER_CYAN,'line-opacity':['interpolate',['linear'],['zoom'],10,.14,15,.24,18,.18],'line-width':['interpolate',['linear'],['zoom'],10,4,15,9,18,13],'line-blur':['interpolate',['linear'],['zoom'],10,3,15,6,18,8],'line-offset':['interpolate',['linear'],['zoom'],10,2,15,4.5,18,6.5]}}
  );
  banks.paint = {'line-color':WATER_CYAN,'line-opacity':['interpolate',['linear'],['zoom'],10,.62,15,.85,18,.72],'line-width':['interpolate',['linear'],['zoom'],10,.7,15,1.2,18,1.6]};
  style.layers.find(layer=>layer.id==='skyline').paint['fill-extrusion-opacity'] = 1;
  return style;
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
  let signature='',revision=0;
  return {
    invalidate(){revision++;},
    draw(output,map,width,height,fade,time=0,reduced=false){
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
        for(let i=0;i<mask.length;i++){
          pixels.data.set([0,0,0,0],i*4);
        }
        ctx.putImageData(pixels,0,0);
        const centerMask=maskContext.createImageData(interior.width,interior.height);
        for(let i=0;i<mask.length;i++){
          const depth=mask[i]?Math.max(0,Math.min(1,(distances[i]-2)/(14/scale))):0;
          centerMask.data.set([255,255,255,Math.round(255*depth)],i*4);
        }
        maskContext.putImageData(centerMask,0,0);
      }
      reflectionContext.clearRect(0,0,reflection.width,reflection.height);
      const travel=reduced?.5:(time*.025)%1,sweepCenter=(-.15+travel*1.3)*reflection.width;
      const sheen=reflectionContext.createLinearGradient(sweepCenter-reflection.width*.22,reflection.height,sweepCenter+reflection.width*.22,0);
      sheen.addColorStop(0,'rgba(101,157,143,0)');sheen.addColorStop(.46,'rgba(101,157,143,.08)');sheen.addColorStop(.5,'rgba(181,207,190,.22)');sheen.addColorStop(.54,'rgba(101,157,143,.08)');sheen.addColorStop(1,'rgba(101,157,143,0)');
      reflectionContext.fillStyle=sheen;reflectionContext.fillRect(0,0,reflection.width,reflection.height);
      reflectionContext.globalCompositeOperation='destination-in';reflectionContext.drawImage(interior,0,0);reflectionContext.globalCompositeOperation='source-over';
      output.save();output.globalCompositeOperation='screen';output.globalAlpha=fade*.28;output.drawImage(reflection,-pad*scale,-pad*scale,reflection.width*scale,reflection.height*scale);output.restore();
    },
    dispose(){for(const canvas of [surface,interior,reflection])canvas.width=canvas.height=1;},
  };
}
