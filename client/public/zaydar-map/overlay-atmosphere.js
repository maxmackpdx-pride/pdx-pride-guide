import {createSpatialIndex} from './spatial-index.js';

function signedArea(ring){
 let area=0;
 for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length];
  area+=a[0]*b[1]-b[0]*a[1];
 }
 return area;
}

function metersBetween(a,b){
 const lat=(a[1]+b[1])/2;
 return Math.hypot((a[0]-b[0])*111320*Math.cos(lat*Math.PI/180),(a[1]-b[1])*111320);
}

function closest(aRing,bRing){
 let best=Infinity,mid=null;
 const stepA=Math.max(1,Math.floor(aRing.length/8)),stepB=Math.max(1,Math.floor(bRing.length/8));
 for(let i=0;i<aRing.length;i+=stepA)for(let j=0;j<bRing.length;j+=stepB){
  const d=metersBetween(aRing[i],bRing[j]);
  if(d<best){best=d;mid=[(aRing[i][0]+bRing[j][0])/2,(aRing[i][1]+bRing[j][1])/2];}
 }
 return {dist:best,mid};
}

export function drawCorridorBloom(ctx,map,buildings,fade){
 if(fade<=0||map.getZoom()<14||!buildings?.length)return;
 const pitch=map.getPitch()*Math.PI/180;
 if(pitch<.12)return;
 const zoomScale=512*Math.pow(2,map.getZoom())/40075016.686;
 const nearby=createSpatialIndex(buildings,b=>b.center,.0004);
 ctx.save();ctx.globalCompositeOperation='screen';
 const drawn=new Set();
 for(const building of buildings){
  if(building.height<6)continue;
  for(const other of nearby(building.center)){
   if(other===building||other.height<6)continue;
   const key=building.center[0]<other.center[0]||(building.center[0]===other.center[0]&&building.center[1]<other.center[1])
    ?`${building.center}:${other.center}`:`${other.center}:${building.center}`;
   if(drawn.has(key))continue;drawn.add(key);
   if(metersBetween(building.center,other.center)>56)continue;
   const gap=closest(building.ring,other.ring);
   if(!gap.mid||gap.dist>18||gap.dist<2.4)continue;
   const point=map.project(gap.mid);
   const wall=Math.min(building.height,other.height);
   const lift=wall*zoomScale/Math.cos(gap.mid[1]*Math.PI/180)*Math.sin(pitch);
   const tight=1-gap.dist/18;
   const radius=22+tight*36;
   const gradient=ctx.createRadialGradient(point.x,point.y-lift*.12,2,point.x,point.y-lift*.55,radius);
   gradient.addColorStop(0,`rgba(255,102,0,${.42*fade*tight})`);
   gradient.addColorStop(.28,`rgba(255,102,0,${.2*fade*tight})`);
   gradient.addColorStop(1,'rgba(255,102,0,0)');
   ctx.fillStyle=gradient;
   ctx.beginPath();
   ctx.ellipse(point.x,point.y-lift*.32,radius*.55,radius*.55+lift*.7,0,0,Math.PI*2);
   ctx.fill();
  }
  let ring=building.ring;if(!ring?.length)continue;
  if(ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring=ring.slice(0,-1);
  if(ring.length<4)continue;
  const ccw=signedArea(ring)>0;
  for(let i=0;i<ring.length;i++){
   const prev=ring[(i-1+ring.length)%ring.length],curr=ring[i],next=ring[(i+1)%ring.length];
   const cross=(curr[0]-prev[0])*(next[1]-curr[1])-(curr[1]-prev[1])*(next[0]-curr[0]);
   const concave=ccw?cross<0:cross>0;
   if(!concave)continue;
   const opening=metersBetween(prev,next);
   if(opening>28||opening<4)continue;
   const point=map.project(curr);
   const lift=building.height*zoomScale/Math.cos(curr[1]*Math.PI/180)*Math.sin(pitch);
   const radius=16+(28-opening)*.7;
   const gradient=ctx.createRadialGradient(point.x,point.y-lift*.1,1,point.x,point.y-lift*.45,radius);
   gradient.addColorStop(0,`rgba(255,102,0,${.38*fade})`);
   gradient.addColorStop(.3,`rgba(255,102,0,${.16*fade})`);
   gradient.addColorStop(1,'rgba(255,102,0,0)');
   ctx.fillStyle=gradient;
   ctx.beginPath();
   ctx.ellipse(point.x,point.y-lift*.28,radius*.5,radius*.5+lift*.65,0,0,Math.PI*2);
   ctx.fill();
  }
 }
 ctx.restore();
}

export function drawWaterSheen(ctx,map,fade,time){

 if(fade<=0||map.getZoom()<12)return;
 const features=map.querySourceFeatures('terrain',{sourceLayer:'water'});
 if(!features.length)return;
 const width=ctx.canvas.clientWidth||window.innerWidth,height=ctx.canvas.clientHeight||window.innerHeight;
 const moon=(315-map.getBearing())*Math.PI/180,mx=Math.sin(moon),my=-Math.cos(moon);
 ctx.save();ctx.beginPath();
 let any=false;
 for(const feature of features){
  const polys=feature.geometry?.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiPolygon'?feature.geometry.coordinates:[];
  for(const rings of polys){
   const ring=rings?.[0];if(!ring?.length)continue;
   ring.forEach((coordinate,index)=>{const point=map.project(coordinate);if(index)ctx.lineTo(point.x,point.y);else ctx.moveTo(point.x,point.y);});
   ctx.closePath();any=true;
  }
 }
 if(!any){ctx.restore();return;}
 ctx.clip();
 const gradient=ctx.createLinearGradient(width/2-mx*width,height/2-my*height,width/2+mx*width,height/2+my*height);
 gradient.addColorStop(0,'rgba(182,236,247,0)');
 gradient.addColorStop(.46,`rgba(194,243,255,${.03*fade})`);
 gradient.addColorStop(.52,`rgba(182,236,247,${.1*fade})`);
 gradient.addColorStop(.6,`rgba(124,226,254,${.05*fade})`);
 gradient.addColorStop(1,'rgba(182,236,247,0)');
 ctx.globalCompositeOperation='screen';ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
 ctx.globalAlpha=.06*fade;ctx.fillStyle='rgba(124,226,254,.35)';
 for(let i=0;i<10;i++){
  const x=width*(.12+.76*((i*.37+time*.02)%1)),y=height*(.18+.64*((i*.19+time*.012)%1));
  ctx.beginPath();ctx.ellipse(x,y,36+i*5,7,moon,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}

let bloomCanvas,bloomCtx;
export function bloomOverlay(ctx,width,height,amount=.1){
 if(amount<=0)return;
 if(!bloomCanvas){bloomCanvas=document.createElement('canvas');bloomCtx=bloomCanvas.getContext('2d');}
 const source=ctx.canvas,bw=Math.max(1,width>>2),bh=Math.max(1,height>>2);
 if(bloomCanvas.width!==bw||bloomCanvas.height!==bh){bloomCanvas.width=bw;bloomCanvas.height=bh;}
 bloomCtx.clearRect(0,0,bw,bh);bloomCtx.drawImage(source,0,0,source.width,source.height,0,0,bw,bh);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='screen';
 ctx.filter='blur(10px)';ctx.globalAlpha=amount;ctx.drawImage(bloomCanvas,0,0,source.width,source.height);
 ctx.filter='none';ctx.restore();
}
