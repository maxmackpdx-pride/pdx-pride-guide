import {setGeoJSON,addLayers,registerImage,createFeatureInteraction} from './layers.js';
import {whenStyleReady} from './lifecycle.js';

// Standard MapLibre pin artwork, rasterized once per color. Signature waypoint
// buttons and holograms stay in their product renderer.
async function pinImage(color,library){
 const marker=new library.Marker({color});
 const svg=marker.getElement().querySelector('svg');
 const image=new Image();
 image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));
 await image.decode();
 const canvas=document.createElement('canvas');canvas.width=54;canvas.height=82;
 canvas.getContext('2d').drawImage(image,0,0,54,82);
 return canvas.getContext('2d').getImageData(0,0,54,82);
}

export function createNativePins(map,id,{library=globalThis.maplibregl}={}){
 let revision=0,disposed=false,lastSignature=null;
 const layer=id+'-pins',interaction=createFeatureInteraction(map,id);
 const click=event=>{
  const feature=event.features?.[0];if(!feature)return;
  interaction('selected',feature.id);
  if(feature.properties.label)new library.Popup().setLngLat(feature.geometry.coordinates).setText(feature.properties.label).addTo(map);
 };
 const enter=event=>{map.getCanvas().style.cursor='pointer';interaction('hover',event.features?.[0]?.id);};
 const leave=()=>{map.getCanvas().style.cursor='';interaction('hover',null);};
 map.on('click',layer,click);map.on('mousemove',layer,enter);map.on('mouseleave',layer,leave);
 return {
  async set(rows){
   const signature=JSON.stringify(rows);
   if(signature===lastSignature&&map.getLayer(layer))return;
   const version=++revision;
   await whenStyleReady(map);
   const colors=[...new Set(rows.map(row=>row.color))];
   await Promise.all(colors.map(color=>registerImage(map,'standard-pin-'+color,()=>pinImage(color,library),{pixelRatio:2})));
   if(disposed||version!==revision)return;
   const data={type:'FeatureCollection',features:rows.map(row=>({type:'Feature',id:row.id,geometry:{type:'Point',coordinates:[row.lng,row.lat]},properties:{image:'standard-pin-'+row.color,scale:row.scale??1,label:row.label??''}}))};
   setGeoJSON(map,id,data);lastSignature=signature;
   addLayers(map,[{id:layer,type:'symbol',source:id,layout:{'icon-image':['get','image'],'icon-size':['get','scale'],'icon-anchor':'bottom','icon-allow-overlap':true,'icon-ignore-placement':true,'icon-pitch-alignment':'viewport','icon-rotation-alignment':'viewport'}}]);
  },
  dispose(){disposed=true;revision++;map.off('click',layer,click);map.off('mousemove',layer,enter);map.off('mouseleave',layer,leave);if(map.getLayer(layer))map.removeLayer(layer);if(map.getSource(id))map.removeSource(id);},
 };
}
