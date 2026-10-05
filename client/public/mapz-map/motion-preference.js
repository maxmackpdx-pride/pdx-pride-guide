/** Shared by the renderer and waypoint sprites; storage is read once, never per pin/frame. */
export function createMotionPreference(scope=globalThis){
 const media=scope.matchMedia?.('(prefers-reduced-motion: reduce)');
 let calm=false;
 try{calm=scope.localStorage?.getItem('pdx-calm-mode')==='true';}catch{}
 const listeners=new Set();
 const preference={
  get matches(){return Boolean(media?.matches||calm);},
  addEventListener(type,listener){if(type==='change')listeners.add(listener);},
  removeEventListener(type,listener){if(type==='change')listeners.delete(listener);},
  dispose(){scope.removeEventListener?.('storage',onStorage);media?.removeEventListener('change',onChange);listeners.clear();},
 };
 function onChange(){for(const listener of listeners)listener({matches:preference.matches});}
 function onStorage(event){
  if(event.key!==null&&event.key!=='pdx-calm-mode')return;
  // ThemeContext writes in the host document; its same-origin iframe receives this event.
  if(event.storageArea&&event.storageArea!==scope.localStorage)return;
  const before=preference.matches;
  calm=event.key!==null&&event.newValue==='true';
  if(before!==preference.matches)onChange();
 }
 scope.addEventListener?.('storage',onStorage);
 media?.addEventListener('change',onChange);
 return preference;
}
export const motionPreference=createMotionPreference();
