export const ST_JOHNS_CENTER=[-122.76327215,45.58579725];
export const ST_JOHNS_BEARING=54.24624408372691;
export const ST_JOHNS_LENGTH_METERS=630;
export const ST_JOHNS_MIN_ZOOM=12;

const asset=(name)=>new URL(`./models/${name}.glb?v=20260920-portland-bridges`,import.meta.url).href;

/** Supplied GPS anchors select the crossing; loaded road geometry supplies final center and bearing. */
export const PORTLAND_BRIDGE_MODELS=[
  {id:'st-johns',label:'St. Johns',center:ST_JOHNS_CENTER,bearing:ST_JOHNS_BEARING,length:ST_JOHNS_LENGTH_METERS,url:asset('st-johns-bridge')},
  {id:'bnsf-5-1',label:'BNSF 5.1',center:[-122.74750,45.57667],bearing:90,length:545,url:asset('bnsf-5-1')},
  {id:'bnsf-9-6',label:'BNSF 9.6',center:[-122.69085,45.62473],bearing:90,length:864,url:asset('bnsf-9-6')},
  {id:'broadway',label:'Broadway',center:[-122.67417,45.53194],bearing:90,length:499.6,url:asset('broadway')},
  {id:'burnside',label:'Burnside',center:[-122.66750,45.52306],bearing:90,length:248.2,url:asset('burnside')},
  {id:'fremont',label:'Fremont',center:[-122.68306,45.53778],bearing:90,length:664,url:asset('fremont')},
  {id:'glenn-jackson',label:'Glenn Jackson',center:[-122.54861,45.59306],bearing:90,length:3588,url:asset('glenn-jackson')},
  {id:'hawthorne',label:'Hawthorne',center:[-122.67056,45.51306],bearing:90,length:422.9,url:asset('hawthorne')},
  {id:'interstate',label:'Interstate',center:[-122.67371,45.61789],bearing:0,length:1086,url:asset('interstate')},
  {id:'marquam',label:'Marquam',center:[-122.66917,45.50806],bearing:90,length:326,url:asset('marquam')},
  {id:'morrison',label:'Morrison',center:[-122.66972,45.51778],bearing:90,length:239.7,url:asset('morrison')},
  {id:'ross-island',label:'Ross Island',center:[-122.66444,45.50111],bearing:90,length:562,url:asset('ross-island')},
  {id:'sellwood',label:'Sellwood',center:[-122.66592,45.46428],bearing:90,length:609,url:asset('sellwood')},
  {id:'steel',label:'Steel',center:[-122.66917,45.52750],bearing:90,length:252,url:asset('steel')},
  {id:'tilikum-crossing',label:'Tilikum Crossing',center:[-122.66500,45.50556],bearing:90,length:532,url:asset('tilikum-crossing')},
];

const componentCounts={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
const componentBytes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const readers={5120:'getInt8',5121:'getUint8',5122:'getInt16',5123:'getUint16',5125:'getUint32',5126:'getFloat32'};

function glbChunks(buffer){
  const view=new DataView(buffer);
  if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2)throw Error('Bridge model is not a GLB 2.0 file.');
  let offset=12,json,binary;
  while(offset<buffer.byteLength){
    const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true),start=offset+8;
    if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,start,length)).replace(/\0+$/,''));
    if(type===0x004e4942)binary={offset:start,length};
    offset=start+length;
  }
  if(!json||!binary)throw Error('Bridge model is missing JSON or geometry data.');
  return {json,binary};
}

function readAccessor(buffer,json,binary,index){
  const accessor=json.accessors[index],bufferView=json.bufferViews[accessor.bufferView];
  const count=componentCounts[accessor.type],bytes=componentBytes[accessor.componentType],stride=bufferView.byteStride??count*bytes;
  const offset=binary.offset+(bufferView.byteOffset??0)+(accessor.byteOffset??0),view=new DataView(buffer);
  const values=new Float32Array(accessor.count*count),read=readers[accessor.componentType];
  if(!read)throw Error(`Unsupported bridge component type ${accessor.componentType}.`);
  for(let vertex=0;vertex<accessor.count;vertex++)for(let component=0;component<count;component++){
    const byteOffset=offset+vertex*stride+component*bytes;
    values[vertex*count+component]=view[read](byteOffset,true);
  }
  return {values,count:accessor.count,min:accessor.min,max:accessor.max};
}

