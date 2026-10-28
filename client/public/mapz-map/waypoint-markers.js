import {motionPreference} from '../map-foundation/motion.js';
const bodies=new Map(),rings=new Map(),ink=new WeakMap();
function cityAmount(){
 try{return window.__mapzMap?Math.max(0,Math.min(1,(window.__mapzMap.getZoom()-14.25)/1.1))*Math.max(0,Math.min(1,(window.__mapzMap.getPitch()-16)/18)):0;}catch{return 0;}
}
function mapZoom(){try{return window.__mapzMap?window.__mapzMap.getZoom():13;}catch{return 13;}}
function stillMotion(){return motionPreference.matches;}
/** Waypoint pack sizes: 31 at rest, growing to 42 at zoom 16+, 57 when selected. */
export function waypointHeadSize(selected=false,zoom=mapZoom()){
 if(selected)return 57;
 return Math.round(31+11*Math.max(0,Math.min(1,(zoom-12)/4)));
}
/** Shell tip hangs below the head box by this share of the size (livingMapWaypoints r*.68). */
const TIP=.34;
// Select motion (board 48): 42 to 57 with the lift, 180ms ease-out, both ways.
const SELECT_MS=180;let selection={key:null,prev:null,at:-1e9};
export function noteSelectedWaypoint(key,now=performance.now()){if(key!==selection.key)selection={key,prev:selection.key,at:now};}
function selectedAmount(selected,key){
 if(key==null||stillMotion()||(key!==selection.key&&key!==selection.prev))return selected?1:0;
 const t=Math.min(1,(performance.now()-selection.at)/SELECT_MS),eased=1-(1-t)**3;
 return selected?eased:1-eased;
}
export function waypointGeometry(origin,selected=false,roofLift=0,key=null){
 const amount=cityAmount(),picked=selectedAmount(selected,key);
 const rest=waypointHeadSize(false),size=rest+(waypointHeadSize(true)-rest)*picked;
 // No 3D buildings: a small ground gap, a little taller when zoomed out.
 // Buildings up: the shaft comes out of the roof, not a doubled screen floor.
 const zoom=mapZoom();
 const zoomOut=1-Math.max(0,Math.min(1,(zoom-11.5)/3));
 const groundGap=(10+6*picked)+4*zoomOut;
 const beamHeight=amount>0.18?Math.max(roofLift,groundGap):groundGap;
 return {x:origin.x,y:origin.y-beamHeight-size*TIP-size/2,size,bottom:origin.y-beamHeight,anchorY:origin.y};
}

