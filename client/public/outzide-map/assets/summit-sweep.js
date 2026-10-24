// Radar pass on the big mountains: from each summit, a band of thick orange contour lines lights up,
// runs down the mountain, and fades behind itself. It rests before the next pass.
export const SUMMITS=[
  {id:'rainier',name:'Mount Rainier',lat:46.8523,lng:-121.7603,ft:14411},
  {id:'hood',name:'Mount Hood',lat:45.3735,lng:-121.6959,ft:11249},
  {id:'adams',name:'Mount Adams',lat:46.2024,lng:-121.4906,ft:12281},
  {id:'st-helens',name:'Mount St. Helens',lat:46.1914,lng:-122.1956,ft:8363},
  {id:'jefferson',name:'Mount Jefferson',lat:44.6742,lng:-121.7985,ft:10497},
  {id:'south-sister',name:'South Sister',lat:44.1031,lng:-121.7694,ft:10358},
  {id:'bachelor',name:'Mount Bachelor',lat:43.9794,lng:-121.6886,ft:9068},
  {id:'baker',name:'Mount Baker',lat:48.7768,lng:-121.8145,ft:10781},
  {id:'glacier-peak',name:'Glacier Peak',lat:48.1125,lng:-121.1139,ft:10541},
  {id:'shasta',name:'Mount Shasta',lat:41.4092,lng:-122.1949,ft:14179},
  {id:'olympus',name:'Mount Olympus',lat:47.8013,lng:-123.7109,ft:7980},
  {id:'mt-washington',name:'Mount Washington',lat:44.3326,lng:-121.8368,ft:7794},
  {id:'three-fingered-jack',name:'Three Fingered Jack',lat:44.4786,lng:-121.8691,ft:7841},
  {id:'crater-lake',name:'Mount Scott',lat:42.9356,lng:-122.0003,ft:8929},
];
const TRAIL_FT=1800,PASS_MS=5500,REST_MS=2500;
const rangeFt=s=>Math.min(6500,s.ft-3200);
// A rough circle around the summit (about 11 km), used to keep each pass to its own mountain.
function disc(lng,lat,km=11,steps=20){
  const ring=[];for(let i=0;i<=steps;i++){const a=i/steps*Math.PI*2;ring.push([lng+Math.cos(a)*km/(111.32*Math.cos(lat*Math.PI/180)),lat+Math.sin(a)*km/110.57])}
  return {type:'Polygon',coordinates:[ring]};
}
export const opacityAt=(summit,head)=>{
  const age=['-',head,['-',summit,['to-number',['get','ele'],0]]];
  return ['case',['<',age,0],0,['<',age,TRAIL_FT],['-',1,['/',age,TRAIL_FT]],0];
};
export function addSummitSweep(style){
  const contours=style.layers.find(l=>l.id==='elevation-contours');
  if(!contours)return style;
  const layers=SUMMITS.map(s=>({
    id:`summit-sweep-${s.id}`,type:'line',source:contours.source,'source-layer':contours['source-layer'],minzoom:10,
    filter:['within',disc(s.lng,s.lat)],
    layout:{'line-cap':'round','line-join':'round'},
    paint:{'line-color':'#FF6600','line-blur':.9,'line-opacity':0,
      'line-width':['interpolate',['linear'],['zoom'],10,2.4,12.5,3.6,15,5.2]},
  }));
  style.layers.splice(style.layers.indexOf(contours)+1,0,...layers);
  return style;
}
export function installSummitSweep(map){
  const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('calm-mode')||document.documentElement.dataset.calm==='true';
  const lit=new Set();
  const clear=()=>{for(const id of lit)if(map.getLayer(id))map.setPaintProperty(id,'line-opacity',0);lit.clear()};
  setInterval(()=>{
    if(document.hidden||still()||map.getZoom()<10.2||map.isMoving()){if(lit.size)clear();return}
    const t=performance.now()%(PASS_MS+REST_MS),b=map.getBounds().toArray();
    for(const s of SUMMITS){
      const id=`summit-sweep-${s.id}`;if(!map.getLayer(id))continue;
      const inView=s.lng>b[0][0]-.15&&s.lng<b[1][0]+.15&&s.lat>b[0][1]-.15&&s.lat<b[1][1]+.15;
      if(!inView){if(lit.has(id)){map.setPaintProperty(id,'line-opacity',0);lit.delete(id)}continue}
      if(t>PASS_MS){if(lit.has(id)){map.setPaintProperty(id,'line-opacity',0);lit.delete(id)}continue}
      const head=t/PASS_MS*(rangeFt(s)+TRAIL_FT);
      map.setPaintProperty(id,'line-opacity',opacityAt(s.ft,head));lit.add(id);
    }
  },110);
}
