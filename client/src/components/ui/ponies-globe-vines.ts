// Recovered from the approved mobile vine demo. Texture triangles curve around the globe.
type VineVertex = {x:number; y:number; z:number; u:number; v:number};
type VinePatch = {z:number; triangles: [VineVertex,VineVertex,VineVertex][]};
const TU = [[0, 0, 768, 595], [880, 0, 656, 595], [0, 595, 768, 429], [880, 595, 656, 429]], kU = [[[0.36, 0.47], [0.62, 0.54], [0.38, 0.85], [0.58, 0.87]], [[0.4, 0.55], [0.61, 0.41], [0.8, 0.27], [0.35, 0.81], [0.47, 0.89]], [[0.38, 0.25], [0.32, 0.71]], [[0.2, 0.34], [0.78, 0.25], [0.82, 0.46], [0.69, 0.8]]];
// Keep the original ten anchors, then fill the largest spherical gaps.
export const VINE_ANCHORS = [
  {"lon": 0, "lat": -0.58, "turn": -0.45, "crop": 0},
  {"lon": 0.62831853, "lat": 0.48, "turn": 0.55, "crop": 1},
  {"lon": 1.25663706, "lat": -0.12, "turn": -0.2, "crop": 3},
  {"lon": 1.88495559, "lat": 0.66, "turn": 0.7, "crop": 2},
  {"lon": 2.51327412, "lat": -0.52, "turn": -0.4, "crop": 0},
  {"lon": 3.14159265, "lat": 0.12, "turn": 0.4, "crop": 1},
  {"lon": 3.76991118, "lat": -0.65, "turn": -0.6, "crop": 3},
  {"lon": 4.39822972, "lat": 0.5, "turn": 0.3, "crop": 2},
  {"lon": 5.02654825, "lat": -0.18, "turn": -0.65, "crop": 0},
  {"lon": 5.65486678, "lat": 0.64, "turn": 0.45, "crop": 1},
  {"lon": 1.323634, "lat": -1.449692, "turn": -1.3, "crop": 2},
  {"lon": 3.666818, "lat": 1.414387, "turn": -0.47, "crop": 3},
  {"lon": 5.136257, "lat": -0.922913, "turn": 0.36, "crop": 1},
  {"lon": 6.18386, "lat": 0.143559, "turn": 1.19, "crop": 0},
  {"lon": 1.938428, "lat": -0.077715, "turn": -0.58, "crop": 2},
  {"lon": 0.934458, "lat": -0.78047, "turn": 0.25, "crop": 3},
  {"lon": 2.78914, "lat": 0.78875, "turn": 1.08, "crop": 1},
  {"lon": 3.886069, "lat": 0.036629, "turn": -0.69, "crop": 0},
  {"lon": 0.557342, "lat": -0.188119, "turn": 0.14, "crop": 2},
  {"lon": 0.235918, "lat": 1.05842, "turn": 0.97, "crop": 3},
  {"lon": 3.591612, "lat": 0.626639, "turn": -0.8, "crop": 1},
  {"lon": 5.675845, "lat": -0.287641, "turn": 0.03, "crop": 0},
  {"lon": 2.517042, "lat": 0.15541, "turn": 0.86, "crop": 2},
  {"lon": 1.800076, "lat": -0.711317, "turn": -0.91, "crop": 3},
  {"lon": 4.408991, "lat": -0.276457, "turn": -0.08, "crop": 1},
  {"lon": 3.003785, "lat": -0.992513, "turn": 0.75, "crop": 0},
  {"lon": 4.953185, "lat": 0.990729, "turn": -1.02, "crop": 2},
  {"lon": 5.011725, "lat": 0.427449, "turn": -0.19, "crop": 3},
  {"lon": 1.172135, "lat": 0.81544, "turn": 0.64, "crop": 1},
  {"lon": 3.16165, "lat": -0.414609, "turn": -1.13, "crop": 0},
];
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
