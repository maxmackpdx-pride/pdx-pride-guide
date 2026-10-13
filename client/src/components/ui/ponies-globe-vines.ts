// Recovered from the approved mobile vine demo. Texture triangles curve around the globe.
type VineVertex = {x:number; y:number; z:number; u:number; v:number};
type VinePatch = {z:number; triangles: [VineVertex,VineVertex,VineVertex][]; stem?: [VineVertex,VineVertex]; stemWidth?: number};
const TU = [[0, 0, 768, 595], [880, 0, 656, 595], [0, 595, 768, 429], [880, 595, 656, 429]], kU = [[[0.36, 0.47], [0.62, 0.54], [0.38, 0.85], [0.58, 0.87]], [[0.4, 0.55], [0.61, 0.41], [0.8, 0.27], [0.35, 0.81], [0.47, 0.89]], [[0.38, 0.25], [0.32, 0.71]], [[0.2, 0.34], [0.78, 0.25], [0.82, 0.46], [0.69, 0.8]]];
// Twelve clusters replace thirty (60% fewer). Equal-area spherical spacing
// keeps the thinning even across both hemispheres and every rotation.
export const VINE_ANCHORS = Array.from({length:12},(_,i) => ({
  lon: i * Math.PI * (3-Math.sqrt(5)),
  lat: Math.asin(1-2*(i+.5)/12),
  turn: (i%4-1.5)*.45,
  crop: i%4,
}));

// Attach the continuous stem network to actual ink inside each artwork crop.
const ROOT_UV = [[.38,.43],[.65,.56],[.45,.62],[.48,.6]];
const ROOTS = VINE_ANCHORS.map(anchor => {
  const [, ,w,h] = TU[anchor.crop], [u,v] = ROOT_UV[anchor.crop];
  const localX=(u-.5)*1.04, localY=(.5-v)*1.04*h/w;
  const east=localX*Math.cos(anchor.turn)-localY*Math.sin(anchor.turn);
  const north=localX*Math.sin(anchor.turn)+localY*Math.cos(anchor.turn);
  const angle=Math.hypot(east,north), bend=angle ? Math.sin(angle)/angle : 1, normal=Math.cos(angle);
  return {x:Math.sin(anchor.lon)*Math.cos(anchor.lat)*normal+(Math.cos(anchor.lon)*east-Math.sin(anchor.lon)*Math.sin(anchor.lat)*north)*bend,
    y:Math.sin(anchor.lat)*normal+Math.cos(anchor.lat)*north*bend,
    z:Math.cos(anchor.lon)*Math.cos(anchor.lat)*normal+(-Math.sin(anchor.lon)*east-Math.cos(anchor.lon)*Math.sin(anchor.lat)*north)*bend};
});
// A shortest spherical spanning tree joins all twelve roots with eleven stems,
// avoiding a new dense web. This graph is shared by the worker and main thread.
export const VINE_CONNECTIONS: [number,number][] = [];
const joined = new Set([0]);
while (joined.size < ROOTS.length) {
  let shortest=Infinity, next: [number,number]=[0,0];
  for(const a of joined) for(let b=0;b<ROOTS.length;b++) {
    if(joined.has(b)) continue;
    const p=ROOTS[a], q=ROOTS[b], distance=1-(p.x*q.x+p.y*q.y+p.z*q.z);
    if(distance<shortest) { shortest=distance; next=[a,b]; }
  }
  VINE_CONNECTIONS.push(next); joined.add(next[1]);
}
const STEMS = VINE_CONNECTIONS.map(([a,b]) => {
  const p=ROOTS[a],q=ROOTS[b];
  const angle=Math.acos(Math.max(-1,Math.min(1,p.x*q.x+p.y*q.y+p.z*q.z)));
  return Array.from({length:33},(_,i)=>{
    const t=i/32, wa=Math.sin((1-t)*angle)/Math.sin(angle), wb=Math.sin(t*angle)/Math.sin(angle);
    return {x:p.x*wa+q.x*wb,y:p.y*wa+q.y*wb,z:p.z*wa+q.z*wb};
  });
});
const COLUMNS = 4, ROWS = 3;
// The surface shape, UVs and leaf masks never change. Build them once, sharing
// each vertex between adjacent triangles instead of rebuilding it every frame.
const SURFACE = VINE_ANCHORS.map(anchor => {
  const [cropX,cropY,cropWidth,cropHeight] = TU[anchor.crop];
  const width = 1.04, height = width * cropHeight / cropWidth;
  const cosTurn = Math.cos(anchor.turn), sinTurn = Math.sin(anchor.turn);
  const sinLon = Math.sin(anchor.lon), cosLon = Math.cos(anchor.lon);
  const sinLat = Math.sin(anchor.lat), cosLat = Math.cos(anchor.lat);
  const eastMotion = cosTurn - .55 * sinTurn, northMotion = sinTurn + .55 * cosTurn;
  const dx = cosLon * eastMotion - sinLon * sinLat * northMotion;
  const dy = cosLat * northMotion;
  const dz = -sinLon * eastMotion - cosLon * sinLat * northMotion;
  const vertices = [];
  for (let row = 0; row <= ROWS; row++) for (let col = 0; col <= COLUMNS; col++) {
    const u = col / COLUMNS, v = row / ROWS;
    const leaf = kU[anchor.crop].reduce((weight,[x,y]) => Math.max(weight,
      Math.exp(-(((u-x)/.17)**2) - ((v-y)/.18)**2)),0);
    const localX = (u-.5)*width, localY = (.5-v)*height;
    const east = localX*cosTurn-localY*sinTurn, north = localX*sinTurn+localY*cosTurn;
    const angle = Math.hypot(east,north), bend = angle ? Math.sin(angle)/angle : 1;
    const normal = Math.cos(angle);
    const x = sinLon*cosLat*normal+(cosLon*east-sinLon*sinLat*north)*bend;
    const y = sinLat*normal+cosLat*north*bend;
    const z = cosLon*cosLat*normal+(-sinLon*east-cosLon*sinLat*north)*bend;
    const alongNormal = x*dx+y*dy+z*dz;
    vertices.push({x,y,z,leaf,u:cropX+u*cropWidth,v:cropY+v*cropHeight,
      dx:(dx-x*alongNormal)*leaf,dy:(dy-y*alongNormal)*leaf,dz:(dz-z*alongNormal)*leaf});
  }
  return vertices;
});
const TRIANGLES: [number,number,number][] = [];
for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLUMNS; col++) {
  const a = row*(COLUMNS+1)+col, b = a+1, d = a+COLUMNS+1, c = d+1;
  TRIANGLES.push([a,b,c],[a,c,d]);
}

