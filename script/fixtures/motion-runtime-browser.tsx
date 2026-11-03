import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import MapzLayerSheet, { type MapzLayerId } from '../../client/src/components/MapzLayerSheet';
import { MobileDockShell } from '../../client/src/components/ui/mobile-dock-shell';
import { CompactNavigation } from '../../client/src/components/ui/compact-navigation';
import AuthModal from '../../client/src/components/AuthModal';
import { AuthProvider } from '../../client/src/context/AuthContext';
import '../../client/src/index.css';
import '../../client/src/components/nav.css';
function Fixture() {
  const [auth, setAuth] = useState(false);
  const [closed, setClosed] = useState('');
  const [active, setActive] = useState<MapzLayerId | null>('events');
  const [tab, setTab] = useState(0);
  return <><div id="navigation"><CompactNavigation location="/" onNavigate={() => {}} entries={[
    {type:'link',href:'/',label:'Home',accent:'cyan'},
    {type:'link',href:'/events',label:'Eventz',accent:'lime'},
    {type:'dropdown',id:'boards',label:'Boards',accent:'cyan',items:[{href:'/boardz',label:'All Boards'}]},
  ]}/></div>
    <button id="open-auth" onClick={() => setAuth(true)}>Open account</button>
    <output id="auth-close">{closed}</output>
    {auth && <AuthModal onClose={reason => { setAuth(false); setClosed(reason || 'closed'); }}/>}
    <button id="reopen" onClick={() => setActive('events')}>Open</button>
    <MapzLayerSheet active={active} onActiveChange={setActive} layers={[{id:'events',label:'Events',color:'#19e3ff',enabled:true,panel:<p>Events panel</p>,viewMore:[]}]}/>
    <output id="active">{active || 'closed'}</output>
    <MobileDockShell activeIndex={tab} location="/">
      <button onClick={() => setTab(0)}>First</button><button onClick={() => setTab(1)}>Second</button>
    </MobileDockShell>
  </>;
}
createRoot(document.getElementById('root')!).render(<AuthProvider><Fixture/></AuthProvider>);
