import {sampleBridgeRoad} from './bridge-fit.js?v=20260921-layer-join';

export const BRIDGE_GLOW_PALETTES={
 rainbow:['#ff145c','#ff7b16','#ffe42b','#19ff79','#08d5ff','#7250ff','#ed28ff'],
 trans:['#18d8ff','#ff69bf','#fff5ff','#ff69bf','#18d8ff'],
 lesbian:['#ff3919','#ff8547','#fff0f5','#ff53b5','#f51699'],
};
// Major crossings only: Sellwood through St. Johns and north to I-5.
// Steel and Tilikum carry people/transit; the BNSF railway bridges are excluded.
export const BRIDGE_GLOW_THEMES={
 'st-johns':'rainbow',
 broadway:'rainbow',steel:'trans',burnside:'lesbian',morrison:'rainbow',
 hawthorne:'trans',marquam:'lesbian','tilikum-crossing':'rainbow',
 'ross-island':'lesbian',sellwood:'trans',fremont:'lesbian',
 interstate:'trans',
};

export const BRIDGE_GLOW_SATURATION=1.5*1.2;
export const BRIDGE_GLOW_BRIGHTNESS=1.3;
export function saturateBridgeColor(rgb,gain=BRIDGE_GLOW_SATURATION){
 // Scale HSV saturation without raising value/brightness; clamp to display gamut.
 const high=Math.max(...rgb),low=Math.min(...rgb),range=high-low;
 if(!range)return [...rgb];
 const scale=Math.min(gain,high/range);
 return rgb.map(channel=>Math.round(high+(channel-high)*scale));
}
export function bridgeGlowColor(palette,fraction){
 const stops=BRIDGE_GLOW_PALETTES[palette]||BRIDGE_GLOW_PALETTES.rainbow;
 const position=Math.max(0,Math.min(1,fraction))*(stops.length-1);
 const index=Math.min(stops.length-2,Math.floor(position)),mix=position-index;
 const a=parseInt(stops[index].slice(1),16),b=parseInt(stops[index+1].slice(1),16);
 return saturateBridgeColor([16,8,0].map(shift=>((a>>shift)&255)*(1-mix)+((b>>shift)&255)*mix));
}

/** Sample the same fitted road as the real bridge, never a screen-space guess. */
export function bridgeGlowSpans(models){
 return models.filter(model=>model.fit&&Object.hasOwn(BRIDGE_GLOW_THEMES,model.id)).map(model=>{
  const count=Math.max(8,Math.min(72,Math.ceil(model.fit.length/32)));
  const first=sampleBridgeRoad(model.fit,0).coordinate,last=sampleBridgeRoad(model.fit,1).coordinate;
  const reverse=first[0]>last[0]||(first[0]===last[0]&&first[1]>last[1]);
  return {id:model.id,palette:BRIDGE_GLOW_THEMES[model.id],step:model.fit.length/count,
   samples:Array.from({length:count+1},(_,i)=>{
    const sample=sampleBridgeRoad(model.fit,i/count);
    return {...sample,fraction:reverse?1-i/count:i/count};
   })};
 });
}

// One small atlas and one draw call for all crossings. Every corner lives in
// Mercator meters, so the map projects the water and the bridges together.
const TILE_WIDTH=256,TILE_HEIGHT=96,GUTTER=2,COLUMNS=3;
export function bridgeWaterPatch(span,project,elevation=()=>0){
 const start=span.samples.reduce((a,b)=>a.fraction<b.fraction?a:b),end=span.samples.reduce((a,b)=>a.fraction>b.fraction?a:b);
 const origin=project(start.coordinate),last=project(end.coordinate);
 const length=Math.hypot(last.x-origin.x,last.y-origin.y)||1,axis={x:(last.x-origin.x)/length,y:(last.y-origin.y)/length};
 const localPoint=p=>{const x=p.x-origin.x,y=p.y-origin.y;return {x:x*axis.x+y*axis.y,y:-x*axis.y+y*axis.x};};
 const local=coordinate=>localPoint(project(coordinate));
 const points=span.samples.map(sample=>({...local(sample.coordinate),fraction:sample.fraction}));
 const along=Math.max(18,span.step*1.2),across=32;
 const bounds={left:Math.min(...points.map(p=>p.x))-along,right:Math.max(...points.map(p=>p.x))+along,top:Math.min(...points.map(p=>p.y))-across,bottom:Math.max(...points.map(p=>p.y))+across};
 const height=elevation(span.samples[Math.floor(span.samples.length/2)].coordinate)+.1;
 const world=(x,y)=>({x:origin.x+x*axis.x-y*axis.y,y:origin.y+x*axis.y+y*axis.x,z:height});
 return {span,points,along,across,bounds,local,localPoint,length,corners:[world(bounds.left,bounds.top),world(bounds.right,bounds.top),world(bounds.left,bounds.bottom),world(bounds.right,bounds.bottom)]};
}

