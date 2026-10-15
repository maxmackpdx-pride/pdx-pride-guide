// Same frame delta as the map: no extra timers, no camera-dependent resets.
export function smoothCardVisibility(current,visible,delta,calm=false){
 const target=visible?1:0;
 return calm?target:current+(target-current)*(1-Math.exp(-Math.max(0,Math.min(delta,.1))*8));
}

// Remember the settled puzzle as one screen-space formation. The source points
// still project every frame, so beams keep their geographic endpoints.
export function createEventCardLock(holdMs=6000){
 let saved=new Map(),until=0,wasMoving=false;
 return {
  retained(now,moving){return now<until||moving&&!wasMoving?new Set(saved.keys()):new Set();},
  apply(items,now,moving,calm=false){
   if(moving&&!wasMoving&&saved.size)until=now+holdMs;
   wasMoving=moving;
   const members=items.filter(item=>saved.has(item.feature.properties.key));
   if(now<until&&members.length){
    let dx=0,dy=0;
    for(const item of members){const old=saved.get(item.feature.properties.key);dx+=item.p.x-old.anchorX;dy+=item.p.y-old.anchorY;}
    const follow=calm?0:.22;
    dx=Math.max(-90,Math.min(90,dx/members.length*follow));
    dy=Math.max(-70,Math.min(70,dy/members.length*follow));
    for(const item of members){
     const old=saved.get(item.feature.properties.key);
     item.x=old.x+dx;item.y=old.y+dy;item.offset.scale=old.scale;
     item.halfWidth=old.halfWidth;item.halfHeight=old.halfHeight;item.cardLocked=true;
    }
   }else if(!moving){
    saved=new Map(items.filter(item=>item.offset.cardVisible).map(item=>[item.feature.properties.key,
     {x:item.x,y:item.y,anchorX:item.p.x,anchorY:item.p.y,scale:item.offset.scale,halfWidth:item.halfWidth,halfHeight:item.halfHeight}]));
   }
  }
 };
}
