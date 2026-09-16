function hash32(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}

export function sampleStreetLamps(map,coarse){
 if(map.getZoom()<13.15)return [];
 const features=map.querySourceFeatures('terrain',{sourceLayer:'transportation'});
 const spacing=coarse?36:28,max=coarse?380:900,points=[],seen=new Set();
 for(const feature of features){
  const cls=feature.properties?.class;
  if(cls==='path'||cls==='rail'||cls==='ferry'||cls==='transit')continue;
  const lines=feature.geometry?.type==='LineString'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiLineString'?feature.geometry.coordinates:[];
  for(const line of lines){
   let acc=0;
   for(let i=1;i<line.length&&points.length<max;i++){
    const a=line[i-1],b=line[i],meters=Math.hypot((b[0]-a[0])*85000,(b[1]-a[1])*111320);
    if(meters<.5)continue;
    acc+=meters;
    while(acc>=spacing&&points.length<max){
     acc-=spacing;
     const t=1-acc/meters,lng=a[0]+(b[0]-a[0])*t,lat=a[1]+(b[1]-a[1])*t;
     const key=`${lng.toFixed(5)},${lat.toFixed(5)}`;
     if(seen.has(key))continue;seen.add(key);
     points.push({coordinates:[lng,lat],height:6.2,phase:(hash32(key)%1000)/10,rate:.45,star:false,tone:2});
    }
   }
  }
 }
 return points;
}