function collectWater(features){
 const unique=new Map();
 for(const feature of features){
  const rings=feature.geometry?.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiPolygon'?feature.geometry.coordinates:[];
  for(const polygon of rings)if(polygon[0]?.length){const key=JSON.stringify(polygon);if(!unique.has(key))unique.set(key,polygon);}
 }
 return [...unique].sort(([a],[b])=>a.localeCompare(b));
}
function pointBounds(points){
 const b={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
 for(const p of points){b.left=Math.min(b.left,p.x);b.right=Math.max(b.right,p.x);b.top=Math.min(b.top,p.y);b.bottom=Math.max(b.bottom,p.y);}
 return b;
}
function overlaps(a,b){return a.right>=b.left&&a.left<=b.right&&a.bottom>=b.top&&a.top<=b.bottom;}
function waterRings(projected,patch){
 const bounds=pointBounds(patch.corners),polygons=[];
 for(const polygon of projected){
  if(!overlaps(polygon.bounds,bounds))continue;
  const rings=polygon.rings.map(ring=>ring.map(patch.localPoint));
  if(overlaps(pointBounds(rings[0]),patch.bounds))polygons.push({key:polygon.key,rings});
 }
 return polygons;
}

function paintWaterPatch(canvas,mask,patch,polygons){
 canvas.width=mask.width=TILE_WIDTH;canvas.height=mask.height=TILE_HEIGHT;
 const ctx=canvas.getContext('2d'),water=mask.getContext('2d'),b=patch.bounds;
 const sx=TILE_WIDTH/(b.right-b.left),sy=TILE_HEIGHT/(b.bottom-b.top);
 const pixel=p=>({x:(p.x-b.left)*sx,y:(p.y-b.top)*sy});
 for(const polygon of polygons){
  water.beginPath();
  for(const ring of polygon.rings){ring.forEach((p,i)=>{const q=pixel(p);if(i)water.lineTo(q.x,q.y);else water.moveTo(q.x,q.y);});water.closePath();}
  water.fillStyle='#fff';water.fill('evenodd');
 }
 // A white alpha mask creates one continuous colored reflection without
 // neighboring colored stamps washing each other toward white.
 for(const point of patch.points){
  const p=pixel(point);ctx.save();ctx.translate(p.x,p.y);ctx.scale(patch.along*sx,patch.across*sy);
  const feather=ctx.createRadialGradient(0,0,0,0,0,1);
  feather.addColorStop(0,'rgba(255,255,255,.28)');feather.addColorStop(.25,'rgba(255,255,255,.22)');
  feather.addColorStop(.6,'rgba(255,255,255,.065)');feather.addColorStop(1,'rgba(255,255,255,0)');
  ctx.globalAlpha=Math.sin(Math.PI*point.fraction)**.4;ctx.fillStyle=feather;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
 const color=ctx.createLinearGradient(-b.left*sx,0,(patch.length-b.left)*sx,0);
 for(let i=0;i<=96;i++)color.addColorStop(i/96,`rgb(${bridgeGlowColor(patch.span.palette,i/96).join(',')})`);
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,TILE_WIDTH,TILE_HEIGHT);
 ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-over';
}

export function createBridgeWaterLayer(maplibre,elevation=()=>0){
 const origin=maplibre.MercatorCoordinate.fromLngLat([-122.67,45.53]),unit=origin.meterInMercatorCoordinateUnits();
 const project=coordinate=>{const p=maplibre.MercatorCoordinate.fromLngLat(coordinate);return {x:(p.x-origin.x)/unit,y:(p.y-origin.y)/unit};};
 const waterHeight=coordinate=>{const p=maplibre.MercatorCoordinate.fromLngLat(coordinate);return elevation(coordinate)*p.meterInMercatorCoordinateUnits()/unit;};
 const atlas=document.createElement('canvas'),tile=document.createElement('canvas'),mask=document.createElement('canvas');
 const cache=new Map(),localMatrix=new Float32Array(16);
 let waterSignature='',projectedWater=[],geometrySignature='';
 return {
  id:'bridge-water-reflections',type:'custom',renderingMode:'3d',count:0,signature:'',dirty:false,
  update(spans,waterFeatures){
   const collected=collectWater(waterFeatures),nextWaterSignature=collected.map(([key])=>key).join('|');
   const patches=spans.map(span=>bridgeWaterPatch(span,project,waterHeight));
   const nextGeometrySignature=JSON.stringify(patches.map(patch=>[patch.span.id,patch.span.palette,patch.corners,patch.points]));
   if(nextWaterSignature===waterSignature&&nextGeometrySignature===geometrySignature)return;
   geometrySignature=nextGeometrySignature;
   // Project each unique water polygon once per source change, not once per
   // bridge or camera update. Stable views do no masking or texture uploads.
   if(nextWaterSignature!==waterSignature){
    waterSignature=nextWaterSignature;
    projectedWater=collected.map(([key,polygon])=>{const rings=polygon.map(ring=>ring.map(project));return {key,rings,bounds:pointBounds(rings[0])};});
   }
   const entries=patches.map(patch=>{const polygons=waterRings(projectedWater,patch);return {patch,polygons,key:JSON.stringify([patch.span.palette,patch.corners,patch.points,polygons.map(p=>p.key)])};});
   const signature=entries.map(entry=>entry.key).join('|');if(signature===this.signature)return;
   this.signature=signature;
   atlas.width=COLUMNS*(TILE_WIDTH+2*GUTTER);atlas.height=Math.max(1,Math.ceil(entries.length/COLUMNS))*(TILE_HEIGHT+2*GUTTER);
   const ctx=atlas.getContext('2d'),vertices=[],active=new Set();
   entries.forEach(({patch,polygons,key},index)=>{
    active.add(patch.span.id);let cached=cache.get(patch.span.id);
    if(cached?.key!==key){
     paintWaterPatch(tile,mask,patch,polygons);
     const image=cached?.image??document.createElement('canvas');image.width=TILE_WIDTH;image.height=TILE_HEIGHT;image.getContext('2d').drawImage(tile,0,0);
     cached={key,image};cache.set(patch.span.id,cached);
    }
    const x=(index%COLUMNS)*(TILE_WIDTH+2*GUTTER)+GUTTER,y=Math.floor(index/COLUMNS)*(TILE_HEIGHT+2*GUTTER)+GUTTER;
    ctx.drawImage(cached.image,x,y);
    const uv=[[x/atlas.width,y/atlas.height],[(x+TILE_WIDTH)/atlas.width,y/atlas.height],[x/atlas.width,(y+TILE_HEIGHT)/atlas.height],[(x+TILE_WIDTH)/atlas.width,(y+TILE_HEIGHT)/atlas.height]];
    for(const i of [0,1,2,2,1,3]){const p=patch.corners[i];vertices.push(p.x,p.y,p.z,...uv[i]);}
   });
   for(const [id,cached] of cache)if(!active.has(id)){cached.image.width=cached.image.height=1;cache.delete(id);}
   this.vertices=new Float32Array(vertices);this.dirty=true;this.map?.triggerRepaint();
  },
  onAdd(map,gl){
   this.map=map;
   const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
   const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
    in vec3 a_position;in vec2 a_uv;uniform mat4 u_matrix;out vec2 v_uv;
    void main(){gl_Position=u_matrix*vec4(a_position,1.);v_uv=a_uv;}`);
   const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float;in vec2 v_uv;uniform sampler2D u_glow;out vec4 color;
    void main(){vec4 glow=texture(u_glow,v_uv);float alpha=glow.a*.52; if(alpha<.001)discard;color=vec4(glow.rgb*alpha*${BRIDGE_GLOW_BRIGHTNESS.toFixed(2)},alpha);}`);
   this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);gl.deleteShader(vertex);gl.deleteShader(fragment);
   if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
   this.matrix=gl.getUniformLocation(this.program,'u_matrix');this.sampler=gl.getUniformLocation(this.program,'u_glow');
   this.buffer=gl.createBuffer();this.vao=gl.createVertexArray();this.texture=gl.createTexture();
   gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
   for(const [name,size,offset] of [['a_position',3,0],['a_uv',2,12]]){const attribute=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,size,gl.FLOAT,false,20,offset);}
   gl.bindVertexArray(null);this.dirty=!!this.vertices;
  },
  render(gl,input){
   if(!this.vertices?.length&&!this.count)return;
   const activeTexture=gl.getParameter(gl.ACTIVE_TEXTURE);gl.activeTexture(gl.TEXTURE0);const boundTexture=gl.getParameter(gl.TEXTURE_BINDING_2D);gl.bindTexture(gl.TEXTURE_2D,this.texture);
   if(this.dirty){
    gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.vertices,gl.STATIC_DRAW);this.count=this.vertices.length/5;
    const premultiply=gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL),flip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,premultiply);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);this.dirty=false;
   }
   const matrix=input.defaultProjectionData.mainMatrix,local=localMatrix;
   for(let row=0;row<4;row++){local[row]=matrix[row]*unit;local[4+row]=matrix[4+row]*unit;local[8+row]=matrix[8+row]*unit;local[12+row]=matrix[row]*origin.x+matrix[4+row]*origin.y+matrix[12+row];}
   gl.useProgram(this.program);gl.bindVertexArray(this.vao);gl.uniformMatrix4fv(this.matrix,false,local);gl.uniform1i(this.sampler,0);
   const depth=gl.getParameter(gl.DEPTH_WRITEMASK),cull=gl.isEnabled(gl.CULL_FACE);
   // Water plane only: no upward curtain, billboard, or depth-writing overlay.
   gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.drawArrays(gl.TRIANGLES,0,this.count);
   gl.depthMask(depth);if(cull)gl.enable(gl.CULL_FACE);gl.bindVertexArray(null);
   gl.bindTexture(gl.TEXTURE_2D,boundTexture);gl.activeTexture(activeTexture);
  },
  onRemove(map,gl){
   gl.deleteBuffer(this.buffer);gl.deleteVertexArray(this.vao);gl.deleteTexture(this.texture);gl.deleteProgram(this.program);
   for(const canvas of [atlas,tile,mask,...[...cache.values()].map(v=>v.image)])canvas.width=canvas.height=1;
   cache.clear();projectedWater=[];waterSignature='';geometrySignature='';this.vertices=null;this.count=0;this.map=null;this.signature='';
  },
 };
}
