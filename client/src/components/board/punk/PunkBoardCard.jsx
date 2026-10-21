import React,{useEffect,useState,useRef,useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Heart,Share2,ArrowUpRight,MapPin,Waves} from 'lucide-react';
import {BoardCardMotif} from './BoardCardMotif';
import {InkFilters} from './InkFilters';
import {BoardzCollage,BoardzInkFilters,boardPalette} from './BoardzCollage';
import BoardPushPin from '../BoardPushPin';
import {CutoutHeadline} from './CutoutHeadline';
import {RansomText} from './RansomText';
import {PunkArtwork,PunkArtworkFilters} from './PunkArtwork';
import {HouzOccupancy} from './HouzOccupancy';
import {useCardMotion} from './useCardMotion';
import {useHouzTitleSpacing} from './useHouzTitleSpacing';
import {housingTypes,housingPrice,householdCount,housingFaceMembers} from './houz-model';
import {CardArtworkGlass} from '@/components/CardArtworkGlass';
import {intentLabels} from '@/lib/allBoards';
import {toPunkPost} from './postModel';
import {ZineCard,ZineSmallCard,ZineOpenHead,ZineFilters} from './ZineCard';
import './zine-open.css';
import './production.css';
import {useTheme} from '@/context/ThemeContext';
import {BoardzXerox,hasXerox} from '@/components/xerox/RoomOverlays';
import {XeroxFilters} from '@/components/xerox/XeroxFilters';
const A='/boardz/punk/';
const boardNames={housing:'My Hoüz',giftz:'Giftz',gigz:'Gigz',sellz:'Sellz',mizzed:'Mizzed Connection'};
function HouzPhoto({photos,alt,calm=false}){const [index,setIndex]=useState(0);const [glitch,setGlitch]=useState(false);useEffect(()=>{setIndex(0);if(photos.length<2)return;const media=matchMedia('(prefers-reduced-motion: reduce)');let pulse;const timer=setInterval(()=>{if(document.hidden||media.matches||calm)return;setGlitch(true);pulse=setTimeout(()=>setGlitch(false),360);setIndex(i=>(i+1)%photos.length)},6500);return()=>{clearInterval(timer);clearTimeout(pulse)}},[photos.join('|'),calm]);return <div className={'houz-photo-slide'+(glitch?' is-glitching':'')}><img className="houz-cover" src={photos[index]||photos[0]} alt={alt}/>{photos.length>1&&<><span className="houz-glitch" aria-hidden="true"/><span className="houz-photo-progress" aria-hidden="true">{photos.map((_,i)=><i key={i} className={i===index?'active':''}/>)}</span></>}</div>}
function HouzFrame({small,dashed}){const w=small?136:360,h=small?149.6:240,R=small?16:17,layers=32,step=1.8/31;const length=h-2*R;const count=Math.floor(length/(small?8:12))+1;const dash=length/(2*count-1);return <svg className="houz-unified-frame" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">{Array.from({length:layers},(_,i)=>{const d=.15+i*step,stroke=`color-mix(in srgb, #00ffff ${Math.round(100*(1-.8*Math.max(0,(i/(layers-1)-.5)/.5)**2))}%, var(--secondary))`;return <g key={i} stroke={stroke} strokeWidth="0.1" fill="none">{dashed?<><path d={`M${d} ${R} Q${d} ${d} ${R} ${d} H${w-R} Q${w-d} ${d} ${w-d} ${R} V${h-R} Q${w-d} ${h-d} ${w-R} ${h-d} H${R} Q${d} ${h-d} ${d} ${h-R}`}/><path d={`M${d} ${R} V${h-R}`} strokeDasharray={`${dash} ${dash}`} stroke={`color-mix(in srgb, #00ffff ${Math.round(100*(1-.9*Math.max(0,(i/(layers-1)-.35)/.65)**1.5))}%, var(--secondary))`}/></>:<rect x={d} y={d} width={w-2*d} height={h-2*d} rx={R-d}/>}</g>})}</svg>}
function HouzLocation({text}){const ref=useRef(null);const [travel,setTravel]=useState(0);useEffect(()=>{let active=true;const measure=()=>{if(active&&ref.current)setTravel(Math.max(0,ref.current.scrollWidth-ref.current.clientWidth))};document.fonts.ready.then(measure);window.addEventListener('resize',measure);return()=>{active=false;window.removeEventListener('resize',measure)}},[text]);return <span ref={ref} className={'houz-location-window'+(travel>1?' is-overflowing':'')} title={text}><span className={travel>1?'houz-location-moving':''} style={{'--travel':-travel+'px','--duration':(Math.max(8,travel/16+4)*2)+'s'}}>{text}</span></span>}
function HousingPrice({amount,suffix,small,seed}){const ref=useRef(null);const text=housingPrice(amount,suffix,small);useEffect(()=>{let alive=true;const fit=()=>{const node=ref.current;if(!alive||!node)return;const base=small?22:32,max=Number(getComputedStyle(node).getPropertyValue('--price-max'))||(small?98:188);node.style.fontSize=base+'px';const measured=node.scrollWidth;if(measured>max)node.style.fontSize=Math.max(small?12:16,base*max/measured)+'px'};fit();document.fonts.ready.then(fit);return()=>{alive=false}},[text,small]);return <span className="price-copy" ref={ref} title={text}><RansomText text={text} seed={seed||text}/></span>}
const SaveContext=React.createContext({saved:false,disabled:true,onSave:()=>{}});
function Save({small=false,paper=false}){
 const {saved,disabled,onSave}=React.useContext(SaveContext);
 const button=<button type="button" className={'save '+(small?'mini':'')} disabled={disabled} aria-label={saved?'Unsave':'Save'} aria-pressed={saved} onClick={e=>{e.stopPropagation();onSave();}}><Heart fill={saved?'currentColor':'none'}/></button>;
 return paper?<span className="save-paper-shell">{button}</span>:button;
}
function BaseCard({r,small=false,calm=false}){const occupancy=householdCount(r);const el=useRef(null);useCardMotion(el,`${r.key||r.title}:${small?'small':'large'}`,calm);
useHouzTitleSpacing(el,r.category==='housing'&&!small,r.title);
const move=e=>{if(calm||!small||r.kind!=='event'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const b=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--px',((e.clientX-b.left)/b.width-.5)*6+'px');e.currentTarget.style.setProperty('--py',((e.clientY-b.top)/b.height-.5)*6+'px')};
return <article ref={el} data-kind={r.kind} data-category={r.category} data-intent={r.intent} data-photo-layout={r.category==='housing'?(r.photoLayout==='inset'?'inset':'full-bleed'):undefined} data-has-photos={r.category==='housing'&&!r.previewNoPhoto&&r.photos?.length>0?'true':undefined} data-seeking={['available','iso','looking','forming','offering'].includes(r.intent)?'true':undefined} data-size={small?'small':'large'} data-looking-people={r.category==='housing'&&r.intent==='looking'?housingFaceMembers(r).length:undefined} onPointerMove={move} onPointerLeave={e=>{e.currentTarget.style.setProperty('--px','0px');e.currentTarget.style.setProperty('--py','0px')}} className={'card '+r.kind+(small?' small':' large')} style={{'--c':r.category==='housing'?'#00ffff':r.color,'--secondary':r.category==='housing'?housingTypes[r.intent].color:r.color,'--ab-accent':r.category==='housing'?'#00ffff':r.color,'--day-thu':r.category==='housing'?housingTypes[r.intent].color:'#00ffff'}}>
{['available','iso','looking','forming','offering'].includes(r.intent)&&<span className="seeking-rail" aria-hidden="true"/>}
{r.category==='housing'&&<span className="houz-paper-base" aria-hidden="true"/>}
{r.category==='housing'&&<><span className="houz-paper-rim" aria-hidden="true"/><span className="houz-surface-texture" aria-hidden="true"/><span className="houz-shade" aria-hidden="true"/></>}
{r.category==='housing'&&<span className="houz-edge-scratches" aria-hidden="true"/>}
{r.category==='housing'&&<div className="punk-paper" aria-hidden="true"><i/><b/><span/><em/></div>}
{r.category==='housing'&&<><CardArtworkGlass/></>}
{r.category==='housing'&&<><HouzFrame small={small} dashed={['looking','forming','offering'].includes(r.intent)}/><span className="houz-torn-edge" aria-hidden="true"/></>}
{r.category==='housing'&&<div className={'houz-media '+(r.intent==='forming'?'houz-media--forming':'')}>
{!r.previewNoPhoto&&r.photos?.length>0&&<HouzPhoto calm={calm} photos={r.photos} alt={r.intent==='managed'?'Rental property':r.intent==='offering'?'Room in the household':'Listing cover'}/>}
</div>}
{r.category==='housing'&&<><PunkArtwork post={{...r,collageChoice:'house'}}/>{r.collageChoice&&r.collageChoice!=='house'&&<PunkArtwork post={r}/>}</>}
{r.category==='housing'&&(occupancy||(!small&&r.intent==='looking'))&&<HouzOccupancy post={r} occupancy={occupancy} small={small} cardRef={el}/>}


{r.kind==='board'&&<BoardCardMotif placement="card" post={{key:`${r.key||r.id}:${small?'small':'large'}`,id:r.id||7,category:r.category||'gigz',intent:r.intent||'available',title:r.title,detail:r.description||'Design',motifChoice:r.motifChoice||(r.title.includes('DJ')?'dj':undefined),hasPets:!!r.hasPets}}/>}
{r.kind==='out'&&<><div className="forest"/><img className="river" src={A+'river.jpg'} alt="Sunset over the Columbia River at Rooster Rock"/></>}
{small&&<Save small paper/>}
{r.logo&&r.kind!=='board'&&<img className="brand" src={A+r.logo} alt={r.title+' logo'}/>}
{!small&&r.kind==='out'&&<span className="waypoint"><Waves/></span>}
<div className="body"><p className="kicker">{r.kicker}</p><h2 title={r.title}>{r.category==='housing'?<CutoutHeadline text={r.title} maxLines={small?2:3} balance={!small}/>:r.title}</h2>{r.kind==='board'&&<><p className="discipline">{r.description||'Design'}</p><p className="rate">{r.category==='housing'?<HousingPrice amount={r.amount} suffix={r.priceSuffix} small={small} seed={`${r.key}:price`}/>:r.value??'$30 per hour'}</p></>}<p className="detail">{!small&&r.kind!=='out'&&<MapPin/>}{!small&&r.category==='housing'?<HouzLocation text={r.detail}/>:small&&r.kind==='out'?'Corbett, OR':r.detail}</p>{!small&&r.kind==='place'&&<div className="tags"><span>Bars & Clubs</span><span>Queer owned</span></div>}{!small&&r.kind==='out'&&<div className="tags beach-tag"><span><Waves/> Beach</span></div>}{!small&&r.kind==='event'&&<div className="tags"><span>Tickets</span><span>21+</span></div>}</div>
{r.kind==='board'&&<img className="board-logo" src={A+(r.logo||'gigz.svg')} alt={r.category?boardNames[r.category]:'GIGZ'}/>}
{!small&&<footer><Save paper={r.category==='housing'}/></footer>}
</article>}
function Card(props){
  const {r,small=false}=props;
  const save=React.useContext(SaveContext);
  const card=r.kind==='board'?(small?<ZineSmallCard r={r} calm={props.calm} save={save} Photo={HouzPhoto}/>:<ZineCard r={r} calm={props.calm} save={save} Photo={HouzPhoto}/>):r.kind==='board'&&r.category!=='housing'?<BoardzCollage {...props} Photo={HouzPhoto} Save={Save} Location={HouzLocation}/>:<BaseCard {...props}/>;
  if(r.kind!=='board')return card;
  const xerox=!props.calm&&hasXerox(r);
  let seed=Array.from(`${r.key||r.id}:${small?'small':'large'}:${props.pinVariant||'default'}`).reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
  seed=Math.imul(seed^(seed>>>16),0x45d9f3b)>>>0;
  const color=r.category==='housing'?'#00FFFF':boardPalette[r.category]?.color||r.color;
  const secondary=r.category==='housing'?housingTypes[r.intent].color:color;
  return <div className="demo-pinned" data-size={small?'small':'large'} style={{'--c':color,'--ab-accent':secondary,'--day-thu':'#00FFFF','--pin-tilt':`${((seed%81)-44)/2}deg`,'--pin-offset':`${((seed>>>8)%9)-4}px`}}><BoardPushPin postKey={`${r.key}:${small?'small':'large'}`}/>{xerox?<BoardzXerox r={r} size={small?'small':'large'}>{card}</BoardzXerox>:card}</div>;
};

let filterRoot=null,filterNode=null,filterUsers=0;
function useFilters(){useLayoutEffect(()=>{filterUsers++;if(!filterRoot){filterNode=document.createElement('div');filterNode.setAttribute('aria-hidden','true');filterNode.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';document.body.append(filterNode);filterRoot=createRoot(filterNode);filterRoot.render(<><InkFilters/><BoardzInkFilters/><PunkArtworkFilters/><ZineFilters/><XeroxFilters/></>)}return()=>{filterUsers--;};},[]);}
export default function PunkBoardCard({post,small=false,saved=false,saveDisabled=false,onSave,onOpen,showStatus=false,calm=false}){
 const {calmMode}=useTheme(); calm=calm||calmMode; useFilters(); const openRef=useRef(null); const r=toPunkPost(post);
 return <SaveContext.Provider value={{saved,disabled:saveDisabled||!onSave,onSave:onSave||(()=>{})}}><div className="boardz-punk-scope" data-direction="split" data-calm={calm} data-compact={small||undefined} onClick={e=>{if(onOpen&&!e.target.closest('button,a,input,select,textarea'))onOpen(openRef.current)}}>
 <Card r={r} small={small} calm={calm}/>
 {onOpen&&<button type="button" className="punk-open-target" ref={openRef} onClick={e=>onOpen(e.currentTarget)} aria-label={'Open '+post.title}/>}
 {(post.isDemo||showStatus)&&<span className="punk-post-status">{post.isDemo?'DEMO · ':''}{showStatus?post.status:''}</span>}
 </div></SaveContext.Provider>;
}

/** Open card head for the full post: same parts as the closed card, at phone size. */
export function PunkOpenHead({post,calm=false}){
 const {calmMode}=useTheme(); calm=calm||calmMode; useFilters(); const r=toPunkPost(post);
 return <div className="boardz-punk-scope boardz-punk-scope--open" data-direction="split" data-calm={calm}><ZineOpenHead r={r} calm={calm} Photo={HouzPhoto}/></div>;
}