/** Convert a supplied Y-up GLB into east/south/up local Mercator-meter vertices. */
export function parseBridgeGlb(buffer,bearing=90,lengthMeters){
  const {json,binary}=glbChunks(buffer),angle=bearing*Math.PI/180,sin=Math.sin(angle),cos=Math.cos(angle);
  const primitives=[];let modelMin=Infinity,modelMax=-Infinity,total=0;
  for(const mesh of json.meshes??[])for(const primitive of mesh.primitives??[]){
    if((primitive.mode??4)!==4||primitive.indices!==undefined)throw Error('Bridge model must use unindexed triangles.');
    const position=readAccessor(buffer,json,binary,primitive.attributes.POSITION),normal=readAccessor(buffer,json,binary,primitive.attributes.NORMAL);
    if(position.count!==normal.count)throw Error('Bridge position and normal counts differ.');
    modelMin=Math.min(modelMin,position.min?.[0]??Infinity);modelMax=Math.max(modelMax,position.max?.[0]??-Infinity);
    primitives.push({position,normal,material:primitive.material??0});total+=position.count;
  }
  const sourceLength=modelMax-modelMin,scale=(lengthMeters??sourceLength)/sourceLength,vertices=new Float32Array(total*7);
  let cursor=0;
  for(const primitive of primitives){
    const materialShade=[1,.82,.76,.94][primitive.material]??.9;
    for(let index=0;index<primitive.position.count;index++){
      const x=primitive.position.values[index*3]*scale,up=primitive.position.values[index*3+1]*scale,width=primitive.position.values[index*3+2]*scale;
      const nx=primitive.normal.values[index*3],nup=primitive.normal.values[index*3+1],nwidth=primitive.normal.values[index*3+2];
      // A compass bearing rotates the model's +X length axis. Mercator Y points
      // south, so geographic north is negated for both position and normal.
      vertices[cursor++]=x*sin+width*cos;vertices[cursor++]=-(x*cos-width*sin);vertices[cursor++]=up;
      vertices[cursor++]=nx*sin+nwidth*cos;vertices[cursor++]=-(nx*cos-nwidth*sin);vertices[cursor++]=nup;vertices[cursor++]=materialShade;
    }
  }
  return {vertices,count:total,scale,bounds:{length:sourceLength*scale}};
}

export function parseStJohnsBridgeGlb(buffer,bearing=ST_JOHNS_BEARING,lengthMeters=ST_JOHNS_LENGTH_METERS){return parseBridgeGlb(buffer,bearing,lengthMeters);}

function linesOf(feature){return feature.geometry?.type==='LineString'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiLineString'?feature.geometry.coordinates:[];}
function localMeters(coordinate,anchor){return [(coordinate[0]-anchor[0])*111320*Math.cos(anchor[1]*Math.PI/180),(coordinate[1]-anchor[1])*111320];}
function pointSegmentDistance(a,b){const length=(b[0]-a[0])**2+(b[1]-a[1])**2;if(!length)return Math.hypot(...a);const t=Math.max(0,Math.min(1,-(a[0]*(b[0]-a[0])+a[1]*(b[1]-a[1]))/length));return Math.hypot(a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]));}

