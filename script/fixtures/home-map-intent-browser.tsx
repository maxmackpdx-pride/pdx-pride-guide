import React from 'react';
import {createRoot} from 'react-dom/client';
import {useLocation} from 'wouter';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import {InboxSheetProvider} from '@/context/InboxSheetContext';
import {HubPanelProvider} from '@/context/HubPanelContext';
import Home from '@/pages/Home';
import MobileBottomNav from '@/components/MobileBottomNav';
import '@/index.css';
import '@/components/nav.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';
function Fixture(){const [location]=useLocation();return <><a href="/unrelated" id="unrelated">Unrelated</a>{location==='/map'?<h1 id="destination">Map route reached</h1>:<Home/>}<MobileBottomNav/></>;}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider><InboxSheetProvider><HubPanelProvider><Fixture/></HubPanelProvider></InboxSheetProvider></ThemeProvider></AuthProvider></QueryClientProvider>);
