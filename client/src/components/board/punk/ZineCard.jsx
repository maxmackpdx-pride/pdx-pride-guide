import React,{useLayoutEffect,useRef,useState} from 'react';
import {NetworkBackdrop} from '../../artwork/NetworkBackdrop';
import {useMotifRecipes} from '../../artwork/useMotifRecipes';
import {categoryMotifRecipe} from '@/lib/designMotifRecipes';
import {boardPalette} from './BoardzCollage';
import {punkArtwork,PunkInkImage} from './PunkArtwork';
import {housingTypes,housingPrice,householdCount,housingFaceMembers,visibleHousingFaceSlots} from './houz-model';
import {useCardMotion} from './useCardMotion';
import './zine-card.css';
import './zine-decay.css';

// Boardz zine cards: Wheatpaste (posts with a photo) and Cutout (posts without). Spec and canvas generator:
// docs/boardz-card-redesign/ (gen_dirs2.py, gen_rooms.py, dirs2.css).
const HOUZ_CYAN='#19E3FF';
const SEEKING=['available','iso','looking','forming','offering'];
// Cut Type mixes for the headline key word: the only two with no reversed glyphs.
const TITLE_MIX=['CutMixPaper','CutMixLoose'];
const VALUE_MIX=['CutMixPaper','CutMixRough','CutMixReverse','CutMixMixed','CutMixLoose','CutMixRansom','CutMixWorn','CutMixTall'];
const DEFAULT_ART={housing:'house',mizzed:'message-bubbles',gigz:'microphone',sellz:'price-tag'};
const MOTIF={'magnifying-glass':'magnifier','message-bubbles':'bubbles',microphone:'mic','price-tag':'tag','gift-box':'gift',house:'house'};

function hash31(text){return Array.from(String(text)).reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,0)}
// Same LCG as the canvas generator, so a post keeps the decay rhythm it had in the mockups.
function rng(seed){let h=0;for(const c of seed)h=(Math.imul(h,131)+c.charCodeAt(0))>>>0;return()=>{h=(Math.imul(h,1103515245)+12345)&0x7fffffff;return h/0x7fffffff}}
function decayVars(key){
  const r=rng('v'+key),out={};
  for(const layer of ['rim','skin','hero','jit']){out[`--zd-${layer}-n`]=`zine-zd-${Math.floor(r()*8)}`;out[`--zd-${layer}-d`]=`${(7+r()*9).toFixed(2)}s`;out[`--zd-${layer}-o`]=`${(-r()*16).toFixed(2)}s`}
  return out;
}

function hexRgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)}
function matrix(hex,weights){return hexRgb(hex).map(c=>weights.map(w=>(c*w).toFixed(3)).join(' ')+' 0 0').join(' ')+' 0 0 0 1 0'}
function frameMatrix(hex){return hexRgb(hex).map(c=>`${(1-c).toFixed(3)} ${(c/2).toFixed(3)} ${(c/2).toFixed(3)} 0 0`).join(' ')+' 0 0 0 1 0'}
const LUMA=[.2126,.7152,.0722],STRIP=[.32,1.07,.11];
const inks={...Object.fromEntries(Object.entries(boardPalette).map(([k,v])=>[k,v.color])),houz:HOUZ_CYAN,...Object.fromEntries(Object.entries(housingTypes).map(([k,v])=>['houz-'+k,v.color]))};
/** Torn-rim color map (the live bz-frame recipe), hero sticker and strip recolors, one set per accent. */
export function ZineFilters(){
  return <svg width="0" height="0" aria-hidden="true" focusable="false" style={{position:'absolute',pointerEvents:'none'}}><defs>
    <filter id="zine-ink" colorInterpolationFilters="sRGB"><feColorMatrix values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 1 0"/></filter>
    {Object.entries(inks).map(([key,hex])=><React.Fragment key={key}>
      <filter id={'zine-frame-'+key} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="1.6" intercept="-.12"/><feFuncG type="linear" slope="1.6" intercept="-.12"/><feFuncB type="linear" slope="1.6" intercept="-.12"/></feComponentTransfer><feColorMatrix values={frameMatrix(hex)}/></filter>
      <filter id={'zine-hero-'+key} colorInterpolationFilters="sRGB"><feColorMatrix values={matrix(hex,LUMA)}/></filter>
      <filter id={'zine-strip-'+key} colorInterpolationFilters="sRGB"><feColorMatrix values={matrix(hex,STRIP)}/></filter>
    </React.Fragment>)}
  </defs></svg>;
}

function palette(r){
  if(r.category==='housing'){const type='houz-'+r.intent;return {zc:'zc-houz '+type,c:HOUZ_CYAN,c2:housingTypes[r.intent].color,frame:'houz',hero:'houz',strip:type,wire:type}}
  const c=boardPalette[r.category]?.color||r.color;
  return {zc:'zc-'+r.category,c,c2:c,frame:r.category,hero:r.category,strip:r.category,wire:r.category};
}

