import { useEffect, useMemo, useRef, useState } from "react";
import "./ProductRoadmap.css";

type Status = "done" | "progress" | "queued";
type Trail = "product" | "system" | "crossing";

type Point = {
  id: string;
  n: string;
  trail: Trail;
  status: Status;
  title: string;
  eyebrow: string;
  summary: string;
  goals: string[];
  x: number;
  y: number;
  labelX: number;
  labelY: number;
};

const POINTS: readonly Point[] = [
  { id:"pride-guide", n:"01", trail:"product", status:"done", title:"PDX Pride Guide", eyebrow:"ORIGIN", summary:"The seasonal guide that proved queer Portland needed one useful place to find what was happening.", goals:["Preserve the useful history","Finish remaining legacy-guide cleanup"], x:620,y:130,labelX:69,labelY:3 },
  { id:"react", n:"02", trail:"crossing", status:"done", title:"React rebuild + EVENTZ platform", eyebrow:"TECHNICAL RESET", summary:"Moving off Squarespace created the custom app and the modern EVENTZ system before Zaylist existed.", goals:["React app foundation established","Modern EVENTZ system established","Retire remaining Squarespace-era assumptions"], x:470,y:330,labelX:55,labelY:9 },
  { id:"zaylist", n:"03", trail:"product", status:"done", title:"Zaylist launch", eyebrow:"PLATFORM EXPANSION", summary:"The Pride Guide became a year-round platform instead of a seasonal publication.", goals:["Broader product family established","Year-round platform identity shipped"], x:650,y:520,labelX:70,labelY:15 },
  { id:"foundation", n:"S1", trail:"system", status:"done", title:"Foundation + Design System", eyebrow:"SYSTEM OF RECORD", summary:"Product doctrine, institutional memory, and the living visual authority were established.", goals:["Operationalize the Foundation","Keep Design Guide and production synchronized","Make every agent inherit the same rules"], x:285,y:560,labelX:6,labelY:17 },
  { id:"hauz", n:"04", trail:"product", status:"done", title:"THE HAÜZ", eyebrow:"SHIPPED", summary:"Housing moved from concept to a real Zaylist product.", goals:["Continue QA and safety review","Align with shared identity and search"], x:575,y:760,labelX:66,labelY:23 },
  { id:"giftz", n:"05", trail:"product", status:"done", title:"GIFTZ", eyebrow:"SHIPPED", summary:"Community gifting is live as part of the Zaylist product family.", goals:["Continue production QA","Align moderation with shared platform rules"], x:440,y:930,labelX:52,labelY:29 },
  { id:"identity", n:"S2", trail:"system", status:"progress", title:"Identity + communications", eyebrow:"DURABILITY", summary:"Accounts and communications become dependable enough for a real platform.", goals:["Google Sign-In","Forgot Password","Secure account recovery","Transactional email and deliverability","Account linking and duplicate handling"], x:240,y:910,labelX:5,labelY:29 },
  { id:"placez", n:"06", trail:"product", status:"progress", title:"OUR PLACEZ", eyebrow:"IN PRODUCTION", summary:"Finish the places and directory experience as a first-class section.", goals:["Finish product build","Resolve product-versus-guide drift","QA navigation and search","Finish section identity where needed"], x:535,y:1110,labelX:64,labelY:35 },
  { id:"gigz", n:"07", trail:"product", status:"progress", title:"GIGZ", eyebrow:"IN PRODUCTION", summary:"Finish the work and opportunity surface around verified people.", goals:["Posting and discovery","Moderation and QA","Shared listing compatibility"], x:650,y:1280,labelX:70,labelY:41 },
  { id:"hardening", n:"S3", trail:"system", status:"progress", title:"Production hardening + Cloudflare", eyebrow:"DURABILITY", summary:"Security, reliability, monitoring, cost control, and the migration path beyond the current Railway footprint.", goals:["Cloudflare hosting/infrastructure plan","DNS, CDN, caching and edge security","Deployment and rollback reliability","Monitoring and alerting","Event-curation security","Performance and error handling"], x:300,y:1250,labelX:3,labelY:41 },
  { id:"mizzed", n:"08", trail:"product", status:"progress", title:"MIZZED CONNECTION", eyebrow:"IN PRODUCTION", summary:"Consent-aware connection without anonymous cold-message dynamics.", goals:["Finish consent and acceptance flow","Privacy, reporting and moderation","Launch QA"], x:560,y:1460,labelX:63,labelY:47 },
  { id:"squadz", n:"09", trail:"product", status:"progress", title:"MY SQUADZ", eyebrow:"IN PRODUCTION", summary:"Finish the social and membership surface without duplicating the future community layer.", goals:["Membership and privacy","Discovery and moderation","Avoid duplicating Z/ community logic"], x:450,y:1640,labelX:51,labelY:53 },
  { id:"outz", n:"10", trail:"product", status:"progress", title:"OUTZ", eyebrow:"IN PRODUCTION", summary:"Outdoor discovery, conditions, check-ins, carpools, and local utility.", goals:["Finish location and conditions behavior","Safety and discovery","Prepare routes/data for Z/ migration"], x:600,y:1810,labelX:67,labelY:59 },
  { id:"sellz", n:"11", trail:"product", status:"progress", title:"SELLZ", eyebrow:"IN PRODUCTION", summary:"Finish the marketplace surface with clear safety and listing lifecycle rules.", goals:["Listing lifecycle and discovery","Reporting and moderation","Shared listing object compatibility"], x:520,y:1990,labelX:61,labelY:65 },
  { id:"governance", n:"S4", trail:"system", status:"progress", title:"Governance + synchronization", eyebrow:"SYSTEM", summary:"Keep GitHub, production, Foundation, Design Guide, and AI-generated work from drifting apart.", goals:["Automate guide/production checks","Resolve product-guide drift","Keep repo implementation authoritative","Coordinated agent roles and validation"], x:275,y:1860,labelX:4,labelY:61 },
  { id:"z-rebuild", n:"12", trail:"crossing", status:"done", title:"Z/ rebuild → Communities", eyebrow:"SHIPPED CROSSING", summary:"Z/ now has one clear job: Communities, with real membership, moderation, rules, posts, visibility, discovery, and typed product relationships.", goals:["Communities-only namespace established","Membership and moderator lifecycle shipped","EVENTZ, SELLZ, GIGZ, Places and Guides relationships shipped","Private access, reports and audit history enforced","Keep compatibility redirects healthy"], x:430,y:2210,labelX:49,labelY:72 },
  { id:"zaydark", n:"S5", trail:"system", status:"queued", title:"ZayDark policy layer", eyebrow:"PLATFORM POLICY", summary:"ZayDark becomes shared classification and authorization across the whole platform, not a community or separate app.", goals:["Shared content classification","Shared authorization policy","Web/search/API/agent/notification enforcement","Legacy adult-routing contraction"], x:255,y:2360,labelX:3,labelY:77 },
  { id:"zenegades", n:"13", trail:"product", status:"queued", title:"ZENEGADES", eyebrow:"FUTURE PRODUCT", summary:"Lightweight real-world gatherings and plans without requiring a full event listing.", goals:["Define product behavior after Z/ migration","Use shared identity, location and permission layers"], x:560,y:2460,labelX:64,labelY:80 },
  { id:"afterz", n:"14", trail:"product", status:"queued", title:"AFTERZ", eyebrow:"FUTURE PRODUCT", summary:"A temporary continuation of the night that uses the same people, place, safety, and sharing substrate.", goals:["Define ephemeral lifecycle","Location/privacy rules","Shared event and community relationships"], x:665,y:2640,labelX:70,labelY:86 },
  { id:"platform", n:"S6", trail:"system", status:"queued", title:"Platform Core + unified search", eyebrow:"PLATFORMIZATION", summary:"Shared objects, stable IDs, relationships, typed search, permissions, and one domain layer beneath the site.", goals:["Platform Architecture v1","Stable IDs and shared schemas","Cross-object relationships","Unified typed search","Capability and permission model"], x:315,y:2630,labelX:4,labelY:86 },
  { id:"api", n:"S7", trail:"system", status:"queued", title:"API v1 + integrations", eyebrow:"PLATFORM INTERFACE", summary:"A versioned machine interface for the same Zaylist humans use.", goals:["Internal /api/v1 foundation","Versioned object contracts","Scopes and auditability","Developer/integration exit ramps","Machine-readable discovery when verified"], x:360,y:2830,labelX:7,labelY:92 },
  { id:"agent", n:"15", trail:"crossing", status:"queued", title:"Agent-ready Zaylist", eyebrow:"DESTINATION", summary:"Humans, software, integrations, and authorized agents use the same underlying platform model.", goals:["Read/search/discover/recommend first","Scoped save/follow/join/RSVP later","Create/update with human confirmation","Coordinated internal agents","External agent landing pad"], x:520,y:3050,labelX:60,labelY:97 },
] as const;

