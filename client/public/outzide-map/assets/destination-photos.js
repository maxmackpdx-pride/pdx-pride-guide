/** Two aligned image planes; no canvas, frame loop, or location/orientation sensors. */
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const photoUrl=value=>typeof value==='string'&&/^(?:\/outzide-map\/)?assets\/photos\/[A-Za-z0-9._/-]+$/.test(value)&&!value.split('/').some(part=>part==='.'||part==='..')?(value.startsWith('/')?value:'/outzide-map/'+value):'';
const photoSrcSet=(variants,allowSvg=false)=>Array.isArray(variants)?variants.filter(v=>v&&typeof v==='object'&&photoUrl(v.src)&&(allowSvg?/\.(?:webp|avif|png|jpe?g|svg)$/i:/\.(?:webp|avif|png|jpe?g)$/i).test(v.src)&&Number.isInteger(v.width)&&v.width>0&&v.width<=8192).map(v=>photoUrl(v.src)+' '+v.width+'w').join(', '):'';
// Quiet regions are spatial reservations, independent of sparse artwork alpha coverage.
export function photoQuietStyle(quiet){
 if(!quiet||typeof quiet!=='object')return '';
 const {cx,cy,rx,ry}=quiet;
 if(![cx,cy,rx,ry].every(v=>typeof v==='number'&&Number.isFinite(v))||rx<=0||ry<=0||cx-rx<0||cx+rx>1||cy-ry<0||cy+ry>1)return '';
 const clearArea=Math.PI*rx*ry*.94**2;
 if(clearArea<.30||clearArea>.45)return '';
 return [['x',cx],['y',cy],['rx',rx],['ry',ry]].map(([key,value])=>'--quiet-'+key+':'+(value*100).toFixed(4)+'%').join(';');
}
// Places that have blended art (assets/blend-art.js). Their photo span is marked, then filled by enhanceBlend() after render.
const BLEND_PLACES=new Set(['bc-garibaldi','silver-falls','rooster-rock','usfs-6485821010602','usfs-5435010324','dayuse-or-smith-rock-state-park','dayuse-wa-palouse-falls-state-park-heritage-site','cape-disappointment','hurricane-hill','sol-duc-falls','usfs-5250.005571','usfs-7682.004621','dayuse-or-latourell-falls-trailhead-guy-w-talbot','cape-lookout','bc-brandywine']);
export function photoMarkup(photo,className='',placeId=''){
 if(!photoUrl(photo?.src))return '';
 const srcset=photoSrcSet(photo.variants),overlaySrcset=photoSrcSet(photo.overlayVariants,true),quiet=photoQuietStyle(photo.quiet);
 const image=(src,kind,alt='')=>{const responsive=kind==='base'?srcset:kind==='overlay'?overlaySrcset:'';return '<img class="outz-photo__'+kind+'" src="'+escape(photoUrl(src))+'"'+(responsive?' srcset="'+escape(responsive)+'" sizes="(max-width: 800px) 100vw, 800px"':'')+' alt="'+escape(alt)+'" width="'+(Number(photo.width)||1600)+'" height="'+(Number(photo.height)||1000)+'" loading="lazy" decoding="async"'+(kind==='base'?'':' aria-hidden="true"')+'>';};
 return '<span class="outz-photo '+escape(className)+'"'+(BLEND_PLACES.has(placeId)?' data-blend-place="'+escape(placeId)+'"':'')+' data-outz-photo'+(quiet?' data-photo-quiet="true"':'')+' data-photo-rank="'+(Number(photo.rank)||999)+'" style="--photo-position:'+escape(photo.position||'center')+(quiet?';'+quiet:'')+'">'+image(photo.src,'base',photo.alt)+(photoUrl(photo.overlaySrc)?'<span class="outz-photo__graphics">'+image(photo.overlaySrc,'overlay')+(photoUrl(photo.overlayGlowSrc)&&photo.rank<=20?image(photo.overlayGlowSrc,'nodes'):'')+'</span>':'')+'</span>';
}
export function createPhotoMotion(scope=globalThis){
 const doc=scope.document, entries=new Map(),fine=scope.matchMedia?.('(hover: hover) and (pointer: fine)'),reduced=scope.matchMedia?.('(prefers-reduced-motion: reduce)');
 const calm=()=>doc.documentElement.classList.contains('calm-mode')||doc.documentElement.dataset.calm==='true'||(()=>{try{return scope.localStorage?.getItem('pdx-calm-mode')==='true'}catch{return false}})();
 const quiet=()=>doc.hidden||reduced?.matches||calm();
 function reset(element){element.style.setProperty('--photo-x','0px');element.style.setProperty('--photo-y','0px');}
 function sync(){let glowing=0;for(const [element,state]of entries){const moving=!quiet()&&state.visible;element.dataset.photoMotion=String(moving&&Boolean(fine?.matches));element.dataset.photoGlowing=String(moving&&Number(element.dataset.photoRank)<=20&&glowing++<3);if(!moving)reset(element);}}
 const observer=scope.IntersectionObserver?new scope.IntersectionObserver(changes=>{for(const change of changes){const state=entries.get(change.target);if(state)state.visible=change.isIntersecting&&change.intersectionRatio>0;}sync();},{threshold:0.05}):null;
 function attach(element){if(entries.has(element))return ()=>{};
  const move=event=>{if(element.dataset.photoMotion!=='true')return;const r=element.getBoundingClientRect();element.style.setProperty('--photo-x',((event.clientX-r.left)/r.width-.5)*3+'px');element.style.setProperty('--photo-y',((event.clientY-r.top)/r.height-.5)*3+'px');};
  const leave=()=>reset(element);entries.set(element,{visible:!observer,move,leave});element.addEventListener('pointermove',move,{passive:true});element.addEventListener('pointerleave',leave);observer?.observe(element);sync();return()=>detach(element);
 }
 function detach(element){const state=entries.get(element);if(!state)return;observer?.unobserve(element);element.removeEventListener('pointermove',state.move);element.removeEventListener('pointerleave',state.leave);entries.delete(element);reset(element);element.dataset.photoGlowing='false';sync();}
 const mutation=scope.MutationObserver?new scope.MutationObserver(sync):null;mutation?.observe(doc.documentElement,{attributes:true,attributeFilter:['class','data-calm']});
 doc.addEventListener('visibilitychange',sync);scope.addEventListener('storage',sync);reduced?.addEventListener('change',sync);fine?.addEventListener('change',sync);
 return {attach,refresh(root=doc){for(const element of entries.keys())if(!element.isConnected)detach(element);root.querySelectorAll('[data-outz-photo]').forEach(attach);sync();},dispose(){for(const element of [...entries.keys()])detach(element);observer?.disconnect();mutation?.disconnect();doc.removeEventListener('visibilitychange',sync);scope.removeEventListener('storage',sync);reduced?.removeEventListener('change',sync);fine?.removeEventListener('change',sync);}};
}

