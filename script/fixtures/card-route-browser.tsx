import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import Resources from '@/pages/Resources';
import Boards from '@/pages/Boards';
import Directory from '@/pages/Directory';
import AdultContentGate from '@/components/AdultContentGate';
import '@/index.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';
// Safety fixture uses the production adult gate but never loads private chat records.
function AdultGateFixture() {
  const [declined,setDeclined]=React.useState(false);
  if(declined)return <p data-testid="adult-gate-declined">Entry declined</p>;
  return <AdultContentGate onDecline={()=>setDeclined(true)}><p data-testid="adult-chat-content">Synthetic gated chat content</p></AdultContentGate>;
}
const Page = location.pathname.includes('adult-gate') ? AdultGateFixture : location.pathname.includes('boards') ? Boards : location.pathname.includes('directory') ? Directory : Resources;
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider><Page/></ThemeProvider></AuthProvider></QueryClientProvider>);
