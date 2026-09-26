const heads=new Map(),ink=new WeakMap();
function cityAmount(){
 try{return window.__mapzMap?Math.max(0,Math.min(1,(window.__mapzMap.getZoom()-14.25)/1.1))*Math.max(0,Math.min(1,(window.__mapzMap.getPitch()-16)/18)):0;}catch{return 0;}
}
export function waypointGeometry(origin,selected=false,roofLift=0){
 const amount=cityAmount();
 const size=selected?44:28;
 // Shaft length from disk/roof up to the head. Shorter on roofs so the mark sits on the building.
 const beamHeight=Math.max(selected?56:22,roofLift*(1-amount*0.35)+amount*18);
 return {x:origin.x,y:origin.y-beamHeight-size/2,size,bottom:origin.y-beamHeight,anchorY:origin.y};
}
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
  const size=selected?44:28,orb=materials.orbs.get(color);
  if(orb){ctx.globalAlpha=alpha*(selected?1:.75)*disk;ctx.drawImage(orb,x-size/2,anchorY-size/2,size,size);}
 }
 ctx.restore();
}
export function waypointLogoInterval(phase){return 3+2*(.5+.5*Math.sin(phase*1.731));}
export function showWaypointLogo(seconds,phase,reducedMotion=false){
 if(reducedMotion)return true;
 const cycle=waypointLogoInterval(phase),t=((seconds+phase*1.7)%cycle)/cycle;
 return t>.18&&t<.72;
}
