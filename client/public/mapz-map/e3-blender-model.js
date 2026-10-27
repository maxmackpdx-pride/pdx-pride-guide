import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// This is the exported Blender mesh, not a video/sprite reconstruction. The
// caller owns venue grouping, same-day eligibility, LOD thresholds and layout.
export const E3_BLENDER_URL=new URL('./models/holograms/e3-blender-morph.glb',import.meta.url).href;
export const E3_BLENDER_STAGES=['mini','waypoint','compressed','coin','vortex','stack'];
export const E3_BLENDER_MORPHS=['Full waypoint','Compressed','Logo coin','Single vortex','Double stack'];
const HEIGHT=[0,0,4.02,4.3,4.6,5.05],RADIUS=[0,0,.48,.60,.75,.90];
const HOVER={
 'Upper poster independent hover':[.043,0],
 'Lower poster independent hover':[.039,2.3],
 'Upper poster hover attachment':[.043,0],
 'Ring 1 independent hover':[.055,1.1],
 'Ring 2 independent hover':[.047,3.5],
 'Ring 3 independent hover':[.052,4.3],
 'Ring 4 independent hover':[.061,5.2],
};
const clamp=value=>Math.max(0,Math.min(5,value));
export function blenderStageWeights(stage){
 const value=clamp(stage),lower=Math.floor(value),fraction=value-lower;
 return E3_BLENDER_MORPHS.map((_,i)=>i+1===lower?1-fraction:i+1===lower+1?fraction:0);
}
function interpolate(values,stage){const n=clamp(stage),i=Math.floor(n);return values[i]+((values[Math.min(5,i+1)]??values[i])-values[i])*(n-i);}
// Venue logo faces. Measured from the Blender shapes (glTF Y-up, front is +Z), per stage 0..5:
// center height, the box the logo must fit inside, and how visible it is. The coin and the compressed puck
// replace the generic Z mark; the vortex and the double stack carry it on their screens.
// Stage 1 (waypoint pin) keeps the venue-type icon. The second plane is the lower screen of the double stack.
const LOGO_FACE_Z=.095;
const LOGO_MAIN={y:[3.77,3.79,4.25,4.30,3.98,4.78],w:[0,0,.34,.78,.98,.98],h:[0,0,.34,.78,.7,.7],a:[0,0,1,1,1,1]};
const LOGO_LOWER={y:[3.03,3.03,3.03,3.03,3.03,1.29],w:[0,0,0,0,0,.98],h:[0,0,0,0,0,.7],a:[0,0,0,0,0,1]};
export function blenderLogoFace(table,stage,aspect=1){
 const y=interpolate(table.y,stage),boxW=interpolate(table.w,stage),boxH=interpolate(table.h,stage),opacity=interpolate(table.a,stage);
 const width=Math.min(boxW,boxH*Math.max(.05,aspect)),height=width/Math.max(.05,aspect);
 return {y,width,height,opacity};
}
function radialTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'#ffffff');g.addColorStop(.2,'#ffffff88');g.addColorStop(1,'#ffffff00');
 ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(canvas);
}
export function createBlenderHologram(template,{color='#FF00CC',phase=0,logo=null}={}){
 const object=template.clone(true),meshes=[],particles=[],materials=new Set(),groundTexture=radialTexture();
 let iconMaterial=null;
 const tint=new THREE.Color(color);
 object.traverse(node=>{
  if(!node.isMesh)return;
  const role=node.userData.mapzRole||'outline';
  const white=role==='icon'||role==='particle';
  const opacity={outline:.9,'ring-fill':.095,beam:.025,panel:.32,icon:1,particle:.85,ground:.5}[role]??1;
  const material=new THREE.MeshBasicMaterial({color:role==='panel'?0x000000:white?0xffffff:tint,
   transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
   blending:role==='beam'||role==='particle'?THREE.AdditiveBlending:THREE.NormalBlending,
   map:role==='ground'?groundTexture:null});
  node.material=material;node.frustumCulled=false;
  node.renderOrder=role==='beam'?0:role==='panel'?1:role==='ring-fill'?2:3;
  materials.add(material);meshes.push(node);
  if(role==='particle')particles.push(node);
  if(role==='icon')iconMaterial=material;
 });
 // Venue logo on the coin faces and the screens. Falls back to the model's own mark when there is no logo.
 const logoPlanes=[LOGO_MAIN,LOGO_LOWER].map(table=>{
  const material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,color:0xffffff});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
  mesh.frustumCulled=false;mesh.renderOrder=4;mesh.visible=false;mesh.position.z=LOGO_FACE_Z;object.add(mesh);
  return {table,mesh,material};
 });
 let logoKey=null,logoTexture=null,logoAspect=1;
 function setLogo(next){
  const key=next?next.key??next.image:null;
  if(key===logoKey)return;
  logoKey=key;
  if(logoTexture){logoTexture.dispose();logoTexture=null;}
  if(next?.image&&next.width>0&&next.height>0){
   logoTexture=new THREE.CanvasTexture(next.image);logoTexture.colorSpace=THREE.SRGBColorSpace;logoTexture.anisotropy=4;
   logoAspect=next.width/next.height;
  }
  for(const plane of logoPlanes){plane.material.map=logoTexture;plane.material.needsUpdate=true;}
 }
 setLogo(logo);
 let stage=0;
 return {object,
  setColor(value){tint.set(value);for(const node of meshes)if(!['panel','icon','particle'].includes(node.userData.mapzRole))node.material.color.copy(tint);},
  setLogo,
  get hasLogo(){return Boolean(logoTexture);},
  setStage(value){stage=typeof value==='string'?Math.max(0,E3_BLENDER_STAGES.indexOf(value)):clamp(value);},
  // elapsed is seconds of active map time. The map host pauses this clock when
  // hidden and passes reduced=true for Calm Mode. Hover frequencies come from
  // the Blender shape-key drivers; each part moves independently.
  update(elapsed=0,reduced=false){
   const weights=blenderStageWeights(stage),frame=elapsed*24,hover=stage<3?0:Math.min(1,stage-3);
   for(const node of meshes){
    if(!node.morphTargetInfluences)continue;
    for(const [name,index] of Object.entries(node.morphTargetDictionary||{})){
     const state=E3_BLENDER_MORPHS.indexOf(name),motion=HOVER[name];
     node.morphTargetInfluences[index]=state>=0?weights[state]:motion&&!reduced?
      hover*(.82*Math.sin(frame*motion[0]+motion[1]+phase)+.18*Math.sin(frame*motion[0]*1.9+motion[1]+.6+phase)):0;
    }
   }
   let logoMix=0;
   for(const plane of logoPlanes){
    const face=logoTexture?blenderLogoFace(plane.table,stage,logoAspect):null;
    plane.mesh.visible=Boolean(face)&&face.opacity>.01&&face.width>.01;
    if(!face)continue;
    plane.mesh.position.y=face.y;plane.mesh.scale.set(face.width,face.height,1);plane.material.opacity=face.opacity;
    if(plane.table===LOGO_MAIN)logoMix=face.opacity;
   }
   // The generic mark gives way to the logo; with no logo it stays.
   if(iconMaterial)iconMaterial.opacity=1-logoMix;
   const h=interpolate(HEIGHT,stage),r=interpolate(RADIUS,stage);
   particles.forEach((node,k)=>{
    node.visible=h>.1;
    const t=((reduced?0:elapsed/9.625)+k/20)%1,angle=k*2.39996+phase;
    // glTF is Y-up; the wrapper is rotated once into the map's Z-up frame.
    node.position.set(Math.cos(angle)*r*t*.72,t*h+.06,-Math.sin(angle)*r*t*.72);
   });
  },
  dispose(){for(const material of materials)material.dispose();groundTexture.dispose();logoTexture?.dispose();for(const plane of logoPlanes){plane.material.dispose();plane.mesh.geometry.dispose();}}
 };
}

