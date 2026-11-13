import PlacezArtworkCredit from './PlacezArtworkCredit';
import {Link} from 'wouter';
import {useId,useState,type CSSProperties,type ReactNode,type MouseEvent} from 'react';
import type {PlaceCardModel,PreviewSize} from './placezAdapter';
import type {NextEvent} from './nextEvent';
import NextEventCountdown from './NextEventCountdown';
import {remainingToEvent} from './nextEvent';
import {safeCount,type PlaceActivity} from './activity';
import PlaceLocation,{type NearbyRestaurant} from './PlaceLocation';
import type {CalendarFeed} from './eventCalendar';
import SevenDayEvents from './SevenDayEvents';
import ExpandedPager from './ExpandedPager';
import PlaceFeed,{type PlaceFeedData,type PlaceActivePosts} from './PlaceFeed';
import PlacePeople,{type PlacePeopleData} from './PlacePeople';
import PlaceTalent from './PlaceTalent';
import type {PlaceTalentData} from './talentData';
import {useArtworkMotion} from './artworkMotion';
import './PlacezQuickCard.css';
import {usePlacezClock} from './usePlacezClock';
export interface PlacezQuickCardProps {
  model:PlaceCardModel;size:PreviewSize;onOpen:(element:HTMLElement,initialPage?:number)=>void;
  onClaim?:(element:HTMLElement)=>void;onClose?:()=>void;onShare?:()=>void;
  heart:ReactNode;readOnly?:boolean;mapsContent?:ReactNode;motion?:boolean;nextEvent?:NextEvent;activity?:PlaceActivity;nearbyRestaurants?:NearbyRestaurant[];calendarFeed?:CalendarFeed;people?:PlacePeopleData;talent?:PlaceTalentData;feed?:PlaceFeedData;activePosts?:PlaceActivePosts;initialExpandedPage?:number;
  /** Deterministic preview/test clock only. Omit in production. */
  previewNow?:number;
}
export function HeartIcon({filled=false}:{filled?:boolean}){return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20 3.5 11.7A5.2 5.2 0 0 1 12 5.8a5.2 5.2 0 0 1 8.5 5.9Z" fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>;}
function Icon({kind}:{kind:'pin'|'phone'|'clock'|'info'|'share'}){
 const paths={pin:<><path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,phone:<path d="m5 3 4 1 1 5-3 2c2 3 3 4 6 6l2-3 5 1 1 4c-1 5-8 1-12-3S1 4 5 3Z"/>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,info:<><circle cx="12" cy="12" r="9"/><path d="M12 10v7M12 6v1"/></>,share:<><circle cx="6" cy="12" r="3"/><circle cx="18" cy="5" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-4M9 14l6 4"/></>};
 return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}
export function Artwork({model:m,wide,sizes="(max-width: 640px) 100vw, 620px"}:{model:PlaceCardModel;wide:boolean;sizes?:string}){
 const independentLogo=wide&&m.wideImageUrl&&m.wideLogoUrl;
 const image=independentLogo?m.wideImageUrl:m.imageUrl;
 const cutout=wide?(m.wideCutoutMaskUrl||m.cutoutMaskUrl):m.cutoutMaskUrl;
 return <div className="pz-art" data-fit={m.imageFit} data-grounded={m.imagePosition==='50% 100%'?'true':undefined} data-cutout={cutout?'true':undefined} style={{'--pz-photo-position':m.imagePosition,'--pz-cutout-mask':cutout?`url("${cutout}")`:undefined} as CSSProperties} aria-hidden="true">{image?<><img className="pz-art__base" src={image} srcSet={image?.includes("-720.webp") ? [360,720,1200].map(width=>`${image.replace("-720.webp",`-${width}.webp`)} ${width}w`).join(", ") : undefined} sizes={sizes} alt="" loading="lazy" decoding="async"/><div className="pz-art__moving"><img src={image} srcSet={image?.includes("-720.webp") ? [360,720,1200].map(width=>`${image.replace("-720.webp",`-${width}.webp`)} ${width}w`).join(", ") : undefined} sizes={sizes} alt="" loading="lazy" decoding="async"/></div></>:<span className="pz-name-fallback">{m.name}</span>}{m.treatmentUrl&&<img className="pz-art__treatment" src={m.treatmentUrl} alt="" decoding="async"/>}{independentLogo&&m.id===2&&<span className="pz-art__wide-logo-backdrop"/>}{independentLogo&&<img className={`pz-art__wide-logo${m.id===30?' pz-art__wide-logo--holocene':m.id===5?' pz-art__wide-logo--eagle':m.id===2?' pz-art__wide-logo--darcelle':''}`} src={m.wideLogoUrl} alt="" decoding="async"/>}{m.logoUrl&&<img className="pz-art__logo" src={m.logoUrl} alt="" decoding="async"/>}</div>;
}
export default function PlacezQuickCard({model:m,size,onOpen,onClaim,onClose,onShare,heart,readOnly=false,mapsContent,motion=true,nextEvent,previewNow,activity,nearbyRestaurants,calendarFeed,people,talent,feed,activePosts,initialExpandedPage=1}:PlacezQuickCardProps){
 const ref=useArtworkMotion(motion),titleId=useId(),clock=usePlacezClock(previewNow);
 const [detailsOpen,setDetailsOpen]=useState(true);
 const pairArtwork=m.id===8||m.id===9;
 const compact=size==='small',wide=size==='wide-map',expanded=size==='expanded';
 const hasNext=!compact&&!expanded&&Boolean(remainingToEvent(nextEvent,m.id,clock));
 const showStatus=Boolean(m.status.source&&(m.status.tone==='open'||m.status.tone==='closed'));
 const root=(event:MouseEvent<HTMLElement>)=>event.currentTarget.closest<HTMLElement>('.pz-card')||event.currentTarget;
 const style={'--pz-accent':m.accent,'--pz-logo-mask':wide&&m.wideImageUrl&&m.wideLogoUrl?'none':m.wideFadeMaskUrl?`url("${m.wideFadeMaskUrl}")`:undefined,backgroundImage:m.glassUrl(size)?`url("${m.glassUrl(size)}")`:undefined} as CSSProperties;
 return <article ref={ref} className={`pz-card pz-card--${size}`} aria-label={m.name} style={style} data-motion="paused" data-calm={motion?'false':'true'} data-has-next={hasNext?'true':'false'}>
   {!expanded&&<button type="button" className="pz-open-surface" aria-label={`View details for ${m.name}`} onClick={event=>onOpen(root(event))}/>}
   <Artwork model={m} wide={wide} sizes={size==='small'?'136px':size==='tall'?'200px':size==='square'?'250px':wide?'360px':undefined}/>
   <Link className="pz-compose-icon" href={m.composeHref} aria-disabled={readOnly||undefined} tabIndex={readOnly?-1:undefined} onClick={event=>{if(readOnly)event.preventDefault();}} aria-label={`Post a Mizzed Connection at ${m.name}`} title="Post a Mizzed Connection anytime"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 5h11a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-6l-5 3v-3a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"/><path d="M10 9v6m-3-3h6"/></svg></Link>
   {(wide||expanded)&&onClose&&<button type="button" className="pz-close" aria-label={`Close ${m.name}`} onClick={onClose}><span aria-hidden="true">×</span></button>}
   {expanded&&onShare&&<button type="button" className="pz-share" aria-label={`Share ${m.name}`} onClick={onShare}><Icon kind="share"/></button>}
   {expanded?<><div className="pz-expanded-body">
       <header className="pz-expanded-header"><h2 className="pz-expanded-title" id={titleId}>{m.title||m.name}</h2><span className="pz-category">{m.category}</span>
       <Link className="pz-compose-row" href={m.composeHref} aria-disabled={readOnly||undefined} tabIndex={readOnly?-1:undefined} onClick={event=>{if(readOnly)event.preventDefault();}}><span>Post a Mizzed Connection<small>At this place, anytime</small></span>{pairArtwork?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>:<span aria-hidden="true">↗</span>}</Link></header>
       <ExpandedPager motion={motion} initialPage={initialExpandedPage} pages={[<PlaceFeed key="feed" data={feed} activePosts={activePosts} venueId={m.id} previewNow={previewNow}/>,<div className="pz-info-page" key="info">
       <details className="pz-place-details" open={detailsOpen} onToggle={e=>setDetailsOpen(e.currentTarget.open)}>
         <summary><Icon kind="info"/><span>Place details</span><span className="pz-chevron" aria-hidden="true">⌄</span></summary>
         <div className="pz-detail-fields">
           {m.phone&&<p className="pz-detail-row"><Icon kind="phone"/><a href={`tel:${m.phone.replace(/[^+\d]/g,'')}`}>{m.phone}</a></p>}
           {m.hours&&<p className="pz-detail-row"><Icon kind="clock"/><span>{m.hours}</span></p>}
           {m.address&&<p className="pz-detail-row"><Icon kind="pin"/><span>{m.address}{m.neighborhood&&<> · {m.neighborhood}</>}</span></p>}
           {m.description&&<p className="pz-description">{m.description}</p>}
         </div>
       </details>
       <PlacezArtworkCredit id={m.id}/>
       {m.id===23&&<p className="pz-native-credit">Artwork adapted from <a href="https://commons.wikimedia.org/wiki/File:Pizza_Thief,_Portland,_Oregon,_2022_-_6.jpg">Another Believer’s January 31, 2022 photograph</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Generated interpretation; signs and interior details were redrawn.</p>}
       {m.claimState==='unclaimed'&&onClaim&&<button type="button" className="pz-claim" onClick={event=>onClaim(root(event))}>Claim this business {pairArtwork?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>:<span aria-hidden="true">↗</span>}</button>}
       </div>,<div key="events" className="pz-events-page"><SevenDayEvents feed={calendarFeed} venueId={m.id} previewNow={previewNow}/><PlaceTalent show="active" data={talent} venueId={m.id} previewNow={previewNow}/><PlaceLocation mode="nearby" model={m} restaurants={nearbyRestaurants}/></div>,<div key="maps">{mapsContent||<PlaceLocation mode="map" model={m} restaurants={nearbyRestaurants}/>}</div>,<PlacePeople key="people" venueId={m.id} data={people} talent={talent} previewNow={previewNow}/>]}/>
       <div className="pz-expanded-follow"><span>{pairArtwork?'Follow this place':'Save this place'}</span><span className="pz-heart-slot" aria-hidden="true"/></div>
     </div></>:<>
     {!compact&&<NextEventCountdown event={nextEvent} venueId={m.id} previewNow={previewNow} compact={size==='square'||wide}/>}
     <div className="pz-content"><div className="pz-identity">{wide&&<span className="pz-category">{m.category}</span>}{(m.title||wide)&&<p className="pz-title">{m.title||m.name}</p>}<p className="pz-descriptor">{compact?m.category:m.descriptor}</p></div>
       {!compact&&showStatus&&<span className={`pz-status pz-status--${m.status.tone}`} title={m.hours||undefined}>{m.status.label}</span>}
     </div>
     <div className="pz-actions">{wide&&<div className="pz-activity-counters" aria-label="Place activity">{(['gigz','mizzed'] as const).map(board=><button type="button" key={board} className={`pz-activity-count pz-activity-count--${board}`} aria-label={`Open ${board==='gigz'?'Gigz':'Mizzed Connections'} in ${m.name} feed`} onClick={event=>{event.stopPropagation();onOpen(root(event),0);}}><strong>{activity?safeCount(board==='gigz'?activity.gigzCount:activity.mizzedConnectionsCount,activity.checkedAt,clock):'—'}</strong><span>{board==='gigz'?'Gigz':'Mizzed'}</span></button>)}</div>}{!compact&&<button type="button" className="pz-details" onClick={event=>{event.stopPropagation();onOpen(root(event));}}>View details {pairArtwork?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>:<span aria-hidden="true">↗</span>}</button>}<span className="pz-heart-slot" aria-hidden="true"/></div>
   </>}
   <div className="pz-heart" data-corner-control="heart" onClick={event=>event.stopPropagation()}>{heart}</div>
 </article>;
}
