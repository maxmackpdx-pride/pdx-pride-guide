const hashKey=key=>{let hash=2166136261;for(const c of key)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;return hash;};
export const CITY_SPARKLE_MAX_ZOOM=16;

// Canonical roof outlines give identical anchors across tile order and winding.
export function roofSparkles(buildings,limit=6000,options={}) {
  const sampleModulo=Math.max(1,options.sampleModulo??4);
  const lightsPerRoof=Math.max(1,options.lightsPerRoof??5);
  const bloomPercent=options.bloomPercent;
  const roofs=new Map();
  for(const building of buildings) {
    let ring=building.ring.map(p=>p.map(v=>Number(v.toFixed(7))));
    if(ring.length>1&&ring[0].every((v,i)=>v===ring.at(-1)[i]))ring.pop();
    if(ring.length<3)continue;
    let start=0;
    for(let i=1;i<ring.length;i++)if(ring[i][0]<ring[start][0]||(ring[i][0]===ring[start][0]&&ring[i][1]<ring[start][1]))start=i;
    const forward=ring.map((_,i)=>ring[(start+i)%ring.length]);
    const backward=ring.map((_,i)=>ring[(start-i+ring.length)%ring.length]);
    const a=JSON.stringify(forward),b=JSON.stringify(backward),signature=a<b?a:b;
    ring=a<b?forward:backward;
    const key=ring[0].map(v=>v.toFixed(5)).join(','),hash=hashKey(key);
    if(hash%sampleModulo!==0)continue;
    const prior=roofs.get(key);
    if(!prior||building.height>prior.height||(building.height===prior.height&&signature<prior.signature))
      roofs.set(key,{key,hash,ring,height:building.height,signature});
  }
  const points=[];
  const ordered=[...roofs.values()].sort(options.distribute?(a,b)=>a.hash-b.hash:(a,b)=>a.key.localeCompare(b.key));
  for(const roof of ordered.slice(0,Math.floor(limit/lightsPerRoof))) {
    const {ring,height,hash}=roof,lengths=[0];
    for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];lengths.push(lengths.at(-1)+Math.hypot((b[0]-a[0])*.7,b[1]-a[1]));}
    if(!lengths.at(-1))continue;
    // Fixed lights per selected roof, distributed along its actual outline.
    for(let i=0;i<lightsPerRoof;i++) {
      const distance=lengths.at(-1)*(i+.5)/lightsPerRoof;let edge=0;
      while(edge<ring.length-1&&lengths[edge+1]<=distance)edge++;
      const a=ring[edge],b=ring[(edge+1)%ring.length],mix=(distance-lengths[edge])/(lengths[edge+1]-lengths[edge]||1);
      const seed=hashKey(`${hash}:${i}`);
      const bloom=bloomPercent==null?seed%3===0:hashKey(`${seed}:bloom`)/4294967295<bloomPercent/100;
      points.push({coordinates:a.map((v,j)=>v+(b[j]-v)*mix),height,phase:hashKey(`${seed}:phase`)/4294967295*100,rate:.65+seed/4294967295*.65,star:bloom});
    }
  }
  return points;
}

// Low-zoom tiles may omit building footprints, but retain the street network.
// Stable midpoint samples keep the city lit and naturally follow urban density.
export function streetSparkles(features,limit=7000,{bloomPercent=3,sampleModulo=2}={}) {
  const points=new Map(),excluded=new Set(['motorway','trunk','rail','path']);
  for(const feature of features){
    if(excluded.has(feature.properties?.class))continue;
    const lines=feature.geometry?.type==='LineString'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiLineString'?feature.geometry.coordinates:[];
    for(const line of lines)for(let i=1;i<line.length;i++){
      const a=line[i-1],b=line[i],coordinate=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      const key=coordinate.map(value=>Number(value).toFixed(5)).join(',');
      const hash=hashKey(key);if(hash%Math.max(1,sampleModulo)!==0||points.has(key))continue;
      const seed=hashKey(`${hash}:street`),star=hashKey(`${seed}:bloom`)/4294967295<bloomPercent/100;
      points.set(key,{coordinates:coordinate,height:0,phase:hashKey(`${seed}:phase`)/4294967295*100,rate:.58+seed/4294967295*.58,star,hash});
    }
  }
  return [...points.values()].sort((a,b)=>a.hash-b.hash).slice(0,limit).map(({hash,...point})=>point);
}

// One additional white light per occupied geographic cell spreads highlights
// across the city instead of piling them into its densest roof clusters.
export function whiteSparkles(candidates,colored,limit=720,spacingMeters=160){
  const keyOf=point=>point.coordinates.map(v=>v.toFixed(7)).join(',');
  const occupied=new Set(colored.map(keyOf)),cells=new Map();
  for(const point of candidates){
    const key=keyOf(point);if(occupied.has(key))continue;
    const [lng,lat]=point.coordinates;
    const x=(lng+122.67)*111320*Math.cos(45.53*Math.PI/180),y=(lat-45.53)*111320;
    const gx=Math.floor(x/spacingMeters),gy=Math.floor(y/spacingMeters),cellKey=`${gx}:${gy}`;
    const distance=Math.hypot(x-(gx+.5)*spacingMeters,y-(gy+.5)*spacingMeters),previous=cells.get(cellKey);
    if(!previous||distance<previous.distance||(distance===previous.distance&&key<previous.key))
      cells.set(cellKey,{point,key,distance,order:hashKey(cellKey)});
  }
  return [...cells.values()].sort((a,b)=>a.order-b.order||a.key.localeCompare(b.key)).slice(0,limit).map(({point,key})=>{
    const seed=hashKey(`${key}:white`);
    return {...point,white:true,phase:seed/4294967295*100,rate:.6+hashKey(`${seed}:rate`)/4294967295*.6,
      star:hashKey(`${seed}:bloom`)/4294967295<.03};
  });
}

export function intersectionLightPools(features,limit=180) {
  const nodes=new Map(),excluded=new Set(['rail','path','motorway','trunk']);
  for(const feature of features){
    const properties=feature.properties??{};
    if(excluded.has(properties.class)||['bridge','tunnel'].includes(properties.brunnel)||Number(properties.layer||0)!==0)continue;
    const lines=feature.geometry?.type==='LineString'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiLineString'?feature.geometry.coordinates:[];
    for(const line of lines)for(let i=0;i<line.length;i++){
      const coordinate=line[i];
      // Use a canonical geographic anchor, never the first tile's coordinate.
      const key=coordinate.map(value=>Number(value).toFixed(5)).join(',');
      const node=nodes.get(key)??{key,coordinates:key.split(',').map(Number),branches:new Set(),hash:hashKey(key)};
      for(const neighbor of [line[i-1],line[i+1]]){
        if(!neighbor)continue;
        const dx=(neighbor[0]-coordinate[0])*Math.cos(coordinate[1]*Math.PI/180),dy=neighbor[1]-coordinate[1];
        if(Math.hypot(dx,dy)<1e-7)continue;
        // Buffered copies of a road must not turn a bend into an intersection.
        node.branches.add((Math.round(Math.atan2(dy,dx)*12/Math.PI)+24)%24);
      }
      nodes.set(key,node);
    }
  }
  return [...nodes.values()].filter(node=>node.branches.size>=3).sort((a,b)=>a.hash-b.hash).slice(0,limit).map(node=>({
    key:node.key,coordinates:node.coordinates,count:node.branches.size,
    radiusMeters:14+node.hash%6,angle:hashKey(`${node.key}:angle`)/4294967295*Math.PI*2,
  }));
}
