import { useEffect, useRef } from "react";

// A deliberately enlarged metro wrapped over a sphere, not an Earth-scale globe.
// Built-up land-use and water mask: OpenFreeMap / OpenMapTiles / OSM,
// z10 tiles x161–164, y364–367. Unmapped/rural/park areas stay empty.
declare const __ZAYDAR_BASE__: string;
const COLORS = ["#00ffff", "#ff00cc", "#ccff00", "#ff6600", "#ab75ff"];
type Venue = { id: string; name: string; coordinates: [number, number]; logo?: string; logoMode?: string };
// Beaverton / northwest Portland through Gresham; southern Vancouver to Oregon City.
const METRO = { west: -122.88, east: -122.39, north: 45.65, south: 45.34 };
const tileX = (lon: number) => (lon + 180) / 360 * 1024;
const tileY = (lat: number) => (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 1024;
const CENTER = [(tileX(METRO.west)+tileX(METRO.east))/2, (tileY(METRO.north)+tileY(METRO.south))/2];
const SPAN = [(tileX(METRO.east)-tileX(METRO.west))/2, (tileY(METRO.south)-tileY(METRO.north))/2];
const PLACES = [
  { name: "Portland", lat: 45.523, lon: -122.676 },
  { name: "Vancouver", lat: 45.6387, lon: -122.6615 },
  { name: "Gresham", lat: 45.5001, lon: -122.4302 },
  { name: "Oregon City", lat: 45.3573, lon: -122.6068 },
  { name: "Beaverton", lat: 45.4871, lon: -122.8037 },
];
type Point = { x: number; y: number; z: number; tone: number };
function sphere(u: number, v: number, tone = 0): Point {
  const longitude = u * Math.PI, latitude = v * Math.PI / 2;
  return { x: Math.sin(longitude) * Math.cos(latitude), y: Math.sin(latitude), z: Math.cos(longitude) * Math.cos(latitude), tone };
}
function placePoint(place: { lat: number; lon: number }) {
  const x = (place.lon + 180) / 360 * 1024;
  const y = (1 - Math.asinh(Math.tan(place.lat * Math.PI / 180)) / Math.PI) / 2 * 1024;
  return sphere((x - CENTER[0]) / SPAN[0], (CENTER[1] - y) / SPAN[1]);
}
const RIVERS = [
  { name: "Columbia River", lat: 45.604, lon: -122.583 },
  { name: "Willamette River", lat: 45.552, lon: -122.688 },
];
const MARKERS = PLACES.map(place => ({ ...place, point: placePoint(place) }));

export function PortlandMetroGlobe({ active, still }: { active: boolean; still: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angle = useRef(0);
  const elapsedRef = useRef(0);
  const redrawRef = useRef(() => {});
  const pointer = useRef<{ id: number; x: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let disposed = false, frame = 0, previous = 0, elapsed = elapsedRef.current;
    let width = 0, height = 0;
    let points: Point[] = [];
    const abort = new AbortController();
    const venues: { point: Point; image: HTMLCanvasElement; color: string; phase: number }[] = [];
    void Promise.all([import(/* @vite-ignore */ `${__ZAYDAR_BASE__}/logo-mask.js`), fetch(`${__ZAYDAR_BASE__}/waypoints.json`, { signal: abort.signal }).then(r => { if (!r.ok) throw new Error('Venue artwork unavailable'); return r.json() as Promise<Venue[]>; })]).then(([{ logoCoverage }, rows]) => {
      for (const [index, venue] of rows.entries()) {
        if (!venue.logo || !Array.isArray(venue.coordinates)) continue;
        const [lon, lat] = venue.coordinates;
        if (lon < METRO.west || lon > METRO.east || lat < METRO.south || lat > METRO.north) continue;
        const image = new Image();
        const hologram = { point: placePoint({ lat, lon }), image: document.createElement("canvas"), color: COLORS[index % COLORS.length], phase: index * 2.39996 };
        image.onload = () => {
          if (disposed) return;
          const ink = hologram.image;
          const sampling = Math.max(image.naturalWidth,image.naturalHeight) < 256 ? 4 : 1;
          ink.width = image.naturalWidth * sampling; ink.height = image.naturalHeight * sampling;
          const painter = ink.getContext('2d'); if (!painter) return;
          painter.imageSmoothingQuality = "high";
          painter.drawImage(image,0,0,ink.width,ink.height);
          const artwork = painter.getImageData(0,0,ink.width,ink.height), pixels = artwork.data;
          for (let i=0;i<pixels.length;i+=4) {
            const coverage = logoCoverage(pixels[i],pixels[i+1],pixels[i+2],pixels[i+3],venue.logoMode);
            const tone = venue.logoMode === 'grayscale' ? Math.round(.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2]) : 255;
            pixels[i]=pixels[i+1]=pixels[i+2]=tone; pixels[i+3]=Math.round(coverage*255);
          }
          painter.putImageData(artwork,0,0);
          // Fit actual ink, not transparent source padding, and cache a crisp
          // black keyline so the white artwork stays readable over map dots.
          let left=ink.width, top=ink.height, right=-1, bottom=-1;
          for (let y=0;y<ink.height;y++) for (let x=0;x<ink.width;x++) {
            if (pixels[(y*ink.width+x)*4+3] <= 32) continue;
            left=Math.min(left,x); right=Math.max(right,x);
            top=Math.min(top,y); bottom=Math.max(bottom,y);
          }
          if (right < left || bottom < top) return;
          const w=right-left+1, h=bottom-top+1;
          const edge=Math.max(2,Math.ceil(Math.max(w,h)/100));
          const clean=document.createElement('canvas');
          clean.width=w+edge*2; clean.height=h+edge*2;
          const ctx=clean.getContext('2d'); if (!ctx) return;
          for (let i=0;i<8;i++) {
            const theta=i*Math.PI/4;
            ctx.drawImage(ink,left,top,w,h,edge+Math.cos(theta)*edge,edge+Math.sin(theta)*edge,w,h);
          }
          ctx.globalCompositeOperation='source-in'; ctx.fillStyle='#000';
          ctx.fillRect(0,0,clean.width,clean.height);
          ctx.globalCompositeOperation='source-over';
          ctx.drawImage(ink,left,top,w,h,edge,edge,w,h);
          hologram.image=clean;
          venues.push(hologram); draw();
        };
        image.src = `${__ZAYDAR_BASE__}/${venue.logo.replace(/^\.\//, '')}`;
      }
    }).catch(() => { /* Geography remains available if venue artwork cannot load. */ });
    const texture = new Image();
    const draw = () => {
      if (!width || !height) return;
      const radius = Math.min(width * .48, height * .43) * .7;
      const cx = width / 2, cy = height / 2;
      const front = canvas.closest('.home-front');
      const headerInset = front ? parseFloat(getComputedStyle(front).getPropertyValue('--home-header-height')) || 0 : 0;
      const footerInset = canvas.parentElement ? parseFloat(getComputedStyle(canvas.parentElement).getPropertyValue('--home-flight-bottom')) || 0 : 0;
      const yaw = angle.current + (still ? 0 : elapsed / 28000);
      const project = (p: Point, elevation = 1) => {
        const x = p.x * Math.cos(yaw) + p.z * Math.sin(yaw);
        const z = p.z * Math.cos(yaw) - p.x * Math.sin(yaw);
        return { x: cx + x * radius * elevation, y: cy - p.y * radius * elevation, z };
      };
      context.clearRect(0, 0, width, height);
      // Black negative space between the populated areas and waterways.
      context.fillStyle = '#000';
      context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();
      // Batch dot paths by depth and land class instead of issuing 15k fills.
      const batches = Array.from({ length: 12 }, () => new Path2D());
      for (const p of points) {
        const q = project(p);
        if (q.z <= 0) continue;
        const depth = Math.min(3, Math.floor(q.z * 4));
        const size = Math.max(.35, radius / 195 * Math.sqrt(q.z));
        const path = batches[p.tone * 4 + depth];
        path.moveTo(q.x + size, q.y); path.arc(q.x, q.y, size, 0, Math.PI * 2);
      }
      batches.forEach((path, index) => {
        const tone = Math.floor(index / 4), depth = index % 4;
        context.fillStyle = `rgba(${["235,246,255","153,255,199","0,220,255"][tone]},${[.8,.7,.92][tone] * (.2 + depth * .26)})`;
        context.fill(path);
      });
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
      // Keep holograms fully expanded; only the sphere occludes the far side.
      // Each head lifts from its actual surface position, without a separate orbit.
      const visible = venues.map(venue => ({ ...venue, anchor: project(venue.point) }))
        .filter(venue => venue.anchor.z > .08)
        .sort((a,b) => a.phase - b.phase);
      const occupied: { x: number; y: number; w: number; h: number }[] = [];
      for (const venue of visible) {
        const { anchor, image, color } = venue;
        const size = Math.min(width < 600 ? 86 : 144, radius * .52);
        const fit = Math.min(size/image.width,size*.65/image.height);
        const w=image.width*fit,h=image.height*fit;
        const head = project(venue.point, 1.16);
        const preferred = { x:head.x, y:head.y-size*.8-radius*.055 };
        let x=preferred.x, y=preferred.y;
        // Move overlapping heads, rather than closing/collapsing holograms.
        // Every beam still terminates at its original geographic anchor.
        for (let attempt=0;attempt<240;attempt++) {
          const distance=Math.sqrt(attempt)*18;
          const direction=attempt*2.399963;
          const candidateX=Math.max(w/2+8,Math.min(width-w/2-8,preferred.x+Math.cos(direction)*distance));
          const candidateY=Math.max(headerInset+h/2+8,Math.min(height-footerInset-h/2-8,preferred.y+Math.sin(direction)*distance));
          if (occupied.some(other => Math.abs(other.x-candidateX)<(other.w+w)/2+12 && Math.abs(other.y-candidateY)<(other.h+h)/2+12)) continue;
          x=candidateX; y=candidateY; break;
        }
        occupied.push({x,y,w,h});
        context.save(); context.globalAlpha = .72;
        const beam = context.createLinearGradient(anchor.x,anchor.y,x,y);
        beam.addColorStop(0,`${color}08`); beam.addColorStop(1,`${color}65`);
        context.fillStyle = beam;
        context.beginPath(); context.moveTo(anchor.x,anchor.y); context.lineTo(x-size*.38,y); context.lineTo(x+size*.38,y); context.closePath(); context.fill();
        context.strokeStyle=color; context.lineWidth=.6;
        context.beginPath(); context.moveTo(anchor.x,anchor.y); context.lineTo(x,y); context.stroke();
        context.globalAlpha = 1;
        context.imageSmoothingEnabled=true; context.imageSmoothingQuality="high";
        context.shadowBlur=0;
        context.drawImage(image,x-w/2,y-h/2,w,h);
        context.shadowBlur=0;
        const corner=5, left=x-w/2-5,right=x+w/2+5,top=y-h/2-5,bottom=y+h/2+5;
        context.beginPath();
        for (const [xx, sx] of [[left,1],[right,-1]]) for (const [yy,sy] of [[top,1],[bottom,-1]]) {
          context.moveTo(xx,yy+sy*corner); context.lineTo(xx,yy); context.lineTo(xx+sx*corner,yy);
        }
        context.stroke(); context.restore();
      }
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1,2);
      canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
      context.setTransform(dpr,0,0,dpr,0,0); draw();
    };
    const animate = (now: number) => {
      if (now - previous >= 32) {
        if (previous && !pointer.current) elapsed += Math.min(now-previous,64);
        previous = now; elapsedRef.current = elapsed; draw();
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
        const v = row/90;
        const columns = Math.max(8,Math.round(280*Math.cos(v*Math.PI/2)));
        for(let col = 0; col <= columns; col++) {
          const u = col/columns*2-1;
          const px = Math.round((CENTER[0]-161+u*SPAN[0])*256);
          const py = Math.round((CENTER[1]-364-v*SPAN[1])*256);
          const pixel = (py*1024+px)*4;
          const builtUp = data[pixel] > 180;
          const river = data[pixel] < 100 && data[pixel+1] > 160 && data[pixel+2] > 160;
          // No uniform sphere grid: dots exist only on mapped urban land or water.
          if (builtUp || river) points.push(sphere(u,v,river ? 2 : 0));
        }
      }
      draw();
    };
    texture.src = '/home-globe/portland-density.png';
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    if (active && !still) frame = requestAnimationFrame(animate);
    redrawRef.current = draw;
    return () => { disposed = true; abort.abort(); cancelAnimationFrame(frame); observer.disconnect(); redrawRef.current = () => {}; };
  }, [active, still]);

  return <canvas ref={canvasRef} className="home-front__metro-globe"
    role="img" aria-label="Stylized Portland metro globe with the Columbia and Willamette rivers and the metro cities southern Vancouver, Gresham, Oregon City, Beaverton and northwest Portland"
    onPointerDown={event => { if(event.pointerType === 'touch') return; pointer.current = {id:event.pointerId,x:event.clientX}; event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerMove={event => { const drag = pointer.current; if (!drag || drag.id !== event.pointerId) return; angle.current = angle.current+(event.clientX-drag.x)/350; drag.x=event.clientX; redrawRef.current(); }}
    onPointerUp={() => { pointer.current=null; }} onPointerCancel={() => { pointer.current=null; }} onLostPointerCapture={() => { pointer.current=null; }}
  />;
}
