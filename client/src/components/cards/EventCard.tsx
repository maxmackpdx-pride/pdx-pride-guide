import TonightEventCard, { type TonightEventCardProps } from '../home/TonightEventCard';
import EventRailCard from '../events/EventRailCard';
import EventSquareCard from '../events/EventSquareCard';
import type { CardSize } from './cardLayout';
export function EventCard({size='tall',...props}:Omit<TonightEventCardProps,'layout'> & {size?:CardSize | 'square'}) {
 "use memo";
 if(size==='small')return <EventRailCard listing={props.listing} size="s" saved={props.rsvped} liveState={props.liveState} onToggleSave={props.onToggleRsvp} onOpen={props.onOpen}/>;
 if(size==='square')return <EventSquareCard listing={props.listing} saved={props.rsvped} liveState={props.liveState} onToggleSave={props.onToggleRsvp} onOpen={props.onOpen}/>;
 return <TonightEventCard {...props} layout={size==='wide'?'row':'card'}/>;
}