function useArt(r){
  const recipes=useMotifRecipes();
  const recipe=categoryMotifRecipe(recipes,'boardz',r.category,r.intent);
  const hero=recipe&&recipes?.assets[recipe.heroId],wire=recipe&&recipes?.assets[recipe.companionId];
  const fallback=r.category==='giftz'?(r.intent==='iso'?'magnifying-glass':'gift-box'):DEFAULT_ART[r.category];
  if(r.collageChoice==='wireframe')return {wire,motif:MOTIF[fallback]};
  // A post's own artwork pick replaces the category sticker; it has no wire companion of its own.
  const pick=punkArtwork.find(a=>a.id===r.collageChoice&&a.id!==fallback);
  const asset=pick&&recipes?.assets[pick.libraryId];
  if(asset)return {hero:asset,pick,motif:'custom'};
  return {hero,wire,motif:MOTIF[fallback]};
}

function Ransom({text,seed,faces}){
  // Stable per-letter mix of Cut Type faces, grouped by word so lines only break between words.
  const words=[];let word=[];
  Array.from(text+' ').forEach((ch,i)=>{
    if(ch===' '){if(word.length)words.push(word);word=[];return}
    const k=(i*7+seed*3)%faces.length,rot=((i*37+seed*11)%9)-4;
    word.push(<span key={i} className={'rz-l rz-'+(k%4)} style={{fontFamily:faces[k],rotate:rot+'deg'}}>{ch}</span>);
  });
  return words.map((w,i)=><React.Fragment key={i}>{i>0&&<span className="rz-gap"> </span>}<span className="rz-w">{w}</span></React.Fragment>);
}

