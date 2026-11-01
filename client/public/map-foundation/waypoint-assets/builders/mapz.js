export const MAPZ_HEAD_SIZES={unselectedFar:31,unselectedNear:36,selectedFar:57,selectedNear:49,selectionMs:180,minTouchPx:44};
export function mapzHeadPixels(zoom,selected=false){const t=Math.max(0,Math.min(1,(zoom-12)/4));return selected?57-8*t:31+5*t;}
export async function createMapzWaypoint(store,{id,kind,...options}){
 const key=id||(kind?`placez-${kind}`:null);if(!key||key.includes('outzide'))return null;
 return store.build(key,options);
}
