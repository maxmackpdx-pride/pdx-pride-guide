// Keep the October 10 live renderer as the fallback. Midnight November 1 in Portland
// is still PDT; use an explicit offset so device timezone cannot change the cutoff.
export const HALLOWEEN_END = Date.parse("2026-11-01T00:00:00-07:00");
export const HALLOWEEN_START = Date.parse("2026-10-10T00:00:00-07:00");
export function homeHalloweenActive(now = Date.now()) { return now >= HALLOWEEN_START && now < HALLOWEEN_END; }
export const HALLOWEEN_COLORS = ["#ab75ff", "#ff6600", "#39ff14"];
export const HALLOWEEN_GLYPHS = {
  pumpkin: '<path d="M12 6c-8-5-13 12-4 14h8c9-2 4-19-4-14Z M12 6V2l3 1 M8 6c-3 5-3 9 0 14 M16 6c3 5 3 9 0 14"/>',
  ghost: '<path d="M5 21V9a7 7 0 0 1 14 0v12l-4-3-3 3-3-3-4 3Z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/>',
  bat: '<path d="m12 8 3-4 1 5 6-4-1 9-5-1-4 6-4-6-5 1-1-9 6 4 1-5 3 4Z"/>',
  skull: '<path d="M8 16C0 13 4 2 12 2s12 11 4 14v6H8v-6Z M10 18v4 M14 18v4"/><circle cx="8" cy="10" r="2"/><circle cx="16" cy="10" r="2"/><path d="m12 13-1 2h2l-1-2Z"/>',
  spider: '<circle cx="12" cy="13" r="4"/><circle cx="12" cy="7" r="2"/><path d="m8 10-4-4-2 2m6 5H2m6 3-4 4H2m14-12 4-4 2 2m-6 5h6m-6 3 4 4h2"/>',
  web: '<path d="M12 1v22M1 12h22M4 4l16 16M4 20 20 4M12 4l5 3 3 5-3 5-5 3-5-3-3-5 3-5 5-3Zm0 4 3 1 1 3-1 3-3 1-3-1-1-3 1-3 3-1Z"/>',
  witch: '<path d="m6 17 5-15 5 5-3 1 5 9H6ZM2 18q10-3 20 0l-2 3H4l-2-3Z"/>',
  coffin: '<path d="m8 2-4 5 3 15h10l3-15-4-5H8ZM12 6v10M9 10h6"/>',
  cauldron: '<path d="M4 10h16l-1 9c-3 3-11 3-14 0l-1-9ZM3 10h18M7 21l-1 2m11-2 1 2M9 7q-3-2 0-4m6 4q-3-2 0-4"/>',
  candle: '<path d="M8 10h8v11H8V10ZM6 22h12M12 9c-6-1-2-5 0-7 0 2 5 6 0 7Z"/>',
};
export type HalloweenGlyph = keyof typeof HALLOWEEN_GLYPHS;

function polygon(x:number,y:number,vertices:number[][]) {
  let inside=false;
  for(let i=0,j=vertices.length-1;i<vertices.length;j=i++) {
    const [xi,yi]=vertices[i], [xj,yj]=vertices[j];
    if((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
// Four identical carvings exactly pi/2 radians apart, made from negative space in white dots.
export function pumpkinCarved(longitude:number, latitude:number, faceLongitude:number) {
  const x = Math.atan2(Math.sin(4*(longitude-faceLongitude)),Math.cos(4*(longitude-faceLongitude)))/4;
  const eye = polygon(x,latitude,[[-.55,.14],[-.24,.5],[-.08,.14]]) || polygon(x,latitude,[[.08,.14],[.24,.5],[.55,.14]]);
  const nose = polygon(x,latitude,[[-.1,-.05],[0,.1],[.1,-.05]]);
  const mouth = polygon(x,latitude,[[-.62,-.17],[-.37,-.25],[-.28,-.16],[-.18,-.28],[.18,-.28],[.28,-.16],[.37,-.25],[.62,-.17],[.46,-.45],[.25,-.54],[.15,-.43],[-.15,-.43],[-.25,-.54],[-.46,-.45]]);
  return eye || nose || mouth;
}
export function pumpkinDots(faceLongitude:number) {
  const points:{x:number;y:number;z:number;tone:number;beamExcluded:boolean}[]=[];
  for(let row=-86;row<=86;row++) {
    const latitude=row/90*Math.PI/2;
    const count=Math.max(12,Math.round(300*Math.cos(latitude)));
    for(let col=0;col<count;col++) {
      const longitude=col/count*2*Math.PI;
      if(pumpkinCarved(longitude,latitude,faceLongitude)) continue;
      const rib=1-.035*(.5+.5*Math.cos(10*(longitude-faceLongitude)));
      const band=Math.pow(Math.cos(latitude),.84)*rib;
      points.push({x:Math.sin(longitude)*band,y:Math.sin(latitude)*.91,z:Math.cos(longitude)*band,tone:0,beamExcluded:false});
    }
  }
  for(let row=0;row<20;row++) for(let col=0;col<12;col++) {
    const turn=col/12*Math.PI*2;
    points.push({x:Math.sin(turn)*.065+row*.002,y:.91+row*.009,z:Math.cos(turn)*.065,tone:0,beamExcluded:false});
  }
  return points;
}
