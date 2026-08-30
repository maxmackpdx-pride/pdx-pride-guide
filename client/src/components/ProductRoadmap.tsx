import { useEffect, useMemo, useState } from "react";
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
  { id:"react", n:"02", trail:"crossing", status:"done", title:"React rebuild + event platform", eyebrow:"TECHNICAL RESET", summary:"Moving off Squarespace created the custom app and the modern event system before Zaylist existed.", goals:["React app foundation established","Modern Events system established","Retire remaining Squarespace-era assumptions"], x:470,y:330,labelX:55,labelY:9 },
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
  { id:"z-rebuild", n:"12", trail:"crossing", status:"queued", title:"Z/ rebuild → Communities", eyebrow:"MAJOR NEXT MIGRATION", summary:"The major crossing: give Z/ one clear job as the community layer while rebuilding the architecture underneath it.", goals:["Audit every Z/ route, component, data model and alias","Classify community vs product vs category vs legacy","Create Community domain object","Memberships, moderators, rules, posts and visibility","Connect Events, SELLZ, GIGZ, Places and Guides","Redirect legacy URLs","Feature-flag rollout and rollback","Remove obsolete Z/ runtime architecture safely"], x:430,y:2210,labelX:49,labelY:72 },
  { id:"zaydark", n:"S5", trail:"system", status:"queued", title:"ZayDark policy layer", eyebrow:"PLATFORM POLICY", summary:"ZayDark becomes shared classification and authorization across the whole platform, not a community or separate app.", goals:["Shared content classification","Shared authorization policy","Web/search/API/agent/notification enforcement","Legacy adult-routing contraction"], x:255,y:2360,labelX:3,labelY:77 },
  { id:"zenegades", n:"13", trail:"product", status:"queued", title:"ZENEGADES", eyebrow:"FUTURE PRODUCT", summary:"Lightweight real-world gatherings and plans without requiring a full event listing.", goals:["Define product behavior after Z/ migration","Use shared identity, location and permission layers"], x:560,y:2460,labelX:64,labelY:80 },
  { id:"afterz", n:"14", trail:"product", status:"queued", title:"AFTERZ", eyebrow:"FUTURE PRODUCT", summary:"A temporary continuation of the night that uses the same people, place, safety, and sharing substrate.", goals:["Define ephemeral lifecycle","Location/privacy rules","Shared event and community relationships"], x:665,y:2640,labelX:70,labelY:86 },
  { id:"platform", n:"S6", trail:"system", status:"queued", title:"Platform Core + unified search", eyebrow:"PLATFORMIZATION", summary:"Shared objects, stable IDs, relationships, typed search, permissions, and one domain layer beneath the site.", goals:["Platform Architecture v1","Stable IDs and shared schemas","Cross-object relationships","Unified typed search","Capability and permission model"], x:315,y:2630,labelX:4,labelY:86 },
  { id:"api", n:"S7", trail:"system", status:"queued", title:"API v1 + integrations", eyebrow:"PLATFORM INTERFACE", summary:"A versioned machine interface for the same Zaylist humans use.", goals:["Internal /api/v1 foundation","Versioned object contracts","Scopes and auditability","Developer/integration exit ramps","Machine-readable discovery when verified"], x:360,y:2830,labelX:7,labelY:92 },
  { id:"agent", n:"15", trail:"crossing", status:"queued", title:"Agent-ready Zaylist", eyebrow:"DESTINATION", summary:"Humans, software, integrations, and authorized agents use the same underlying platform model.", goals:["Read/search/discover/recommend first","Scoped save/follow/join/RSVP later","Create/update with human confirmation","Coordinated internal agents","External agent landing pad"], x:520,y:3050,labelX:60,labelY:97 },
] as const;

const productPath = "M620 130 C520 210 430 240 470 330 C510 420 700 410 650 520 C610 610 530 650 575 760 C620 850 420 850 440 930 C470 1020 560 1000 535 1110 C510 1200 690 1190 650 1280 C610 1380 520 1370 560 1460 C610 1560 410 1540 450 1640 C490 1730 630 1710 600 1810 C570 1900 480 1900 520 1990 C560 2090 470 2130 430 2210 C420 2310 600 2340 560 2460 C530 2540 700 2540 665 2640 C620 2760 500 2860 520 3050";
const systemPath = "M470 330 C350 400 250 430 285 560 C330 700 190 770 240 910 C290 1040 220 1140 300 1250 C350 1370 220 1540 275 1860 C315 2020 330 2120 430 2210 C320 2270 235 2290 255 2360 C270 2470 280 2530 315 2630 C360 2740 320 2780 360 2830 C420 2910 470 2950 520 3050";

const statusLabel: Record<Status,string> = { done:"Done", progress:"In progress", queued:"Not started" };

