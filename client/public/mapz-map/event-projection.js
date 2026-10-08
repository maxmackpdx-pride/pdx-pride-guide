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

export function createEventProjection() {
  const textures=new Map();
  function material(color) {
    if(textures.has(color))return textures.get(color);
    const texture=document.createElement('canvas');texture.width=192;texture.height=768;
    const painter=texture.getContext('2d'),pixels=painter.createImageData(texture.width,texture.height);
    const rgb=[1,3,5].map(index=>parseInt(color.slice(index,index+2),16));
    // The body is a volume with an elliptical opening, not a flat triangular sheet.
    const cap=.04,streaks=new Float32Array(texture.width);
    let seed=7;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
    for(let n=0;n<70;n++){const centre=rand()*texture.width,width=.8+rand()*3.2,power=.25+rand()*.75;
     for(let x=Math.max(0,Math.floor(centre-width*3));x<Math.min(texture.width,centre+width*3);x++)streaks[x]=Math.min(1,streaks[x]+power*Math.exp(-(((x-centre)/width)**2)));}
    for(let y=0;y<texture.height;y++)for(let x=0;x<texture.width;x++){
      const v=y/(texture.height-1),u=x/(texture.width-1)*2-1;
      const t=Math.max(0,(v-cap)/(1-cap)),radius=Math.max(.002,1-t),across=Math.abs(u)/radius;
      const ellipse=u*u+((v-cap)/cap)**2;
      const inBody=v>=cap&&across<=1,inCap=ellipse<=1;
      if(!inBody&&!inCap)continue;
      const volume=inBody?Math.sqrt(Math.max(0,1-across*across)):0;
      const edge=inBody?Math.exp(-(((across-.97)/.045)**2)):0;
      const rim=inCap?Math.exp(-(((Math.sqrt(ellipse)-.97)/.04)**2)):0;
      // Soft light shafts: uneven filaments of varied width, brightest near the emitter, no grid.
      const streak=inBody?streaks[x]*(.35+.65*(1-t)**.6)*(.4+.6*volume):0;
      const alpha=.03+.12*volume+.1*edge+.1*rim+.3*t**10+.34*streak;
      const white=.12+.66*t**8,i=(y*texture.width+x)*4;
      for(let c=0;c<3;c++)pixels.data[i+c]=rgb[c]+(255-rgb[c])*white;
      pixels.data[i+3]=Math.round(255*alpha);
    }
    painter.putImageData(pixels,0,0);textures.set(color,texture);return texture;
  }
  return {
    draw(ctx, geometry, seconds, phase, reduced = false, color = DAYS.mon) {
      const {anchor,x,top,height,halfWidth,depth}=geometry;
      if(height<=1||halfWidth<=0)return;
      const texture=material(color),clock=reduced?0:seconds;
      ctx.save();ctx.globalCompositeOperation='screen';
      ctx.transform(1,0,(anchor.x-x)/height,1,x-halfWidth,top);
      ctx.drawImage(texture,0,0,halfWidth*2,height);
      // Screen-space scanlines retain their TV spacing at every zoom level.
      ctx.beginPath();ctx.moveTo(halfWidth,height);ctx.lineTo(0,depth);
      ctx.ellipse(halfWidth,depth,halfWidth,depth,0,Math.PI,Math.PI*2);
      ctx.closePath();ctx.clip();
      const baseAlpha=ctx.globalAlpha;
      ctx.globalCompositeOperation='screen';
      // Shimmer: the shafts slide sideways against themselves, like light through haze.
      if(!reduced){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=baseAlpha*.35;ctx.drawImage(texture,Math.sin(clock*.6+phase)*halfWidth*.05,0,halfWidth*2,height);}
      if(!reduced){
       // Cyberpunk RGB split: magenta and cyan ghosts straddle the beam.
       const split=halfWidth*(.035+.02*Math.sin(clock*1.7+phase));
       ctx.globalAlpha=baseAlpha*.16;
       ctx.drawImage(material('#ff2bd6'),-split,0,halfWidth*2,height);
       ctx.drawImage(material('#19e6ff'),split,0,halfWidth*2,height);
       // Brief data tear: a horizontal slice jumps sideways, then snaps back.
       const cycle=(clock*.23+phase*.41)%1;
       if(cycle<.035){
        const sliceY=height*((phase*3.7+Math.floor(clock*.23+phase*.41)*.37)%1),sliceH=Math.max(4,height*.05),jump=halfWidth*(cycle<.018?.28:-.2);
        ctx.globalAlpha=baseAlpha*.7;
        ctx.drawImage(texture,0,sliceY/height*texture.height,texture.width,sliceH/height*texture.height,jump,sliceY,halfWidth*2,sliceH);
       }
       // Neon flicker on the whole shaft.
       const flick=Math.sin(clock*31+phase*9)*Math.sin(clock*7.3+phase);
       if(flick>.93){ctx.globalAlpha=baseAlpha*.25;ctx.drawImage(texture,0,0,halfWidth*2,height);}
      }
      const scan=(clock*.075+phase*.17)%1,scanY=height*(1-scan);
      const band=ctx.createLinearGradient(0,scanY-7,0,scanY+7);
      band.addColorStop(0,color+'00');band.addColorStop(.5,color+'80');band.addColorStop(1,color+'00');
      ctx.globalAlpha=baseAlpha*.35;ctx.fillStyle=band;ctx.fillRect(0,scanY-7,halfWidth*2,14);
      // Cyber motion: data pulses climb the filaments and sparks drift upward, widening with the cone.
      if(!reduced){
       ctx.globalCompositeOperation='screen';ctx.fillStyle='#ffffff';
       for(let k=0;k<14;k++){
        const rise=(clock*(.05+.03*((k*7)%5)/5)+phase*.13+k*.173)%1,y=height*(1-rise);
        const spread=Math.max(.04,1-y/height)*.0+(y/height),lane=(((k*0.618)+phase*.37)%1)*2-1,across=halfWidth+lane*halfWidth*.9*Math.min(1,spread+.08)*.9;
        ctx.globalAlpha=baseAlpha*.7*Math.sin(Math.PI*rise);
        ctx.fillRect(across-.6,y,1.2,k%3?3:9);
       }
       const flicker=.5+.5*Math.sin(clock*9+phase*3);
       if(flicker>.93){ctx.globalAlpha=baseAlpha*.18;ctx.fillStyle=color;ctx.fillRect(0,height*((clock*.37+phase)%1),halfWidth*2,1.5);}
      }
      ctx.restore();
      ctx.save();ctx.globalCompositeOperation='screen';
      const radius=Math.max(3,Math.min(12,halfWidth*.2));
      const glow=ctx.createRadialGradient(anchor.x,anchor.y,0,anchor.x,anchor.y,radius);
      glow.addColorStop(0,'#ffffff');glow.addColorStop(.14,'#ffffffe0');
      glow.addColorStop(.38,color+'aa');glow.addColorStop(1,color+'00');
      ctx.globalAlpha*=reduced?1:.94+.06*Math.sin(clock*.7+phase);ctx.fillStyle=glow;
      ctx.fillRect(anchor.x-radius,anchor.y-radius,radius*2,radius*2);
      ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(anchor.x,anchor.y,Math.max(.8,radius*.11),0,Math.PI*2);ctx.fill();ctx.restore();
    },
    dispose(){for(const texture of textures.values())texture.width=texture.height=1;textures.clear();}
  };
}
