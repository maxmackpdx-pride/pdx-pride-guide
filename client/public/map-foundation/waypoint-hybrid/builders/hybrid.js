// Asset-only adapter. Integrating map owns sizing, counts, logos, hit testing and occlusion.
export function representationFor({assetId,kind,selected=false,enlarged=false}) {
 if(kind==='hologram'||/^(family-|hologram-|e3-|vortex|coin)/.test(assetId)||selected||enlarged)return '3d';
 return 'svg';
}
let serial=0;
function phase(id){let h=2166136261;for(const c of String(id))h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0)/4294967296;}
export function createSvgStore({baseURL}={}){
 const base=new URL(baseURL,location.href);let catalogPromise;const cache=new Map();
 const get=async p=>{const r=await fetch(new URL(p,base));if(!r.ok)throw new Error(`SVG asset ${r.status}: ${p}`);return r.text();};
 async function build(id,{instanceId=id,headPixels=30,tokens={},reducedMotion=false,signal}={}){
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  catalogPromise||=get('catalog.json').then(JSON.parse).catch(e=>{catalogPromise=null;throw e});
  const entry=(await catalogPromise).assets.find(a=>a.id===id);if(!entry?.svg)return null;
  if(!cache.has(id)){cache.set(id,get(entry.svg));if(cache.size>64)cache.delete(cache.keys().next().value);}
  let text;try{text=await cache.get(id)}catch(e){cache.delete(id);throw e}
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  const prefix=`wp-instance-${++serial}`;text=text.replaceAll('wp-'+id,prefix);
  const doc=new DOMParser().parseFromString(text,'image/svg+xml');if(doc.querySelector('parsererror'))throw new Error(`Invalid SVG: ${id}`);
  const element=document.importNode(doc.documentElement,true);element.style.pointerEvents='none';element.style.setProperty('--phase',`${-phase(instanceId)*19}s`);
  for(const [token,color] of Object.entries(tokens))if(/^[a-z][a-z0-9-]*$/.test(token)&&/^#[\da-f]{6}$/i.test(color))element.style.setProperty('--'+token,color);
  const accent=tokens[entry.secondaryToken]||tokens[entry.token]||entry.secondary||entry.color;if(/^#[\da-f]{6}$/i.test(accent||''))element.style.setProperty('--wp-accent',accent);
  let disposed=false,lastSize,lastVisible,lastReduced,lastIcon;const api={element,entry,
   setHeadWidth(px){if(px===lastSize)return;lastSize=px;element.style.width=`${px*entry.viewBox[2]/entry.headWidth}px`;element.style.height=`${px*entry.viewBox[3]/entry.headWidth}px`;},
   // Head center is offset inside the padded effect canvas. Use this for positioning.
   headCenterOffset(px){return{x:(50-entry.viewBox[0])*px/100,y:(entry.headBounds[3]/2-entry.viewBox[1])*px/100};},
   setVisible(v){if(v===lastVisible)return;lastVisible=v;element.style.visibility=v?'visible':'hidden';element.dataset.paused=String(!v);},
   setReducedMotion(v){if(v===lastReduced)return;lastReduced=v;element.dataset.reduced=String(!!v);},
   setIconVisible(v){if(v===lastIcon)return;lastIcon=v;element.querySelectorAll('[data-role="icon"]').forEach(o=>o.style.display=v?'':'none');},
   // Accept a caller-created SVG group/image for a logo; do not interpolate remote HTML.
   attachIcon(node){const target=element.querySelector('.wp-head');target.append(node);return()=>node.remove();},
   dispose(){if(disposed)return;disposed=true;element.remove();}
  };api.setHeadWidth(headPixels);api.setReducedMotion(reducedMotion);return api;
 }
 return {build,clear(){cache.clear();catalogPromise=null;}};
}
/** Race-safe representation switch; caller supplies its existing shared 3D layer hooks.
 * Keep the SVG/fallback until 3D is loaded. Never install a second hit target.
 */
export function createHybridSwitch({assetId,showSvg,hideSvg,load3d,show3d,hide3d,onError=()=>{}}){
 let version=0,controller,model=null,dead=false,mode=null;
 async function update(state={}){
  if(dead)return;const desired=representationFor({assetId,...state});if(desired===mode&&!controller)return;if(desired==='3d'&&controller&&!controller.signal.aborted)return;
  const v=++version;controller?.abort();controller=null;
  if(desired==='svg'){mode='svg';hide3d(model);model?.dispose?.();model=null;showSvg();return;}
  // Default waypoint SVG remains visible during a selected-model load.
  if(!assetId.startsWith('family-'))showSvg();
  controller=new AbortController();const current=controller;
  try{const loaded=await load3d({assetId,signal:current.signal});if(dead||v!==version||current.signal.aborted){loaded?.dispose?.();return;}
   if(!loaded){onError(new Error(`No 3D asset: ${assetId}`));return;}
   model?.dispose?.();model=loaded;mode='3d';show3d(model);hideSvg();
  }catch(e){if(e.name!=='AbortError'&&v===version)onError(e);}finally{if(controller===current)controller=null;}
 }
 return {update,dispose(){dead=true;++version;controller?.abort();hide3d(model);model?.dispose?.();model=null;hideSvg();}};
}
