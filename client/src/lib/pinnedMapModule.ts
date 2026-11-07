import release from '@shared/mapReleaseLock.json';
import {normalizeMapHostTokens} from './mapHostTokens';
export type PinnedMapModule={
 mount:(node:HTMLElement,options:Record<string,unknown>)=>{unmount:()=>void};
 mountDestinationCard:(node:HTMLElement,options:{placeId:string;loginHref?:string;onClose?:()=>void;onNavigate?:(href:string)=>void})=>{unmount:()=>void};
 mountMapPicker:(node:HTMLElement,options:Record<string,unknown>)=>{unmount:()=>void;send:(command:string,value:unknown)=>void;updateWaypoints:(points:unknown[])=>void};
};
let restoreTokens:(()=>void)|undefined;
let users=0;let loaded:Promise<PinnedMapModule>|undefined;const styles:HTMLLinkElement[]=[];
/** Shared native release acquisition: card/picker/map never load an old iframe
 * or remove another mounted consumer's stylesheet. Failed loads are retryable. */
export async function acquirePinnedMapModule(){
 users++;let released=false;
 const releaseOwner=()=>{if(released)return;released=true;users--;if(users===0){restoreTokens?.();restoreTokens=undefined;for(const style of styles)style.remove();styles.length=0;loaded=undefined;}};
 if(!loaded)loaded=(async()=>{
  if(!/^[a-f0-9]{40}$/.test(release.commit)||!release.entry.endsWith('.js'))throw Error('Pinned map release is unavailable.');
  await Promise.all(release.styles.map(file=>new Promise<void>((resolve,reject)=>{
   const style=document.createElement('link');style.rel='stylesheet';style.href=release.base+file;style.dataset.mapRelease=release.tag;
   const timer=window.setTimeout(()=>reject(Error('Map styles timed out.')),20000);
   style.onload=()=>{window.clearTimeout(timer);resolve();};style.onerror=()=>{window.clearTimeout(timer);reject(Error('Map styles could not load.'));};
   styles.push(style);document.head.appendChild(style);
  })));
  restoreTokens=normalizeMapHostTokens();
  const entry=release.base+release.entry;
  return await import(/* @vite-ignore */ entry) as PinnedMapModule;
 })();
 try{return {module:await loaded,release:releaseOwner};}catch(error){releaseOwner();throw error;}
}
