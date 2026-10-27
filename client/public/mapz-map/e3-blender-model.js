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
// Seconds for the text ring to turn once.
const RING_TURN_SECONDS=24;
const LOGO_MAIN={y:[3.77,3.79,4.25,4.30,3.98,4.78],w:[0,0,.34,.78,.98,.98],h:[0,0,.34,.78,.7,.7],a:[0,0,1,1,1,1]};
const LOGO_LOWER={y:[3.03,3.03,3.03,3.03,3.03,1.29],w:[0,0,0,0,0,.98],h:[0,0,0,0,0,.7],a:[0,0,0,0,0,1]};
export function blenderLogoFace(table,stage,aspect=1){
 const y=interpolate(table.y,stage),boxW=interpolate(table.w,stage),boxH=interpolate(table.h,stage),opacity=interpolate(table.a,stage);
 const width=Math.min(boxW,boxH*Math.max(.05,aspect)),height=width/Math.max(.05,aspect);
 return {y,width,height,opacity};
}
// Text ring band around the wide vortex ring, per stage 0..5: center height, radius, band height, visibility.
// The band is a little taller than the ring surface, so the letters stand slightly above and below it (the 2D clip
// did the same). Stage 4 is the single vortex; stage 5 is the double stack, which has a ring pair on each stack.
const RING_BAND_MAIN={y:[2.9,2.9,2.9,2.9,2.88,3.72],r:[.6,.6,.6,.6,1.1,1.1],h:[.4,.4,.4,.4,.44,.44],a:[0,0,0,0,1,1]};
const RING_BAND_LOWER={y:[2.88,2.88,2.88,2.88,2.88,2.28],r:[.6,.6,.6,.6,.6,1.1],h:[.4,.4,.4,.4,.4,.44],a:[0,0,0,0,0,1]};
// Countdown plate above the top screen: height and visibility per stage. It rises into place from the coin.
const COUNTDOWN_PLATE={y:[4.6,4.6,4.6,4.6,5.1,5.9],w:[2.5,2.5,2.5,2.5,2.5,2.5],h:[.52,.52,.52,.52,.52,.52],a:[0,0,0,0,1,1]};
const RING_TEXT_FONT="900 92px 'Barlow Condensed','Arial Narrow',sans-serif";
const COUNTDOWN_FONT="900 66px 'Barlow Condensed','Arial Narrow',sans-serif";
export function blenderBandFace(table,stage){
 return {y:interpolate(table.y,stage),radius:interpolate(table.r,stage),height:interpolate(table.h,stage),opacity:interpolate(table.a,stage)};
}
export function blenderPlateFace(stage){
 return {y:interpolate(COUNTDOWN_PLATE.y,stage),width:interpolate(COUNTDOWN_PLATE.w,stage),height:interpolate(COUNTDOWN_PLATE.h,stage),opacity:interpolate(COUNTDOWN_PLATE.a,stage)};
}
const fontsReady=()=>{try{return Boolean(document.fonts?.check("900 20px 'Barlow Condensed'"));}catch{return false;}};
// Letters in a repeating line that fills the whole band once around, white so the material tint colours it.
function drawRingTextCanvas(canvas,text){
 const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
 ctx.clearRect(0,0,width,height);
 ctx.font=RING_TEXT_FONT;ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillStyle='#ffffff';
 const unit=`${text}  \u00b7  `,one=ctx.measureText(unit).width||1;
 // A whole number of copies, stretched so the seam is invisible.
 const copies=Math.max(1,Math.round(width/one)),stretch=width/(one*copies);
 ctx.save();ctx.scale(stretch,1);
 for(let i=0;i<copies;i++)ctx.fillText(unit,i*one,height*.54);
 ctx.restore();
}
function drawCountdownCanvas(canvas,text,color){
 const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height,live=text==='LIVE';
 ctx.clearRect(0,0,width,height);
 const r=14;ctx.beginPath();ctx.moveTo(r,2);ctx.arcTo(width-2,2,width-2,height-2,r);ctx.arcTo(width-2,height-2,2,height-2,r);ctx.arcTo(2,height-2,2,2,r);ctx.arcTo(2,2,width-2,2,r);ctx.closePath();
 ctx.fillStyle='rgba(4,14,20,.88)';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=color;ctx.stroke();
 ctx.font=COUNTDOWN_FONT;ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillStyle='#ffffff';
 if(live){ctx.fillStyle=color;ctx.beginPath();ctx.arc(width*.36,height/2,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff';ctx.fillText('LIVE',width*.54,height*.55);return;}
 // Fit the digits inside the plate whatever the number of groups.
 const max=width-48,measured=ctx.measureText(text).width;
 if(measured>max)ctx.font=COUNTDOWN_FONT.replace('66px',`${Math.floor(66*max/measured)}px`);
 ctx.fillText(text,width/2,height*.55);
}
function radialTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'#ffffff');g.addColorStop(.2,'#ffffff88');g.addColorStop(1,'#ffffff00');
 ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(canvas);
}
// mirrored: set when the host draws the model through a projection that flips triangle winding (the map layer does not).
export function createBlenderHologram(template,{color='#FF00CC',phase=0,logo=null,mirrored=false}={}){
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
 // Text ring bands (cylinders around the Y axis) and the countdown plate. Canvas textures, rebuilt only when their copy changes.
 let ringText='',ringTexture=null,ringFarTexture=null,ringFontsOk=false,countdownText='',countdownColor='',countdownTexture=null;
 // Each band is two open cylinders: the near wall at full strength and the far wall dimmed and un-mirrored,
 // like the 2D ring (letters on the far side fade with depth).
 const NEAR_SIDE=mirrored?THREE.BackSide:THREE.FrontSide,FAR_SIDE=mirrored?THREE.FrontSide:THREE.BackSide;
 const bandPlanes=[RING_BAND_MAIN,RING_BAND_LOWER].map(table=>{
  const make=(side,renderOrder)=>{
   const material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side,toneMapped:false,color:tint});
   const mesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,64,1,true),material);
   mesh.frustumCulled=false;mesh.renderOrder=renderOrder;mesh.visible=false;object.add(mesh);
   return {material,mesh};
  };
  const near=make(NEAR_SIDE,4),far=make(FAR_SIDE,3);
  return {table,near,far,meshes:[near,far]};
 });
 const plate={material:new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,color:0xffffff})};
 plate.mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),plate.material);plate.mesh.frustumCulled=false;plate.mesh.renderOrder=5;plate.mesh.visible=false;plate.mesh.position.z=LOGO_FACE_Z;object.add(plate.mesh);
 function setRingText(next){
  const text=String(next||'');
  const fonts=fontsReady();
  if(text===ringText&&(fonts===ringFontsOk||!text))return;
  ringText=text;ringFontsOk=fonts;
  if(ringTexture){ringTexture.dispose();ringTexture=null;}
  if(ringFarTexture){ringFarTexture.dispose();ringFarTexture=null;}
  if(text){
   const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=128;drawRingTextCanvas(canvas,text);
   ringTexture=new THREE.CanvasTexture(canvas);ringTexture.colorSpace=THREE.SRGBColorSpace;ringTexture.wrapS=THREE.RepeatWrapping;ringTexture.anisotropy=4;
   // The far wall is seen from inside, so its copy of the texture is flipped to read the right way round.
   ringFarTexture=ringTexture.clone();ringFarTexture.repeat.x=-1;ringFarTexture.offset.x=1;ringFarTexture.needsUpdate=true;
  }
  for(const band of bandPlanes){band.near.material.map=ringTexture;band.far.material.map=ringFarTexture;band.near.material.needsUpdate=true;band.far.material.needsUpdate=true;}
 }
 function setCountdown(next,color){
  const text=String(next||''),ink=color||'#39FF14';
  if(text===countdownText&&ink===countdownColor)return;
  countdownText=text;countdownColor=ink;
  if(countdownTexture){countdownTexture.dispose();countdownTexture=null;}
  if(text){
   const canvas=document.createElement('canvas');canvas.width=520;canvas.height=108;drawCountdownCanvas(canvas,text,ink);
   countdownTexture=new THREE.CanvasTexture(canvas);countdownTexture.colorSpace=THREE.SRGBColorSpace;countdownTexture.anisotropy=4;
  }
  plate.material.map=countdownTexture;plate.material.needsUpdate=true;
 }
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
  setColor(value){tint.set(value);for(const node of meshes)if(!['panel','icon','particle'].includes(node.userData.mapzRole))node.material.color.copy(tint);for(const band of bandPlanes)for(const part of band.meshes)part.material.color.copy(tint);},
  setLogo,setRingText,setCountdown,
  get hasRingText(){return Boolean(ringTexture);},
  get hasCountdown(){return Boolean(countdownTexture);},
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
   // Text ring: slowly turning band around the wide ring. Only where the vortex shows (stage 4 up).
   const turn=reduced?0:elapsed/RING_TURN_SECONDS*Math.PI*2;
   for(const band of bandPlanes){
    const face=ringTexture?blenderBandFace(band.table,stage):null;
    const show=Boolean(face)&&face.opacity>.01;
    for(const part of band.meshes)part.mesh.visible=show;
    if(!show)continue;
    const spin=band.table===RING_BAND_LOWER?-turn+Math.PI:turn;
    for(const [part,alpha] of [[band.near,.95],[band.far,.3]]){
     part.mesh.position.y=face.y;part.mesh.scale.set(face.radius,face.height,face.radius);part.material.opacity=face.opacity*alpha;part.mesh.rotation.y=spin;
    }
   }
   // Countdown plate above the top screen, only on the vortex and double stack.
   {
    const face=countdownTexture?blenderPlateFace(stage):null;
    plate.mesh.visible=Boolean(face)&&face.opacity>.01;
    if(face){plate.mesh.position.y=face.y;plate.mesh.scale.set(face.width,face.height,1);plate.material.opacity=face.opacity;}
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
  dispose(){for(const material of materials)material.dispose();groundTexture.dispose();logoTexture?.dispose();ringTexture?.dispose();ringFarTexture?.dispose();countdownTexture?.dispose();for(const plane of logoPlanes){plane.material.dispose();plane.mesh.geometry.dispose();}for(const band of bandPlanes)for(const part of band.meshes){part.material.dispose();part.mesh.geometry.dispose();}plate.material.dispose();plate.mesh.geometry.dispose();}
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
   item.row=row;item.model.setColor(row.color||'#FF00CC');item.model.setLogo(row.logo??null);item.model.setRingText(row.ringText??'');item.model.setCountdown(row.countdown??'',row.color);
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
