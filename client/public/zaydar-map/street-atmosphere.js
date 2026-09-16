const TAU=Math.PI*2;

function smoothRange(a,b,value){
 const x=Math.max(0,Math.min(1,(value-a)/(b-a)));
 return x*x*x*(x*(x*6-15)+10);
}

function hash(value){
 let h=2166136261;
 for(const character of String(value)){h^=character.charCodeAt(0);h=Math.imul(h,16777619);}
 return (h>>>0)/4294967295;
}

function offsetMeters([longitude,latitude],east,north){
 return [longitude+east/(111320*Math.cos(latitude*Math.PI/180)),latitude+north/111320];
}

function venueKey(feature){
 const [longitude,latitude]=feature.geometry.coordinates;
 return feature.properties.venueKey||feature.properties.placeId||`${longitude.toFixed(4)},${latitude.toFixed(4)}`;
}

function buildScene(features){
 const venues=new Map();
 for(const feature of features){
  const coordinates=feature?.geometry?.coordinates;
  if(!coordinates?.every(Number.isFinite))continue;
  const key=venueKey(feature),current=venues.get(key);
  if(!current||feature.properties.kind==='place')venues.set(key,feature);
 }
 const trees=[],lamps=[],mist=[],sheen=[];
 for(const [key,feature] of venues){
  const origin=feature.geometry.coordinates,color=feature.properties.color||'#FF00CC';
  const angle=hash(key)*TAU,scale=.82+hash(`${key}:scale`)*.36;
  const treeOffsets=[[-60,-32],[58,28],[-86,20],[84,-24],[12,62]];
  const lampOffsets=[[-34,-4],[34,4],[-6,44],[8,-46]];
  treeOffsets.forEach(([x,y],index)=>{
   const cos=Math.cos(angle),sin=Math.sin(angle),east=(x*cos-y*sin)*scale,north=(x*sin+y*cos)*scale;
   trees.push({coordinates:offsetMeters(origin,east,north),height:7+hash(`${key}:tree:${index}`)*5,tone:index%3});
  });
  lampOffsets.forEach(([x,y],index)=>{
   const cos=Math.cos(angle),sin=Math.sin(angle),east=x*cos-y*sin,north=x*sin+y*cos;
   lamps.push({coordinates:offsetMeters(origin,east,north),height:5.2+hash(`${key}:lamp:${index}`)*1.4,color,phase:hash(`${key}:lamp-phase:${index}`)*TAU});
  });
  mist.push({coordinates:offsetMeters(origin,Math.cos(angle)*24,Math.sin(angle)*24),phase:hash(`${key}:mist`)*TAU,color});
  const length=72+hash(`${key}:sheen`)*44;
  sheen.push({start:offsetMeters(origin,-Math.cos(angle)*length/2,-Math.sin(angle)*length/2),end:offsetMeters(origin,Math.cos(angle)*length/2,Math.sin(angle)*length/2),color});
 }
 return {trees,lamps,mist,sheen};
}

function visiblePoint(map,coordinates,padding=80){
 const point=map.project(coordinates),canvas=map.getCanvas();
 return point.x>=-padding&&point.y>=-padding&&point.x<=canvas.clientWidth+padding&&point.y<=canvas.clientHeight+padding?point:null;
}

function drawTree(ctx,map,tree,alpha,metersPerPixel,pitch){
 const base=visiblePoint(map,tree.coordinates,60);if(!base)return;
 const height=Math.max(8,tree.height/metersPerPixel*Math.max(.56,Math.sin(pitch)+.25));
 const width=Math.max(4,height*.42),top=base.y-height;
 ctx.save();ctx.globalAlpha=alpha;
 ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(base.x+2,base.y+1,width*.8,width*.18,0,0,TAU);ctx.fill();
 ctx.strokeStyle='#3a2a24';ctx.lineWidth=Math.max(1,height*.08);ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(base.x,top+height*.62);ctx.stroke();
 const palettes=[['#173f38','#246354','#2f7c64'],['#153c43','#205a5f','#2c7472'],['#20384b','#2a5364','#367080']][tree.tone];
 for(let tier=0;tier<3;tier++){
  const y=top+height*(.16+tier*.22),half=width*(.7+tier*.28);
  ctx.fillStyle=palettes[2-tier];ctx.beginPath();ctx.moveTo(base.x,y-height*.18);ctx.lineTo(base.x-half,y+height*.28);ctx.lineTo(base.x+half,y+height*.28);ctx.closePath();ctx.fill();
 }
 ctx.restore();
}

