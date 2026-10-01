import { resourceGradientStops } from "./resourceGradient";
import { distinctResourceMotifs } from "./distinctResourceMotifs";
import { memo, useId, useRef, useState, useEffect } from "react";
import { useCardMotifParallax } from "./useCardMotifParallax";

// Decorative, deterministic artwork: every organization gets a distinct mesh.
// Paths are original drawings, not altered organization logos.
const silhouettes: Record<string, string> = {
 wings: "M200 290 Q155 170 35 155 Q70 228 165 263 Q90 220 48 220 Q95 280 180 285 Q120 266 85 292 Q153 323 200 290 M200 290 Q245 170 365 155 Q330 228 235 263 Q310 220 352 220 Q305 280 220 285 Q280 266 315 292 Q247 323 200 290",
 home: "M85 250 L200 150 L315 250 M110 230 V345 H290 V230 M174 345 V270 H226 V345 M130 257 H154 V286 H130 Z M246 257 H270 V286 H246 Z",
 bridge: "M45 300 H355 M105 300 V175 H120 V300 M280 300 V175 H295 V300 M55 275 Q112 165 200 255 Q288 165 345 275 M150 235 V300 M200 255 V300 M250 235 V300",
 pulse: "M40 260 H112 L145 215 L178 310 L218 175 L250 260 H360 M75 200 V180 H95 M305 180 H325 V200 M75 320 V340 H95 M305 340 H325 V320",
 growth: "M200 350 V220 M200 280 Q110 285 100 190 Q193 180 200 280 M200 245 Q210 155 305 155 Q300 244 200 245 M160 350 H240",
 scales: "M200 155 V335 M145 335 H255 M100 190 H300 M115 190 L65 275 H165 Z M285 190 L235 275 H335 Z",
 prism: "M200 150 L320 310 H80 Z M200 150 V340 L80 310 M200 340 L320 310 M80 310 L240 235 M320 310 L160 235",
 orbit: "M65 250 C65 130 335 130 335 250 C335 370 65 370 65 250 Z M200 130 C90 130 90 370 200 370 C310 370 310 130 200 130 Z M70 200 L330 300 M70 300 L330 200",
 book: "M200 205 Q140 160 70 180 V325 Q140 305 200 350 Q260 305 330 325 V180 Q260 160 200 205 V350 M100 210 L170 230 M100 245 L170 265 M230 230 L300 210 M230 265 L300 245",
 stage: "M75 165 H325 V335 H75 Z M75 165 Q145 220 75 300 M325 165 Q255 220 325 300 M125 165 L190 300 M275 165 L210 300 M100 335 H300",
 heart: "M200 335 C150 295 70 250 85 190 C100 135 170 145 200 190 C230 145 300 135 315 190 C330 250 250 295 200 335 Z",
 signal: "M200 320 V235 M175 345 H225 M155 265 A65 65 0 1 1 245 265 M125 295 A108 108 0 1 1 275 295 M95 325 A150 150 0 1 1 305 325",
 shield: "M200 145 L310 185 V250 Q300 325 200 365 Q100 325 90 250 V185 Z M150 250 L185 285 L255 210",
 bolt: "M225 140 L110 280 H185 L165 370 L295 215 H215 Z",
 network: "M200 155 L300 220 L270 330 H130 L100 220 Z M200 155 L270 330 L100 220 H300 L130 330 Z",
 gift: "M92 215 H308 V365 H92 Z M78 185 H322 V220 H78 Z M190 185 V365 M210 185 V365 M200 185 C135 165 130 105 162 112 C184 117 198 158 200 185 C202 158 216 117 238 112 C270 105 265 165 200 185",
 microphone: "M145 135 H255 V232 Q255 285 200 285 Q145 285 145 232 Z M115 240 Q200 340 285 240 M200 310 V365 M145 365 H255",
 receipt: "M90 125 H260 L310 175 V365 H90 Z M260 125 V175 H310 M120 230 H270 M120 265 H250 M120 300 H225",
};

