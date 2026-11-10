import type { ComponentProps } from 'react';
import { EventCard } from './EventCard';
import { PlaceCard } from './PlaceCard';
import { OutzCard } from './OutzCard';
import { BoardCard } from './BoardCard';
import { NeedzCard } from './NeedzCard';

/** One rendering API, with category-specific data and actions kept type-safe. */
export type ZaylistCardProps =
  | ({ category: 'eventz' } & ComponentProps<typeof EventCard>)
  | ({ category: 'placez' } & ComponentProps<typeof PlaceCard>)
  | ({ category: 'outzide' } & ComponentProps<typeof OutzCard>)
  | ({ category: 'boardz' } & ComponentProps<typeof BoardCard>)
  | ({ category: 'needz' } & ComponentProps<typeof NeedzCard>);

export function ZaylistCard(props: ZaylistCardProps) {
 "use memo";
  switch (props.category) {
    case 'eventz': { const { category, ...card } = props; return <EventCard {...card} />; }
    case 'placez': { const { category, ...card } = props; return <PlaceCard {...card} />; }
    case 'outzide': { const { category, ...card } = props; return <OutzCard {...card} />; }
    case 'boardz': { const { category, ...card } = props; return <BoardCard {...card} />; }
    case 'needz': { const { category, ...card } = props; return <NeedzCard {...card} />; }
  }
}
