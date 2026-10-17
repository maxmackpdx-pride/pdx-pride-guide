/** Shared input contract for Boardz forms and both card presentations. */
export const BOARD_TEXT_LIMITS={title:60,description:4000,subtext:120,price:32,area:80} as const;
export const BOARD_NEIGHBORHOODS=['Downtown','Old Town','Pearl','NW','N','NE','Alberta','Inner East','Central Eastside','SE','Montavilla','SW','Hawthorne','Belmont','Division','Mississippi','Alberta Arts District'] as const;
export const BOARD_PAPER_ART=[
 ['microphone','Microphone'],['hearts','Hearts'],['white-stag','White Stag sign'],['mount-hood','Mount Hood'],['st-johns-bridge','St. Johns Bridge'],['steel-bridge','Steel Bridge'],['pioneer-courthouse','Pioneer Courthouse'],['progress-pride','Progress Pride flag'],['trans-flag','Trans flag'],
] as const;
export function boardPaperChoice(value?:string){return value?.startsWith('paper:')&&BOARD_PAPER_ART.some(([id])=>value===`paper:${id}`)?value.slice(6):undefined;}
export function boardTextError(input:Record<string,unknown>,housing=false):string|null{
 const fields=housing?{headline:'title',body:'description',budget:'price',rent:'price'}:{title:'title',description:'description',body:'description',skills:'subtext',compensation:'price',location:'area',neighborhood:'area'};
 for(const [field,limitKey] of Object.entries(fields)){
  const value=input[field],limit=BOARD_TEXT_LIMITS[limitKey as keyof typeof BOARD_TEXT_LIMITS];
  if(value!=null&&String(value).trim().length>limit)return `${field[0].toUpperCase()+field.slice(1)} must be ${limit} characters or fewer.`;
 }
 return null;
}
