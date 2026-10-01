import { PLACE_ACCENTS } from './placeTokens';
import type { MouseEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PlaceCard } from '@/components/ds';
import { ResourceCardMotif } from '@/components/resources/ResourceCardMotif';
import { directoryFallbackLogo, resolveDirectoryLogo } from '@/lib/directoryLogos';
import { DIRECTORY_TYPE_LABELS } from '@shared/directoryTheme';
import { placeUrl } from '@shared/placeSlug';
import type { Business } from '@/pages/Directory';
import '@/pages/Resources.css';
import './PlaceDiscoveryCard.css';

type PlacePreview = Pick<Business, 'id' | 'name' | 'type'> & Partial<Business>;
export default function PlaceDiscoveryCard({ place, onOpen, onRequireAuth }: {
  place: PlacePreview; onOpen: (element: HTMLElement) => void; onRequireAuth?: () => void;
}) {
  const accent = PLACE_ACCENTS[place.type] || 'var(--neon-cyan)';
  const label = DIRECTORY_TYPE_LABELS[place.type] || place.type;
  const open = (event: MouseEvent<HTMLElement>) => onOpen(event.currentTarget.closest<HTMLElement>('.pdxPlace') || event.currentTarget);
  return <div className="placez-card-surface">
    <PlaceCard name={place.name} category={place.type} categoryLabel={label} accentColor={accent}
      variant="full"
      logoUrl={resolveDirectoryLogo(place.name, place.imageUrl) || undefined} fallbackLogoUrl={directoryFallbackLogo(place.type)}
      businessId={place.id} isFollowing={Boolean(place.isFollowing)} onRequireAuth={onRequireAuth}
      shareUrl={placeUrl(place.id, place.name)}
      categoryTags={[{id:place.type,name:label,color:accent},...(place.queerOwned ? [{id:'owned',name:'Queer owned',color:'var(--neon-yellow)'}] : [])]}
      className="rg-directory-card placez-discovery-card pdxPlace--clickable"
      decoration={<><div className="rg-card-vignette" aria-hidden="true"/><div className="pdx-refract-seam rg-card-top-rule" aria-hidden="true"/><ResourceCardMotif name={place.name} category={`place-${place.type}`}/></>}
      onClick={open}
      footer={<div className="rg-directory-footer placez-discovery-footer" onClick={event=>event.stopPropagation()}>
        <p className="placez-discovery-meta">{place.neighborhood || 'Portland metro'}</p>
        <button type="button" className="pdx-glass-rebind pdxBtn" aria-label={`View details for ${place.name}`} onClick={open}>View details <ArrowUpRight size={18}/></button>
      </div>}
    />
  </div>;
}
