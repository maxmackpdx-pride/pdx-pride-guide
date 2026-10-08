import {DAYS,DAY_LIST} from './radix-map.js';

// Use the event's night token, never the venue/adult-category color over its day.
export function eventProjectionColor(row) {
  const token=value=>DAY_LIST.find(color=>color.toLowerCase()===String(value).toLowerCase());
  const explicit=token(row.dayColor);if(explicit)return explicit;
  const night=row.eventNight||row.eventDay;
  if(/^\d{4}-\d{2}-\d{2}$/.test(night||'')){
    const day=new Date(`${night}T12:00:00Z`).getUTCDay();
    if(Number.isFinite(day))return [DAYS.sun,DAYS.mon,DAYS.tue,DAYS.wed,DAYS.thu,DAYS.fri,DAYS.sat][day];
  }
  return token(row.color)||DAYS.mon;
}

export function eventProjectionSway(seconds, phase, scale = 1, reduced = false) {
  return reduced ? 0 : scale * (5 * Math.sin(seconds * .29 + phase) + 1.5 * Math.sin(seconds * .17 + phase * 1.7));
}

export function eventProjectionGeometry(anchor, center, scale = 1) {
  const top = center.y - 32 * scale;
  const height = anchor.y - top;
  const halfWidth = Math.max(0, Math.min(48 * scale, height / 5.6));
  // Elliptical mouth and round cross-sections give the narrow cone real depth.
  return {anchor, x: center.x, top, height, halfWidth, depth:halfWidth * .22};
}

// All artwork stays in the screen plane; the small shared roll/shear follows
// the projected beam axis without turning the logo away from the camera.
export function eventProjectionFacing({anchor,x,top,height}) {
  const lean=(x-anchor.x)/Math.max(1,height);
  return {roll:Math.max(-.065,Math.min(.065,Math.atan(lean)*.28)),
    shear:Math.max(-.075,Math.min(.075,-lean*.28))};
}

export const EVENT_LIGHT_FRAMES=84,EVENT_LIGHT_FPS=12;
export function eventLightFrame(seconds,variant=0,reduced=false) {
  const tick=reduced?0:Math.floor((seconds+variant*.67)*24)/2;
  const wrapped=((tick%EVENT_LIGHT_FRAMES)+EVENT_LIGHT_FRAMES)%EVENT_LIGHT_FRAMES;
  const frame=Math.floor(wrapped);
  return {frame,next:(frame+1)%EVENT_LIGHT_FRAMES,mix:wrapped-frame};
}
const WIDTH=64,HEIGHT=256,COLUMNS=8;
const fraction=value=>value-Math.floor(value);
const random=seed=>fraction(Math.sin(seed*127.1+311.7)*43758.5453);
const alpha=(color,value)=>color+Math.round(Math.max(0,Math.min(1,value))*255).toString(16).padStart(2,'0');
const highlight=(color,white)=>'#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*(1-white)+255*white).toString(16).padStart(2,'0')).join('');