function TrailMap({ interactive = true }: { interactive?: boolean }) {
  const [selectedId, setSelectedId] = useState("z-rebuild");
  const selected = useMemo(() => POINTS.find(p => p.id === selectedId) ?? POINTS[0], [selectedId]);
  return <div className="success-map">
    <svg className="success-map__svg" viewBox="0 0 1000 3200" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
      <g className="success-map__contours"><path d="M-80 420C160 250 290 470 500 330S800 180 1090 330"/><path d="M-100 520C170 340 320 560 520 430S820 290 1100 430"/><path d="M-80 1500C140 1320 310 1550 500 1420S820 1280 1100 1450"/><path d="M-100 1620C160 1430 330 1680 540 1520S830 1390 1110 1560"/><path d="M-50 2500C150 2300 330 2550 520 2410S820 2280 1080 2440"/></g>
      <path className="success-map__product-shadow" d={productPath}/><path className="success-map__product-line" d={productPath}/><path className="success-map__system-shadow" d={systemPath}/><path className="success-map__system-line" d={systemPath}/>
      {POINTS.map(p => <g key={p.id} className={`success-map__node success-map__node--${p.status} success-map__node--${p.trail}`} transform={`translate(${p.x} ${p.y})`}><circle className="ring" r={p.trail === "crossing" ? 28 : 21}/><circle className="dot" r={p.trail === "crossing" ? 9 : 7}/><text y="-32">{p.n}</text></g>)}
    </svg>
    <div className="success-map__labels">
      {POINTS.map(p => <button key={p.id} type="button" className={`success-map__label success-map__label--${p.status} success-map__label--${p.trail}${selectedId===p.id?" is-selected":""}`} style={{left:`${p.labelX}%`,top:`${p.labelY}%`}} onClick={() => interactive && setSelectedId(p.id)} aria-pressed={selectedId===p.id}>
        <span>{p.n} / {p.eyebrow}</span><strong>{p.title}</strong><small>{p.summary}</small>
      </button>)}
    </div>
    {interactive && <aside className="success-map__detail" aria-live="polite">
      <div><span className={`success-map__status success-map__status--${selected.status}`}>{statusLabel[selected.status]}</span><button type="button" onClick={() => setSelectedId(POINTS[0].id)} aria-label="Reset selected waypoint">×</button></div>
      <p className="success-map__detail-meta">{selected.trail.toUpperCase()} TRAIL / {selected.n}</p><h3>{selected.title}</h3><p>{selected.summary}</p><h4>{selected.status==="done"?"Keep moving":"Goals"}</h4><ul>{selected.goals.map(g=><li key={g}>{g}</li>)}</ul>
    </aside>}
  </div>;
}

export default function ProductRoadmap({ page = false }: { page?: boolean }) {
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{ if(!expanded)return; const old=document.body.style.overflow; document.body.style.overflow="hidden"; const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setExpanded(false)}; window.addEventListener("keydown",key); return()=>{document.body.style.overflow=old;window.removeEventListener("keydown",key)} },[expanded]);
  if(page) return <section className="product-roadmap product-roadmap--page"><header className="product-roadmap__hero"><span>PRODUCT + SYSTEM / LIVE OPERATING MAP</span><h1>THE PATH FROM<br/>LIVE TO DURABLE.</h1><p>The product trail is what people use. The system trail is what makes it durable. Where they cross, the platform changes shape.</p><div className="product-roadmap__legend"><b><i className="trail-product"/>Product</b><b><i className="trail-system"/>System</b><b><i className="done"/>Done</b><b><i className="progress"/>In progress</b><b><i className="queued"/>Not started</b></div></header><TrailMap/></section>;
  return <section className="product-roadmap"><div className="product-roadmap__preview-head"><div><span>PRODUCT + SYSTEM / LIVE OPERATING VIEW</span><h2>THE PATH FROM LIVE TO DURABLE.</h2><p>Two trails. One platform.</p></div><button type="button" onClick={()=>setExpanded(true)}>Expand roadmap ↗</button></div><button className="product-roadmap__mini" type="button" onClick={()=>setExpanded(true)} aria-label="Open interactive roadmap"><svg viewBox="0 0 1000 250" aria-hidden="true"><path className="mini-product" d="M20 160C170 45 250 210 390 120S610 45 740 130 900 200 980 80"/><path className="mini-system" d="M20 210C160 120 260 230 390 120S570 220 740 130 870 70 980 80"/></svg><span>PRODUCT</span><span>SYSTEM</span></button>{expanded&&<div className="product-roadmap__overlay" role="dialog" aria-modal="true"><button className="product-roadmap__overlay-close" type="button" onClick={()=>setExpanded(false)}>Close ×</button><div className="product-roadmap__overlay-scroll"><header className="product-roadmap__hero"><span>PRODUCT + SYSTEM / LIVE OPERATING MAP</span><h1>THE PATH FROM<br/>LIVE TO DURABLE.</h1></header><TrailMap/></div></div>}</section>;
}
