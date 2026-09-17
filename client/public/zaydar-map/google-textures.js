const SOURCE_ID='google-sat';
const LAYER_ID='google-sat';

function tint(map,id,opacity){
 if(map.getLayer(id))map.setPaintProperty(id,'fill-opacity',opacity);
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
  const before=map.getLayer('park-ground')?'park-ground':map.getLayer('water')?'water':undefined;
  map.addLayer({
   id:LAYER_ID,type:'raster',source:SOURCE_ID,
   paint:{
    'raster-opacity':['interpolate',['linear'],['zoom'],10,.38,13,.52,16,.64,17.5,.7],
    'raster-saturation':-.38,
    'raster-hue-rotate':22,
    'raster-contrast':-.06,
    'raster-brightness-min':0,
    'raster-brightness-max':.62,
    'raster-fade-duration':0
   }
  },before);
  // Vector earth tones become tints so satellite texture reads underneath.
  const park=['interpolate',['linear'],['zoom'],9.5,.2,13,.3,16,.38];
  const wood=['interpolate',['linear'],['zoom'],9.5,.24,13,.34,16,.42];
  const grain=['interpolate',['linear'],['zoom'],10,.14,14,.24,17,.3];
  tint(map,'park-ground',park);
  tint(map,'woodland-ground',wood);
  tint(map,'grass-neon',grain);
  tint(map,'grass-cover-neon',grain);
  tint(map,'wood-neon',grain);
  const credit=document.querySelector('.credit');
  if(credit&&!credit.textContent.includes('Google')){
   credit.insertAdjacentHTML('beforeend',' · <a href="https://www.google.com/permissions/geoguidelines/">Google</a>');
  }
 }catch(error){console.error('google textures',error);}
}
