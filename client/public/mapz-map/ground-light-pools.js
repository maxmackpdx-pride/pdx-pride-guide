// Physical ground patches share the map camera. Their size is in meters, so
// zooming out makes them smaller instead of spreading haze over whole blocks.
export function groundLightMesh(pools,project,groundHeight=()=>0) {
  const vertices=[];
  const corners=[[-1,-1],[1,-1],[-1,1],[-1,1],[1,-1],[1,1]];
  for(const pool of pools){
    const {x,y,unitsPerMeter=1}=project(pool.coordinates);
    const radius=pool.radiusMeters*unitsPerMeter,c=Math.cos(pool.angle),s=Math.sin(pool.angle);
    for(const [u,v] of corners){
      const px=x+(u*c-v*s)*radius,py=y+(u*s+v*c)*radius;
      vertices.push(px,py,groundHeight(px,py)+.06*unitsPerMeter,u,v);
    }
  }
  return new Float32Array(vertices);
}

export function createGroundLightPools(maplibre,elevation=()=>0) {
  const origin=maplibre.MercatorCoordinate.fromLngLat([-122.67,45.53]);
  const unit=origin.meterInMercatorCoordinateUnits();
  const project=coordinates=>{
    const p=maplibre.MercatorCoordinate.fromLngLat(coordinates);
    return {x:(p.x-origin.x)/unit,y:(p.y-origin.y)/unit,unitsPerMeter:p.meterInMercatorCoordinateUnits()/unit};
  };
  const groundHeight=(x,y)=>{
    const coordinate=new maplibre.MercatorCoordinate(origin.x+x*unit,origin.y+y*unit).toLngLat();
    return elevation(coordinate)*maplibre.MercatorCoordinate.fromLngLat(coordinate).meterInMercatorCoordinateUnits()/unit;
  };
  return {
    id:'intersection-ground-lights',type:'custom',renderingMode:'3d',count:0,signature:'',
    invalidate(){this.signature='';},
    update(pools){
      const signature=JSON.stringify(pools.map(({key,radiusMeters,angle})=>[key,radiusMeters,angle]));
      if(signature===this.signature)return;
      this.signature=signature;this.vertices=groundLightMesh(pools,project,groundHeight);this.map?.triggerRepaint();
    },
    onAdd(map,gl){
      this.map=map;
      const compile=(type,source)=>{
        const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
        in vec3 a_position; in vec2 a_uv;
        uniform mat4 u_matrix; out vec2 v_uv;
        void main(){gl_Position=u_matrix*vec4(a_position,1.);v_uv=a_uv;}`);
      const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
        precision highp float; in vec2 v_uv; out vec4 color;
        void main(){
          float r=length(v_uv);
          if(r>=1.)discard;
          float falloff=1.-smoothstep(.08,1.,r);
          float alpha=.18*falloff*falloff;
          vec3 magenta=vec3(.64,.36,.53),rose=vec3(.72,.53,.47),gold=vec3(.78,.71,.49);
          float t=smoothstep(-.75,.75,v_uv.x);
          vec3 tint=mix(magenta,rose,smoothstep(0.,.5,t));
          tint=mix(tint,gold,smoothstep(.5,1.,t));
          color=vec4(tint*alpha,alpha);
        }`);
      this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);
      gl.deleteShader(vertex);gl.deleteShader(fragment);
      if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
      this.matrix=gl.getUniformLocation(this.program,'u_matrix');this.buffer=gl.createBuffer();this.vao=gl.createVertexArray();
      gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
      for(const [name,size,offset] of [['a_position',3,0],['a_uv',2,12]]){
        const attribute=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,size,gl.FLOAT,false,20,offset);
      }
      gl.bindVertexArray(null);
    },
    render(gl,input){
      if(this.vertices){
        gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.vertices,gl.STATIC_DRAW);
        this.count=this.vertices.length/5;this.vertices=null;
      }
      if(!this.count)return;
      const matrix=input.defaultProjectionData.mainMatrix,local=new Float32Array(16);
      for(let row=0;row<4;row++){
        local[row]=matrix[row]*unit;local[4+row]=matrix[4+row]*unit;local[8+row]=matrix[8+row]*unit;
        local[12+row]=matrix[row]*origin.x+matrix[4+row]*origin.y+matrix[12+row];
      }
      gl.useProgram(this.program);gl.bindVertexArray(this.vao);gl.uniformMatrix4fv(this.matrix,false,local);
      const depthMask=gl.getParameter(gl.DEPTH_WRITEMASK),cull=gl.isEnabled(gl.CULL_FACE);
      // Light colors the ground but must never hide geometry with a depth write.
      gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.drawArrays(gl.TRIANGLES,0,this.count);
      gl.depthMask(depthMask);if(cull)gl.enable(gl.CULL_FACE);gl.bindVertexArray(null);
    },
    onRemove(map,gl){
      gl.deleteBuffer(this.buffer);gl.deleteVertexArray(this.vao);gl.deleteProgram(this.program);
      this.map=null;this.vertices=null;this.count=0;this.signature='';
    },
  };
}
