import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MobileDockShell } from '../../client/src/components/ui/mobile-dock-shell';
import { CompactNavigation } from '../../client/src/components/ui/compact-navigation';
import AuthModal from '../../client/src/components/AuthModal';
import { AuthProvider } from '../../client/src/context/AuthContext';
import '../../client/src/index.css';
import '../../client/src/components/nav.css';
function Fixture() {
  const [auth, setAuth] = useState(false);
  const [closed, setClosed] = useState('');
  const [tab, setTab] = useState(0);
  return <><div id="navigation"><CompactNavigation location="/" onNavigate={() => {}} entries={[
    {type:'link',href:'/',label:'Home',accent:'cyan'},
    {type:'link',href:'/events',label:'Eventz',accent:'lime'},
    {type:'dropdown',id:'boards',label:'Boards',accent:'cyan',items:[{href:'/boardz',label:'All Boards'}]},
  ]}/></div>
    <button id="open-auth" onClick={() => setAuth(true)}>Open account</button>
    <output id="auth-close">{closed}</output>
    {auth && <AuthModal onClose={reason => { setAuth(false); setClosed(reason || 'closed'); }}/>}
    <MobileDockShell activeIndex={tab} location="/">
      <button onClick={() => setTab(0)}>First</button><button onClick={() => setTab(1)}>Second</button>
    </MobileDockShell>
  </>;
}
createRoot(document.getElementById('root')!).render(<AuthProvider><Fixture/></AuthProvider>);
