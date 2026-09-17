// Vertical safety-orange wash up the corners of 6m+ buildings.
// Ground footprint outline is gone — this sits on the wall.

function signedArea(ring){
 let area=0;
 for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length];
  area+=a[0]*b[1]-b[0]*a[1];
 }
 return area;
}

export function createCornerUplight(maplibre){
 const origin=maplibre.MercatorCoordinate.fromLngLat([-122.67,45.53]);
 const unit=origin.meterInMercatorCoordinateUnits();
 return {
  id:'corner-uplight',type:'custom',renderingMode:'3d',count:0,
  update(buildings){
   if(this.buildings===buildings){this.map?.triggerRepaint();return;}
   this.buildings=buildings;
   const verts=[],coarse=matchMedia('(pointer:coarse)').matches,max=coarse?420:900;
   let used=0;
   for(const building of buildings||[]){
    if(used>=max||building.height<6)continue;
    let ring=building.ring;if(!ring?.length)continue;
    if(ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring=ring.slice(0,-1);
    if(ring.length<3)continue;
    const ccw=signedArea(ring)>0;
    const glowH=Math.min(building.height*.55,16);
    const cos=Math.cos(ring[0][1]*Math.PI/180);
    const metersLng=111320*cos,metersLat=111320;
    const shift=(p,nx,ny,m)=>[p[0]+nx*m/metersLng,p[1]+ny*m/metersLat];
    const along=(p,dx,dy,m,len)=>[p[0]+dx*m/(len||1),p[1]+dy*m/(len||1)];
    const merc=(lngLat,z)=>{
     const c=maplibre.MercatorCoordinate.fromLngLat(lngLat,z);
     return [(c.x-origin.x)/unit,(c.y-origin.y)/unit,c.z/unit];
    };
    const pushQuad=(a,b,outX,outY)=>{
     const a2=shift(a,outX,outY,.45),b2=shift(b,outX,outY,.45);
     const corners=[merc(a,0),merc(b,0),merc(b2,0),merc(a2,0),merc(a,glowH),merc(b,glowH),merc(b2,glowH),merc(a2,glowH)];
     // two outer faces: wall-hugging (a-b-top) and outward (a2-b2-top)
     const faces=[[0,1,5,0,5,4],[3,2,6,3,6,7],[0,3,7,0,7,4],[1,2,6,1,6,5]];
     const h=[0,0,0,0,1,1,1,1],edge=[.15,.85,.85,.15,.15,.85,.85,.15];
     for(const face of faces)for(const idx of face){
      const p=corners[idx];
      verts.push(p[0],p[1],p[2],h[idx],edge[idx]);
     }
    };
    for(let i=0;i<ring.length;i++){
     const prev=ring[(i-1+ring.length)%ring.length],curr=ring[i],next=ring[(i+1)%ring.length];
     const d1x=curr[0]-prev[0],d1y=curr[1]-prev[1],l1=Math.hypot(d1x*metersLng,d1y*metersLat);
     const d2x=next[0]-curr[0],d2y=next[1]-curr[1],l2=Math.hypot(d2x*metersLng,d2y*metersLat);
     if(l1<4&&l2<4)continue;
     const n1x=ccw?d1y:-d1y,n1y=ccw?-d1x:d1x,n1=Math.hypot(n1x,n1y)||1;
     const n2x=ccw?d2y:-d2y,n2y=ccw?-d2x:d2x,n2=Math.hypot(n2x,n2y)||1;
     const reach=1.6;
     if(l1>=4)pushQuad(along(curr,-d1x,-d1y,reach,l1),curr,n1x/n1,n1y/n1);
     if(l2>=4)pushQuad(curr,along(curr,d2x,d2y,reach,l2),n2x/n2,n2y/n2);
    }
    used++;
   }
   this.vertices=new Float32Array(verts);this.dirty=true;this.map?.triggerRepaint();
  },
  onAdd(map,gl){
   this.map=map;this.gl=gl;
   const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
   try{
    const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
     in vec3 a_pos; in float a_h; in float a_edge;
     uniform mat4 u_matrix;
     out float v_h; out float v_edge;
     void main(){
      gl_Position=u_matrix*vec4(a_pos,1.);
      v_h=a_h;v_edge=a_edge;
     }`);
    const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
     precision highp float;
     in float v_h; in float v_edge;
     out vec4 color;
     void main(){
      float fall=pow(1.-clamp(v_h,0.,1.),1.55);
      float core=1.-smoothstep(.12,.95,abs(v_edge-.5)*2.);
      float glow=exp(-pow(abs(v_edge-.5)*2.,2.)*2.4)*.22;
      float alpha=(core*.85+glow)*fall;
      if(alpha<.012)discard;
      vec3 rgb=vec3(1.,.4,0.);
      color=vec4(rgb*alpha,alpha);
     }`);
    this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);
    gl.deleteShader(vertex);gl.deleteShader(fragment);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
    this.uMatrix=gl.getUniformLocation(this.program,'u_matrix');
    this.buffer=gl.createBuffer();this.vao=gl.createVertexArray();
    gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    const stride=20;
    const loc=gl.getAttribLocation(this.program,'a_pos');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,stride,0);
    const h=gl.getAttribLocation(this.program,'a_h');gl.enableVertexAttribArray(h);gl.vertexAttribPointer(h,1,gl.FLOAT,false,stride,12);
    const e=gl.getAttribLocation(this.program,'a_edge');gl.enableVertexAttribArray(e);gl.vertexAttribPointer(e,1,gl.FLOAT,false,stride,16);
    gl.bindVertexArray(null);
   }catch(error){
    console.warn('Corner uplight unavailable',error);
    this.program=null;
   }
  },
  render(gl,frame){
   if(!this.program)return;
   if(this.dirty&&this.vertices){gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.vertices,gl.STATIC_DRAW);this.count=this.vertices.length/5;this.dirty=false;}
   if(!this.count)return;
   const matrix=frame.defaultProjectionData.mainMatrix,local=new Float32Array(16);
   for(let row=0;row<4;row++){
    local[row]=matrix[row]*unit;local[4+row]=matrix[4+row]*unit;local[8+row]=matrix[8+row]*unit;
    local[12+row]=matrix[row]*origin.x+matrix[4+row]*origin.y+matrix[12+row];
   }
   gl.useProgram(this.program);gl.bindVertexArray(this.vao);
   gl.uniformMatrix4fv(this.uMatrix,false,local);
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
   if(this.buffer)gl.deleteBuffer(this.buffer);
   if(this.vao)gl.deleteVertexArray(this.vao);
   if(this.program)gl.deleteProgram(this.program);
   this.map=null;this.vertices=null;this.count=0;
  }
 };
}
