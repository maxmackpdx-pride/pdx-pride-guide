import * as THREE from 'three';
import {createHybridWaypointLayer} from './waypoint-hybrid-layer.js';
import {createWaypointStore} from './waypoint-assets/builders/shared.js';
import {motionPreference} from './motion.js';
// Twelve holograms may each expose two posters and two clock plates.
const MAX_MASKS=48;
/** A screen-sized 3D assembly in the existing MapLibre context. No canvas per marker. */
function create3dWaypointLayer(maplibre,{id='waypoint-objects',occluders=()=>[],active=()=>true,onChange=()=>{}}={}){
 let map,renderer,scene,source,camera,store,dead=false,rows=[],drawn=0;
 const batches=new Map();
 const instances=new Map(),pending=new Map(),failed=new Set(),matrix=new THREE.Matrix4(),point=new THREE.Vector4();
 const masks={value:Array.from({length:MAX_MASKS*2},()=>new THREE.Vector4())},maskCount={value:0},pixelRatio={value:1},viewHeight={value:1};
 function installMask(material){if(material.userData.waypointMask)return;material.userData.waypointMask=true;
  const prior=material.onBeforeCompile;material.onBeforeCompile=shader=>{prior?.(shader,renderer);Object.assign(shader.uniforms,{wpMasks:masks,wpMaskCount:maskCount,wpRatio:pixelRatio,wpHeight:viewHeight});shader.fragmentShader=`uniform vec4 wpMasks[96]; uniform int wpMaskCount; uniform float wpRatio; uniform float wpHeight;
float wpCross(vec2 a,vec2 b,vec2 p){return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);}
bool wpCovered(vec2 p){for(int i=0;i<48;i++){if(i>=wpMaskCount)break;int k=i*2;vec2 q0=wpMasks[k].xy,q1=wpMasks[k].zw,q2=wpMasks[k+1].xy,q3=wpMasks[k+1].zw;float a=wpCross(q0,q1,p),b=wpCross(q1,q2,p),c=wpCross(q2,q3,p),d=wpCross(q3,q0,p);if((a>=0.&&b>=0.&&c>=0.&&d>=0.)||(a<=0.&&b<=0.&&c<=0.&&d<=0.))return true;}return false;}
`+shader.fragmentShader.replace('void main() {','void main() { if(wpCovered(vec2(gl_FragCoord.x/wpRatio,wpHeight-gl_FragCoord.y/wpRatio)))discard;');};
  material.customProgramCacheKey=()=> 'waypoint-opaque-mask-v2';material.needsUpdate=true;
 }
 function discard(key){const i=instances.get(key);if(i){i.model.dispose();instances.delete(key);}const p=pending.get(key);if(p){p.abort();pending.delete(key);}}
 function sync(){if(!store||dead)return;const keep=new Set(rows.map(r=>r.key));for(const k of instances.keys())if(!keep.has(k))discard(k);for(const k of pending.keys())if(!keep.has(k))discard(k);
  for(const row of rows){const signature=row.asset+':'+row.lod;if(instances.get(row.key)?.signature===signature||pending.get(row.key)?.signature===signature||failed.has(signature))continue;discard(row.key);const controller=new AbortController();controller.signature=signature;pending.set(row.key,controller);
   store.build(row.asset,{lod:row.lod,instanceId:row.key,mobile:true,reducedMotion:motionPreference.matches,runtimeHover:false,signal:controller.signal}).then(model=>{
    if(dead||controller.signal.aborted||pending.get(row.key)!==controller){model?.dispose();return;}pending.delete(row.key);if(!model){failed.add(signature);return;}
    model.root.traverse(o=>{if(o.isMesh){installMask(o.material);o.frustumCulled=false;}});source.add(model.root);instances.set(row.key,{model,signature,hull:modelHull(model.root)});onChange();map?.triggerRepaint();
   }).catch(e=>{if(pending.get(row.key)===controller)pending.delete(row.key);if(e.name!=='AbortError'){failed.add(signature);console.warn('Waypoint asset fallback',row.asset,e.message);}});
  }
 }
 const layer={id,type:'custom',renderingMode:'3d',
  setRows(next){if(dead)return;const w=map?.getCanvas().clientWidth??Infinity,h=map?.getCanvas().clientHeight??Infinity;
   rows=next.filter(r=>r.asset&&Number.isFinite(r.x)&&Number.isFinite(r.y)&&r.x>-100&&r.x<w+100&&r.y>-150&&r.y<h+150).map(r=>({...r,lod:r.lod||'middle'}));sync();},
  ready(key){return instances.has(key);},projectedMarkers(){return [...instances.values()].filter(i=>i.model.root.visible&&i.projected).map(i=>i.projected);},stats(){return {visible:drawn,drawBatches:batches.size,loaded:instances.size,pending:pending.size,failed:failed.size,...store?.stats()};},
  onAdd(target,gl){map=target;dead=false;scene=new THREE.Scene();source=new THREE.Group();scene.add(new THREE.HemisphereLight(0xffffff,0x334455,2.5));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,5,10);scene.add(light);camera=new THREE.OrthographicCamera(0,1,1,0,0,2000000);camera.position.z=1000000;camera.updateMatrixWorld();renderer=new THREE.WebGLRenderer({canvas:map.getCanvas(),context:gl,antialias:true});renderer.autoClear=false;renderer.outputColorSpace=THREE.SRGBColorSpace;store=createWaypointStore({baseURL:new URL('/map-foundation/waypoint-assets/',window.location.origin).href,maxConcurrentLoads:4});sync();},
  render(gl,args){drawn=0;if(dead||!active()||document.hidden)return;const width=map.getCanvas().clientWidth,height=map.getCanvas().clientHeight;if(!width||!height)return;
   camera.right=width;camera.top=height;camera.updateProjectionMatrix();matrix.fromArray(args.defaultProjectionData?.mainMatrix||args);pixelRatio.value=map.getCanvas().width/width;viewHeight.value=height;
   const regions=occluders().filter(r=>r.points?.length===4).slice(0,MAX_MASKS);maskCount.value=regions.length;regions.forEach((r,i)=>{const [a,b,c,d]=r.points;masks.value[i*2].set(a.x,a.y,b.x,b.y);masks.value[i*2+1].set(c.x,c.y,d.x,d.y);});
   for(const i of instances.values())i.model.setVisible(false);
   for(const row of rows){const item=instances.get(row.key);if(!item)continue;const {model}=item;let depth=row.depth;
    if(!Number.isFinite(depth)&&row.coordinates){const p=maplibre.MercatorCoordinate.fromLngLat(row.coordinates,row.altitude??0);point.set(p.x,p.y,p.z,1).applyMatrix4(matrix);if(point.w<=0)continue;depth=point.z/point.w;}
    if(!Number.isFinite(depth)||depth<-1||depth>1)continue;
    const bounds=model.entry.headBounds,scale=row.size/model.entry.headWidth,cx=bounds?(bounds.min[0]+bounds.max[0])/2:0,cy=bounds?(bounds.min[1]+bounds.max[1])/2:0;
    model.setVisible(true);model.setIconVisible(row.showIcon!==false);model.setReducedMotion(motionPreference.matches);model.update(performance.now()/1000);model.setHeadWidth(row.size,1);model.root.position.set(row.x-cx*scale,height-row.y-cy*scale,-depth*1000000);const polygon=item.hull.map(p=>({x:row.x+(p.x-cx)*scale,y:row.y-(p.y-cy)*scale}));item.projected={key:row.key,depth,points:polygon,left:Math.min(...polygon.map(p=>p.x)),right:Math.max(...polygon.map(p=>p.x)),top:Math.min(...polygon.map(p=>p.y)),bottom:Math.max(...polygon.map(p=>p.y))};drawn++;
   }
   // Shared buffers also share draw submissions; independent animation remains in source transforms.
   source.updateMatrixWorld(true);const groups=new Map();source.traverseVisible(mesh=>{if(!mesh.isMesh)return;const key=mesh.geometry.uuid+':'+mesh.material.uuid;let g=groups.get(key);if(!g){g={geometry:mesh.geometry,material:mesh.material,matrices:[]};groups.set(key,g);}g.matrices.push(mesh.matrixWorld);});
   for(const [key,b] of batches)if(!groups.has(key)){scene.remove(b);b.dispose();batches.delete(key);}
   for(const [key,g] of groups){let b=batches.get(key);if(!b||b.instanceMatrix.count<g.matrices.length){if(b){scene.remove(b);b.dispose();}b=new THREE.InstancedMesh(g.geometry,g.material,2**Math.ceil(Math.log2(Math.max(1,g.matrices.length))));b.frustumCulled=false;b.instanceMatrix.setUsage(THREE.DynamicDrawUsage);batches.set(key,b);scene.add(b);}b.count=g.matrices.length;g.matrices.forEach((m,i)=>b.setMatrixAt(i,m));b.instanceMatrix.needsUpdate=true;}
   if(!drawn)return;
   renderer.resetState();renderer.render(scene,camera);renderer.resetState();if(drawn&&!motionPreference.matches)map.triggerRepaint();
  },
  onRemove(){dead=true;drawn=0;for(const b of batches.values()){scene.remove(b);b.dispose();}batches.clear();for(const c of pending.values())c.abort();pending.clear();for(const i of instances.values())i.model.dispose();instances.clear();store?.dispose().catch(()=>{});scene?.clear();renderer?.dispose();rows=[];map=null;}
 };return layer;
}
export function mapzAsset(properties){
 const p=properties||{},family=p.waypointFamily,type=String(p.type||p.typeIcon||'').toLowerCase();
 if(p.boardPin){const housing=String(p.typeIcon||'').match(/housing-(looking|forming|offering|managed)/)?.[1];const k=String(housing||p.housingModel||p.boardKind||p.housingKind||family||'looking').toLowerCase();return 'family-'+({houz:'looking',boardz:'looking'}[k]||k);}
 if(['gigz','giftz','sellz','mizzed'].includes(family))return 'family-'+family;
 const services=['graphic-design','hair','massage','tattoo','web-development'];const needz=['mental-health','harm-reduction','health','safety','legal','youth','community','family','money','arts'];
 if(services.includes(type))return 'services-'+type;if(needz.includes(type))return 'needz-'+type;
 if(type==='healthcare')return 'needz-health';if(type==='nonprofit'||family==='needz')return 'placez-needz';if(type==='bar'||type==='nightclub')return 'placez-bar';if(['venue','adult','needz','shop','cafe','restaurant','service'].includes(type))return 'placez-'+type;
 return p.kind==='event'?'placez-venue':null;
}

// Cached once per model, from actual opaque vertices rather than padded rectangles.
function modelHull(root){
 const points=[],v=new THREE.Vector3(),opaque=new Set(['glass','metal-frame','rim','pin-solid','body']);root.updateMatrixWorld(true);
 root.traverse(mesh=>{if(!mesh.isMesh||!opaque.has(mesh.userData.mapzRole))return;const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);points.push({x:v.x,y:v.y});}});
 const sorted=points.sort((a,b)=>a.x-b.x||a.y-b.y).filter((p,i,a)=>!i||p.x!==a[i-1].x||p.y!==a[i-1].y);if(sorted.length<3)return sorted;
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),half=ps=>{const out=[];for(const p of ps){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}out.pop();return out;};return [...half(sorted),...half([...sorted].reverse())];
}
export function createWaypointLayer(maplibre,options={}){return createHybridWaypointLayer(create3dWaypointLayer(maplibre,options),maplibre,options);}
