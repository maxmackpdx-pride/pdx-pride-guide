// Roof-edge glow matching the ground building-uplight stroke.

export function createRoofOutline(maplibre){
 const origin=maplibre.MercatorCoordinate.fromLngLat([-122.67,45.53]);
 const unit=origin.meterInMercatorCoordinateUnits();
 return {
  id:'roof-outline',type:'custom',renderingMode:'3d',count:0,
  update(buildings){
   if(this.buildings===buildings){this.map?.triggerRepaint();return;}
   this.buildings=buildings;
   const coarse=matchMedia('(pointer:coarse)').matches,max=coarse?800:1600;
   const verts=[],half=1.6;
   let used=0;
   for(const building of buildings||[]){
    if(used>=max)break;
    let ring=building.ring;if(!ring?.length)continue;
    if(ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring=ring.slice(0,-1);
    if(ring.length<3)continue;
    const height=Math.max(building.height||0,3);
    for(let i=0;i<ring.length;i++){
     const a=ring[i],b=ring[(i+1)%ring.length];
     const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
     if(len<1e-8)continue;
     const nx=-dy/len,ny=dx/len,cos=Math.cos(a[1]*Math.PI/180);
     const shift=(p,s)=>[p[0]+nx*s/(111320*cos),p[1]+ny*s/111320];
     const corners=[shift(a,-half),shift(b,-half),shift(b,half),shift(a,half)].map(p=>{
      const m=maplibre.MercatorCoordinate.fromLngLat(p,height);
      return [(m.x-origin.x)/unit,(m.y-origin.y)/unit,m.z/unit];
     });
     const across=[-1,-1,1,1];
     for(const tri of [[0,1,2],[0,2,3]])for(const idx of tri){
      const p=corners[idx];verts.push(p[0],p[1],p[2],across[idx]);
     }
    }
    used++;
   }
   this.vertices=new Float32Array(verts);this.dirty=true;this.map?.triggerRepaint();
  },
  onAdd(map,gl){
   this.map=map;this.gl=gl;
   try{
    const compile=(type,source)=>{
     const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
     if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
     return shader;
    };
    const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
     in vec3 a_position; in float a_across;
     uniform mat4 u_matrix;
     out float v_across;
     void main(){
      gl_Position=u_matrix*vec4(a_position,1.);
      v_across=a_across;
     }`);
    const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
     precision highp float;
     in float v_across;
     out vec4 color;
     void main(){
      float glow=exp(-v_across*v_across*2.4);
      float alpha=glow*.32;
      color=vec4(vec3(0.,1.,1.)*alpha,alpha);
     }`);
    this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);
    gl.deleteShader(vertex);gl.deleteShader(fragment);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
    this.uMatrix=gl.getUniformLocation(this.program,'u_matrix');
    this.buffer=gl.createBuffer();this.vao=gl.createVertexArray();
    gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    const pos=gl.getAttribLocation(this.program,'a_position');
    const across=gl.getAttribLocation(this.program,'a_across');
    gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,16,0);
    gl.enableVertexAttribArray(across);gl.vertexAttribPointer(across,1,gl.FLOAT,false,16,12);
    gl.bindVertexArray(null);
   }catch(error){
    console.error('roof-outline',error);this.program=null;
   }
  },
  render(gl,input){
   if(!this.program)return;
   if(this.dirty&&this.vertices){gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.vertices,gl.STATIC_DRAW);this.count=this.vertices.length/4;this.dirty=false;}
   if(!this.count)return;
   const matrix=input.defaultProjectionData.mainMatrix,local=new Float32Array(16);
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
