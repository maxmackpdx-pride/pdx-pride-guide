// Outzide's 28/44 px outlined head and short projection, shared by Mapz's
// non-event worlds. Screen dimensions stay constant; only the map anchor moves.
export function waypointGeometry(anchor,selected=false,roofLift=0){
 const size=selected?44:28,beamHeight=Math.max(selected?70:25,roofLift);
 return {x:anchor.x,y:anchor.y-beamHeight-size/2,size,bottom:anchor.y-beamHeight,anchorY:anchor.y};
}
const heads=new Map(),ink=new WeakMap();
function headSprite(color,selected){
 const key=color+selected;if(heads.has(key))return heads.get(key);
 const size=selected?44:28,pad=selected?16:10,dpr=2;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=(size+pad*2)*dpr;
 const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
 ctx.fillStyle='#111a15';ctx.strokeStyle=color;ctx.lineWidth=1;
 ctx.shadowColor=color+(selected?'80':'40');ctx.shadowBlur=selected?20:12;
 ctx.beginPath();ctx.roundRect(pad+.5,pad+.5,size-1,size-1,6);ctx.fill();ctx.stroke();
 const result={canvas,pad,size};heads.set(key,result);return result;
}
// Tint once per loaded glyph/color. Venue artwork is always white.
function tintedIcon(image,color){
 let colors=ink.get(image);if(!colors){colors=new Map();ink.set(image,colors);}
 if(colors.has(color))return colors.get(color);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
 const ctx=canvas.getContext('2d'),fit=88/Math.max(image.width,image.height);
 ctx.drawImage(image,(96-image.width*fit)/2,(96-image.height*fit)/2,image.width*fit,image.height*fit);
 ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,96,96);
 colors.set(color,canvas);return canvas;
}
export function drawWaypointHead(ctx,geometry,color,icon,logo,selected,alpha=1){
 const {x,y,size}=geometry,{canvas,pad}=headSprite(color,selected);
 ctx.save();ctx.globalAlpha=alpha;ctx.shadowBlur=0;
 ctx.drawImage(canvas,x-size/2-pad,y-size/2-pad,size+pad*2,size+pad*2);
 const image=logo||icon;
 if(image){const glyphSize=logo?size-8:selected?26:19;ctx.drawImage(tintedIcon(image,logo?'#FFFFFF':color),x-glyphSize/2,y-glyphSize/2,glyphSize,glyphSize);}
 ctx.restore();
}
export function drawWaypointFoot(ctx,geometry,color,materials,drawBeam,alpha=1,selected=false){
 const {x,bottom,anchorY}=geometry;
 ctx.save();ctx.globalAlpha=alpha*(selected?.9:.55);
 drawBeam(ctx,materials.beams.get(color),{x,y:anchorY},x,bottom,selected?20:10);
 const size=selected?44:28,orb=materials.orbs.get(color);
 if(orb){ctx.globalAlpha=alpha*(selected?1:.75);ctx.drawImage(orb,x-size/2,anchorY-size/2,size,size);}
 ctx.restore();
}

// One staggered 3–5 second cadence per geographic marker, using the existing
// map clock. No timers, texture updates, or movement of the waypoint itself.
export function waypointLogoInterval(phase){return 3+2*(.5+.5*Math.sin(phase*1.731));}
export function showWaypointLogo(seconds,phase,reducedMotion=false){
 if(reducedMotion)return true;
 return Math.floor((seconds+phase)/waypointLogoInterval(phase))%2===1;
}
