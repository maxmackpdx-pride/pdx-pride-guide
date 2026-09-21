import { useEffect, useRef } from "react";

// A deliberately enlarged metro wrapped over a sphere, not an Earth-scale globe.
// Built-up land-use and water mask: OpenFreeMap / OpenMapTiles / OSM,
// z13 geography cropped to the screenshot bounds below; parks stay empty.
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
type HologramState = { progress: number; openedAt: number; closing: boolean; offsetX: number; offsetY: number };
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
const INITIAL_YAW = -warp((tileX(START_LOCATION.lon)-CENTER[0])/SPAN[0],-.15,5)*Math.PI;
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


export function PortlandMetroGlobe({ active, still }: { active: boolean; still: boolean }) {
  const mode=useRef({active,still});
  const syncAnimation=useRef(()=>{});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angle = useRef(0);
  const elapsedRef = useRef(0);
  const redrawRef = useRef(() => {});
  const hologramStates = useRef(new Map<number,HologramState>());
  const lastShown = useRef(new Map<number,number>());
  const lastFrame = useRef(0);
  const nextOpen = useRef(0);
  const hover = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let {active,still}=mode.current;
    let disposed = false, frame = 0, previous = 0, elapsed = elapsedRef.current;
    let width = 0, height = 0;
    let points: Point[] = [];
    let lastHoverFrame=performance.now();
    // Previous frame footprints keep the dot pass beneath beams and artwork.
    let beamFootprints: { ax:number; ay:number; x:number; y:number; halfWidth:number; strength:number; rgb:number[] }[] = [];
    const abort = new AbortController();
    const venues: { point: Point; image: HTMLCanvasElement; color: string; phase: number }[] = [];
    type AtlasEntry = {id:string; coordinates:[number,number];color:string;phase:number;product:boolean;x:number;y:number;w:number;h:number};
    const atlas=new Image();atlas.decoding="async";
    atlas.src='/home-globe/holograms.webp';
    void Promise.all([atlas.decode(),fetch('/home-globe/holograms.json',{signal:abort.signal}).then(r=>{
      if(!r.ok)throw new Error('Hologram atlas unavailable');return r.json() as Promise<AtlasEntry[]>;
    })]).then(([,rows])=>{
      if(disposed)return;
      for(const row of rows){
        const image=document.createElement('canvas');image.width=row.w;image.height=row.h;
        image.getContext('2d')?.drawImage(atlas,row.x,row.y,row.w,row.h,0,0,row.w,row.h);
        const [lon,lat]=row.coordinates;
        const point=row.product?PRODUCT_WAYPOINTS.find(p=>p.id===row.id)?.point:placePoint({lat,lon});
        if(point)venues.push({point,image,color:row.color,phase:row.phase});
      }
      draw();
    }).catch(()=>{ /* The globe remains visible if the optional artwork fails. */ });
    const texture = new Image();
    const draw = () => {
      if (!width || !height) return;
      const radius = Math.min(width * .48, height * .43) * .7 * 1.15;
      const cx = width / 2, cy = height / 2;
      const front = canvas.closest('.home-front');
      const headerInset = front ? parseFloat(getComputedStyle(front).getPropertyValue('--home-header-height')) || 0 : 0;
      const footerInset = canvas.parentElement ? parseFloat(getComputedStyle(canvas.parentElement).getPropertyValue('--home-flight-bottom')) || 0 : 0;
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
      const tangentLength=surfaceHover?Math.hypot(surfaceHover.x,surfaceHover.z):1;
      const beamDots: {x:number;y:number;size:number;glow:NonNullable<Point["glow"]>}[]=[];
      const hoverNow=performance.now(),hoverDt=Math.min(64,Math.max(0,hoverNow-lastHoverFrame));
      lastHoverFrame=hoverNow;
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
          const distance=Math.acos(Math.max(-1,Math.min(1,cosine)))/hoverAngle;
          if(distance<1){
            const east=(nx*surfaceHover.z-q.z*surfaceHover.x)/Math.max(.001,tangentLength);
            const north=(-nx*surfaceHover.y*surfaceHover.x+ny*tangentLength*tangentLength-q.z*surfaceHover.y*surfaceHover.z)/Math.max(.001,tangentLength);
            const across=(east*hoverCos+north*hoverSin)/Math.sin(hoverAngle);
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
          effect.strength+=(held-effect.strength)*(1-Math.exp(-hoverDt/(held>effect.strength?110:650)));
          effect.lift+=((still?0:hoverTarget)-effect.lift)*(1-Math.exp(-hoverDt/180));
          q=project(p,1+effect.lift*2/radius);
          q.y-=effect.lift*1.2;
          if(effect.strength>.005)hoverDots.push({x:q.x,y:q.y,radius:size,strength:effect.strength,hue:effect.hue,core:effect.core});
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
        context.fillStyle=`hsl(${dot.hue} ${90-dot.core*20}% ${65+dot.core*13}%)`;
        context.shadowColor=`hsl(${dot.hue} 95% ${65+dot.core*10}%)`;
        context.shadowBlur=2.8+dot.core*9.1;
        context.beginPath();context.arc(dot.x,dot.y,dot.radius*(1+dot.strength*.6),0,Math.PI*2);context.fill();
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
      context.font = `${Math.max(9, Math.min(12, radius / 25))}px monospace`;
      context.textAlign = 'center';
      for (const marker of MARKERS) {
        const p = project(marker.point,1.012);
        if (p.z < .12) continue;
        context.fillStyle = '#edfaff';
        context.beginPath(); context.moveTo(p.x,p.y-7); context.lineTo(p.x-4,p.y+1); context.lineTo(p.x+4,p.y+1); context.closePath(); context.fill();
        const tw = context.measureText(marker.name).width;
        context.fillStyle = 'rgba(0,0,0,.78)'; context.fillRect(p.x-tw/2-5,p.y+7,tw+10,17);
        context.fillStyle = '#edfaff'; context.fillText(marker.name,p.x,p.y+19);
      }
      context.font = `italic ${width < 600 ? 9 : 12}px monospace`;
      for (const river of RIVERS) {
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
          if (state.closing && state.progress===0) { states.delete(key); lastShown.current.set(key,elapsed); }
        }
        const candidates = projected.filter(venue=>venue.anchor.z>.3 && !states.has(venue.phase));
        // Farthest-first picks keep the open set distributed over the visible
        // geography, while a cooldown gives other venues a turn.
        while (states.size<MAX_HOLOGRAMS && candidates.length && (still || elapsed>=nextOpen.current)) {
          let best=0, bestScore=-Infinity;
          candidates.forEach((venue,index)=>{
            const distance=states.size ? Math.min(...[...states.keys()].map(key=>{
              const other=projected.find(item=>item.phase===key);
              return other ? Math.hypot(venue.anchor.x-other.anchor.x,venue.anchor.y-other.anchor.y)/radius : 2;
            })) : venue.anchor.z;
            const recentlyShown=lastShown.current.get(venue.phase);
            const cooldown=recentlyShown===undefined?0:Math.max(0,1-(elapsed-recentlyShown)/30000)*2;
            const score=distance-cooldown;
            if(score>bestScore){best=index;bestScore=score;}
          });
          const venue=candidates.splice(best,1)[0];
          states.set(venue.phase,{progress:still?1:0,openedAt:elapsed,closing:false,offsetX:0,offsetY:0});
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
        const fullW=image.width*fullFit, fullH=image.height*fullFit;
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
        const size=fullSize*opening,w=fullW*opening,h=fullH*opening;
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
        context.drawImage(image,x-w/2,y-h/2,w,h);
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
    texture.onload = () => {
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
    texture.src = '/home-globe/portland-city-beam-density.png';
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    syncAnimation.current=()=>{
      active=mode.current.active;still=mode.current.still;
      cancelAnimationFrame(frame);previous=0;draw();
      if(active)frame=requestAnimationFrame(animate);
    };
    if (active) frame = requestAnimationFrame(animate);
    redrawRef.current = () => { if(still || !active)draw(); };
    return () => { disposed = true; abort.abort(); cancelAnimationFrame(frame); observer.disconnect(); redrawRef.current = () => {}; syncAnimation.current=()=>{}; };
  }, []);
  useEffect(()=>{mode.current={active,still};syncAnimation.current();},[active,still]);

  return <canvas ref={canvasRef} className="home-front__metro-globe"
    role="img" aria-label="Stylized globe made from the selected Portland city map: north Portland, downtown, the inner eastside and Sellwood, with the Willamette River"
    onPointerMove={event => {
      if(event.pointerType==='touch')return;
      const rect=event.currentTarget.getBoundingClientRect();
      hover.current={x:event.clientX-rect.left,y:event.clientY-rect.top};
      redrawRef.current();
    }}
    onPointerLeave={() => { hover.current=null; redrawRef.current(); }}
  />;
}