export function vineMesh(cx: number, cy: number, radius: number, elapsed: number, still: boolean, yaw = still ? 0 : elapsed / 42000) {
  const patches: VinePatch[] = [];
  const cos = Math.cos(yaw), sin = Math.sin(yaw), radiusSquared = radius*radius;
  for(const stem of STEMS) {
    const points=stem.map(p=>({x:cx+(p.x*cos+p.z*sin)*radius*1.002,y:cy-p.y*radius*1.002,z:p.z*cos-p.x*sin,u:0,v:0}));
    for(let i=1;i<points.length;i++) {
      const a=points[i-1],b=points[i];
      const segments: [VineVertex,VineVertex][] = [];
      if((a.z<0)===(b.z<0)) segments.push([a,b]);
      else {
        const t=a.z/(a.z-b.z), edge={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:0,u:0,v:0};
        segments.push([a,{...edge,z:a.z<0 ? -1e-9 : 1e-9}],[{...edge,z:b.z<0 ? -1e-9 : 1e-9},b]);
      }
      for(const segment of segments) patches.push({z:(segment[0].z+segment[1].z)/2,triangles:[],stem:segment,stemWidth:radius*.008});
    }
  }
  for (let cluster = 0; cluster < SURFACE.length; cluster++) {
    const breeze = still ? 0 : Math.sin(elapsed/1900+cluster*.91)*.006
      + Math.sin(elapsed/3300+cluster*1.7)*.002;
    const vertices = SURFACE[cluster].map(point => {
      const px = point.x+point.dx*breeze, py = point.y+point.dy*breeze, pz = point.z+point.dz*breeze;
      const length = Math.hypot(px,py,pz);
      const x = (px*cos+pz*sin)/length, y = py/length, z = (pz*cos-px*sin)/length;
      const elevation = 1.001+point.leaf*.07*(1-Math.abs(z))**8;
      return {x:cx+x*radius*elevation,y:cy-y*radius*elevation,z,u:point.u,v:point.v};
    });
    for (const indices of TRIANGLES) {
      const triangle = indices.map(index => vertices[index]);
      // The globe completely covers these rear triangles, including their leaves.
      if (triangle.every(p => p.z < 0 && (p.x-cx)**2+(p.y-cy)**2 <= radiusSquared)) continue;
      const minZ = Math.min(...triangle.map(p=>p.z)), maxZ = Math.max(...triangle.map(p=>p.z));
      const sides = minZ >= 0 || maxZ < 0 ? [triangle] : [IU(triangle,false),IU(triangle,true)];
      for (const side of sides) for (let i = 1; i < side.length-1; i++) {
        const part: [VineVertex,VineVertex,VineVertex] = [side[0],side[i],side[i+1]];
        if (part.every(p => p.z < 0 && (p.x-cx)**2+(p.y-cy)**2 <= radiusSquared)) continue;
        patches.push({z:(part[0].z+part[1].z+part[2].z)/3,triangles:[part]});
      }
    }
  }
  return patches.sort((a,b)=>a.z-b.z);
}

