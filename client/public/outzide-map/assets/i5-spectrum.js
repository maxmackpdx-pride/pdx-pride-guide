// Color is tied to latitude, not to tile boundaries or camera position.
// Line progress uses Web Mercator lengths, matching MapLibre's GeoJSON metrics.
export function spectrumColor(latitude) {
  const progress=Math.max(0,Math.min(1,(latitude-41.25)/(49.01-41.25)));
  // Northern quarter: blend from the rainbow into blue, pink, white, pink, blue.
  // The shared latitude stops keep both carriageways and adjoining tiles in sync.
  if(progress>.75){
    const stops=[[.75,[22,80,255]],[.79,[66,220,255]],[.84,[255,125,194]],[.895,[245,253,255]],[.95,[255,125,194]],[1,[66,220,255]]];
    const index=stops.findIndex(([at])=>at>=progress),[from,a]=stops[index-1],[to,b]=stops[index];
    const t=(progress-from)/(to-from);
    return 'rgb('+a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')+')';
  }
  const hue=progress*300;
  const h=hue/60,x=1-Math.abs(h%2-1);
  const rgb=h<1?[1,x,0]:h<2?[x,1,0]:h<3?[0,1,x]:h<4?[0,x,1]:h<5?[x,0,1]:[1,0,x];
  return `rgb(${rgb.map(v=>Math.round(22+v*233)).join(',')})`;
}
export function spectrumGradient(coordinates) {
  const mercator=([lng,lat])=>[lng*Math.PI/180,Math.asinh(Math.tan(lat*Math.PI/180))];
  const distances=[0];let previous=mercator(coordinates[0]);
  for(const point of coordinates.slice(1)){const next=mercator(point);distances.push(distances.at(-1)+Math.hypot(next[0]-previous[0],next[1]-previous[1]));previous=next;}
  const total=distances.at(-1);if(!total)return spectrumColor(coordinates[0][1]);
  const gradient=['interpolate',['linear'],['line-progress']];
  // Every vertex preserves the same color wherever components meet.
  for(let i=0;i<coordinates.length;i++)if(i===0||distances[i]>distances[i-1])gradient.push(distances[i]/total,spectrumColor(coordinates[i][1]));
  return gradient;
}
export function addI5Spectrum(style,data) {
  const layers=[];
  data.features.forEach((feature,i)=>{
    const source=`i5-spectrum-${i}`;
    style.sources[source]={type:'geojson',data:feature,lineMetrics:true,tolerance:0,attribution:'I‑5 geometry: OpenFreeMap / © OpenStreetMap contributors'};
    const gradient=spectrumGradient(feature.geometry.coordinates);
    for(const [name,width,blur,opacity]of [['bloom',17,9,.42],['halo',7,3,.75],['core',2.4,.2,1]]){
      layers.push({id:`${source}-${name}`,type:'line',source,minzoom:5,maxzoom:13,layout:{'line-cap':'round','line-join':'round'},paint:{'line-gradient':gradient,'line-width':['interpolate',['linear'],['zoom'],5,width*.8,8,width,11,width*.65,13,width*.4],'line-blur':blur,'line-opacity':['interpolate',['linear'],['zoom'],5,opacity,9,opacity,11,opacity*.6,13,0]}});
    }
  });
  // Keep labels above the light strip; terrain drapes it onto the road surface.
  const labels=style.layers.findIndex(layer=>layer.type==='symbol');
  style.layers.splice(labels<0?style.layers.length:labels,0,...layers);
}
