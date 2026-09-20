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
 const mist=[],sheen=[];
 for(const [key,feature] of venues){
  const origin=feature.geometry.coordinates,color=feature.properties.color||'#FF00CC';
  const angle=hash(key)*TAU;
  mist.push({coordinates:offsetMeters(origin,Math.cos(angle)*24,Math.sin(angle)*24),phase:hash(`${key}:mist`)*TAU,color});
  const length=72+hash(`${key}:sheen`)*44;
  sheen.push({start:offsetMeters(origin,-Math.cos(angle)*length/2,-Math.sin(angle)*length/2),end:offsetMeters(origin,Math.cos(angle)*length/2,Math.sin(angle)*length/2),color});
 }
 return {mist,sheen};
}

function visiblePoint(map,coordinates,padding=80){
 const point=map.project(coordinates),canvas=map.getCanvas();
 return point.x>=-padding&&point.y>=-padding&&point.x<=canvas.clientWidth+padding&&point.y<=canvas.clientHeight+padding?point:null;
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
 let scene={mist:[],sheen:[]};
 return {
  setListings(features){scene=buildScene(features||[]);},
  draw(ctx,fade,time,reduced){
   const progress=smoothRange(16.25,17.35,map.getZoom());if(progress<=0)return;
   const alpha=fade*progress;
   for(const item of scene.sheen)drawSheen(ctx,map,item,alpha*.75);
   for(const item of scene.mist)drawMist(ctx,map,item,alpha*.72,time,reduced);
  },
  dispose(){scene={mist:[],sheen:[]};}
 };
}
