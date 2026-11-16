import {useState,type ReactNode} from 'react';
import './CardBrowse.css';
export const CARD_BATCH_SIZE=10;
export type BrowseCardSize='small'|'wide';
export function browseLimit(scope:string,page:{scope:string;count:number}){return page.scope===scope?page.count:CARD_BATCH_SIZE;}
/** Only the enclosing slots scale. The approved native card dimensions stay untouched. */
export default function CardBrowse<T>({items,scope,label,renderCard}:{items:T[];scope:string;label:string;renderCard:(item:T,size:BrowseCardSize)=>ReactNode}){
 const [size,setSize]=useState<BrowseCardSize>('small');
 const [page,setPage]=useState({scope,count:CARD_BATCH_SIZE});
 if(page.scope!==scope)setPage({scope,count:CARD_BATCH_SIZE});
 const limit=browseLimit(scope,page),shown=items.slice(0,limit);
 return <section className="places-card-browse" aria-label={label}>
  <div className="places-card-view" role="group" aria-label={`${label} card view`}>
   <button type="button" aria-pressed={size==='small'} onClick={()=>setSize('small')}>Small cards</button>
   <button type="button" aria-pressed={size==='wide'} onClick={()=>setSize('wide')}>Wide cards</button>
  </div>
  <div className="places-card-grid" data-card-view={size}>{shown.map(item=>renderCard(item,size))}</div>
  <p className="places-card-count" aria-live="polite">{Math.min(limit,items.length)} of {items.length}</p>
  {items.length>limit&&<button type="button" className="places-card-load-more" onClick={()=>setPage(previous=>({scope,count:browseLimit(scope,previous)+CARD_BATCH_SIZE}))}>Load more <span>({items.length-limit} remaining)</span></button>}
 </section>;
}
