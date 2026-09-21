export const PORTLAND_LANDMARK_MIN_ZOOM=14;

const asset=name=>new URL(`./models/landmarks/${name}.glb?v=20260920-portland-landmarks`,import.meta.url).href;
export const PORTLAND_LANDMARKS=[
  {id:'benson-bubbler',label:'Benson Bubbler',url:asset('benson-bubbler'),center:[-122.67925,45.51923],dimensions:[1.17,1.17,1],bearing:0,scale:1.75},
  {id:'chinatown-friendship-gate',label:'Chinatown Friendship Gate',url:asset('chinatown-friendship-gate'),center:[-122.67444,45.52331],dimensions:[19.9,3.84,11.324],bearing:0,scale:1.75},
  {id:'darcelle-plaza-rainbow-hydrants',label:'Darcelle Plaza rainbow hydrants',url:asset('darcelle-plaza-rainbow-hydrants'),center:[-122.67992,45.52143],dimensions:[5.3,.755,1.09],bearing:90,scale:1.75},
  {id:'darcelle-xv-marquee',label:'Darcelle XV marquee',url:asset('darcelle-xv-marquee'),center:[-122.67311,45.52475],dimensions:[4.68,.985,2.095],bearing:90,scale:1.75,baseOffset:3},
  {id:'harvey-milk-street-sign',label:'SW Harvey Milk street sign',url:asset('harvey-milk-street-sign'),center:[-122.68330,45.52230],dimensions:[2.1,.245,2.985],bearing:0,scale:1.75},
  {id:'paul-bunyan-kenton',label:'Paul Bunyan statue',url:asset('paul-bunyan-kenton'),center:[-122.68662,45.58383],dimensions:[3.5,2.818,8.84],bearing:0,scale:1.75},
  {id:'skidmore-fountain',label:'Skidmore Fountain',url:asset('skidmore-fountain'),center:[-122.67108,45.52240],dimensions:[4.7,4.7,5.21],bearing:0,scale:1.75},
  {id:'weather-machine',label:'Weather Machine',url:asset('weather-machine'),center:[-122.67933,45.51901],dimensions:[2.07,1.8,9.993],bearing:0,scale:1.75},
  {id:'white-stag-portland-sign',label:'Welcome to Portland sign',url:asset('white-stag-portland-sign'),center:[-122.67052,45.52339],dimensions:[12.537,3.299,14.617],bearing:90,scale:3,baseOffset:22},
];

const componentCounts={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
const componentBytes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const readers={5120:'getInt8',5121:'getUint8',5122:'getInt16',5123:'getUint16',5125:'getUint32',5126:'getFloat32'};

function chunks(buffer){
  const view=new DataView(buffer);if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2)throw Error('Landmark is not a GLB 2.0 file.');
  let offset=12,json,binary;while(offset<buffer.byteLength){const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true),start=offset+8;if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,start,length)).replace(/\0+$/,''));if(type===0x004e4942)binary={offset:start,length};offset=start+length;}
  if(!json||!binary)throw Error('Landmark is missing JSON or geometry data.');return {json,binary};
}
function accessorReader(buffer,json,binary,index){
  const accessor=json.accessors[index],bufferView=json.bufferViews[accessor.bufferView],size=componentCounts[accessor.type],bytes=componentBytes[accessor.componentType],stride=bufferView.byteStride??size*bytes;
  const offset=binary.offset+(bufferView.byteOffset??0)+(accessor.byteOffset??0),view=new DataView(buffer),read=readers[accessor.componentType];if(!read)throw Error(`Unsupported landmark component type ${accessor.componentType}.`);
  return {accessor,size,value(vertex,component=0){return view[read](offset+vertex*stride+component*bytes,true);}};
}
function materialColor(json,index){
  const material=json.materials?.[index]??{},source=material.emissiveFactor??material.pbrMetallicRoughness?.baseColorFactor??[.2,.8,1];
  const maximum=Math.max(...source.slice(0,3),.001);return source.slice(0,3).map(channel=>Math.min(1,channel/maximum));
}

