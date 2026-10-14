// Projected 3D surface grids. Every line follows the same underlying volume;
// these are original parametric drawings, not offset copies of a flat icon.
type Point = [number, number, number];
type Surface = (u: number, v: number) => Point;
export type PlaceWireframe = { outline: string; grid: string; rearGrid: string };
const tau = Math.PI * 2;
const project = ([x, y, z]: Point, yaw = -.42): [number, number] => {
  const pitch = .3;
  const rx = x * Math.cos(yaw) + z * Math.sin(yaw);
  const rz = z * Math.cos(yaw) - x * Math.sin(yaw);
  const ry = y * Math.cos(pitch) - rz * Math.sin(pitch);
  const depth = y * Math.sin(pitch) + rz * Math.cos(pitch);
  const scale = 1.15 * 550 / (550 - depth);
  return [200 + rx * scale, 250 - ry * scale];
};
const curve = (fn: (t: number) => Point, steps = 32, yaw = -.42) => Array.from({ length: steps + 1 }, (_, i) => {
  const [x, y] = project(fn(i / steps), yaw);
  return `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
}).join('');
class Drawing {
  constructor(private density = 1, private yaw = -.42) {}
  outline = ''; grid = ''; rearGrid = '';
  meshCurve(fn: (t: number) => Point) {
    let previousFar: boolean | undefined;
    for (let i=1; i<=32; i++) {
      const a=fn((i-1)/32), b=fn(i/32);
      const middle=a.map((value,j)=>(value+b[j])/2) as Point;
      const depth=middle[1]*Math.sin(.3)+(middle[2]*Math.cos(this.yaw)-middle[0]*Math.sin(this.yaw))*Math.cos(.3);
      const far=depth<0, [ax,ay]=project(a,this.yaw), [bx,by]=project(b,this.yaw);
      const segment=`${previousFar===far ? '' : `M${ax.toFixed(2)} ${ay.toFixed(2)}`}L${bx.toFixed(2)} ${by.toFixed(2)}`;
      if(far) this.rearGrid+=segment; else this.grid+=segment;
      previousFar=far;
    }
  }
  line(a: Point, b: Point) { this.outline += curve(t => a.map((v, i) => v + (b[i] - v) * t) as Point, 1, this.yaw); }
  edge(fn: (t: number) => Point) { this.outline += curve(fn,32,this.yaw); }
  surface(fn: Surface, rows = 6, columns = 10, closed = false) {
    rows = Math.max(2, Math.round(rows * this.density));
    columns = Math.max(3, Math.round(columns * this.density));
    for (let i = 1; i < rows; i++) this.meshCurve(t => fn(i / rows, t));
    for (let i = 1; i < columns; i++) this.meshCurve(t => fn(t, i / columns));
    this.edge(t => fn(0, t)); this.edge(t => fn(1, t));
    if (!closed) { this.edge(t => fn(t, 0)); this.edge(t => fn(t, 1)); }
  }
  lathe(profile: (v: number) => [number, number], center: Point = [0, 0, 0], rows = 7, columns = 12) {
    this.surface((v, u) => { const [r, y] = profile(v); return [center[0] + r * Math.cos(u * tau), center[1] + y, center[2] + r * Math.sin(u * tau)]; }, rows, columns, true);
    // The two side meridians establish the object's silhouette even between rings.
    this.edge(t => { const [r, y] = profile(t); return [center[0] - r, center[1] + y, center[2]]; });
    this.edge(t => { const [r, y] = profile(t); return [center[0] + r, center[1] + y, center[2]]; });
  }
  sphere(center: Point, radius: number, vertical = radius) {
    this.lathe(v => [radius * Math.sin(v * Math.PI), -vertical * Math.cos(v * Math.PI)], center, 9, 14);
  }
  torus(center: Point, major: number, minor: number, arc = tau, vertical = false) {
    this.surface((u, v) => {
      const a = u * arc, b = v * tau, r = major + minor * Math.cos(b);
      return vertical ? [center[0] + r * Math.cos(a), center[1] + r * Math.sin(a), center[2] + minor * Math.sin(b)]
       : [center[0] + r * Math.cos(a), center[1] + minor * Math.sin(b), center[2] + r * Math.sin(a)];
    }, 12, 6, true);
  }
  box(center: Point, size: Point) {
    const [x,y,z] = center, [w,h,d] = size;
    this.surface((u,v) => [x-w/2+w*u,y-h/2+h*v,z+d/2], 4, 5);
    this.surface((u,v) => [x+w/2,y-h/2+h*u,z-d/2+d*v], 4, 3);
    this.surface((u,v) => [x-w/2+w*u,y+h/2,z-d/2+d*v], 5, 3);
    this.line([x-w/2,y-h/2,z-d/2],[x-w/2,y+h/2,z-d/2]);
    this.line([x-w/2,y-h/2,z-d/2],[x+w/2,y-h/2,z-d/2]);
  }
}
function cup(d: Drawing, center: Point = [0, 0, 0], size = 1) {
  d.lathe(v => [(44 + v * 13) * size, (-60 + v * 110) * size], center, 6, 12);
  d.torus([center[0] + 62*size, center[1]-2*size, center[2]], 26*size, 5*size, tau, true);
  d.lathe(v => [75 * size * v, -73 * size], center, 3, 12);
}
function glass(d: Drawing, center: Point = [0,0,0], size = 1) {
  d.lathe(v => [(12 + 50*Math.sin(v*Math.PI/2))*size, (5+v*80)*size], center, 6, 12);
  d.lathe(v => [5*size, (-65+v*70)*size], center, 3, 8);
  d.lathe(v => [50*v*size,-70*size], center, 3, 12);
}
function leaf(d: Drawing, center: Point, direction: number, size = 1) {
  d.surface((u,v) => {
    const width = Math.sin(u*Math.PI)*40*size, across = (v-.5)*2;
    return [center[0]+direction*(u*80*size + across*width*.6),center[1]+u*90*size-across*width*.25,center[2]+across*width+Math.sin(u*Math.PI)*20*size];
  }, 6, 5);
  d.edge(t => [center[0]+direction*t*80*size,center[1]+t*90*size,center[2]+Math.sin(t*Math.PI)*20*size]);
}
function plant(d: Drawing) {
  d.lathe(v => [35+v*10,-100+v*45], [0,0,0], 3, 10);
  d.line([0,-55,0],[0,60,0]);
  leaf(d,[0,-35,0],-1); leaf(d,[0,0,0],1); leaf(d,[0,25,0],-1,.7);
}
function flame(d: Drawing, campfire = false) {
  d.surface((v,u) => {
    const r = Math.sin(v*Math.PI)*47*(1-.5*v), a=u*tau;
    return [r*Math.cos(a)+25*v*v, -65+175*v, r*Math.sin(a)];
  }, 9, 12, true);
  // Crossed cylindrical logs give the flame a recognizable campfire base.
  if (!campfire) d.lathe(v => [10,-85+170*v], [0,0,0], 4, 8);
  if (campfire) for (const direction of [-1, 1]) d.surface((u,v) => {
    const along = -65 + 130*u, angle = v*tau;
    return [along, -76 + 10*Math.cos(angle), direction*along*.6 + 10*Math.sin(angle)];
  }, 4, 8, true);
}
function speaker(d: Drawing) {
  d.box([0,0,0],[130,190,50]);
  d.surface((u,v) => { const r=55*v,a=u*tau;return [r*Math.cos(a),-25+r*Math.sin(a),30+Math.sin(v*Math.PI)*15]; }, 12, 6, true);
  d.surface((u,v) => { const r=22*v,a=u*tau;return [r*Math.cos(a),62+r*Math.sin(a),30+Math.sin(v*Math.PI)*8]; }, 10, 3, true);
}
function microphone(d: Drawing) {
  d.lathe(v => [34,-20+75*v], [0,0,0], 5, 12);
  d.lathe(v => [34*Math.sin(v*Math.PI/2),90-35*v], [0,0,0], 4, 12);
  d.edge(t => [-52*Math.cos(t*Math.PI),-15-52*Math.sin(t*Math.PI),0]);
  d.lathe(v => [5,-95+70*v], [0,0,0], 3, 8);
  d.lathe(v => [50*v,-100], [0,0,0], 3, 10);
}
function book(d: Drawing) {
  for(const side of [-1,1]) d.surface((u,v) => [side*95*u,-55+135*v + Math.sin(u*Math.PI)*18,30*Math.sin(u*Math.PI)-15*u], 6, 6);
  d.line([0,-55,0],[0,80,0]);
  d.edge(t => [-95+190*t,-65,Math.sin(t*Math.PI)*15-25]);
}
function curtain(d: Drawing) {
  for(const side of [-1,1]) d.surface((u,v) => [side*(25+75*u+20*Math.sin(v*Math.PI)),100-190*v,18*Math.sin(u*Math.PI*3)-10*v], 8, 8);
  d.box([0,-100,0],[210,15,65]);
}
function bowl(d: Drawing) {
  d.lathe(v => [65*Math.sin(v*Math.PI/2),-75+70*(1-Math.cos(v*Math.PI/2))], [0,35,0], 7, 14);
  d.torus([0,30,0],65,3);
}
function arch(d: Drawing) {
  d.surface((u,v) => { const a=u*Math.PI;return [(65+20*v)*Math.cos(a),-70+(65+20*v)*Math.sin(a)*1.8,35*v]; }, 12, 4);
  d.box([-75,-80,15],[20,30,40]); d.box([75,-80,15],[20,30,40]);
}
function wing(d: Drawing, side: number) {
  d.surface((u,v) => [side*(u*115),-65+140*Math.sin(u*Math.PI*.7)*(1-.7*v),30*Math.sin(u*Math.PI)*Math.sin(v*Math.PI)], 8, 6);
}
// Professional motifs are built from volumes, with curved surface grids and
// front/rear separation. These objects describe the service, never its logo.
function inkVessel(d: Drawing) {
  d.lathe(v => [v < .15 ? 33 + v*55 : v > .75 ? 28 : 44, -75 + 135*v], [0,0,0], 8,12);
  d.lathe(v => [29,60+25*v], [0,0,0], 3,10);
  d.torus([0,85,0],29,3);
}
function tattooPen(d: Drawing) {
  d.lathe(v => [v<.25 ? 19+v*24 : 25-12*v, -65+150*v], [0,0,0], 10,12);
  d.lathe(v => [4*(1-v),-100+35*v], [0,0,0], 3,8);
  d.edge(t => [13+44*Math.sin(t*Math.PI),85+30*t,30*Math.sin(t*tau)]);
}
function comb(d: Drawing) {
  d.box([0,55,0],[170,24,14]);
  for(let i=0;i<11;i++) d.box([-75+i*15,-9,0],[5,115-i%2*8,10]);
}
function bodywork(d: Drawing) {
  // Two rounded cushioning volumes, with a folded flowing textile above them.
  d.sphere([0,-57,0],78,27); d.sphere([0,-16,0],61,24);
  d.surface((u,v) => [-90+180*u,35+32*Math.sin(u*Math.PI)+25*v, -42+84*v+18*Math.sin(u*tau)],8,6);
}
function designPlanes(d: Drawing) {
  for(const [z,shift] of [[-24,-15],[12,15]]) d.surface((u,v) => [-78+156*u+shift,-85+170*v,z+14*Math.sin(u*Math.PI)*Math.sin(v*Math.PI)],6,7);
  d.sphere([28,36,38],24); d.torus([-25,-24,30],29,4,tau,true);
}
function webConsole(d: Drawing) {
  d.box([0,0,0],[165,125,26]);
  d.line([-82,38,16],[82,38,16]);
  for(const x of [-62,-47,-32]) d.sphere([x,48,18],3);
  d.line([-36,16,20],[-57,-4,20]);d.line([-57,-4,20],[-36,-24,20]);
  d.line([36,16,20],[57,-4,20]);d.line([57,-4,20],[36,-24,20]);
  d.line([11,23,20],[-11,-30,20]);
  d.box([0,-85,-5],[80,10,45]);d.box([0,-65,-5],[13,30,17]);
}
function keyRing(d: Drawing) {
  d.torus([0,52,0],39,5,tau,true);
  d.box([0,-20,0],[13,88,15]);
  d.box([16,-49,0],[26,11,15]);d.box([12,-28,0],[18,10,15]);
}
function careRibbon(d: Drawing) {
  // Anatomical care as an open supportive volume, rather than a medical cross.
  d.surface((u,v) => {const a=(.15+u*1.7)*Math.PI,r=55+18*Math.sin(v*Math.PI);return [r*Math.cos(a),-70+140*v,r*Math.sin(a)*.7];},12,8);
  d.sphere([0,78,0],22);leaf(d,[20,-20,0],1,.7);
}
const cache = new Map<string, PlaceWireframe>();
export function placeWireframe(form: string, density = 1, yaw = -.42): PlaceWireframe {
  const cacheKey = `${form}-${density}-${yaw}`;
  const cached = cache.get(cacheKey); if(cached) return cached;
  const d = new Drawing(density,yaw);
  switch(form) {
    // Community boards share the Placez/Needz projected-volume treatment.
    case 'boardParcel':
      d.box([0,-15,0],[135,115,110]);
      d.box([0,47,0],[145,14,120]);
      d.box([0,-12,57],[18,130,3]);
      d.torus([-24,73,0],25,5,tau,true); d.torus([24,73,0],25,5,tau,true);
      break;
    case 'boardTag':
      d.box([0,-10,0],[110,145,12]);
      d.torus([0,48,9],10,2,tau,true);
      d.edge(t=>[30*Math.sin(t*Math.PI),65+60*t,8-24*t]);
      break;
    case 'boardMessages':
      d.box([-25,25,-15],[120,80,18]);
      d.box([35,-35,25],[120,80,18]);
      d.line([-60,-15,-6],[-60,-38,-6]); d.line([-60,-38,-6],[-30,-15,-6]);
      d.line([70,-75,34],[70,-98,34]); d.line([70,-98,34],[40,-75,34]);
      break;
    case 'threadSpool':
      d.lathe(v => [29+5*Math.sin(v*Math.PI),-65+130*v],[0,0,0],12,12);
      d.lathe(v => [50*v,-65],[0,0,0],3,12); d.lathe(v => [50*v,65],[0,0,0],3,12);
      d.edge(t => [35*Math.cos(t*tau*5),-65+130*t,35*Math.sin(t*tau*5)]); break;
    case 'tattooPen': tattooPen(d); break;
    case 'inkVessel': inkVessel(d); break;
    case 'comb': comb(d); break;
    case 'bodywork': bodywork(d); break;
    case 'designPlanes': designPlanes(d); break;
    case 'webConsole': webConsole(d); break;
    case 'keyRing': keyRing(d); break;
    case 'careRibbon': careRibbon(d); break;
    case 'danceScreen': d.sphere([0,0,0],90); d.line([0,90,0],[0,120,0]); break;
    case 'gathering': d.surface((u,v)=>[-90+180*u,-70+175*(1-Math.abs(u*2-1)),-55+110*v],8,6); d.line([-90,-70,55],[90,-70,55]); d.line([0,105,55],[0,-70,55]); break;
    case 'dragStage': curtain(d); break;
    case 'aerialStage': d.torus([0,0,0],75,5,tau,true); d.line([0,75,0],[0,120,0]); break;
    case 'soundRoom': speaker(d); break;
    case 'karaoke': microphone(d); break;
    case 'plantHouse': plant(d); break;
    case 'gardenBrunch': bowl(d); leaf(d,[0,15,0],1,.7); break;
    case 'botanicalBottles': d.lathe(v=>[v>.65?18:43,-95+190*v],[0,0,0],9,12); leaf(d,[-30,-20,15],-1,.7); break;
    case 'fireWood': flame(d); break;
    case 'campfire': flame(d, true); break;
    case 'pineTree':
      d.lathe(v => [7,-105+55*v],[0,0,0],3,8);
      for (const [radius,base,height] of [[65,-65,85],[48,-20,85],[32,25,80]])
        d.lathe(v => [radius*(1-v),base+height*v],[0,0,0],4,12);
      break;
    case 'coffeeMix': cup(d); break;
    case 'espressoCart': d.box([0,0,0],[140,135,70]); cup(d,[0,-65,45],.4); break;
    case 'coffeeBeer': d.lathe(v=>[35+13*v,-80+165*v],[0,0,0],6,12); d.torus([0,85,0],48,3); break;
    case 'wineRoom': glass(d); break;
    case 'wineTarot': glass(d,[-25,0,0],.8); d.box([65,0,-10],[55,125,8]); break;
    case 'ringCocktail': d.lathe(v=>[5+80*v,-5+85*v],[0,0,0],6,14); d.lathe(v=>[5,-85+80*v],[0,0,0],3,8); d.lathe(v=>[48*v,-90],[0,0,0],3,12); break;
    case 'bagel': d.torus([0,0,0],60,25); break;
    case 'books': book(d); break;
    case 'yarnBook': book(d); d.sphere([65,-55,30],35); break;
    case 'bowlChopsticks': bowl(d); d.line([20,20,0],[110,105,15]); d.line([35,20,0],[125,105,15]); break;
    case 'taco': d.surface((u,v)=>[-85+170*v,-45+80*Math.sin(u*Math.PI),55*Math.cos(u*Math.PI)],10,8); break;
    case 'pizza': d.surface((u,v)=>[(v-.5)*150*u,95-180*u,18*Math.sin(u*Math.PI)],7,7); d.line([-75,-85,0],[0,95,0]); d.line([75,-85,0],[0,95,0]); break;
    case 'wingsLinks': case 'peacockMic': wing(d,-1); wing(d,1); break;
    case 'starStage': {
      const star=(u:number): Point=>{const index=Math.min(9,Math.floor(u*10)),fraction=u*10-index;const point=(i:number)=>{const a=Math.PI/2+i*tau/10,r=i%2===0?85:36;return [r*Math.cos(a),r*Math.sin(a)]};const a=point(index),b=point(index+1);return [a[0]+(b[0]-a[0])*fraction,a[1]+(b[1]-a[1])*fraction,0]};
      d.surface((u,v)=>{const [x,y]=star(u);return [x*v,y*v,12];},10,3,true);
      d.surface((u,v)=>{const [x,y]=star(u);return [x,y,-12+24*v];},10,2,true);
      break;
    }
    case 'dancePortal': arch(d); d.torus([0,0,0],30,5,tau,true); break;
    case 'lantern': d.lathe(v=>[40+25*Math.sin(v*Math.PI),-90+180*v],[0,0,0],9,12); break;
    case 'spa': bowl(d); d.surface((u,v)=>[(v-.5)*115,20+100*u,20*Math.sin(u*Math.PI*2+v*Math.PI)],6,4); break;
    case 'waves': d.surface((u,v)=>[-100+200*u,-85+170*v,35*Math.sin(u*tau+v*Math.PI)],10,9); break;
    case 'poolDarts': d.box([0,-25,0],[175,35,125]); d.sphere([0,10,0],18); break;
    case 'waffle': d.box([0,0,0],[140,25,140]); break;
    case 'film': d.box([0,0,0],[150,170,25]); d.torus([0,0,25],45,5,tau,true); break;
    case 'wealth': [35,65,95,135].forEach((h,i)=>d.box([-65+i*43,-90+h/2,0],[27,h,40])); break;
    case 'keysHome': d.box([0,-25,0],[145,125,85]); d.surface((u,v)=>[-80+160*u,40+65*(1-Math.abs(u*2-1)),-50+100*v],8,5); break;
    case 'riverCamp': d.surface((u,v)=>[-90+180*u,-65+165*(1-Math.abs(u*2-1)),-55+110*v],8,5); break;
    case 'lounge': d.box([0,-35,0],[150,45,80]); d.box([0,15,-35],[150,80,20]); d.box([-85,-5,0],[20,85,80]); d.box([85,-5,0],[20,85,80]); break;
    case 'trophyBall': d.lathe(v=>[25+32*v,-5+90*v],[0,0,0],5,12); d.lathe(v=>[9,-70+65*v],[0,0,0],3,8); d.lathe(v=>[50*v,-75],[0,0,0],2,10); d.torus([-57,35,0],26,5,Math.PI*1.4,true); d.torus([57,35,0],26,5,Math.PI*1.4,true); break;
    case 'scissors': d.torus([-40,-55,0],30,5,tau,true); d.torus([40,-55,0],30,5,tau,true); d.surface((u,v)=>[-50+140*u,-35+140*u,(v-.5)*12],6,2); d.surface((u,v)=>[50-140*u,-35+140*u,(v-.5)*12+10],6,2); break;
    case 'antlers': for(const side of [-1,1]) {
      d.surface((u,v)=>[side*(15+70*u)+5*Math.cos(v*tau),-80+175*u,15*Math.sin(u*Math.PI)+5*Math.sin(v*tau)],8,6,true);
      d.surface((u,v)=>[side*(50+50*u)+4*Math.cos(v*tau),10+35*u,4*Math.sin(v*tau)],4,6,true);
      d.surface((u,v)=>[side*(65-20*u)+4*Math.cos(v*tau),40+55*u,4*Math.sin(v*tau)],4,6,true);
    } break;
    case 'garment': d.surface((u,v)=>{const a=v*tau,w=50+12*Math.sin(u*Math.PI);return [w*Math.cos(a),-90+155*u,25*Math.sin(a)];},8,12,true);
      for(const side of [-1,1]) d.surface((u,v)=>[side*(45+55*u),60-35*u+22*Math.cos(v*tau),25*Math.sin(v*tau)],5,8,true);
      d.torus([0,65,0],22,3); break;
    default: d.sphere([0,0,0],85);
  }
  const result = { outline:d.outline, grid:d.grid, rearGrid:d.rearGrid }; cache.set(cacheKey,result); return result;
}
