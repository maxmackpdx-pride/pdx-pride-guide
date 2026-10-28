import {EVENT_CARD_HEIGHT,EVENT_CLOCK_HEIGHT} from './event-hologram-model.js';
import {eventCardGeometry} from './event-hologram-card.js?v=20261026-lod';
import {E3_SAME_DAY_GREEN} from './e3-lod.js';

// E3 Step 4 (Same Day Vortex) and Step 5 (Double Stack).
// Several launched events at one venue stack as rings above the venue and share
// one beam. One night gives the vortex. Several nights stack tip to tip at a waist.
// Units are screen pixels at scale 1; every gap is multiplied by the stack scale.
const BASE_GAP=34,PITCH_GAP=14,WAIST_GAP=9,COUNT_GAP=10,COUNT_HEIGHT=30,SCREEN_TOP=56;

export function venueStackKey(properties){
 if(properties.venueWaypointKey)return `venue:${properties.venueWaypointKey}`;
 return properties.venueName?`name:${properties.venueName}`:null;
}
export function stackNight(properties){return properties.eventNight||properties.eventDay||'';}

function layoutAt(nights,anchor,s){
 const H=EVENT_CARD_HEIGHT*s,pitch=H+(EVENT_CLOCK_HEIGHT+PITCH_GAP)*s;
 let edge=anchor.y-BASE_GAP*s,lastTop=edge;
 const slots=[],waists=[],groups=[];
 nights.forEach((group,gi)=>{
  // Each later night starts just above the previous night's top ring, tip to tip.
  if(gi>0){waists.push(lastTop-WAIST_GAP*s);edge=lastTop-2*WAIST_GAP*s;}
  const items=group.items.map((member,i)=>{
   const card=eventCardGeometry(anchor.x,edge-H/2-i*pitch,s);
   slots.push({key:member.key,card});
   return {...member,card};
  });
  lastTop=edge-H-(items.length-1)*pitch;
  groups.push({night:group.night,items});
 });
 const countTop=lastTop-(COUNT_GAP+COUNT_HEIGHT)*s;
 return {
  kind:nights.length>1?'double':'vortex',anchor,s,slots,waists,groups,
  bottomEdge:anchor.y-BASE_GAP*s,topEdge:lastTop,
  beamCard:groups[0].items[0].card,
  countdown:{x:anchor.x,top:countTop,height:COUNT_HEIGHT*s,width:Math.max(64,92*s)}
 };
}

// members: [{key,startsAt,night,card}] for one venue, card = the card the event would have drawn alone.
// Returns null when the stack cannot fit below the top of the screen.
export function planVenueStack(members,anchor){
 const sorted=[...members].sort((a,b)=>(a.startsAt??Infinity)-(b.startsAt??Infinity)||String(a.key).localeCompare(String(b.key)));
 const nights=[];
 for(const member of sorted){
  let group=nights.find(entry=>entry.night===member.night);
  if(!group){group={night:member.night,items:[]};nights.push(group);}
  group.items.push(member);
 }
 nights.sort((a,b)=>String(a.night).localeCompare(String(b.night)));
 let s=sorted.reduce((sum,member)=>sum+member.card.scale,0)/sorted.length;
 if(!(s>0)||anchor.y-SCREEN_TOP<40)return null;
 let layout=layoutAt(nights,anchor,s);
 // Every offset scales with s, so one proportional shrink fits the stack under the screen top.
 if(layout.countdown.top<SCREEN_TOP){
  s*=(anchor.y-SCREEN_TOP)/(anchor.y-layout.countdown.top);
  layout=layoutAt(nights,anchor,s);
 }
 return layout;
}