// E3 artboard geometry (E3d-All-Waypoints). Shell art is drawn in artboard units:
// the Mapz shield is 52 units wide and its tip sits at y 48, so one unit is size/52 px.
const SHIELD_D='M-18 -32H18L26 -24V8Q22 28 0 48Q-22 28 -26 8V-24Z';
// Five ghost offsets behind the body: [x, y, scaleX, opacity], back layer first.
const GHOSTS=[[4,-.5,.94,.2],[3.2,-.4,.952,.34],[2.4,-.3,.964,.48],[1.6,-.2,.976,.62],[.8,-.1,.988,.76]];
// Scanlines every 4 units across the body, 1 unit thick, at 16% alpha.
const SCANS=[];for(let y=-26;y<=38;y+=4)SCANS.push(y);
// Artboard group tilt: skewY(-1.5) rotate(-1).
const TILT_SKEW=Math.tan(-1.5*Math.PI/180),TILT_ROT=-Math.PI/180;
function tilt(ctx){ctx.transform(1,TILT_SKEW,0,1,0,0);ctx.rotate(TILT_ROT);}
/** Shell outlines, ported from client/src/lib/livingMapWaypoints.ts shellPath(). Only house and speech still use the r-based path. */
function shellPath(family,cx,cy,r){
 const x0=cx-r,x1=cx+r,y0=cy-r,y1=cy+r,q=r*.2;
 if(family==='house')return `M${x0+q},${cy-r*.15} ${cx},${y0} ${x1-q},${cy-r*.15}V${y1-q}L${cx},${y1+r*.68} ${x0+q},${y1-q}Z`;
 return `M${x0+q},${y0}H${x1-q}L${x1},${y0+q}V${y1-q}L${x1-q},${y1}H${cx+q}L${cx},${y1+r*.68}L${cx-q},${y1}H${x0+q}L${x0},${y1-q}V${y0+q}Z`;
}
/** Adult Placez use the same shell and logo/type glyphs as other Placez. Never restore an age-label marker. */
export function waypointFamilyShell(waypointFamily){
 if(waypointFamily==='houz')return 'house';
 if(waypointFamily==='mizzed')return 'speech';
 if(waypointFamily==='gigz'||waypointFamily==='giftz'||waypointFamily==='sellz')return 'shield';
 return 'place';
}
function shellSpec(family){
 if(family==='house'||family==='speech')return {d:shellPath(family,0,0,26),squeeze:1};
 // Place and shield: the E3 S2 shield. The body is squeezed to 90% width inside its outline, as on the artboard.
 return {d:SHIELD_D,squeeze:.9};
}
// Sprite canvases hold the shell in units, origin at (30,36) units, so the same sprite can be drawn at any size.
const SPRITE={x0:-30,y0:-36,w:60,h:88,dpr:2};
function spriteCanvas(base,draw){
 const u=base/52,{dpr,w,h}=SPRITE;
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(w*u*dpr);canvas.height=Math.ceil(h*u*dpr);
 const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.translate(-SPRITE.x0*u,-SPRITE.y0*u);ctx.scale(u,u);tilt(ctx);
 draw(ctx,u*dpr);
 return canvas;
}
/** Where the shell's origin sits for a head. The shield tip lands on the geometry bottom (y + size*(TIP+.5)). */
function shellOrigin(family,x,y,size){
 if(family==='house'||family==='speech')return {ox:x,oy:y};
 return {ox:x,oy:y+size*(TIP+.5)-48*size/52};
}
function drawShellBody(ctx,color,family,dev){
 const shape=shellSpec(family),P=new Path2D(shape.d);
 // Ghost offsets: each layer is a dark body with a colored outline, stepping back behind the body.
 for(const [tx,ty,sx,op] of GHOSTS){
  ctx.save();ctx.globalAlpha=op;ctx.translate(tx,ty);ctx.scale(sx,1);
  ctx.fillStyle='#050506';ctx.fill(P);ctx.lineWidth=1.2;ctx.strokeStyle=color;ctx.stroke(P);
  ctx.restore();
 }
 // Body: OLED black fill, 2.4 unit neon outline, and the 4-unit glow of the artboard drop-shadow.
 ctx.save();ctx.shadowColor=color;ctx.shadowBlur=4*dev;ctx.scale(shape.squeeze,1);
 ctx.fillStyle='#050506';ctx.fill(P);ctx.lineWidth=2.4;ctx.strokeStyle=color;ctx.lineJoin='round';ctx.stroke(P);
 ctx.restore();
 // Scanline texture, clipped to the body.
 ctx.save();ctx.scale(shape.squeeze,1);ctx.clip(P);ctx.globalAlpha=.16;ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();
 for(const y of SCANS){ctx.moveTo(-40,y);ctx.lineTo(40,y);}
 ctx.stroke();ctx.restore();
}
function bodySprite(color,base,family){
 const key=color+'|'+base+'|'+family;if(bodies.has(key))return bodies.get(key);
 const canvas=spriteCanvas(base,(ctx,dev)=>drawShellBody(ctx,color,family,dev));
 const result={canvas};bodies.set(key,result);return result;
}
function ringSprite(color,base,family){
 const key=color+'|'+base+'|'+family;if(rings.has(key))return rings.get(key);
 const shape=shellSpec(family),P=new Path2D(shape.d);
 // Soft glow ring behind the body; the ring breathes via ringAlpha.
 const canvas=spriteCanvas(base,ctx=>{
  ctx.save();ctx.scale(shape.squeeze,1);ctx.strokeStyle=color;ctx.lineWidth=6;ctx.lineJoin='round';ctx.filter='blur(2px)';ctx.stroke(P);ctx.restore();
 });
 const result={canvas};rings.set(key,result);return result;
}
function tintedIcon(image,color){
 let colors=ink.get(image);if(!colors){colors=new Map();ink.set(image,colors);}
 if(colors.has(color))return colors.get(color);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
 const ctx=canvas.getContext('2d'),fit=88/Math.max(image.width,image.height);
 ctx.drawImage(image,(96-image.width*fit)/2,(96-image.height*fit)/2,image.width*fit,image.height*fit);
 if(color){ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,96,96);}
 colors.set(color,canvas);return canvas;
}
/** Glow ring: breathes .18 to .42 over 3.8s at rest; selected holds .45; calm and reduced motion hold .28. */
function ringAlpha(selected){
 if(selected)return .45;
 if(stillMotion())return .28;
 return .3+.12*Math.sin(performance.now()/1000*Math.PI*2/3.8);
}
function drawGlyph(ctx,image,x,y,size,glitch,preserveArtwork=false){
 const tinted=tintedIcon(image,preserveArtwork?null:'#FFFFFF'),left=x-size/2,top=y-size/2;
 if(!glitch){ctx.drawImage(tinted,left,top,size,size);return;}
 // Swap glitch: the glyph splits into two bands that slip sideways for a beat.
 const shift=Math.max(1,size*.08)*glitch,half=tinted.height/2;
 ctx.drawImage(tinted,0,0,tinted.width,half,left-shift,top,size,size/2);
 ctx.drawImage(tinted,0,half,tinted.width,half,left+shift,top+size/2,size,size/2);
}
function drawScoop(ctx,x,y,size,color,text){
 const r=size/2,scoopR=size*.3,cy=y+r+scoopR*.55;
 ctx.beginPath();ctx.arc(x,cy,scoopR,0,Math.PI*2);ctx.fillStyle='#050506';ctx.fill();
 ctx.lineWidth=Math.max(1,size*.0425*.85);ctx.strokeStyle=color;ctx.stroke();
 ctx.fillStyle='#FFFFFF';ctx.font=`800 ${Math.max(8,size*.26)}px "Barlow Condensed","Arial Narrow",sans-serif`;
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,cy+1);
}
/**
 * One waypoint head, always in its assigned category color. extra: {scoop} a time
 * disc label under the head, {glitch} 0..1 swap glitch.
 */