const SMALL_WORDS=new Set(['A','AN','THE','FOR','OF','TO','AND']);
const keyLetters=w=>w.startsWith('(')?0:w.replace(/[^A-Z0-9]/g,'').length;
/** Headline as torn strips, one per line, wrapped here so the ransom key word is chosen from what shows. */
function useStripLines(ref,text,maxLines){
  const [layout,setLayout]=useState(null);
  useLayoutEffect(()=>{
    let alive=true;
    const run=()=>{
      const el=ref.current;if(!alive||!el)return;
      const css=getComputedStyle(el),ctx=document.createElement('canvas').getContext('2d');
      ctx.font=`${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
      const size=parseFloat(css.fontSize),spacing=parseFloat(css.letterSpacing)||0,max=(parseFloat(css.maxWidth)||el.clientWidth)-size*.6-3;
      const width=s=>ctx.measureText(s).width+s.length*spacing;
      const words=String(text).trim().toUpperCase().split(/\s+/).filter(Boolean);
      const lines=[[]];let full=true;
      for(const w of words){
        const line=lines[lines.length-1],next=[...line,w].join(' ');
        if(line.length&&width(next)>max){if(lines.length===maxLines){full=false;break}lines.push([w])}else line.push(w);
      }
      if(!full){
        const last=lines[lines.length-1];
        while(last.length>1&&(SMALL_WORDS.has(last[last.length-1])||width(last.join(' ')+'…')>max))last.pop();
        last[last.length-1]+='…';
      }
      // The key word sets in Cut Type, a touch bigger. The longest word of four or more letters gets it.
      let key=null,best=3;
      lines.forEach((line,li)=>line.forEach((w,wi)=>{const n=keyLetters(w);if(n>best){best=n;key=[li,wi]}}));
      setLayout({lines,key,max:max+size*.6});
    };
    run();document.fonts?.ready.then(run);
    return()=>{alive=false};
  },[ref,text,maxLines]);
  return [layout,setLayout];
}

function Headline({text,className,maxLines=3}){
  const ref=useRef(null),[layout,setLayout]=useStripLines(ref,text,maxLines);
  // Lines never rewrap. If the Cut Type word pushes its strip past the column, it sets plain instead.
  useLayoutEffect(()=>{
    if(!layout?.key||!ref.current)return;
    const strips=[...ref.current.querySelector('.zl').getClientRects()];
    if(strips.some(rect=>rect.width>layout.max+1))setLayout({...layout,key:null});
  },[layout,setLayout]);
  const lines=layout?.lines||[[String(text).toUpperCase()]];
  return <h2 ref={ref} className={className} title={text} aria-label={text}><span className="zl" aria-hidden="true">{lines.map((line,li)=><React.Fragment key={li}>{li>0&&<br/>}{line.map((w,wi)=>{
    const space=wi?' ':'';
    if(!layout?.key||layout.key[0]!==li||layout.key[1]!==wi)return space+w;
    const core=w.replace(/[^A-Z0-9]+$/,''),tail=w.slice(core.length);
    return <React.Fragment key={wi}>{space}<i className="zrw"><b className="zr"><Ransom text={core} seed={Array.from(core).reduce((n,c)=>n+c.charCodeAt(0),0)} faces={TITLE_MIX}/></b>{tail}</i></React.Fragment>;
  })}</React.Fragment>)}</span></h2>;
}

function Hero({art,className}){
  if(!art.hero&&!art.wire)return null;
  return <>
    {art.wire&&<img className={`${className} zine-wire`} src={art.wire.url} crossOrigin="anonymous" alt="" aria-hidden="true" decoding="async" loading="lazy"/>}
    {art.hero&&(art.pick?.color
      ?<span className={`${className} zine-sticker zine-flag`} aria-hidden="true"><PunkInkImage art={{...art.pick,src:art.hero.url}}/></span>
      :<img className={`${className} zine-sticker`} src={art.hero.url} crossOrigin="anonymous" alt="" aria-hidden="true" decoding="async" loading="lazy"/>)}
  </>;
}

function HouzTicket({r}){
  const occupancy=householdCount(r),looking=r.intent==='looking';
  if(!occupancy&&!looking)return null;
  const slots=occupancy?visibleHousingFaceSlots(r).visible:housingFaceMembers(r);
  const label=occupancy?`${occupancy.count} ${occupancy.label.toLowerCase()} out of ${occupancy.total}`:`${slots.length} looking`;
  return <div className="hf" role="img" aria-label={label}>
    <span className="hf-faces">{slots.map((slot,i)=>slot.open?<span key={slot.slotKey||i} className="hf-face hf-open"/>:<span key={slot.slotKey||i} className="hf-face"><img src={slot.photo} alt=""/></span>)}</span>
    <span className="hf-count"><b className="hf-n">{occupancy?occupancy.count:slots.length}</b>{occupancy&&<span className="hf-of">/{occupancy.total}</span>}<span className="hf-l">{occupancy?occupancy.label:'LOOKING'}</span></span>
  </div>;
}

function Heart({save}){
  return <button type="button" className="zheart" disabled={save.disabled} aria-label={save.saved?'Unsave':'Save'} aria-pressed={save.saved} onClick={e=>{e.stopPropagation();save.onSave()}}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill={save.saved?'currentColor':'none'} stroke="currentColor" strokeWidth="2"/></svg>
  </button>;
}

function cardValue(r){
  if(r.category==='giftz')return r.intent==='iso'?'':'NEW HOME?';
  if(r.category==='housing')return housingPrice(r.amount,r.priceSuffix);
  return String(r.value||'').toUpperCase();
}

/** Large closed card, 360 x 240. */
export function ZineCard({r,save,calm=false,Photo}){
  const ref=useRef(null);
  const key=`${r.category}:${r.key||r.id}`;
  useCardMotion(ref,`${key}:large`,calm);
  const art=useArt(r),p=palette(r);
  const photos=r.category==='mizzed'||r.previewNoPhoto?[]:r.photos||[];
  const paste=photos.length>0;
  const seeking=SEEKING.includes(r.intent);
  const version=hash31(r.id??r.key)%2?'b':'a';
  const title=r.intent==='iso'?r.title.replace(/^ISO:\s*/i,''):r.title;
  const value=paste&&!seeking?cardValue(r):'';
  const d=paste?'wp':'cs';
  const style={...decayVars(key),'--c':p.c,'--c2':p.c2,'--zf-frame':`url(#zine-frame-${p.frame})`,'--zf-hero':`url(#zine-hero-${p.hero})`,'--zf-strip':`url(#zine-strip-${p.strip})`,'--zf-wire':`url(#zine-hero-${p.wire})`};
  return <article ref={ref} className={`zine zine--${d} ${p.zc} zv-${version}${seeking?' z-seek':''}`} data-size="large" data-category={r.category} data-intent={r.intent} data-motif={art.motif} style={style} aria-label={`${r.kicker}: ${title}`}>
    <span className="zt-rim" aria-hidden="true"/>
    <div className="zt-face">
      {paste&&<span className="wp-photo"><Photo photos={photos} alt={title} calm={calm}/></span>}
      {paste&&<span className="wp-dots" aria-hidden="true"/>}
      <span className="zn" aria-hidden="true">{r.category==='housing'?null:<NetworkBackdrop identity={`${key}:large`}/>}</span>
      {paste&&<span className="wp-paper" aria-hidden="true"/>}
      <Hero art={art} className="zine-hero"/>
      <span className="zine-tape" data-long={r.kicker.length>14||undefined}>{r.kicker}</span>
      {r.detail&&<span className="zine-area" title={r.detail}>{r.detail.toUpperCase()}</span>}
      <Headline text={title} className="zine-title"/>
      {value&&<span className="zine-value" aria-label={value}><Ransom text={value} seed={2} faces={VALUE_MIX}/></span>}
      {r.category==='housing'&&<HouzTicket r={r}/>}
      <img className="zine-logo" src={'/boardz/punk/'+r.logo} alt={r.category==='mizzed'?'Mizzed Connection':r.category==='housing'?'My Hoüz':r.category}/>
      <Heart save={save}/>
    </div>
  </article>;
}
