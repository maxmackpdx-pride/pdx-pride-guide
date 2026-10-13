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
 let previous=null;
 return {
  update(targets,pointer){
   const target=hoveredMapTarget(targets,pointer);
   if(!target){if(previous!==null){ring.hidden=true;canvas.style.cursor='';previous=null;}return;}
   const diameter=Math.min(64,Math.max(32,(target.r||22)*1.5));
   const signature=[target.x,target.y,target.width,target.height,diameter,target.color,target.hoverOnly].join(':');
   if(signature===previous)return;previous=signature;ring.hidden=false;
   canvas.style.cursor=target.hoverOnly?'default':'pointer';
   ring.style.left=`${target.x}px`;ring.style.top=`${target.y}px`;
   ring.style.width=`${target.width?target.width+10:diameter}px`;ring.style.height=`${target.height?target.height+10:diameter}px`;
   ring.style.borderRadius=target.width?'12px':'50%';ring.style.setProperty('--hover-color',target.color||'#b9eef5');
  },
  dispose(){canvas.style.cursor='';ring.remove();}
 };
}
