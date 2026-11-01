import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const roles = (root, role) => { const out=[];root.traverse(o=>{if(o.userData.mapzRole===role)out.push(o)});return out; };
export function phase(id){let h=2166136261;for(const c of String(id))h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0)/4294967296;}
const abort = () => new DOMException('Waypoint build cancelled','AbortError');
/** One store per map lifecycle, using the map's existing Three.js version/context. */
export function createWaypointStore({baseURL, maxConcurrentLoads=4}={}) {
 if(!baseURL)throw new Error('baseURL must point to the package root');
 const base=new URL(baseURL,globalThis.location?.href||'http://localhost/');
 const url=p=>new URL(p,base).href, loader=new GLTFLoader();
 const cache=new Map(), recipes=new Map(), variants=new Map(), instances=new Set();let dead=false,running=0;const queue=[];
 function schedule(fn){return new Promise((resolve,reject)=>{queue.push({fn,resolve,reject});pump();});}
 function pump(){while(running<maxConcurrentLoads&&queue.length){const t=queue.shift();running++;Promise.resolve().then(()=>{if(dead)throw abort();return t.fn()}).then(t.resolve,t.reject).finally(()=>{running--;pump()});}}
 async function json(path){const r=await fetch(url(path));if(!r.ok)throw new Error(`${r.status}: ${path}`);return r.json();}
 let catalogP,libP;
 function catalog(){return catalogP||=(json('shared/catalog.json').then(c=>new Map(c.assets.map(a=>[`${a.id}:${a.lod}`,a]))).catch(e=>{catalogP=null;throw e}));}
 function library(){return libP||=(schedule(()=>loader.loadAsync(url('shared/materials.glb'))).catch(e=>{libP=null;throw e}));}
 async function material(index,mobile,tokens){
  const lib=await library();const original=await lib.parser.getDependency('material',index);if(dead)throw abort();const slot=original.userData.tokenSlot;
  const color=!original.userData.flagColorProtected&&slot?tokens?.[slot]:null;
  const key=`${index}:${mobile}:${color||''}`;
  if(!variants.has(key)){
   const m=original.clone();m.depthTest=true;m.depthWrite=!m.transparent&&m.userData.depthWrite!==false;
   if(mobile&&m.isMeshPhysicalMaterial){m.transmission=0;m.thickness=0;m.clearcoat=0;}
   if(color){m.color.set(color);if(m.emissive)m.emissive.set(color);}
   // Keep the authored partial wire motion, without a bloom-like full-bright flash.
   if(m.userData.materialRole==='pin-wire'){m.emissiveIntensity=.15;m.transparent=true;m.opacity=.5;m.depthWrite=false;}
   if(m.userData.materialRole==='pin-solid')m.emissiveIntensity=.25;
   variants.set(key,m);
  }return variants.get(key);
 }
 async function acquire(key){
  let e=cache.get(key);
  if(!e){e={refs:0,promise:schedule(async()=>{const g=await loader.loadAsync(url(`shared/geometry/${key}.glb`));const a=[];g.scene.traverse(o=>{if(o.isMesh){a.push(o.geometry);o.material?.dispose()}});return a;})};cache.set(key,e);e.promise.catch(()=>{if(cache.get(key)===e)cache.delete(key)});}
  e.refs++;try{return await e.promise}catch(err){e.refs--;throw err}
 }
 function release(key){const e=cache.get(key);if(!e)return;if(--e.refs===0){cache.delete(key);e.promise.then(a=>a.forEach(g=>g.dispose()),()=>{});}}
 async function build(id,{lod='near',instanceId=id,mobile=true,tokens={},signal,reducedMotion=false,calm=false,visible=true,runtimeHover=true}={}){
  if(dead||signal?.aborted)throw abort();const cat=await catalog();const entry=cat.get(`${id}:${lod}`)||cat.get(`${id}:near`);if(!entry)return null;
  let rp=recipes.get(entry.recipe);if(!rp){rp=json('shared/'+entry.recipe);recipes.set(entry.recipe,rp);if(recipes.size>64)recipes.delete(recipes.keys().next().value);rp.catch(()=>recipes.delete(entry.recipe));}const r=await rp;
  const acquired=[];const root=new THREE.Group(),motion=new THREE.Group();root.add(motion);root.name=`Waypoint ${instanceId}`;root.userData={assetId:id,mapFamily:id.includes('outzide')?'outzide':'mapz'};
  try{
   // Unique geometry references are acquired once per assembled instance.
   const gs=new Map();for(const key of new Set(r.meshes.map(m=>m.geometry))){gs.set(key,await acquire(key));acquired.push(key);if(dead||signal?.aborted)throw abort();}
   const nodes=r.nodes.map((n,i)=>{const o=new THREE.Group();o.name=`Node_${i}`;o.userData={...n.extras,sourceName:n.name};if(n.matrix){new THREE.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);}else{o.position.fromArray(n.translation||[0,0,0]);o.quaternion.fromArray(n.rotation||[0,0,0,1]);o.scale.fromArray(n.scale||[1,1,1]);}return o;});
   for(let i=0;i<nodes.length;i++){
    const n=r.nodes[i],o=nodes[i];for(const c of n.children||[])o.add(nodes[c]);
    if(n.mesh!==undefined){const part=r.meshes[n.mesh],geo=gs.get(part.geometry);if(geo.length!==part.materials.length)throw new Error('Primitive layout mismatch');for(let k=0;k<geo.length;k++){const m=await material(part.materials[k],mobile,tokens);const mesh=new THREE.Mesh(geo[k],m);mesh.userData={...n.extras};mesh.name=`Part_${i}_${k}`;o.add(mesh);}}
   }
   if(dead||signal?.aborted)throw abort();for(const i of r.roots)motion.add(nodes[i]);
   const clips=r.clips.map(c=>new THREE.AnimationClip(c.name,-1,c.tracks.map(t=>{
    const names={translation:'position',rotation:'quaternion',scale:'scale'};const C=t.path==='rotation'?THREE.QuaternionKeyframeTrack:THREE.VectorKeyframeTrack;
    const times=[...t.times],values=[...t.values],stride=t.path==='rotation'?4:3;
    // Add a short return segment for continuous tracks with unequal endpoints.
    const duration=Math.max(...c.tracks.map(x=>x.times.at(-1)));if(t.interpolation!=='STEP'){times.push(duration+.25);values.push(...values.slice(0,stride));}
    return new C(`Node_${t.node}.${names[t.path]}`,times,values,t.interpolation==='STEP'?THREE.InterpolateDiscrete:THREE.InterpolateLinear);
   })));
   const mixer=new THREE.AnimationMixer(root);clips.forEach(c=>mixer.clipAction(c).play());let disposed=false,hidden=!visible,reduced=reducedMotion||calm;
   const api={root,clips,entry,parts:role=>roles(root,role),
    setVisible(v){hidden=!v;root.visible=!!v;},setReducedMotion(v){reduced=!!v;if(reduced){mixer.setTime(0);motion.position.set(0,0,0);motion.rotation.set(0,0,0);}},
    update(seconds){if(disposed||hidden)return;mixer.setTime(reduced?0:seconds+phase(instanceId)*17);if(!clips.length&&runtimeHover&&!id.startsWith("badge-")){const t=seconds+phase(instanceId)*17;motion.position.y=reduced?0:Math.sin(t*.65)*.015;motion.rotation.y=reduced?0:Math.sin(t*.8)*.025;}},
    // Replacement icon is caller-owned; source icon/backing can be hidden together.
    setHeadWidth(cssPixels,worldUnitsPerCSSPixel){if(!entry.headWidth)throw new Error("Missing head width");root.scale.setScalar(cssPixels*worldUnitsPerCSSPixel/entry.headWidth);},
    setIconVisible(v){for(const n of nodes)if(['icon','icon-backing'].includes(n.userData.mapzRole))n.visible=v;},
    attachIcon(object){root.add(object);return()=>root.remove(object);},
    dispose(){if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(root);root.removeFromParent();root.clear();acquired.forEach(release);instances.delete(api);}
   };root.visible=visible;api.update(0);instances.add(api);return api;
  }catch(e){acquired.forEach(release);root.clear();throw e;}
 }
 async function dispose(){dead=true;for(const i of [...instances])i.dispose();while(running||queue.length)await new Promise(r=>setTimeout(r,10));for(const m of variants.values())m.dispose();variants.clear();if(libP){const lib=await libP.catch(()=>null);if(lib){const ms=await lib.parser.getDependencies('material'),ts=await lib.parser.getDependencies('texture');ms.forEach(m=>m.dispose());for(const t of new Set(ts)){t.dispose();t.source?.data?.close?.();}}}recipes.clear();}
 return {build,dispose,stats:()=>({instances:instances.size,geometries:cache.size,materials:variants.size,queued:queue.length,activeLoads:running})};
}
