// Uses the projection beams' scanline and signal formula, spread across a
// geographic surface. Even-odd clipping keeps edge light out of adjacent land
// and out of polygon holes. Cached between camera changes; no flashing animation.
export function createFireHologram(){
 const surface=document.createElement('canvas'),painter=surface.getContext('2d');
 const textures=new Map();let previousKey='',previousFeatures=null;
 function texture(color){
  if(textures.has(color))return textures.get(color);
  const tile=document.createElement('canvas');tile.width=tile.height=128;
  const context=tile.getContext('2d'),pixels=context.createImageData(128,128);
  const rgb=[1,3,5].map(start=>parseInt(color.slice(start,start+2),16));
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const bands=.88+.12*Math.cos(y*Math.PI/2);
   const signal=.94+.06*Math.sin(x*1.9+y*.17)*Math.sin(y*.31);
   const i=(y*128+x)*4;pixels.data.set(rgb,i);pixels.data[i+3]=Math.round(255*.19*bands*signal);
  }
  context.putImageData(pixels,0,0);textures.set(color,tile);return tile;
 }
 return {draw(ctx,map,width,height,features){
  const center=map.getCenter(),key=[width,height,map.getZoom(),map.getPitch(),map.getBearing(),center.lng,center.lat].join(':');
  if(key!==previousKey||features!==previousFeatures){
   surface.width=width;surface.height=height;previousKey=key;previousFeatures=features;
   for(const feature of features){
    const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates:[];
    const path=new Path2D();let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const polygon of polygons)for(const ring of polygon){
     let last=null;ring.forEach((coordinate,i)=>{const p=map.project(coordinate);minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);
      if(!last){path.moveTo(p.x,p.y);last=p}else if(i===ring.length-1||Math.hypot(p.x-last.x,p.y-last.y)>1.25){path.lineTo(p.x,p.y);last=p}});path.closePath();
    }
    if(maxX<0||maxY<0||minX>width||minY>height)continue;
    const color=feature.properties.color;
    painter.save();painter.clip(path,'evenodd');
    painter.fillStyle=painter.createPattern(texture(color),'repeat');painter.fillRect(0,0,width,height);
    painter.strokeStyle=color;painter.lineJoin='round';
    // Each centered stroke is clipped first: only its inner half is visible.
    for(const [lineWidth,opacity] of [[32,.025],[22,.04],[14,.065],[8,.12],[3,.45],[1.2,.8]]){
     painter.lineWidth=lineWidth;painter.globalAlpha=opacity;painter.stroke(path);
    }
    painter.restore();
   }
  }
  ctx.drawImage(surface,0,0,width,height);
 },invalidate(){previousKey='';}};
}
