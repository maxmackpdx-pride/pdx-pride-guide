/** Current /api/directory contract, inspected 2026-11-10. No write calls in this adapter. */
export interface DirectoryRecord {
  id: number; name: string; type: string; description?: string | null;
  neighborhood?: string | null; address?: string | null; imageUrl?: string | null;
  hours?: string | null; locations?: Array<{ address?: string | null; phone?: string | null; hours?: string | null; lat?: number | null; lng?: number | null }>;
  queerOwned?: boolean; queerFriendly?: boolean; ownerId?: number | null;
  isFollowing?: boolean; status?: string; active?: boolean;
}
export type PreviewSize = 'square' | 'tall' | 'small' | 'wide-map' | 'expanded';
export type NativeSize = 'tall' | 'small' | 'wide';
export interface LiveStatusEvidence {
  state: 'open' | 'closed'; source: string; checkedAt: string; validUntil: string;
}
export interface PlacePresentation {
  /** Editorial presentation, not API fields. Keep keyed by immutable business id. */
  slug: string; descriptor: string; descriptorSource: string;
  /** Visible venue name when the artwork's logo is not legible on its own. */
  title?: string;
  /** Omit a duplicate title only for a simple, readable name wordmark. */
  logoIsName?: boolean;
  accent: string; heroUrl: string; logoUrl?: string; imageFit?: 'cover'|'contain'; imagePosition?: string; treatmentUrl?: string; cutoutMaskUrl?: string; wideCutoutMaskUrl?: string; wideFadeMaskUrl?: string; wideImageUrl?: string; wideLogoUrl?: string; glassUrl: (size: PreviewSize) => string;
}
export interface PlaceCardModel {
  id: number; name: string; title: string | null; category: string; descriptor: string; neighborhood: string | null;
  href: string; imageUrl: string | null; logoUrl?: string; imageFit?: 'cover'|'contain'; imagePosition?: string; treatmentUrl?: string; cutoutMaskUrl?: string; wideCutoutMaskUrl?: string; wideFadeMaskUrl?: string; wideImageUrl?: string; wideLogoUrl?: string; glassUrl: (size: PreviewSize) => string | undefined;
  accent: string;
  status: { label: string; tone: 'neutral' | 'open' | 'closed'; source: string | null };
  hours: string | null; description: string | null; address: string | null; phone: string | null; latitude: number | null; longitude: number | null; composeHref:string; claimState: 'unclaimed' | 'claimed' | 'unknown'; saved: boolean | null;
}
const LABELS: Record<string,string> = {bar:'Bar',venue:'Venue',restaurant:'Restaurant',cafe:'Cafe',shop:'Shop',service:'Service',hotel:'Hotel',nonprofit:'Nonprofit',healthcare:'Healthcare',realestate:'Real estate',group:'Community',campground:'Campground'};
const clean = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;
const slugify = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80) || 'place';
/** Reject stale, unbounded or future status evidence. OPEN is lifecycle, never live hours. */
export function currentOpenStatus(evidence: LiveStatusEvidence | undefined, now: number) {
  if (!evidence || !clean(evidence.source) || !['open','closed'].includes(evidence.state)) return null;
  const checked=Date.parse(evidence.checkedAt),until=Date.parse(evidence.validUntil);
  if (![checked,until,now].every(Number.isFinite) || checked>now || until<=now || until<=checked || until-checked>15*60*1000) return null;
  return {label:evidence.state==='open'?'Open now':'Closed now',tone:evidence.state,source:evidence.source};
}
export function adaptDirectoryRecord(record: DirectoryRecord, presentation?: PlacePresentation, liveStatus?: LiveStatusEvidence, now=Date.now()): PlaceCardModel {
  if (!Number.isSafeInteger(record.id) || record.id<=0 || !clean(record.name) || !clean(record.type)) throw new Error('Invalid directory record');
  const category=LABELS[record.type] || record.type;
  const hours=clean(record.hours) || (record.locations?.length===1 ? clean(record.locations[0]?.hours) : null);
  const lifecycleClosed=record.status==='CLOSED' || record.active===false;
  const status=lifecycleClosed ? {label:'Closed listing',tone:'closed' as const,source:null} : currentOpenStatus(liveStatus,now) || {label:hours?'Hours listed':'Hours unavailable',tone:'neutral' as const,source:null};
  return {id:record.id,name:record.name,title:presentation?.logoIsName===true ? null : clean(presentation?.title) || record.name,category,descriptor:presentation?.descriptor || category,
    neighborhood:clean(record.neighborhood),href:`/directory/${record.id}/${slugify(record.name)}`,
    imageUrl:presentation?.heroUrl || clean(record.imageUrl),logoUrl:presentation?.logoUrl,imageFit:presentation?.imageFit,imagePosition:presentation?.imagePosition,treatmentUrl:presentation?.treatmentUrl,cutoutMaskUrl:presentation?.cutoutMaskUrl,wideCutoutMaskUrl:presentation?.wideCutoutMaskUrl,wideFadeMaskUrl:presentation?.wideFadeMaskUrl,wideImageUrl:presentation?.wideImageUrl,wideLogoUrl:presentation?.wideLogoUrl,glassUrl:presentation?.glassUrl || (()=>undefined),
    accent:presentation?.accent || '#00e9ef',
    status,hours,description:clean(record.description),address:clean(record.address) || (record.locations?.length===1 ? clean(record.locations[0]?.address):null),phone:record.locations?.length===1 ? clean(record.locations[0]?.phone):null,latitude:record.locations?.length===1 && Number.isFinite(record.locations[0]?.lat)?record.locations[0].lat!:null,longitude:record.locations?.length===1 && Number.isFinite(record.locations[0]?.lng)?record.locations[0].lng!:null,composeHref:`/mizzed/new?place=${record.id}`,claimState:record.ownerId===null ? 'unclaimed' : Number.isSafeInteger(record.ownerId) && Number(record.ownerId)>0 ? 'claimed' : 'unknown',
    saved:typeof record.isFollowing==='boolean' ? record.isFollowing : null};
}
/** Same-origin only, with session cookie. Use the site's existing React Query layer in production. */
export async function fetchDirectory(signal?: AbortSignal, request: typeof fetch=fetch): Promise<DirectoryRecord[]> {
  const response=await request('/api/directory',{credentials:'include',signal});
  if(!response.ok) throw new Error(`Directory request failed (${response.status})`);
  const data: unknown=await response.json();
  if(!Array.isArray(data)) throw new Error('Directory response must be an array');
  for (const item of data) {
    if (!item || typeof item!=='object') throw new Error('Invalid directory record');
    adaptDirectoryRecord(item as DirectoryRecord);
  }
  return data as DirectoryRecord[];
}
