import { EVENT_TYPE_FILTERS } from "@shared/eventTypeTags";
import { HOUSING_TYPES, HOUSING_TYPE_KICKER } from "@shared/housing";
import { DIRECTORY_TYPE_LABELS } from "@shared/directoryTheme";

export type ZCategoryAddress = {
  boardPath: string;
  key: string;
  label: string;
  path: string;
  route: string;
};

function slugifyCategory(value: string): string {
  if (value === "21+") return "21-plus";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function category(
  boardPath: string,
  key: string,
  label: string,
  route: string,
): ZCategoryAddress {
  return {
    boardPath,
    key,
    label,
    path: `${boardPath}/${slugifyCategory(label)}`,
    route,
  };
}

const eventCategories = EVENT_TYPE_FILTERS.map(label =>
  category("happening", label, label, `/events?type=${encodeURIComponent(label)}`),
);

const housingCategories = HOUSING_TYPES.map(key =>
  category("hauz", key, HOUSING_TYPE_KICKER[key], `/the-hauz?type=${encodeURIComponent(key)}`),
);

const gifzCategories = [
  category("gifz", "GIFT", "Offered", "/gifting?type=GIFT"),
  category("gifz", "ISO", "In search of", "/gifting?type=ISO"),
];

const gigzCategories = [
  category("gigz", "POSTING_GIG", "Gigs offered", "/pride-work?type=POSTING_GIG"),
  category("gigz", "LOOKING_FOR_WORK", "Talent available", "/pride-work?type=LOOKING_FOR_WORK"),
];

const directoryCategories = Object.entries(DIRECTORY_TYPE_LABELS)
  // Clubs & Groups owns the complete z/spaces board, not a nested Places
  // category. Directory keeps the underlying `group` filter as an internal
  // compatibility detail, but it is not a public Z/ category address.
  .filter(([key]) => key !== "group")
  .map(([key, label]) =>
    category("directory", key, label, `/directory?type=${encodeURIComponent(key)}`),
  );

/** Every real category shown on /z, with one typeable Z/ address and one legacy target. */
export const Z_CATEGORY_ADDRESSES: ZCategoryAddress[] = [
  ...eventCategories,
  ...housingCategories,
  ...gifzCategories,
  ...gigzCategories,
  ...directoryCategories,
];

export function zCategoriesForBoard(boardPath: string): ZCategoryAddress[] {
  return Z_CATEGORY_ADDRESSES.filter(categoryAddress => categoryAddress.boardPath === boardPath);
}

export function findZCategory(boardPath: string, key: string): ZCategoryAddress | undefined {
  return Z_CATEGORY_ADDRESSES.find(
    categoryAddress => categoryAddress.boardPath === boardPath && categoryAddress.key === key,
  );
}