// Blended art: the engine mounts into the marked photo span and the layered photo hides behind it. Falls back to the photo if it cannot load.
const blendOff=new Set();let blendEngine;
const loadBlend=()=>blendEngine??=import('./blend-art.js?v=20261024-hud');
export function enhanceBlend(root=document){
 for(const entry of [...blendOff])if(!entry.el.isConnected){entry.off?.();blendOff.delete(entry);}
 root.querySelectorAll('.outz-photo[data-blend-place]:not([data-blend-ready])').forEach(el=>{
  el.dataset.blendReady='1';
  loadBlend().then(async mod=>{
   const id=el.dataset.blendPlace,listCard=!!el.closest('#results .place-card'),variant=mod.hasBlend(id,'wide')?'wide':(listCard?null:'tall');
   if(!variant)return;
   if(!mod.hasBlend(id,variant))return;
   const entry={el,off:null};blendOff.add(entry);
   el.classList.add('outz-photo--blend');
   try{entry.off=await mod.mountBlend(el,id,{variant})}catch{el.classList.remove('outz-photo--blend')}
  }).catch(()=>{});
 });
}
let runtime;
export function enhancePhotos(){(runtime??=createPhotoMotion()).refresh();enhanceBlend();}
export function attachPhoto(element){return (runtime??=createPhotoMotion()).attach(element);}

// The React shell loads this public module through a script element (also valid in Vite dev).
if(typeof window!=='undefined')window.__outzPhotoMotion={attachPhoto};