const HORIZONTAL_POINTS: readonly Point[] = [
  { ...POINTS[0], x:120,y:460,labelX:2,labelY:70 }, { ...POINTS[1], x:260,y:350,labelX:7,labelY:33 },
  { ...POINTS[2], x:390,y:470,labelX:12,labelY:72 }, { ...POINTS[3], x:340,y:185,labelX:10,labelY:7 },
  { ...POINTS[4], x:535,y:555,labelX:18,labelY:84 }, { ...POINTS[5], x:680,y:430,labelX:24,labelY:63 },
  { ...POINTS[6], x:585,y:190,labelX:20,labelY:8 }, { ...POINTS[7], x:825,y:525,labelX:30,labelY:80 },
  { ...POINTS[8], x:965,y:390,labelX:36,labelY:55 }, { ...POINTS[9], x:870,y:175,labelX:32,labelY:6 },
  { ...POINTS[10], x:1105,y:515,labelX:43,labelY:78 }, { ...POINTS[11], x:1240,y:385,labelX:49,labelY:54 },
  { ...POINTS[12], x:1375,y:520,labelX:55,labelY:79 }, { ...POINTS[13], x:1510,y:390,labelX:61,labelY:55 },
  { ...POINTS[14], x:1320,y:180,labelX:51,labelY:7 }, { ...POINTS[15], x:1650,y:345,labelX:66,labelY:30 },
  { ...POINTS[16], x:1715,y:175,labelX:67,labelY:5 }, { ...POINTS[17], x:1850,y:500,labelX:75,labelY:76 },
  { ...POINTS[18], x:1990,y:395,labelX:81,labelY:57 }, { ...POINTS[19], x:1930,y:170,labelX:78,labelY:5 },
  { ...POINTS[20], x:2140,y:205,labelX:87,labelY:9 }, { ...POINTS[21], x:2320,y:350,labelX:92,labelY:42 },
] as const;

