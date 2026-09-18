const SOURCE_ID='aerial-sat';
const LAYER_ID='aerial-sat';
const ESRI='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

function tint(map,id,opacity){
 if(map.getLayer(id))map.setPaintProperty(id,'fill-opacity',opacity);
}

function hideGlow(map,id){
 if(map.getLayer(id))map.setLayoutProperty(id,'visibility','none');
}

export async function installGoogleTextures(map){
 try{
  if(map.getSource(SOURCE_ID))return;
  let tiles=[ESRI],attribution='Esri, Maxar, Earthstar Geographics',label='Esri';
  try{
   const response=await fetch('/api/mapz/google-session',{credentials:'same-origin'});
   const body=response.ok&&response.status!==204?await response.json().catch(()=>null):null;
   if(body?.ok){
    tiles=['/api/mapz/google-tiles/{z}/{x}/{y}'];
    attribution='© Google';
    label='Google';
   }
  }catch{}
  map.addSource(SOURCE_ID,{type:'raster',tiles,tileSize:256,maxzoom:19,attribution});
  const before=map.getLayer('water')?'water':undefined;
  map.addLayer({
   id:LAYER_ID,type:'raster',source:SOURCE_ID,
   paint:{
    'raster-opacity':['interpolate',['linear'],['zoom'],10,.7,13,.82,16,.9],
    'raster-saturation':-.42,
    'raster-hue-rotate':12,
    'raster-contrast':-.08,
    'raster-brightness-min':0,
    'raster-brightness-max':.48,
    'raster-fade-duration':0
   }
  },before);
  hideGlow(map,'buildings');
  tint(map,'park-ground',['interpolate',['linear'],['zoom'],9.5,.18,13,.26,16,.32]);
  tint(map,'woodland-ground',['interpolate',['linear'],['zoom'],9.5,.2,13,.28,16,.34]);
  tint(map,'grass-neon',['interpolate',['linear'],['zoom'],10,.1,14,.18,17,.22]);
  tint(map,'grass-cover-neon',['interpolate',['linear'],['zoom'],10,.1,14,.18,17,.22]);
  tint(map,'wood-neon',['interpolate',['linear'],['zoom'],10,.08,14,.16,17,.2]);
  map._zaydarRealistic=true;
  const credit=document.querySelector('.credit');
  if(credit&&!credit.textContent.includes(label)){
   credit.insertAdjacentHTML('beforeend',` · ${label}`);
  }
 }catch(error){console.error('aerial textures',error);}
}
