import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import Resources from '@/pages/Resources';
import Boards from '@/pages/Boards';
import Directory from '@/pages/Directory';
import Events from '@/pages/Events';
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
// Test-only measurements around the actual production page tree. This fixture
// intentionally uses synthetic API responses and is not a live-site benchmark.
type RouteProfileCommit = {phase:string;actualDurationMs:number;baseDurationMs:number};
declare global {
  interface Window {
    __zayWholePageProfiler?:RouteProfileCommit[];
    __zayWholePageProfilerEnabled?:boolean;
  }
}
window.__zayWholePageProfiler=[];
window.__zayWholePageProfilerEnabled=false;
const qaRoute=new URLSearchParams(location.search).get('qaRoute') || location.pathname;
const Page = qaRoute.includes('adult-gate') ? AdultGateFixture : qaRoute.includes('boards') ? Boards : qaRoute.includes('directory') ? Directory : qaRoute.includes('events') ? Events : Resources;
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider><React.Profiler id="zay-whole-page" onRender={(_id,phase,actualDurationMs,baseDurationMs)=>{if(window.__zayWholePageProfilerEnabled)window.__zayWholePageProfiler?.push({phase,actualDurationMs,baseDurationMs});}}><Page/></React.Profiler></ThemeProvider></AuthProvider></QueryClientProvider>);
