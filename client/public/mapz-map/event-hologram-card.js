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
// E3c: the beam lands on a round puck, not the card rectangle.
export function eventPuckPerimeter(card){
 const cx=card.x,cy=(card.top+card.bottom)/2,r=Math.min(card.right-card.left,card.bottom-card.top)*.42;
 return Array.from({length:28},(_,i)=>{const a=i/28*Math.PI*2;return {x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r};});
}
function ellipsePerimeter(cx,cy,rx,ry,count=28){
 return Array.from({length:count},(_,i)=>{const a=i/count*Math.PI*2;return {x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry};});
}
function rectPerimeter(left,top,right,bottom,count=24){
 const width=right-left,height=bottom-top,span=2*(width+height),points=[];
 for(let i=0;i<count;i++){
  let d=i/count*span;
  if(d<width)points.push({x:left+d,y:top});
  else if((d-=width)<height)points.push({x:right,y:top+d});
  else if((d-=height)<width)points.push({x:right-d,y:bottom});
  else points.push({x:left,y:bottom-(d-width)});
 }
 return points;
}
// The live beam stays. Only the landing outline changes with the design.
export function eventDesignPerimeter(card,layout='puck'){
 const left=card.left,right=card.right,top=card.top,bottom=card.bottom;
 const cx=card.x,cy=(top+bottom)/2,width=right-left,height=bottom-top;
 switch(layout){
  case 'tube':return ellipsePerimeter(cx,cy,width*.16,height*.46);
  case 'stack':return rectPerimeter(cx-width*.42,top,cx+width*.42,bottom);
  case 'totem':
  case 'brick':return rectPerimeter(cx-width*.22,top,cx+width*.22,bottom);
  case 'clasp':return rectPerimeter(left,cy-height*.2,right,cy+height*.2);
  case 'dna':return [...ellipsePerimeter(cx,top+height*.22,width*.18,height*.16,16),...ellipsePerimeter(cx,bottom-height*.22,width*.18,height*.16,16)];
  case 'halo':
  case 'ring':
  case 'saturn':return ellipsePerimeter(cx,cy,width*.48,height*.28);
  case 'vortex':return ellipsePerimeter(cx,cy,width*.3,height*.3,20);
  case 'gear':return ellipsePerimeter(cx,cy,width*.4,height*.4,12);
  default:return eventPuckPerimeter(card);
 }
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
 for(const y of [64]){
  const line=document.createElementNS(ns,'path');line.setAttribute('d',`M7 ${y}H105`);line.setAttribute('class','event-hologram-rule');svg.appendChild(line);
 }
 // Tiny opposite-color echoes sit beside the missing pixels, behind all type.
 const ink=item.style.getPropertyValue('--projection-color').trim();
 if(/^#[0-9a-f]{6}$/i.test(ink))item.style.setProperty('--glitch-accent',`#${(0xffffff^parseInt(ink.slice(1),16)).toString(16).padStart(6,'0')}`);
 const traces=['M1 27.2H19 M25 26.2H32 M83 75.8H110 M94 77H103 M28 92H33',
  'M43 13.2H62 M71 12.2H78 M1 62H23 M30 63H39 M95 84.2H110'];
 traces.forEach((d,index)=>{const trace=document.createElementNS(ns,'path');trace.setAttribute('d',d);trace.setAttribute('class',`event-hologram-glitch-trace event-hologram-glitch-trace--${index}`);svg.appendChild(trace);});
 const surface=document.createElement('span');surface.className='event-hologram-surface';surface.setAttribute('aria-hidden','true');surface.appendChild(svg);item.appendChild(surface);
}

// E3c distance states, from E3c-Compressed.dc.html (not a generic coin):
// close = the S2 shield with its glyph, yawing back and forth between -32 and +32
// degrees on a 7s ease (the board's .pspin lean). far = the C1 mini shield: three
// stacked outlines and a glyph dot, flat, no yaw.
const S2_PATH='M-18 -32H18L26 -24V8Q22 28 0 48Q-22 28 -26 8V-24Z';
const SKEW_Y=Math.tan(-1.5*Math.PI/180);
export const COIN_YAW_DEG=32, COIN_LEAN_SECONDS=7;
export function coinYaw(seconds,reduced){
 if(reduced)return -COIN_YAW_DEG/2;
 const p=((seconds/COIN_LEAN_SECONDS)%2+2)%2, tri=p<=1?p:2-p;
 return -COIN_YAW_DEG+2*COIN_YAW_DEG*(1-Math.cos(Math.PI*tri))/2;
}
export function eventCoinPuckRadius(card){
 return Math.min(card.right-card.left,card.bottom-card.top)*.42;
}
export function drawEventCoinPuck(ctx,cx,cy,r,color,logo,seconds,reduced,alpha=1,distance='close'){
 const shield=new Path2D(S2_PATH);
 const hasLogo=logo&&logo.complete&&logo.naturalWidth;
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(cx,cy);
 if(distance==='far'){
  const k=r*.0215;
  ctx.scale(k,k);ctx.transform(1,SKEW_Y,0,1,0,0);
  for(const [dx,op,w,glow] of [[1.6,.4,2.4,false],[.8,.6,2.4,false],[0,1,5,true]]){
   ctx.save();ctx.translate(dx,0);ctx.globalAlpha=alpha*op;
   ctx.fillStyle='#050506';ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineJoin='round';
   if(glow){ctx.shadowColor=color;ctx.shadowBlur=6;}
   ctx.fill(shield);ctx.stroke(shield);ctx.restore();
  }
  ctx.save();ctx.shadowColor=color;ctx.shadowBlur=6;ctx.fillStyle=color;
  ctx.beginPath();ctx.arc(0,-6,7,0,Math.PI*2);ctx.fill();ctx.restore();
 }else{
  const k=r*.0174,yaw=coinYaw(seconds,reduced),cosY=Math.cos(yaw*Math.PI/180),front=cosY>=0;
  ctx.scale(Math.max(.02,Math.abs(cosY))*k,k);
  ctx.fillStyle='#050506';ctx.strokeStyle=color;ctx.lineWidth=1.2/k;ctx.lineJoin='round';
  ctx.shadowColor=color;ctx.shadowBlur=r*.12;
  ctx.fill(shield);ctx.stroke(shield);
  ctx.shadowBlur=0;
  if(hasLogo){
   ctx.save();ctx.scale(front?1:-1,1);ctx.drawImage(logo,-14,-16,28,28);ctx.restore();
  }
 }
 ctx.restore();
}

// E3 vortex: tilted rings with text bands spinning around them. The stage tilts
// the flat rings by 16 degrees, so each ring is an ellipse with ry = r * sin(16deg).
// Not wired into the live beam yet; the hourglass waist and beam feed come later.
export const VORTEX_TILT=Math.sin(16*Math.PI/180);
export function drawEventVortex(ctx,cx,cy,tiers,color,seconds=0,reduced=false,alpha=1){
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
 for(const tier of tiers){
  const {r,y=0,text='',n=12,fs=14,speed=5,dir=1,ink='#ffffff'}=tier;
  const ry=r*VORTEX_TILT,ringCy=cy+y;
  ctx.globalAlpha=alpha*.75;ctx.strokeStyle=color;ctx.lineWidth=1.5;
  ctx.shadowColor=color;ctx.shadowBlur=10;
  ctx.beginPath();ctx.ellipse(cx,ringCy,r,ry,0,0,Math.PI*2);ctx.stroke();
  ctx.shadowBlur=0;
  const chars=[...(text||'')];
  if(!chars.length)continue;
  const turn=reduced?0:(seconds/speed)*Math.PI*2*dir;
  ctx.font=`900 ${fs}px 'Barlow Condensed', sans-serif`;
  ctx.fillStyle=ink;
  for(let i=0;i<n;i++){
   const a=i/n*Math.PI*2+turn,ch=chars[i%chars.length];
   const depth=(Math.sin(a)+1)/2;
   ctx.globalAlpha=alpha*(.25+.75*depth);
   ctx.save();ctx.translate(cx+Math.cos(a)*r,ringCy+Math.sin(a)*ry);
   ctx.fillText(ch,0,0);ctx.restore();
  }
 }
 ctx.restore();
}

// Level of detail. Far zoom is for map stability, not just looks: the far badge
// is one cached bitmap drawn with a single drawImage, with no beam, glow, or
// animation. Close zoom runs the full coin, beam, and animation.
// NOTE: farZoom and band are placeholders until Tucker sets the real threshold.
export function createEventLod({farZoom=13,band=.5,level='close'}={}){
 let state=level,changed=false;
 return {
  // Hysteresis: go far below farZoom - band/2, return close above farZoom + band/2.
  update(zoom){
   const previous=state;
   if(state==='close'&&zoom<farZoom-band/2)state='far';
   else if(state==='far'&&zoom>farZoom+band/2)state='close';
   changed=state!==previous;
   return state;
  },
  get level(){return state;},
  // True only on the frame the level flips, so callers redraw on change only.
  get changed(){return changed;},
 };
}
const farBadgeCache=new Map();
function farBadgeBitmap(color,r){
 if(typeof document==='undefined')return null;
 const key=`${color}|${Math.round(r*2)/2}`;
 if(farBadgeCache.has(key))return farBadgeCache.get(key);
 if(farBadgeCache.size>32)farBadgeCache.clear();
 const size=Math.ceil(r*2.6)+4,canvas=document.createElement('canvas');
 canvas.width=size;canvas.height=size;
 drawEventCoinPuck(canvas.getContext('2d'),size/2,size/2,r,color,null,0,true,1,'far');
 farBadgeCache.set(key,canvas);
 return canvas;
}
function drawFarBadge(ctx,card,color,alpha){
 const canvasWidth=ctx.canvas?.width??Infinity,canvasHeight=ctx.canvas?.height??Infinity;
 if(card.right<0||card.bottom<0||card.left>canvasWidth||card.top>canvasHeight)return; // off-screen: skip
 const r=eventCoinPuckRadius(card),bitmap=farBadgeBitmap(color,r);
 if(!bitmap)return;
 const cx=card.x,cy=(card.top+card.bottom)/2;
 ctx.save();ctx.globalAlpha=alpha;
 ctx.drawImage(bitmap,cx-bitmap.width/2,cy-bitmap.height/2);
 ctx.restore();
}

export function createAttachedEventBeam(options={}){
 const film=createLightFilm();let disposed=false;
 const logo=options.logo,distance=options.distance||'close';
 return {
  draw(ctx,card,anchor,seconds,phase,reduced,color,level='close'){
   if(disposed||ctx.globalAlpha<=.001)return;
   if(level==='far'){drawFarBadge(ctx,card,color,ctx.globalAlpha);return;}
   if(anchor.y-card.bottom<4)return;
   const perimeter=eventDesignPerimeter(card,card.hologramType||'puck'),alpha=ctx.globalAlpha;
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
   const coinR=eventCoinPuckRadius(card);
   drawEventCoinPuck(ctx,card.x,(card.top+card.bottom)/2,coinR,color,logo,clock,reduced,alpha,distance);
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
