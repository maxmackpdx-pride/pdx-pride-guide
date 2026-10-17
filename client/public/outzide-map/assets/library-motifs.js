import {motionPreference} from '../../map-foundation/motion.js';

export const FOUNDATION_ORIGIN='https://zaylist-foundation-library.maxmackpdx.workers.dev';
export const RECIPES_URL=FOUNDATION_ORIGIN+'/api/design/v1/motif-recipes';
const SNAPSHOT_URL='/card-art/motif-recipes.json';
const NS='http://www.w3.org/2000/svg';
const DEPTHS=['back','middle','front'];
let recipes=null,request=null,serial=0;
const observed=new Set();
const built=new WeakSet();

// The only shared fallback is the unchanged alpine artwork registered in the Library.
export function placeMotifIds(place){
 const ids=['outzide-place-'+place.id];
 if(place.art==='assets/motifs/adventure-map-alpine-waypoints.svg')ids.push('outzide-adventure-map-alpine-waypoints');
 return ids;
}
export function networkStack(index){
 const position=Math.max(0,Math.floor(index));
 return {set:position%2===0?'a':'b',orientation:['normal','mirror-x','half-turn','mirror-y'][(position+Math.floor(position/4))%4]};
}
const seedFor=key=>Array.from(key).reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function motifImage(place,className){
 return '<img class="'+className+'" data-outzide-motif-ids="'+escape(placeMotifIds(place).join(' '))+'" alt="" loading="lazy" decoding="async">';
}
export function networkMarkup(identity){
 return '<span class="outzide-network" data-outzide-network="'+escape(identity)+'" aria-hidden="true"></span>';
}
export function parseRecipes(value){
 if(!value||typeof value.release!=='string'||!value.assets||!value.networkSets)throw Error('Invalid Library motif release');
 for(const [id,asset] of Object.entries(value.assets)){
  if(!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)||!asset||asset.id!==id)throw Error('Invalid Library motif ID');
  const url=new URL(asset.url);
  const versioned=typeof asset.sha256==='string'&&/^[a-f0-9]{64}$/.test(asset.sha256)&&url.searchParams.get('v')===asset.sha256.slice(0,16)&&[...url.searchParams.keys()].length===1;
  if(url.origin!==FOUNDATION_ORIGIN||url.pathname!=='/api/design/v1/motifs/'+id+'/file'||(url.search&&!versioned)||url.hash)throw Error('Unregistered motif URL');
 }
 for(const set of ['a','b'])if(!Array.isArray(value.networkSets[set])||value.networkSets[set].length!==3||value.networkSets[set].some(id=>!value.assets[id]))throw Error('Incomplete network triptych');
 return value;
}
export function loadMotifRecipes(){
 if(!request)request=(async()=>{
  for(const url of [RECIPES_URL,SNAPSHOT_URL]){
   try{const response=await fetch(url,{credentials:'omit',signal:AbortSignal.timeout(8000)});if(!response.ok)continue;return parseRecipes(await response.json());}catch{/* A checked API snapshot keeps the same published release available offline. */}
  }
  return null;
 })();
 return request;
}
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
 for(const entry of entries){entry.target.dataset.visible=String(entry.isIntersecting);syncPlaying(entry.target);}
},{threshold:0}):null;
function syncPlaying(element){element.style.setProperty('--outzide-motif-playing',!document.hidden&&!motionPreference.matches&&element.dataset.visible==='true'?'running':'paused');}
function svgElement(tag,attributes={}){const node=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attributes))node.setAttribute(key,String(value));return node;}
function buildNetwork(element,set){
 const orientation=document.createElement('span');orientation.className='outzide-network__orientation';
 const seed=seedFor(element.dataset.outzideNetwork||'outzide');
 for(let i=0;i<3;i++){
  const asset=recipes.assets[recipes.networkSets[set][i]];
  const plane=document.createElement('span');plane.className='outzide-network__plane outzide-network__plane--'+DEPTHS[i];plane.dataset.networkDepth=DEPTHS[i];
  const svg=svgElement('svg',{viewBox:'0 0 1280 1066',preserveAspectRatio:'none'});
  if(asset.alpha){svg.append(svgElement('image',{href:asset.url,crossorigin:'anonymous',x:0,y:0,width:1280,height:1066,preserveAspectRatio:'none','data-native-alpha':'true'}));}
  else{const defs=svgElement('defs'),maskId='outzide-network-'+(++serial),mask=svgElement('mask',{id:maskId,maskUnits:'userSpaceOnUse',x:0,y:0,width:1280,height:1066});mask.style.maskType='luminance';
  mask.append(svgElement('image',{href:asset.url,crossorigin:'anonymous',x:0,y:0,width:1280,height:1066,preserveAspectRatio:'none'}));defs.append(mask);
  svg.append(defs,svgElement('rect',{width:1280,height:1066,fill:'white',mask:'url(#'+maskId+')'}));}
  plane.append(svg);orientation.append(plane);
 }
 element.replaceChildren(orientation);element.style.setProperty('--outzide-motif-phase',-(seed%37)+'s');element.dataset.release=recipes.release;element.dataset.networkSet=set;built.add(element);
}
export function enhanceOutzideMotifs(){
 for(const element of observed)if(!element.isConnected){observer?.unobserve(element);observed.delete(element);}
 const networks=[...document.querySelectorAll('[data-outzide-network]')];
 networks.forEach((element,index)=>{
  const {set,orientation}=networkStack(index);element.dataset.networkOrientation=orientation;
  if(recipes&&(!built.has(element)||element.dataset.release!==recipes.release||element.dataset.networkSet!==set))buildNetwork(element,set);
  if(!observed.has(element)){observed.add(element);element.dataset.visible=observer?'false':'true';observer?.observe(element);}
  syncPlaying(element);
 });
 if(recipes)for(const image of document.querySelectorAll('[data-outzide-motif-ids]')){
  const asset=image.dataset.outzideMotifIds.split(' ').map(id=>recipes.assets[id]).find(Boolean);
  if(asset){if(image.getAttribute('src')!==asset.url)image.src=asset.url;image.dataset.motifId=asset.id;}
 }
}
document.addEventListener('visibilitychange',()=>observed.forEach(syncPlaying));
motionPreference.addEventListener('change',()=>observed.forEach(syncPlaying));
loadMotifRecipes().then(value=>{recipes=value;enhanceOutzideMotifs();});