/** Snap a supplied GPS anchor to the matching vector bridge and infer its compass bearing. */
export function estimateBridgePlacement(features,definition){
  const candidates=[];
  for(const feature of features)for(const line of linesOf(feature)){
    const points=line.map(coordinate=>localMeters(coordinate,definition.center));let distance=Infinity;
    for(let index=1;index<points.length;index++)distance=Math.min(distance,pointSegmentDistance(points[index-1],points[index]));
    if(Number.isFinite(distance))candidates.push({points,distance});
  }
  if(!candidates.length)return null;
  const nearest=Math.min(...candidates.map(candidate=>candidate.distance));
  if(nearest>Math.min(180,Math.max(75,definition.length*.12)))return null;
  const selected=candidates.filter(candidate=>candidate.distance<=nearest+32),points=[],seen=new Set();
  for(const candidate of selected)for(const point of candidate.points){const key=`${Math.round(point[0]*2)},${Math.round(point[1]*2)}`;if(!seen.has(key)){seen.add(key);points.push(point);}}
  if(points.length<2)return null;
  const mean=points.reduce((sum,point)=>[sum[0]+point[0]/points.length,sum[1]+point[1]/points.length],[0,0]);let xx=0,xy=0,yy=0;
  for(const point of points){const x=point[0]-mean[0],y=point[1]-mean[1];xx+=x*x;xy+=x*y;yy+=y*y;}
  const angle=.5*Math.atan2(2*xy,xx-yy),east=Math.cos(angle),north=Math.sin(angle);let min=Infinity,max=-Infinity,across=0;
  for(const point of points){const x=point[0]-mean[0],y=point[1]-mean[1];min=Math.min(min,x*east+y*north);max=Math.max(max,x*east+y*north);across+=-x*north+y*east;}
  const along=(min+max)/2,side=across/points.length,centerEast=mean[0]+along*east-side*north,centerNorth=mean[1]+along*north+side*east;
  let bearing=Math.atan2(east,north)*180/Math.PI;if(bearing<0)bearing+=180;if(bearing>=180)bearing-=180;
  return {center:[definition.center[0]+centerEast/(111320*Math.cos(definition.center[1]*Math.PI/180)),definition.center[1]+centerNorth/111320],bearing,span:max-min};
}

function eachCoordinate(feature,visit){for(const line of linesOf(feature))for(let index=0;index<line.length;index++){visit(line[index]);if(index)visit([(line[index-1][0]+line[index][0])/2,(line[index-1][1]+line[index][1])/2]);}}
export function bridgeFeatureCoveredByModel(feature,definition){const angle=definition.bearing*Math.PI/180,sin=Math.sin(angle),cos=Math.cos(angle);let covered=false;eachCoordinate(feature,coordinate=>{const [east,north]=localMeters(coordinate,definition.center),along=east*sin+north*cos,across=east*cos-north*sin;if(Math.abs(along)<=definition.length/2-12&&Math.abs(across)<=55)covered=true;});return covered;}
export function isStJohnsBridgeFeature(feature){return bridgeFeatureCoveredByModel(feature,{center:ST_JOHNS_CENTER,bearing:ST_JOHNS_BEARING,length:ST_JOHNS_LENGTH_METERS});}

function loadArrayBuffer(url){return new Promise((resolve,reject)=>{const request=new XMLHttpRequest();request.open('GET',url,true);request.responseType='arraybuffer';request.onload=()=>request.status===0||request.status>=200&&request.status<300?resolve(request.response):reject(Error(`Bridge model request failed (${request.status}).`));request.onerror=()=>reject(Error('Bridge model request failed.'));request.send();});}

