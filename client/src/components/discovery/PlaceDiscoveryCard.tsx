import { PLACE_ACCENTS } from './placeTokens';
import type { MouseEvent } from 'react';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { PlaceCard } from '@/components/ds';
import { ResourceCardMotif } from '@/components/resources/ResourceCardMotif';
import { directoryFallbackLogo, resolveDirectoryLogo } from '@/lib/directoryLogos';
import { DIRECTORY_TYPE_LABELS } from '@shared/directoryTheme';
import { placeUrl } from '@shared/placeSlug';
import { eventPath } from '@shared/eventSlug';
import { parsePacificDateTime } from '@shared/missedConnections';
import { isGrandOpeningActive } from '@shared/grandOpening';
import { resolveBusinessLocations } from '@shared/businessLocations';
import type { Business } from '@/pages/Directory';
import '@/pages/Resources.css';
import './PlaceDiscoveryCard.css';

type PlacePreview = Pick<Business, 'id' | 'name' | 'type'> & Partial<Business>;
export default function PlaceDiscoveryCard({ place, onOpen, onRequireAuth }: {
  place: PlacePreview; onOpen: (element: HTMLElement) => void; onRequireAuth?: () => void;
}) {
  const accent = PLACE_ACCENTS[place.type] || 'var(--neon-cyan)';
  const label = DIRECTORY_TYPE_LABELS[place.type] || place.type;
  const motif = ({bar:'community',restaurant:'family',cafe:'family',venue:'arts',shop:'money',service:'community',healthcare:'health',realestate:'safety'} as Record<string,string>)[place.type] || 'community';
  const locations = place.locations?.length ? place.locations : resolveBusinessLocations(place);
  const multipleLocations = locations.length > 1;
  const address = multipleLocations
    ? [place.neighborhood, `${locations.length} locations`].filter(Boolean).join(' · ')
    : [place.address, place.neighborhood].filter(Boolean).join(' · ');
  const events = (place.upcomingEvents || []).map(event => {
    const startMs = parsePacificDateTime(event.dateStart);
    const date = startMs == null ? event.dayOfWeek || 'Upcoming' : new Date(startMs).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    return { day: event.dayOfWeek || undefined, date, title: event.title, href: eventPath(event.id, event.title, event.dayOfWeek) };
  });
  const open = (event: MouseEvent<HTMLElement>) => onOpen(event.currentTarget.closest<HTMLElement>('.pdxPlace') || event.currentTarget);
  return <div className="placez-card-surface">
    <PlaceCard name={place.name} category={place.type} categoryLabel={label} accentColor={accent}
      variant="full" address={address || undefined} hours={multipleLocations ? undefined : place.hours || undefined}
      phone={multipleLocations ? undefined : place.phone || undefined} website={place.website || undefined}
      instagram={place.instagram || undefined} donateUrl={place.donateUrl || undefined}
      lat={multipleLocations ? null : place.lat} lng={multipleLocations ? null : place.lng}
      isNonprofit={place.type === 'nonprofit'} grandOpening={isGrandOpeningActive(place.grandOpeningDate)}
      promoters={place.promoters || []} events={events}
      logoUrl={resolveDirectoryLogo(place.name, place.imageUrl) || undefined} fallbackLogoUrl={directoryFallbackLogo(place.type)}
      businessId={place.id} isFollowing={Boolean(place.isFollowing)} onRequireAuth={onRequireAuth}
      description={place.description || 'Explore this place, its details and community activity.'}
      shareUrl={placeUrl(place.id, place.name)}
      categoryTags={[{id:place.type,name:label,color:accent},...(place.queerOwned ? [{id:'owned',name:'Queer owned',color:'var(--neon-yellow)'}] : [])]}
      className="rg-directory-card placez-discovery-card pdxPlace--clickable"
      decoration={<><div className="rg-card-vignette" aria-hidden="true"/><div className="pdx-refract-seam rg-card-top-rule" aria-hidden="true"/><ResourceCardMotif name={place.name} category={motif}/></>}
      onClick={open}
      footer={<div className="rg-directory-footer placez-discovery-footer" onClick={event=>event.stopPropagation()}>
        <p className="placez-discovery-meta">{place.neighborhood || (place.locations && place.locations.length > 1 ? `${place.locations.length} locations` : 'Portland metro')}{Boolean(place.upcomingEvents?.length) && <span><CalendarDays size={15}/>{place.upcomingEvents!.length} upcoming</span>}</p>
        <button type="button" className="pdx-glass-rebind pdxBtn" aria-label={`View details for ${place.name}`} onClick={open}>View details <ArrowUpRight size={18}/></button>
      </div>}
    />
  </div>;
}
