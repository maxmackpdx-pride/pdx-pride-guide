import {type CSSProperties} from 'react';
import {Bell} from 'lucide-react';
import silverFallsInk from './art/silver-falls-640.svg';
import {outzWaypointGlyphs} from './waypointGlyphs';
import waypointFrame from './outz-waypoint-frame.svg?raw';
import './fonts.css';
import './NativeOutzideFace.css';
export type OutzEntry={id:string;name:string;style:string;location:string;kind:string;image:string;wideImage?:string;approvedArtworkId?:string;artworkLandscapePosition?:string;photoAlt:string;lat?:number;lng?:number;layeredFalls?:boolean;accent:string;categoryAccent:string;waypointKind:string;postCounts?:{Carpool:number;Mizzed:number;'Buddy Finder':number}};
type OutzCardProps={entry:OutzEntry;size?:'small'|'square'|'tall'|'wide-map';followed?:boolean;onFollow?:()=>void;onOpen?:(tab:string)=>void;onDismiss?:()=>void;unread?:number;onNotifications?:()=>void};
export function OutzWaypoint({kind}:{kind:string}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" dangerouslySetInnerHTML={{__html:outzWaypointGlyphs[kind]||outzWaypointGlyphs.trail}}/>}
export function CampWaypoint({entry}:{entry:OutzEntry}){const frame=waypointFrame.replace(/<g data-role="icon"[\s\S]*?<\/g>/,`<g data-role="icon" transform="translate(21 29) scale(2.3)" fill="none" stroke="#E6F5FF" stroke-width="1.6">${outzWaypointGlyphs[entry.waypointKind]||outzWaypointGlyphs.trail}</g>`);return <span className="oz-badge" aria-hidden="true" dangerouslySetInnerHTML={{__html:frame}}/>}
export function Heart({c,on,toggle}:{c:OutzEntry;on:boolean;toggle:()=>void}){return <div className="pz-heart" data-corner-control="heart"><button aria-label={`${on?'Unfollow':'Follow'} ${c.name}`} aria-pressed={on} onClick={toggle}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 20 3.5 11.7A5.2 5.2 0 0 1 12 5.8a5.2 5.2 0 0 1 8.5 5.9Z" fill={on?'currentColor':'none'}/></svg></button></div>}
export function OutzHero({entry,wide=false}:{entry:OutzEntry;wide?:boolean}){
 const source=(wide&&entry.wideImage?entry.wideImage:entry.image);
 return <div className="oz-hero oz-family-hero" data-art={source?'photo':'contours'}>
   {source&&<img className="oz-family-photo" src={source} alt={entry.photoAlt}
     style={{objectPosition:wide?entry.artworkLandscapePosition:undefined}}/>}
   {entry.layeredFalls&&<img className="oz-family-photo oz-family-ink" src={silverFallsInk} alt="" aria-hidden="true"/>}
   {!source&&<svg viewBox="0 0 360 235" preserveAspectRatio="xMidYMid slice" className="oz-family-contours" aria-hidden="true">
     {[0,1,2,3,4,5,6,7,8].map(i=><path key={i} transform={`translate(${(1-i*.085)*42} ${i*9}) scale(${1.28-i*.09})`} d="M-30 117C18 78 57 135 96 104s55-81 121-75 70 45 105 68 78 11 104-9"/>)}
   </svg>}
 </div>;
}
export function OutzClosed({entry,size='square',followed=false,onFollow=()=>{},onOpen=()=>{},onDismiss,unread=0,onNotifications=()=>{}}:OutzCardProps){
 const card=<article className={`oz-card oz-topographic oz-family-front oz-${size}`}
   style={{'--oz-accent':entry.accent,'--pz-accent':entry.accent,'--oz-category':entry.categoryAccent} as CSSProperties}
   aria-label={`${entry.style} ${size} card`}>
   <OutzHero entry={entry} wide={size==='wide-map'}/>
   <button className="oz-hit" onClick={()=>onOpen("Conditions")} aria-label={`Open ${entry.style} ${size}`}/>
   <h3 className="oz-family-title">{entry.name}</h3>
   <Heart c={entry} on={followed} toggle={onFollow}/>
   {size==='wide-map'&&onDismiss&&<button className="oz-dismiss" onClick={onDismiss} aria-label={`Dismiss ${entry.style} wide card`}>×</button>}
 </article>;
 return unread>0?<div className="oz-notify-wrap">{card}<button className="oz-notification" aria-label={`${unread} new posts at ${entry.name}`} onClick={onNotifications}><Bell size={16} aria-hidden="true"/>{unread}</button></div>:card;
}
