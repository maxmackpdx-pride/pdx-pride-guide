// Recovered from the approved mobile vine demo. Texture triangles curve around the globe.
type VineVertex = {x:number; y:number; z:number; u:number; v:number};
type VinePatch = {z:number; growth:number; triangles: [VineVertex,VineVertex,VineVertex][]};
const TU = [[0, 0, 768, 595], [880, 0, 656, 595], [0, 595, 768, 429], [880, 595, 656, 429]], kU = [[[0.36, 0.47], [0.62, 0.54], [0.38, 0.85], [0.58, 0.87]], [[0.4, 0.55], [0.61, 0.41], [0.8, 0.27], [0.35, 0.81], [0.47, 0.89]], [[0.38, 0.25], [0.32, 0.71]], [[0.2, 0.34], [0.78, 0.25], [0.82, 0.46], [0.69, 0.8]]], FU = [{lon: 0.0, lat: -0.22, turn: -0.3, crop: 0}, {lon: 0.6283185307, lat: 0.22, turn: 0.3, crop: 1}, {lon: 1.2566370614, lat: -0.22, turn: -0.3, crop: 3}, {lon: 1.8849555921, lat: 0.22, turn: 0.3, crop: 2}, {lon: 2.5132741228, lat: -0.22, turn: -0.3, crop: 0}, {lon: 3.1415926535, lat: 0.22, turn: 0.3, crop: 1}, {lon: 3.7699111842, lat: -0.22, turn: -0.3, crop: 3}, {lon: 4.3982297149, lat: 0.22, turn: 0.3, crop: 2}, {lon: 5.0265482456, lat: -0.22, turn: -0.3, crop: 0}, {lon: 5.6548667763, lat: 0.22, turn: 0.3, crop: 1}], DU = (e: number) => e * e * (3 - 2 * e);
export function vineMesh(e: number, t: number, a: number, l: number, d: boolean, s = d ? 0 : l / 42e3) {
  let y: VinePatch[] = [];
  for (let [H, E] of FU.entries()) {
    let j = d ? 1 : DU(Math.max(0, Math.min(1, (l - H * 650) / 6500)));
    if (j === 0) continue;
    // Stems hug the sphere. Only leaf masks at the silhouette lift past its edge.
    let [z, K, J, ae] = TU[E.crop], de = 0.38, pe = 1.30, be = Math.cos(E.turn), $ = Math.sin(E.turn), Z = (fe: number, Be: number) => {
      let je = kU[E.crop].reduce((Tt, [Qt, xt]) => Math.max(Tt, Math.exp(-(((fe - Qt) / 0.17) ** 2) - ((Be - xt) / 0.18) ** 2)), 0), Je = d ? 0 : Math.sin(l / 1900 + H * 0.91 + Be * 1.8) * 0.018 + Math.sin(l / 3300 + H * 1.7 + fe * 2) * 6e-3, Ee = (fe - 0.5) * de + je * Je, He = (0.5 - Be) * pe + je * Je * 0.55, et = Math.max(-1.45, Math.min(1.45, E.lat + Ee * $ + He * be)), mt = E.lon + (Ee * be - He * $) / Math.max(0.65, Math.cos(E.lat)) + s, ft = Math.cos(et), vt = Math.cos(mt) * ft, ut = 1.001 + je * 0.07 * (1 - Math.abs(vt)) ** 8;
      return { x: e + Math.sin(mt) * ft * a * ut, y: t - Math.sin(et) * a * ut, z: vt, u: z + fe * J, v: K + Be * ae };
    };
    for (let fe = 0; fe < 7; fe++) {
      let Be = Math.max(fe / 7, 1 - j), je = (fe + 1) / 7;
      if (!(Be >= je)) for (let Je = 0; Je < 8; Je++) {
        let Ee = Z(Je / 8, Be), He = Z((Je + 1) / 8, Be), et = Z((Je + 1) / 8, je), mt = Z(Je / 8, je);
        for (let ft of [[Ee, He, et], [Ee, et, mt]]) for (let vt of [false, true]) {
          let ut = IU(ft, vt);
          if (!(ut.length < 3)) for (let Tt = 1; Tt < ut.length - 1; Tt++) {
            let Qt: [VineVertex, VineVertex, VineVertex] = [ut[0], ut[Tt], ut[Tt + 1]];
            y.push({ z: Qt.reduce((xt, pr) => xt + pr.z, 0) / 3, growth: j, triangles: [Qt] });
          }
        }
      }
    }
  }
  return y.sort((H, E) => H.z - E.z);
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
export function drawVines(e: CanvasRenderingContext2D, t: HTMLImageElement, a: VinePatch[]) {
  for (let l of a) for (let [d, s, y] of l.triangles) {
    let H = s.u - d.u, E = s.v - d.v, j = y.u - d.u, z = y.v - d.v, K = H * z - j * E;
    if (Math.abs(K) < 1e-3) continue;
    let J = ((s.x - d.x) * z - (y.x - d.x) * E) / K, ae = ((y.x - d.x) * H - (s.x - d.x) * j) / K, de = ((s.y - d.y) * z - (y.y - d.y) * E) / K, pe = ((y.y - d.y) * H - (s.y - d.y) * j) / K, be = (d.x + s.x + y.x) / 3, $ = (d.y + s.y + y.y) / 3, Z = (mt: VineVertex) => {
      let ft = Math.hypot(mt.x - be, mt.y - $) || 1;
      return { x: mt.x + (mt.x - be) / ft * 0.35, y: mt.y + (mt.y - $) / ft * 0.35 };
    }, fe = Z(d), Be = Z(s), je = Z(y);
    e.save(), e.beginPath(), e.moveTo(fe.x, fe.y), e.lineTo(Be.x, Be.y), e.lineTo(je.x, je.y), e.closePath(), e.clip(), e.transform(J, de, ae, pe, d.x - J * d.u - ae * d.v, d.y - de * d.u - pe * d.v);
    let Je = Math.max(0, Math.floor(Math.min(d.u, s.u, y.u)) - 2), Ee = Math.max(0, Math.floor(Math.min(d.v, s.v, y.v)) - 2), He = Math.min(t.naturalWidth - Je, Math.ceil(Math.max(d.u, s.u, y.u)) - Je + 2), et = Math.min(t.naturalHeight - Ee, Math.ceil(Math.max(d.v, s.v, y.v)) - Ee + 2);
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
