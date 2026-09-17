const TEXTURE_ID='zaydar-grass';

function randomFactory(seed){
 let state=seed>>>0;
 return ()=>{
  state=Math.imul(state^state>>>15,1|state);
  state^=state+Math.imul(state^state>>>7,61|state);
  return ((state^state>>>14)>>>0)/4294967296;
 };
}

function grassTexture(){
 const size=64,canvas=document.createElement('canvas');
 canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d',{willReadFrequently:true}),random=randomFactory(0x67726173);
 const image=ctx.createImageData(size,size),pixels=image.data;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const index=(y*size+x)*4,spark=random();
  if(spark<.93)continue;
  const acid=spark>.985;
  pixels[index]=acid?204:57;
  pixels[index+1]=255;
  pixels[index+2]=acid?0:20;
  pixels[index+3]=acid?110:70;
 }
 ctx.putImageData(image,0,0);
 ctx.save();
 ctx.globalCompositeOperation='lighter';
 ctx.filter='blur(.7px)';
 ctx.globalAlpha=.4;
 ctx.drawImage(canvas,0,0);
 ctx.restore();
 return ctx.getImageData(0,0,size,size);
}

export function installGrassNeon(map){
 if(!map.hasImage(TEXTURE_ID))map.addImage(TEXTURE_ID,grassTexture(),{pixelRatio:2});
 if(map.getLayer('grass-neon'))return;
 const paint={'fill-pattern':TEXTURE_ID,'fill-opacity':['interpolate',['linear'],['zoom'],10,.16,14,.28,17,.36]};
 map.addLayer({
  id:'grass-neon',type:'fill',source:'terrain','source-layer':'landuse',
  filter:['in',['get','class'],['literal',['park','recreation_ground','cemetery','grass']]],
  paint
 },'water-shadow');
 if(!map.getLayer('grass-cover-neon'))map.addLayer({
  id:'grass-cover-neon',type:'fill',source:'terrain','source-layer':'landcover',
  filter:['==',['get','class'],'grass'],
  paint
 },'water-shadow');
}
