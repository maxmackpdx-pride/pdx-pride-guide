const COARSE_POINTER=matchMedia('(pointer:coarse)').matches;
const DEVICE_MEMORY=Number(navigator.deviceMemory)||0;
const CPU_CORES=Number(navigator.hardwareConcurrency)||4;
const LOW_POWER=COARSE_POINTER&&((DEVICE_MEMORY>0&&DEVICE_MEMORY<=4)||CPU_CORES<=4);
// Keep mobile comfortably below general-purpose 3D point limits. The full
// canopy remains a cheap flat layer while only a smaller height-prioritized
// subset becomes individual WebGL trees at close zoom.
const MAX_CANOPIES=COARSE_POINTER?(LOW_POWER?4150:4650):6350;
const MAX_TREE_MODELS=COARSE_POINTER?(LOW_POWER?3750:4150):5350;
const PARK_CLASSES=new Set(['park','recreation_ground','cemetery','grass']);
const WOOD_CLASSES=new Set(['wood','forest','scrub']);
const TREE_ROAD_CLASSES=new Set(['minor','service','path']);

function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

function smoothRange(a,b,value){
 const x=clamp((value-a)/(b-a),0,1);
 return x*x*x*(x*(x*6-15)+10);
}

function hash(value){
 let h=2166136261;
 for(const character of String(value)){h^=character.charCodeAt(0);h=Math.imul(h,16777619);}
 return (h>>>0)/4294967295;
}

function pointInRing(point,ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];
  if(((a[1]>point[1])!==(b[1]>point[1]))&&(point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1]||1e-12)+a[0]))inside=!inside;
 }
 return inside;
}

function pointInPolygon(point,rings){
 if(!rings?.length||!pointInRing(point,rings[0]))return false;
 for(let index=1;index<rings.length;index++)if(pointInRing(point,rings[index]))return false;
 return true;
}

function polygons(feature){
 const geometry=feature?.geometry;
 if(geometry?.type==='Polygon')return [geometry.coordinates];
 if(geometry?.type==='MultiPolygon')return geometry.coordinates;
 return [];
}

function lines(feature){
 const geometry=feature?.geometry;
 if(geometry?.type==='LineString')return [geometry.coordinates];
 if(geometry?.type==='MultiLineString')return geometry.coordinates;
 return [];
}

function spacingForZoom(zoom){
 if(zoom<11.5)return 360;
 if(zoom<13.5)return 155;
 if(zoom<14.4)return 76;
 return COARSE_POINTER?42:32;
}

function inCity([lng,lat]){
 return lng>-122.698&&lng<-122.655&&lat>45.508&&lat<45.538;
}

function addTree(points,seen,coordinate,seed,kind,water){
 if(points.length>=MAX_CANOPIES||inCity(coordinate))return;
 if(water?.some(rings=>pointInPolygon(coordinate,rings)))return;
 const key=`${coordinate[0].toFixed(6)}:${coordinate[1].toFixed(6)}`;
 if(seen.has(key))return;seen.add(key);
 const forest=kind==='wood';
 // Portland's park inventory is roughly 27% Douglas-fir. Forest polygons
 // lean more heavily evergreen; street corridors lean broadleaf.
 const evergreenShare=forest?.62:kind==='park'?.27:.14;
 const evergreen=hash(`${seed}:family`)<evergreenShare;
 const height=forest?15+hash(`${seed}:height`)*24:kind==='park'?8+hash(`${seed}:height`)*25:6+hash(`${seed}:height`)*17;
 points.push({type:'Feature',properties:{key,kind,tone:Math.floor(hash(`${seed}:tone`)*3),scale:.78+hash(`${seed}:scale`)*.48,height,type:evergreen?1:0,rotation:hash(`${seed}:rotation`)},geometry:{type:'Point',coordinates:coordinate}});
}

