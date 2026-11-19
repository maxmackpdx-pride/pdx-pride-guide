import {MapPin,Layers,Mountain} from 'lucide-react';
import {Link} from 'wouter';
import {motion,useReducedMotion} from 'motion/react';
import './placesShared.css';
import { PLACES_NAV } from '@/lib/siteNav';
export type PlacesPageKey='placez'|'scenez'|'outzide';
const hrefFor={placez:'/directory',scenez:'/scenez',outzide:'/outzide/places'} as const;
export default function PlacesPageSwitch({active,compact=false}:{active:PlacesPageKey;compact?:boolean}){
 const reduced=useReducedMotion();
 return <nav className={`places-page-switch${compact?' places-page-switch--compact':''}`} aria-label="Explore places"><div>{PLACES_NAV.map(page=><Link key={page.href} href={page.href} aria-current={hrefFor[active]===page.href?'page':undefined} className={hrefFor[active]===page.href?'is-active':''}>{hrefFor[active]===page.href&&<motion.span className="places-page-switch__active" layoutId="places-active-page" transition={reduced?{duration:0}:{type:'spring',stiffness:400,damping:36}}/>}<span>{compact&&(page.href===hrefFor.placez?<MapPin aria-hidden="true"/>:page.href===hrefFor.scenez?<Layers aria-hidden="true"/>:<Mountain aria-hidden="true"/>)}{page.label}</span></Link>)}</div></nav>;
}
