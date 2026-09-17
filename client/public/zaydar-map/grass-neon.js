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
 const size=128,canvas=document.createElement('canvas');
 canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d',{willReadFrequently:true}),random=randomFactory(0x67726173);
 const image=ctx.createImageData(size,size),pixels=image.data;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const index=(y*size+x)*4;
  const clump=Math.sin(x*.21+y*.17)*Math.sin(x*.09-y*.13);
  const grain=random();
  if(grain>.88){
   const acid=grain>.97||clump>.35;
   pixels[index]=acid?204:57;
   pixels[index+1]=acid?255:220;
   pixels[index+2]=acid?0:24;
   pixels[index+3]=acid?150:95;
  }else if(clump>.22&&grain>.62){
   pixels[index]=40;pixels[index+1]=160;pixels[index+2]=18;pixels[index+3]=48;
  }
 }
 ctx.putImageData(image,0,0);
 ctx.save();
 ctx.lineCap='round';
 for(let i=0;i<48;i++){
  const x=random()*size,y=random()*size,len=3+random()*7,angle=-.6+random()*.4;
  ctx.strokeStyle=random()>.55?'rgba(57,255,20,.55)':'rgba(200,255,0,.4)';
  ctx.lineWidth=.55+random()*.7;
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x+Math.cos(angle)*len,y+Math.sin(angle)*len);
  ctx.stroke();
 }
 ctx.globalCompositeOperation='lighter';
 ctx.filter='blur(.55px)';
 ctx.globalAlpha=.45;
 ctx.drawImage(canvas,0,0);
 ctx.restore();
 return ctx.getImageData(0,0,size,size);
}

export function installGrassNeon(map){
 if(!map.hasImage(TEXTURE_ID))map.addImage(TEXTURE_ID,grassTexture(),{pixelRatio:2});
 if(map.getLayer('grass-neon'))return;
 const paint={'fill-pattern':TEXTURE_ID,'fill-opacity':['interpolate',['linear'],['zoom'],10,.28,14,.46,17,.58]};
 map.addLayer({
  id:'grass-neon',type:'fill',source:'terrain','source-layer':'landuse',
  filter:['in',['get','class'],['literal',['park','recreation_ground','cemetery','grass']]],
  paint
 },'water-shadow');
 if(!map.getLayer('grass-cover-neon'))map.addLayer({
  id:'grass-cover-neon',type:'fill',source:'terrain','source-layer':'landcover',
  filter:['in',['get','class'],['literal',['grass','wood','forest','scrub']]],
  paint
 },'water-shadow');
}