// Plans every venue with two or more launched events and moves their cards onto the stack.
// Cards that are not in a stack keep their own geometry and their own beam.
export function planVenueStacks(beacons,eventCards,anchorFor,colorFor){
 const byVenue=new Map();
 for(const item of beacons){
  const {feature}=item,venue=venueStackKey(feature.properties),card=eventCards.get(feature.properties.key);
  if(!venue||!card)continue;
  if(!byVenue.has(venue))byVenue.set(venue,[]);
  byVenue.get(venue).push({key:feature.properties.key,startsAt:feature.properties.startsAtMs,night:stackNight(feature.properties),phase:feature.properties.phase,card,offset:item.offset,item});
 }
 const stacks=[],members=new Map();
 for(const list of byVenue.values()){
  if(list.length<2)continue;
  const first=list[0].item,plan=planVenueStack(list,anchorFor(first));
  if(!plan)continue;
  plan.color=colorFor(first);plan.phase=list[0].phase;
  plan.members=list.map(member=>({key:member.key,offset:member.offset,startsAt:member.startsAt,name:member.item.feature.properties.name||''}));
  // A stack with a same-day night is the green vortex and carries the spinning name ring.
  plan.sameDay=list.some(member=>Boolean(member.item.plan?.countdown));
  if(plan.sameDay)plan.color=E3_SAME_DAY_GREEN;
  plan.names=plan.members.map(member=>member.name).filter(Boolean).join(' · ').toUpperCase();
  for(const slot of plan.slots){
   const original=eventCards.get(slot.key);
   eventCards.set(slot.key,{...slot.card,key:slot.key,opacity:original.opacity,locked:original.locked,far:original.far});
   members.set(slot.key,plan);
  }
  stacks.push(plan);
 }
 return {stacks,members};
}

function stackCountdown(members,now){
 const next=Math.min(...members.map(member=>Number.isFinite(member.startsAt)?member.startsAt:Infinity));
 if(!Number.isFinite(next))return '';
 const remaining=next-now;
 if(remaining<=0)return 'LIVE';
 const minutes=Math.floor(remaining/60000),days=Math.floor(minutes/1440),hours=Math.floor((minutes%1440)/60),mins=minutes%60;
 const pad=value=>String(value).padStart(2,'0');
 return days?`${pad(days)}d:${pad(hours)}h`:`${pad(hours)}h:${pad(mins)}m`;
}

function averageAlpha(members){
 return members.reduce((sum,member)=>sum+(member.offset?.cardAlpha??0),0)/Math.max(1,members.length);
}

// Tilted text rings that spin around a point (E3 Step 4). Ported from the Mapz same-day work (PR #49, drawEventVortex).
export const VORTEX_TILT=Math.sin(16*Math.PI/180);
export function drawVortexTextRing(ctx,cx,cy,tiers,color,seconds=0,reduced=false,alpha=1){
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
 for(const tier of tiers){
  const {r,y=0,text='',n=12,fs=14,speed=5,dir=1,ink='#ffffff'}=tier;
  const ry=r*VORTEX_TILT,ringCy=cy+y;
  ctx.globalAlpha=alpha*.75;ctx.strokeStyle=color;ctx.lineWidth=1.5;
  ctx.shadowColor=color;ctx.shadowBlur=10;
  ctx.beginPath();ctx.ellipse(cx,ringCy,r,ry,0,0,Math.PI*2);ctx.stroke();
  ctx.shadowBlur=0;
  const chars=[...(text||'')];
  if(!chars.length)continue;
  const turn=reduced?0:(seconds/speed)*Math.PI*2*dir;
  ctx.font=`900 ${fs}px 'Barlow Condensed', sans-serif`;
  ctx.fillStyle=ink;
  for(let i=0;i<n;i++){
   const a=i/n*Math.PI*2+turn,ch=chars[i%chars.length];
   const depth=(Math.sin(a)+1)/2;
   ctx.globalAlpha=alpha*(.25+.75*depth);
   ctx.save();ctx.translate(cx+Math.cos(a)*r,ringCy+Math.sin(a)*ry);
   ctx.fillText(ch,0,0);ctx.restore();
  }
 }
 ctx.restore();
}

