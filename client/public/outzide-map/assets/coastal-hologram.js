// Wind follows the floating beam; surf stays on the fixed ground disk.
export function drawCoastalHologram(ctx,anchor,height,halfWidth,swayX,radius,seconds,reducedMotion=false,phase=0){
  const time=reducedMotion?1.4:seconds;
  ctx.save();
  ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);
  ctx.lineTo(anchor.x+swayX-halfWidth,anchor.y-height);
  ctx.lineTo(anchor.x+swayX+halfWidth,anchor.y-height);ctx.closePath();ctx.clip();
  ctx.strokeStyle='#ffe0a0';ctx.lineCap='round';
  for(let i=0;i<38;i++){
    const level=.15+((i*.61803398875)%1)*.84;
    const travel=((time*(.22+(i%4)*.025)+i*.381966+phase)%1+1)%1;
    const span=halfWidth*level;
    const x=anchor.x+swayX*level+(travel*2-1)*span;
    const y=anchor.y-height*level+Math.sin(time*1.2+i)*.8;
    ctx.globalAlpha=Math.sin(travel*Math.PI)*(.25+(i%3)*.14);
    ctx.lineWidth=i%4===0?.9:.55;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+1.2+(i%3)*.5,y-.25);ctx.stroke();
  }
  ctx.restore();
  ctx.save();ctx.translate(anchor.x,anchor.y);ctx.rotate(-.08);
  const depth=radius*7.5/27;
  ctx.beginPath();ctx.ellipse(0,0,radius,depth,0,0,Math.PI*2);
  ctx.globalAlpha=1;ctx.fillStyle='#715832';ctx.fill();
  ctx.save();ctx.clip();
  // A shallow blue wash advances onto sand, followed by a soft foam crest.
  for(let i=0;i<2;i++){
    const progress=((time/4.8+i/2+phase)%1+1)%1;
    const edge=-depth+progress*depth*2.25;
    const fade=Math.sin(progress*Math.PI);
    const crest=()=>{
      ctx.moveTo(-radius,edge);
      ctx.bezierCurveTo(-radius*.5,edge-depth*.32,radius*.1,edge+depth*.35,radius*.5,edge);
      ctx.quadraticCurveTo(radius*.8,edge-depth*.18,radius,edge+depth*.08);
    };
    ctx.beginPath();crest();ctx.lineTo(radius,-depth);ctx.lineTo(-radius,-depth);ctx.closePath();
    ctx.globalAlpha=fade*.65;ctx.fillStyle='#55bac7';ctx.fill();
    ctx.beginPath();crest();ctx.globalAlpha=fade*.85;ctx.strokeStyle='#e6f7ec';ctx.lineWidth=.85;ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();ctx.ellipse(0,0,radius,depth,0,0,Math.PI*2);
  ctx.strokeStyle='#F2CA78';ctx.lineWidth=.8;ctx.globalAlpha=.65;ctx.stroke();ctx.restore();
}
