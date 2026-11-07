import release from '@shared/mapReleaseLock.json';
let started=false;
/** Prefetch only the pinned unified engine, never a retired renderer. */
export function prefetchMapz(){
 if(started||typeof document==='undefined'||!/^[a-f0-9]{40}$/.test(release.commit))return;
 started=true;
 for(const [href,rel,as] of [[release.entry,'modulepreload',''],...release.styles.map(file=>[file,'preload','style'])]){
  const link=document.createElement('link');link.rel=rel;link.href=release.base+href;if(as)link.as=as;document.head.appendChild(link);
 }
 void import('@/pages/UnifiedMap');
}