// Draws beams, vortex bases, rings, waists and the countdown. Cards stay DOM labels.
export function drawVenueStacks(ctx,stacks,{dpr=1,fade=1,beam,seconds=0,now=0,reduced=false}={}){
 if(!stacks.length||!beam)return;
 ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
 for(const stack of stacks){
  const alpha=fade*averageAlpha(stack.members);
  if(!(alpha>.002)||!(stack.s>0))continue;
  const s=stack.s,c=stack.color,ax=stack.anchor.x,ay=stack.anchor.y,spin=reduced?0:seconds;
  ctx.globalAlpha=alpha;
  // One beam from the venue base into the lowest ring.
  beam.draw(ctx,stack.beamCard,stack.anchor,seconds,stack.phase,reduced,c);
  // Spinning vortex feeding the beam at the base.
  ctx.save();ctx.strokeStyle=c;ctx.lineWidth=Math.max(.8,1.2*s);
  for(let ring=0;ring<3;ring++){
   ctx.globalAlpha=alpha*(.8-ring*.2);
   ctx.setLineDash([Math.max(2,4*s),Math.max(3,6*s)]);
   ctx.lineDashOffset=-spin*(22+ring*11)*(ring%2?-1:1);
   ctx.beginPath();ctx.ellipse(ax,ay,28*s*(1-ring*.27),8.5*s*(1-ring*.27),0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
  // Each event is a ring: a dashed orbit under its card, so the stack reads as tiers.
  ctx.save();ctx.strokeStyle=c;ctx.lineWidth=Math.max(.8,1.3*s);ctx.setLineDash([3*s+1,5*s+2]);
  for(const slot of stack.slots){
   const card=slot.card,w=card.right-card.left;
   ctx.globalAlpha=alpha*.7;ctx.lineDashOffset=-spin*30;
   ctx.beginPath();ctx.ellipse(card.x,card.bottom-2*s,w*.72,w*.16,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
  // Waist joins the stacks: a glowing pulse with a spinning ring. Double stacks have one per join.
  for(const wy of stack.waists){
   ctx.save();ctx.globalAlpha=alpha*(reduced?.8:.6+.4*Math.sin(seconds*3.1+wy*.05));ctx.globalCompositeOperation='screen';
   const glow=ctx.createRadialGradient(ax,wy,0,ax,wy,22*s);
   glow.addColorStop(0,'#ffffff');glow.addColorStop(.28,c);glow.addColorStop(1,c+'00');
   ctx.fillStyle=glow;ctx.fillRect(ax-22*s,wy-22*s,44*s,44*s);
   ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(.8,1.1*s);ctx.setLineDash([4*s+1,4*s+1]);ctx.lineDashOffset=-spin*40;
   ctx.beginPath();ctx.ellipse(ax,wy,20*s,6*s,0,0,Math.PI*2);ctx.stroke();
   ctx.restore();
  }
  // Thin spine carries the light up through the gaps between rings.
  ctx.save();ctx.globalAlpha=alpha*.55;
  const spine=ctx.createLinearGradient(0,stack.bottomEdge,0,stack.topEdge);
  spine.addColorStop(0,c);spine.addColorStop(1,c+'00');
  ctx.strokeStyle=spine;ctx.lineWidth=Math.max(.8,1.4*s);
  ctx.beginPath();ctx.moveTo(ax,stack.bottomEdge);ctx.lineTo(ax,stack.topEdge);ctx.stroke();
  ctx.restore();
  // E3 Step 4: the name ring spins around the beam base, tilted to match the rings.
  if(stack.sameDay&&stack.names)drawVortexTextRing(ctx,ax,ay,[{r:46*s,y:0,text:stack.names,n:34,fs:Math.max(9,10*s),speed:6,dir:1,ink:'#ffffff'}],c,seconds,reduced,alpha);
  // Countdown sits on the top of the stack and reads the soonest event.
  const box=stack.countdown,text=stackCountdown(stack.members,now),left=box.x-box.width/2;
  ctx.save();ctx.globalAlpha=alpha;
  ctx.fillStyle='#05090e';ctx.strokeStyle=c;ctx.lineWidth=Math.max(1,1.5*s);ctx.shadowColor=c;ctx.shadowBlur=Math.max(4,10*s);
  ctx.fillRect(left,box.top,box.width,box.height);ctx.strokeRect(left+.5,box.top+.5,box.width-1,box.height-1);
  ctx.shadowBlur=0;ctx.fillStyle=c;ctx.fillRect(left+3*s,box.top+box.height-2*s,box.width-6*s,Math.max(1,2*s));
  if(text){
   ctx.fillStyle='#ffffff';ctx.font=`900 ${Math.max(9,15*s)}px "Barlow Condensed","Arial Narrow",sans-serif`;
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,box.x,box.top+box.height/2+1);
  }
  ctx.restore();
 }
 ctx.restore();
}
