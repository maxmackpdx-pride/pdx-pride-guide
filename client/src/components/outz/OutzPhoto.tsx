import {useEffect,useRef,type CSSProperties} from 'react';
import './OutzPhoto.css';
export type OutzPhotoData={src:string;variants?:{src:string;width:number}[];overlaySrc?:string;overlayGlowSrc?:string;rank?:number;width?:number;height?:number;position?:string;alt?:string;sourceUrl?:string;author?:string;licenseUrl?:string;license?:string;treatment?:string};
const localPhoto=(src?:string)=>typeof src==='string'&&/^(?:\/outzide-map\/)?assets\/photos\/[A-Za-z0-9._/-]+$/.test(src)&&!src.split('/').some(part=>part==='.'||part==='..')?(src.startsWith('/')?src:'/outzide-map/'+src):undefined;
type PhotoMotionApi={attachPhoto:(element:HTMLElement)=>()=>void};
let motionScript:Promise<PhotoMotionApi>|undefined;
function loadPhotoMotion(){
 return motionScript??=new Promise<PhotoMotionApi>((resolve,reject)=>{
  const scope=window as Window&{__outzPhotoMotion?:PhotoMotionApi};
  if(scope.__outzPhotoMotion){resolve(scope.__outzPhotoMotion);return;}
  const script=document.createElement('script');script.type='module';script.src='/outzide-map/assets/destination-photos.js?v=20261017-layered';
  script.onload=()=>scope.__outzPhotoMotion?resolve(scope.__outzPhotoMotion):reject(new Error('Photo motion unavailable'));
  script.onerror=()=>reject(new Error('Photo motion unavailable'));document.head.append(script);
 });
}
export function OutzPhoto({photo,className=''}:{photo:OutzPhotoData;className?:string}){
 const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{let disposed=false,detach:(()=>void)|undefined;loadPhotoMotion().then(module=>{if(!disposed&&ref.current)detach=module.attachPhoto(ref.current)}).catch(()=>{/* The artwork remains static if motion cannot load. */});return()=>{disposed=true;detach?.()};},[photo.src]);
 const dimensions={width:photo.width||1600,height:photo.height||1000};
 if(!localPhoto(photo.src))return null;
 const srcSet=Array.isArray(photo.variants)?photo.variants.filter(v=>v&&typeof v==='object'&&localPhoto(v.src)&&/\.(?:webp|avif|png|jpe?g)$/i.test(v.src)&&Number.isInteger(v.width)&&v.width>0&&v.width<=8192).map(v=>`${localPhoto(v.src)} ${v.width}w`).join(', '):undefined;
 return <span ref={ref} className={`outz-photo ${className}`} data-outz-photo data-photo-rank={photo.rank||999} style={{'--photo-position':photo.position||'center'} as CSSProperties}>
  <img className="outz-photo__base" src={localPhoto(photo.src)} srcSet={srcSet||undefined} sizes={srcSet?'(max-width: 800px) 100vw, 800px':undefined} alt={photo.alt||''} {...dimensions} loading="lazy" decoding="async" />
  {localPhoto(photo.overlaySrc)&&<span className="outz-photo__graphics" aria-hidden="true"><img className="outz-photo__overlay" src={localPhoto(photo.overlaySrc)} alt="" {...dimensions} loading="lazy" decoding="async" />{photo.rank&&photo.rank<=20&&localPhoto(photo.overlayGlowSrc)&&<img className="outz-photo__nodes" src={localPhoto(photo.overlayGlowSrc)} alt="" {...dimensions} loading="lazy" decoding="async" />}</span>}
 </span>;
}
