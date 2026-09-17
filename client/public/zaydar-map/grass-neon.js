const TEXTURE_ID='zaydar-grass';
const WOOD_ID='zaydar-wood';

function randomFactory(seed){
 let state=seed>>>0;
 return ()=>{
  state=Math.imul(state^state>>>15,1|state);
  state^=state+Math.imul(state^state>>>7,61|state);
  return ((state^state>>>14)>>>0)/4294967296;
 };
}

function heightAt(x,y){
 return Math.sin(x*.23+y*.19)*Math.sin(x*.11-y*.15)+Math.sin(x*.07+y*.31)*.45;
}

function naturalTexture({size,seed,lit,shade,blade,density,wood}){
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d',{willReadFrequently:true}),random=randomFactory(seed);
 const image=ctx.createImageData(size,size),pixels=image.data;
 const lx=-0.707,ly=-0.707;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const h=heightAt(x,y),hx=heightAt(x+1,y)-h,hy=heightAt(x,y+1)-h;
  const diffuse=Math.max(.22,Math.min(1,.42+(-hx*lx-hy*ly)*1.8));
  const grain=random();
  const index=(y*size+x)*4;
  const bladeHit=grain>density;
  const r=bladeHit?lit[0]:shade[0],g=bladeHit?lit[1]:shade[1],b=bladeHit?lit[2]:shade[2];
  const a=bladeHit?(wood?90:120):(wood?38:52);
  pixels[index]=Math.round(r*diffuse);
  pixels[index+1]=Math.round(g*diffuse);
  pixels[index+2]=Math.round(b*diffuse);
  pixels[index+3]=Math.round(a*diffuse+.2*a);
 }
 ctx.putImageData(image,0,0);
 ctx.save();
 ctx.lineCap='round';
 for(let i=0;i<(wood?28:56);i++){
  const x=random()*size,y=random()*size,len=2.5+random()*(wood?5:8),angle=-.75+random()*.35;
  const litBlade=random()>.45;
  ctx.strokeStyle=litBlade?blade:shade[3];
  ctx.globalAlpha=.35+.4*random();
  ctx.lineWidth=.45+random()*.65;
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x+Math.cos(angle)*len,y+Math.sin(angle)*len);
  ctx.stroke();
 }
 ctx.restore();
 return ctx.getImageData(0,0,size,size);
}

function grassTexture(){
 return naturalTexture({
  size:128,seed:0x67726173,density:.84,
  lit:[57,255,20],shade:[8,70,48,'rgba(8,70,48,.45)'],blade:'rgba(57,255,20,.5)',wood:false
 });
}

function woodTexture(){
 return naturalTexture({
  size:128,seed:0x776f6f64,density:.9,
  lit:[18,90,62],shade:[4,36,30,'rgba(4,36,30,.4)'],blade:'rgba(18,90,62,.4)',wood:true
 });
}

export function installGrassNeon(map){
 try{
  if(!map.hasImage(TEXTURE_ID))map.addImage(TEXTURE_ID,grassTexture(),{pixelRatio:2});
  if(!map.hasImage(WOOD_ID))map.addImage(WOOD_ID,woodTexture(),{pixelRatio:2});
  const grassPaint={'fill-pattern':TEXTURE_ID,'fill-opacity':['interpolate',['linear'],['zoom'],10,.34,14,.52,17,.64]};
  const woodPaint={'fill-pattern':WOOD_ID,'fill-opacity':['interpolate',['linear'],['zoom'],10,.3,14,.48,17,.6]};
  if(!map.getLayer('grass-neon'))map.addLayer({
   id:'grass-neon',type:'fill',source:'terrain','source-layer':'landuse',
   filter:['in',['get','class'],['literal',['park','recreation_ground','cemetery','grass']]],
   paint:grassPaint
  },'water-shadow');
  if(!map.getLayer('grass-cover-neon'))map.addLayer({
   id:'grass-cover-neon',type:'fill',source:'terrain','source-layer':'landcover',
   filter:['==',['get','class'],'grass'],
   paint:grassPaint
  },'water-shadow');
  if(!map.getLayer('wood-neon'))map.addLayer({
   id:'wood-neon',type:'fill',source:'terrain','source-layer':'landcover',
   filter:['in',['get','class'],['literal',['wood','forest','scrub']]],
   paint:woodPaint
  },'water-shadow');
 }catch(error){console.error('grass-neon',error);}
}
