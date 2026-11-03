import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import EventLocationMap from '@/components/EventLocationMap';
import '@/components/EventModal.approved.css';
function Fixture(){const [open,setOpen]=useState(false),[scheduled,setScheduled]=useState(false);return <><button id="toggle" onClick={()=>setOpen(v=>!v)}>Toggle location</button><div style={{height:1800}}/><div className="event-modal--approved" id="slot" style={{width:360}}>{open&&<EventLocationMap event={{id:100,title:'Event map test',venueName:'Fixture venue',address:'123 Main St',lat:45.52,lng:-122.67,isPrivate:false} as any} primary="#00ffff" complementary="#ccff00" scheduled={scheduled} schedulePending={false} onSchedule={()=>setScheduled(v=>!v)}/>}</div><div style={{height:1800}}/></>;}
createRoot(document.getElementById('root')!).render(<Fixture/>);
