import {useEffect, useState} from 'react';
import {useLocation,useSearch} from 'wouter';
import ProfileWidgetGrid,{type ProfileSection} from './ProfileWidgetGrid';
import './ProfileContent.css';
export type ProfileRoom='overview'|'stash'|'events'|'boardz'|'people'|'media';
export type ProfileChapter=ProfileSection & {room:Exclude<ProfileRoom,'overview'>|'about'};
const rooms:[ProfileRoom,string][]=[['overview','Overview'],['stash','The Stash'],['events','Eventz'],['boardz','BoardZ'],['people','People'],['media','Media']];
export default function ProfileContent({username,sections}:{username:string;sections:ProfileChapter[]}) {
 const search=useSearch();const [,navigate]=useLocation();
 const selected=new URLSearchParams(search).get('view');
 const room:ProfileRoom=rooms.some(([id])=>id===selected)?selected as ProfileRoom:'overview';
 const [announcement,setAnnouncement]=useState('');
 useEffect(()=>setAnnouncement(`${rooms.find(([id])=>id===room)?.[1]} selected`),[room]);
 const shown=room==='overview'?sections:sections.filter(section=>section.room===room);
 function select(next:ProfileRoom) {const params=new URLSearchParams(search);if(next==='overview')params.delete('view');else params.set('view',next);navigate(`/u/${encodeURIComponent(username)}${params.size?`?${params}`:''}`,{replace:true});}
 return <section className="pp-chapters" aria-label="Explore this profile">
  <nav className="pp-chapters__nav" aria-label="Profile areas">{rooms.map(([id,label])=><button key={id} type="button" aria-current={room===id?'page':undefined} onClick={()=>select(id)}>{label}</button>)}</nav>
  <p className="sr-only" role="status">{announcement}</p>
  <div className="pp-chapters__content" key={room}>
   {shown.length?<ProfileWidgetGrid key={`${username}:${room}`} username={username} sections={shown} arrangeable={room==='overview'}/>:<div className="pp-chapters__empty"><h2>{rooms.find(([id])=>id===room)?.[1]}</h2><p>Nothing shared here yet.</p><button type="button" onClick={()=>select('overview')}>Back to overview</button></div>}
  </div>
 </section>;
}
