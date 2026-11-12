import {useEffect,useState} from 'react';
import {personImage} from './personImage';
import {talentGroups,talentTiming,type PlaceTalentData,type PublicTalentCredit} from './talentData';
export function TalentCard({credit,past,now}:{credit:PublicTalentCredit;past:boolean;now:number}) {
  const [color,setColor]=useState(false),person=credit.person;
  return <article className={`pz-talent-card${past?' pz-talent-card--past':''}`} data-color={color?'true':'false'}>
    <div className="pz-talent-face">{person.avatarUrl?<img src={personImage(person.avatarUrl)} alt={`${person.name} profile photo`}/>:<span aria-label={`${person.name}, initials only`}>{person.name.split(/\s+/).slice(0,2).map(n=>n[0]).join('')}</span>}</div>
    {person.profileHref?<a className="pz-talent-name" href={person.profileHref} rel="noreferrer">{person.name}</a>:<strong className="pz-talent-name">{person.name}</strong>}
    <small>{past?'Past event':talentTiming(credit,now)==='now'?'Happening now':'Upcoming'}</small><p>{credit.eventTitle}</p>
    {past&&<button type="button" className="pz-talent-color" aria-pressed={color} onClick={()=>setColor(!color)}>{color?'Color pinned':'Keep color'}</button>}
  </article>;
}
export default function PlaceTalent({data,venueId,previewNow,show='all'}:{data?:PlaceTalentData;venueId:number;previewNow?:number;show?:'all'|'active'|'past'}) {
  const [clock,setClock]=useState(()=>previewNow??Date.now());
  useEffect(()=>{
    if(previewNow!==undefined){setClock(previewNow);return;}
    let timer:ReturnType<typeof setTimeout>|undefined;const tick=()=>{clearTimeout(timer);setClock(Date.now());if(!document.hidden)timer=setTimeout(tick,60000-Date.now()%60000);};
    tick();document.addEventListener('visibilitychange',tick);return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',tick);};
  },[previewNow]);
  const groups=talentGroups(data,venueId,clock);
  return <>{[{title:'Talent · now + upcoming',past:false,credits:groups.active},{title:'Past talent',past:true,credits:groups.past}].filter(group=>show==='all'||(show==='past')===group.past).map(group=><section className="pz-talent-section" key={group.title}><div className="pz-section-heading"><h3>{group.title}</h3></div>
    {group.credits.length?<div className="pz-talent-rail" aria-label={group.title}>{group.credits.map(credit=><TalentCard key={credit.person.id} credit={credit} past={group.past} now={clock}/>)}</div>:<p className="pz-talent-empty">{groups.available?'No public talent profiles linked to these events.':data?.message||'Public event-to-talent profiles are not available in this snapshot.'}</p>}
    {group.past&&<p className="pz-people-note">Past photos turn to color on hover or focus. Use Keep color on touch.</p>}
  </section>)}</>;
}