function samplePolygon(rings,spacingMeters,density,kind,points,seen,water){
 const outer=rings[0];if(!outer?.length)return;
 let west=Infinity,south=Infinity,east=-Infinity,north=-Infinity;
 for(const coordinate of outer){west=Math.min(west,coordinate[0]);east=Math.max(east,coordinate[0]);south=Math.min(south,coordinate[1]);north=Math.max(north,coordinate[1]);}
 const middleLatitude=(south+north)/2;
 const latitudeStep=spacingMeters/111320;
 const longitudeStep=spacingMeters/(111320*Math.max(.25,Math.cos(middleLatitude*Math.PI/180)));
 const columnStart=Math.floor(west/longitudeStep),columnEnd=Math.ceil(east/longitudeStep);
 const rowStart=Math.floor(south/latitudeStep),rowEnd=Math.ceil(north/latitudeStep);
 for(let row=rowStart;row<=rowEnd&&points.length<MAX_CANOPIES;row++)for(let column=columnStart;column<=columnEnd&&points.length<MAX_CANOPIES;column++){
  const seed=`${kind}:${column}:${row}:${Math.round(spacingMeters)}`;
  if(hash(`${seed}:density`)>density)continue;
  const longitude=(column+.16+hash(`${seed}:x`)*.68)*longitudeStep;
  const latitude=(row+.16+hash(`${seed}:y`)*.68)*latitudeStep;
  const coordinate=[longitude,latitude];
  if(pointInPolygon(coordinate,rings))addTree(points,seen,coordinate,seed,kind,water);
 }
}

function distanceMeters(a,b){
 const latitude=(a[1]+b[1])*.5*Math.PI/180;
 return 111320*Math.hypot((b[0]-a[0])*Math.cos(latitude),b[1]-a[1]);
}

function offsetMeters([longitude,latitude],east,north){
 return [longitude+east/(111320*Math.max(.25,Math.cos(latitude*Math.PI/180))),latitude+north/111320];
}

function sampleStreetLine(line,points,seen,water){
 if(line.length<2)return;
 const spacing=LOW_POWER?92:COARSE_POINTER?72:58;
 for(let index=1;index<line.length&&points.length<MAX_CANOPIES;index++){
  const a=line[index-1],b=line[index],length=distanceMeters(a,b);if(length<20)continue;
  const count=Math.floor(length/spacing),dx=b[0]-a[0],dy=b[1]-a[1],magnitude=Math.hypot(dx*Math.cos(a[1]*Math.PI/180),dy)||1;
  const normalEast=-dy/magnitude,normalNorth=dx*Math.cos(a[1]*Math.PI/180)/magnitude;
  for(let step=1;step<=count&&points.length<MAX_CANOPIES;step++){
   const t=(step-.28+hash(`${a[0]}:${a[1]}:${index}:${step}`)*.56)/(count+1);
   const center=[a[0]+dx*t,a[1]+dy*t],seed=`street:${a[0].toFixed(5)}:${a[1].toFixed(5)}:${index}:${step}`;
   if(hash(`${seed}:keep`)>.72)continue;
   const side=hash(`${seed}:side`)>.5?1:-1,offset=(7.5+hash(`${seed}:offset`)*4)*side;
   addTree(points,seen,offsetMeters(center,normalEast*offset,normalNorth*offset),seed,'street',water);
  }
 }
}

function classifiedFeatures(map,sourceLayer,classes){
 try{return map.querySourceFeatures('terrain',{sourceLayer}).filter(feature=>classes.has(String(feature.properties?.class||feature.properties?.subclass||'').toLowerCase()));}
 catch{return [];}
}

