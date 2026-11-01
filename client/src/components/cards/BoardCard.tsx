import type { ComponentProps } from 'react';
import BoardBrowseCard from '../board/BoardBrowseCard';

/** Board category artwork and actions inside the shared tall/wide/small contract. */
export type BoardCardProps = ComponentProps<typeof BoardBrowseCard>;
export function BoardCard(props: BoardCardProps) {
  return <BoardBrowseCard {...props} />;
}
