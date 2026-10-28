import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {e3SlideState,e3SpinUp,e3OrbDrop,e3RingSpinRate,e3RingTiltRate,e3BeamPulseLook,E3_RING_TILT_RADIANS} from './e3-lod.js?v=20261027-e3-v3';

// This is the exported Blender mesh, not a video/sprite reconstruction. The
// caller owns venue grouping, same-day eligibility, LOD thresholds and layout.
export const E3_BLENDER_URL=new URL('./models/holograms/e3-blender-morph.glb',import.meta.url).href;
export const E3_BLENDER_STAGES=['mini','waypoint','compressed','coin','vortex','stack'];
export const E3_BLENDER_MORPHS=['Full waypoint','Compressed','Logo coin','Single vortex','Double stack'];
// Double stack spacing (model units). The Blender double stack has its two stacks nearly tip to tip; the vertex
// shader below pulls them apart after the morph: everything above the lower screen frame rises by STACK_LIFT
// (so the pin no longer covers the lower screen), the lower rings rise STACK_RISE more (so the ring text does not
// run over the lower screen), and everything above the ring gap rises by STACK_GAP more (room for the orb). Weighted by the double stack morph, so the single vortex is unchanged.
export const STACK_LIFT=.8,STACK_RISE=.45,STACK_GAP=.5,STACK_SHIFT=STACK_LIFT+STACK_RISE+STACK_GAP;
const HEIGHT=[0,0,4.02,4.3,4.6,5.05+STACK_SHIFT],RADIUS=[0,0,.48,.60,.75,.90];
const HOVER={
 'Upper poster independent hover':[.043,0],
 'Lower poster independent hover':[.039,2.3],
 'Upper poster hover attachment':[.043,0],
 'Ring 1 independent hover':[.055,1.1],
 'Ring 2 independent hover':[.047,3.5],
 'Ring 3 independent hover':[.052,4.3],
 'Ring 4 independent hover':[.061,5.2],
};
const clamp=value=>Math.max(0,Math.min(5,value));
export function blenderStageWeights(stage){
 const value=clamp(stage),lower=Math.floor(value),fraction=value-lower;
 return E3_BLENDER_MORPHS.map((_,i)=>i+1===lower?1-fraction:i+1===lower+1?fraction:0);
}
function interpolate(values,stage){const n=clamp(stage),i=Math.floor(n);return values[i]+((values[Math.min(5,i+1)]??values[i])-values[i])*(n-i);}
// Venue logo faces. Measured from the Blender shapes (glTF Y-up, front is +Z), per stage 0..5:
// center height, the box the logo must fit inside, and how visible it is. The coin and the compressed puck
// replace the generic Z mark; the vortex and the double stack carry it on their screens.
// Stage 1 (waypoint pin) keeps the venue-type icon. The second plane is the lower screen of the double stack.
const LOGO_FACE_Z=.095;
const LOGO_MAIN={y:[3.77,3.79,4.25,4.30,3.98,4.78+STACK_SHIFT],w:[0,0,.34,.78,.98,.98],h:[0,0,.34,.78,.7,.7],a:[0,0,1,1,1,1]};
// The vortex screens use the art slides instead (see ART_MAIN); the coin logo hands over while the screen unfolds.
const LOGO_LOWER={y:[3.03,3.03,3.03,3.03,3.03,1.29+STACK_LIFT],w:[0,0,0,0,0,.98],h:[0,0,0,0,0,.7],a:[0,0,0,0,0,1]};
export function blenderLogoFace(table,stage,aspect=1){
 const y=interpolate(table.y,stage),boxW=interpolate(table.w,stage),boxH=interpolate(table.h,stage),opacity=interpolate(table.a,stage);
 const width=Math.min(boxW,boxH*Math.max(.05,aspect)),height=width/Math.max(.05,aspect);
 return {y,width,height,opacity};
}
// ---------------------------------------------------------------------------
// Vortex v2 dressing, measured on the Blender shapes (glTF Y-up), per stage 0..5.
// ---------------------------------------------------------------------------
// Screen art box (logo, poster or host logo, with glitch swaps) and the info band under it (start time biggest,
// event name above it). The screen is 1.34 x 1.0 and its centre sits at 3.98 (vortex) or 4.78 and 1.29 (stack).
const ART_MAIN={y:[3.98,3.98,3.98,3.98,4.23,4.78+STACK_SHIFT+.25],w:[0,0,0,0,1.2,1.2],h:[0,0,0,0,.42,.42],a:[0,0,0,0,1,1]};
const ART_LOWER={y:[1.54,1.54,1.54,1.54,1.54,1.29+STACK_LIFT+.25],w:[0,0,0,0,0,1.2],h:[0,0,0,0,0,.42],a:[0,0,0,0,0,1]};
const INFO_MAIN={y:[3.74,3.74,3.74,3.74,3.74,4.78+STACK_SHIFT-.24],w:[1.3,1.3,1.3,1.3,1.3,1.3],h:[.52,.52,.52,.52,.52,.52],a:[0,0,0,0,1,1]};
const INFO_LOWER={y:[1.05,1.05,1.05,1.05,1.05,1.29+STACK_LIFT-.24],w:[1.3,1.3,1.3,1.3,1.3,1.3],h:[.52,.52,.52,.52,.52,.52],a:[0,0,0,0,0,1]};
// Text rings. line 0 is the event name on the wide ring, line 1 the DJs (or host) on the narrow ring. The upper
// stack (screen 0) and the lower stack (screen 1) each carry their own event.
const RING_BANDS=[
 {id:'a1',screen:0,line:0,y:[2.9,2.9,2.9,2.9,2.88,3.72+STACK_SHIFT],r:[.6,.6,.6,.6,1.1,1.1],h:[.4,.4,.4,.4,.8,.8],a:[0,0,0,0,1,1],width:2048,height:236,font:176},
 {id:'a2',screen:0,line:1,y:[2.4,2.4,2.4,2.4,2.36,3.38+STACK_SHIFT],r:[.6,.6,.6,.6,.76,.8],h:[.3,.3,.3,.3,.5,.5],a:[0,0,0,0,1,1],width:1536,height:154,font:118},
 {id:'b2',screen:1,line:1,y:[2.68,2.68,2.68,2.68,2.68,2.68+STACK_LIFT+STACK_RISE],r:[.8,.8,.8,.8,.8,.8],h:[.5,.5,.5,.5,.5,.5],a:[0,0,0,0,0,1],width:1536,height:154,font:118},
 {id:'b1',screen:1,line:0,y:[2.28,2.28,2.28,2.28,2.28,2.28+STACK_LIFT+STACK_RISE],r:[1.1,1.1,1.1,1.1,1.1,1.1],h:[.8,.8,.8,.8,.8,.8],a:[0,0,0,0,0,1],width:2048,height:236,font:176},
];
// Countdown plate and face stack sit above the top screen (screen centre + .86 and + 1.28).
const COUNTDOWN_PLATE={y:[4.84,4.84,4.84,4.84,4.84,5.64+STACK_SHIFT],w:[1.5,1.5,1.5,1.5,1.5,1.5],h:[.44,.44,.44,.44,.44,.44],a:[0,0,0,0,1,1]};
const FACE_STACK={y:[5.26,5.26,5.26,5.26,5.26,6.06+STACK_SHIFT],w:[1.3,1.3,1.3,1.3,1.3,1.3],h:[.34,.34,.34,.34,.34,.34],a:[0,0,0,0,1,1]};
// The orb floats below the rings of a single vortex and between the two stacks of a double stack.
// Height the beam light pulses climb to (the lowest ring band), per stage.
const PULSE_TOP=[2.5,2.5,2.5,2.5,2.4,3.2+STACK_LIFT+STACK_RISE];
const ORB={y:[1.95,1.95,1.95,1.95,1.95,3.0+STACK_LIFT+STACK_RISE+STACK_GAP/2],a:[0,0,0,0,1,1],radius:.07};
// The model's own three small circles above the screen (part of the outline): cut out where the face stack goes,
// local y range and half width per stage. Off below the vortex.
const DOTS_HOLE={min:[4.5,4.5,4.5,4.5,4.5,5.29+STACK_SHIFT],max:[4.9,4.9,4.9,4.9,4.9,5.7+STACK_SHIFT],half:.42,lowerMin:.5+STACK_LIFT,lowerMax:.76+STACK_LIFT};
// Beam base disc and venue label (model units, ground level). The disc and the label ease in with the vortex
// (stage 3.2 to 4) and stay for the double stack.
const BASE_DISC={y:.04,radius:.8,on:3.2,full:4};
const BASE_LABEL={y:.17,z:.86,width:1.9,height:.3};
export function blenderBaseFace(stage){const t=Math.max(0,Math.min(1,(stage-BASE_DISC.on)/(BASE_DISC.full-BASE_DISC.on)));return {opacity:t*t*(3-2*t),radius:BASE_DISC.radius};}
const FONT_FAMILY="'Barlow Condensed','Arial Narrow',sans-serif";
export function blenderBandFace(table,stage){
 return {y:interpolate(table.y,stage),radius:interpolate(table.r,stage),height:interpolate(table.h,stage),opacity:interpolate(table.a,stage)};
}
export function blenderPlateFace(stage,table=COUNTDOWN_PLATE){
 return {y:interpolate(table.y,stage),width:interpolate(table.w,stage),height:interpolate(table.h,stage),opacity:interpolate(table.a,stage)};
}
export function blenderArtFace(table,stage){
 return {y:interpolate(table.y,stage),width:interpolate(table.w,stage),height:interpolate(table.h,stage),opacity:interpolate(table.a,stage)};
}
export function blenderOrbFace(stage){return {y:interpolate(ORB.y,stage),opacity:interpolate(ORB.a,stage)};}
// How far the double stack spacing has opened (0 at the single vortex, 1 at the full double stack).
export const blenderStackOpen=stage=>Math.max(0,Math.min(1,stage-4));
export function blenderDotsHole(stage){const open=blenderStackOpen(stage);return {min:interpolate(DOTS_HOLE.min,stage),max:interpolate(DOTS_HOLE.max,stage),half:DOTS_HOLE.half,on:stage>=3.3,lowerMin:DOTS_HOLE.lowerMin-STACK_LIFT*(1-open),lowerMax:DOTS_HOLE.lowerMax-STACK_LIFT*(1-open),lowerOn:stage>=4.3};}
export const BLENDER_TABLES={BASE_DISC,BASE_LABEL,ART_MAIN,ART_LOWER,INFO_MAIN,INFO_LOWER,RING_BANDS,COUNTDOWN_PLATE,FACE_STACK,ORB};
const fontsReady=()=>{try{return Boolean(document.fonts?.check("900 20px 'Barlow Condensed'"));}catch{return false;}};
// Wide, letterspaced white letters with a small accent shadow, repeated whole times around the band. Big glyphs:
// the letters fill most of the band height, the spacing opens up to .46 em when the line is short, and closes
// to .2 em before a long line shrinks.
function drawRingTextCanvas(canvas,text,font,accent,tintColor){
 const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
 ctx.clearRect(0,0,width,height);
 ctx.textBaseline='middle';ctx.textAlign='left';
 const separator='\u00b7';
 const measure=(px,spaceEm)=>{ctx.font=`900 ${px}px ${FONT_FAMILY}`;const space=px*spaceEm;let total=0;for(const ch of text)total+=ctx.measureText(ch).width+space;return {space,total:total+px*1.6};};
 let px=font,spaceEm=.46,m=measure(px,spaceEm);
 for(const tight of [.38,.3,.22]){if(m.total<=width)break;spaceEm=tight;m=measure(px,spaceEm);}
 if(m.total>width){px=Math.max(18,Math.floor(px*width/m.total));m=measure(px,spaceEm);}
 const copies=Math.max(1,Math.round(width/m.total)),stretch=width/(m.total*copies);
 ctx.font=`900 ${px}px ${FONT_FAMILY}`;
 ctx.save();ctx.scale(stretch,1);
 for(let c=0;c<copies;c++){
  let x=c*m.total;
  ctx.shadowColor=accent;ctx.shadowBlur=px*.1;ctx.shadowOffsetX=px*.05;ctx.shadowOffsetY=px*.05;ctx.fillStyle='#ffffff';
  ctx.lineWidth=px*.035;ctx.lineJoin='round';ctx.strokeStyle='#ffffff';
  for(const ch of text){ctx.strokeText(ch,x,height*.54);ctx.fillText(ch,x,height*.54);x+=ctx.measureText(ch).width+m.space;}
  ctx.shadowColor='transparent';ctx.fillStyle=accent;ctx.fillText(separator,x+px*.1,height*.54);
 }
 ctx.restore();
}
function fitText(ctx,text,maxWidth,px,minPx){
 let size=px;ctx.font=`900 ${size}px ${FONT_FAMILY}`;
 while(ctx.measureText(text).width>maxWidth&&size>minPx){size-=2;ctx.font=`900 ${size}px ${FONT_FAMILY}`;}
 return size;
}
// Info band under the artwork: the event name in bold caps (small, up to two lines) and the start time, by far the
// biggest, in the accent. The time takes the lower 62% of the band, like the concept's big "9PM".
function drawInfoCanvas(canvas,name,time,accent){
 const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
 ctx.clearRect(0,0,width,height);
 ctx.textAlign='center';ctx.textBaseline='middle';
 const label=String(name||''),words=label.split(' ');
 let lines=[label];
 const k=width/640;
 const nameHeight=height*.38;
 let size=fitText(ctx,label,width-30*k,Math.floor(nameHeight*.92),22*k);
 if(ctx.measureText(label).width>width-30*k&&words.length>1){
  let best=1,gap=1e9;
  for(let i=1;i<words.length;i++){const d=Math.abs(words.slice(0,i).join(' ').length-words.slice(i).join(' ').length);if(d<gap){gap=d;best=i;}}
  lines=[words.slice(0,best).join(' '),words.slice(best).join(' ')];
  size=Math.min(...lines.map(line=>fitText(ctx,line,width-30*k,Math.floor(nameHeight*.5),18*k)));
 }
 ctx.font=`900 ${size}px ${FONT_FAMILY}`;ctx.fillStyle='#ffffff';ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=4;
 ctx.lineWidth=size*.04;ctx.lineJoin='round';ctx.strokeStyle='#ffffff';
 lines.forEach((line,i)=>{const y=nameHeight*(lines.length===1?.52:.27+.46*i);ctx.strokeText(line,width/2,y);ctx.fillText(line,width/2,y);});
 if(time){
  const timeSize=fitText(ctx,time,width-36*k,Math.floor(height*.78),30*k);
  ctx.font=`900 ${timeSize}px ${FONT_FAMILY}`;ctx.shadowColor=accent;ctx.shadowBlur=14*k;ctx.fillStyle=accent;
  ctx.lineWidth=timeSize*.03;ctx.strokeStyle=accent;ctx.strokeText(time,width/2,height*.7);
  ctx.fillText(time,width/2,height*.7);
 }
}
// Countdown plate: dark, thin corner brackets in the tint, big equal numerals in the title font with tiny unit letters.
function drawCountdownCanvas(canvas,parts,tintColor,accent){
 const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
 ctx.clearRect(0,0,width,height);
 ctx.fillStyle='rgba(2,5,10,.94)';ctx.fillRect(6,6,width-12,height-12);
 ctx.strokeStyle=tintColor;ctx.lineWidth=3;ctx.shadowColor=tintColor;ctx.shadowBlur=8;
 const arm=26,x0=6,y0=6,x1=width-6,y1=height-6;
 ctx.beginPath();
 for(const [cx,cy,dx,dy] of [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]]){ctx.moveTo(cx+dx*arm,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+dy*arm);}
 ctx.stroke();ctx.shadowBlur=0;
 ctx.textBaseline='alphabetic';
 if(parts.length===1&&parts[0].live){
  ctx.fillStyle=accent;ctx.beginPath();ctx.arc(width*.3,height/2,13,0,Math.PI*2);ctx.fill();
  ctx.font=`900 ${Math.floor(height*.6)}px ${FONT_FAMILY}`;ctx.fillStyle='#ffffff';ctx.textAlign='left';ctx.fillText('LIVE',width*.38,height*.7);return;
 }
 // Measure at full size, then scale the whole readout to fit so every numeral stays equal.
 let size=Math.floor(height*.66);
 const layout=px=>{ctx.font=`900 ${px}px ${FONT_FAMILY}`;const unit=px*.42,gap=px*.28;let total=0;const items=parts.map(part=>{const w=ctx.measureText(part.value).width;ctx.font=`900 ${unit}px ${FONT_FAMILY}`;const uw=ctx.measureText(part.unit).width;ctx.font=`900 ${px}px ${FONT_FAMILY}`;return {part,w,uw};});
  items.forEach((item,i)=>{total+=item.w+item.uw+px*.06+(i?gap*1.6:0);});return {items,total,unit,gap};};
 let L=layout(size);
 if(L.total>width-70){size=Math.floor(size*(width-70)/L.total);L=layout(size);}
 let x=(width-L.total)/2;const base=height*.5+size*.36;
 L.items.forEach((item,i)=>{
  if(i){ctx.font=`900 ${size}px ${FONT_FAMILY}`;ctx.fillStyle=accent;ctx.textAlign='left';ctx.fillText(':',x+L.gap*.3,base-size*.08);x+=L.gap*1.6;}
  ctx.font=`900 ${size}px ${FONT_FAMILY}`;ctx.fillStyle='#ffffff';ctx.textAlign='left';ctx.lineWidth=size*.05;ctx.lineJoin='round';ctx.strokeStyle='#ffffff';ctx.strokeText(item.part.value,x,base);ctx.fillText(item.part.value,x,base);
  x+=item.w+size*.06;
  ctx.font=`900 ${L.unit}px ${FONT_FAMILY}`;ctx.fillStyle=accent;ctx.fillText(item.part.unit,x,base-size*.62);
  x+=item.uw;
 });
}
// Face stack: overlapping round chips with initials in the venue tint, then a +N chip when more people RSVP'd.
function drawFaceCanvas(canvas,faces,tintColor){
 const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
 ctx.clearRect(0,0,width,height);
 const chips=[...faces.people,...(faces.more?['+'+faces.more]:[])],d=height*.84,step=d*.84,total=d+step*(chips.length-1);
 let x=(width-total)/2+d/2;
 ctx.textAlign='center';ctx.textBaseline='middle';
 chips.forEach((label,i)=>{
  const more=label.startsWith('+');
  ctx.beginPath();ctx.arc(x,height/2,d/2,0,Math.PI*2);
  ctx.shadowColor=tintColor;ctx.shadowBlur=10;
  ctx.fillStyle=more?'#05080c':tintColor;ctx.fill();ctx.shadowBlur=0;
  ctx.lineWidth=5;ctx.strokeStyle=more?tintColor:'#ffffff';ctx.stroke();
  ctx.fillStyle=more?'#ffffff':'#03060a';ctx.font=`900 ${Math.floor(d*(label.length>2?.32:.44))}px ${FONT_FAMILY}`;
  ctx.fillText(label,x,height/2+d*.03);
  x+=step;
 });
}
// Base disc under the beam, drawn white so the material colour carries the tint: a soft glow, a crisp outer ring,
// a thin dashed inner ring and a bright core, like the concept's glowing floor mark.
function drawBaseDiscCanvas(canvas){
 const ctx=canvas.getContext('2d'),size=canvas.width,c=size/2;
 ctx.clearRect(0,0,size,size);
 const g=ctx.createRadialGradient(c,c,0,c,c,c);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.14,'rgba(255,255,255,.8)');g.addColorStop(.55,'rgba(255,255,255,.34)');g.addColorStop(.86,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(c,c,c,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=size*.03;ctx.beginPath();ctx.arc(c,c,c*.84,0,Math.PI*2);ctx.stroke();
 ctx.lineWidth=size*.014;ctx.setLineDash([size*.03,size*.02]);ctx.strokeStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(c,c,c*.6,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
}
// Venue name under the disc: small, white, wide-set caps with a soft shadow in the accent.
function drawVenueLabelCanvas(canvas,name,accent){
 const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
 ctx.clearRect(0,0,width,height);
 const text=String(name||'').toUpperCase();if(!text)return;
 ctx.textBaseline='middle';ctx.textAlign='left';
 const measure=px=>{ctx.font=`900 ${px}px ${FONT_FAMILY}`;const space=px*.2;let total=-space;for(const ch of text)total+=ctx.measureText(ch).width+space;return {space,total};};
 let px=Math.floor(height*.74),m=measure(px);
 if(m.total>width-24){px=Math.max(16,Math.floor(px*(width-24)/m.total));m=measure(px);}
 ctx.font=`900 ${px}px ${FONT_FAMILY}`;
 let x=(width-m.total)/2;
 ctx.shadowColor=accent;ctx.shadowBlur=px*.28;ctx.fillStyle='#ffffff';
 for(const ch of text){ctx.fillText(ch,x,height*.54);x+=ctx.measureText(ch).width+m.space;}
}
function radialTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'#ffffff');g.addColorStop(.2,'#ffffff88');g.addColorStop(1,'#ffffff00');
 ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(canvas);
}
// Screen art with cheap glitch swaps: two textures, per-slice horizontal tear, RGB split and scan lines in the accent.
const ART_VERTEX='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const ART_FRAGMENT=`
varying vec2 vUv;
uniform sampler2D map0;uniform sampler2D map1;
uniform float aspect0;uniform float aspect1;uniform float boxAspect;
uniform float mixAmount;uniform float glitch;uniform float seconds;uniform float opacity;
uniform vec3 accent;uniform vec3 accent2;
float hash(float n){return fract(sin(n*91.345)*47453.5453);}
vec4 art(sampler2D tex,float asp,vec2 uv){
 vec2 c=uv-.5;float k=boxAspect/asp;vec2 s=k>1.?vec2(k,1.):vec2(1.,1./k);vec2 q=c*s+.5;
 if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return vec4(0.);
 return texture2D(tex,q);
}
vec4 pick(vec2 uv,float slice){
 float m=glitch>0.?step(hash(slice+3.)*.7+.15,mixAmount):mixAmount;
 return m>.5?art(map1,aspect1,uv):art(map0,aspect0,uv);
}
void main(){
 vec2 uv=vUv;float slice=floor(uv.y*16.);float tick=floor(seconds*22.);
 float r=hash(slice+tick*7.);float tear=glitch>0.&&r>.62?(hash(slice*3.+tick)-.5)*.34*glitch:0.;
 vec2 p=vec2(uv.x+tear,uv.y);float ca=.022*glitch;
 vec4 sr=pick(p+vec2(ca,0.),slice),sg=pick(p,slice),sb=pick(p-vec2(ca,0.),slice);
 vec3 col=vec3(sr.r,sg.g,sb.b);float a=max(max(sr.a,sg.a),sb.a);
 col=mix(col,col*mix(accent,accent2,uv.x),glitch*.35);
 col*=1.-.18*glitch*step(.5,fract(uv.y*70.));
 float bar=glitch>0.&&hash(slice*5.+tick*3.)>.9?1.:0.;
 col+=accent*bar*.55*glitch;a=max(a,bar*.35*glitch);
 gl_FragColor=vec4(col,a*opacity);
 #include <colorspace_fragment>
}`;
function blankTexture(){const t=new THREE.DataTexture(new Uint8Array([0,0,0,0]),1,1,THREE.RGBAFormat);t.needsUpdate=true;return t;}
// mirrored: set when the host draws the model through a projection that flips triangle winding (the map layer does not).
export function createBlenderHologram(template,{color='#FF00CC',phase=0,logo=null,mirrored=false}={}){
 const object=template.clone(true),meshes=[],particles=[],materials=new Set(),groundTexture=radialTexture();
 let iconMaterial=null;
 const tint=new THREE.Color(color);
 // Cut-out for the model's three little circles; the face stack replaces them.
 const holeUniform={value:new THREE.Vector4(0,0,0,0)},holeLowerUniform={value:new THREE.Vector4(0,0,0,0)},stackUniform={value:new THREE.Vector4(0,STACK_LIFT,STACK_RISE,STACK_GAP)},spinUniform={value:new THREE.Vector2(0,0)},bandUniform={value:[0,1,2,3].map(()=>new THREE.Vector4(0,0,0,0))},pulseUniform={value:new THREE.Vector4(0,2,2.5,0)};
 object.traverse(node=>{
  if(!node.isMesh)return;
  const role=node.userData.mapzRole||'outline';
  const white=role==='icon'||role==='particle';
  const opacity={outline:.9,'ring-fill':.095,beam:.025,panel:.32,icon:1,particle:.85,ground:.5}[role]??1;
  const material=new THREE.MeshBasicMaterial({color:role==='panel'?0x000000:white?0xffffff:tint,
   transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
   blending:role==='beam'||role==='particle'?THREE.AdditiveBlending:THREE.NormalBlending,
   map:role==='ground'?groundTexture:null});
  // Every Blender mesh gets: the double stack spacing, the staged coin to vortex spin-up (per-vertex timing), the gentle
  // counter-tilt of the ring bands; the outline, ring surfaces and icon also get the dots cut-out, and the beam
  // carries the light pulses. All of it is uniform driven: no extra draw calls.
  const holed=role==='outline'||role==='ring-fill'||role==='icon',spaced=holed||role==='panel'||role==='beam',pulsed=role==='beam';
  if(spaced){
   material.onBeforeCompile=shader=>{
    shader.uniforms.uStack=stackUniform;shader.uniforms.uSpin=spinUniform;shader.uniforms.uBand=bandUniform;
    if(pulsed)shader.uniforms.uPulse=pulseUniform;
    const morph=`
 #ifdef USE_MORPHTARGETS
 transformed*=morphTargetBaseInfluence;
 vec3 dCoin=vec3(0.),dVort=vec3(0.);
 for(int i=0;i<MORPHTARGETS_COUNT;i++){
  float infl=morphTargetInfluences[i];
  if(uSpin.y>.5&&(i==2||i==3)){vec3 d=getMorph(gl_VertexID,i,0).xyz;if(i==2)dCoin=d;else dVort=d;}
  else if(infl!=0.0)transformed+=getMorph(gl_VertexID,i,0).xyz*infl;
 }
 if(uSpin.y>.5){
  float ky=position.y+dVort.y;
  float s0=.12+.38*smoothstep(2.,4.2,ky);
  float fv=smoothstep(s0,s0+.42,uSpin.x);
  transformed+=dCoin*(1.-fv)+dVort*fv;
 }
 #endif
 transformed.y+=uStack.x*(uStack.y*smoothstep(.35,.55,transformed.y)+uStack.z*smoothstep(1.88,2.02,transformed.y)+uStack.w*smoothstep(2.93,3.07,transformed.y));
 for(int k=0;k<4;k++){
  vec4 bd=uBand[k];
  if(bd.y>0.){float wt=1.-smoothstep(bd.y*.7,bd.y,abs(transformed.y-bd.x));transformed.y+=wt*((transformed.z)*bd.z+transformed.x*bd.w);}
 }
 `+(holed?'vHolePos=transformed;':'')+(pulsed?'vBeamY=transformed.y;':'');
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform vec4 uStack;uniform vec2 uSpin;uniform vec4 uBand[4];'+(holed?'\nvarying vec3 vHolePos;':'')+(pulsed?'\nvarying float vBeamY;':''))
     .replace('#include <morphtarget_vertex>',morph);
    if(holed){
     shader.uniforms.uHole=holeUniform;shader.uniforms.uHole2=holeLowerUniform;
     shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vHolePos;uniform vec4 uHole;uniform vec4 uHole2;')
      .replace('void main() {','void main() {\n if(uHole.w>.5&&vHolePos.y>uHole.x&&vHolePos.y<uHole.y&&abs(vHolePos.x)<uHole.z)discard;\n if(uHole2.w>.5&&vHolePos.y>uHole2.x&&vHolePos.y<uHole2.y&&abs(vHolePos.x)<uHole2.z)discard;');
    }
    if(pulsed){
     // Small bright pulses climbing the beam from the pin to the rings. uPulse: phase, how many at once, the height they reach, strength.
     shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vBeamY;uniform vec4 uPulse;')
      .replace('#include <opaque_fragment>',`#include <opaque_fragment>
 {
  float travel=vBeamY/max(uPulse.z,.01),glow=0.;
  for(int k=0;k<8;k++){
   float on=clamp(uPulse.y-float(k),0.,1.);
   float pos=fract(uPulse.x+float(k)/max(uPulse.y,1.));
   float d=travel-pos;
   glow+=on*exp(-d*d*1300.)*smoothstep(0.,.1,pos)*(1.-smoothstep(.82,1.,pos));
  }
  float g=glow*uPulse.w;
  gl_FragColor.rgb+=mix(diffuseColor.rgb,vec3(1.),.4)*g*1.5;
  gl_FragColor.a=min(.7,gl_FragColor.a+g*.6);
 }`);
    }
   };
   material.customProgramCacheKey=()=>'e3-v3-'+(holed?'h':'')+(pulsed?'p':'');
  }
  node.material=material;node.frustumCulled=false;
  node.renderOrder=role==='beam'?0:role==='panel'?1:role==='ring-fill'?2:3;
  materials.add(material);meshes.push(node);
  if(role==='particle')particles.push(node);
  if(role==='icon')iconMaterial=material;
 });
 // Venue logo on the coin faces (stages up to 3). The vortex screens carry the art slides below.
 const logoPlanes=[LOGO_MAIN,LOGO_LOWER].map(table=>{
  const material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,color:0xffffff});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
  mesh.frustumCulled=false;mesh.renderOrder=4;mesh.visible=false;mesh.position.z=LOGO_FACE_Z;object.add(mesh);
  return {table,mesh,material};
 });
 const textures=new Set();
 const track=texture=>{textures.add(texture);return texture;};
 const release=texture=>{if(texture){texture.dispose();textures.delete(texture);}};
 const canvasTexture=canvas=>{const t=track(new THREE.CanvasTexture(canvas));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
 const flat=(mesh,order)=>{mesh.frustumCulled=false;mesh.renderOrder=order;mesh.visible=false;mesh.position.z=LOGO_FACE_Z;object.add(mesh);return mesh;};
 const flatMaterial=()=>new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,color:0xffffff});
 // Content, set by the host row: accent, per-screen copy and art, ring lines, countdown parts, faces.
 let content={accent:'#E03DFF',screens:[],countdown:[],faces:{people:[],more:0}},contentKey='';
 const blank=blankTexture();
 // Art slides, one per screen.
 const slides=[ART_MAIN,ART_LOWER].map((table,index)=>{
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
   uniforms:{map0:{value:blank},map1:{value:blank},aspect0:{value:1},aspect1:{value:1},boxAspect:{value:1.75},mixAmount:{value:0},glitch:{value:0},seconds:{value:0},opacity:{value:0},
    accent:{value:new THREE.Color('#E03DFF')},accent2:{value:new THREE.Color('#19E3FF')}},
   vertexShader:ART_VERTEX,fragmentShader:ART_FRAGMENT});
  material.toneMapped=false;
  const mesh=flat(new THREE.Mesh(new THREE.PlaneGeometry(1,1),material),5);
  return {table,index,material,mesh,kinds:[],textures:{},aspects:{}};
 });
 const infos=[INFO_MAIN,INFO_LOWER].map((table,index)=>{const material=flatMaterial();return {table,index,material,mesh:flat(new THREE.Mesh(new THREE.PlaneGeometry(1,1),material),5),texture:null};});
 const bands=RING_BANDS.map(spec=>{
  const make=(side,renderOrder)=>{
   const material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side,toneMapped:false,color:0xffffff});
   const mesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,64,1,true),material);
   mesh.frustumCulled=false;mesh.renderOrder=renderOrder;mesh.visible=false;object.add(mesh);
   return {material,mesh};
  };
  // Near wall at full strength, far wall dimmed and un-mirrored, like the 2D ring.
  const near=make(mirrored?THREE.BackSide:THREE.FrontSide,4),far=make(mirrored?THREE.FrontSide:THREE.BackSide,3);
  return {spec,near,far,meshes:[near,far],texture:null,farTexture:null,text:''};
 });
 const plate={material:flatMaterial(),texture:null};plate.mesh=flat(new THREE.Mesh(new THREE.PlaneGeometry(1,1),plate.material),6);
 const faceStack={material:flatMaterial(),texture:null};faceStack.mesh=flat(new THREE.Mesh(new THREE.PlaneGeometry(1,1),faceStack.material),6);
 // Orb: a bright core and two soft additive shells, in the accent.
 const orb=new THREE.Group();orb.visible=false;object.add(orb);
 const orbCore=new THREE.Mesh(new THREE.SphereGeometry(ORB.radius,16,12),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
 const orbShells=[[2.1,.34],[3.4,.14]].map(([scale,alpha])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(ORB.radius*scale,16,12),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}));m.userData.alpha=alpha;return m;});
 for(const mesh of [orbCore,...orbShells]){mesh.frustumCulled=false;mesh.renderOrder=6;orb.add(mesh);}
 // Beam base disc: flat on the ground at the anchor, in the tint, with a soft pulse.
 const discCanvas=document.createElement('canvas');discCanvas.width=discCanvas.height=256;drawBaseDiscCanvas(discCanvas);
 const discTexture=new THREE.CanvasTexture(discCanvas);discTexture.colorSpace=THREE.SRGBColorSpace;
 const disc={material:new THREE.MeshBasicMaterial({map:discTexture,color:tint.clone(),transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,blending:THREE.AdditiveBlending})};
 disc.mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),disc.material);disc.mesh.rotation.x=-Math.PI/2;disc.mesh.position.y=BASE_DISC.y;
 disc.mesh.frustumCulled=false;disc.mesh.renderOrder=2;disc.mesh.visible=false;object.add(disc.mesh);
 // Venue name label in front of the disc, standing up (it turns with the map like the screens do).
 const label={material:flatMaterial(),texture:null};label.mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),label.material);
 label.mesh.frustumCulled=false;label.mesh.renderOrder=6;label.mesh.visible=false;label.mesh.position.set(0,BASE_LABEL.y,BASE_LABEL.z);object.add(label.mesh);
 // Venue logo for the coin stages.
 let logoKey=null,logoTexture=null,logoAspect=1;
 function setLogo(next){
  const key=next?next.key??next.image:null;
  if(key===logoKey)return;
  logoKey=key;
  release(logoTexture);logoTexture=null;
  if(next?.image&&next.width>0&&next.height>0){
   logoTexture=canvasTexture(next.image);
   logoAspect=next.width/next.height;
  }
  for(const plane of logoPlanes){plane.material.map=logoTexture;plane.material.needsUpdate=true;}
 }
 setLogo(logo);
 const art=(entry)=>entry?.image&&entry.width>0&&entry.height>0?entry:null;
 function setContent(next={}){
  const screens=(next.screens||[]).slice(0,2),accent=next.accent||'#E03DFF',fonts=fontsReady();
  const countdown=next.countdown||[],faces=next.faces||{people:[],more:0};
  const tintHex='#'+tint.getHexString();
  const venueName=String(next.venueName||'');
  const key=JSON.stringify([venueName,accent,tintHex,fonts,screens.map(sc=>[sc.name,sc.time,sc.ringName,sc.ringSub,art(sc.logo)?.key,art(sc.poster)?.key,art(sc.host)?.key]),countdown.map(c=>c.value+c.unit),faces]);
  const textOnly=JSON.stringify([venueName,accent,tintHex,fonts,screens.map(sc=>[sc.name,sc.time,sc.ringName,sc.ringSub,art(sc.logo)?.key,art(sc.poster)?.key,art(sc.host)?.key]),faces]);
  if(key===contentKey)return;
  const keepStatic=textOnly===content.staticKey;
  content={accent,screens,countdown,faces,staticKey:textOnly};contentKey=key;
  if(!keepStatic){
   // Ring text, info bands, art textures and faces change only with the event, never with the clock.
   screens.forEach((screen,index)=>{
    const slide=slides[index],info=infos[index];
    release(info.texture);info.texture=null;
    if(screen.name||screen.time){const canvas=document.createElement('canvas');canvas.width=520;canvas.height=210;drawInfoCanvas(canvas,screen.name,screen.time,accent);info.texture=canvasTexture(canvas);}
    info.material.map=info.texture;info.material.needsUpdate=true;
    for(const kind of Object.keys(slide.textures)){release(slide.textures[kind]);}
    slide.textures={};slide.aspects={};slide.kinds=[];
    for(const kind of ['logo','poster','host']){
     const entry=art(screen[kind]);
     if(!entry)continue;
     slide.textures[kind]=canvasTexture(entry.image);slide.aspects[kind]=entry.width/entry.height;slide.kinds.push(kind);
    }
    slide.material.uniforms.accent.value.set(accent);
   });
   for(let i=screens.length;i<slides.length;i++){
    release(infos[i].texture);infos[i].texture=null;infos[i].material.map=null;
    for(const kind of Object.keys(slides[i].textures))release(slides[i].textures[kind]);
    slides[i].textures={};slides[i].kinds=[];
   }
   for(const band of bands){
    const screen=screens[band.spec.screen],line=screen?(band.spec.line===0?screen.ringName:screen.ringSub):'';
    release(band.texture);release(band.farTexture);band.texture=band.farTexture=null;band.text=line||'';
    if(line){
     const canvas=document.createElement('canvas');canvas.width=band.spec.width;canvas.height=band.spec.height;drawRingTextCanvas(canvas,line,band.spec.font,accent,tintHex);
     band.texture=canvasTexture(canvas);band.texture.wrapS=THREE.RepeatWrapping;
     band.farTexture=band.texture.clone();track(band.farTexture);band.farTexture.repeat.x=-1;band.farTexture.offset.x=1;band.farTexture.needsUpdate=true;
    }
    band.near.material.map=band.texture;band.far.material.map=band.farTexture;band.near.material.needsUpdate=true;band.far.material.needsUpdate=true;
   }
   release(label.texture);label.texture=null;
   if(venueName){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=162;drawVenueLabelCanvas(canvas,venueName,accent);label.texture=canvasTexture(canvas);}
   label.material.map=label.texture;label.material.needsUpdate=true;
   release(faceStack.texture);faceStack.texture=null;
   if(faces.people.length){const canvas=document.createElement('canvas');canvas.width=360;canvas.height=94;drawFaceCanvas(canvas,faces,tintHex);faceStack.texture=canvasTexture(canvas);}
   faceStack.material.map=faceStack.texture;faceStack.material.needsUpdate=true;
   orbCore.material.color.set(accent);for(const shell of orbShells)shell.material.color.set(accent);
  }
  // The countdown changes about once a second.
  release(plate.texture);plate.texture=null;
  if(countdown.length){const canvas=document.createElement('canvas');canvas.width=400;canvas.height=118;drawCountdownCanvas(canvas,countdown,tintHex,accent);plate.texture=canvasTexture(canvas);}
  plate.material.map=plate.texture;plate.material.needsUpdate=true;
 }
 let stage=0,urgency=0,lastElapsed=null,ringAngle=0,tiltClock=0,pulsePhase=0;
 return {object,
  setColor(value){tint.set(value);disc.material.color.copy(tint);for(const node of meshes)if(!['panel','icon','particle'].includes(node.userData.mapzRole))node.material.color.copy(tint);},
  setLogo,setContent,
  // 0..1 time-to-start energy (e3EventUrgency): ring spin, ring tilt rate and beam pulses ramp with it.
  setUrgency(value){urgency=Math.max(0,Math.min(1,Number(value)||0));},
  get urgency(){return urgency;},
  get hasContent(){return Boolean(contentKey);},
  get hasRingText(){return bands.some(band=>band.texture);},
  get hasCountdown(){return Boolean(plate.texture);},
  get hasBaseDisc(){return disc.mesh.visible;},
  get hasVenueLabel(){return Boolean(label.texture);},
  get hasFaces(){return Boolean(faceStack.texture);},
  get hasLogo(){return Boolean(logoTexture);},
  get slideKinds(){return slides.map(slide=>[...slide.kinds]);},
  setStage(value){stage=typeof value==='string'?Math.max(0,E3_BLENDER_STAGES.indexOf(value)):clamp(value);},
  // elapsed is seconds of active map time. The map host pauses this clock when
  // hidden and passes reduced=true for Calm Mode. Hover frequencies come from
  // the Blender shape-key drivers; each part moves independently.
  update(elapsed=0,reduced=false){
   // Active-time delta for the accumulated phases (a rate that changes with the clock never makes the angle jump).
   const dt=lastElapsed===null?0:Math.max(0,Math.min(.5,elapsed-lastElapsed));lastElapsed=elapsed;
   if(!reduced){ringAngle+=Math.PI*2*e3RingSpinRate(urgency)*dt;tiltClock+=e3RingTiltRate(urgency)*dt;pulsePhase+=e3BeamPulseLook(urgency).speed*dt;}
   // Staged coin to vortex spin-up (stage 3 to 4): the coin flips, the rings unfold, the screen slides out, the orb drops in.
   const sp=reduced?{active:false,f:0,flipAngle:0,rings:0,screen:0,extras:0,orb:0,flash:0}:e3SpinUp(stage);
   const at=progress=>sp.active?3+progress:stage;
   spinUniform.value.set(sp.f,sp.active?1:0);
   object.rotation.y=sp.flipAngle;
   const weights=blenderStageWeights(stage),frame=elapsed*24,hover=stage<3?0:Math.min(1,stage-3);
   for(const node of meshes){
    if(!node.morphTargetInfluences)continue;
    for(const [name,index] of Object.entries(node.morphTargetDictionary||{})){
     const state=E3_BLENDER_MORPHS.indexOf(name),motion=HOVER[name];
     node.morphTargetInfluences[index]=state>=0?weights[state]:motion&&!reduced?
      hover*(.82*Math.sin(frame*motion[0]+motion[1]+phase)+.18*Math.sin(frame*motion[0]*1.9+motion[1]+.6+phase)):0;
    }
   }
   stackUniform.value.x=blenderStackOpen(stage);
   const hole=contentKey?blenderDotsHole(stage):{on:false,min:0,max:0,half:0};
   holeUniform.value.set(hole.min,hole.max,hole.half,hole.on?1:0);
   holeLowerUniform.value.set(hole.lowerMin||0,hole.lowerMax||0,hole.half,hole.lowerOn?1:0);
   let logoMix=0;
   for(const plane of logoPlanes){
    const face=logoTexture?blenderLogoFace(plane.table,stage,logoAspect):null;
    plane.mesh.visible=Boolean(face)&&face.opacity>.01&&face.width>.01;
    if(!face)continue;
    if(plane.table===LOGO_MAIN)logoMix=face.opacity;
    // Where the screen carries art slides, the coin logo hands over to them as the screen unfolds.
    const handover=slides[0].kinds.length?Math.max(0,Math.min(1,4-stage)):1;
    plane.mesh.visible=plane.mesh.visible&&face.opacity*handover>.01;
    plane.mesh.position.y=face.y;plane.mesh.scale.set(face.width,face.height,1);plane.material.opacity=face.opacity*handover;
   }
   // Screen art slides: logo most of the time, poster and host logo glitching in. Reduced motion is the static logo.
   for(const slide of slides){
    const face=blenderArtFace(slide.table,at(sp.screen)),has=slide.kinds.length>0&&face.opacity>.01&&face.width>.01;
    slide.mesh.visible=has;
    if(!has)continue;
    const state=e3SlideState(slide.kinds,elapsed+slide.index*4.3+phase*.9,{reduced});
    const u=slide.material.uniforms;
    u.map0.value=slide.textures[state.from]||blank;u.map1.value=slide.textures[state.to]||blank;
    u.aspect0.value=slide.aspects[state.from]||1;u.aspect1.value=slide.aspects[state.to]||1;
    u.mixAmount.value=state.mix;u.glitch.value=Math.max(state.glitch,sp.flash*.9);u.seconds.value=elapsed;u.opacity.value=face.opacity;u.boxAspect.value=face.width/Math.max(.01,face.height);
    slide.mesh.position.y=face.y;slide.mesh.scale.set(face.width,face.height,1);
   }
   for(const info of infos){
    const face=blenderArtFace(info.table,at(sp.screen)),show=Boolean(info.texture)&&face.opacity>.01;
    info.mesh.visible=show;
    if(show){info.mesh.position.y=face.y;info.mesh.scale.set(face.width,face.height,1);info.material.opacity=face.opacity;}
   }
   // Text rings turn (faster as the event nears, peak when it opens) and adjacent rings tilt gently in opposite
   // directions. The same band table drives the tilt of the Blender ring meshes through uBand (vertex shader).
   const turn=reduced?0:ringAngle,tiltAmp=reduced?0:E3_RING_TILT_RADIANS;
   bands.forEach((band,k)=>{
    const face=band.texture?blenderBandFace(band.spec,at(sp.rings)):null;
    const show=Boolean(face)&&face.opacity>.01;
    for(const part of band.meshes)part.mesh.visible=show;
    const sign=k%2?-1:1,amp=show?tiltAmp*Math.min(1,face.opacity)*sign:0;
    const tiltX=amp*Math.sin(tiltClock+phase+k*1.7),tiltZ=amp*.6*Math.cos(tiltClock*.8+phase+k*2.3);
    bandUniform.value[k].set(face?face.y:0,show&&amp?face.height*.62:0,tiltX,tiltZ);
    if(!show)return;
    const spin=(band.spec.line===0?turn:-turn*.8)+band.spec.screen*1.7+(band.spec.line?2.1:0);
    for(const [part,alpha] of [[band.near,1],[band.far,.34]]){
     part.mesh.position.y=face.y;part.mesh.scale.set(face.radius,face.height,face.radius);part.material.opacity=face.opacity*alpha;
     part.mesh.rotation.order='ZXY';part.mesh.rotation.set(-tiltX,spin,tiltZ);
    }
   });
   // Light pulses up the beam: density and speed follow the urgency; none under reduced motion.
   {
    const look=e3BeamPulseLook(urgency),reach=interpolate(PULSE_TOP,stage),strength=reduced?0:Math.max(0,Math.min(1,(stage-3.2)/.8));
    pulseUniform.value.set(pulsePhase,look.count,reach,strength);
   }
   {
    const face=plate.texture?blenderPlateFace(at(sp.extras),COUNTDOWN_PLATE):null;
    plate.mesh.visible=Boolean(face)&&face.opacity>.01;
    if(face){plate.mesh.position.y=face.y;plate.mesh.scale.set(face.width,face.height,1);plate.material.opacity=face.opacity;}
    const faceStackFace=faceStack.texture?blenderPlateFace(at(sp.extras),FACE_STACK):null;
    faceStack.mesh.visible=Boolean(faceStackFace)&&faceStackFace.opacity>.01;
    if(faceStackFace){faceStack.mesh.position.y=faceStackFace.y;faceStack.mesh.scale.set(faceStackFace.width,faceStackFace.height,1);faceStack.material.opacity=faceStackFace.opacity;}
   }
   // Beam base disc (pulses softly, static under reduced motion) and the venue label.
   {
    const face=blenderBaseFace(stage),pulse=reduced?1:1+.07*Math.sin(elapsed*2.1+phase);
    disc.mesh.visible=face.opacity>.01;
    if(disc.mesh.visible){
     const d=face.radius*2*pulse;disc.mesh.scale.set(d,d,1);
     disc.material.opacity=Math.min(1,face.opacity*(reduced?.85:.72+.18*Math.sin(elapsed*2.1+phase))+sp.flash*.5);
    }
    const showLabel=Boolean(label.texture)&&face.opacity>.01;
    label.mesh.visible=showLabel;
    if(showLabel){label.mesh.scale.set(BASE_LABEL.width,BASE_LABEL.height,1);label.material.opacity=face.opacity;}
   }
   // Floating orb with a gentle bob.
   {
    const face=contentKey?blenderOrbFace(at(sp.orb)):{y:0,opacity:0};
    // The orb drops into place during the spin-up, then settles with one small bounce.
    if(sp.active)face.y+=e3OrbDrop(sp.orb)*1.6;
    orb.visible=face.opacity>.01;
    if(orb.visible){
     const bob=reduced?0:Math.sin(elapsed*1.7+phase)*.05;
     orb.position.set(0,face.y+bob,0);orb.scale.setScalar(1+sp.flash*1.4);
     orbCore.material.opacity=face.opacity;for(const shell of orbShells)shell.material.opacity=shell.userData.alpha*face.opacity*(reduced?1:.85+.15*Math.sin(elapsed*2.3+phase));
    }
   }
   // The generic mark gives way to the logo; with no logo it stays.
   if(iconMaterial)iconMaterial.opacity=1-logoMix;
   const h=interpolate(HEIGHT,stage),r=interpolate(RADIUS,stage);
   particles.forEach((node,k)=>{
    node.visible=h>.1;
    const t=((reduced?0:elapsed/9.625)+k/20)%1,angle=k*2.39996+phase;
    // glTF is Y-up; the wrapper is rotated once into the map's Z-up frame.
    node.position.set(Math.cos(angle)*r*t*.72,t*h+.06,-Math.sin(angle)*r*t*.72);
   });
  },
  dispose(){
   for(const material of materials)material.dispose();groundTexture.dispose();blank.dispose();
   for(const texture of [...textures])texture.dispose();textures.clear();
   for(const plane of logoPlanes){plane.material.dispose();plane.mesh.geometry.dispose();}
   for(const slide of slides){slide.material.dispose();slide.mesh.geometry.dispose();}
   for(const info of infos){info.material.dispose();info.mesh.geometry.dispose();}
   for(const band of bands)for(const part of band.meshes){part.material.dispose();part.mesh.geometry.dispose();}
   disc.material.dispose();disc.mesh.geometry.dispose();discTexture.dispose();label.material.dispose();label.mesh.geometry.dispose();
   plate.material.dispose();plate.mesh.geometry.dispose();faceStack.material.dispose();faceStack.mesh.geometry.dispose();
   for(const mesh of [orbCore,...orbShells]){mesh.material.dispose();mesh.geometry.dispose();}
  }
 };
}

// A self-contained custom layer adapter for Claude's map wiring. It shares the
// map's existing WebGL context and geographic depth; it creates no second canvas.
// No production code imports this until the wiring owner opts in.
export function createE3BlenderLayer(maplibre,{url=E3_BLENDER_URL,onReady=()=>{},onError=()=>{},maxVisible=3}={}){
 let map,renderer,scene,camera,template,origin,unit=1,disposed=false,rows=[],elapsed=0;
 const instances=new Map(),matrix=new THREE.Matrix4(),local=new THREE.Matrix4();
 const layer={id:'mapz-blender-holograms',type:'custom',renderingMode:'3d',
  setVenues(next){rows=next.slice(0,maxVisible);sync();map?.triggerRepaint();},
  setMotion({seconds=0,reduced=false,active=true}={}){elapsed=seconds;layer.reduced=reduced;layer.active=active;if(active)map?.triggerRepaint();},
  ready:false,active:true,reduced:false,
  onAdd(target,gl){
   map=target;scene=new THREE.Scene();camera=new THREE.Camera();
   renderer=new THREE.WebGLRenderer({canvas:map.getCanvas(),context:gl,antialias:true});renderer.autoClear=false;
   new GLTFLoader().load(url,gltf=>{
    if(disposed){release(gltf.scene);return;}
    template=gltf.scene;layer.ready=true;sync();onReady(layer);map.triggerRepaint();
   },undefined,error=>{if(!disposed)onError(error);});
  },
  render(gl,args){
   if(!template||!origin||!layer.active)return;
   matrix.fromArray(args.defaultProjectionData?.mainMatrix||args);
   local.makeTranslation(origin.x,origin.y,origin.z).scale(new THREE.Vector3(unit,-unit,unit));
   camera.projectionMatrix.copy(matrix).multiply(local);
   const bearing=map.getBearing()*Math.PI/180;
   for(const {model,root,row} of instances.values()){
    root.rotation.z=-bearing;model.setStage(row.stage??'vortex');model.update(elapsed,layer.reduced);
   }
   renderer.resetState();renderer.render(scene,camera);renderer.resetState();
  },
  onRemove(){disposed=true;for(const item of instances.values())item.model.dispose();instances.clear();if(template)release(template);renderer?.dispose();layer.ready=false;map=null;}
 };
 function sync(){
  if(!template||!scene)return;
  if(!origin&&rows.length){origin=maplibre.MercatorCoordinate.fromLngLat(rows[0].coordinates,0);unit=origin.meterInMercatorCoordinateUnits();}
  const keep=new Set(rows.map(row=>row.key));
  for(const [key,item] of instances)if(!keep.has(key)){scene.remove(item.root);item.model.dispose();instances.delete(key);}
  for(const row of rows){
   let item=instances.get(row.key);
   if(!item){
    const model=createBlenderHologram(template,{color:row.color,phase:row.phase??instances.size*2.39996,logo:row.logo}),root=new THREE.Group();
    model.object.rotation.x=Math.PI/2;root.add(model.object);scene.add(root);item={root,model,row};instances.set(row.key,item);
   }
   item.row=row;item.model.setColor(row.color||'#FF00CC');item.model.setUrgency(row.urgency||0);item.model.setLogo(row.logo??null);item.model.setContent(row.content??{});
   const position=maplibre.MercatorCoordinate.fromLngLat(row.coordinates,row.altitude??0);
   item.root.position.set((position.x-origin.x)/unit,-(position.y-origin.y)/unit,(position.z-origin.z)/unit);
   // Uniform size in meters, with an optional vertical stretch so a hologram can rise above local buildings.
   const size=row.scaleMeters??18,stretch=row.heightScale??1;
   item.root.scale.set(size,size,size*stretch);
  }
 }
 function release(root){const geometry=new Set(),material=new Set();root.traverse(node=>{if(node.geometry)geometry.add(node.geometry);for(const m of Array.isArray(node.material)?node.material:node.material?[node.material]:[])material.add(m);});geometry.forEach(g=>g.dispose());material.forEach(m=>m.dispose());}
 return layer;
}