const productPath = "M120 460C175 420 210 390 260 350S335 425 390 470 485 590 535 555 625 390 680 430 770 570 825 525 915 350 965 390 1050 560 1105 515 1185 345 1240 385 1320 560 1375 520 1450 350 1510 390 1580 410 1650 345 1760 420 1850 500 1930 455 1990 395 2130 300 2320 350";
const systemPath = "M260 350C280 265 300 210 340 185S510 170 585 190 790 200 870 175 1160 155 1320 180 1510 205 1650 345C1690 260 1685 205 1715 175S1850 155 1930 170 2070 180 2140 205 2250 285 2320 350";

const statusLabel: Record<Status,string> = { done:"Done", progress:"In progress", queued:"Not started" };

const READ_STEPS = ["pride-guide","react","zaylist","foundation","hardening","z-rebuild","zenegades","platform","agent"] as const;

function TrailMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view,setView]=useState<"map"|"index">("map");
  const [readStep,setReadStep]=useState<number|null>(null);
  const wrapRef=useRef<HTMLDivElement>(null);
  const selected = useMemo(() => HORIZONTAL_POINTS.find(p => p.id === selectedId) ?? null, [selectedId]);
  const choose=(id:string)=>{setSelectedId(id);setView("map")};
  useEffect(()=>{const p=HORIZONTAL_POINTS.find(point=>point.id===selectedId);const wrap=wrapRef.current;if(!p||!wrap)return;wrap.scrollTo({left:Math.max(0,p.x-wrap.clientWidth/2),behavior:"smooth"})},[selectedId]);
  const startRead=()=>{setReadStep(0);choose(READ_STEPS[0])};
  const advance=(amount:number)=>{const next=Math.max(0,Math.min(READ_STEPS.length-1,(readStep??0)+amount));setReadStep(next);choose(READ_STEPS[next])};
  return <div className="success-map-shell">
    <div className="success-map__toolbar"><div role="group" aria-label="Roadmap view"><button className={view==="map"?"is-active":""} onClick={()=>setView("map")}>Map</button><button className={view==="index"?"is-active":""} onClick={()=>setView("index")}>Index</button></div><button onClick={startRead}>Read the map →</button></div>
    {view==="map" ? <div className="success-map__wrap" ref={wrapRef}><div className="success-map">
    <svg className="success-map__svg" viewBox="0 0 2480 720" preserveAspectRatio="none" aria-hidden="true">
      <g className="success-map__mountains"><path d="M0 560L210 310l115 140 190-260 185 280 155-190 165 255 210-300 190 270 160-205 210 245 175-280 210 295 165-220 260 300V720H0Z"/></g>
      <g className="success-map__contours"><path d="M-80 130C260 20 440 190 710 90S1190 30 1510 135 2010 195 2550 65"/><path d="M-100 205C250 90 450 270 730 160S1200 100 1530 205 2040 270 2560 135"/><path d="M-80 645C300 525 490 710 760 610S1240 535 1570 650 2080 720 2560 575"/><path d="M-80 590C280 470 470 650 740 550S1220 480 1550 590 2060 650 2560 520"/></g>
      <path className="success-map__product-shadow" d={productPath}/><path className="success-map__product-line" d={productPath}/><path className="success-map__system-shadow" d={systemPath}/><path className="success-map__system-line" d={systemPath}/>
      {HORIZONTAL_POINTS.map(p => <g key={p.id} className={`success-map__node success-map__node--${p.status} success-map__node--${p.trail}`} transform={`translate(${p.x} ${p.y})`}><circle className="ring" r={p.id==="z-rebuild"?36:p.trail === "crossing" ? 28 : 21}/><circle className="dot" r={p.id==="z-rebuild"?12:p.trail === "crossing" ? 9 : 7}/><text y={p.id==="z-rebuild"?-45:"-32"}>{p.id==="z-rebuild"?"NOW":p.n}</text></g>)}
    </svg>
    <div className="success-map__labels">
      {HORIZONTAL_POINTS.map(p => <button key={p.id} type="button" className={`success-map__label success-map__label--${p.status} success-map__label--${p.trail}${selectedId===p.id?" is-selected":""}`} style={{left:`${p.labelX}%`,top:`${p.labelY}%`}} onClick={() => choose(p.id)} aria-pressed={selectedId===p.id}>
        <span>{p.id==="z-rebuild"?"NOW":p.n} / {p.eyebrow}</span><strong>{p.title}</strong><small>See info →</small>
      </button>)}
    </div>
    </div></div> : <div className="success-map__index">{(["done","progress","queued"] as Status[]).map(status=><section key={status}><h2>{statusLabel[status]}</h2><ol>{HORIZONTAL_POINTS.filter(p=>p.status===status).map(p=><li key={p.id}><button onClick={()=>choose(p.id)}><span>{p.n} · {p.trail}</span><strong>{p.title}</strong><small>{p.summary}</small></button></li>)}</ol></section>)}</div>}
    {selected ? <aside className="success-map__detail" aria-live="polite"><button className="success-map__detail-close" type="button" onClick={()=>setSelectedId(null)} aria-label="Close roadmap information">Close ×</button><div><span className={`success-map__status success-map__status--${selected.status}`}>{statusLabel[selected.status]}</span><span>{selected.trail.toUpperCase()} TRAIL / {selected.n}</span></div><h3>{selected.title}</h3><p>{selected.summary}</p><h4>{selected.status==="done"?"Accomplished / keep moving":"Goals"}</h4><ul>{selected.goals.map(g=><li key={g}>{g}</li>)}</ul>{readStep!==null&&<nav aria-label="Guided roadmap reading"><button disabled={readStep===0} onClick={()=>advance(-1)}>← Previous</button><span>{readStep+1} / {READ_STEPS.length}</span><button disabled={readStep===READ_STEPS.length-1} onClick={()=>advance(1)}>Next →</button><button onClick={()=>setReadStep(null)}>Exit</button></nav>}</aside> : <p className="success-map__prompt">Choose any labeled waypoint to see its <strong>status, story, and goals.</strong></p>}
  </div>;
}

