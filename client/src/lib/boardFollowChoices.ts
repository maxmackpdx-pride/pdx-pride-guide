import { boardCategories, type BoardCategory } from './allBoards';
import type { FollowableRoom } from '@/components/BoardFollowButton';

/** Public category names use the existing follow keys; My Hoüz keeps its compatible houz key. Outzide uses the existing outz key. */
const followRoomByCategory:Record<BoardCategory,FollowableRoom>={
  housing:'houz',
  gigz:'gigz',
  giftz:'giftz',
  sellz:'sellz',
  mizzed:'mizzed',
  outz:'outz',
};
export function followRoomForCategory(category:BoardCategory):FollowableRoom {
  return followRoomByCategory[category];
}
export const boardFollowChoices=boardCategories.map(category=>({
  ...category,
  followRoom:followRoomForCategory(category.id),
}));
