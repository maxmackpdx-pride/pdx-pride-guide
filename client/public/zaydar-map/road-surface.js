const TEXTURE_ID='zaydar-asphalt';

function randomFactory(seed){
 let state=seed>>>0;
 return ()=>{
  state=Math.imul(state^state>>>15,1|state);
  state^=state+Math.imul(state^state>>>7,61|state);
  return ((state^state>>>14)>>>0)/4294967296;
 };
}

function asphaltTexture(){
 const size=64,canvas=document.createElement('canvas');
 canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d',{willReadFrequently:true}),random=randomFactory(0x5a415944);
 const image=ctx.createImageData(size,size),pixels=image.data;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const index=(y*size+x)*4;
  const broad=Math.sin((x+y*.57)*.39)*1.6+Math.sin((x*.21-y*.34))*1.2;
  const grain=(random()-.5)*14;
  const value=Math.max(28,Math.min(55,41+broad));
  const spark=Math.max(0,grain)/14;
  pixels[index]=Math.min(255,Math.round((value-2)*(1-spark)+255*spark));
  pixels[index+1]=Math.min(255,Math.round((value)*(1-spark)+128*spark));
  pixels[index+2]=Math.min(255,Math.round((value+2)*(1-spark)+31*spark));
  pixels[index+3]=255;
 }
 ctx.putImageData(image,0,0);
 // 2% bloom on the orange grain only — asphalt body stays dark.
 ctx.save();
 ctx.globalCompositeOperation='lighter';
 ctx.filter='blur(.8px)';
 ctx.globalAlpha=.02;
 ctx.drawImage(canvas,0,0);
 ctx.restore();
 // Fine cracks and repaired seams read only when the camera gets close.
 ctx.lineWidth=.45;
 for(let i=0;i<8;i++){
  let x=random()*size,y=random()*size;
  ctx.strokeStyle=random()>.5?'rgba(3,7,10,.20)':'rgba(117,145,158,.09)';
  ctx.beginPath();ctx.moveTo(x,y);
  for(let step=0;step<4;step++){x+=3+random()*7;y+=(random()-.5)*5;ctx.lineTo(x,y);}
  ctx.stroke();
 }
 return ctx.getImageData(0,0,size,size);
}

export function installRoadSurface(map,filter,width){
 if(!map.hasImage(TEXTURE_ID))map.addImage(TEXTURE_ID,asphaltTexture(),{pixelRatio:2});
 if(map.getLayer('streets-texture'))return;
 map.addLayer({
  id:'streets-texture',type:'line',source:'terrain','source-layer':'transportation',filter,
  layout:{'line-cap':'butt','line-join':'round'},
  paint:{
   'line-pattern':TEXTURE_ID,
   'line-opacity':['interpolate',['linear'],['zoom'],10,.34,13,.48,15,.66,17.75,.78],
   'line-width':['*',width,.94]
  }
 },'skyline');
 if(!map.getLayer('street-sodium'))map.addLayer({
  id:'street-sodium',type:'line',source:'terrain','source-layer':'transportation',filter,
  layout:{'line-cap':'round','line-join':'round'},
  paint:{
   'line-color':'#c36522',
   'line-opacity':['interpolate',['linear'],['zoom'],11,.06,14,.14,17,.2],
   'line-width':['*',width,1.35],
   'line-blur':['interpolate',['linear'],['zoom'],11,1.5,16,5.5]
  }
 },'skyline');
}
