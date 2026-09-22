// Soft vapor uses the same airy radial shading above and below the icon.
// Its cone follows the floating head while the base stays fixed to the map.
export function createHotSpringSteam(){
 function puff(ctx,x,y,radius,opacity){
  const haze=ctx.createRadialGradient(x,y,0,x,y,radius);
  haze.addColorStop(0,`rgba(219,255,255,${opacity})`);
  haze.addColorStop(.4,`rgba(140,244,249,${opacity*.65})`);
  haze.addColorStop(1,'rgba(54,229,239,0)');
  ctx.fillStyle=haze;ctx.beginPath();ctx.ellipse(x,y,radius,radius*1.3,0,0,Math.PI*2);ctx.fill();
 }
 return {draw(ctx,mask,anchor,height,halfWidth,time,reducedMotion=false,phase=0,iconHeight=30.8,swayX=0){
  const seconds=reducedMotion?1.6:time/1000;
  ctx.save();ctx.globalAlpha=1;
  ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);
  ctx.lineTo(anchor.x+swayX-halfWidth,anchor.y-height);
  ctx.lineTo(anchor.x+swayX+halfWidth,anchor.y-height);ctx.closePath();ctx.clip();
  for(let i=0;i<9;i++){
   const progress=((seconds*.23+i/9+phase)%1+1)%1;
   const angle=i*2.399+seconds*.65;
   const x=anchor.x+swayX*progress+Math.sin(angle)*halfWidth*progress*.55;
   const y=anchor.y-progress*height;
   puff(ctx,x,y,3+progress*6,Math.sin(progress*Math.PI)*.24);
  }
  ctx.restore();
  const iconTop=anchor.y-height-iconHeight,rise=iconHeight*.55;
  ctx.save();ctx.globalAlpha=1;
  for(let i=0;i<7;i++){
   const progress=((seconds*.23+i/7+phase)%1+1)%1;
   const angle=i*2.399+seconds*.65;
   const x=anchor.x+swayX+Math.sin(angle)*(halfWidth*.4+progress*halfWidth*.3);
   puff(ctx,x,iconTop+4-progress*rise,4+progress*5,Math.sin(progress*Math.PI)*.24);
  }
  ctx.restore();
 }};
}
