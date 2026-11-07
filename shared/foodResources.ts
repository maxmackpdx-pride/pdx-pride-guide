export const FOOD_TYPES = ['groceries', 'meals', 'produce', 'snap'] as const;
export type FoodType = typeof FOOD_TYPES[number];
export interface FoodResource {
  id: string; name: string; address: string; distance: string | null;
  categories: string[]; hours: string[]; notes: string; serviceArea: string;
  phone: string | null; website: string | null; sourceUrl: string;
  onlineUrl: string | null; onlineLabel: string | null;
}
export interface FoodResults {
  resources: FoodResource[]; zip: string; type: FoodType; page: number;
  totalPages: number; total: number; fetchedAt: string; stale: boolean;
  sourceUrl: string;
}
