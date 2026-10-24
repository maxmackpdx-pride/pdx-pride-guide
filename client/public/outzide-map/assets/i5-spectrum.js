// The interstate line: dark orange to Zaylist orange to dark orange along each road.
// Color is a triangle wave of position (not of tile or camera), so every piece of a road, both
// carriageways, and the places where roads meet all agree on the same color at the same spot.
const DARK=[154,58,10],ORANGE=[255,102,0],PERIOD_DEGREES=3;
export function spectrumColor(latitude,longitude=0) {
  const phase=(((latitude+longitude)/PERIOD_DEGREES)%1+1)%1;
  const t=1-Math.abs(2*phase-1);
  return 'rgb('+DARK.map((v,i)=>Math.round(v+(ORANGE[i]-v)*t)).join(',')+')';
}
// Cut a road into short pieces and give each piece the color at its middle.
export function interstatePieces(data,piece=6) {
  const out=[];
  for(const feature of data.features){
    const c=feature.geometry.coordinates;
    for(let i=0;i<c.length-1;i+=piece-1){
      const coordinates=c.slice(i,Math.min(c.length,i+piece));
      if(coordinates.length<2)continue;
      const mid=coordinates[Math.floor(coordinates.length/2)];
      out.push({type:'Feature',properties:{ref:feature.properties?.ref,c:spectrumColor(mid[1],mid[0])},geometry:{type:'LineString',coordinates}});
    }
  }
  return {type:'FeatureCollection',features:out};
}
export function addI5Spectrum(style,data) {
  const source='i5-spectrum-0';
  style.sources[source]={type:'geojson',data:interstatePieces(data),tolerance:0,attribution:'Interstate geometry: OpenFreeMap / © OpenStreetMap contributors'};
  const layers=[];
  for(const [name,width,blur,opacity]of [['bloom',9,5,.38],['halo',3.6,1.6,.7],['core',1.3,.2,1]]){
    layers.push({id:`${source}-${name}`,type:'line',source,minzoom:5,maxzoom:13,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':['get','c'],'line-width':['interpolate',['linear'],['zoom'],5,width*.8,8,width,11,width*.65,13,width*.4],'line-blur':blur,'line-opacity':['interpolate',['linear'],['zoom'],5,opacity,9,opacity,11,opacity*.6,13,0]}});
  }
  // Keep labels above the light strip; terrain drapes it onto the road surface.
  const labels=style.layers.findIndex(layer=>layer.type==='symbol');
  style.layers.splice(labels<0?style.layers.length:labels,0,...layers);
}
