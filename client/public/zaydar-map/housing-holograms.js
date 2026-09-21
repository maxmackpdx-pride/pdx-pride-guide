export const HOUSING_HOLOGRAM_MIN_ZOOM=13.25;
export const HOUSING_EVENT_HEIGHT_RATIO=1/3;
export const HOUSING_ICON_SCALE=.6;
export const HOUSING_ROTATION_SPEED=.08;

const asset=name=>new URL(`./models/housing/${name}.glb?v=20260920-hous-holograms`,import.meta.url).href;
export const HOUSING_HOLOGRAM_MODELS={
  LOOKING:{id:'rent',url:asset('rent'),height:118*HOUSING_ICON_SCALE,bearing:-18},
  OFFERING:{id:'rent',url:asset('rent'),height:118*HOUSING_ICON_SCALE,bearing:16},
  FORMING:{id:'forming-hauz',url:asset('forming-hauz'),height:132*HOUSING_ICON_SCALE,bearing:-8},
  MANAGED:{id:'hous-purple',url:asset('hous-purple'),height:126*HOUSING_ICON_SCALE,bearing:22},
};

const componentCounts={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
const componentBytes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const readers={5120:'getInt8',5121:'getUint8',5122:'getInt16',5123:'getUint16',5125:'getUint32',5126:'getFloat32'};

function chunks(buffer){
  const view=new DataView(buffer);
  if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2)throw Error('HOUS hologram is not a GLB 2.0 file.');
  let offset=12,json,binary;
  while(offset<buffer.byteLength){
    const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true),start=offset+8;
    if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,start,length)).replace(/\0+$/,''));
    if(type===0x004e4942)binary={offset:start,length};
    offset=start+length;
  }
  if(!json||!binary)throw Error('HOUS hologram is missing JSON or geometry data.');
  return {json,binary};
}

function accessorReader(buffer,json,binary,index){
  const accessor=json.accessors[index],bufferView=json.bufferViews[accessor.bufferView];
  const size=componentCounts[accessor.type],bytes=componentBytes[accessor.componentType],stride=bufferView.byteStride??size*bytes;
  const offset=binary.offset+(bufferView.byteOffset??0)+(accessor.byteOffset??0),view=new DataView(buffer),read=readers[accessor.componentType];
  if(!read)throw Error(`Unsupported HOUS hologram component type ${accessor.componentType}.`);
  return {accessor,size,value(vertex,component=0){return view[read](offset+vertex*stride+component*bytes,true);}};
}

/** Convert the lightweight Y-up model to centered east/south/up meter geometry. */
export function parseHousingHologramGlb(buffer,heightMeters=120){
  const {json,binary}=chunks(buffer),parts=[];let total=0;
  for(const mesh of json.meshes??[])for(const primitive of mesh.primitives??[]){
    if((primitive.mode??4)!==4)throw Error('HOUS hologram must use triangles.');
    const position=accessorReader(buffer,json,binary,primitive.attributes.POSITION);
    const normal=accessorReader(buffer,json,binary,primitive.attributes.NORMAL);
    const indices=primitive.indices===undefined?null:accessorReader(buffer,json,binary,primitive.indices);
    const count=indices?.accessor.count??position.accessor.count;
    parts.push({position,normal,indices,count});total+=count;
  }
  if(!parts.length)throw Error('HOUS hologram has no triangle geometry.');
  const bounds=parts[0].position.accessor,minimum=bounds.min,maximum=bounds.max;
  if(!minimum||!maximum)throw Error('HOUS hologram is missing position bounds.');
  const height=maximum[1]-minimum[1],scale=heightMeters/height,centerX=(minimum[0]+maximum[0])/2,centerZ=(minimum[2]+maximum[2])/2;
  const vertices=new Float32Array(total*6);let cursor=0;
  for(const part of parts)for(let index=0;index<part.count;index++){
    const source=part.indices?part.indices.value(index):index;
    vertices[cursor++]=(part.position.value(source,0)-centerX)*scale;
    vertices[cursor++]=(part.position.value(source,2)-centerZ)*scale;
    vertices[cursor++]=(part.position.value(source,1)-minimum[1])*scale;
    vertices[cursor++]=part.normal.value(source,0);
    vertices[cursor++]=part.normal.value(source,2);
    vertices[cursor++]=part.normal.value(source,1);
  }
  let baseRadius=0;
  for(let index=0;index<vertices.length;index+=6)if(vertices[index+2]<=heightMeters*.08)baseRadius=Math.max(baseRadius,Math.hypot(vertices[index],vertices[index+1]));
  return {vertices,count:total,height:height*scale,baseRadius};
}