// The globe still draws at its normal cadence. Its slow-moving vine texture
// needs only 20 updates/second, then two cheap image composites per globe frame.
export function createVineLayer(image: HTMLImageElement) {
  const front = document.createElement('canvas'), back = document.createElement('canvas');
  const frontInk = front.getContext('2d')!, backInk = back.getContext('2d')!;
  let lastElapsed = -Infinity, lastYaw = NaN, lastStill = false, lastRadius = 0, lastRatio = 0;
  let frame = {front,back,size:0,mesh:[] as VinePatch[]};
  return (radius: number, elapsed: number, still: boolean, yaw: number, pixelRatio: number) => {
    const ratio = Math.min(pixelRatio,2), size = Math.ceil(radius*2.16);
    const resized = lastRadius !== radius || lastRatio !== ratio;
    if (resized) {
      front.width = back.width = Math.ceil(size*ratio);
      front.height = back.height = Math.ceil(size*ratio);
      frontInk.setTransform(ratio,0,0,ratio,0,0); backInk.setTransform(ratio,0,0,ratio,0,0);
    }
    if (resized || lastStill !== still || Math.abs(yaw-lastYaw) > .002
      || (!still && (elapsed-lastElapsed >= 50 || elapsed < lastElapsed))) {
      const mesh = vineMesh(size/2,size/2,radius,elapsed,still,yaw);
      frontInk.clearRect(0,0,size,size); backInk.clearRect(0,0,size,size);
      drawVines(backInk,image,mesh.filter(p=>p.z<0));
      drawVines(frontInk,image,mesh.filter(p=>p.z>=0));
      frame = {front,back,size,mesh};
      lastElapsed = elapsed; lastYaw = yaw; lastStill = still; lastRadius = radius; lastRatio = ratio;
    }
    return frame;
  };
}
function IU(e: VineVertex[], t: boolean) {
  let a: VineVertex[] = [];
  for (let l = 0; l < e.length; l++) {
    let d = e[l], s = e[(l + 1) % e.length], y = t ? d.z >= 0 : d.z < 0, H = t ? s.z >= 0 : s.z < 0;
    if (y && a.push(d), y !== H) {
      let E = d.z / (d.z - s.z);
      a.push({ x: d.x + (s.x - d.x) * E, y: d.y + (s.y - d.y) * E, z: t ? 1e-9 : -1e-9, u: d.u + (s.u - d.u) * E, v: d.v + (s.v - d.v) * E });
    }
  }
  return a;
}
export function drawVines(e: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, t: HTMLImageElement | ImageBitmap, a: VinePatch[]) {
  const imageWidth = 'naturalWidth' in t ? t.naturalWidth : t.width;
  const imageHeight = 'naturalHeight' in t ? t.naturalHeight : t.height;
  // Stems sit beneath the leaf artwork and split at the limb just like the UV mesh.
  for(const patch of a) if(patch.stem) {
    const [p,q]=patch.stem, width=patch.stemWidth ?? 2;
    e.save(); e.lineCap='round'; e.beginPath(); e.moveTo(p.x,p.y); e.lineTo(q.x,q.y);
    e.strokeStyle='#020503'; e.lineWidth=width*1.6; e.stroke();
    e.strokeStyle='#086626'; e.lineWidth=width; e.stroke();
    e.strokeStyle='#ef1684'; e.lineWidth=width*.28; e.stroke(); e.restore();
  }
  for (let l of a) for (let [d, s, y] of l.triangles) {
    let H = s.u - d.u, E = s.v - d.v, j = y.u - d.u, z = y.v - d.v, K = H * z - j * E;
    if (Math.abs(K) < 1e-3) continue;
    let J = ((s.x - d.x) * z - (y.x - d.x) * E) / K, ae = ((y.x - d.x) * H - (s.x - d.x) * j) / K, de = ((s.y - d.y) * z - (y.y - d.y) * E) / K, pe = ((y.y - d.y) * H - (s.y - d.y) * j) / K, be = (d.x + s.x + y.x) / 3, $ = (d.y + s.y + y.y) / 3, Z = (mt: VineVertex) => {
      let ft = Math.hypot(mt.x - be, mt.y - $) || 1;
      return { x: mt.x + (mt.x - be) / ft * 0.35, y: mt.y + (mt.y - $) / ft * 0.35 };
    }, fe = Z(d), Be = Z(s), je = Z(y);
    e.save(), e.beginPath(), e.moveTo(fe.x, fe.y), e.lineTo(Be.x, Be.y), e.lineTo(je.x, je.y), e.closePath(), e.clip(), e.transform(J, de, ae, pe, d.x - J * d.u - ae * d.v, d.y - de * d.u - pe * d.v);
    let Je = Math.max(0, Math.floor(Math.min(d.u, s.u, y.u)) - 2), Ee = Math.max(0, Math.floor(Math.min(d.v, s.v, y.v)) - 2), He = Math.min(imageWidth - Je, Math.ceil(Math.max(d.u, s.u, y.u)) - Je + 2), et = Math.min(imageHeight - Ee, Math.ceil(Math.max(d.v, s.v, y.v)) - Ee + 2);
    e.drawImage(t, Je, Ee, He, et, Je, Ee, He, et), e.restore();
  }
}
export function hitVines(e: number, t: number, a: VinePatch[], l: ImageData, d: number, s: number, y: number) {
  for(const patch of a) if(patch.stem && !(patch.z<0 && Math.hypot(e-d,t-s)<y)) {
    const [p,q]=patch.stem, dx=q.x-p.x,dy=q.y-p.y, length=dx*dx+dy*dy;
    const along=length ? Math.max(0,Math.min(1,((e-p.x)*dx+(t-p.y)*dy)/length)) : 0;
    if(Math.hypot(e-p.x-along*dx,t-p.y-along*dy)<Math.max(3,patch.stemWidth ?? 2)) return true;
  }
  for (let H of a) if (!(H.z < 0 && Math.hypot(e - d, t - s) < y)) for (let [E, j, z] of H.triangles) {
    let K = (j.y - z.y) * (E.x - z.x) + (z.x - j.x) * (E.y - z.y);
    if (Math.abs(K) < 1e-3) continue;
    let J = ((j.y - z.y) * (e - z.x) + (z.x - j.x) * (t - z.y)) / K, ae = ((z.y - E.y) * (e - z.x) + (E.x - z.x) * (t - z.y)) / K, de = 1 - J - ae;
    if (J < 0 || ae < 0 || de < 0) continue;
    let pe = Math.floor(E.u * J + j.u * ae + z.u * de), be = Math.floor(E.v * J + j.v * ae + z.v * de);
    if (pe >= 0 && be >= 0 && pe < l.width && be < l.height && l.data[(be * l.width + pe) * 4 + 3] > 100) return true;
  }
  return false;
}
