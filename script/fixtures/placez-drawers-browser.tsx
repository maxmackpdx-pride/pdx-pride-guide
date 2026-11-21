/** Fixture for Placez drawer and Yes Coach card screenshots. APIs are mocked. Example data only. */
import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {AuthProvider} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import {NavShell} from '@/components/ui/nav-shell';
import {MobileDockShell} from '@/components/ui/mobile-dock-shell';
import PlacezMapDrawer from '@/components/places/PlacezMapDrawer';
import EventzExpanded from '@/components/events/EventzExpanded';
import type {EventListing} from '@shared/multiDayEvents';
import '@/index.css';
import '@/components/nav.css';
import '@/components/ds/tokens/index.css';
import '@/components/ds/styles.css';

type EaseMap = {
  easeTo: (options: {center: [number, number]; duration?: number}) => void;
  once: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
};

const mapListeners: Record<string, Array<() => void>> = {};
let mapCenter: [number, number] = [-122.6757, 45.5241];
const qaMap: EaseMap = {
  easeTo({center}) {
    mapCenter = center;
    (window as unknown as {__mapCentered?: [number, number]}).__mapCentered = center;
    window.setTimeout(() => { for (const handler of mapListeners.moveend || []) handler(); }, 20);
  },
  once(event, handler) { (mapListeners[event] ||= []).push(handler); },
  off(event, handler) { mapListeners[event] = (mapListeners[event] || []).filter(fn => fn !== handler); },
};
(window as unknown as {__zaylistMap: EaseMap}).__zaylistMap = qaMap;
(window as unknown as {__mapReleaseDiagnostics:{snapshot:() => object}}).__mapReleaseDiagnostics = {
  snapshot: () => ({mode: 'mapz', center: mapCenter, zoom: 15.25, pitch: 45, bearing: 0}),
};

function qaEvent(): EventListing {
  const injected = (window as unknown as {__QA_YES_COACH?: EventListing}).__QA_YES_COACH;
  return injected ?? {
    id: 10,
    title: 'Yes Coach',
    description: 'Example listing used for drawer and card screenshots.',
    venueName: 'Sanctuary',
    address: 'Portland',
    neighborhood: 'Downtown',
    lat: 45.5241,
    lng: -122.6757,
    dateStart: '2099-07-01T21:00:00',
    dateEnd: '2099-07-02T02:00:00',
    dayOfWeek: 'WED',
    ageRequirement: 'ALL_AGES',
    eventTypes: '["party"]',
    admission: 'FREE',
    ticketUrl: null,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: '/posters/tucker-archive/yes-coach-apr-2026.jpg',
    accentColor: null,
    status: 'LIVE',
    source: 'admin_seeded',
    isClaimable: false,
    claimedBy: null,
    submittedBy: null,
    adminNotes: null,
    createdAt: '',
    updatedAt: '',
    lockedFields: '[]',
    lastChangeLabel: null,
    lastChangeAt: null,
  };
}

function MizzedPreview({eventId, title}:{eventId:string; title:string}) {
  return (
    <main className="pdx-glass-rebind" style={{'--c':'var(--room-mizzed)',padding:'24px 18px 120px',minHeight:'100dvh',background:'var(--z-black)',color:'var(--text-hi)'} as React.CSSProperties} data-testid="placez-mizzed-page">
      <p style={{margin:0,font:'700 11px/1 var(--font-mono, monospace)',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--room-mizzed)'}}>Mizzed Connections</p>
      <h1 style={{margin:'10px 0 16px',font:'900 32px/.95 var(--font-display)',textTransform:'uppercase'}}>{title}</h1>
      <p style={{font:'400 14px/1.5 var(--font-body)',color:'var(--text-body)'}}>Filtered to this event. Posts from the Mizzed board that belong to it show here.</p>
      <article style={{marginTop:16,padding:16,border:'1px solid color-mix(in srgb, var(--room-mizzed) 45%, transparent)'}}>
        <strong>Saw you by the merch table</strong>
        <p style={{margin:'8px 0 0',color:'var(--text-body)'}}>Example post linked to event {eventId}.</p>
      </article>
    </main>
  );
}

function YesCoachCard() {
  return (
    <div style={{minHeight:'100dvh',background:'var(--z-black)'}} data-testid="yes-coach-card-stage">
      <EventzExpanded event={qaEvent()} onClose={() => undefined} documentMeta={false} />
    </div>
  );
}

function MapSurface({children}:{children?: React.ReactNode}) {
  return (
    <>
      <NavShell>
        <div className="site-hub-mtop"><span>Navigation fixture</span></div>
      </NavShell>
      <div className="zaylist-unified-map" data-placez-host-drawer="on" style={{minHeight:'100dvh',background:'var(--z-black)'}} />
      <PlacezMapDrawer />
      {children}
      <MobileDockShell activeIndex={0} location="/placez/map">
        <button type="button">Home</button>
        <button type="button">Places</button>
        <button type="button">Profile</button>
      </MobileDockShell>
    </>
  );
}

function OpenMapCard({eventId}:{eventId:string}) {
  const event = Number(eventId) === 10 ? qaEvent() : {
    ...qaEvent(),
    id: Number(eventId) || 10,
    title: Number(eventId) === 12 ? 'Late show' : Number(eventId) === 13 ? 'Tomorrow brunch' : qaEvent().title,
  };
  return (
    <MapSurface>
      <div data-testid="placez-center-open-card">
        <EventzExpanded event={event} onClose={() => undefined} documentMeta={false} startExpanded={true} />
      </div>
    </MapSurface>
  );
}

function Fixture() {
  const [params, setParams] = useState(() => new URLSearchParams(location.search));
  const [path, setPath] = useState(() => location.pathname);
  useEffect(() => {
    if (location.pathname.startsWith('/__drawer-qa') && !location.search.includes('card=') && !location.search.includes('board=mizzed') && !location.pathname.startsWith('/mizzed')) {
      const next = '/placez/map' + (location.search || '');
      window.history.replaceState(window.history.state, '', next);
      setPath('/placez/map');
    }
    const onOpen = () => {
      setParams(new URLSearchParams(location.search));
      setPath(location.pathname);
    };
    window.addEventListener('placez-mizzed-open', onOpen);
    window.addEventListener('popstate', onOpen);
    return () => {
      window.removeEventListener('placez-mizzed-open', onOpen);
      window.removeEventListener('popstate', onOpen);
    };
  }, []);
  const onMizzed = path.includes('/mizzed') || params.get('board') === 'mizzed';
  if (params.get('card')) return <YesCoachCard />;
  if (onMizzed && params.get('event')) return <MizzedPreview eventId={params.get('event') || ''} title="Past dance" />;
  if (params.get('event') && (path === '/placez/map' || path === '/mapz' || path.startsWith('/__drawer-qa'))) {
    return <OpenMapCard eventId={params.get('event') || ''} />;
  }
  return <MapSurface />;
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <Fixture />
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>,
);
