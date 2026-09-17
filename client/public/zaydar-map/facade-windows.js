import {downtownDistance,windowNeon} from './radix-map.js?v=20260917-days';

function hash32(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}

export function hasFacade(center){
 return (hash32((center||[]).map(value=>Number(value).toFixed(5)).join(','))%100)<70;
}

function facadeAtlas(){
 const size=128,canvas=document.createElement('canvas');
 canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#050506';ctx.fillRect(0,0,size,size);
 const cols=5,rows=8,gapX=14,gapY=10,pal=[windowNeon.violet,windowNeon.blue,windowNeon.yellow,windowNeon.cyan,windowNeon.magenta,windowNeon.green,windowNeon.orange];
 const cw=(size-gapX*(cols+1))/cols,ch=(size-gapY*(rows+1))/rows;
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  const x=gapX+c*(cw+gapX),y=gapY+r*(ch+gapY);
  ctx.globalAlpha=.95;ctx.fillStyle=pal[(r+c)%3];
  ctx.fillRect(x,y,cw,ch);
  ctx.globalAlpha=.3;ctx.fillStyle='#fff';ctx.fillRect(x,y,cw,ch*.28);
 }
 return canvas;
}

export function createFacadeWindows(maplibre){
 const origin=maplibre.MercatorCoordinate.fromLngLat([-122.67,45.53]);
 const unit=origin.meterInMercatorCoordinateUnits();
 return {
  id:'facade-windows',type:'custom',renderingMode:'3d',count:0,time:0,still:false,
  update(buildings,time,still){
   this.time=time;this.still=still;
   if(this.buildings===buildings){this.map?.triggerRepaint();return;}
   this.buildings=buildings;
   const coarse=matchMedia('(pointer:coarse)').matches,max=coarse?640:1200,candidates=[];
   for(const building of buildings||[]){
    if(building.height<3||!hasFacade(building.center))continue;
    let ring=building.ring;if(!ring?.length)continue;
    if(ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring=ring.slice(0,-1);
    if(ring.length<3)continue;
    const seed=hash32(ring[0].map(v=>v.toFixed(5)).join(','));
    candidates.push({building,ring,seed,dist:downtownDistance(building.center)});
   }
   candidates.sort((a,b)=>a.dist-b.dist||a.seed-b.seed);
   const verts=[];
   for(const {building,ring,seed} of candidates.slice(0,max)){
    const mask=seed&0xffff,floors=Math.max(2,building.height/4.6);
    for(let i=0;i<ring.length;i++){
     const a=ring[i],b=ring[(i+1)%ring.length];
     const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx*85000,dy*111320);
     if(len<6)continue;
     const nx=-dy/Math.hypot(dx,dy),ny=dx/Math.hypot(dx,dy);
     const meters=.7,cos=Math.cos(a[1]*Math.PI/180);
     const shift=p=>[p[0]+nx*meters/(111320*cos),p[1]+ny*meters/111320];
     const a2=shift(a),b2=shift(b);
     const corners=[
      maplibre.MercatorCoordinate.fromLngLat(a2,0),
      maplibre.MercatorCoordinate.fromLngLat(b2,0),
      maplibre.MercatorCoordinate.fromLngLat(b2,building.height),
      maplibre.MercatorCoordinate.fromLngLat(a2,building.height)
     ].map(p=>[(p.x-origin.x)/unit,(p.y-origin.y)/unit,p.z/unit]);
     const uScale=len/8,quad=[[0,1,2],[0,2,3]];
     const uv=[[0,0],[uScale,0],[uScale,floors],[0,floors]];
     for(const tri of quad)for(const idx of tri){
      const p=corners[idx],t=uv[idx];
      verts.push(p[0],p[1],p[2],t[0],t[1],seed%1000,mask,0);
     }
    }
   }
   this.vertices=new Float32Array(verts);this.dirty=true;this.map?.triggerRepaint();
  },
  onAdd(map,gl){
   this.map=map;this.gl=gl;
   const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
   const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
    in vec3 a_position; in vec2 a_uv; in float a_seed; in float a_mask; in float a_tone;
    uniform mat4 u_matrix;
    out vec2 v_uv; out float v_seed; out float v_mask;
    void main(){
     gl_Position=u_matrix*vec4(a_position,1.);
     v_uv=a_uv;v_seed=a_seed;v_mask=a_mask;
    }`);
   const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float;
    in vec2 v_uv; in float v_seed; in float v_mask;
    uniform sampler2D u_atlas; uniform float u_time; uniform float u_still;
    out vec4 color;
    float hash(float n){return fract(sin(n)*43758.5453);}
    void main(){
     float floorIndex=floor(v_uv.y),col=floor(v_uv.x);
     if(mod(floorIndex+col*3.,10.)>.5)discard;
     float n=hash(v_seed+floorIndex*19.1+col*7.3+v_mask*.001);
     if(n>.92)discard;
     vec2 cell=fract(v_uv);
     vec2 paneMin=vec2(.38,.34),paneMax=vec2(.62,.58);
     vec2 gap=max(paneMin-cell,cell-paneMax);
     float outside=length(max(gap,0.))+max(max(gap.x,gap.y),0.)*.15;
     float pane=1.-smoothstep(0.,.018,outside);
     float bloom=exp(-outside*outside*70.)*.05;
     float lit=max(pane,bloom);
     if(lit<.01)discard;
     vec4 atlas=texture(u_atlas,vec2(fract(v_uv.x),fract(v_uv.y)));
     float wave=mix(hash(floorIndex+u_time*.15+v_seed),.72,u_still);
     float huePick=hash(v_seed*1.7+floorIndex*5.3+col*13.1);
     vec3 hue=huePick<.14?vec3(.533,0.,1.):huePick<.28?vec3(0.,.267,1.):huePick<.42?vec3(1.,.933,0.):huePick<.57?vec3(0.,1.,1.):huePick<.71?vec3(1.,0.,.8):huePick<.85?vec3(.224,1.,.078):vec3(1.,.4,0.);
     vec3 rgb=mix(hue,atlas.rgb,.28)*(.55+.45*wave);
     float alpha=(.6+.3*wave)*pane+bloom;
     color=vec4(rgb*alpha,alpha);
    }`);
   this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);
   gl.deleteShader(vertex);gl.deleteShader(fragment);
   if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
   this.uniforms=Object.fromEntries(['u_matrix','u_atlas','u_time','u_still'].map(name=>[name,gl.getUniformLocation(this.program,name)]));
   this.buffer=gl.createBuffer();this.vao=gl.createVertexArray();
   gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
   const stride=32;
   const bind=(name,size,offset)=>{const loc=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset);};
   bind('a_position',3,0);bind('a_uv',2,12);bind('a_seed',1,20);bind('a_mask',1,24);bind('a_tone',1,28);
   const atlas=facadeAtlas();
   this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
   gl.bindVertexArray(null);
  },
  render(gl,input){
   if(this.dirty&&this.vertices){gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.vertices,gl.STATIC_DRAW);this.count=this.vertices.length/8;this.dirty=false;}
   if(!this.count)return;
   const matrix=input.defaultProjectionData.mainMatrix,local=new Float32Array(16);
   for(let row=0;row<4;row++){
    local[row]=matrix[row]*unit;local[4+row]=matrix[4+row]*unit;local[8+row]=matrix[8+row]*unit;
    local[12+row]=matrix[row]*origin.x+matrix[4+row]*origin.y+matrix[12+row];
   }
   gl.useProgram(this.program);gl.bindVertexArray(this.vao);
   gl.uniformMatrix4fv(this.uniforms.u_matrix,false,local);
   gl.uniform1f(this.uniforms.u_time,this.time);gl.uniform1f(this.uniforms.u_still,this.still?1:0);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uniforms.u_atlas,0);
   const depthMask=gl.getParameter(gl.DEPTH_WRITEMASK);gl.depthMask(false);
   const blendOn=gl.isEnabled(gl.BLEND);
   const srcRGB=gl.getParameter(gl.BLEND_SRC_RGB),dstRGB=gl.getParameter(gl.BLEND_DST_RGB);
   const srcA=gl.getParameter(gl.BLEND_SRC_ALPHA),dstA=gl.getParameter(gl.BLEND_DST_ALPHA);
   gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
   gl.drawArrays(gl.TRIANGLES,0,this.count);
   gl.blendFuncSeparate(srcRGB,dstRGB,srcA,dstA);if(!blendOn)gl.disable(gl.BLEND);
   gl.depthMask(depthMask);gl.bindVertexArray(null);
  },
  onRemove(map,gl){
   gl.deleteBuffer(this.buffer);gl.deleteVertexArray(this.vao);gl.deleteProgram(this.program);gl.deleteTexture(this.texture);
   this.map=null;this.vertices=null;this.count=0;
  }
 };
}