function themeFor(name: string, category: string) {
 const roomTheme = ({ eventz:"stage", hauz:"home", giftz:"gift", gigz:"microphone", sellz:"receipt", mizzed:"heart" } as Record<string,string>)[category];
 if (roomTheme) return roomTheme;
 const n = name.toLowerCase();
 if (/bradley|beyond these|faerie/.test(n)) return "wings";
 if (/housing|house|living room|werq|pantr/.test(n)) return "home";
 if (/bridge|avenues|pairs|mentors/.test(n)) return "bridge";
 if (/evergreen|prairie|fertile|food|naya/.test(n)) return "growth";
 if (/prism|arts commission|ori|gallery/.test(n)) return "prism";
 if (/history|publishing|library/.test(n)) return "book";
 if (/stage|theatre|playhouse|festival/.test(n)) return "stage";
 if (/transponder|outreach|network/.test(n)) return "signal";
 if (/energy|cash|prosper|business|score/.test(n)) return "bolt";
 if (/veteran|rights|case oregon/.test(n)) return "shield";
 if (/tact|advocacy.*care|intersect|coalition/.test(n)) return "network";
 if (/emergence|quest|alliance/.test(n)) return "orbit";
 return ({health:"pulse", safety:"shield", legal:"scales", youth:"growth", community:"network", family:"heart", money:"bolt", arts:"prism", "harm-reduction":"shield", "mental-health":"orbit"} as Record<string,string>)[category] || "network";
}

