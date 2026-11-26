export type MapMode='mapz'|'outzide'|'boardz'|'afterz'|'zaydark';
const boards:Record<string,string>={gig:'gigz',gigz:'gigz',gift:'giftz',giftz:'giftz',sell:'sellz',sellz:'sellz',houz:'houz',housing:'houz',mizzed:'mizzed',spotted:'mizzed'};
const id=(value:string|null)=>value&&/^\d+$/.test(value)?value:null;
export function mapBookmark(params:URLSearchParams,mode:MapMode){
 const item=params.get('item');if(item)return {mode,selectedId:item};
 for(const [key,board] of Object.entries(boards)){const post=id(params.get(key));if(post)return {mode:'boardz' as const,selectedId:`board-${board}-${post}`};}
 if(mode==='boardz'){const board=boards[params.get('board')??params.get('layer')??''],post=id(params.get('post'));return {mode,selectedId:board&&post?`board-${board}-${post}`:undefined};}
 if(mode==='outzide')return {mode,selectedId:params.get('place')??params.get('guestPlace')??undefined};
 if(mode==='mapz'){
  const event=params.get('event');if(event&&/^-?\d+$/.test(event))return {mode,native:{kind:'event' as const,id:event}};
  const place=id(params.get('place'));if(place)return {mode,native:{kind:'place' as const,id:place}};
 }
 return {mode};
}

export function canonicalBoardBookmark(params:URLSearchParams,selectedId:string) {
 const next=new URLSearchParams(params);
 next.set('mode','boardz');
 next.set('item',selectedId);
 for(const key of [...Object.keys(boards),'board','post','layer'])next.delete(key);
 return next;
}


// Shared map selections may arrive through a pin, an older bookmark, or a share link.
export function outzDestinationSelection(pathname:string, params:URLSearchParams, mode:MapMode) {
 if(mode!=='outzide')return undefined;
 const shared=pathname.match(/^\/outzide\/share\/([^/]+)\/?$/)?.[1];
 let candidate=params.get('item')??params.get('place')??params.get('guestPlace')??shared;
 if(candidate && shared===candidate) {
  try { candidate=decodeURIComponent(candidate); } catch { return undefined; }
 }
 return candidate && /^[a-z0-9][a-z0-9_.-]{0,159}$/i.test(candidate)?candidate:undefined;
}
export function outzDestinationClosedUrl(url:URL) {
 const next=new URL(url);
 if(next.pathname.startsWith('/outzide/share/'))next.pathname='/outzide';
 for(const key of ['item','place','guestPlace','wall','tab'])next.searchParams.delete(key);
 return next.pathname+next.search+next.hash;
}
