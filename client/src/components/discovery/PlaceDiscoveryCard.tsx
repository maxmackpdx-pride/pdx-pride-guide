import { ServiceNameMark } from "@/components/ServiceNameMark";
import { serviceArtwork } from "@shared/serviceIdentity";
import { directoryCardCategoryLabel, directorySubcategories } from '@shared/directorySubcategories';
import { PLACE_ACCENTS } from './placeTokens';
import { useId, type CSSProperties, type MouseEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PlaceCard } from '@/components/ds';
import { PlacezXerox } from '@/components/xerox/Overlays';
import { ResourceCardMotif } from '@/components/resources/ResourceCardMotif';
import { resolveDirectoryLogo } from '@/lib/directoryLogos';
import { placeUrl } from '@shared/placeSlug';
import type { Business } from '@/pages/Directory';
import '@/pages/Resources.css';
import './PlaceDiscoveryCard.css';

type PlacePreview = Pick<Business, 'id' | 'name' | 'type'> & Partial<Business>;
export default function PlaceDiscoveryCard({ place, onOpen, onRequireAuth }: {
  place: PlacePreview; onOpen: (element: HTMLElement) => void; onRequireAuth?: () => void;
}) {
  const logoInkId = `placez-logo-ink-${useId().replace(/:/g, '')}`;
  const accent = PLACE_ACCENTS[place.type] || 'var(--neon-cyan)';
  const label = directoryCardCategoryLabel(place);
  const serviceTags = place.type === 'service' ? directorySubcategories(place) : [];
  const open = (event: MouseEvent<HTMLElement>) => onOpen(event.currentTarget.closest<HTMLElement>('.pdxPlace') || event.currentTarget);
  return <PlacezXerox accent={accent}><div className="placez-card-surface" style={{ '--placez-logo-ink-filter': `url(#${logoInkId})` } as CSSProperties}>
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs><filter id={logoInkId} colorInterpolationFilters="sRGB">
        {/* Remove low-alpha glow baked into the logo while retaining its authored contour. */}
        <feComponentTransfer><feFuncA type="linear" slope="4" intercept="-1.2" /></feComponentTransfer>
      </filter></defs>
    </svg>
    <PlaceCard name={place.name} category={place.type} categoryLabel={label} accentColor={accent}
      variant="full"
      logoUrl={serviceArtwork(place, resolveDirectoryLogo(place.name, place.imageUrl), true) || undefined} logoFallback={<ServiceNameMark source={place} iconOnly />}
      businessId={place.id} isFollowing={Boolean(place.isFollowing)} onRequireAuth={onRequireAuth}
      shareUrl={placeUrl(place.id, place.name)}
      categoryTags={[...(serviceTags.length ? serviceTags.slice(0,2).map(tag => ({id:tag.id,name:tag.label,color:accent})) : [{id:place.type,name:label,color:accent}]),...(place.queerOwned ? [{id:'owned',name:'Queer owned',color:accent}] : [])]}
      className="rg-directory-card placez-discovery-card pdxPlace--clickable"
      decoration={<><div className="rg-card-vignette" aria-hidden="true"/><div className="pdx-refract-seam rg-card-top-rule" aria-hidden="true"/><ResourceCardMotif glass name={place.name} category={`place-${place.type}`}/></>}
      onClick={open}
      footer={<div className="rg-directory-footer placez-discovery-footer">
        <p className="placez-discovery-meta">{place.neighborhood || 'Portland metro'}</p>
        <button type="button" className="pdx-glass-rebind pdxBtn" aria-label={`View details for ${place.name}`} onClick={event=>{event.stopPropagation();open(event);}}>View details <ArrowUpRight size={18}/></button>
      </div>}
    />
  </div></PlacezXerox>;
}
