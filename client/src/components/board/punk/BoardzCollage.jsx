import React,{useRef} from 'react';
import {MapPin} from 'lucide-react';
import {BoardCardMotif} from './BoardCardMotif';
import {CutoutHeadline} from './CutoutHeadline';
import {RansomText} from './RansomText';
import {PunkArtwork} from './PunkArtwork';
import {useCardMotion} from './useCardMotion';

export const boardPalette={gigz:{color:'#6E3DFF',ink:'#b06bff'},sellz:{color:'#39FF14',ink:'#39FF14'},giftz:{color:'#CCFF00',ink:'#CCFF00'},mizzed:{color:'#FF00CC',ink:'#FF00CC'}};
export function BoardzInkFilters(){return <svg width="0" height="0" aria-hidden="true" focusable="false" style={{position:'absolute',pointerEvents:'none'}}><defs>{Object.entries(boardPalette).map(([key,{color}])=>{const [r,g,b]=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);return <React.Fragment key={key}><filter id={'bz-frame-'+key} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="1.6" intercept="-.12"/><feFuncG type="linear" slope="1.6" intercept="-.12"/><feFuncB type="linear" slope="1.6" intercept="-.12"/></feComponentTransfer><feColorMatrix values={`${1-r} ${r/2} ${r/2} 0 0 ${1-g} ${g/2} ${g/2} 0 0 ${1-b} ${b/2} ${b/2} 0 0 0 0 0 1 0`}/></filter><filter id={'bz-ink-'+key} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncG type="linear" slope="1.35" intercept="-.12"/></feComponentTransfer><feColorMatrix values={`0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 0 0 0 1 0`}/></filter></React.Fragment>})}</defs></svg>}

export function BoardzCollage({r,small=false,calm=false,Photo,Save,Location}){
  const ref=useRef(null);
  useCardMotion(ref,`${r.key||r.id}:${small?'small':'large'}`,calm);
  const palette=boardPalette[r.category];
  const photos=r.category==='mizzed'||r.previewNoPhoto?[]:r.photos?.length?r.photos:r.photo?[r.photo]:[];
  const seeking=['available','iso'].includes(r.intent);
  const title=r.intent==='iso'?r.title.replace(/^ISO:\s*/i,''):r.title;
  const giftzValue=r.category==='giftz'?{iso:'IN SEARCH OF',giving:'NEW HOME?',grab:'NEW HOME?'}[r.intent]:undefined;
  const value=String(giftzValue??r.value??'').replace(/\s*\/hr\s*$/i,'/HR').toUpperCase();
  const compensation=r.intent==='hiring'&&value.length>18;
  return <article ref={ref} className="bz-card" data-category={r.category} data-intent={r.intent} data-size={small?'small':'large'} data-seeking={seeking||undefined} data-has-photos={photos.length>0||undefined} data-long-value={compensation||undefined} style={{'--c':palette.color,'--secondary':palette.color,'--bz-ink':palette.ink,'--bz-frame':`url('#bz-frame-${r.category}')`,'--bz-tint':`url('#bz-ink-${r.category}')`,'--ab-accent':palette.color}} aria-label={`${r.kicker}: ${title}`}>
    <span className="bz-stock" aria-hidden="true"/>
    <span className="bz-paper-rim" aria-hidden="true"/>
    <span className="bz-shade" aria-hidden="true"/>
    {photos.length>0&&<div className="bz-photo"><Photo photos={photos} alt={title} calm={calm}/></div>}
    <BoardCardMotif placement="card" post={{...r,key:`${r.key||r.id}:${small?'small':'large'}`,motifChoice:r.motifChoice}}/>
    {(photos.length===0||['mizzed','giftz'].includes(r.category))&&<PunkArtwork post={r.category==='mizzed'?{...r,collageChoice:'message-bubbles'}:r.category==='giftz'?{...r,collageChoice:r.intent==='iso'?'magnifying-glass':'gift-box'}:r}/>}
    <div className="bz-scraps" aria-hidden="true"><i/><b/><span/><em/></div>
    <p className="bz-type">{r.kicker}</p>
    <div className="bz-content">
      <h2 className="bz-title" title={title} aria-label={title}><CutoutHeadline text={title} maxLines={r.intent==='connection'||(!small&&giftzValue)?3:2} balance={!small} minInset={small?6:14} ransom seed={`${r.key}:title`}/></h2>
      {value&&!giftzValue&&r.category!=='sellz'&&<p className="bz-value" title={value}>{r.intent==='hiring'?<span>{value}</span>:<RansomText text={value} seed={`${r.key}:price`}/>}</p>}
      {r.description&&<p className="bz-description" title={r.description}><span className="bz-description-copy">{r.description}</span></p>}
    </div>
    {giftzValue&&<p className="bz-value bz-status" title={giftzValue}><RansomText text={giftzValue} seed={`${r.key}:price`}/></p>}
    {r.category==='sellz'&&value&&<p className="bz-value bz-sale-price" title={value} style={{'--sale-price-size':`${Math.min(small?20:32,(small?150:230)/Math.max(value.length,1))}px`}}><RansomText text={value} seed={`${r.key}:price`}/></p>}
    <p className="bz-location" title={r.detail}><MapPin/>{Location?<Location text={r.detail}/>:<span>{r.detail}</span>}</p>
    <img className="bz-logo" src={'/boardz/punk/'+r.logo} alt={r.category==='mizzed'?'Mizzed Connection':r.category}/>
    <Save small={small}/>
  </article>;
}
