// File-based browsers can use the self-contained preview. For application
// integration serve this module with the adjacent shaders and textures.
export const rooms = ['placez','eventz','scenez','outzide'];
const focalX = {placez:.5,eventz:.52,scenez:.415,outzide:.506};

export function roomArtURL(room,base=new URL('./',import.meta.url)) {
  const file=room==='placez'?'placez-seven-lights-uhd.webp':room+'-uhd.webp';
  return new URL('textures/'+file,base).href;
}

// Preserve the cover framing of the full CSS band while drawing only its visible
// top slice. At the same CSS y each shader samples the same source coordinate.
export function roomUV(room,aspect,visibleFraction=1) {
  const scaleX=Math.min(1,aspect/(16/9)), fullY=Math.min(1,(16/9)/aspect);
  return { scaleX,scaleY:fullY*visibleFraction,
    focalU:.5+(focalX[room]-.5)*(1-scaleX),
    focalV:.5-.5*fullY*(1-visibleFraction) };
}

export function roomCanvasMetrics(w,h,dpr,limits,isPhone,detail=1,fullHeight=h) {
  // Bound fragment work as well as each axis. Retina iPhones can use up to
  // native DPR for narrow surfaces without drawing the rest of a tall band.
  const pixelBudget=isPhone?2_250_000:3_200_000;
  const [maxW,maxH]=limits;
  const budgetRatio=Math.sqrt(pixelBudget/(w*h));
  const target=Math.min(dpr||1,isPhone?3:2,budgetRatio);
  const legacy=Math.min(dpr||1,2,2048/Math.max(w,fullHeight),target);
  const ratio=Math.min(Math.max(legacy,target*detail),maxW/w,maxH/h);
  return [Math.max(1,Math.floor(w*ratio)),Math.max(1,Math.floor(h*ratio))];
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
    eventzAtlasHD:url('textures/eventz-material-hd.webp'),
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
    const maxTexture=gl.getParameter(gl.MAX_TEXTURE_SIZE);
    // EventZ renders from the plate atlas alone; its still image is only a fallback.
    const sources=Object.fromEntries(Object.entries(this.assets.textures).filter(([room])=>this.programs[room]?.u.art));
    for(const [key,path] of Object.entries(this.assets.materials)) {
      const hd=key==='eventz'&&maxTexture>=3936?this.assets.eventzAtlasHD:null;
      sources[key+'Material']={primary:hd||path,fallback:hd?path:null};
    }
    if(Object.values(this.programs).some(({u})=>u.relief)) sources.relief=this.assets.light;
    const decode=async url=>{
      const image=new Image();
      image.src=url; await image.decode();
      return image;
    };
    await Promise.all(Object.entries(sources).map(async ([key,source])=>{
      const {primary,fallback}=typeof source==='string'?{primary:source}:source;
      let img;
      try { img=await decode(primary); }
      catch(error) { if(!fallback) throw error; img=await decode(fallback); }
      let upload=img;
      const largest=Math.max(img.naturalWidth,img.naturalHeight);
      if(largest>maxTexture){
        // Keep the same framing on older GPUs instead of uploading an invalid texture.
        const scale=maxTexture/largest, scaled=document.createElement('canvas');
        scaled.width=Math.max(1,Math.floor(img.naturalWidth*scale));
        scaled.height=Math.max(1,Math.floor(img.naturalHeight*scale));
        const ctx=scaled.getContext('2d');
        if(!ctx) throw Error('Could not scale room texture for this GPU');
        ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,scaled.width,scaled.height);
        upload=scaled;
      }
      const target=gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D,target);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,upload);
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
    if(u.art){gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this.textures[room]); gl.uniform1i(u.art,0);}
    if(u.relief){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.textures.relief);gl.uniform1i(u.relief,1);}
    if(u.material){gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.textures[room+'Material']);gl.uniform1i(u.material,2);}
    const {scaleX,scaleY,focalU,focalV}=roomUV(room,options.aspect??w/h,options.visibleFraction??1);
    gl.uniform2f(u.uvScale,scaleX,scaleY);
    gl.uniform2f(u.focalPoint,focalU,focalV);
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
