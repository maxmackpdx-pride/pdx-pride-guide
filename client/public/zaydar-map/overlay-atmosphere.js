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
 gradient.addColorStop(0,'rgba(20,144,176,0)');
 gradient.addColorStop(.46,`rgba(176,180,186,${.03*fade})`);
 gradient.addColorStop(.52,`rgba(76,195,223,${.09*fade})`);
 gradient.addColorStop(.6,`rgba(0,162,199,${.04*fade})`);
 gradient.addColorStop(1,'rgba(20,144,176,0)');
 ctx.globalCompositeOperation='screen';ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
 ctx.globalAlpha=.06*fade;ctx.fillStyle='rgba(20,144,176,.35)';
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
