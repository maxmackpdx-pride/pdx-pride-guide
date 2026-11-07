import {prefetchMapz} from './prefetchMapz';
/** One shared native engine; warm its pinned code plus the public catalog only. */
export function prefetchOutzide(){
 prefetchMapz();
 if(typeof document==='undefined')return;
 for(const file of ['places.json','details.json','routes.json']){
  const href='/outzide-map/'+file;
  if(document.querySelector(`link[data-outz-catalog="${file}"]`))continue;
  const link=document.createElement('link');link.rel='prefetch';link.as='fetch';link.href=href;link.dataset.outzCatalog=file;document.head.appendChild(link);
 }
}
