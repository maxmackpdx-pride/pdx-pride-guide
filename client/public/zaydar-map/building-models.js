import {BUILDING_FILL} from './natural-surfaces.js';
export const BUILDING_MODEL_MIN_ZOOM=12;
const files=[
 ['big-pink-us-bancorp-tower',45.52280,-122.67620,110],
 // Arena long axis from the mapped footprint (OpenFreeMap building 209934310).
 ['moda-center',45.53167,-122.66667,351.87],
 ['oregon-convention-center',45.52830,-122.66310,135],
 ['pioneer-courthouse',45.51862,-122.67836,20],
 ['pittock-mansion',45.52500,-122.71639,90],
 ['portland-building',45.51564,-122.67867,20],
 ['providence-park',45.52139,-122.69167,90],
 ['union-station',45.52910,-122.67676,320],
];
export const PORTLAND_BUILDING_MODELS=files.map(([id,lat,lon,bearing])=>({id,center:[lon,lat],bearing,url:new URL(`./models/buildings/${id}_lat${lat.toFixed(5)}_lon${lon.toFixed(5)}_grayscale.glb`,import.meta.url).href}));
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function multiply(a,b){const out=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function nodeMatrix(n){if(n.matrix)return n.matrix;const [x,y,z,w]=n.rotation??[0,0,0,1],[sx,sy,sz]=n.scale??[1,1,1],[tx,ty,tz]=n.translation??[0,0,0];return [(1-2*(y*y+z*z))*sx,2*(x*y+z*w)*sx,2*(x*z-y*w)*sx,0,2*(x*y-z*w)*sy,(1-2*(x*x+z*z))*sy,2*(y*z+x*w)*sy,0,2*(x*z+y*w)*sz,2*(y*z-x*w)*sz,(1-2*(x*x+y*y))*sz,0,tx,ty,tz,1];}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
/** Apply the glTF scene hierarchy, indexed triangles, and inverse-transpose normals before Y-up conversion. */
export function parseBuildingGlb(buffer,definition={bearing:90}){
 const v=new DataView(buffer);if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2)throw Error('Expected GLB 2.0');let json,binary;
 for(let p=12;p<buffer.byteLength;){const length=v.getUint32(p,true),type=v.getUint32(p+4,true);if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,p+8,length)));if(type===0x004e4942)binary=p+8;p+=length+8;}
 if(!json||binary===undefined)throw Error('Missing GLB geometry');
 function accessor(index){const a=json.accessors[index],b=json.bufferViews[a.bufferView],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],bytes={5121:1,5123:2,5125:4,5126:4}[a.componentType],read={5121:'getUint8',5123:'getUint16',5125:'getUint32',5126:'getFloat32'}[a.componentType];if(!read||a.sparse)throw Error('Unsupported building accessor');return {count:a.count,get:(i,c=0)=>v[read](binary+(b.byteOffset??0)+(a.byteOffset??0)+i*(b.byteStride??size*bytes)+c*bytes,true)};}
 const result=[],angle=(definition.bearing??90)*Math.PI/180,s=Math.sin(angle),c=Math.cos(angle),footprint={min:[Infinity,Infinity],max:[-Infinity,-Infinity]},bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 function visit(index,parent){const node=json.nodes[index],m=multiply(parent,nodeMatrix(node));if(node.mesh!==undefined)for(const p of json.meshes[node.mesh].primitives){if((p.mode??4)!==4)throw Error('Expected triangles');const positions=accessor(p.attributes.POSITION),normals=accessor(p.attributes.NORMAL),indices=p.indices===undefined?null:accessor(p.indices),count=indices?.count??positions.count;const material=json.materials?.[p.material],gray=material?.pbrMetallicRoughness?.baseColorFactor?.[0]??.53,shade=.48+gray*.95;const a=m.slice(0,3),b=m.slice(4,7),d=m.slice(8,11),co=[cross(b,d),cross(d,a),cross(a,b)];
  for(let i=0;i<count;i++){const k=indices?indices.get(i):i,pos=[0,1,2].map(j=>positions.get(k,j)),normal=[0,1,2].map(j=>normals.get(k,j));const q=[0,1,2].map(r=>m[r]*pos[0]+m[4+r]*pos[1]+m[8+r]*pos[2]+m[12+r]);[q[0],q[2]].forEach((x,j)=>{footprint.min[j]=Math.min(footprint.min[j],x);footprint.max[j]=Math.max(footprint.max[j],x)});const n=[0,1,2].map(r=>co[0][r]*normal[0]+co[1][r]*normal[1]+co[2][r]*normal[2]);const len=Math.hypot(...n)||1,xyz=[q[0]*s+q[2]*c,-q[0]*c+q[2]*s,q[1]],norm=[(n[0]*s+n[2]*c)/len,(-n[0]*c+n[2]*s)/len,n[1]/len];xyz.forEach((x,j)=>{bounds.min[j]=Math.min(bounds.min[j],x);bounds.max[j]=Math.max(bounds.max[j],x)});result.push(...xyz,...norm,shade);}
 }for(const child of node.children??[])visit(child,m);}
 const scene=json.scenes?.[json.scene??0];if(!scene)throw Error('Missing GLB scene');for(const root of scene.nodes)visit(root,identity());
 // Land the authored base on the map; horizontal origin remains its supplied GPS anchor.
 for(let i=2;i<result.length;i+=7)result[i]-=bounds.min[2];bounds.max[2]-=bounds.min[2];bounds.min[2]=0;
 if(!result.length||!result.every(Number.isFinite))throw Error('Invalid building geometry');return {vertices:new Float32Array(result),count:result.length/7,bounds,footprint};
}
const empty=()=>({type:'FeatureCollection',features:[]});
const polygons=f=>f.geometry?.type==='Polygon'?[f.geometry.coordinates]:f.geometry?.type==='MultiPolygon'?f.geometry.coordinates:[];
export function pointInRing(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function buildingContains(model,coordinate){const x=(coordinate[0]-model.center[0])*111320*Math.cos(model.center[1]*Math.PI/180),y=-(coordinate[1]-model.center[1])*111320;const a=model.bearing*Math.PI/180,u=x*Math.sin(a)-y*Math.cos(a),v=x*Math.cos(a)+y*Math.sin(a),f=model.footprint;return u>=f.min[0]-2&&u<=f.max[0]+2&&v>=f.min[1]-2&&v<=f.max[1]+2;}
export function replacementBuildingSurfaces(features,models){
 const active=models.filter(m=>m.count&&m.bounds),hidden=new Set(),parts=[];
 for(const f of features){const pieces=polygons(f).map(coordinates=>{const ring=coordinates[0],center=ring.slice(0,-1).reduce((a,p)=>[a[0]+p[0]/(ring.length-1),a[1]+p[1]/(ring.length-1)],[0,0]);const replaced=active.some(m=>buildingContains(m,center)||ring.some(p=>buildingContains(m,p))||pointInRing(m.center,ring));return {coordinates,replaced};});if(pieces.some(p=>p.replaced)&&f.id!==undefined)hidden.add(f.id);parts.push({f,pieces});}
 // Vector tiles merge unrelated buildings into MultiPolygons. Restore every
 // untouched polygon sharing a hidden feature ID instead of erasing its neighbors.
 const seen=new Set(),data=empty();for(const {f,pieces} of parts)if(hidden.has(f.id))for(const p of pieces)if(!p.replaced){const key=JSON.stringify(p.coordinates);if(seen.has(key))continue;seen.add(key);data.features.push({type:'Feature',properties:{...f.properties},geometry:{type:'Polygon',coordinates:p.coordinates}});}
 return {ids:[...hidden].sort((a,b)=>a-b),data};
}
function load(url){return new Promise((resolve,reject)=>{const r=new XMLHttpRequest();r.open('GET',url,true);r.responseType='arraybuffer';r.onload=()=>r.status===0||r.status>=200&&r.status<300?resolve(r.response):reject(Error(`Building asset HTTP ${r.status}`));r.onerror=()=>reject(Error('Building asset unavailable'));r.send();});}
export function createBuildingModelLayer(maplibre){
 const models=PORTLAND_BUILDING_MODELS.map(d=>({...d,count:0}));let inFlight=0;
 return {id:'portland-building-models',type:'custom',renderingMode:'3d',models,
  update(features){this.features=features;this.syncSurfaces();},
  surfaceFeatures(){return this.sceneFeatures??this.features??[];},
  syncSurfaces(){if(!this.map||!this.original)return;const {ids,data}=replacementBuildingSurfaces(this.features??[],this.map.getZoom()>=BUILDING_MODEL_MIN_ZOOM?models:[]),key=JSON.stringify([ids,data]);
   const hidden=new Set(ids);this.sceneFeatures=[...(this.features??[]).filter(f=>!hidden.has(f.id)),...data.features];
   for(const m of models.filter(m=>m.count&&m.footprint&&this.map.getZoom()>=BUILDING_MODEL_MIN_ZOOM)){const a=m.bearing*Math.PI/180,s=Math.sin(a),c=Math.cos(a),f=m.footprint,ring=[[f.min[0],f.min[1]],[f.max[0],f.min[1]],[f.max[0],f.max[1]],[f.min[0],f.max[1]]].map(([x,z])=>[m.center[0]+(x*s+z*c)/(111320*Math.cos(m.center[1]*Math.PI/180)),m.center[1]-(-x*c+z*s)/111320]);ring.push(ring[0]);this.sceneFeatures.push({type:'Feature',properties:{render_height:m.bounds.max[2]},geometry:{type:'Polygon',coordinates:[ring]}});}
  if(key===this.surfaceKey)return;this.surfaceKey=key;
  // New tile fragments can change the remainder geometry without changing which
  // vector features are replaced. Refiltering those tiles triggers another parse.
  const filterKey=JSON.stringify(ids);
  if(filterKey!==this.filterKey){this.filterKey=filterKey;for(const layer of this.original){const filter=ids.length?['all',layer.filter??true,['!', ['in',['id'],['literal',ids]]]]:layer.filter;this.map.setFilter(layer.id,filter);}}this.map.getSource('landmark-building-remainders')?.setData(data);},
  async loadModel(model){if(model.loading||model.count||inFlight>=2||this.disposed||model.failed)return;model.loading=true;inFlight++;try{const parsed=parseBuildingGlb(await load(model.url),model);if(this.disposed)return;Object.assign(model,parsed);this.syncSurfaces();this.map.triggerRepaint();}catch(e){model.failed=true;console.warn(model.id,e);}finally{model.loading=false;inFlight--;this.map?.triggerRepaint();}},
  onAdd(map,gl){this.map=map;this.disposed=false;this.original=['skyline','buildings'].map(id=>structuredClone(map.getStyle().layers.find(l=>l.id===id))).filter(Boolean);map.addSource('landmark-building-remainders',{type:'geojson',data:empty()});for(const layer of this.original){const copy={...layer,id:layer.id+'-landmark-remainders',source:'landmark-building-remainders'};delete copy['source-layer'];delete copy.filter;map.addLayer(copy,layer.id);}
   const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;};
   const vs=shader(gl.VERTEX_SHADER,`#version 300 es\nin vec3 a_position;in vec3 a_normal;in float a_shade;uniform mat4 u_matrix;out vec3 v_normal;out float v_shade;void main(){gl_Position=u_matrix*vec4(a_position,1.);v_normal=a_normal;v_shade=a_shade;}`),color=[1,3,5].map(i=>parseInt(BUILDING_FILL.slice(i,i+2),16)/255);
   const fs=shader(gl.FRAGMENT_SHADER,`#version 300 es\nprecision highp float;in vec3 v_normal;in float v_shade;out vec4 color;void main(){vec3 n=normalize(v_normal);float light=.64+.36*max(dot(n,normalize(vec3(-.42,.28,.86))),0.);vec3 base=vec3(${color.join(',')});color=vec4(base*(light*v_shade+.06*pow(1.-abs(n.z),3.))*.98,.98);}`);this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));this.matrix=gl.getUniformLocation(this.program,'u_matrix');},
  render(gl,input){const detail=this.map.getZoom()>=BUILDING_MODEL_MIN_ZOOM;if(detail!==this.detail){this.detail=detail;this.syncSurfaces();}if(!detail)return;const canvas=this.map.getCanvas(),visible=models.filter(m=>{const p=this.map.project(m.center);return p.x>-350&&p.y>-350&&p.x<canvas.clientWidth+350&&p.y<canvas.clientHeight+350});for(const m of visible)if(!m.count)this.loadModel(m);
   const cull=gl.isEnabled(gl.CULL_FACE),blend=gl.isEnabled(gl.BLEND),depth=gl.isEnabled(gl.DEPTH_TEST),mask=gl.getParameter(gl.DEPTH_WRITEMASK),func=gl.getParameter(gl.DEPTH_FUNC),src=gl.getParameter(gl.BLEND_SRC_RGB),dst=gl.getParameter(gl.BLEND_DST_RGB),srcA=gl.getParameter(gl.BLEND_SRC_ALPHA),dstA=gl.getParameter(gl.BLEND_DST_ALPHA);gl.disable(gl.CULL_FACE);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.program);
   for(const m of visible.filter(m=>m.count)){if(!m.buffer){m.buffer=gl.createBuffer();m.vao=gl.createVertexArray();gl.bindVertexArray(m.vao);gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.bufferData(gl.ARRAY_BUFFER,m.vertices,gl.STATIC_DRAW);for(const [name,size,offset] of [['a_position',3,0],['a_normal',3,12],['a_shade',1,24]]){const loc=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,28,offset);}m.vertices=null;}
    const origin=maplibre.MercatorCoordinate.fromLngLat(m.center),unit=origin.meterInMercatorCoordinateUnits(),matrix=input.defaultProjectionData.mainMatrix,local=new Float32Array(16);for(let r=0;r<4;r++){local[r]=matrix[r]*unit;local[r+4]=matrix[r+4]*unit;local[r+8]=matrix[r+8]*unit;local[r+12]=matrix[r]*origin.x+matrix[r+4]*origin.y+matrix[r+12];}gl.bindVertexArray(m.vao);gl.uniformMatrix4fv(this.matrix,false,local);gl.drawArrays(gl.TRIANGLES,0,m.count);}
   if(cull)gl.enable(gl.CULL_FACE);if(!blend)gl.disable(gl.BLEND);if(!depth)gl.disable(gl.DEPTH_TEST);gl.depthMask(mask);gl.depthFunc(func);gl.blendFuncSeparate(src,dst,srcA,dstA);gl.bindVertexArray(null);
  },
  onRemove(map,gl){this.disposed=true;for(const layer of this.original??[]){if(map.getLayer(layer.id))map.setFilter(layer.id,layer.filter);if(map.getLayer(layer.id+'-landmark-remainders'))map.removeLayer(layer.id+'-landmark-remainders');}if(map.getSource('landmark-building-remainders'))map.removeSource('landmark-building-remainders');for(const m of models){if(m.buffer)gl.deleteBuffer(m.buffer);if(m.vao)gl.deleteVertexArray(m.vao);}gl.deleteProgram(this.program);this.map=null;}
 };
}