function drawLamp(ctx,map,lamp,alpha,metersPerPixel,pitch,time,reduced){
 const base=visiblePoint(map,lamp.coordinates,100);if(!base)return;
 const height=Math.max(10,lamp.height/metersPerPixel*Math.max(.62,Math.sin(pitch)+.28));
 const top=base.y-height,pulse=reduced?1:.92+.08*Math.sin(time*.9+lamp.phase);
 ctx.save();
 const pool=ctx.createRadialGradient(base.x,base.y,0,base.x,base.y,height*1.45);
 pool.addColorStop(0,`${lamp.color}28`);pool.addColorStop(.28,'rgba(255,190,112,.13)');pool.addColorStop(1,'rgba(255,190,112,0)');
 ctx.globalAlpha=alpha*pulse;ctx.fillStyle=pool;ctx.beginPath();ctx.ellipse(base.x,base.y,height*1.45,height*.28,0,0,TAU);ctx.fill();
 ctx.strokeStyle='rgba(79,101,116,.9)';ctx.lineWidth=Math.max(1,height*.055);ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(base.x,top);ctx.lineTo(base.x+height*.18,top);ctx.stroke();
 const aura=ctx.createRadialGradient(base.x+height*.18,top,0,base.x+height*.18,top,height*.55);
 aura.addColorStop(0,'rgba(255,236,187,.95)');aura.addColorStop(.15,'rgba(255,187,105,.62)');aura.addColorStop(.45,`${lamp.color}30`);aura.addColorStop(1,`${lamp.color}00`);
 ctx.fillStyle=aura;ctx.fillRect(base.x-height*.4,top-height*.58,height*1.2,height*1.16);
 ctx.fillStyle='#fff1c7';ctx.beginPath();ctx.arc(base.x+height*.18,top,Math.max(1.2,height*.055),0,TAU);ctx.fill();
 ctx.restore();
}

function drawMist(ctx,map,patch,alpha,time,reduced){
 const point=visiblePoint(map,patch.coordinates,140);if(!point)return;
 const breathe=reduced?1:.82+.18*Math.sin(time*.18+patch.phase),radius=58;
 const fog=ctx.createRadialGradient(point.x,point.y,0,point.x,point.y,radius);
 fog.addColorStop(0,'rgba(151,192,205,.12)');fog.addColorStop(.42,`${patch.color}0c`);fog.addColorStop(1,'rgba(122,170,186,0)');
 ctx.save();ctx.globalAlpha=alpha*breathe;ctx.fillStyle=fog;ctx.beginPath();ctx.ellipse(point.x,point.y,radius,radius*.18,0,0,TAU);ctx.fill();ctx.restore();
}

function drawSheen(ctx,map,item,alpha){
 const start=visiblePoint(map,item.start,100),end=visiblePoint(map,item.end,100);if(!start||!end)return;
 const gradient=ctx.createLinearGradient(start.x,start.y,end.x,end.y);
 gradient.addColorStop(0,`${item.color}00`);gradient.addColorStop(.46,`${item.color}38`);gradient.addColorStop(.62,'rgba(255,255,255,.18)');gradient.addColorStop(1,`${item.color}00`);
 ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=gradient;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.restore();
}

export function createStreetAtmosphere(map){
 let scene={trees:[],lamps:[],mist:[],sheen:[]};
 return {
  setListings(features){scene=buildScene(features||[]);},
  draw(ctx,fade,time,reduced){
   const progress=smoothRange(16.25,17.35,map.getZoom());if(progress<=0)return;
   const center=map.getCenter(),metersPerPixel=40075016.686*Math.cos(center.lat*Math.PI/180)/(512*Math.pow(2,map.getZoom())),pitch=map.getPitch()*Math.PI/180;
   const alpha=fade*progress;
   for(const item of scene.sheen)drawSheen(ctx,map,item,alpha*.75);
   for(const item of scene.mist)drawMist(ctx,map,item,alpha*.72,time,reduced);
   for(const tree of scene.trees)drawTree(ctx,map,tree,alpha,metersPerPixel,pitch);
   for(const lamp of scene.lamps)drawLamp(ctx,map,lamp,alpha,metersPerPixel,pitch,time,reduced);
  },
  dispose(){scene={trees:[],lamps:[],mist:[],sheen:[]};}
 };
}
