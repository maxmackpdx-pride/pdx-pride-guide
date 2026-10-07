export * from '../map-foundation/surface.js';
import {WATER_CYAN,BUILDING_LIGHT_OCCLUSION,FOREST_COLORS,naturalWater} from '../map-foundation/surface.js';
import {REFLECTION_COLORS,waterReflectionSegments} from './nightlife-materials.js?v=20260920-nightlife';

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