export function drawWaypointHead(ctx,geometry,color,icon,logo,selected,alpha=1,family='place',extra={}){
 const {x,y,size}=geometry,shell=family||'place';
 // Two sprite sizes per color and shell (rest, selected), scaled at draw time.
 const base=selected?57:42;
 const body=bodySprite(color,base,shell),ring=ringSprite(color,base,shell);
 const {ox,oy}=shellOrigin(shell,x,y,size),u=size/52;
 // The sprite origin sits at (30,36) units inside its canvas, so the origin lands on (ox,oy).
 const left=ox+SPRITE.x0*u,top=oy+SPRITE.y0*u,w=SPRITE.w*u,h=SPRITE.h*u;
 ctx.save();ctx.shadowBlur=0;
 ctx.globalAlpha=alpha*ringAlpha(selected);ctx.drawImage(ring.canvas,left,top,w,h);
 ctx.globalAlpha=alpha;ctx.drawImage(body.canvas,left,top,w,h);
 // E3 glyph: 32 units at the shield's glyph point, with a 30-unit ghost copy offset down-right at half opacity.
 const glyphImage=logo||icon,preserve=!!logo;
 if(glyphImage){
  const [gx,gy]=shell==='house'||shell==='speech'?[0,0]:[0,-1];
  ctx.save();ctx.translate(ox,oy);ctx.scale(u,u);tilt(ctx);
  ctx.globalAlpha=alpha*.5;drawGlyph(ctx,glyphImage,gx+3,gy+3,30,0,preserve);
  ctx.globalAlpha=alpha;ctx.shadowColor=color;ctx.shadowBlur=4;
  drawGlyph(ctx,glyphImage,gx,gy,32,extra.glitch||0,preserve);
  ctx.restore();
 }
 if(extra.scoop)drawScoop(ctx,x,y,size,color,extra.scoop);
 ctx.restore();
}
/** E3 cluster badge: the C1 mini shield with the count inside, drawn at the head's top-right corner. */
export function drawMiniShield(ctx,x,y,r,color,count){
 const u=r/26,P=new Path2D(SHIELD_D);
 ctx.save();ctx.translate(x,y);ctx.scale(u,u);tilt(ctx);ctx.lineJoin='round';
 // C1 badge: two ghost offsets, then the 5-unit outline with glow.
 for(const [tx,op] of [[1.6,.4],[.8,.6]]){
  ctx.save();ctx.globalAlpha=op;ctx.translate(tx,0);
  ctx.fillStyle='#050506';ctx.fill(P);ctx.lineWidth=2.4;ctx.strokeStyle=color;ctx.stroke(P);
  ctx.restore();
 }
 ctx.shadowColor=color;ctx.shadowBlur=3;ctx.fillStyle='#050506';ctx.fill(P);ctx.lineWidth=5;ctx.strokeStyle=color;ctx.stroke(P);
 ctx.restore();
 ctx.save();ctx.fillStyle='#FFFFFF';ctx.font=`800 ${Math.round(r*1.15)}px "Barlow Condensed","Arial Narrow",sans-serif`;
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(count),x,y+3*u);ctx.restore();
}
/** Stable artwork: compact symbols at overview; readable logos on approach/selection. */
export function waypointArtwork(logo,icon,selected=false,zoom=mapZoom()){
 if(!logo)return null;
 if(!icon||selected)return logo;
 const aspect=logo.width/Math.max(1,logo.height);
 return zoom>=15.5&&aspect<=2.4?logo:null;
}
