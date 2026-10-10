import { useEffect, useRef } from "react";
import { waypointHtml, type WaypointId } from "@/lib/livingMapWaypoints";
import { HALLOWEEN_GLYPHS, HALLOWEEN_COLORS, pumpkinDots, type HalloweenGlyph } from "@/lib/homeHalloween";
import { vineMesh, drawVines, hitVines } from "./ponies-globe-vines";
import hologramData from "./portland-globe-holograms.json";

// A deliberately enlarged metro wrapped over a sphere, not an Earth-scale globe.
// Built-up land-use and water mask: OpenFreeMap / OpenMapTiles / OSM,
// z13 geography cropped to the screenshot bounds below; parks stay empty.


type OutzideGlobeGlyph = "trail" | "fishing" | "watercamp" | "boating" | "camp";
type GlobeWaypointId = `halloween-${HalloweenGlyph}` | WaypointId | `outzide-${OutzideGlobeGlyph}`;
const OUTZIDE_GLYPHS: Record<OutzideGlobeGlyph, string> = {
  trail: '<path d="M4 3h7v7l3 3 5 1a3 3 0 0 1 2 3v3H3v-7l1-3V3ZM3 17h18M6 20v1M10 20v1M15 20v1M19 20v1M8 7h3M8 10h3M10 12l2-1M12 14l2-1"/>',
  fishing: '<path d="M3 12q7-9 14-1l4-4v10l-4-4q-7 8-14-1ZM13 7q-2 5 0 10M8 7l2-3 3 3"/><circle cx="6.5" cy="11" r=".7"/>',
  watercamp: '<path d="m4 15 7-12 7 12H4Zm5 0 2-5 2 5M2 18.5q2.5-2 5 0t5 0 5 0 5 0M2 22q2.5-2 5 0t5 0 5 0 5 0"/>',
  boating: '<path d="M3 15h18l-4 5H7l-4-5ZM12 3v12M10 5l-6 8h6V5ZM14 7l6 6h-6V7ZM2 22q2.5-2 5 0t5 0 5 0 5 0"/>',
  camp: '<path d="m2 19 7-15 7 15H2Z M7 19l2-6 2 6M7 3l4 4M18 17c-3-2-2-4 0-6 0 2 2 2 2 0 3 3 3 5 0 6M16 20l6 2M16 22l6-2"/>',
};

