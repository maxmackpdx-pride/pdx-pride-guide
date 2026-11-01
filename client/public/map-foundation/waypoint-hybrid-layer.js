import {createSvgStore,representationFor} from './waypoint-hybrid/builders/hybrid.js';
import {motionPreference} from './motion.js';
const NS='http://www.w3.org/2000/svg';let sequence=0;
const node=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
const attribute=(n,k,v)=>{v=String(v);if(n.getAttribute(k)!==v)n.setAttribute(k,v);};
const points=items=>items.map(p=>`${p.x},${p.y}`).join(' ');
/** Inline SVG uses the existing map context for selected models, never a renderer per marker. */
export function createHybridWaypointLayer(three,maplibre,options={}){
 let map,overlay,defs,content,mask,white,store,rows=[],dead=false,visible=0;
 const id=`waypoint-svg-${++sequence}`,svgs=new Map(),pending=new Map(),failed=new Set();
 const wants3d=r=>representationFor({assetId:r.asset,selected:r.selected||r.lod==='near',enlarged:r.enlarged})==='3d';
 const notify=()=>{options.onChange?.();map?.triggerRepaint();};
 const discard=key=>{pending.get(key)?.abort();pending.delete(key);const s=svgs.get(key);if(s){s.api.dispose();s.wrapper.remove();s.mask?.remove();svgs.delete(key);}};
 function sync(){
  if(dead||!store)return;const keys=new Set(rows.map(r=>r.key));for(const k of svgs.keys())if(!keys.has(k))discard(k);for(const k of pending.keys())if(!keys.has(k))discard(k);
  for(const row of rows){
   if(row.asset.startsWith('family-'))continue;
   if(svgs.get(row.key)?.asset===row.asset||pending.get(row.key)?.asset===row.asset||failed.has(row.asset))continue;
   discard(row.key);const controller=new AbortController();controller.asset=row.asset;pending.set(row.key,controller);
   store.build(row.asset,{instanceId:row.key,headPixels:row.size,reducedMotion:motionPreference.matches,signal:controller.signal}).then(api=>{
    if(dead||controller.signal.aborted||pending.get(row.key)!==controller){api?.dispose();return;}pending.delete(row.key);
    if(!api){failed.add(row.asset);return;}api.setVisible(false);api.element.setAttribute('aria-hidden','true');api.element.removeAttribute('role');
    const wrapper=node('g'),position=node('g');wrapper.append(position);position.append(api.element);content.append(wrapper);svgs.set(row.key,{api,wrapper,position,asset:row.asset});sync();notify();
   }).catch(error=>{if(pending.get(row.key)===controller)pending.delete(row.key);if(error.name!=='AbortError'){failed.add(row.asset);console.warn('Waypoint SVG fallback',row.asset,error.message);}});
  }
  // Keep a loaded selected model until its SVG is ready; returning to SVG cancels pending 3D ownership.
  three.setRows(rows.filter(r=>wants3d(r)||(!svgs.has(r.key)&&three.ready(r.key))));
 }
 function paintMask(target,regions){while(target.children.length>regions.length+1)target.lastChild.remove();regions.forEach((region,i)=>{let p=target.children[i+1];if(!p){p=node('polygon',{fill:'black'});target.append(p);}attribute(p,'points',points(region.points));});}
 function depth(row,matrix){if(Number.isFinite(row.depth))return row.depth;if(!row.coordinates||!matrix)return NaN;const p=maplibre.MercatorCoordinate.fromLngLat(row.coordinates,row.altitude??0),w=matrix[3]*p.x+matrix[7]*p.y+matrix[11]*p.z+matrix[15];return w>0?(matrix[2]*p.x+matrix[6]*p.y+matrix[10]*p.z+matrix[14])/w:NaN;}
 function pause(){for(const s of svgs.values())s.api.setVisible(false);map?.triggerRepaint();}
 return {
  id:three.id,type:'custom',renderingMode:'3d',
  setRows(next){if(dead)return;const w=map?.getCanvas().clientWidth??Infinity,h=map?.getCanvas().clientHeight??Infinity;rows=next.filter(r=>r.asset&&Number.isFinite(r.x)&&Number.isFinite(r.y)&&r.x>-100&&r.x<w+100&&r.y>-150&&r.y<h+150);sync();},
  ready(key){return svgs.has(key)||three.ready(key);},
  stats(){const model=three.stats();return {...model,visible:visible+model.visible,loaded:new Set([...svgs.keys(),...rows.filter(r=>three.ready(r.key)).map(r=>r.key)]).size,svgLoaded:svgs.size,modelsLoaded:model.loaded,pending:model.pending+pending.size,failed:model.failed+failed.size};},
  onAdd(target,gl){map=target;dead=false;three.onAdd(target,gl);overlay=node('svg',{'aria-hidden':'true','data-waypoint-overlay':'true'});Object.assign(overlay.style,{position:'absolute',inset:'0',width:'100%',height:'100%',overflow:'hidden',pointerEvents:'none',zIndex:'0'});
   defs=node('defs');mask=node('mask',{id,maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse','mask-type':'luminance'});white=node('rect',{fill:'white'});mask.append(white);defs.append(mask);content=node('g',{mask:`url(#${id})`});overlay.append(defs,content);const canvas=map.getCanvas();canvas.parentElement.insertBefore(overlay,canvas.nextSibling);
   store=createSvgStore({baseURL:new URL('/map-foundation/waypoint-hybrid/',location.origin).href});document.addEventListener('visibilitychange',pause);sync();
  },
  render(gl,args){three.render(gl,args);visible=0;if(dead)return;const active=!document.hidden&&(options.active?.()??true);const display=active?'block':'none';if(overlay.style.display!==display)overlay.style.display=display;if(!active){for(const s of svgs.values())s.api.setVisible(false);return;}
   const width=map.getCanvas().clientWidth,height=map.getCanvas().clientHeight;attribute(overlay,'viewBox',`0 0 ${width} ${height}`);for(const n of [mask,white]){attribute(n,'x',0);attribute(n,'y',0);attribute(n,'width',width);attribute(n,'height',height);}paintMask(mask,(options.occluders?.()||[]).filter(r=>r.points?.length===4));
   const shown=new Set();const matrix=args.defaultProjectionData?.mainMatrix||args;
   const projected=rows.map(row=>({row,z:depth(row,matrix)})).filter(item=>Number.isFinite(item.z)&&item.z>=-1&&item.z<=1).sort((a,b)=>b.z-a.z);
   const foreground=three.projectedMarkers?.()||[];let previous=null;
   for(const {row,z} of projected){const s=svgs.get(row.key);if(!s||wants3d(row)&&three.ready(row.key))continue;
    s.api.setHeadWidth(row.size);s.api.setReducedMotion(motionPreference.matches);s.api.setIconVisible(row.showIcon!==false);s.api.setVisible(true);shown.add(row.key);
    const offset=s.api.headCenterOffset(row.size),left=row.x-offset.x,top=row.y-offset.y,w=row.size*s.api.entry.viewBox[2]/100,h=row.size*s.api.entry.viewBox[3]/100;
    attribute(s.api.element,'width',w);attribute(s.api.element,'height',h);
    attribute(s.position,'transform',`translate(${left} ${top})`);
    // Only nearer physical 3D silhouettes cut SVGs. Padding/ground glow never becomes a rectangular occluder.
    const blockers=foreground.filter(p=>p.key!==row.key&&p.depth<z-1e-7&&p.right>left&&p.left<left+w&&p.bottom>top&&p.top<top+h);
    if(blockers.length){if(!s.mask){s.mask=node('mask',{id:`${id}-depth-${++sequence}`,maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse','mask-type':'luminance'});s.mask.append(node('rect',{fill:'white'}));defs.append(s.mask);}for(const n of [s.mask,s.mask.firstChild]){attribute(n,'x',left);attribute(n,'y',top);attribute(n,'width',w);attribute(n,'height',h);}paintMask(s.mask,blockers);attribute(s.wrapper,'mask',`url(#${s.mask.id})`);}else s.wrapper.removeAttribute('mask');
    const expected=previous?previous.nextSibling:content.firstChild;if(expected!==s.wrapper)content.insertBefore(s.wrapper,expected);previous=s.wrapper;visible++;
   }
   for(const [key,s]of svgs)if(!shown.has(key))s.api.setVisible(false);
  },
  onRemove(){dead=true;document.removeEventListener('visibilitychange',pause);for(const k of [...svgs.keys(),...pending.keys()])discard(k);store?.clear();overlay?.remove();three.onRemove();rows=[];visible=0;map=null;}
 };
}