export default function ProductRoadmap({ page = false }: { page?: boolean }) {
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{ if(!expanded)return; const old=document.body.style.overflow; document.body.style.overflow="hidden"; const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setExpanded(false)}; window.addEventListener("keydown",key); return()=>{document.body.style.overflow=old;window.removeEventListener("keydown",key)} },[expanded]);
  if(page) return <section className="product-roadmap product-roadmap--page"><header className="product-roadmap__hero"><span>PRODUCT + SYSTEM / LIVE OPERATING MAP</span><h1>TWO STORIES AT<br/>THE SAME TIME.</h1><p><strong>Product trail</strong> is what people get. <strong>System trail</strong> is what makes it hold together. At the purple crossings, Zaylist changes shape.</p><div className="product-roadmap__legend"><b><i className="trail-product"/>Product</b><b><i className="trail-system"/>System</b><b><i className="done"/>Done</b><b><i className="progress"/>In progress</b><b><i className="queued"/>Not started</b></div></header><TrailMap/></section>;
  return <section className="product-roadmap"><div className="product-roadmap__preview-head"><div><span>PRODUCT + SYSTEM / LIVE OPERATING VIEW</span><h2>TWO STORIES AT THE SAME TIME.</h2><p>Two trails. One platform.</p></div><button type="button" onClick={()=>setExpanded(true)}>Expand roadmap ↗</button></div><button className="product-roadmap__mini" type="button" onClick={()=>setExpanded(true)} aria-label="Open interactive roadmap"><svg viewBox="0 0 1000 250" aria-hidden="true"><path className="mini-product" d="M20 160C170 45 250 210 390 120S610 45 740 130 900 200 980 80"/><path className="mini-system" d="M20 210C160 120 260 230 390 120S570 220 740 130 870 70 980 80"/></svg><span>PRODUCT</span><span>SYSTEM</span></button>{expanded&&<div className="product-roadmap__overlay" role="dialog" aria-modal="true"><button className="product-roadmap__overlay-close" type="button" onClick={()=>setExpanded(false)}>Close ×</button><div className="product-roadmap__overlay-scroll"><header className="product-roadmap__hero"><span>PRODUCT + SYSTEM / LIVE OPERATING MAP</span><h1>TWO STORIES AT<br/>THE SAME TIME.</h1></header><TrailMap/></div></div>}</section>;
}
