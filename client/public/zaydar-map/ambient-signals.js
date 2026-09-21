const CONTOUR_LAYER_PREFIX='elevation-contour-signal-';
const CORRIDOR_SOURCE_PREFIX='mapz-signal-corridors-';
const CORRIDOR_LAYER_PREFIX='signal-corridors-';
const MAJOR_ROADS=new Set(['motorway','trunk','primary']);

const clamp=(min,max,value)=>Math.max(min,Math.min(max,value));
const smoothstep=value=>value*value*(3-2*value);
const featureLines=feature=>feature.geometry?.type==='LineString'?[feature.geometry.coordinates]:feature.geometry?.type==='MultiLineString'?feature.geometry.coordinates:[];
const lineLength=line=>line.slice(1).reduce((sum,point,index)=>sum+Math.hypot((point[0]-line[index][0])*.7,point[1]-line[index][1]),0);
const lineKey=(line,roadClass)=>{
  const start=line[0]??[0,0],end=line.at(-1)??start;
  const points=[start,end].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  return `${roadClass}:${points.flat().map(value=>value.toFixed(5)).join(':')}`;
};

export function contourSignalOpacity(time,band,zoom,reduced=false){
  const zoomFade=1-smoothstep(clamp(0,1,(zoom-14.75)/1.15));
  if(zoomFade<=0)return 0;
  if(reduced)return [.022,.016,.011][band]*zoomFade;
  const cycle=((time/16)+band/3)%1;
  const distance=Math.min(cycle,1-cycle)*2;
  const wave=smoothstep(clamp(0,1,1-distance));
  return (.006+.027*wave)*zoomFade;
}

export function selectSignalCorridors(features,limit=6){
  const unique=new Map();
  for(const feature of features){
    const roadClass=feature.properties?.class;
    if(!MAJOR_ROADS.has(roadClass)||feature.properties?.brunnel==='tunnel')continue;
    for(const line of featureLines(feature)){
      if(line.length<2)continue;
      const length=lineLength(line),bridge=feature.properties?.brunnel==='bridge';
      if(length<.0008)continue;
      const key=lineKey(line,roadClass),weight=roadClass==='motorway'?1.35:roadClass==='trunk'?1.2:1;
      const candidate={type:'Feature',geometry:{type:'LineString',coordinates:line},properties:{roadClass,bridge},score:length*weight*(bridge?1.45:1)};
      if(!unique.has(key)||unique.get(key).score<candidate.score)unique.set(key,candidate);
    }
  }
  return [...unique.values()].sort((a,b)=>b.score-a.score).slice(0,limit).map(({score,...feature})=>feature);
}

const transparent=()=> 'rgba(0,0,0,0)';
export function corridorGradient(progress,reduced=false,intensity=1){
  const center=reduced?.52:.12+.76*progress;
  const inner=.025,outer=.11;
  const points=[
    [0,transparent()],
    [clamp(.001,.999,center-outer),transparent()],
    [clamp(.002,.999,center-inner),'rgba(216,39,156,0.18)'],
    [clamp(.003,.999,center),`rgba(247,105,191,${.78*intensity})`],
    [clamp(.004,.999,center+inner),'rgba(237,185,94,0.52)'],
    [clamp(.005,.999,center+outer),transparent()],
    [1,transparent()],
  ];
  for(let i=1;i<points.length;i++)points[i][0]=Math.max(points[i][0],points[i-1][0]+.0001);
  points.at(-1)[0]=1;
  return ['interpolate',['linear'],['line-progress'],...points.flat()];
}

export function createAmbientSignals(map,reduced){
  let installed=false,lastPaint=-Infinity,signature='',pending=[];
  const sources=[0,1,2].map(index=>CORRIDOR_SOURCE_PREFIX+index);
  const layers=[0,1,2].map(index=>CORRIDOR_LAYER_PREFIX+index);
  function setCorridors(features){
    const nextFeatures=selectSignalCorridors(features);
    const next=nextFeatures.map(feature=>lineKey(feature.geometry.coordinates,feature.properties.roadClass)).join('|');
    if(next===signature)return;
    pending=nextFeatures;signature=next;
    if(!installed)return;
    for(let group=0;group<3;group++)map.getSource(sources[group])?.setData({type:'FeatureCollection',features:pending.filter((_,index)=>index%3===group)});
  }
  return {
    install(){
      if(installed)return;
      installed=true;
      for(let group=0;group<3;group++){
        map.addSource(sources[group],{type:'geojson',lineMetrics:true,data:{type:'FeatureCollection',features:pending.filter((_,index)=>index%3===group)}});
        map.addLayer({
          id:layers[group],type:'line',source:sources[group],minzoom:11.5,maxzoom:18,
          layout:{'line-cap':'round','line-join':'round'},
          paint:{
            'line-gradient':corridorGradient(group/3,reduced.matches,.85),
            'line-width':['interpolate',['linear'],['zoom'],11.5,.55,14,1,16,1.7,18,2.4],
            'line-blur':['interpolate',['linear'],['zoom'],11.5,.15,18,.45],
            'line-opacity':['interpolate',['linear'],['zoom'],11.5,0,12.25,.72,17,.62,18,0],
          },
        },map.getLayer('buildings')?'buildings':undefined);
      }
      lastPaint=-Infinity;
    },
    update:setCorridors,
    draw(time,zoom,moving=false){
      // Four style updates per second are enough for a slow signal and avoid
      // repeatedly rebuilding MapLibre paint state on phones and laptops.
      if(!installed||moving||time-lastPaint<.25)return;
      lastPaint=time;
      for(let band=0;band<3;band++){
        const contourId=CONTOUR_LAYER_PREFIX+band;
        if(map.getLayer(contourId))map.setPaintProperty(contourId,'line-opacity',contourSignalOpacity(time,band,zoom,reduced.matches));
        if(map.getLayer(layers[band]))map.setPaintProperty(layers[band],'line-gradient',corridorGradient((time/22+band/3)%1,reduced.matches,.85));
      }
    },
    dispose(){
      for(const layer of layers)if(map.getLayer(layer))map.removeLayer(layer);
      for(const source of sources)if(map.getSource(source))map.removeSource(source);
      installed=false;pending=[];signature='';
    },
  };
}
