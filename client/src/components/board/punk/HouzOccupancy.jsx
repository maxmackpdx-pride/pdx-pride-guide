import React,{useEffect,useRef,useState} from 'react';
import frames from './face-manifest.json';
import {housingFaceMembers,visibleHousingFaceSlots} from './houz-model';

function seed(text){return Array.from(String(text)).reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261)}

export function HouzOccupancy({post,occupancy,small,cardRef}){
  const members=housingFaceMembers(post),looking=post.intent==='looking';
  const {visible:slots,hiddenPeople,hiddenOpen}=visibleHousingFaceSlots(post);
  const hidden=hiddenPeople+hiddenOpen;
  const ref=useRef(null);
  const [facePosition,setFacePosition]=useState({left:230,top:88});
  useEffect(()=>{
    if(small||!ref.current||!cardRef.current)return;
    const card=cardRef.current,group=ref.current,title=card.querySelector('.body h2');
    const faces=group.querySelector('.occupancy-faces'),counter=group.querySelector('.occupancy-count');
    const price=card.querySelector('.rate'),heart=card.querySelector('footer .save'),kicker=card.querySelector('.kicker');
    if(!faces||!title||!price||!heart||(!looking&&!counter))return;
    let alive=true,raf;
    const measure=()=>{
      if(!alive)return;
      const groupBox=group.getBoundingClientRect(),faceBox=faces.getBoundingClientRect();
      const counterBox=counter?.getBoundingClientRect(),heartBox=heart.getBoundingClientRect();
      const titleLines=Array.from(title.querySelectorAll('.cut-line'),line=>line.getBoundingClientRect());
      const titleTop=titleLines.length?Math.min(...titleLines.map(line=>line.top)):title.getBoundingClientRect().top;
      const titleBottom=titleLines.length?Math.max(...titleLines.map(line=>line.bottom)):title.getBoundingClientRect().bottom;
      const scaleX=groupBox.width/group.clientWidth,scaleY=groupBox.height/group.clientHeight;
      // Give Looking its own portrait position beside the center of the user title.
      // Anchor to the approved 2 IN / 4 and 1 OPEN / 4 paper widths, so changing
      // counter digits cannot shift the portrait center sideways.
      const counterAnchorLeft=looking?0:(counterBox.right-groupBox.left)/scaleX-(post.intent==='forming'?65.02:76.79);
      const centerX=looking?group.clientWidth*.76+3:(counterAnchorLeft+(heartBox.right-groupBox.left)/scaleX)/2+3;
      const left=centerX-faceBox.width/(2*scaleX);
      const titleCenter=((titleTop+titleBottom)/2-groupBox.top)/scaleY;
      // Keep the approved center, independent of the number of portrait rows.
      // 57.6px is the previous stack's half-height (96px at the locked 1.2 scale).
      const householdCenter=looking?0:Math.min(
        ((price.getBoundingClientRect().bottom+titleBottom)/2-groupBox.top)/scaleY-3,
        (counterBox.top-groupBox.top)/scaleY-10-57.6
      );
      const top=(looking?titleCenter:householdCenter)-faceBox.height/(2*scaleY);
      setFacePosition(old=>Math.abs(old.top-top)<.05&&Math.abs(old.left-left)<.05?old:{left,top});
    };
    const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(measure)};
    const resize=new ResizeObserver(schedule);[title,faces,counter,price,heart,kicker].filter(Boolean).forEach(node=>resize.observe(node));
    const changes=new MutationObserver(schedule);changes.observe(title,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['style']});
    document.fonts.ready.then(schedule);schedule();
    return()=>{alive=false;cancelAnimationFrame(raf);resize.disconnect();changes.disconnect()};
  },[small,looking,post.title,members.length,slots.length,occupancy?.count,occupancy?.total,cardRef]);
  const base=seed(post.key||post.id);
  return <div ref={ref} className="houz-occupancy" data-placement={small?undefined:looking?'looking':'balanced'} style={small?undefined:{'--faces-top':`${facePosition.top}px`,'--faces-left':`${facePosition.left}px`}} aria-label={occupancy?`${occupancy.count} ${occupancy.label.toLowerCase()} out of ${occupancy.total}`:`${members.length} ${members.length===1?'person':'people'} looking to rent`}>
    {!small&&slots.length>0&&<div className="occupancy-faces" data-layout={slots.length===5?'two-over-three':slots.length===4?'two-over-two':slots.length===3?'pyramid':'row'}>{slots.map((member,i)=>{
      const frame=frames.assets[(base+i)%frames.assets.length];
      const motion=seed(`${base}:face-motion:${member.slotKey||i}`);
      const shadow=seed(`${base}:${member.photo||member.name||i}`)%2?'accent':'cyan';
      return <span className="occupancy-paper-face" data-open={member.open?'true':undefined} data-paper-frame={frame.id} data-paper-shadow={shadow} key={member.slotKey||i} aria-label={member.open?'Open spot':undefined} style={{'--face-duration':`${4.2+(motion%23)/10}s`,'--face-delay':`${-((motion>>>6)%60)/10}s`,'--face-lift':`${1.2+(motion%5)/10}px`,'--face-paper':`url('${frame.src}')`,'--face-paper-backing':`url('${frame.backing}')`,'--face-paper-shadow':shadow==='cyan'?'var(--c)':'var(--secondary)'}}>{member.open?<span className="occupancy-open-portrait"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="12" r="6"/><path d="M8 39v-9c0-8 5-12 12-12s12 4 12 12v9"/></svg><strong>OPEN</strong></span>:<img src={member.photo} alt={member.name}/>}</span>;
    })}{hidden>0&&<span className="occupancy-paper-face occupancy-paper-more" aria-label={`${hiddenPeople} more people, ${hiddenOpen} more open spots`} title={`${hiddenPeople} more people · ${hiddenOpen} more open spots`} style={{'--face-paper':`url('${frames.assets[(base+3)%frames.assets.length].src}')`}}>+{hidden}</span>}</div>}
    {occupancy&&<div className="occupancy-count"><strong>{occupancy.count}</strong><span>{occupancy.label} <em>/ {occupancy.total}</em></span></div>}
  </div>;
}
