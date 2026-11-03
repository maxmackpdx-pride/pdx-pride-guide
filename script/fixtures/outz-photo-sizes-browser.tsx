import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import OutzSmallCard from '@/components/home/OutzSmallCard';
import TodayLocationCard from '@/components/home/TodayLocationCard';
import {OutzPhoto,type OutzPhotoData} from '@/components/outz/OutzPhoto';
import '@/index.css';
import '@/components/cards/CardAPI.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';
const original=new URLSearchParams(location.search).has('original');
const photo:OutzPhotoData={src:'assets/photos/qa-original.webp',width:1600,height:1000,
 overlaySrc:'assets/photos/qa-overlay-original.webp',rank:30,position:'40% 60%',
 variants:original?undefined:[{src:'assets/photos/qa-640.webp',width:640},{src:'assets/photos/qa-1280.webp',width:1280},{src:'assets/photos/qa-original.webp',width:1600}],
 overlayVariants:original?undefined:[{src:'assets/photos/qa-overlay-640.webp',width:640},{src:'assets/photos/qa-overlay-1280.webp',width:1280},{src:'assets/photos/qa-overlay-original.webp',width:1600}]};
const destination={key:'outz:qa-no-blend',name:'QA destination',room:'OutZide' as const,detail:'Local fixture',href:'/outzide',kind:'trail',photo};
function Fixture(){return <>
 <div id="small"><OutzSmallCard location={destination}/></div>
 {(['small','tall','wide'] as const).map(size=><div key={size} id={'today-'+size}><TodayLocationCard location={destination} size={size}/></div>)}
 <div id="hero"><OutzPhoto className="outz-hero__photo" photo={{...photo,variants:undefined,overlayVariants:undefined}}/></div>
 <div id="default-responsive"><OutzPhoto className="outz-hero__photo" photo={photo}/></div>
 <div id="unsafe"><OutzPhoto photo={{src:'https://example.invalid/private.jpg'}}/></div>
 </>}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider><Fixture/></ThemeProvider></AuthProvider></QueryClientProvider>);
