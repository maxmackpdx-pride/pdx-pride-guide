/** Snow stays inside the projection; the ground anchor never moves. */
export function drawWinterSnow(ctx,a,h,w,dx,t,reducedMotion,seed=0){
 ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+dx-w,a.y-h);ctx.lineTo(a.x+dx+w,a.y-h);ctx.closePath();ctx.clip();
 for(let i=0;i<25;i++){
  const phase=((i*.61803398875+Math.abs(seed)*.17)%1);
  const fall=reducedMotion?phase:(phase+t*(.13+(i%4)*.022))%1;
  const spread=(1-fall)*w;
  const x=a.x+dx*(1-fall)+Math.sin(i*12.9+Math.abs(seed))*.9*spread+(reducedMotion?0:Math.sin(t*.7+i)*spread*.12);
  ctx.globalAlpha=.35+(1-fall)*.5;ctx.fillStyle='#f0fbff';ctx.beginPath();ctx.arc(x,a.y-h+fall*h,.6+(i%3)*.32,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
