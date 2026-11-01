import TodayLocationCard, { type TodayLocation } from '../home/TodayLocationCard';
import OutzSmallCard from '../home/OutzSmallCard';
import OutzWideCard from '../outz/OutzWideCard';
import type { CardSize } from './cardLayout';
/** Drop the same OutZide object anywhere; size selects its face, not its tools. */
export function OutzCard({ location, size = 'tall', onRequireAuth }: {
 location: TodayLocation; size?: CardSize; onRequireAuth?: () => void;
}) {
 if (size === 'small') return <OutzSmallCard location={location} onRequireAuth={onRequireAuth}/>;
 if (size === 'wide') return <OutzWideCard onRequireAuth={onRequireAuth} place={{id:location.key.replace(/^outz:/,''),name:location.name,kind:location.kind || 'trail',region:location.detail,photo:location.photo,art:location.art}}/>;
 return <TodayLocationCard location={location} onRequireAuth={onRequireAuth}/>;
}