function canopyCollection(map){
 const zoom=map.getZoom(),spacing=spacingForZoom(zoom),points=[],seen=new Set(),unique=new Set();
 let water=[];
 try{water=map.querySourceFeatures('terrain',{sourceLayer:'water'}).flatMap(feature=>polygons(feature));}catch{}
 const woodland=classifiedFeatures(map,'landcover',WOOD_CLASSES);
 const parks=classifiedFeatures(map,'landuse',PARK_CLASSES);
 for(const [features,density,kind] of [[woodland,.94,'wood'],[parks,.63,'park']])for(const feature of features){
  for(const rings of polygons(feature)){
   const signature=JSON.stringify(rings[0]?.slice(0,6));if(unique.has(signature))continue;unique.add(signature);
   samplePolygon(rings,spacing,density,kind,points,seen,water);
  }
 }
 // Portland's published inventory includes more than 250,000 mapped street
 // trees. Sample only real minor/service/path geometry, only when close, and
 // keep it below the same mobile vertex budget as parks and forests.
 if(zoom>=14.4)for(const feature of classifiedFeatures(map,'transportation',TREE_ROAD_CLASSES)){
  for(const line of lines(feature))sampleStreetLine(line,points,seen,water);
  if(points.length>=MAX_CANOPIES)break;
 }
 return {type:'FeatureCollection',features:points};
}

