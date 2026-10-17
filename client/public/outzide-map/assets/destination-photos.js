/** Two aligned image planes; no canvas, frame loop, or location/orientation sensors. */
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const photoUrl=value=>typeof value==='string'&&/^(?:\/outzide-map\/)?assets\/photos\/[A-Za-z0-9._/-]+$/.test(value)&&!value.split('/').some(part=>part==='.'||part==='..')?(value.startsWith('/')?value:'/outzide-map/'+value):'';
const photoSrcSet=variants=>Array.isArray(variants)?variants.filter(v=>v&&typeof v==='object'&&photoUrl(v.src)&&/\.(?:webp|avif|png|jpe?g)$/i.test(v.src)&&Number.isInteger(v.width)&&v.width>0&&v.width<=8192).map(v=>photoUrl(v.src)+' '+v.width+'w').join(', '):'';
export function photoMarkup(photo,className=''){
 if(!photoUrl(photo?.src))return '';
 const srcset=photoSrcSet(photo.variants);
 const image=(src,kind,alt='')=>'<img class="outz-photo__'+kind+'" src="'+escape(photoUrl(src))+'"'+(kind==='base'&&srcset?' srcset="'+escape(srcset)+'" sizes="(max-width: 800px) 100vw, 800px"':'')+' alt="'+escape(alt)+'" width="'+(Number(photo.width)||1600)+'" height="'+(Number(photo.height)||1000)+'" loading="lazy" decoding="async"'+(kind==='base'?'':' aria-hidden="true"')+'>';
 return '<span class="outz-photo '+escape(className)+'" data-outz-photo data-photo-rank="'+(Number(photo.rank)||999)+'" style="--photo-position:'+escape(photo.position||'center')+'">'+image(photo.src,'base',photo.alt)+(photoUrl(photo.overlaySrc)?'<span class="outz-photo__graphics">'+image(photo.overlaySrc,'overlay')+(photoUrl(photo.overlayGlowSrc)&&photo.rank<=20?image(photo.overlayGlowSrc,'nodes'):'')+'</span>':'')+'</span>';
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
let runtime;
export function enhancePhotos(){(runtime??=createPhotoMotion()).refresh();}
export function attachPhoto(element){return (runtime??=createPhotoMotion()).attach(element);}

// The React shell loads this public module through a script element (also valid in Vite dev).
if(typeof window!=='undefined')window.__outzPhotoMotion={attachPhoto};