export function createEventProjection(onReady=()=>{}) {
  const textures=new Map(),lights=new Map(),atlases=[];
  let disposed=false;
  // Three shared, pre-extracted light films. No video decoder, WebGL context,
  // per-frame pixel readback or independent animation timer on mobile.
  if(typeof Image!=='undefined')for(let i=0;i<3;i++){
    const image=new Image();image.decoding='async';
    image.onload=()=>{if(!disposed)onReady();};
    image.onerror=()=>{image.onload=null;image.onerror=null;};
    image.src=new URL(`./textures/event-light-${i}.webp`,import.meta.url).href;
    atlases.push(image);
  }
  function material(color) {
    if(textures.has(color))return textures.get(color);
    const texture=document.createElement('canvas');texture.width=192;texture.height=768;
    const painter=texture.getContext('2d'),pixels=painter.createImageData(texture.width,texture.height);
    const rgb=[1,3,5].map(index=>parseInt(color.slice(index,index+2),16));
    for(let y=0;y<texture.height;y++)for(let x=0;x<texture.width;x++){
      const v=y/(texture.height-1),u=x/(texture.width-1)*2-1;
      const radius=Math.max(.002,1-v),across=Math.abs(u)/radius;
      if(across>1||(v<.04&&u*u+((v-.04)/.04)**2>1))continue;
      // Transparent layered light, with an open mouth that disappears into air.
      const volume=Math.sqrt(Math.max(0,1-across*across));
      const topFade=Math.min(1,(v/.26)**.65);
      const a=(.014+.035*volume+.18*v**12)*topFade;
      const white=.04+.48*v**10,i=(y*texture.width+x)*4;
      for(let c=0;c<3;c++)pixels.data[i+c]=rgb[c]+(255-rgb[c])*white;
      pixels.data[i+3]=Math.round(255*a);
    }
    painter.putImageData(pixels,0,0);textures.set(color,texture);return texture;
  }
  function light(color,variant,seconds,reduced) {
    const atlas=atlases[variant];
    if(!atlas?.complete||!atlas.naturalWidth)return null;
    const sample=eventLightFrame(seconds,variant,reduced),key=color+variant;
    let entry=lights.get(key);
    if(!entry){const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;entry={canvas,stamp:''};lights.set(key,entry);}
    const stamp=`${sample.frame}:${sample.mix}`;
    if(entry.stamp===stamp)return entry.canvas;
    entry.stamp=stamp;
    const g=entry.canvas.getContext('2d');
    g.clearRect(0,0,WIDTH,HEIGHT);g.globalCompositeOperation='source-over';
    const frame=(f,opacity)=>{g.globalAlpha=opacity;g.drawImage(atlas,(f%COLUMNS)*WIDTH,Math.floor(f/COLUMNS)*HEIGHT,WIDTH,HEIGHT,0,0,WIDTH,HEIGHT);};
    frame(sample.frame,1-sample.mix);g.globalCompositeOperation='lighter';frame(sample.next,sample.mix);
    g.globalAlpha=1;g.globalCompositeOperation='source-in';
    // Tonal variation stays in the assigned primary day token. No rainbow bleed
    // from the supplied movie into a different event night's semantic color.
    const tint=g.createLinearGradient(0,0,WIDTH,HEIGHT*.2);
    tint.addColorStop(0,color);tint.addColorStop(.38,highlight(color,.14));
    tint.addColorStop(.7,color);tint.addColorStop(1,highlight(color,.06));
    g.fillStyle=tint;g.fillRect(0,0,WIDTH,HEIGHT);g.globalCompositeOperation='source-over';
    return entry.canvas;
  }
  return {
    draw(ctx, geometry, seconds, phase, reduced = false, color = DAYS.mon) {
      const {anchor,x,top,height,halfWidth}=geometry;
      if(disposed||height<=1||halfWidth<=0)return;
      const clock=reduced?0:seconds,variant=Math.floor(Math.abs(phase)*7)%3;
      const film=light(color,variant,clock,reduced);
      const point=(q,angle,layer=1)=>{
        const radius=(Math.min(1.5,halfWidth*.1)+(halfWidth-Math.min(1.5,halfWidth*.1))*q)*layer;
        return {x:anchor.x+(x-anchor.x)*q+Math.cos(angle)*radius,
          y:anchor.y-height*q+Math.sin(angle)*radius*.22};
      };
      ctx.save();ctx.globalCompositeOperation='screen';
      const baseAlpha=ctx.globalAlpha;
      ctx.save();ctx.transform(1,0,(anchor.x-x)/height,1,x-halfWidth,top);
      ctx.drawImage(material(color),0,0,halfWidth*2,height);ctx.restore();
      // Narrow luminous sides with a broad transparent skirt. Their upper 20%
      // carries the approved extra bloom, then fades completely above the label.
      const edge=ctx.createLinearGradient(anchor.x,anchor.y,x,top);
      for(const [q,a] of [[0,1],[.42,.85],[.65,.56],[.82,.16],[.94,.02],[1,0]])edge.addColorStop(q,alpha(color,a));
      ctx.strokeStyle=edge;
      for(const side of [0,Math.PI])for(const [width,a] of [[18,.012],[11,.024],[5,.04],[.8,.22]]){
        ctx.globalAlpha=baseAlpha*a*(reduced?.55:1);ctx.lineWidth=width;
        const start=point(0,side),end=point(1,side);
        ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();
      }
      // Broken filaments on nested elliptical depth planes, never full-height
      // rods or regularly spaced rings. Motion is upwards and fades per fragment.
      ctx.strokeStyle=color;ctx.lineWidth=.4;
      for(const [layer,opacity] of [[.51,.06],[.76,.10],[1,.16]]){
        ctx.globalAlpha=baseAlpha*opacity;ctx.beginPath();
        for(let strand=0;strand<18;strand++){
          const seed=strand+variant*83+layer*41;
          const q=.03+random(seed)*.88,length=.035+random(seed+11)*.14;
          const angle=random(seed+37)*Math.PI*2;
          const a=point(q,angle,layer),b=point(Math.min(.98,q+length),angle+.035,layer);
          ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        }
        ctx.stroke();
      }
      if(film){
        for(let band=0;band<32;band++){
          const q=band/32,q2=(band+1)/32,a=point(q,Math.PI),b=point(q,0),next=point(q2,Math.PI);
          const fade=q<.74?1:Math.max(0,(1-q)/.26)**.65;
          ctx.globalAlpha=baseAlpha*.85*fade;
          ctx.drawImage(film,0,(31-band)*8,WIDTH,8,Math.min(a.x,next.x),next.y,Math.max(1,b.x-a.x),Math.max(1,a.y-next.y));
        }
      }
      // Sparse tracers also serve as the lightweight loading/failure fallback.
      for(let i=0;i<7;i++){
        const seed=i+variant*37,travel=.15+random(seed+11)*.10,start=random(seed+53)*(1-travel);
        const progress=reduced?.5:fraction(random(seed+33)+clock*(.14+random(seed+7)*.22));
        const q=start+travel*progress,angle=random(seed)*Math.PI*2,layer=[1,.76,.51][i%3];
        const a=point(q,angle,layer),b=point(Math.max(start,q-.012),angle,layer);
        ctx.globalAlpha=baseAlpha*(film?.22:.48)*Math.sin(progress*Math.PI);ctx.lineWidth=.45;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      // Tight source light keeps the existing rooftop anchor; no physical ring.
      const radius=Math.max(3,Math.min(12,halfWidth*.2));
      const glow=ctx.createRadialGradient(anchor.x,anchor.y,0,anchor.x,anchor.y,radius);
      glow.addColorStop(0,highlight(color,.85));glow.addColorStop(.14,highlight(color,.55));
      glow.addColorStop(.38,color+'aa');glow.addColorStop(1,color+'00');
      ctx.globalAlpha=baseAlpha;ctx.fillStyle=glow;
      ctx.fillRect(anchor.x-radius,anchor.y-radius,radius*2,radius*2);ctx.restore();
    },
    dispose(){
      disposed=true;
      for(const image of atlases){image.onload=null;image.onerror=null;image.src='';}
      for(const texture of [...textures.values(),...[...lights.values()].map(item=>item.canvas)])texture.width=texture.height=1;
      textures.clear();lights.clear();atlases.length=0;
    }
  };
}
