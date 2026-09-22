// Depth-shaded vapor curls rise from the ground orb, widening into exactly the
// projection beam's silhouette. The beam texture also supplies its soft edges.
export function createHotSpringSteam(){
 const vapor=document.createElement('canvas');vapor.width=128;vapor.height=320;
 const painter=vapor.getContext('2d');
 return {draw(ctx,mask,anchor,height,halfWidth,time,reducedMotion=false,phase=0){
  painter.clearRect(0,0,128,320);painter.globalCompositeOperation='source-over';
  const seconds=reducedMotion?1.6:time/1000;
  for(let i=0;i<12;i++){
   const progress=((seconds*.19+i/12+phase)%1+1)%1;
   const y=316-progress*294,spread=progress*51;
   const angle=progress*9-seconds*.85+i*2.399;
   const depth=(Math.cos(angle)+1)/2;
   const x=64+Math.sin(angle)*spread*.6;
   const radius=7+progress*23;
   const opacity=Math.sin(progress*Math.PI)*(.55+depth*.4);
   painter.save();painter.translate(x,y);painter.scale(.75+depth*.35,1.35);
   const cloud=painter.createRadialGradient(-radius*.2,-radius*.15,0,0,0,radius);
   cloud.addColorStop(0,`rgba(230,255,255,${opacity})`);
   cloud.addColorStop(.35,`rgba(138,244,249,${opacity*.8})`);
   cloud.addColorStop(1,'rgba(54,229,239,0)');
   painter.fillStyle=cloud;painter.beginPath();painter.arc(0,0,radius,0,Math.PI*2);painter.fill();painter.restore();
  }
  painter.globalCompositeOperation='destination-in';painter.drawImage(mask,0,0,128,320);
  painter.globalCompositeOperation='source-over';
  ctx.save();ctx.globalAlpha=1;ctx.drawImage(vapor,anchor.x-halfWidth,anchor.y-height,halfWidth*2,height);ctx.restore();
 }};
}
