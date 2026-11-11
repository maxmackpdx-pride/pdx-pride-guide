import {personImage} from './personImage';
import PlaceTalent from './PlaceTalent';
import type {PlaceTalentData} from './talentData';
export interface PlacePerson {id:string;name:string;role?:string;avatarUrl?:string;profileHref?:string;}
export interface PeopleGroup {status:'available'|'empty'|'unavailable';people:PlacePerson[];message?:string;}
export type OwnerTitle='Boss'|'Owner'|'King'|'Queen';
export interface PlacePeopleData {venueId:number;checkedAt:string;owner?:PeopleGroup & {displayTitle?:OwnerTitle};staff:PeopleGroup;promoters:PeopleGroup;}

function Group({title,group}:{title:string;group?:PeopleGroup}){
 const people=group?.status==='available'?group.people:[];
 return <section className="pz-people-group"><div className="pz-section-heading"><h3>{title}</h3>{people.length>0&&<span>{people.length} listed</span>}</div>
 {people.length?<><div className="pz-face-stack" aria-hidden="true">{people.slice(0,6).map(p=><span className="pz-face" key={p.id}>{p.avatarUrl?<img src={personImage(p.avatarUrl)} alt=""/>:<span>{p.name.split(/\s+/).slice(0,2).map(n=>n[0]).join('')}</span>}</span>)}{people.length>6&&<span className="pz-face pz-face-more">+{people.length-6}</span>}</div><ul className="pz-people-list">{people.map(p=><li key={p.id}>{p.profileHref?<a href={p.profileHref} rel="noreferrer">{p.name}<span aria-hidden="true">↗</span></a>:<strong>{p.name}</strong>}{p.role&&<small>{p.role}</small>}</li>)}</ul></>:<div className="pz-people-empty"><svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><circle cx="16" cy="10" r="5"/><path d="M6 28v-3a10 10 0 0 1 20 0v3"/></svg><p>{group?.message||(group?.status==='empty'?`No public ${title.toLowerCase()} listed for this place.`:`Public ${title.toLowerCase()} details are not available in this snapshot.`)}</p></div>}
 </section>;
}
export default function PlacePeople({data,venueId,talent,previewNow}:{data?:PlacePeopleData;venueId:number;talent?:PlaceTalentData;previewNow?:number}){
 const now=previewNow??Date.now(),checked=Date.parse(data?.checkedAt||'');
 const verified=data?.venueId===venueId&&Number.isFinite(checked)&&checked<=now&&now-checked<=86400000?data:undefined;
 return <div className="pz-people-page"><Group title={verified?.owner?.displayTitle&&['Boss','Owner','King','Queen'].includes(verified.owner.displayTitle)?verified.owner.displayTitle:'Owner'} group={verified?.owner}/><Group title="Staff" group={verified?.staff}/><Group title="Promoters" group={verified?.promoters}/><PlaceTalent show="past" data={talent} venueId={venueId} previewNow={previewNow}/><p className="pz-people-note">Only public, venue-linked profiles appear here.</p></div>;
}
