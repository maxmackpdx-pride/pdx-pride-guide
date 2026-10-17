import React,{useId} from 'react';
import {housingTypes} from './houz-model';
import {categoryMotifRecipe} from '@/lib/designMotifRecipes';
import {useMotifRecipes} from '../../artwork/useMotifRecipes';
export const punkArtwork=[
  {id:'gift-box',label:'Gift box',group:'Objects',example:'giving'},
  {id:'magnifying-glass',label:'Magnifying glass',group:'Objects',example:'iso'},
  {id:'microphone',label:'Microphone',group:'Objects',example:'available'},
  {id:'message-bubbles',label:'Two message bubbles',group:'Objects',example:'connection'},
  {id:'hearts',label:'Hearts',group:'Objects',example:'connection'},
  {id:'house',label:'House',group:'Objects',example:'forming'},
  {id:'white-stag',label:'White Stag sign',group:'Portland',example:'forming'},
  {id:'mount-hood',label:'Mount Hood',group:'Portland',example:'looking'},
  {id:'st-johns-bridge',label:'St. Johns Bridge',group:'Portland',example:'looking'},
  {id:'steel-bridge',label:'Steel Bridge',group:'Portland',example:'forming'},
  {id:'pioneer-courthouse',label:'Pioneer Courthouse',group:'Portland',example:'managed'},
  {id:'progress-pride',label:'Progress Pride flag',group:'Flags',example:'giving',color:true},
  {id:'trans-flag',label:'Trans flag',group:'Flags',example:'giving',color:true},
].map(a=>({...a,libraryId:`boardz-${a.id}`}));
const byId=Object.fromEntries(punkArtwork.map(a=>[a.id,a]));
function seedNumber(text){return Array.from(String(text)).reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7)}
export function resolvePunkArtwork(post){
  if(post.collageChoice==='wireframe')return null;
  if(byId[post.collageChoice])return byId[post.collageChoice];
  const fallback={giftz:post.intent==='iso'?'magnifying-glass':'gift-box',mizzed:'message-bubbles',housing:'house',gigz:/\b(dj|music|singer|karaoke|microphone)\b/i.test(post.title||'')?'microphone':null};
  return byId[fallback[post.category]]||null;
}
export function PunkArtworkFilters(){return <svg width="0" height="0" aria-hidden="true" style={{position:'absolute'}}><defs><filter id="punk-cutout-alpha" colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="5" intercept="-3.6"/></feComponentTransfer></filter></defs></svg>}
export function punkPostInk(post){return post.category==='housing'?housingTypes[post.intent].color:({gigz:'#6E3DFF',sellz:'#39FF14',giftz:'#CCFF00',mizzed:'#FF00CC'}[post.category]||'#00FFFF')}
// Preserve 20% of the flag's own color; category ink belongs to its surrounding scraps.
export function PunkInkImage({art,secondary='#00FFFF'}){
  const id='paper-ink-'+useId().replace(/:/g,'');
  if(!art.color)return <img src={art.src} crossOrigin={art.libraryId?'anonymous':undefined} alt="" decoding="async" loading="lazy"/>;
  return <svg className="punk-flag-ink" viewBox="0 0 768 512" aria-hidden="true" focusable="false" data-secondary={secondary} data-color-retention="20%"><defs><filter id={id} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="5" intercept="-3.6"/></feComponentTransfer><feColorMatrix type="saturate" values="0.2"/><feComponentTransfer><feFuncR type="linear" slope="1.35" intercept="-.175"/><feFuncG type="linear" slope="1.35" intercept="-.175"/><feFuncB type="linear" slope="1.35" intercept="-.175"/></feComponentTransfer></filter></defs><image href={art.src} crossOrigin="anonymous" width="768" height="512" preserveAspectRatio="xMidYMid meet" filter={`url(#${id})`}/></svg>;
}
export function PunkArtwork({post}){
  const recipes=useMotifRecipes();
  const recipe=categoryMotifRecipe(recipes,'boardz',post.category,post.intent);
  const hero=recipe&&recipes?.assets[recipe.heroId];
  const defaultId=({giftz:post.intent==='iso'?'magnifying-glass':'gift-box',mizzed:'message-bubbles',housing:'house',gigz:'microphone',sellz:'price-tag'})[post.category];
  const selected=resolvePunkArtwork(post);
  const useCategoryHero=post.collageChoice!=='wireframe'&&(!byId[post.collageChoice]||post.collageChoice===defaultId);
  const asset=useCategoryHero?hero:selected&&recipes?.assets[selected.libraryId];
  const art=asset?{...selected,id:useCategoryHero?defaultId:selected.id,src:asset.url,libraryId:asset.id}:null;
  if(!art)return null;
  const n=seedNumber(post.key||post.id||post.title);
  return <div className="punk-object" data-art={art.id} data-library-motif={art.libraryId} data-color={art.color||undefined} style={{'--scrap-tilt':`${(n%13)-6}deg`,'--scrap-x':`${(n%11)-5}px`,'--scrap-y':`${((n>>>3)%9)-4}px`,'--scrap-size':`${.95+(n%8)*.01}`}} aria-hidden="true"><PunkInkImage art={art} secondary={punkPostInk(post)}/></div>;
}
