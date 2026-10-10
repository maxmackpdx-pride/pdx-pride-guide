import {DAYS,DAY_LIST} from './radix-map.js';
import {createLightFilm,lightPalette,LIGHT_WIDTH as WIDTH} from './event-light-film.js';

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

export function eventProjectionHeightLimit(zoom, pitch) {
  // Big Pink's GLB is 163.38m tall; allow one third more vertical rise.
  const metersPerPixel=40075016.686*Math.cos(45.52280*Math.PI/180)/(512*Math.pow(2,zoom));
  return Math.max(10,163.38*(4/3)/metersPerPixel*Math.sin(pitch*Math.PI/180));
}

export function eventProjectionGeometry(anchor, center, scale = 1, maxHeight = Infinity) {
  const height = Math.max(10,Math.min(Math.max(10,maxHeight),anchor.y-(center.y-32*scale)));
  const top = anchor.y-height;
  const halfWidth = Math.max(0, Math.min(48 * scale, height / 5.6));
  // Elliptical mouth and round cross-sections give the narrow cone real depth.
  return {anchor, x: center.x, top, height, halfWidth, depth:halfWidth * .22};
}

const fraction=value=>value-Math.floor(value);
const random=seed=>fraction(Math.sin(seed*127.1+311.7)*43758.5453);
const alpha=(color,value)=>color+Math.round(Math.max(0,Math.min(1,value))*255).toString(16).padStart(2,'0');
const highlight=(color,white)=>'#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*(1-white)+255*white).toString(16).padStart(2,'0')).join('');

export function createEventProjection() {
  const textures=new Map(),structures=new Map(),palettes=new Map(),film=createLightFilm();
  let disposed=false,coverage=null,whites=null;
  // Compute the volume's alpha once, not 147,456 square roots/powers per color.
  function shape(){
    if(coverage)return;
    coverage=new Uint8ClampedArray(192*768);whites=new Float64Array(768);
    for(let y=0;y<768;y++){
      const v=y/767,radius=Math.max(.002,1-v),topFade=Math.min(1,(v/.26)**.65);
      whites[y]=.04+.48*v**10;
      for(let x=0;x<192;x++){
        const u=x/191*2-1,across=Math.abs(u)/radius;
        if(across>1||(v<.04&&u*u+((v-.04)/.04)**2>1))continue;
        coverage[y*192+x]=Math.round(255*(.25*Math.sqrt(Math.max(0,1-across*across)))*topFade);
      }
    }
  }
  // Random seeds and trigonometry are immutable; reuse across colors/frames.
  function structure(variant){
    if(structures.has(variant))return structures.get(variant);
    const layers=[[.51,.06],[.76,.10],[1,.16]].map(([layer,opacity])=>({layer,opacity,strands:Array.from({length:18},(_,i)=>{
      const seed=i+variant*83+layer*41,q=.03+random(seed)*.88,length=.035+random(seed+11)*.14,angle=random(seed+37)*Math.PI*2;
      return {q,end:Math.min(.98,q+length),cos:Math.cos(angle),sin:Math.sin(angle),endCos:Math.cos(angle+.035),endSin:Math.sin(angle+.035)};
    })}));
    const tracers=Array.from({length:7},(_,i)=>{
      const seed=i+variant*37,travel=.15+random(seed+11)*.10,angle=random(seed)*Math.PI*2;
      return {travel,start:random(seed+53)*(1-travel),offset:random(seed+33),speed:.14+random(seed+7)*.22,cos:Math.cos(angle),sin:Math.sin(angle),layer:[1,.76,.51][i%3]};
    });
    const result={layers,tracers};structures.set(variant,result);return result;
  }
  function material(color) {
    if(textures.has(color))return textures.get(color);
    const texture=document.createElement('canvas');texture.width=192;texture.height=768;
    const painter=texture.getContext('2d'),pixels=painter.createImageData(texture.width,texture.height);
    const rgb=[1,3,5].map(index=>parseInt(color.slice(index,index+2),16));
    shape();
    for(let y=0;y<texture.height;y++)for(let x=0;x<texture.width;x++){
      const pixel=y*texture.width+x,i=pixel*4,a=coverage[pixel];
      if(!a)continue;
      for(let c=0;c<3;c++)pixels.data[i+c]=rgb[c]+(255-rgb[c])*whites[y];
      pixels.data[i+3]=a;
    }
    painter.putImageData(pixels,0,0);textures.set(color,texture);return texture;
  }
  return {
    draw(ctx, geometry, seconds, phase, reduced = false, color = DAYS.mon) {
      const {anchor,x,top,height,halfWidth}=geometry;
      if(disposed||height<=1||halfWidth<=0||ctx.globalAlpha<=.001)return;
      const clock=reduced?0:seconds,variant=Math.floor(Math.abs(phase)*7)%3;
      const light=film.get(color,variant,clock,reduced),details=structure(variant);
      if(!palettes.has(color))palettes.set(color,lightPalette(color));
      const palette=palettes.get(color);
      const baseRadius=Math.min(1.5,halfWidth*.1);
      const point=(q,cos,sin=0,layer=1)=>{
        const radius=(baseRadius+(halfWidth-baseRadius)*q)*layer;
        return {x:anchor.x+(x-anchor.x)*q+cos*radius,
          y:anchor.y-height*q+sin*radius*.22};
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
      for(const side of [1,-1])for(const [width,a] of [[18,.012],[11,.024],[5,.04],[.8,.22]]){
        ctx.globalAlpha=baseAlpha*a*(reduced?.55:1);ctx.lineWidth=width;
        const start=point(0,side),end=point(1,side);
        ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();
      }
      // Broken filaments on nested elliptical depth planes, never full-height
      // rods or regularly spaced rings. Motion is upwards and fades per fragment.
      ctx.strokeStyle=color;ctx.lineWidth=.4;
      for(const [index,{layer,opacity,strands}] of details.layers.entries()){
        ctx.strokeStyle=palette[index];
        ctx.globalAlpha=baseAlpha*opacity;ctx.beginPath();
        for(const strand of strands){
          const a=point(strand.q,strand.cos,strand.sin,layer),b=point(strand.end,strand.endCos,strand.endSin,layer);
          ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        }
        ctx.stroke();
      }
      for(let band=0;band<32;band++){
        const q=band/32,q2=(band+1)/32,a=point(q,-1),b=point(q,1),next=point(q2,-1);
        const fade=q<.74?1:Math.max(0,(1-q)/.26)**.65;
        // Moving interference only changes brightness, not the beam geometry.
        const wave=.94+.06*Math.sin(q*73-clock*Math.PI*2/7+variant);
        ctx.globalAlpha=baseAlpha*.85*fade*wave;
        ctx.drawImage(light,0,(31-band)*8,WIDTH,8,Math.min(a.x,next.x),next.y,Math.max(1,b.x-a.x),Math.max(1,a.y-next.y));
      }
      ctx.strokeStyle=color;
      for(const tracer of details.tracers){
        const progress=reduced?.5:fraction(tracer.offset+clock*tracer.speed);
        const q=tracer.start+tracer.travel*progress;
        const a=point(q,tracer.cos,tracer.sin,tracer.layer),b=point(Math.max(tracer.start,q-.012),tracer.cos,tracer.sin,tracer.layer);
        ctx.globalAlpha=baseAlpha*.22*Math.sin(progress*Math.PI);ctx.lineWidth=.45;
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
      film.dispose();for(const texture of textures.values())texture.width=texture.height=1;
      textures.clear();structures.clear();palettes.clear();coverage=null;whites=null;
    }
  };
}
