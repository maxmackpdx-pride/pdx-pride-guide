// File-based browsers can use the self-contained preview. For application
// integration serve this module with the adjacent shaders and textures.
export const rooms = ['placez','eventz','scenez','outzide'];
const focalX = {placez:.5,eventz:.52,scenez:.415,outzide:.506};

export function roomArtURL(room,base=new URL('./',import.meta.url)) {
  const file=room==='placez'?'placez-seven-lights-uhd.webp':room+'.jpg';
  return new URL('textures/'+file,base).href;
}

export async function loadRoomAssets(base = new URL('./', import.meta.url), selected = rooms) {
  const read = async path => {
    const response = await fetch(new URL(path, base));
    if (!response.ok) throw Error('Could not load '+path);
    return response.text();
  };
  const [vertex, common, fragments] = await Promise.all([
    read('shaders/surface.vert'), read('shaders/common.glsl'),
    Promise.all(selected.map(async key => [key, await read('shaders/'+key+'.frag'+(key==='placez'?'?v=20261120-seven-lights-1':''))]))
  ]);
  const url = path => new URL(path,base).href;
  return { vertex, common, fragments:Object.fromEntries(fragments),
    textures:Object.fromEntries(selected.map(key=>[key,roomArtURL(key,base)])),
    materials:Object.fromEntries(selected.filter(key=>key==='eventz'||key==='outzide').map(key=>[key,url('textures/'+key+'-material.webp')])),
    light:url('textures/placez-light.webp') };
}

export class RoomRenderer {
  constructor(canvas, assets) {
    this.canvas=canvas;
    this.assets=assets;
    this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
    if (!this.gl) throw Error('WebGL unavailable');
    this.programs={};
    this.textures={};
  }
  async prepare() {
    const gl=this.gl;
    this.quad=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),gl.STATIC_DRAW);
    const compile=(type,source)=>{
      const shader=gl.createShader(type);
      gl.shaderSource(shader,source);
      gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const vertex=compile(gl.VERTEX_SHADER,this.assets.vertex);
    for(const [room,body] of Object.entries(this.assets.fragments)) {
      const pixel=compile(gl.FRAGMENT_SHADER,this.assets.common+'\n'+body);
      const program=gl.createProgram();
      gl.attachShader(program,vertex); gl.attachShader(program,pixel);
      gl.bindAttribLocation(program,0,'position'); gl.linkProgram(program);
      gl.deleteShader(pixel);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
      const u={};
      for(const name of ['art','relief','material','uvScale','focalPoint','phase','bands','nightSurvey'])
        u[name]=gl.getUniformLocation(program,name);
      this.programs[room]={program,u};
    }
    gl.deleteShader(vertex);
    const sources={...this.assets.textures};
    for(const [key,path] of Object.entries(this.assets.materials)) sources[key+'Material']=path;
    if(Object.values(this.programs).some(({u})=>u.relief)) sources.relief=this.assets.light;
    await Promise.all(Object.entries(sources).map(async ([key,url])=>{
      const img=new Image();
      img.src=url; await img.decode();
      if(key==='placez'&&Math.max(img.naturalWidth,img.naturalHeight)>gl.getParameter(gl.MAX_TEXTURE_SIZE))
        throw Error('UHD texture exceeds WebGL texture limit');
      const target=gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D,target);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
      for(const pname of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])
        gl.texParameteri(gl.TEXTURE_2D,pname,gl.CLAMP_TO_EDGE);
      for(const pname of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])
        gl.texParameteri(gl.TEXTURE_2D,pname,gl.LINEAR);
      this.textures[key]=target;
    }));
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  }
  // rect is in drawing-buffer pixels from the top left. Time is in seconds.
  draw(room,seconds,rect={x:0,y:0,w:this.canvas.width,h:this.canvas.height},options={}) {
    const gl=this.gl, {u,program}=this.programs[room];
    const {x,y,w,h}=rect;
    if(w<1||h<1) return;
    gl.viewport(x,this.canvas.height-y-h,w,h);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this.textures[room]); gl.uniform1i(u.art,0);
    if(u.relief){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.textures.relief);gl.uniform1i(u.relief,1);}
    if(u.material){gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.textures[room+'Material']);gl.uniform1i(u.material,2);}
    const aspect=w/h, scaleX=Math.min(1,aspect/(16/9)), scaleY=Math.min(1,(16/9)/aspect);
    gl.uniform2f(u.uvScale,scaleX,scaleY);
    gl.uniform2f(u.focalPoint,.5+(focalX[room]-.5)*(1-scaleX),.5);
    gl.uniform1f(u.phase,(seconds%16)*Math.PI/8);
    gl.uniform3fv(u.bands,options.bands||[0,0,0]);
    gl.uniform1f(u.nightSurvey,options.nightSurvey??1);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  dispose() {
    const gl=this.gl;
    Object.values(this.textures).forEach(t=>gl.deleteTexture(t));
    Object.values(this.programs).forEach(p=>gl.deleteProgram(p.program));
    gl.deleteBuffer(this.quad);
  }
}