/** Preserve true meter dimensions while converting glTF Y-up to east/south/up. */
export function parseLandmarkGlb(buffer,targetDimensions){
  const {json,binary}=chunks(buffer),parts=[];let total=0,minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  for(const mesh of json.meshes??[])for(const primitive of mesh.primitives??[]){
    if((primitive.mode??4)!==4)throw Error('Landmarks must use triangles.');
    const position=accessorReader(buffer,json,binary,primitive.attributes.POSITION),normal=accessorReader(buffer,json,binary,primitive.attributes.NORMAL),indices=primitive.indices===undefined?null:accessorReader(buffer,json,binary,primitive.indices),count=indices?.accessor.count??position.accessor.count;
    for(let index=0;index<position.accessor.count;index++){const x=position.value(index,0),y=position.value(index,1),z=position.value(index,2);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);}
    parts.push({position,normal,indices,count,color:materialColor(json,primitive.material)});total+=count;
  }
  if(!parts.length)throw Error('Landmark has no triangle geometry.');
  const dimensions=[maxX-minX,maxZ-minZ,maxY-minY],fitted=targetDimensions??dimensions,axisScale=fitted.map((value,index)=>value/dimensions[index]);
  const centerX=(minX+maxX)/2,centerZ=(minZ+maxZ)/2,vertices=new Float32Array(total*9);let cursor=0;
  for(const part of parts)for(let index=0;index<part.count;index++){
    const source=part.indices?part.indices.value(index):index;
    vertices[cursor++]=(part.position.value(source,0)-centerX)*axisScale[0];vertices[cursor++]=(part.position.value(source,2)-centerZ)*axisScale[1];vertices[cursor++]=(part.position.value(source,1)-minY)*axisScale[2];
    vertices[cursor++]=part.normal.value(source,0);vertices[cursor++]=part.normal.value(source,2);vertices[cursor++]=part.normal.value(source,1);
    vertices.set(part.color,cursor);cursor+=3;
  }
  return {vertices,count:total,dimensions:fitted};
}

function loadArrayBuffer(url){return new Promise((resolve,reject)=>{const request=new XMLHttpRequest();request.open('GET',url,true);request.responseType='arraybuffer';request.onload=()=>request.status===0||request.status>=200&&request.status<300?resolve(request.response):reject(Error(`Landmark request failed (${request.status}).`));request.onerror=()=>reject(Error('Landmark request failed.'));request.send();});}

