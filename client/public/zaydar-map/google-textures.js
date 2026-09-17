const SOURCE_ID='google-sat';
const LAYER_ID='google-sat';

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
    'raster-opacity':['interpolate',['linear'],['zoom'],10,.2,14,.32,17,.42],
    'raster-saturation':-.62,
    'raster-contrast':-.12,
    'raster-brightness-min':0,
    'raster-brightness-max':.42
   }
  },before);
  const credit=document.querySelector('.credit');
  if(credit&&!credit.textContent.includes('Google')){
   credit.insertAdjacentHTML('beforeend',' · <a href="https://www.google.com/permissions/geoguidelines/">Google</a>');
  }
 }catch(error){console.error('google textures',error);}
}
