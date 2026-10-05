export function hoveredMapTarget(targets,pointer){
 if(!pointer.active)return null;
 for(let i=targets.length-1;i>=0;i--){
  const t=targets[i],dx=pointer.x-t.x,dy=pointer.y-t.y;
  if(t.width?Math.abs(dx)<=t.width/2&&Math.abs(dy)<=t.height/2:Math.hypot(dx,dy)<t.r)return t;
 }
 return null;
}

// One non-interactive element: no new canvas, WebGL pass, or animation loop.
export function createMapHover(canvas){
 const ring=document.createElement('div');ring.className='map-hover-highlight';ring.hidden=true;ring.setAttribute('aria-hidden','true');document.body.appendChild(ring);
 return {
  update(targets,pointer){
   const target=hoveredMapTarget(targets,pointer);ring.hidden=!target;
   canvas.style.cursor=target?(target.hoverOnly?'default':'pointer'):'';
   if(!target)return;
   const diameter=Math.min(64,Math.max(32,(target.r||22)*1.5));
   ring.style.left=`${target.x}px`;ring.style.top=`${target.y}px`;
   ring.style.width=`${target.width?target.width+10:diameter}px`;ring.style.height=`${target.height?target.height+10:diameter}px`;
   ring.style.borderRadius=target.width?'12px':'50%';ring.style.setProperty('--hover-color',target.color||'#b9eef5');
  },
  dispose(){canvas.style.cursor='';ring.remove();}
 };
}