export function createPortlandBridgeLayer(maplibre,elevation=()=>0,definitions=PORTLAND_BRIDGE_MODELS){
  const models=definitions.map(definition=>({...definition,center:[...definition.center],sourceCenter:[...definition.center],loading:false,count:0,dirty:false}));let activeLoads=0;
  return {
    id:'portland-bridge-models',type:'custom',renderingMode:'3d',models,disposed:false,
    update(features){
      for(const model of models){const placement=estimateBridgePlacement(features,{...model,center:model.sourceCenter});if(!placement)continue;const changed=Math.abs(placement.bearing-model.bearing)>.08||Math.hypot(...localMeters(placement.center,model.center))>.5;model.center=placement.center;model.bearing=placement.bearing;model.span=placement.span;if(changed&&model.sourceBuffer){const parsed=parseBridgeGlb(model.sourceBuffer,model.bearing,model.length);model.vertices=parsed.vertices;model.count=parsed.count;model.dirty=true;}}
      this.map?.triggerRepaint();
    },
    visible(model){if(this.map.getZoom()<ST_JOHNS_MIN_ZOOM)return false;const point=this.map.project(model.center),canvas=this.map.getCanvas();return point.x>-900&&point.y>-900&&point.x<canvas.clientWidth+900&&point.y<canvas.clientHeight+900;},
    async load(model){if(model.loading||model.count||this.disposed||activeLoads>=2)return;model.loading=true;activeLoads++;try{model.sourceBuffer=await loadArrayBuffer(model.url);if(this.disposed)return;const parsed=parseBridgeGlb(model.sourceBuffer,model.bearing,model.length);model.vertices=parsed.vertices;model.count=parsed.count;model.dirty=true;this.map?.triggerRepaint();}catch(error){console.warn(`${model.label} Bridge model unavailable`,error);}finally{model.loading=false;activeLoads--;this.map?.triggerRepaint();}},
    onAdd(map,gl){
      this.map=map;this.disposed=false;const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
      const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
        in vec3 a_position;in vec3 a_normal;in float a_shade;uniform mat4 u_matrix;out vec3 v_normal;out float v_shade;
        void main(){gl_Position=u_matrix*vec4(a_position,1.);v_normal=a_normal;v_shade=a_shade;}`);
      const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
        precision highp float;in vec3 v_normal;in float v_shade;out vec4 color;
        void main(){vec3 normal=normalize(v_normal);vec3 light=normalize(vec3(-.42,.28,.86));float diffuse=.64+.36*max(dot(normal,light),0.);float reflection=.1*pow(1.-abs(normal.z),3.);vec3 slate=vec3(60.,85.,101.)/255.;color=vec4(slate*(diffuse*v_shade+reflection),1.);}`);
      this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);gl.deleteShader(vertex);gl.deleteShader(fragment);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));this.matrix=gl.getUniformLocation(this.program,'u_matrix');
    },
    upload(gl,model){model.buffer=gl.createBuffer();model.vao=gl.createVertexArray();gl.bindVertexArray(model.vao);gl.bindBuffer(gl.ARRAY_BUFFER,model.buffer);gl.bufferData(gl.ARRAY_BUFFER,model.vertices,gl.STATIC_DRAW);for(const [name,size,offset] of [['a_position',3,0],['a_normal',3,12],['a_shade',1,24]]){const location=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,28,offset);}gl.bindVertexArray(null);model.vertices=null;model.dirty=false;},
    render(gl,input){
      const visible=models.filter(model=>this.visible(model));for(const model of visible)if(!model.count)this.load(model);const ready=visible.filter(model=>model.count);if(!ready.length)return;
      const cull=gl.isEnabled(gl.CULL_FACE),blend=gl.isEnabled(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.useProgram(this.program);
      for(const model of ready){if(model.dirty){if(model.buffer){gl.deleteBuffer(model.buffer);gl.deleteVertexArray(model.vao);}this.upload(gl,model);}const origin=maplibre.MercatorCoordinate.fromLngLat(model.center),unit=origin.meterInMercatorCoordinateUnits(),base=Math.max(0,elevation(model.center)||0),matrix=input.defaultProjectionData.mainMatrix,local=new Float32Array(16);for(let row=0;row<4;row++){local[row]=matrix[row]*unit;local[4+row]=matrix[4+row]*unit;local[8+row]=matrix[8+row]*unit;local[12+row]=matrix[row]*origin.x+matrix[4+row]*origin.y+matrix[8+row]*base*unit+matrix[12+row];}gl.bindVertexArray(model.vao);gl.uniformMatrix4fv(this.matrix,false,local);gl.drawArrays(gl.TRIANGLES,0,model.count);}
      if(cull)gl.enable(gl.CULL_FACE);if(blend)gl.enable(gl.BLEND);gl.bindVertexArray(null);
    },
    onRemove(map,gl){this.disposed=true;for(const model of models){if(model.buffer)gl.deleteBuffer(model.buffer);if(model.vao)gl.deleteVertexArray(model.vao);model.vertices=null;model.sourceBuffer=null;model.count=0;}gl.deleteProgram(this.program);this.map=null;}
  };
}

export function createStJohnsBridgeLayer(maplibre,elevation=()=>0,modelUrl){if(modelUrl)return createPortlandBridgeLayer(maplibre,elevation,[{...PORTLAND_BRIDGE_MODELS[0],url:modelUrl}]);return createPortlandBridgeLayer(maplibre,elevation);}
