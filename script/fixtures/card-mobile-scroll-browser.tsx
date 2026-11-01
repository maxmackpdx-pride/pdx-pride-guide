/** Real Directory and navigation shells; inert nav labels and mocked APIs only. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import Directory from '@/pages/Directory';
import {NavShell} from '@/components/ui/nav-shell';
import {MobileDockShell} from '@/components/ui/mobile-dock-shell';
import '@/index.css';
import '@/components/nav.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider><NavShell><div className="site-hub-mtop"><span>Navigation fixture</span></div></NavShell><Directory/><MobileDockShell activeIndex={0} location="/directory"><button type="button">Home</button><button type="button">Places</button><button type="button">Profile</button></MobileDockShell></ThemeProvider></AuthProvider></QueryClientProvider>);
