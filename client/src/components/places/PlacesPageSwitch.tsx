import {MapPin,Layers,Mountain} from 'lucide-react';
import {Link} from 'wouter';
import {motion,useReducedMotion} from 'motion/react';
import './placesShared.css';
export const PLACE_PAGES=[{key:'placez',label:'PlaceZ',href:'/directory'},{key:'scenez',label:'SceneZ',href:'/scenez'},{key:'outzide',label:'OutZide',href:'/outzide/places'}] as const;
export type PlacesPageKey=typeof PLACE_PAGES[number]['key'];
export default function PlacesPageSwitch({active,compact=false}:{active:PlacesPageKey;compact?:boolean}){
 const reduced=useReducedMotion();
 return <nav className={`places-page-switch${compact?' places-page-switch--compact':''}`} aria-label="Explore places"><div>{PLACE_PAGES.map(page=><Link key={page.key} href={page.href} aria-current={active===page.key?'page':undefined} className={active===page.key?'is-active':''}>{active===page.key&&<motion.span className="places-page-switch__active" layoutId="places-active-page" transition={reduced?{duration:0}:{type:'spring',stiffness:400,damping:36}}/>}<span>{compact&&(page.key==='placez'?<MapPin aria-hidden="true"/>:page.key==='scenez'?<Layers aria-hidden="true"/>:<Mountain aria-hidden="true"/>)}{page.label}</span></Link>)}</div></nav>;
}
