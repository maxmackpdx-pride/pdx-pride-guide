import { boardCategories, type BoardCategory } from './allBoards';
import type { FollowableRoom } from '@/components/BoardFollowButton';

/** Public category names use the existing follow keys; My Hoüz keeps its compatible houz key. */
export function followRoomForCategory(category:BoardCategory):FollowableRoom {
  return category === 'housing' ? 'houz' : category;
}
export const boardFollowChoices=boardCategories.map(category=>({
  ...category,
  followRoom:followRoomForCategory(category.id),
}));
