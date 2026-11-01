export const OUTZIDE_KINDS={trail:'outzide-trail',stay:'outzide-stay',beach:'outzide-beach',camp:'outzide-camp',spring:'outzide-spring',fishing:'outzide-fishing',boating:'outzide-boating',atv:'outzide-atv',winter:'outzide-winter',dayuse:'outzide-day-use'};
// Null means retain the existing runtime's specific icon/cluster/count fallback.
export const OUTZIDE_FALLBACKS={coastcamp:null,watercamp:null,mixed:null};
export const OUTZIDE_HEAD_SIZES={ordinary:28,special:34,selected:44,minTouchPx:44};
export async function createOutzideWaypoint(store,{id,kind,...options}){
 const key=id||OUTZIDE_KINDS[kind];if(!key||!key.includes('outzide'))return null;return store.build(key,options);
}
