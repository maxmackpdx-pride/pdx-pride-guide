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
