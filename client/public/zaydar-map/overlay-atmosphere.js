function addRings(ctx,map,features,classAllow){
 let any=false;
 for(const feature of features){
  if(classAllow&&!classAllow.has(feature.properties?.class))continue;
  const polys=feature.geometry?.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiPolygon'?feature.geometry.coordinates:[];
  for(const rings of polys){
   const ring=rings?.[0];if(!ring?.length)continue;
   ring.forEach((coordinate,index)=>{const point=map.project(coordinate);if(index)ctx.lineTo(point.x,point.y);else ctx.moveTo(point.x,point.y);});
   ctx.closePath();any=true;
  }
 }
 return any;
}

function moonGloss(ctx,width,height,fade,time,bearing,tint,hot){
 const moon=(315-bearing)*Math.PI/180,mx=Math.sin(moon),my=-Math.cos(moon);
 const gradient=ctx.createLinearGradient(width/2-mx*width,height/2-my*height,width/2+mx*width,height/2+my*height);
 gradient.addColorStop(0,'rgba(255,255,255,0)');
 gradient.addColorStop(.478,'rgba(255,255,255,0)');
 gradient.addColorStop(.498,`rgba(${hot},${.22*fade})`);
 gradient.addColorStop(.505,`rgba(255,255,255,${.34*fade})`);
 gradient.addColorStop(.512,`rgba(${hot},${.16*fade})`);
 gradient.addColorStop(.535,`rgba(${tint},${.04*fade})`);
 gradient.addColorStop(.58,'rgba(255,255,255,0)');
 gradient.addColorStop(1,'rgba(255,255,255,0)');
 ctx.globalCompositeOperation='screen';
 ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
 ctx.globalAlpha=.07*fade;ctx.fillStyle=`rgba(${hot},.55)`;
 for(let i=0;i<6;i++){
  const x=width*(.18+.64*((i*.41+time*.015)%1)),y=height*(.22+.56*((i*.23+time*.01)%1));
  ctx.beginPath();ctx.ellipse(x,y,18+i*3,2.4,moon,0,Math.PI*2);ctx.fill();
 }
}

export function drawWaterSheen(ctx,map,fade,time){
 if(fade<=0||map.getZoom()<12)return;
 const features=map.querySourceFeatures('terrain',{sourceLayer:'water'});
 if(!features.length)return;
 const width=ctx.canvas.clientWidth||window.innerWidth,height=ctx.canvas.clientHeight||window.innerHeight;
 ctx.save();ctx.beginPath();
 if(!addRings(ctx,map,features)){ctx.restore();return;}
 ctx.clip();
 moonGloss(ctx,width,height,fade,time,map.getBearing(),'182,236,247','194,243,255');
 ctx.restore();
}

export function drawGrassSheen(ctx,map,fade,time){
 if(fade<=0||map.getZoom()<12)return;
 const landuse=map.querySourceFeatures('terrain',{sourceLayer:'landuse'});
 const cover=map.querySourceFeatures('terrain',{sourceLayer:'landcover'});
 const width=ctx.canvas.clientWidth||window.innerWidth,height=ctx.canvas.clientHeight||window.innerHeight;
 ctx.save();ctx.beginPath();
 const any=addRings(ctx,map,landuse,new Set(['park','recreation_ground','cemetery','grass']))||addRings(ctx,map,cover,new Set(['grass']));
 if(!any){ctx.restore();return;}
 ctx.clip();
 moonGloss(ctx,width,height,fade*.85,time,map.getBearing(),'180,255,90','230,255,210');
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
