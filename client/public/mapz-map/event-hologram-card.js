import {EVENT_FRAME,EVENT_CARD_WIDTH,EVENT_CARD_HEIGHT} from './event-hologram-model.js';
import {createLightFilm,LIGHT_WIDTH,LIGHT_HEIGHT} from './event-light-film.js';

export function eventCardGeometry(x,centerY,scale=1){
 const width=EVENT_CARD_WIDTH*scale,height=EVENT_CARD_HEIGHT*scale;
 return {x,y:centerY-height/2,width:EVENT_CARD_WIDTH,cardHeight:EVENT_CARD_HEIGHT,scale,
  left:x-width/2,right:x+width/2,top:centerY-height/2,bottom:centerY+height/2};
}
export function eventCardPerimeter(card){
 return EVENT_FRAME.map(([u,v])=>({x:card.left+u*(card.right-card.left),y:card.top+v*(card.bottom-card.top)}));
}
export function eventBeamPoint(anchor,end,t,phase=0,seconds=0,reduced=false){
 // Light follows a soft curve, but both endpoints stay pinned, even while panning.
 const wave=reduced?0:Math.sin(seconds*.55+phase+t*4)*Math.sin(Math.PI*t)*2;
 return {x:anchor.x+(end.x-anchor.x)*t**1.22+wave,y:anchor.y+(end.y-anchor.y)*t};
}
const ns='http://www.w3.org/2000/svg';
export function appendEventCardFrame(item){
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 112 112');svg.setAttribute('aria-hidden','true');svg.classList.add('event-hologram-frame');
 item.style.setProperty('--event-surface-clip',`polygon(${EVENT_FRAME.map(([u,v])=>`${u*100}% ${v*100}%`).join(',')})`);
 const outline=EVENT_FRAME.map(([u,v])=>`${u*112},${v*112}`).join(' ');
 for(const name of ['event-hologram-frame__rear','event-hologram-frame__inset']){
  const edge=document.createElementNS(ns,'polygon');edge.setAttribute('points',outline);edge.setAttribute('class',name);svg.appendChild(edge);
 }
 for(const y of [24,78]){
  const line=document.createElementNS(ns,'path');line.setAttribute('d',`M7 ${y}H105`);line.setAttribute('class','event-hologram-rule');svg.appendChild(line);
 }
 const surface=document.createElement('span');surface.className='event-hologram-surface';surface.setAttribute('aria-hidden','true');surface.appendChild(svg);item.appendChild(surface);
}

export function createAttachedEventBeam(){
 const film=createLightFilm();let disposed=false;
 return {
  draw(ctx,card,anchor,seconds,phase,reduced,color){
   if(disposed||ctx.globalAlpha<=.001||anchor.y-card.bottom<4)return;
   const perimeter=eventCardPerimeter(card),alpha=ctx.globalAlpha;
   const clock=reduced?0:seconds,variant=Math.floor(Math.abs(phase)*7)%3;
   ctx.save();ctx.globalCompositeOperation='screen';
   // Broad translucent light volume: never an opaque cone or a wire cage.
   const glow=ctx.createLinearGradient(anchor.x,anchor.y,card.x,card.top);
   glow.addColorStop(0,color+'b0');glow.addColorStop(.12,color+'32');glow.addColorStop(.7,color+'12');glow.addColorStop(1,color+'08');
   ctx.fillStyle=glow;ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);ctx.lineTo(card.left,card.bottom);ctx.lineTo(card.left,card.top);ctx.lineTo(card.right,card.top);ctx.lineTo(card.right,card.bottom);ctx.closePath();ctx.fill();
   // The existing cached flowing light film provides the body, below the card.
   const light=film.get(color,variant,clock,reduced),height=anchor.y-card.bottom;
   for(let band=0;band<24;band++){
    const t=(band+1)/24,prev=band/24,y=anchor.y-height*t;
    const half=(card.right-card.left)*.5*t**1.22,cx=anchor.x+(card.x-anchor.x)*t**1.22;
    ctx.globalAlpha=alpha*.7;
    ctx.drawImage(light,0,(23-band)*LIGHT_HEIGHT/24,LIGHT_WIDTH,LIGHT_HEIGHT/24,cx-half,y,Math.max(1,half*2),height*(t-prev)+1);
   }
   // Broken, moving light strands end at the exported rear perimeter. Opaque
   // card backing hides their upper portion, leaving the information untouched.
   for(let i=0;i<perimeter.length;i++){
    const end=perimeter[i],next=perimeter[(i+1)%perimeter.length];
    for(let strand=0;strand<2;strand++){
     const edge={x:end.x+(next.x-end.x)*strand/2,y:end.y+(next.y-end.y)*strand/2};
     const progress=reduced?.52:(clock*.13+i*.117+strand*.31)%1;
     ctx.strokeStyle=color;ctx.lineWidth=Math.max(.45,.7*card.scale);ctx.globalAlpha=alpha*.15;
     ctx.beginPath();for(let k=0;k<=16;k++){const p=eventBeamPoint(anchor,edge,k/16,phase+i,clock,reduced);k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.stroke();
     ctx.globalAlpha=alpha*.48*Math.sin(progress*Math.PI);ctx.lineWidth=Math.max(.7,card.scale);
     ctx.beginPath();for(let k=0;k<=5;k++){const t=Math.min(1,progress+k*.012),p=eventBeamPoint(anchor,edge,t,phase+i,clock,reduced);k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.stroke();
    }
   }
   const radius=Math.max(5,9*card.scale),source=ctx.createRadialGradient(anchor.x,anchor.y,0,anchor.x,anchor.y,radius);
   source.addColorStop(0,'#ffffff');source.addColorStop(.15,color+'dd');source.addColorStop(1,color+'00');
   ctx.globalAlpha=alpha;ctx.fillStyle=source;ctx.fillRect(anchor.x-radius,anchor.y-radius,radius*2,radius*2);ctx.restore();
  },dispose(){disposed=true;film.dispose();}
 };
}

// Alpha holes remove the entire rear surface, including rails and scanlines.
const glitchMasks=[[[0,28,34,10],[69,61,43,14],[27,93,24,6]],[[42,14,38,7],[0,48,49,13],[84,85,28,11]]].map(chunks=>{
 const holes=chunks.map(([x,y,width,height])=>`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="black"/>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112"><defs><mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="112" height="112"><rect width="112" height="112" fill="white"/>${holes}</mask></defs><rect width="112" height="112" fill="white" mask="url(#cut)"/></svg>`;
 return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
});
export function eventGlitchStage(seconds,phase=0,calm=false){
 if(calm)return -1;
 const t=((seconds+phase)%7+7)%7;
 return t>=5.7&&t<5.94?0:t>=6.08&&t<6.34?1:-1;
}
export function updateEventCardGlitch(item,seconds,calm){
 const surface=item.querySelector('.event-hologram-surface');if(!surface)return;
 if(!item.dataset.glitchPhase){let hash=0;for(const c of item.dataset.labelKey||'')hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;hash=Math.imul(hash^(hash>>>16),2654435761)>>>0;item.dataset.glitchPhase=String((hash%7000)/1000);}
 const stage=eventGlitchStage(seconds,Number(item.dataset.glitchPhase),calm);
 if(surface.dataset.glitchStage===String(stage))return;
 surface.dataset.glitchStage=String(stage);surface.style.maskImage=stage<0?'none':glitchMasks[stage];
}
