import { waypointHtml, type WaypointId } from '@/lib/livingMapWaypoints';
import { outzWaypointGlyphs } from './outzWaypointGlyphs';
import './OutzCardModal.css';
const kinds:Record<string,WaypointId>={bar:'bar',club:'club',restaurant:'venue',cafe:'cafe',shop:'shop',retail:'shop',park:'park',bathhouse:'bath',venue:'venue'};
export default function CardWaypoint({kind,outside=false,inline=false}:{kind:string;outside?:boolean;inline?:boolean}) {
 const html=outside?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${outzWaypointGlyphs[kind] || outzWaypointGlyphs.trail}</svg>`:waypointHtml({id:kinds[kind]||'venue',size:30,color:'var(--c)',bloom:false});
 return <span aria-hidden="true" className={`home-card-waypoint${inline?' home-card-waypoint--inline':''}`} dangerouslySetInnerHTML={{__html:html}} />;
}