export function createPortlandLandmarkLayer(maplibre,elevation=()=>0,reduced={matches:false},definitions=PORTLAND_LANDMARKS){
  const models=definitions.map(definition=>({...definition,loading:false,count:0}));let activeLoads=0;
  return {
    id:'portland-hologram-landmarks',type:'custom',renderingMode:'3d',models,disposed:false,
    visible(model){if(this.map.getZoom()<PORTLAND_LANDMARK_MIN_ZOOM)return false;const point=this.map.project(model.center),canvas=this.map.getCanvas();return point.x>-300&&point.y>-420&&point.x<canvas.clientWidth+300&&point.y<canvas.clientHeight+300;},
    async load(model){
      if(model.loading||model.count||this.disposed||activeLoads>=2)return;model.loading=true;activeLoads++;
      try{const buffer=await loadArrayBuffer(model.url);if(this.disposed)return;const parsed=parseLandmarkGlb(buffer,model.dimensions);model.vertices=parsed.vertices;model.count=parsed.count;model.dirty=true;this.map?.triggerRepaint();}
      catch(error){console.warn(`${model.label} landmark unavailable`,error);}finally{model.loading=false;activeLoads--;this.map?.triggerRepaint();}
    },
    onAdd(map,gl){
      this.map=map;this.disposed=false;const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
      const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
        in vec3 a_position;in vec3 a_normal;in vec3 a_color;uniform mat4 u_matrix;out vec3 v_position;out vec3 v_normal;out vec3 v_color;
        void main(){gl_Position=u_matrix*vec4(a_position,1.);v_position=a_position;v_normal=a_normal;v_color=a_color;}`);
      const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
        precision highp float;in vec3 v_position;in vec3 v_normal;in vec3 v_color;uniform float u_time;uniform float u_phase;out vec4 color;
        float hash(vec2 point){return fract(sin(dot(point,vec2(12.9898,78.233)))*43758.5453);}
        void main(){
          float clock=floor((u_time+u_phase)*5.);float snow=hash(floor(gl_FragCoord.xy*.46)+clock);
          float scan=.68+.32*smoothstep(.08,.9,fract(v_position.z*1.35-u_time*.42+u_phase));
          float ribs=.86+.14*step(.62,fract(v_position.z*4.2));float dropout=step(.028,snow);float spark=step(.991,snow);
          float edge=.78+.22*(1.-abs(normalize(v_normal).z));float alpha=(.38+.15*scan+.1*spark)*dropout;
          color=vec4(v_color*(.78+.42*scan+.42*spark)*ribs*edge,alpha);
        }`);
      this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);gl.deleteShader(vertex);gl.deleteShader(fragment);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
      this.matrix=gl.getUniformLocation(this.program,'u_matrix');this.time=gl.getUniformLocation(this.program,'u_time');this.phase=gl.getUniformLocation(this.program,'u_phase');
    },
    upload(gl,model){
      model.buffer=gl.createBuffer();model.vao=gl.createVertexArray();gl.bindVertexArray(model.vao);gl.bindBuffer(gl.ARRAY_BUFFER,model.buffer);gl.bufferData(gl.ARRAY_BUFFER,model.vertices,gl.STATIC_DRAW);
      for(const [name,size,offset] of [['a_position',3,0],['a_normal',3,12],['a_color',3,24]]){const location=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,36,offset);}gl.bindVertexArray(null);model.vertices=null;model.dirty=false;
    },
    render(gl,input){
      const visible=models.filter(model=>this.visible(model));for(const model of visible)if(!model.count)this.load(model);const ready=visible.filter(model=>model.count);if(!ready.length)return;
      const depth=gl.isEnabled(gl.DEPTH_TEST),cull=gl.isEnabled(gl.CULL_FACE),blend=gl.isEnabled(gl.BLEND),depthMask=gl.getParameter(gl.DEPTH_WRITEMASK),srcRgb=gl.getParameter(gl.BLEND_SRC_RGB),dstRgb=gl.getParameter(gl.BLEND_DST_RGB),srcAlpha=gl.getParameter(gl.BLEND_SRC_ALPHA),dstAlpha=gl.getParameter(gl.BLEND_DST_ALPHA);
      gl.disable(gl.CULL_FACE);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.program);const seconds=reduced.matches?0:performance.now()/1000;gl.uniform1f(this.time,seconds);
      for(let index=0;index<ready.length;index++){
        const model=ready[index];if(model.dirty)this.upload(gl,model);const origin=maplibre.MercatorCoordinate.fromLngLat(model.center),unit=origin.meterInMercatorCoordinateUnits()*model.scale,base=Math.max(0,elevation(model.center)||0)+(model.baseOffset??1),angle=model.bearing*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle),matrix=input.defaultProjectionData.mainMatrix,local=new Float32Array(16);
        for(let row=0;row<4;row++){local[row]=(matrix[row]*cos+matrix[4+row]*sin)*unit;local[4+row]=(-matrix[row]*sin+matrix[4+row]*cos)*unit;local[8+row]=matrix[8+row]*unit;local[12+row]=matrix[row]*origin.x+matrix[4+row]*origin.y+matrix[8+row]*base*(unit/model.scale)+matrix[12+row];}
        gl.bindVertexArray(model.vao);gl.uniformMatrix4fv(this.matrix,false,local);gl.uniform1f(this.phase,index*1.618);gl.drawArrays(gl.TRIANGLES,0,model.count);
      }
      gl.bindVertexArray(null);gl.blendFuncSeparate(srcRgb,dstRgb,srcAlpha,dstAlpha);gl.depthMask(depthMask);if(depth)gl.enable(gl.DEPTH_TEST);else gl.disable(gl.DEPTH_TEST);if(cull)gl.enable(gl.CULL_FACE);else gl.disable(gl.CULL_FACE);if(blend)gl.enable(gl.BLEND);else gl.disable(gl.BLEND);if(!reduced.matches)this.map.triggerRepaint();
    },
    onRemove(map,gl){this.disposed=true;for(const model of models){if(model.buffer)gl.deleteBuffer(model.buffer);if(model.vao)gl.deleteVertexArray(model.vao);model.vertices=null;model.count=0;}gl.deleteProgram(this.program);this.map=null;}
  };
}
