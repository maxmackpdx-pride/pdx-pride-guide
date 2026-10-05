import {motionPreference} from './motion-preference.js';
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
 const groundGap=(18+10*picked)+8*zoomOut;
 const beamHeight=amount>0.18?Math.max(roofLift,groundGap):groundGap;
 return {x:origin.x,y:origin.y-beamHeight-size*TIP-size/2,size,bottom:origin.y-beamHeight,anchorY:origin.y};
}
/** Shell outlines, ported from client/src/lib/livingMapWaypoints.ts shellPath(). */
function shellPath(family,cx,cy,r){
 const x0=cx-r,x1=cx+r,y0=cy-r,y1=cy+r,q=r*.2;
 if(family==='house')return `M${x0+q},${cy-r*.15} ${cx},${y0} ${x1-q},${cy-r*.15}V${y1-q}L${cx},${y1+r*.68} ${x0+q},${y1-q}Z`;
 if(family==='speech')return `M${x0+q},${y0}H${x1-q}L${x1},${y0+q}V${y1-q}L${x1-q},${y1}H${cx+q},${cx},${y1+r*.68} ${cx-q},${y1}H${x0+q}L${x0},${y1-q}V${y0+q}Z`;
 // place and shield share the chamfered head with an integrated tip
 return `M${x0+q},${y0}H${x1-q}L${x1},${y0+q}V${y1-q}L${cx},${y1+r*.68} ${x0},${y1-q}V${y0+q}Z`;
}
/** Adult Placez use the same shell and logo/type glyphs as other Placez. Never restore an age-label marker. */
export function waypointFamilyShell(waypointFamily){
 if(waypointFamily==='houz')return 'house';
 if(waypointFamily==='mizzed')return 'speech';
 if(waypointFamily==='gigz'||waypointFamily==='giftz'||waypointFamily==='sellz')return 'shield';
 return 'place';
}
function spriteBox(size){const pad=Math.ceil(size*.3),dpr=2;return {pad,dpr,box:size+pad*2,tall:size*(1+TIP)+pad*2};}
function bodySprite(color,size,family){
 const key=color+'|'+size+'|'+family;if(bodies.has(key))return bodies.get(key);
 const {pad,dpr,box,tall}=spriteBox(size),sw=Math.max(1,size*.0425),r=size/2-sw/2,c=pad+size/2;
 const canvas=document.createElement('canvas');canvas.width=box*dpr;canvas.height=Math.ceil(tall*dpr);
 const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
 const path=new Path2D(shellPath(family,c,c,r));
 // OLED black body, neon ring, the platform's 8% bloom.
 ctx.shadowColor=color+'14';ctx.shadowBlur=18;
 ctx.fillStyle='#050506';ctx.fill(path);
 ctx.shadowBlur=0;ctx.strokeStyle=color;ctx.lineWidth=sw;ctx.lineJoin='round';ctx.stroke(path);
 const result={canvas,pad,box,tall};bodies.set(key,result);return result;
}
function ringSprite(color,size,family){
 const key=color+'|'+size+'|'+family;if(rings.has(key))return rings.get(key);
 const {pad,dpr,box,tall}=spriteBox(size),sw=Math.max(1,size*.0425),r=size/2-sw/2,c=pad+size/2;
 const canvas=document.createElement('canvas');canvas.width=box*dpr;canvas.height=Math.ceil(tall*dpr);
 const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
 ctx.strokeStyle=color;ctx.lineWidth=sw*1.6*2.2;ctx.lineJoin='round';ctx.filter='blur(2px)';ctx.stroke(new Path2D(shellPath(family,c,c,r)));
 const result={canvas,pad,box,tall};rings.set(key,result);return result;
}
function tintedIcon(image,color){
 let colors=ink.get(image);if(!colors){colors=new Map();ink.set(image,colors);}
 if(colors.has(color))return colors.get(color);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
 const ctx=canvas.getContext('2d'),fit=88/Math.max(image.width,image.height);
 ctx.drawImage(image,(96-image.width*fit)/2,(96-image.height*fit)/2,image.width*fit,image.height*fit);
 ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,96,96);
 colors.set(color,canvas);return canvas;
}
/** Glow ring: breathes .18 to .42 over 3.8s at rest; selected holds .45; calm and reduced motion hold .28. */
function ringAlpha(selected){
 if(selected)return .45;
 if(stillMotion())return .28;
 return .3+.12*Math.sin(performance.now()/1000*Math.PI*2/3.8);
}
function drawGlyph(ctx,image,x,y,size,glitch){
 const tinted=tintedIcon(image,'#FFFFFF'),left=x-size/2,top=y-size/2;
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
 // Two sprite sizes per color and shell (rest, selected), scaled at draw time,
 // so the cache stays as small as the old two-size orb set.
 const base=selected?57:42,k=size/base;
 const body=bodySprite(color,base,shell),ring=ringSprite(color,base,shell);
 const left=x-size/2-body.pad*k,top=y-size/2-body.pad*k;
 ctx.save();ctx.shadowBlur=0;
 ctx.globalAlpha=alpha*ringAlpha(selected);ctx.drawImage(ring.canvas,left,top,ring.box*k,ring.tall*k);
 ctx.globalAlpha=alpha;ctx.drawImage(body.canvas,left,top,body.box*k,body.tall*k);
 // White glyph at 58% of the head, as in the waypoint pack.
 const glyph=size*.58;
 if(logo)drawGlyph(ctx,logo,x,y,glyph,extra.glitch||0);
 else if(icon)drawGlyph(ctx,icon,x,y,glyph,extra.glitch||0);
 if(extra.scoop)drawScoop(ctx,x,y,size,color,extra.scoop);
 ctx.restore();
}
/** Placez shaft: much narrower than event hologram beams (~61px). Rises from roof or disk. */
export function drawWaypointFoot(ctx,geometry,color,materials,drawBeam,alpha=1,selected=false){
 const amount=cityAmount();
 const {x,bottom,anchorY}=geometry;
 // Place half-width before drawProjectionBeam: events stay wide; places stay a thin needle.
 const placeHalf=selected?3.2:1.8;
 ctx.save();
 if(amount>0.18){
  // Roof mode: thin shaft only — no ground disk/orb. Building color is the footprint.
  ctx.globalAlpha=alpha*(selected?.88:.52);
  drawBeam(ctx,materials.beams.get(color),{x,y:anchorY},x,bottom,placeHalf,1);
 }else{
  const disk=1-amount;
  ctx.globalAlpha=alpha*(selected?.9:.55)*disk;
  drawBeam(ctx,materials.beams.get(color),{x,y:anchorY},x,bottom,placeHalf,1);
  // 60% smaller than the 44/28 ground orbs. Heads and shafts stay put.
  const size=selected?18:11,orb=materials.orbs.get(color);
  if(orb){ctx.globalAlpha=alpha*(selected?1:.75)*disk;ctx.drawImage(orb,x-size/2,anchorY-size/2,size,size);}
 }
 ctx.restore();
}
/** Placez swap: logo for 7s, then the type glyph for 7s, offset per pin so they don't flip together. */
export const WAYPOINT_SWAP_SECONDS=7;
function swapClock(seconds,phase){const cycle=WAYPOINT_SWAP_SECONDS*2;return (((seconds+phase*1.7)%cycle)+cycle)%cycle;}
export function showWaypointLogo(seconds,phase,reducedMotion=false){
 if(reducedMotion)return true;
 return swapClock(seconds,phase)<WAYPOINT_SWAP_SECONDS;
}
/** 0..1 glitch for the first 120ms after each swap; 0 under calm and reduced motion. */
export function waypointSwapGlitch(seconds,phase,reducedMotion=false){
 if(reducedMotion)return 0;
 const since=swapClock(seconds,phase)%WAYPOINT_SWAP_SECONDS;
 return since<.12?1-since/.12:0;
}
