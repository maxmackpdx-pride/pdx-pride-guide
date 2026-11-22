import React, {lazy,Suspense,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './native-map-lifetime';
import {useIncidentalMap} from '@/hooks/useIncidentalMap';
import {PlaceCardMap} from '@/components/ds/PlaceCardMap';
const DirectoryMap=lazy(()=>import('@/components/DirectoryMap'));
const OutzMap=lazy(()=>import('@/components/OutzMap'));
function Maps(){
 const [open,setOpen]=useState(false),[slide,setSlide]=useState(false);
 const kind=new URLSearchParams(location.search).get('kind')||'directory';const map=useIncidentalMap(open&&slide);
 return <><style>{`.directory-map-wrap,.outz-map__canvas{height:100%}.pdxPlaceMap{display:contents}.pdxPlaceMap__well{height:0;position:relative;overflow:hidden}.pdxPlaceMap--expanded .pdxPlaceMap__well{height:230px}.pdxPlaceMap__live{position:absolute;inset:0}.pdxPlaceMap__caption,.pdxPlaceMap__pin{position:relative;pointer-events:none}`}</style>
 <button id="toggle" onClick={()=>setOpen(v=>!v)}>Toggle</button><button id="slide" onClick={()=>setSlide(v=>!v)}>Artwork / map</button><div style={{height:1800}}/>
 {kind==='card'?<div id="slot" style={{width:360}}><PlaceCardMap name="Fixture" latitude={45.5} longitude={-122.6} expanded={open} onToggle={()=>setOpen(v=>!v)}/></div>:<div id="slot" ref={map.ref} style={{height:260,width:360,position:'relative'}}>{map.active&&<Suspense fallback={<span role="status">Loading map</span>}>{kind==='outz'?<OutzMap cameraMemory={map.memory} destinations={[]} catalog={[]} center={[45.5,-122.6]} zoom={11} minimal/>:<DirectoryMap cameraMemory={map.memory} height="100%" businesses={[]} minimap focusBusiness/>}</Suspense>}</div>}<div style={{height:1800}}/></>;
}
function App(){const [mounted,setMounted]=useState(true);(window as any).setMounted=setMounted;return mounted?<Maps/>:null;}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
