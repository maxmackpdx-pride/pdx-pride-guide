import {vectorStyle} from '../home-flight/city-map.js';

export const WATER_CYAN = '#00bfbf'; // Cyan mixed with 25% black; glow alpha stays unchanged.
export const FOREST_COLORS = ['#09251a', '#103322', '#19432c'];
export const naturalWater = ['all', ['in', ['get', 'class'], ['literal', ['river', 'lake', 'pond']]], ['!=', ['get', 'intermittent'], 1]];

/** Mapz extends the home city without mutating the homepage's materials. */
export function mapzSurfaceStyle() {
  const style = structuredClone(vectorStyle);
  style.sources.elevation = {
    type: 'raster-dem', url: 'https://tiles.mapterhorn.com/tilejson.json',
    encoding: 'terrarium', tileSize: 512,
    attribution: '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>',
  };
  style.terrain = {source: 'elevation', exaggeration: 1};
  style.layers.unshift(
    {id:'ground',type:'background',paint:{'background-color':'#050506','background-opacity':1}},
    {id:'land-relief',type:'hillshade',source:'elevation',paint:{'hillshade-exaggeration':.22,'hillshade-shadow-color':'#183b31','hillshade-highlight-color':'#84998e','hillshade-accent-color':'#234738'}},
    ...['landcover','landuse'].map(sourceLayer=>({id:`forest-${sourceLayer}`,type:'fill',source:'terrain','source-layer':sourceLayer,filter:['in',['get','class'],['literal',['wood','forest']]],paint:{'fill-pattern':'forest-canopy','fill-opacity':1}})),
  );
  // Opaque terrain and water prevent the terrain framebuffer from exposing
  // lower surfaces. Underground transport must not be painted on top of land.
  const water = style.layers.find(layer=>layer.id==='water');
  water.paint = {'fill-color':'#091318','fill-opacity':1};
  const streets = style.layers.find(layer=>layer.id==='streets');
  streets.filter = ['all', streets.filter, ['!=',['get','brunnel'],'tunnel'], ['>=',['coalesce',['get','layer'],0],0]];
  // Water bloom is clipped to water geometry, so no cyan haze spills onto land.
  const banks = style.layers.find(layer=>layer.id==='banks');
  banks.filter = naturalWater;
  banks.paint = {'line-color':WATER_CYAN,'line-opacity':.85,'line-width':1.2};
  style.layers.find(layer=>layer.id==='skyline').paint['fill-extrusion-opacity'] = 1;
  return style;
}

/** Seamlessly repeating canopy patches, using exactly three dark-green shades. */
export function forestPattern(size=64) {
  const palette=FOREST_COLORS.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size*Math.PI*2,v=y/size*Math.PI*2;
    const patch=Math.sin(u*4+Math.sin(v*3))+.7*Math.cos(v*5+Math.sin(u*2))+.35*Math.sin(u*11+v*7);
    const color=palette[patch<-.45?0:patch>.5?2:1],i=(y*size+x)*4;
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
  const surface=document.createElement('canvas');
  const ctx=surface.getContext('2d',{willReadFrequently:true});
  let signature='',revision=0;
  return {
    invalidate(){revision++;},
    draw(output,map,width,height,fade){
      const center=map.getCenter();
      const key=[revision,width,height,center.lng,center.lat,map.getZoom(),map.getBearing(),map.getPitch()].join(':');
      const scale=Math.max(2,Math.max(width,height)/384),pad=32;
      if(signature!==key){
        signature=key;
        surface.width=Math.ceil(width/scale)+pad*2;surface.height=Math.ceil(height/scale)+pad*2;
        ctx.fillStyle='#fff';
        const features=map.queryRenderedFeatures({layers:['water'],filter:naturalWater});
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
        const distances=inwardDistances(mask,surface.width,surface.height),radius=38/scale;
        for(let i=0;i<mask.length;i++){
          const falloff=mask[i]?Math.exp(-distances[i]/radius):0;
          pixels.data.set([0,191,191,Math.round(150*falloff)],i*4);
        }
        ctx.putImageData(pixels,0,0);
      }
      output.save();output.globalAlpha=fade;output.drawImage(surface,-pad*scale,-pad*scale,surface.width*scale,surface.height*scale);output.restore();
    },
    dispose(){surface.width=surface.height=1;},
  };
}
