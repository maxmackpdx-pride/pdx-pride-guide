let bloomCanvas,bloomCtx;
export function bloomOverlay(ctx,width,height,amount=.1){
 if(amount<=0)return;
 if(!bloomCanvas){bloomCanvas=document.createElement('canvas');bloomCtx=bloomCanvas.getContext('2d');}
 const source=ctx.canvas,bw=Math.max(1,width>>2),bh=Math.max(1,height>>2);
 if(bloomCanvas.width!==bw||bloomCanvas.height!==bh){bloomCanvas.width=bw;bloomCanvas.height=bh;}
 bloomCtx.clearRect(0,0,bw,bh);bloomCtx.drawImage(source,0,0,source.width,source.height,0,0,bw,bh);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='screen';
 ctx.filter='blur(10px)';ctx.globalAlpha=amount;ctx.drawImage(bloomCanvas,0,0,source.width,source.height);
 ctx.filter='none';ctx.restore();
}