function loadArrayBuffer(url){return new Promise((resolve,reject)=>{const request=new XMLHttpRequest();request.open('GET',url,true);request.responseType='arraybuffer';request.onload=()=>request.status===0||request.status>=200&&request.status<300?resolve(request.response):reject(Error(`HOUS hologram request failed (${request.status}).`));request.onerror=()=>reject(Error('HOUS hologram request failed.'));request.send();});}
function rgb(color){return [1,3,5].map(start=>parseInt(color.slice(start,start+2),16)/255);}

export function createHousingHologramLayer(maplibre,elevation=()=>0,reduced={matches:false},{externallyClocked=false}={}){
  const models=new Map(Object.values(HOUSING_HOLOGRAM_MODELS).map(definition=>[definition.id,{...definition,loading:false,count:0}]));
  return {
    id:'housing-holograms',type:'custom',renderingMode:'3d',instances:[],layouts:new Map(),selected:null,disposed:false,
    setSelected(key){this.selected=key||null;this.map?.triggerRepaint();},
    setLayout(key,layout){this.layouts.set(key,layout);},
    beamHalfWidth(key,scale=1){
      const instance=this.instances.find(item=>item.key===key),model=instance&&models.get(instance.definition.id);
      if(!instance||!model?.baseRadius||!this.map)return 18*scale;
      const [lng,lat]=instance.coordinates,longitudeScale=111320*Math.cos(lat*Math.PI/180),center=this.map.project(instance.coordinates),east=this.map.project([lng+model.baseRadius/longitudeScale,lat]);
      return Math.max(8,Math.min(72,Math.abs(east.x-center.x)*scale));
    },
    update(rows){
      this.instances=rows.flatMap(row=>{
        const definition=HOUSING_HOLOGRAM_MODELS[row.housingModel];
        return definition&&Array.isArray(row.coordinates)&&row.coordinates.length===2&&row.coordinates.every(Number.isFinite)
          ?[{key:row.key,coordinates:row.coordinates,color:row.color||'#00FFFF',phase:Number(row.phase)||0,demoOpen:row.demoOpen===true,definition}]:[];
      });
      const keys=new Set(this.instances.map(instance=>instance.key));for(const key of this.layouts.keys())if(!keys.has(key))this.layouts.delete(key);
      this.map?.triggerRepaint();
    },
    visible(instance){if(this.map.getZoom()<HOUSING_HOLOGRAM_MIN_ZOOM||!instance.demoOpen&&instance.key!==this.selected)return false;const point=this.map.project(instance.coordinates),canvas=this.map.getCanvas();return point.x>-280&&point.y>-360&&point.x<canvas.clientWidth+280&&point.y<canvas.clientHeight+280;},
    async load(model){
      if(model.loading||model.count||this.disposed)return;model.loading=true;
      try{const buffer=await loadArrayBuffer(model.url);if(this.disposed)return;const parsed=parseHousingHologramGlb(buffer,model.height);model.vertices=parsed.vertices;model.count=parsed.count;model.baseRadius=parsed.baseRadius;model.dirty=true;this.map?.triggerRepaint();}
      catch(error){console.warn(`${model.id} HOUS hologram unavailable`,error);}finally{model.loading=false;}
    },
    onAdd(map,gl){
      this.map=map;this.disposed=false;
      const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
      const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
        in vec3 a_position;in vec3 a_normal;uniform mat4 u_matrix;uniform vec2 u_screen_shift;out vec3 v_normal;
        void main(){vec4 clip=u_matrix*vec4(a_position,1.);clip.xy+=u_screen_shift*clip.w;gl_Position=clip;v_normal=a_normal;}`);
      const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
        precision highp float;in vec3 v_normal;uniform vec3 u_color;uniform float u_time;uniform float u_phase;out vec4 color;
        float hash(vec2 point){return fract(sin(dot(point,vec2(12.9898,78.233)))*43758.5453);}
        void main(){
          float clock=floor((u_time+u_phase)*7.);float snow=hash(floor(gl_FragCoord.xy*.52)+clock);
          float scan=.72+.28*smoothstep(.12,.86,fract(gl_FragCoord.y/6.+u_time*1.7+u_phase));
          float dropout=step(.035,snow);float spark=step(.986,snow);
          float edge=.72+.28*(1.-abs(normalize(v_normal).z));
          float alpha=(.42+.13*scan+.12*spark)*dropout;
          color=vec4(u_color*(.68+.38*scan+.5*spark)*edge,alpha);
        }`);
      this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);gl.deleteShader(vertex);gl.deleteShader(fragment);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
      this.matrix=gl.getUniformLocation(this.program,'u_matrix');this.screenShift=gl.getUniformLocation(this.program,'u_screen_shift');this.color=gl.getUniformLocation(this.program,'u_color');this.time=gl.getUniformLocation(this.program,'u_time');this.phase=gl.getUniformLocation(this.program,'u_phase');
    },
    upload(gl,model){
      model.buffer=gl.createBuffer();model.vao=gl.createVertexArray();gl.bindVertexArray(model.vao);gl.bindBuffer(gl.ARRAY_BUFFER,model.buffer);gl.bufferData(gl.ARRAY_BUFFER,model.vertices,gl.STATIC_DRAW);
      for(const [name,size,offset] of [['a_position',3,0],['a_normal',3,12]]){const location=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,24,offset);}
      gl.bindVertexArray(null);model.vertices=null;model.dirty=false;
    },
    render(gl,input){
      const visible=this.instances.filter(instance=>this.visible(instance));
      for(const instance of visible){const model=models.get(instance.definition.id);if(!model.count)this.load(model);}
      const ready=visible.filter(instance=>models.get(instance.definition.id)?.count);if(!ready.length)return;
      const depth=gl.isEnabled(gl.DEPTH_TEST),cull=gl.isEnabled(gl.CULL_FACE),blend=gl.isEnabled(gl.BLEND),depthMask=gl.getParameter(gl.DEPTH_WRITEMASK);
      const srcRgb=gl.getParameter(gl.BLEND_SRC_RGB),dstRgb=gl.getParameter(gl.BLEND_DST_RGB),srcAlpha=gl.getParameter(gl.BLEND_SRC_ALPHA),dstAlpha=gl.getParameter(gl.BLEND_DST_ALPHA);
      gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.program);
      const seconds=reduced.matches?0:performance.now()/1000;gl.uniform1f(this.time,seconds);
      for(const instance of ready){
        const model=models.get(instance.definition.id);if(model.dirty)this.upload(gl,model);
        const origin=maplibre.MercatorCoordinate.fromLngLat(instance.coordinates),unit=origin.meterInMercatorCoordinateUnits(),base=Math.max(0,elevation(instance.coordinates)||0)+3;
        const layout=this.layouts.get(instance.key)??{x:0,lift:178.5*HOUSING_EVENT_HEIGHT_RATIO,scale:1},modelUnit=unit*(layout.scale??1);
        const angle=instance.definition.bearing*Math.PI/180+seconds*HOUSING_ROTATION_SPEED,cos=Math.cos(angle),sin=Math.sin(angle),matrix=input.defaultProjectionData.mainMatrix,local=new Float32Array(16);
        for(let row=0;row<4;row++){
          local[row]=(matrix[row]*cos+matrix[4+row]*sin)*modelUnit;
          local[4+row]=(-matrix[row]*sin+matrix[4+row]*cos)*modelUnit;
          local[8+row]=matrix[8+row]*modelUnit;
          local[12+row]=matrix[row]*origin.x+matrix[4+row]*origin.y+matrix[8+row]*base*unit+matrix[12+row];
        }
        const canvas=this.map.getCanvas();gl.bindVertexArray(model.vao);gl.uniformMatrix4fv(this.matrix,false,local);gl.uniform2f(this.screenShift,2*(layout.x??0)/canvas.clientWidth,2*(layout.lift??0)/canvas.clientHeight);gl.uniform3fv(this.color,rgb(instance.color));gl.uniform1f(this.phase,instance.phase);gl.drawArrays(gl.TRIANGLES,0,model.count);
      }
      gl.bindVertexArray(null);gl.blendFuncSeparate(srcRgb,dstRgb,srcAlpha,dstAlpha);gl.depthMask(depthMask);if(depth)gl.enable(gl.DEPTH_TEST);else gl.disable(gl.DEPTH_TEST);if(cull)gl.enable(gl.CULL_FACE);else gl.disable(gl.CULL_FACE);if(blend)gl.enable(gl.BLEND);else gl.disable(gl.BLEND);
      if(!reduced.matches&&!externallyClocked&&!(typeof document!=='undefined'&&document.hidden))this.map.triggerRepaint();
    },
    onRemove(map,gl){this.disposed=true;for(const model of models.values()){if(model.buffer)gl.deleteBuffer(model.buffer);if(model.vao)gl.deleteVertexArray(model.vao);model.vertices=null;model.count=0;}gl.deleteProgram(this.program);this.instances=[];this.layouts.clear();this.map=null;}
  };
}
