// Rooftop and facade lights share the map's camera and depth buffer. Time changes light only.
export function createCitySparkles(maplibre,id='city-sparkles') {
  const origin=maplibre.MercatorCoordinate.fromLngLat([-122.67,45.53]);
  const unit=origin.meterInMercatorCoordinateUnits();
  return {
    id,type:'custom',renderingMode:'3d',count:0,time:0,still:false,
    update(points,time,still) {
      const changed=this.time!==time||this.still!==still||this.points!==points;
      this.time=time;this.still=still;
      if(this.points!==points) {
        this.points=points;
        this.vertices=new Float32Array(points.flatMap(point=>{
          const p=maplibre.MercatorCoordinate.fromLngLat(point.coordinates,point.height+.8);
          return [(p.x-origin.x)/unit,(p.y-origin.y)/unit,p.z/unit,point.phase,point.rate,point.star?1:0,point.tone||0];
        }));
      }
      if(changed)this.map?.triggerRepaint();
    },
    onAdd(map,gl) {
      this.map=map;
      const compile=(type,source)=>{
        const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
        in vec3 a_position; in vec3 a_light; in float a_tone;
        uniform mat4 u_matrix; uniform float u_time; uniform float u_dpr; uniform float u_still;
        out float v_wave; out float v_star; out float v_tone;
        float noise(float seed){return fract(sin(seed*127.1)*43758.5453);}
        void main(){
          gl_Position=u_matrix*vec4(a_position,1.);
          v_tone=a_tone;
          // Off-camera roofs skip light animation; depth testing handles occlusion.
          if(gl_Position.w<=0.||abs(gl_Position.x)>gl_Position.w||abs(gl_Position.y)>gl_Position.w||abs(gl_Position.z)>gl_Position.w){
            v_wave=0.;v_star=0.;gl_PointSize=1.;return;
          }
          // Each light has a distinct clock, intensity and randomly skipped beats.
          float clock=u_time*a_light.y*.29+a_light.x,beat=floor(clock);
          float peak=.4+.6*noise(beat+a_light.x*3.7);
          float lit=step(.18,noise(beat*1.93+a_light.x*7.31));
          float twinkle=pow(max(0.,sin(fract(clock)*3.14159265)),4.)*peak*lit;
          v_wave=mix(twinkle,.38,u_still);v_star=a_light.z;
          gl_PointSize=(3.6+v_wave*6.)*u_dpr;
        }`);
      const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
        precision highp float; in float v_wave; in float v_star; in float v_tone; out vec4 color;
        void main(){
          vec2 p=gl_PointCoord*2.-1.;float r=length(p);
          if(r>1.)discard;
          float halo=exp(-r*r*7.)*.32;
          float core=1.-smoothstep(.02,.12,r);
          float rays=(exp(-abs(p.x)*60.)+exp(-abs(p.y)*60.))*(1.-smoothstep(.15,.95,r));
          float alpha=clamp((halo+core+rays*v_star*smoothstep(.25,.8,v_wave)*.62)*(.12+.88*v_wave),0.,1.);
          if(alpha<.008)discard;
          vec3 hue=v_tone<0.5?vec3(1.,.14,.82):v_tone<1.5?vec3(.38,.92,1.):vec3(1.,.56,.16);
          color=vec4(mix(hue,vec3(1.),core*.55)*alpha,alpha);
        }`);
      this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);
      gl.deleteShader(vertex);gl.deleteShader(fragment);
      if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
      this.uniforms=Object.fromEntries(['u_matrix','u_time','u_dpr','u_still'].map(name=>[name,gl.getUniformLocation(this.program,name)]));
      this.buffer=gl.createBuffer();this.vao=gl.createVertexArray();
      gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
      const stride=28;
      const position=gl.getAttribLocation(this.program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,stride,0);
      const light=gl.getAttribLocation(this.program,'a_light');gl.enableVertexAttribArray(light);gl.vertexAttribPointer(light,3,gl.FLOAT,false,stride,12);
      const tone=gl.getAttribLocation(this.program,'a_tone');gl.enableVertexAttribArray(tone);gl.vertexAttribPointer(tone,1,gl.FLOAT,false,stride,24);
      gl.bindVertexArray(null);
    },
    render(gl,input) {
      if(this.vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.vertices,gl.STATIC_DRAW);
        this.count=this.vertices.length/7;this.vertices=null;
      }
      if(!this.count)return;
      const matrix=input.defaultProjectionData.mainMatrix,local=new Float32Array(16);
      for(let row=0;row<4;row++) {
        local[row]=matrix[row]*unit;local[4+row]=matrix[4+row]*unit;local[8+row]=matrix[8+row]*unit;
        local[12+row]=matrix[row]*origin.x+matrix[4+row]*origin.y+matrix[12+row];
      }
      gl.useProgram(this.program);gl.bindVertexArray(this.vao);
      gl.uniformMatrix4fv(this.uniforms.u_matrix,false,local);gl.uniform1f(this.uniforms.u_time,this.time);
      gl.uniform1f(this.uniforms.u_dpr,gl.drawingBufferWidth/this.map.getCanvas().clientWidth);gl.uniform1f(this.uniforms.u_still,this.still?1:0);
      const depthMask=gl.getParameter(gl.DEPTH_WRITEMASK);gl.depthMask(false);
      const blendOn=gl.isEnabled(gl.BLEND);
      const srcRGB=gl.getParameter(gl.BLEND_SRC_RGB),dstRGB=gl.getParameter(gl.BLEND_DST_RGB);
      const srcA=gl.getParameter(gl.BLEND_SRC_ALPHA),dstA=gl.getParameter(gl.BLEND_DST_ALPHA);
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
      gl.drawArrays(gl.POINTS,0,this.count);
      gl.blendFuncSeparate(srcRGB,dstRGB,srcA,dstA);if(!blendOn)gl.disable(gl.BLEND);
      gl.depthMask(depthMask);gl.bindVertexArray(null);
    },
    onRemove(map,gl) {
      gl.deleteBuffer(this.buffer);gl.deleteVertexArray(this.vao);gl.deleteProgram(this.program);
      this.map=null;this.points=null;this.vertices=null;this.count=0;
    }
  };
}