function globeWaypointSvg(id: GlobeWaypointId, color: string) {
  const halloweenId = id.startsWith("halloween-") ? id.slice(10) as HalloweenGlyph : undefined;
  const outzideId = id.startsWith("outzide-") ? id.slice(8) as OutzideGlobeGlyph : undefined;
  const marker = outzideId || halloweenId ? "" : waypointHtml({ id: id as WaypointId, color, size: 42 });
  const glyph = marker.match(/<g transform="([^"]+)" fill="#fff" stroke="#fff" color="#fff">([\s\S]*?)<\/g>/);
  const glyphMarkup = halloweenId
    ? `<g transform="translate(16 15)" fill="none" stroke="${color}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${HALLOWEEN_GLYPHS[halloweenId]}</g>`
    : outzideId
    ? `<g transform="translate(16 15)" fill="${color}" stroke="${color}" color="${color}">${OUTZIDE_GLYPHS[outzideId]}</g>`
    : glyph
      ? `<g transform="translate(-2 -2) ${glyph[1]}" fill="${color}" stroke="${color}" color="${color}">${glyph[2]}</g>`
      : "";
  const glowId = `globe-${id.replace(/[^a-z0-9-]/gi, "")}-glow`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="66" viewBox="0 0 56 66">
    <defs><filter id="${glowId}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d="M28 51v9" stroke="${color}" stroke-width="1.8" stroke-linecap="round" opacity=".9"/>
    <ellipse cx="28" cy="63" rx="7" ry="2" fill="${color}" opacity=".8"/>
    <ellipse cx="28" cy="63" rx="12" ry="4" fill="${color}" opacity=".16"/>
    <rect x="4" y="3" width="48" height="48" rx="10" fill="#05090d" fill-opacity=".96" stroke="${color}" stroke-width="2.2" filter="url(#${glowId})"/>
    ${glyphMarkup}
  </svg>`;
}

const COLORS = ["#00ffff", "#ff00cc", "#ccff00", "#ff6600", "#ab75ff"];
type Venue = { id: string; name: string; coordinates: [number, number]; logo?: string; logoMode?: string; color?: string; point?: Point };
// Screenshot crop, approximated from Eagle, downtown, I-205 and Sellwood.
// These bounds drive BOTH the texture sampling and all venue/label positions.
const METRO = { west: -122.704, east: -122.555, north: 45.588, south: 45.475 };
const tileX = (lon: number) => (lon + 180) / 360 * 1024;
const tileY = (lat: number) => (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 1024;
const CENTER = [(tileX(METRO.west)+tileX(METRO.east))/2, (tileY(METRO.north)+tileY(METRO.south))/2];
const SPAN = [(tileX(METRO.east)-tileX(METRO.west))/2, (tileY(METRO.south)-tileY(METRO.north))/2];
// Initial globe center: SE Hawthorne Boulevard at SE 12th Avenue.
const START_LOCATION = { lat: 45.5121, lon: -122.65365 };
const EQUATOR_V = (CENTER[1]-tileY(START_LOCATION.lat))/SPAN[1];
// Compress the central city into an equatorial band, preserving crop edges.
function equatorialLatitude(value: number, inverse = false): number {
  if (inverse) {
    let low=-1, high=1;
    for(let i=0;i<28;i++) {
      const mid=(low+high)/2;
      if(equatorialLatitude(mid)<value)low=mid;else high=mid;
    }
    return (low+high)/2;
  }
  const t=(value-EQUATOR_V)/(value>=EQUATOR_V?1-EQUATOR_V:1+EQUATOR_V);
  return .28*t+.72*t*t*t;
}
const PLACES = [{ name: "Portland", lat: 45.523, lon: -122.676 }];
// A continuous focus warp spreads the dense central metro around the sphere.
// The map, labels, glitter and venue anchors all use this same transform.
function warp(value: number, center: number, strength: number, inverse = false) {
  const low=Math.atan((-1-center)*strength), high=Math.atan((1-center)*strength);
  return inverse ? Math.tan(low+(value+1)*.5*(high-low))/strength+center
    : (Math.atan((value-center)*strength)-low)/(high-low)*2-1;
}
const smooth = (value: number) => { const t=Math.max(0,Math.min(1,value)); return t*t*t*(t*(t*6-15)+10); };
const MAX_HOLOGRAMS = 8;
const DUPLICATE_PHASE_OFFSET = 1000;
// These venue marks and Zaylist family logos keep their original artwork.
const FEATURED_LOGO_IDS = new Set(["1-0", "2-0", "5-0", "28-0", "33-0", "41-0"]);
const RANDOM_GLOBE_WAYPOINTS: GlobeWaypointId[] = ["bar", "venue", "cafe", "shop", "adult", "outzide-trail", "outzide-fishing", "outzide-watercamp", "outzide-boating", "outzide-camp"];
type HologramState = { progress: number; openedAt: number; closing: boolean; offsetX: number; offsetY: number; waypoint: boolean; waypointLogo?: GlobeWaypointId };
type Point = { x: number; y: number; z: number; tone: number; beamExcluded?: boolean; brightRoad?: boolean; hoverGlow?: { strength:number; lift:number; hue:number; core:number; lastLit:number }; glow?: { strength: number; lastLit: number; r: number; g: number; b: number } };
function sphere(u: number, v: number, tone = 0): Point {
  const longitude = warp(u,-.15,5) * Math.PI, latitude = equatorialLatitude(v) * Math.PI / 2;
  return { x: Math.sin(longitude) * Math.cos(latitude), y: Math.sin(latitude), z: Math.cos(longitude) * Math.cos(latitude), tone };
}
function placePoint(place: { lat: number; lon: number }) {
  const x = (place.lon + 180) / 360 * 1024;
  const y = (1 - Math.asinh(Math.tan(place.lat * Math.PI / 180)) / Math.PI) / 2 * 1024;
  return sphere((x - CENTER[0]) / SPAN[0], (CENTER[1] - y) / SPAN[1]);
}
const RIVERS = [
  { name: "Willamette River", lat: 45.552, lon: -122.688 },
];
// Start the visible map roughly one fifth of the globe radius farther left.
const INITIAL_YAW = -warp((tileX(START_LOCATION.lon)-CENTER[0])/SPAN[0],-.15,5)*Math.PI + .27;
const MARKERS = PLACES.map(place => ({ ...place, point: placePoint(place) }));
// Decorative product waypoints, not real listings or claimed venue locations.
// One per longitude sector keeps the random anchors spread around the globe.
const PRODUCT_WAYPOINTS: Venue[] = [
  { id: "giftz", name: "GIFTZ", logo: "/brand/family/giftz.svg", color: "#ccff00" },
  { id: "mizzed", name: "MIZZED CONNECTION", logo: "/brand/family/mizzed-connection.svg", color: "#ff00cc" },
  { id: "gigz", name: "GIGZ", logo: "/brand/family/gigz.svg", color: "#8800ff" },
  { id: "outz", name: "OUTZide", logo: "/brand/outzide.png", color: "#ff6600" },
  { id: "sellz", name: "SELLZ", logo: "/brand/family/sellz.svg", color: "#39ff14" },
  { id: "hauz", name: "THE HAÜZ", logo: "/brand/family/the-hauz.svg", color: "#00ffff" },
].map((waypoint, index) => ({
  ...waypoint, coordinates: [0, 0], logoMode: "alpha",
  point: sphere(warp(-1+(index+.2+Math.random()*.6)/3,-.15,5,true),
    equatorialLatitude((Math.random()-.5)*.6,true)),
}));

const OUTZIDE_SOURCE = [
  { id: "outzide-rooster-rock", name: "Rooster Rock", color: "#ff00cc" },
  { id: "outzide-sauvie-island", name: "Sauvie Island", color: "#ff00cc" },
  { id: "outzide-silver-falls", name: "Silver Falls State Park", color: "#39ff14" },
  { id: "outzide-cape-lookout", name: "Cape Lookout State Park", color: "#f2ca78" },
  { id: "outzide-beacon-rock", name: "Beacon Rock State Park", color: "#39ff14" },
];
const OUTZIDE_WAYPOINTS: Venue[] = OUTZIDE_SOURCE.map((waypoint, index) => ({
  ...waypoint, coordinates: [0, 0],
  point: sphere(warp(-1+(index+.2+Math.random()*.6)/(OUTZIDE_SOURCE.length/2),-.15,5,true),
    equatorialLatitude((Math.random()-.5)*.6,true)),
}));

export function PortlandMetroGlobe({ active, still, halloween = false, onOpenPonies }: { active: boolean; still: boolean; halloween?: boolean; onOpenPonies?: () => void }) {
  const mode=useRef({active,still});
  const syncAnimation=useRef(()=>{});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angle = useRef(0);
  const elapsedRef = useRef(0);
  const redrawRef = useRef(() => {});
  const hologramStates = useRef(new Map<number,HologramState>());
  const lastShown = useRef(new Map<number,number>());
  const lastShownRow = useRef(new Map<string,number>());
  const lastFrame = useRef(0);
  const nextOpen = useRef(0);
  const vineHit = useRef<(x:number,y:number)=>boolean>(()=>false);
  const pointerDown = useRef<{x:number;y:number}|null>(null);
  const hover = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    hologramStates.current.clear();lastShown.current.clear();lastShownRow.current.clear();lastFrame.current=0;nextOpen.current=0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let {active,still}=mode.current;
    let disposed = false, frame = 0, previous = 0, elapsed = elapsedRef.current;
    let width = 0, height = 0;
    let points: Point[] = halloween ? pumpkinDots(-INITIAL_YAW) : [];
    const vineImage = new Image();
    let vinePixels: ImageData | null = null;
    let lastHoverFrame=performance.now();
    // Reuse small glow stamps instead of asking the renderer to blur every dot.
    const hoverSprites=new Map<number,HTMLCanvasElement>();
    const hoverSprite=(hue:number,core:number)=>{
      const h=Math.round(hue/6)*6,c=Math.round(core*3)/3,key=h*4+Math.round(c*3);
      const cached=hoverSprites.get(key);if(cached)return cached;
      const sprite=document.createElement('canvas');sprite.width=sprite.height=32;
      const ink=sprite.getContext('2d')!;
      const bloom=ink.createRadialGradient(16,16,1,16,16,9);
      bloom.addColorStop(0,`hsla(${h},95%,${65+c*10}%,.45)`);
      bloom.addColorStop(.4,`hsla(${h},95%,${65+c*10}%,.12)`);
      bloom.addColorStop(1,`hsla(${h},95%,${65+c*10}%,0)`);
      ink.fillStyle=bloom;ink.fillRect(0,0,32,32);
      ink.fillStyle=`hsl(${h} ${90-c*20}% ${65+c*13}%)`;
      ink.beginPath();ink.arc(16,16,2.5,0,Math.PI*2);ink.fill();
      hoverSprites.set(key,sprite);return sprite;
    };
    // Previous frame footprints keep the dot pass beneath beams and artwork.
    let beamFootprints: { ax:number; ay:number; x:number; y:number; halfWidth:number; strength:number; rgb:number[] }[] = [];
    const venues: { id: string; product: boolean; point: Point; image: HTMLCanvasElement; waypointImage: HTMLImageElement; color: string; phase: number; logoKey:string; holiday?: GlobeWaypointId }[] = [];
    const addOpenAreaDuplicates=()=>{
      const originals=venues.filter(venue=>venue.phase<DUPLICATE_PHASE_OFFSET && !venue.holiday);
      const occupied=venues.map(venue=>venue.point);
      for(const venue of originals){
        if(venues.some(other=>other.phase===venue.phase+DUPLICATE_PHASE_OFFSET))continue;
        let bestPoint:Point|undefined,bestScore=-Infinity;
        // A fixed golden-angle field spreads copies across both hemispheres.
        // Keep each copy off its source's latitude and well away from its pin.
        for(let index=0;index<240;index++){
          const y=-.72+1.44*((index*73%240+.5)/240);
          if(Math.abs(y-venue.point.y)<.24)continue;
          const longitude=index*2.399963;
          const band=Math.sqrt(1-y*y);
          const point:Point={x:Math.sin(longitude)*band,y,z:Math.cos(longitude)*band,tone:0};
          const sourceDot=point.x*venue.point.x+point.y*venue.point.y+point.z*venue.point.z;
          if(sourceDot>.45)continue;
          const nearest=Math.min(...occupied.map(other=>
            (point.x-other.x)**2+(point.y-other.y)**2+(point.z-other.z)**2));
          const score=nearest+.08*(1-Math.abs(y));
          if(score>bestScore){bestScore=score;bestPoint=point;}
        }
        if(!bestPoint)continue;
        venues.push({...venue,phase:venue.phase+DUPLICATE_PHASE_OFFSET,point:bestPoint,waypointImage:new Image()});
        occupied.push(bestPoint);
      }
      canvas.dataset.globeWaypoints=String(venues.length);
    };
    type AtlasEntry = {id:string; coordinates:[number,number];color:string;phase:number;product:boolean;logoKey?:string;x:number;y:number;w:number;h:number};
    const atlas=new Image();atlas.decoding="async";
    let atlasReady=false, fallbackWaypointsAdded=false, atlasAttempts=0, atlasRetry=0;
    const addFallbackWaypoints=()=>{
      if(disposed||fallbackWaypointsAdded)return;
      fallbackWaypointsAdded=true;
      if(halloween) Object.keys(HALLOWEEN_GLYPHS).forEach((glyph,index)=>{
        const longitude=index/10*Math.PI*2, latitude=(index%2?.32:-.32);
        const holiday=`halloween-${glyph}` as GlobeWaypointId;
        const image=document.createElement("canvas");image.width=image.height=256;
        venues.push({id:holiday,product:false,point:{x:Math.sin(longitude)*Math.cos(latitude),y:Math.sin(latitude),z:Math.cos(longitude)*Math.cos(latitude),tone:0},image,
          waypointImage:new Image(),color:HALLOWEEN_COLORS[index%3],phase:500+index,logoKey:holiday,holiday});
      });
      canvas.dataset.halloweenWaypoints=halloween?"10":"0";
      OUTZIDE_WAYPOINTS.forEach((waypoint,index)=>{
        const image=document.createElement("canvas");image.width=image.height=256;
        if(waypoint.point)venues.push({id:waypoint.id,product:false,point:waypoint.point,image,
          waypointImage:new Image(),color:waypoint.color||"#00ffff",phase:230+index*2.39996,logoKey:waypoint.id});
      });
      addOpenAreaDuplicates();
      draw();
    };
    const populateAtlas=()=>{
      if(disposed||atlasReady||!atlas.naturalWidth)return;
      atlasReady=true;
      window.clearTimeout(atlasRetry);
      const rows=hologramData as AtlasEntry[];
      for(const row of rows){
        const image=document.createElement("canvas");image.width=row.w;image.height=row.h;
        image.getContext("2d")?.drawImage(atlas,row.x,row.y,row.w,row.h,0,0,row.w,row.h);
        const [lon,lat]=row.coordinates;
        const point=row.product?PRODUCT_WAYPOINTS.find(p=>p.id===row.id)?.point:placePoint({lat,lon});
        const waypointImage=new Image();
        if(point)venues.push({id:row.id,product:row.product,point,image,waypointImage,color:row.color,phase:row.phase,logoKey:(row.logoKey||row.id).toLowerCase()});
      }
      addFallbackWaypoints();
      addOpenAreaDuplicates();
      draw();
    };
    const loadAtlas=()=>{ atlas.src=`/home-globe/holograms.webp${atlasAttempts?`?retry=${atlasAttempts}`:""}`; };
    atlas.onload=populateAtlas;
    atlas.onerror=()=>{
      if(disposed||atlasAttempts>=2)return;
      atlasAttempts+=1;
      atlasRetry=window.setTimeout(loadAtlas,atlasAttempts*800);
    };
    // Safari can leave Image.decode() pending after a cached-page reload.
    // The load event and a small waypoint fallback keep the globe populated.
    loadAtlas();
    const fallbackTimer=window.setTimeout(addFallbackWaypoints,2500);
    const texture = new Image();
    const draw = () => {
      if (!width || !height) return;
      const front = canvas.closest('.home-front');
      const headerInset = front ? parseFloat(getComputedStyle(front).getPropertyValue('--home-header-height')) || 0 : 0;
      const footerInset = canvas.parentElement ? parseFloat(getComputedStyle(canvas.parentElement).getPropertyValue('--home-flight-bottom')) || 0 : 0;
      const mobile=width<600;
      const availableHeight=Math.max(1,height-headerInset-footerInset);
      // On phones, fill the hero's usable space and let its sides crop slightly.
      const radius=mobile?Math.min(width*.54,availableHeight*.52)
        :Math.min(width*.48,height*.43)*.7*1.15;
      const cx=width/2,cy=mobile?headerInset+availableHeight/2:height/2;
      const canvasBounds=canvas.getBoundingClientRect();
      const protectedAreas = ['.home-front__mark','.home-front__identity-script'].flatMap(selector=>{
        const element=front?.querySelector(selector);
        if(!element)return [];
        const rect=element.getBoundingClientRect();
        return [{ x:rect.left-canvasBounds.left-12,y:rect.top-canvasBounds.top-12,w:rect.width+24,h:rect.height+24 }];
      });
      const textOverlap=(x:number,y:number,w:number,h:number)=>Math.min(1,protectedAreas.reduce((area,rect)=>{
        const overlapW=Math.max(0,Math.min(x+w/2,rect.x+rect.w)-Math.max(x-w/2,rect.x));
        const overlapH=Math.max(0,Math.min(y+h/2,rect.y+rect.h)-Math.max(y-h/2,rect.y));
        return area+overlapW*overlapH;
      },0)/(w*h));
      const yaw = INITIAL_YAW + angle.current + (still ? 0 : elapsed / 42000);
      const yawCos=Math.cos(yaw),yawSin=Math.sin(yaw);
      const project = (p: Point, elevation = 1) => {
        const x = p.x * yawCos + p.z * yawSin;
        const z = p.z * yawCos - p.x * yawSin;
        return { x: cx + x * radius * elevation, y: cy - p.y * radius * elevation, z };
      };
      context.clearRect(0, 0, width, height);
      const vines = halloween ? vineMesh(cx,cy,radius,elapsed,still,yaw) : [];
      if(vinePixels) drawVines(context,vineImage,vines.filter(vine=>vine.z<0));
      vineHit.current=(x,y)=>!!vinePixels && hitVines(x,y,vines,vinePixels,cx,cy,radius);
      // Black negative space between the populated areas and waterways.
      context.fillStyle = '#000';
      context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();
      // Batch dot paths by depth and land class instead of issuing 15k fills.
      const hoverDots: { x:number; y:number; radius:number; strength:number; hue:number; core:number }[] = [];
      const pointerX=hover.current?(hover.current.x-cx)/radius:2;
      const pointerY=hover.current?(cy-hover.current.y)/radius:2;
      const pointerRadiusSquared=pointerX*pointerX+pointerY*pointerY;
      const surfaceHover=pointerRadiusSquared<1?{x:pointerX,y:pointerY,z:Math.sqrt(1-pointerRadiusSquared)}:null;
      const hoverAngle=Math.asin(Math.sin(Math.min(.45,52/radius))*.7);
      const hoverTurn=still?0:performance.now()/1500;
      const hoverCos=Math.cos(hoverTurn),hoverSin=Math.sin(hoverTurn);
      const hoverCosLimit=Math.cos(hoverAngle),hoverSinAngle=Math.sin(hoverAngle);
      const tangentLength=surfaceHover?Math.hypot(surfaceHover.x,surfaceHover.z):1;
      const beamDots: {x:number;y:number;size:number;glow:NonNullable<Point["glow"]>}[]=[];
      const hoverNow=performance.now(),hoverDt=Math.min(64,Math.max(0,hoverNow-lastHoverFrame));
      lastHoverFrame=hoverNow;
      const hoverRise=1-Math.exp(-hoverDt/110),hoverFall=1-Math.exp(-hoverDt/650),hoverLift=1-Math.exp(-hoverDt/180);
      const glowDt=Math.min(64,Math.max(0,elapsed-lastFrame.current));
      const brightRoads=new Path2D();
      const batches = Array.from({ length: 12 }, () => new Path2D());
      for (const p of points) {
        let q = project(p);
        if (q.z <= 0) continue;
        const depth = Math.min(3, Math.floor(q.z * 4));
        const size = Math.max(.35, radius / 195 * Math.sqrt(q.z));
        let hoverTarget=0;
        if(surfaceHover){
          const nx=(q.x-cx)/radius,ny=(cy-q.y)/radius;
          // Great-circle distance creates a patch ON the sphere. It naturally
          // foreshortens toward the rim instead of staying a flat cursor disk.
          const cosine=nx*surfaceHover.x+ny*surfaceHover.y+q.z*surfaceHover.z;
          // The cheap dot-product test rejects the rest of the sphere before acos.
          if(cosine>hoverCosLimit){
            const distance=Math.acos(Math.min(1,cosine))/hoverAngle;
            const east=(nx*surfaceHover.z-q.z*surfaceHover.x)/Math.max(.001,tangentLength);
            const north=(-nx*surfaceHover.y*surfaceHover.x+ny*tangentLength*tangentLength-q.z*surfaceHover.y*surfaceHover.z)/Math.max(.001,tangentLength);
            const across=(east*hoverCos+north*hoverSin)/hoverSinAngle;
            const strength=smooth(1-distance);
            hoverTarget=strength;
            const effect=p.hoverGlow ??= {strength:0,lift:0,hue:0,core:0,lastLit:-Infinity};
            effect.hue=270*(1-Math.max(0,Math.min(1,(across+1)/2)));
            effect.core=Math.exp(-14*distance*distance);
            effect.lastLit=hoverNow;
          }
        }
        const effect=p.hoverGlow;
        if(effect){
          const held=hoverNow-effect.lastLit<2000?Math.max(hoverTarget,effect.strength):hoverTarget;
          effect.strength+=(held-effect.strength)*(held>effect.strength?hoverRise:hoverFall);
          effect.lift+=((still?0:hoverTarget)-effect.lift)*hoverLift;
          q=project(p,1+effect.lift*2/radius);
          q.y-=effect.lift*1.2;
          if(effect.strength>.005)hoverDots.push({x:q.x,y:q.y,radius:size,strength:effect.strength,hue:effect.hue,core:effect.core});
          else if(effect.lift<.001 && hoverTarget===0)p.hoverGlow=undefined;
        }
        const path = p.brightRoad?brightRoads:batches[p.tone * 4 + depth];
        path.moveTo(q.x + size, q.y); path.arc(q.x, q.y, size, 0, Math.PI * 2);
        if(p.tone!==2 && !p.beamExcluded){
          let target=0, rgb=[255,255,255];
          for(const beam of beamFootprints){
            const dy=beam.y-beam.ay;
            if(Math.abs(dy)<1)continue;
            const t=(q.y-beam.ay)/dy;
            if(t<=0 || t>=1)continue;
            const center=beam.ax+(beam.x-beam.ax)*t;
            const edge=Math.abs(q.x-center)/Math.max(1,beam.halfWidth*t);
            if(edge>=1)continue;
            const strength=beam.strength*smooth((1-edge)/.4)*smooth(t/.15)*smooth((1-t)/.15);
            if(strength>target){target=strength;rgb=beam.rgb;}
          }
          const glow=p.glow ??= {strength:0,lastLit:-Infinity,r:rgb[0],g:rgb[1],b:rgb[2]};
          if(target>.01)glow.lastLit=elapsed;
          // Hold the illuminated color for four seconds after the beam leaves,
          // then use the existing gentle fade back to the map's base dots.
          const heldTarget=elapsed-glow.lastLit<4000?Math.max(target,glow.strength):target;
          const blend=still?1:1-Math.exp(-glowDt/(heldTarget>glow.strength?180:450));
          glow.strength+=(heldTarget-glow.strength)*blend;
          if(target>0){
            glow.r+=(rgb[0]-glow.r)*blend;glow.g+=(rgb[1]-glow.g)*blend;glow.b+=(rgb[2]-glow.b)*blend;
          }
          if(glow.strength>.01)beamDots.push({x:q.x,y:q.y,size,glow});
        }

      }
      batches.forEach((path, index) => {
        const tone = Math.floor(index / 4), depth = index % 4;
        context.fillStyle = `rgba(${["235,246,255","153,255,199","0,220,255"][tone]},${[.8,.7,.92][tone] * (.2 + depth * .26)})`;
        context.fill(path);
      });
      context.save();
      context.fillStyle='rgba(255,255,255,.92)';
      context.shadowColor='rgba(255,255,255,.01)';context.shadowBlur=1;
      context.fill(brightRoads);context.restore();
      context.save();
      for(const dot of beamDots){
        const {r,g,b,strength}=dot.glow;
        context.fillStyle=`rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${strength*.9})`;
        context.beginPath();context.arc(dot.x,dot.y,dot.size*(1+strength*.25),0,Math.PI*2);context.fill();
      }
      context.restore();
      beamFootprints=[];
      // A softly blended spectrum across the surface, with a softly brightened
      // center. No angular hue sectors or radial spokes.
      context.save();
      context.beginPath();context.arc(cx,cy,radius,0,Math.PI*2);context.clip();
      if(surfaceHover && hover.current){
        context.save();
        context.translate(hover.current.x,hover.current.y);
        context.rotate(Math.atan2(-surfaceHover.y,surfaceHover.x));
        context.scale(Math.max(.025,surfaceHover.z),1);
        const haloRadius=radius*Math.sin(hoverAngle);
        const halo=context.createRadialGradient(0,0,0,0,0,haloRadius);
        halo.addColorStop(0,'rgba(205,220,255,.12)');
        halo.addColorStop(.2,'rgba(200,205,255,.08)');
        halo.addColorStop(.55,'rgba(130,200,255,.045)');
        halo.addColorStop(1,'rgba(130,200,255,0)');
        context.fillStyle=halo;
        context.beginPath();context.arc(0,0,haloRadius,0,Math.PI*2);context.fill();
        context.restore();
      }
      for(const dot of hoverDots){
        context.globalAlpha=dot.strength;
        const stampSize=32*dot.radius*(1+dot.strength*.6)/2.5;
        context.drawImage(hoverSprite(dot.hue,dot.core),dot.x-stampSize/2,dot.y-stampSize/2,stampSize,stampSize);
      }
      context.restore();
      // Fixed surface anchors; each light has its own clock, like the map glitter.
      for (let i = 0; i < points.length; i += 37) {
        const point = points[i], p = project(point, 1.003);
        if (p.z <= .05 || point.tone === 2) continue;
        const pulse = still ? .35 : Math.pow(Math.max(0, Math.sin(elapsed / (550 + i % 700) + i * 1.73)), 8);
        if (pulse < .08) continue;
        const size = (.7 + pulse * 2.6) * p.z;
        context.globalAlpha = pulse * p.z;
        context.fillStyle = i % 3 === 0 ? COLORS[i % COLORS.length] : '#fff';
        context.fillRect(p.x - size, p.y - .5, size * 2, 1);
        context.fillRect(p.x - .5, p.y - size, 1, size * 2);
      }
      context.globalAlpha = 1;
      if(vinePixels) drawVines(context,vineImage,vines.filter(vine=>vine.z>=0));
      context.font = `${Math.max(9, Math.min(12, radius / 25))}px monospace`;
      context.textAlign = 'center';
      for (const marker of halloween ? [] : MARKERS) {
        const p = project(marker.point,1.012);
        if (p.z < .12) continue;
        context.fillStyle = '#edfaff';
        context.beginPath(); context.moveTo(p.x,p.y-7); context.lineTo(p.x-4,p.y+1); context.lineTo(p.x+4,p.y+1); context.closePath(); context.fill();
        const tw = context.measureText(marker.name).width;
        context.fillStyle = 'rgba(0,0,0,.78)'; context.fillRect(p.x-tw/2-5,p.y+7,tw+10,17);
        context.fillStyle = '#edfaff'; context.fillText(marker.name,p.x,p.y+19);
      }
      context.font = `italic ${width < 600 ? 9 : 12}px monospace`;
      for (const river of halloween ? [] : RIVERS) {
        const p=project(placePoint(river),1.006);
        if (p.z<.25) continue;
        context.fillStyle='#8feeff';
        context.shadowColor='#000'; context.shadowBlur=4;
        context.fillText(river.name,p.x,p.y);
      }
      context.shadowBlur=0;
      // Eight slots include opening AND closing artwork; no replacement appears
      // until the old logo has finished retracting into its geographic anchor.
      const projected = venues.map(venue => ({ ...venue, anchor: project(venue.point) }));
      const states = hologramStates.current;
      const dt = Math.min(64,Math.max(0,elapsed-lastFrame.current));
      lastFrame.current=elapsed;
      if (venues.length) {
        for (const [key,state] of states) {
          const venue=projected.find(item=>item.phase===key);
          if (!venue) continue;
          if (!still && (venue.anchor.z<.18 || elapsed-state.openedAt>13000+(key%5)*700)) state.closing=true;
          if (!still) state.progress=Math.max(0,Math.min(1,state.progress+(state.closing?-1:1)*dt/2200));
          if (state.closing && state.progress===0) {
            states.delete(key);
            lastShown.current.set(key,elapsed);
            lastShownRow.current.set(venue.id,elapsed);
          }
        }
        const initialReveal = states.size===0 && lastShown.current.size===0;
        const candidates = projected.filter(venue=>venue.anchor.z>.3 && !states.has(venue.phase));
        const isWaypointCandidate=(venue: typeof projected[number])=>!venue.product && !FEATURED_LOGO_IDS.has(venue.id);
        const activeLogoKeys=()=>{
          const keys=new Set<string>();
          for(const [key,state] of states){
            const item=projected.find(venue=>venue.phase===key);
            if(!item)continue;
            keys.add(state.waypointLogo?`glyph:${state.waypointLogo}`:`asset:${item.logoKey}`);
          }
          return keys;
        };
        // Farthest-first picks keep the open set distributed over the visible
        // geography, while a cooldown gives other venues a turn.
        while (states.size<MAX_HOLOGRAMS && candidates.length && (initialReveal || still || elapsed>=nextOpen.current)) {
          const openLogoKeys=activeLogoKeys();
          const openRows=new Set([...states.keys()].map(key=>projected.find(venue=>venue.phase===key)?.id));
          const availableWaypoints=RANDOM_GLOBE_WAYPOINTS.filter(id=>!openLogoKeys.has(`glyph:${id}`));
          const eligible=candidates.filter(venue=>!openRows.has(venue.id) && (isWaypointCandidate(venue)
            ? availableWaypoints.length>0
            : !openLogoKeys.has(`asset:${venue.logoKey}`)));
          if(!eligible.length)break;
          let best=0, bestScore=-Infinity;
          eligible.forEach((venue,index)=>{
            const distance=states.size ? Math.min(...[...states.keys()].map(key=>{
              const other=projected.find(item=>item.phase===key);
              return other ? Math.hypot(venue.anchor.x-other.anchor.x,venue.anchor.y-other.anchor.y)/radius : 2;
            })) : venue.anchor.z;
            const recentlyShown=Math.max(lastShown.current.get(venue.phase)??-Infinity,lastShownRow.current.get(venue.id)??-Infinity);
            const cooldown=Number.isFinite(recentlyShown)?Math.max(0,1-(elapsed-recentlyShown)/30000)*2:0;
            const score=distance-cooldown;
            if(score>bestScore){best=index;bestScore=score;}
          });
          const venue=eligible[best];
          candidates.splice(candidates.indexOf(venue),1);
          const waypoint = isWaypointCandidate(venue);
          let waypointLogo: GlobeWaypointId | undefined;
          if(waypoint){
            const available=RANDOM_GLOBE_WAYPOINTS.filter(id=>!openLogoKeys.has(`glyph:${id}`));
            waypointLogo=venue.holiday || available[Math.floor(Math.random()*available.length)]||RANDOM_GLOBE_WAYPOINTS[0];
            const svg=globeWaypointSvg(waypointLogo,venue.color);
            if(svg){
              venue.waypointImage.onload=draw;
              venue.waypointImage.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
            }
          }
          states.set(venue.phase,{progress:initialReveal || still?1:0,openedAt:elapsed,closing:false,offsetX:0,offsetY:0,waypoint,waypointLogo});
          nextOpen.current=elapsed+250;
        }
      }
      const visible=projected.filter(venue=>states.has(venue.phase) && venue.anchor.z>0)
        .sort((a,b)=>a.phase-b.phase);
      const occupied: { x: number; y: number; w: number; h: number }[] = [];
      let renderedCount=0;
      for (const venue of visible) {
        const { anchor, image, color } = venue;
        const state=states.get(venue.phase)!;
        const opening=smooth(state.progress);
        if (opening<=0) continue;
        const visibility=opening*smooth(anchor.z/.18);
        const fullSize = Math.min(width < 600 ? 86 : 144, radius * .52) * .8;
        const fullFit = Math.min(fullSize/image.width,fullSize*.65/image.height);
        const fullW=state.waypoint?56:image.width*fullFit, fullH=state.waypoint?66:image.height*fullFit;
        const head = project(venue.point,1.06);
        // Side-facing anchors also use the pockets below the wordmark corners.
        // Protect the actual rotating words, leaving the empty ends of its row open.
        const side=Math.sign(head.x-cx);
        const sidePocket=smooth((Math.abs(head.x-cx)/radius-.3)/.4)
          * (1-smooth((Math.abs(head.y-cy)/radius-.4)/.35));
        const upperX=cx+(head.x-cx)*1.22,upperY=head.y-fullSize*.45-radius*.12;
        const preferred={x:upperX+(cx+side*radius*.94-upperX)*sidePocket,
          y:upperY+(cy+radius*.08-upperY)*sidePocket};
        let targetX=preferred.x,targetY=preferred.y,bestPlacement=Infinity;
        for (let attempt=0;attempt<320;attempt++) {
          const distance=Math.sqrt(attempt)*18, direction=attempt*2.399963;
          const x=Math.max(fullW/2+8,Math.min(width-fullW/2-8,preferred.x+Math.cos(direction)*distance));
          const y=Math.max(headerInset+fullH/2+8,Math.min(height-footerInset-fullH/2-8,preferred.y+Math.sin(direction)*distance));
          const overlap=textOverlap(x,y,fullW+12,fullH+12);
          if(overlap>.35)continue;
          if(occupied.some(other=>Math.abs(other.x-x)<(other.w+fullW)/2+10 && Math.abs(other.y-y)<(other.h+fullH)/2+10))continue;
          const score=Math.hypot(x-preferred.x,y-preferred.y)/radius+overlap*.7;
          if(score<bestPlacement){targetX=x;targetY=y;bestPlacement=score;}
        }
        const follow=still?1:1-Math.exp(-dt/550);
        state.offsetX+=(targetX-preferred.x-state.offsetX)*follow;
        state.offsetY+=(targetY-preferred.y-state.offsetY)*follow;
        occupied.push({x:preferred.x+state.offsetX,y:preferred.y+state.offsetY,w:fullW,h:fullH});
        // Size, opacity and lift share one eased curve, landing at the exact pin.
        const x=anchor.x+(preferred.x+state.offsetX-anchor.x)*opening;
        const y=anchor.y+(preferred.y+state.offsetY-anchor.y)*opening;
        const size=(state.waypoint?fullW:fullSize)*opening,w=fullW*opening,h=fullH*opening;
        beamFootprints.push({ax:anchor.x,ay:anchor.y,x,y,halfWidth:size*.38,strength:visibility,
          rgb:[1,3,5].map(start=>parseInt(color.slice(start,start+2),16))});
        renderedCount++;
        context.save();
        // Foreground text stays above the canvas; limited overlap remains natural.
        context.globalAlpha = visibility*.72;
        const beam = context.createLinearGradient(anchor.x,anchor.y,x,y);
        beam.addColorStop(0,`${color}08`); beam.addColorStop(1,`${color}65`);
        context.fillStyle = beam;
        context.beginPath(); context.moveTo(anchor.x,anchor.y); context.lineTo(x-size*.38,y); context.lineTo(x+size*.38,y); context.closePath(); context.fill();
        context.strokeStyle=color; context.lineWidth=.6;
        context.beginPath(); context.moveTo(anchor.x,anchor.y); context.lineTo(x,y); context.stroke();
        context.globalAlpha = visibility;
        context.imageSmoothingEnabled=true; context.imageSmoothingQuality="high";
        context.shadowBlur=0;
        if (state.waypoint) {
          if(venue.waypointImage.complete && venue.waypointImage.naturalWidth)
            context.drawImage(venue.waypointImage,x-w/2,y-h/2,w,h);        } else {
          // Only Camp gets a brief flicker; the other venue logos stay steady.
          if (venue.id==='28-0' && !still) context.globalAlpha*=.82+.18*Math.pow(Math.max(0,Math.sin(elapsed/390)),12);
          context.drawImage(image,x-w/2,y-h/2,w,h);
        }
        context.shadowBlur=0;
        const corner=5*opening, left=x-w/2-5,right=x+w/2+5,top=y-h/2-5,bottom=y+h/2+5;
        context.beginPath();
        for (const [xx, sx] of [[left,1],[right,-1]]) for (const [yy,sy] of [[top,1],[bottom,-1]]) {
          context.moveTo(xx,yy+sy*corner); context.lineTo(xx,yy); context.lineTo(xx+sx*corner,yy);
        }
        context.stroke(); context.restore();
      }
      canvas.dataset.openHolograms=String(renderedCount);
      canvas.dataset.hologramSlots=String(states.size);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1,2);
      canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
      context.setTransform(dpr,0,0,dpr,0,0); draw();
    };
    const animate = (now: number) => {
      if (now - previous >= 16) {
        if (previous) elapsed += Math.min(now-previous,64);
        previous = now; elapsedRef.current = elapsed;
        if(!still || hover.current || points.some(p=>(p.hoverGlow?.strength ?? 0)>.005))draw();
      }
      frame = requestAnimationFrame(animate);
    };
    if(halloween) {
      vineImage.onload=()=>{
        if(disposed)return;
        const sample=document.createElement("canvas");sample.width=vineImage.naturalWidth;sample.height=vineImage.naturalHeight;
        const ink=sample.getContext("2d",{willReadFrequently:true});
        if(ink){ink.drawImage(vineImage,0,0);vinePixels=ink.getImageData(0,0,sample.width,sample.height);draw();}
      };
      vineImage.src="/home-globe/ponies-vines.webp";
    }
    texture.onload = () => {
      if(halloween)return;
      if (disposed) return;
      const sample = document.createElement('canvas'); sample.width = sample.height = 1024;
      const ctx = sample.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(texture,0,0);
      const data = ctx.getImageData(0,0,1024,1024).data;
      points = [];
      for (let row = -88; row <= 88; row++) {
        const latitude = row/90;
        const v = equatorialLatitude(latitude,true);
        const columns = Math.max(8,Math.round(280*Math.cos(latitude*Math.PI/2)));
        for(let col = 0; col <= columns; col++) {
          const u = warp(col/columns*2-1,-.15,5,true);
          const px = Math.max(0,Math.min(1023,Math.round((u+1)*.5*1023)));
          const py = Math.max(0,Math.min(1023,Math.round((1-v)*.5*1023)));
          const pixel = (py*1024+px)*4;
          const builtUp = data[pixel] > 180;
          const river = data[pixel] < 100 && data[pixel+1] > 160 && data[pixel+2] > 160;
          // No uniform sphere grid: dots exist only on mapped urban land or water.
          if (builtUp || river) points.push({...sphere(u,v,river ? 2 : 0),
            // Magenta mask pixels encode highways, Hawthorne and Powell corridors.
            beamExcluded:builtUp && data[pixel+1]<100,brightRoad:builtUp && data[pixel+1]<100 && data[pixel+2]<100});
        }
      }
      draw();
    };
    if(!halloween) texture.src = '/home-globe/portland-city-beam-density.png';
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    syncAnimation.current=()=>{
      active=mode.current.active;still=mode.current.still;
      cancelAnimationFrame(frame);previous=0;draw();
      if(active)frame=requestAnimationFrame(animate);
    };
    if (active) frame = requestAnimationFrame(animate);
    redrawRef.current = () => { if(still || !active)draw(); };
    return () => { disposed = true; window.clearTimeout(atlasRetry); window.clearTimeout(fallbackTimer); cancelAnimationFrame(frame); observer.disconnect(); redrawRef.current = () => {}; syncAnimation.current=()=>{}; };
  }, [halloween]);
  useEffect(()=>{mode.current={active,still};syncAnimation.current();},[active,still]);

  return <> <canvas ref={canvasRef} className="home-front__metro-globe"
    role="img" aria-label={halloween ? "White-dot pumpkin globe with four evenly spaced faces, Halloween waypoints and growing Pink Ponies vines" : "Stylized globe made from the selected Portland city map: north Portland, downtown, the inner eastside and Sellwood, with the Willamette River"}
    onPointerDown={event=>{pointerDown.current={x:event.clientX,y:event.clientY};}}
    onPointerCancel={()=>{pointerDown.current=null;}}
    onPointerUp={event=>{
      const start=pointerDown.current;pointerDown.current=null;
      if(!start||Math.hypot(event.clientX-start.x,event.clientY-start.y)>8)return;
      const rect=event.currentTarget.getBoundingClientRect();
      if(vineHit.current(event.clientX-rect.left,event.clientY-rect.top)) onOpenPonies?.();
    }}
    onPointerMove={event => {
      if(event.pointerType==='touch')return;
      const rect=event.currentTarget.getBoundingClientRect();
      hover.current={x:event.clientX-rect.left,y:event.clientY-rect.top};
      redrawRef.current();
    }}
    onPointerLeave={() => { hover.current=null; redrawRef.current(); }}
  />{halloween && <button type="button" className="home-front__vine-link" onClick={onOpenPonies}>Open Pink Ponies present Little Shop of Ponies</button>}</>;
}
