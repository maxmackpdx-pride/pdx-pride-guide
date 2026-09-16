// Canonical roof outlines give identical anchors across tile order and winding.
// Height bands turn those outlines into facade windows, not just roof dots.
export function roofSparkles(buildings,limit=6000,roofDivisor=4,bands=[1]) {
  const roofs=new Map();
  const hashKey=key=>{let hash=2166136261;for(const c of key)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;return hash;};
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
    if(hash%roofDivisor!==0)continue;
    const prior=roofs.get(key);
    if(!prior||building.height>prior.height||(building.height===prior.height&&signature<prior.signature))
      roofs.set(key,{key,hash,ring,height:building.height,signature});
  }
  const points=[];
  const maxRoofs=Math.max(1,Math.floor(limit/(5*Math.max(1,bands.length))));
  for(const roof of [...roofs.values()].sort((a,b)=>a.key.localeCompare(b.key)).slice(0,maxRoofs)) {
    const {ring,height,hash}=roof,lengths=[0];
    for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];lengths.push(lengths.at(-1)+Math.hypot((b[0]-a[0])*.7,b[1]-a[1]));}
    if(!lengths.at(-1))continue;
    for(let band=0;band<bands.length;band++) {
      const level=height*bands[band];
      for(let i=0;i<5;i++) {
        const distance=lengths.at(-1)*((i+.18*band)/5%1);let edge=0;
        while(edge<ring.length-1&&lengths[edge+1]<=distance)edge++;
        const a=ring[edge],b=ring[(edge+1)%ring.length],mix=(distance-lengths[edge])/(lengths[edge+1]-lengths[edge]||1);
        const seed=hashKey(`${hash}:${band}:${i}`);
        // Lower floors run warm street amber; upper floors are magenta with cyan hits.
        const tone=bands[band]<.35?2:seed%5===0?1:0;
        points.push({coordinates:a.map((v,j)=>v+(b[j]-v)*mix),height:level,phase:hashKey(`${seed}:phase`)/4294967295*100,rate:.65+seed/4294967295*.65,star:bands[band]>=.95&&seed%3===0,tone});
      }
    }
  }
  return points;
}
