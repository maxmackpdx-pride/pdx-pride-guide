import {Link} from 'wouter';
import {motion,useReducedMotion} from 'motion/react';
import './placesShared.css';
export const PLACE_PAGES=[{key:'placez',label:'PlaceZ',href:'/directory'},{key:'scenez',label:'SceneZ',href:'/scenez'},{key:'outzide',label:'OutZide',href:'/outzide/places'}] as const;
export type PlacesPageKey=typeof PLACE_PAGES[number]['key'];
export default function PlacesPageSwitch({active}:{active:PlacesPageKey}){
 const reduced=useReducedMotion();
 return <nav className="places-page-switch" aria-label="Explore places"><div>{PLACE_PAGES.map(page=><Link key={page.key} href={page.href} aria-current={active===page.key?'page':undefined} className={active===page.key?'is-active':''}>{active===page.key&&<motion.span className="places-page-switch__active" layoutId="places-active-page" transition={reduced?{duration:0}:{type:'spring',stiffness:400,damping:36}}/>}<span>{page.label}</span></Link>)}</div></nav>;
}
