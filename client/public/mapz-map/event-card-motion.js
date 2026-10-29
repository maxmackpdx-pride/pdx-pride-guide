// Same frame delta as the map: no extra timers, no camera-dependent resets.
export function smoothCardVisibility(current,visible,delta,calm=false){
 const target=visible?1:0;
 return calm?target:current+(target-current)*(1-Math.exp(-Math.max(0,Math.min(delta,.1))*8));
}

// Remember the settled puzzle as one screen-space formation. The source points
// still project every frame, so beams keep their geographic endpoints.
// The hold starts once, when the camera first moves after the cards settled, and is never restarted by later
// moves: panning in short bursts used to keep re-arming it, so cards rode along with the camera indefinitely.
export const CARD_LOCK_HOLD_MS=2500;
// A held card is dropped as soon as its venue is this far off screen (the same margin the beacon filter uses).
export const CARD_LOCK_OFFSCREEN_PX=300;
// A new hold can only begin after the view has been still this long once the last hold ended.
export const CARD_LOCK_SETTLE_MS=400;
export function cardAnchorOffscreen(p,view,margin=CARD_LOCK_OFFSCREEN_PX){
 if(!view||!p)return false;
 return !(p.x>=-margin&&p.x<=view.width+margin&&p.y>=-margin&&p.y<=view.height+margin);
}
export function createEventCardLock(holdMs=CARD_LOCK_HOLD_MS){
 let saved=new Map(),until=0,wasMoving=false,armed=false,stillSince=0;
 return {
  retained(now,moving){return now<until||moving&&!wasMoving&&!armed?new Set(saved.keys()):new Set();},
  apply(items,now,moving,calm=false,view=null){
   if(moving&&!wasMoving&&saved.size&&!armed){until=now+holdMs;armed=true;}
   if(!moving&&wasMoving)stillSince=now;
   wasMoving=moving;
   if(now<until){
    // Venues that left the screen (or the frame) let go of their card for good.
    const present=new Map(items.map(item=>[item.feature.properties.key,item]));
    for(const key of [...saved.keys()]){const item=present.get(key);if(!item||cardAnchorOffscreen(item.p,view))saved.delete(key);}
   }
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
    // Settled again after the hold ran out: take a fresh snapshot, and the next move may start one new hold.
    if(now>=until&&now-stillSince>=CARD_LOCK_SETTLE_MS)armed=false;
    saved=new Map(items.filter(item=>item.offset.cardVisible).map(item=>[item.feature.properties.key,
     {x:item.x,y:item.y,anchorX:item.p.x,anchorY:item.p.y,scale:item.offset.scale,halfWidth:item.halfWidth,halfHeight:item.halfHeight}]));
   }
  }
 };
}