function createTreeLayer(maplibre){
 const origin=maplibre.MercatorCoordinate.fromLngLat([-122.676,45.523]);
 const unit=origin.meterInMercatorCoordinateUnits();
 const compile=(gl,type,source)=>{
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
  return shader;
 };
 const link=(gl,vertexSource,fragmentSource)=>{
  const vertex=compile(gl,gl.VERTEX_SHADER,vertexSource),fragment=compile(gl,gl.FRAGMENT_SHADER,fragmentSource),program=gl.createProgram();
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));return program;
 };
 return {
  id:'nature-tree-models',type:'custom',renderingMode:'3d',count:0,trunkCount:0,
  update(features){
   const crowns=[],trunks=[];
   const models=features.length>MAX_TREE_MODELS?[...features].sort((a,b)=>Number(b.properties.height)-Number(a.properties.height)).slice(0,MAX_TREE_MODELS):features;
   for(const feature of models){
    const coordinate=feature.geometry.coordinates,height=Number(feature.properties.height)||12,type=Number(feature.properties.type)||0;
    const crownCenter=height*(type?.66:.72),diameter=height*(type?.62:.84)*(Number(feature.properties.scale)||1);
    const base=maplibre.MercatorCoordinate.fromLngLat(coordinate,0),top=maplibre.MercatorCoordinate.fromLngLat(coordinate,crownCenter),trunkTop=maplibre.MercatorCoordinate.fromLngLat(coordinate,height*(type?.53:.48));
    const tone=Number(feature.properties.tone)||0,seed=Number(feature.properties.rotation)||0;
    crowns.push((top.x-origin.x)/unit,(top.y-origin.y)/unit,top.z/unit,height,diameter,tone,type,seed);
    trunks.push((base.x-origin.x)/unit,(base.y-origin.y)/unit,base.z/unit,tone,(trunkTop.x-origin.x)/unit,(trunkTop.y-origin.y)/unit,trunkTop.z/unit,tone);
   }
   this.crownVertices=new Float32Array(crowns);this.trunkVertices=new Float32Array(trunks);this.map?.triggerRepaint();
  },
  onAdd(map,gl){
   this.map=map;
   this.crownProgram=link(gl,`#version 300 es
    in vec3 a_position;in vec4 a_props;in float a_seed;
    uniform mat4 u_matrix;uniform float u_mpp;uniform float u_dpr;uniform float u_min_height;
    out vec4 v_props;out float v_seed;
    void main(){
     gl_Position=u_matrix*vec4(a_position,1.);v_props=a_props;v_seed=a_seed;
     float visible=step(u_min_height,a_props.x)*step(.0,gl_Position.w);
     gl_PointSize=visible*clamp(a_props.y/u_mpp*u_dpr,1.,80.*u_dpr);
    }`,`#version 300 es
    precision highp float;in vec4 v_props;in float v_seed;uniform float u_alpha;out vec4 color;
    float bump(float angle){return .78+.075*sin(angle*3.+v_seed*19.)+.055*sin(angle*5.-v_seed*31.)+.035*sin(angle*8.+v_seed*47.);}
    void main(){
     vec2 p=gl_PointCoord*2.-1.;p.x+=.045*sin(v_seed*37.);
     float type=v_props.w,mask=0.,detail=0.;
     if(type<.5){
      float angle=atan(p.y,p.x),radius=length(p*vec2(1.02,.94));
      float edge=bump(angle);mask=1.-smoothstep(edge-.045,edge+.025,radius);
      detail=.5+.5*sin((p.x*2.7+p.y*3.2+v_seed*11.)*5.)*sin((p.y-v_seed)*7.);
     }else{
      float y=(1.-p.y)*.5,tier=.065*sin(y*42.+v_seed*12.);
      float width=(1.-y)*.72+.13+tier;
      float cone=1.-smoothstep(width-.035,width+.025,abs(p.x));
      float cap=step(-.94,p.y)*step(p.y,.93);mask=cone*cap;
      detail=.45+.55*sin((p.y+v_seed)*35.)*sin((p.x-v_seed)*9.);
     }
     if(mask<.015)discard;
     vec3 broad0=vec3(.035,.16,.135),broad1=vec3(.075,.29,.235),broad2=vec3(.12,.36,.285);
     vec3 fir0=vec3(.018,.11,.105),fir1=vec3(.035,.22,.19),fir2=vec3(.07,.30,.245);
     vec3 base=type<.5?mix(broad0,broad1,clamp(v_props.z*.38,0.,1.)):mix(fir0,fir1,clamp(v_props.z*.36,0.,1.));
     vec3 lit=type<.5?broad2:fir2;
     float light=clamp((p.y-p.x)*.24+.36+detail*.10,0.,1.);
     vec3 rgb=mix(base,lit,light);
     color=vec4(rgb,mask*u_alpha);
    }`);
   this.trunkProgram=link(gl,`#version 300 es
    in vec3 a_position;in float a_tone;uniform mat4 u_matrix;uniform float u_alpha;out float v_tone;out float v_alpha;
    void main(){gl_Position=u_matrix*vec4(a_position,1.);v_tone=a_tone;v_alpha=u_alpha;}
   `,`#version 300 es
    precision highp float;in float v_tone;in float v_alpha;out vec4 color;
    void main(){color=vec4(mix(vec3(.13,.085,.065),vec3(.22,.15,.10),v_tone*.35),v_alpha*.92);}
   `);
   this.crownUniforms=Object.fromEntries(['u_matrix','u_mpp','u_dpr','u_min_height','u_alpha'].map(name=>[name,gl.getUniformLocation(this.crownProgram,name)]));
   this.trunkUniforms=Object.fromEntries(['u_matrix','u_alpha'].map(name=>[name,gl.getUniformLocation(this.trunkProgram,name)]));
   this.crownBuffer=gl.createBuffer();this.trunkBuffer=gl.createBuffer();this.crownVao=gl.createVertexArray();this.trunkVao=gl.createVertexArray();
   gl.bindVertexArray(this.crownVao);gl.bindBuffer(gl.ARRAY_BUFFER,this.crownBuffer);
   for(const [name,size,offset] of [['a_position',3,0],['a_props',4,12],['a_seed',1,28]]){const attribute=gl.getAttribLocation(this.crownProgram,name);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,size,gl.FLOAT,false,32,offset);}
   gl.bindVertexArray(this.trunkVao);gl.bindBuffer(gl.ARRAY_BUFFER,this.trunkBuffer);
   for(const [name,size,offset] of [['a_position',3,0],['a_tone',1,12]]){const attribute=gl.getAttribLocation(this.trunkProgram,name);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,size,gl.FLOAT,false,16,offset);}
   gl.bindVertexArray(null);
  },
  render(gl,input){
   if(this.crownVertices){gl.bindBuffer(gl.ARRAY_BUFFER,this.crownBuffer);gl.bufferData(gl.ARRAY_BUFFER,this.crownVertices,gl.STATIC_DRAW);this.count=this.crownVertices.length/8;this.crownVertices=null;}
   if(this.trunkVertices){gl.bindBuffer(gl.ARRAY_BUFFER,this.trunkBuffer);gl.bufferData(gl.ARRAY_BUFFER,this.trunkVertices,gl.STATIC_DRAW);this.trunkCount=this.trunkVertices.length/4;this.trunkVertices=null;}
   if(!this.count)return;
   const matrix=input.defaultProjectionData.mainMatrix,local=new Float32Array(16);
   for(let row=0;row<4;row++){local[row]=matrix[row]*unit;local[4+row]=matrix[4+row]*unit;local[8+row]=matrix[8+row]*unit;local[12+row]=matrix[row]*origin.x+matrix[4+row]*origin.y+matrix[12+row];}
   const zoom=this.map.getZoom(),center=this.map.getCenter(),metersPerPixel=40075016.686*Math.cos(center.lat*Math.PI/180)/(512*Math.pow(2,zoom));
   const alpha=smoothRange(12.75,14.15,zoom),minimum=clamp(38-(zoom-12.75)/5*34,4,38),dpr=gl.drawingBufferWidth/this.map.getCanvas().clientWidth;
   if(alpha<=.002)return;
   const blend=gl.isEnabled(gl.BLEND),depthMask=gl.getParameter(gl.DEPTH_WRITEMASK);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);
   gl.useProgram(this.trunkProgram);gl.bindVertexArray(this.trunkVao);gl.uniformMatrix4fv(this.trunkUniforms.u_matrix,false,local);gl.uniform1f(this.trunkUniforms.u_alpha,alpha);gl.drawArrays(gl.LINES,0,this.trunkCount);
   gl.useProgram(this.crownProgram);gl.bindVertexArray(this.crownVao);gl.uniformMatrix4fv(this.crownUniforms.u_matrix,false,local);gl.uniform1f(this.crownUniforms.u_mpp,metersPerPixel);gl.uniform1f(this.crownUniforms.u_dpr,dpr);gl.uniform1f(this.crownUniforms.u_min_height,minimum);gl.uniform1f(this.crownUniforms.u_alpha,alpha);gl.drawArrays(gl.POINTS,0,this.count);
   gl.bindVertexArray(null);gl.depthMask(depthMask);if(!blend)gl.disable(gl.BLEND);
  },
  onRemove(map,gl){
   gl.deleteBuffer(this.crownBuffer);gl.deleteBuffer(this.trunkBuffer);gl.deleteVertexArray(this.crownVao);gl.deleteVertexArray(this.trunkVao);gl.deleteProgram(this.crownProgram);gl.deleteProgram(this.trunkProgram);
   this.map=null;this.count=0;this.trunkCount=0;
  }
 };
}

export function createMapNature(map,maplibre){
 let disposed=false,lastSignature='',refreshFrame=0;
 const treeLayer=createTreeLayer(maplibre);
 function refresh(){
  refreshFrame=0;if(disposed||!map.getLayer(treeLayer.id)||!map.isSourceLoaded('terrain'))return;
  const collection=canopyCollection(map);
  const signature=collection.features.map(feature=>feature.properties.key).join('|');
  if(signature===lastSignature)return;lastSignature=signature;
  treeLayer.update(collection.features);
 }
 function queueRefresh(){if(!refreshFrame)refreshFrame=requestAnimationFrame(refresh);}
 function add(){
  if(map.getLayer(treeLayer.id))return;
  map.addLayer(treeLayer,'skyline');
  map.on('idle',queueRefresh);map.on('moveend',queueRefresh);queueRefresh();
 }
 return {add,dispose(){disposed=true;cancelAnimationFrame(refreshFrame);map.off('idle',queueRefresh);map.off('moveend',queueRefresh);}};
}