// A self-contained custom layer adapter for Claude's map wiring. It shares the
// map's existing WebGL context and geographic depth; it creates no second canvas.
// No production code imports this until the wiring owner opts in.
export function createE3BlenderLayer(maplibre,{url=E3_BLENDER_URL,onReady=()=>{},onError=()=>{},maxVisible=3}={}){
 let map,renderer,scene,camera,template,origin,unit=1,disposed=false,rows=[],elapsed=0;
 const instances=new Map(),matrix=new THREE.Matrix4(),local=new THREE.Matrix4();
 const layer={id:'mapz-blender-holograms',type:'custom',renderingMode:'3d',
  setVenues(next){rows=next.slice(0,maxVisible);sync();map?.triggerRepaint();},
  setMotion({seconds=0,reduced=false,active=true}={}){elapsed=seconds;layer.reduced=reduced;layer.active=active;if(active)map?.triggerRepaint();},
  ready:false,active:true,reduced:false,
  onAdd(target,gl){
   map=target;scene=new THREE.Scene();camera=new THREE.Camera();
   renderer=new THREE.WebGLRenderer({canvas:map.getCanvas(),context:gl,antialias:true});renderer.autoClear=false;
   new GLTFLoader().load(url,gltf=>{
    if(disposed){release(gltf.scene);return;}
    template=gltf.scene;layer.ready=true;sync();onReady(layer);map.triggerRepaint();
   },undefined,error=>{if(!disposed)onError(error);});
  },
  render(gl,args){
   if(!template||!origin||!layer.active)return;
   matrix.fromArray(args.defaultProjectionData?.mainMatrix||args);
   local.makeTranslation(origin.x,origin.y,origin.z).scale(new THREE.Vector3(unit,-unit,unit));
   camera.projectionMatrix.copy(matrix).multiply(local);
   const bearing=map.getBearing()*Math.PI/180;
   for(const {model,root,row} of instances.values()){
    root.rotation.z=-bearing;model.setStage(row.stage??'vortex');model.update(elapsed,layer.reduced);
   }
   renderer.resetState();renderer.render(scene,camera);renderer.resetState();
  },
  onRemove(){disposed=true;for(const item of instances.values())item.model.dispose();instances.clear();if(template)release(template);renderer?.dispose();layer.ready=false;map=null;}
 };
 function sync(){
  if(!template||!scene)return;
  if(!origin&&rows.length){origin=maplibre.MercatorCoordinate.fromLngLat(rows[0].coordinates,0);unit=origin.meterInMercatorCoordinateUnits();}
  const keep=new Set(rows.map(row=>row.key));
  for(const [key,item] of instances)if(!keep.has(key)){scene.remove(item.root);item.model.dispose();instances.delete(key);}
  for(const row of rows){
   let item=instances.get(row.key);
   if(!item){
    const model=createBlenderHologram(template,{color:row.color,phase:row.phase??instances.size*2.39996,logo:row.logo}),root=new THREE.Group();
    model.object.rotation.x=Math.PI/2;root.add(model.object);scene.add(root);item={root,model,row};instances.set(row.key,item);
   }
   item.row=row;item.model.setColor(row.color||'#FF00CC');item.model.setLogo(row.logo??null);
   const position=maplibre.MercatorCoordinate.fromLngLat(row.coordinates,row.altitude??0);
   item.root.position.set((position.x-origin.x)/unit,-(position.y-origin.y)/unit,(position.z-origin.z)/unit);
   // Uniform size in meters, with an optional vertical stretch so a hologram can rise above local buildings.
   const size=row.scaleMeters??18,stretch=row.heightScale??1;
   item.root.scale.set(size,size,size*stretch);
  }
 }
 function release(root){const geometry=new Set(),material=new Set();root.traverse(node=>{if(node.geometry)geometry.add(node.geometry);for(const m of Array.isArray(node.material)?node.material:node.material?[node.material]:[])material.add(m);});geometry.forEach(g=>g.dispose());material.forEach(m=>m.dispose());}
 return layer;
}