const MotifArtwork = memo(function MotifArtwork({ name, category, colors }: {name:string;category:string;colors?: string[]}) {
 const ref = useCardMotifParallax();
 const gradientId = `resource-motif-${useId().replace(/:/g, "")}`;
 const paint = colors && colors.length > 1 ? `url(#${gradientId})` : "currentColor";
 let seed = Array.from(name).reduce((n,c)=>Math.imul(n,31)+c.charCodeAt(0)|0,7) >>> 0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const nodes=Array.from({length:30},(_,i)=>({x:20+random()*360,y:125+random()*290,r:i%7===0?2.4:1.1}));
 const theme=themeFor(name,category);
 const silhouette = distinctResourceMotifs[name] ?? silhouettes[theme];
 const tilt=(random()-.5)*12;
 const cycle = 28 + Math.round(random() * 8);
 const phase = -Math.round(random() * cycle);
 const circuits = Array.from({ length: 5 }, (_, i) => {
  const left = i % 2 === 0;
  const x = left ? 18 + random() * 32 : 350 + random() * 30;
  const y = 140 + i * 43 + random() * 18;
  const reach = (left ? 1 : -1) * (28 + random() * 45);
  const rise = (random() - .5) * 45;
  return { x, y, endX: x + reach, endY: y + rise,
   path: `M${x} ${y}h${reach * .45}l${reach * .25} ${rise}h${reach * .3}` };
 });
 return <svg ref={ref} className="rg-card-motif" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-motif={`${category}-${name}`}>
  {colors && colors.length > 1 && <defs><linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="500">
   {resourceGradientStops(colors).map((stop, index) => <stop key={index} offset={`${stop.offset}%`} style={{ stopColor: stop.color }} />)}
  </linearGradient></defs>}
  <g className="rg-motif-layer rg-motif-layer--mesh">
  <g className="rg-motif-drift" style={{ animationDuration: `${cycle}s`, animationDelay: `${phase}s` }}>
  <g className="rg-motif-mesh" fill="none" stroke={paint} strokeWidth=".65">
   {nodes.flatMap((p,i)=>nodes.slice(i+1).map((q,j)=>Math.hypot(p.x-q.x,p.y-q.y)<115?<path key={`${i}-${j}`} d={`M${p.x} ${p.y}L${q.x} ${q.y}`} />:null))}
   {Array.from({length:6},(_,i)=><path key={i} d={`M-30 ${220+i*24} Q${140+tilt*3} ${100+i*30} 430 ${300+i*20}`} />)}
  </g>
  <g className="rg-motif-circuits" fill="none" stroke={paint} strokeWidth=".75">
   {circuits.map((c,i)=><g key={i}>
    <path d={c.path} /><circle cx={c.endX} cy={c.endY} r="2.6" />
    <path d={`M${c.x} ${c.y-6}v12M${c.x+4} ${c.y-3}v6`} />
   </g>)}
  </g>
  <g className="rg-motif-nodes" fill={paint}>{nodes.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={p.r} />)}</g>
  <g className="rg-motif-calibration" stroke={paint} strokeWidth=".65" fill="none">
   {circuits.slice(0,3).map((c,i)=><g key={i} transform={`translate(${c.endX} ${c.endY})`}>
    <circle r={8+i*2} strokeDasharray="2 8" />
    <path d={`M-13 0h5M8 0h5M0 -13v5M0 8v5`} />
   </g>)}
  </g>
  <g stroke={paint} strokeWidth=".7" opacity=".4" fill="none"><path d="M32 155V135H52 M348 135H368V155 M32 365V385H52 M348 385H368V365" />{nodes.filter((_,i)=>i%7===0).map((p,i)=><path key={i} d={`M${p.x-5} ${p.y}h10 M${p.x} ${p.y-5}v10`}/>)}</g>
  </g>
  </g>
  <g className="rg-motif-layer rg-motif-layer--object">
   <g className="rg-motif-object-drift" style={{ animationDuration: `${cycle + 9}s`, animationDelay: `${phase - 7}s` }}>
  <g className="rg-motif-breathe" style={{ animationDuration: `${cycle + 4}s`, animationDelay: `${phase}s` }}>
  <g className="rg-motif-object" fill="none" stroke={paint} strokeLinejoin="round" transform={`rotate(${tilt} 200 250)`}>
   <path className="rg-motif-depth" d={silhouette} transform="translate(5 7)" strokeWidth=".8" strokeDasharray="2 5" />
   {[1.13,1.06,1].map((scale,i)=><path key={scale} d={silhouette} transform={`translate(200 250) scale(${scale}) translate(-200 -250)`} strokeWidth={i===2?1.5:.65} opacity={i===2?.85:.24} />)}
   <path className="rg-motif-inner-edge" d={silhouette} transform="translate(200 250) scale(.976) translate(-200 -250)" strokeWidth=".55" />
   <path className="rg-motif-signal-trace" d={silhouette} pathLength="100" strokeWidth="1.15" strokeDasharray="3 97" style={{ animationDuration: `${cycle + 8}s`, animationDelay: `${phase}s` }} />
  </g>
  </g>
   </g>
  </g>
 </svg>;
});


const motifVisibility = new Map<Element, (visible: boolean) => void>();
let motifObserver: IntersectionObserver | undefined;
export const ResourceCardMotif = memo(function ResourceCardMotif(props: { name: string; category: string; colors?: string[] }) {
 const slot = useRef<HTMLDivElement>(null);
 const [visible, setVisible] = useState(false);
 useEffect(() => {
  const element = slot.current;
  if (!element) return;
  if (!motifObserver) motifObserver = new IntersectionObserver(entries => {
   for (const entry of entries) motifVisibility.get(entry.target)?.(entry.isIntersecting);
  }, { rootMargin: "200px" });
  const card = element.closest<HTMLElement>(".rg-directory-card, .rg-safety-summary, .room-doorways__door");
  if (card) card.dataset.artVisible = "false";
  motifVisibility.set(element, visible => {
   if (card) card.dataset.artVisible = String(visible);
   setVisible(visible);
  });
  motifObserver.observe(element);
  return () => {
   motifObserver?.unobserve(element);
   motifVisibility.delete(element);
   if (!motifVisibility.size) { motifObserver?.disconnect(); motifObserver = undefined; }
  };
 }, []);
 return <div ref={slot} className="rg-motif-slot" aria-hidden="true">{visible && <MotifArtwork {...props} />}</div>;
});
