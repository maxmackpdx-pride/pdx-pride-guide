import {sampleBridgeRoad} from './bridge-fit.js?v=20260921-layer-join';

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

export function bridgeGlowColor(palette,fraction){
 const stops=BRIDGE_GLOW_PALETTES[palette]||BRIDGE_GLOW_PALETTES.rainbow;
 const position=Math.max(0,Math.min(1,fraction))*(stops.length-1);
 const index=Math.min(stops.length-2,Math.floor(position)),mix=position-index;
 const a=parseInt(stops[index].slice(1),16),b=parseInt(stops[index+1].slice(1),16);
 return [16,8,0].map(shift=>Math.round(((a>>shift)&255)*(1-mix)+((b>>shift)&255)*mix));
}

/** Sample the same fitted road as the real bridge, never a screen-space guess. */
export function bridgeGlowSpans(models,elevation=()=>0){
 return models.filter(model=>model.fit&&Object.hasOwn(BRIDGE_GLOW_THEMES,model.id)).map(model=>{
  const count=Math.max(8,Math.min(72,Math.ceil(model.fit.length/32)));
  const first=sampleBridgeRoad(model.fit,0).coordinate,last=sampleBridgeRoad(model.fit,1).coordinate;
  const reverse=first[0]>last[0]||(first[0]===last[0]&&first[1]>last[1]);
  return {id:model.id,palette:BRIDGE_GLOW_THEMES[model.id],step:model.fit.length/count,
   samples:Array.from({length:count+1},(_,i)=>{
    const sample=sampleBridgeRoad(model.fit,i/count);
    return {...sample,clearance:Math.max(0,sample.height-elevation(sample.coordinate)),fraction:reverse?1-i/count:i/count};
   })};
 });
}

const metersPerLatitude=111320;
function offset(coordinate,east,north){
 return [coordinate[0]+east/(metersPerLatitude*Math.cos(coordinate[1]*Math.PI/180)),coordinate[1]+north/metersPerLatitude];
}

/** Shared tiny stamps, painted only when the camera or fitted bridge geometry changes. */
export function createBridgeWaterGlow(){
 const stamps=new Map();
 function stamp(palette,fraction){
  const bin=Math.round(fraction*48),key=palette+bin;
  if(stamps.has(key))return stamps.get(key);
  const color=bridgeGlowColor(palette,bin/48).join(','),canvas=document.createElement('canvas');
  canvas.width=canvas.height=48;const ctx=canvas.getContext('2d');
  const glow=ctx.createRadialGradient(24,24,0,24,24,24);
  glow.addColorStop(0,`rgba(${color},.28)`);glow.addColorStop(.25,`rgba(${color},.22)`);
  glow.addColorStop(.6,`rgba(${color},.065)`);glow.addColorStop(1,`rgba(${color},0)`);
  ctx.fillStyle=glow;ctx.fillRect(0,0,48,48);stamps.set(key,canvas);return canvas;
 }
 return {
  paint(ctx,map,spans,scale,pad,width,height){
   const zoom=map.getZoom(),pitch=Math.sin(map.getPitch()*Math.PI/180),decks=[];
   const toPixel=coordinate=>{const p=map.project(coordinate);return {x:p.x/scale+pad,y:p.y/scale+pad};};
   ctx.globalCompositeOperation='screen';
   for(const span of spans){
    let previous=null;
    for(const sample of span.samples){
     const {coordinate,dx,dy,fraction}=sample,p=toPixel(coordinate);
     if(p.x<-40||p.x>width/scale+pad*2+40||p.y<-40||p.y>height/scale+pad*2+40){previous=null;continue;}
     const along=Math.max(18,span.step*1.2),across=32;
     const a=toPixel(offset(coordinate,dx*along,-dy*along));
     const b=toPixel(offset(coordinate,dy*across,dx*across));
     // The projected east/north basis flattens and rotates the glow with water.
     ctx.save();ctx.transform(a.x-p.x,a.y-p.y,b.x-p.x,b.y-p.y,p.x,p.y);
     ctx.globalAlpha=Math.sin(Math.PI*fraction)**.4;
     ctx.drawImage(stamp(span.palette,fraction),-1,-1,2,2);ctx.restore();
     const pixelsPerMeter=512*Math.pow(2,zoom)/(40075016.686*Math.cos(coordinate[1]*Math.PI/180));
     const lift=sample.clearance*pixelsPerMeter*pitch/scale;
     const halfWidth=Math.max(2,sample.width/2);
     const left=toPixel(offset(coordinate,-dy*halfWidth,-dx*halfWidth));
     const right=toPixel(offset(coordinate,dy*halfWidth,dx*halfWidth));
     left.y-=lift;right.y-=lift;
     const point={p,left,right,lift,fraction};
     if(previous){
      // A faint, bounded wash connects the underside to its water reflection.
      const color=bridgeGlowColor(span.palette,(fraction+previous.fraction)/2).join(',');
      const top=Math.min(previous.p.y-previous.lift,p.y-lift),bottom=Math.max(previous.p.y,p.y);
      if(bottom>top+.1){
       const falloff=ctx.createLinearGradient(0,top,0,bottom);
       falloff.addColorStop(0,`rgba(${color},.18)`);falloff.addColorStop(1,`rgba(${color},0)`);
       ctx.fillStyle=falloff;ctx.globalAlpha=Math.sin(Math.PI*fraction)**.4;
       ctx.beginPath();ctx.moveTo(previous.p.x,previous.p.y-previous.lift);
       ctx.lineTo(p.x,p.y-lift);ctx.lineTo(p.x,p.y);ctx.lineTo(previous.p.x,previous.p.y);ctx.closePath();ctx.fill();
      }
      decks.push([previous.left,previous.right,right,left]);
     }
     previous=point;
    }
   }
   // The water overlay must not recolor the elevated roadway above it.
   ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.fillStyle='#000';
   for(const deck of decks){ctx.beginPath();deck.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}
   ctx.globalCompositeOperation='source-over';
  },
  dispose(){for(const canvas of stamps.values())canvas.width=canvas.height=1;stamps.clear();},
 };
}
