const SOURCE_ID='google-sat';
const LAYER_ID='google-sat';
const OSM_BUILDINGS=['skyline','building-uplight','buildings'];

function hide(map,id){
 if(map.getLayer(id))map.setLayoutProperty(id,'visibility','none');
}

export async function installGoogleTextures(map){
 try{
  const response=await fetch('/api/mapz/google-session',{credentials:'same-origin'});
  if(!response.ok||response.status===204)return;
  const body=await response.json().catch(()=>null);
  if(!body?.ok)return;
  if(map.getSource(SOURCE_ID))return;
  map.addSource(SOURCE_ID,{
   type:'raster',
   tiles:['/api/mapz/google-tiles/{z}/{x}/{y}'],
   tileSize:256,
   maxzoom:22,
   attribution:'© Google'
  });
  const before=map.getLayer('water')?'water':undefined;
  map.addLayer({
   id:LAYER_ID,type:'raster',source:SOURCE_ID,
   paint:{
    'raster-opacity':['interpolate',['linear'],['zoom'],10,.55,13,.72,16,.86,17.5,.92],
    'raster-saturation':-.28,
    'raster-hue-rotate':16,
    'raster-contrast':-.04,
    'raster-brightness-min':0,
    'raster-brightness-max':.7,
    'raster-fade-duration':0
   }
  },before);
  for(const id of OSM_BUILDINGS)hide(map,id);
  map._zaydarGoogleBuildings=true;
  const credit=document.querySelector('.credit');
  if(credit&&!credit.textContent.includes('Google')){
   credit.insertAdjacentHTML('beforeend',' · <a href="https://www.google.com/permissions/geoguidelines/">Google</a>');
  }
 }catch(error){console.error('google textures',error);}
}
