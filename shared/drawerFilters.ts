/**
 * One filter config for every drawer and every map. Category chips, time
 * chips, and tag chips stay in this file so Placez, Events, and Mapz cannot
 * drift apart.
 */
import { DIRECTORY_TYPE_LABELS, DIRECTORY_TYPES, isPlacezType } from "./directoryTheme";
import { EVENT_TYPE_FILTERS, getEventTypeTagsForEvent, type EventTypeFilterLabel } from "./eventTypeTags";
import { eventsTonightWindow } from "./eventsTonight";
import { pacificCalendarDate, pacificTodayDate, parsePacificDateTime } from "./missedConnections";

export type DrawerFilterGroup = "category" | "time" | "tag";

export type DrawerFilterChip = {
  id: string;
  label: string;
  group: DrawerFilterGroup;
  /** Token color only. */
  accent: string;
};

const CATEGORY_ACCENTS: Record<string, string> = {
  eventz: "var(--room-eventz)",
  bar: "var(--cat-bars)",
  restaurant: "var(--cat-food)",
  cafe: "var(--cat-cafes)",
  venue: "var(--cat-venues)",
  service: "var(--cat-services)",
  shop: "var(--cat-shops)",
  hotel: "var(--cat-hotels, var(--cat-bars))",
  realestate: "var(--cat-realestate, var(--neon-blue))",
  campground: "var(--cat-campgrounds, var(--neon-green))",
  adult: "var(--neon-red)",
};

export const DRAWER_CATEGORY_FILTERS: DrawerFilterChip[] = [
  { id: "eventz", label: "Events", group: "category", accent: CATEGORY_ACCENTS.eventz },
  ...DIRECTORY_TYPES.filter(isPlacezType).map(id => ({
    id,
    label: DIRECTORY_TYPE_LABELS[id] || id,
    group: "category" as const,
    accent: CATEGORY_ACCENTS[id] || "var(--room-placez)",
  })),
  { id: "adult", label: "Adult", group: "category", accent: CATEGORY_ACCENTS.adult },
];

export const DRAWER_TIME_FILTERS: DrawerFilterChip[] = [
  { id: "today", label: "Today", group: "time", accent: "var(--room-eventz)" },
  { id: "tonight", label: "Tonight", group: "time", accent: "var(--room-eventz)" },
  { id: "tomorrow", label: "Tomorrow", group: "time", accent: "var(--room-eventz)" },
  { id: "week", label: "This Week", group: "time", accent: "var(--room-eventz)" },
  { id: "later", label: "Later", group: "time", accent: "var(--room-eventz)" },
];

const TAG_ACCENT: Record<string, string> = {
  "21plus": "var(--neon-yellow)",
  free: "var(--neon-green)",
  ticketed: "var(--neon-cyan)",
  "door-fee": "var(--neon-orange)",
  "all-ages": "var(--neon-yellow)",
  public: "var(--text-meta)",
  "house-party": "var(--neon-orange)",
  "sex-positive": "var(--neon-magenta)",
  "nudity-ok": "var(--neon-magenta)",
  party: "var(--neon-violet)",
  drag: "var(--neon-magenta)",
  kink: "var(--neon-orange)",
  social: "var(--neon-cyan)",
};

const EVENT_TYPE_TAG_IDS: Record<EventTypeFilterLabel, string> = {
  "21+": "21plus",
  FREE: "free",
  TICKETED: "ticketed",
  "DOOR FEE": "door-fee",
  "ALL AGES": "all-ages",
  PUBLIC: "public",
  "HOUSE PARTY": "house-party",
  "SEX POSITIVE": "sex-positive",
  "NUDITY OK": "nudity-ok",
};

const SCENE_TAGS: Array<[string, string]> = [
  ["party", "PARTY"],
  ["drag", "DRAG"],
  ["kink", "KINK"],
  ["social", "SOCIAL"],
];

export const DRAWER_TAG_FILTERS: DrawerFilterChip[] = [
  ...EVENT_TYPE_FILTERS.map(label => ({
    id: EVENT_TYPE_TAG_IDS[label],
    label,
    group: "tag" as const,
    accent: TAG_ACCENT[EVENT_TYPE_TAG_IDS[label]] || "var(--room-eventz)",
  })),
  ...SCENE_TAGS.map(([id, label]) => ({
    id,
    label,
    group: "tag" as const,
    accent: TAG_ACCENT[id] || "var(--room-eventz)",
  })),
];

export const DRAWER_FILTERS: DrawerFilterChip[] = [
  ...DRAWER_CATEGORY_FILTERS,
  ...DRAWER_TIME_FILTERS,
  ...DRAWER_TAG_FILTERS,
];

export type DrawerFilterState = {
  categories: string[];
  times: string[];
  tags: string[];
};

export const EMPTY_DRAWER_FILTERS: DrawerFilterState = {
  categories: [],
  times: [],
  tags: [],
};

export function toggleDrawerFilter(state: DrawerFilterState, chip: DrawerFilterChip): DrawerFilterState {
  if (chip.group === "time") {
    const on = state.times.includes(chip.id);
    return { ...state, times: on ? [] : [chip.id] };
  }
  const key = chip.group === "category" ? "categories" : "tags";
  const current = state[key];
  const next = current.includes(chip.id) ? current.filter(id => id !== chip.id) : [...current, chip.id];
  return { ...state, [key]: next };
}

export function isDrawerFilterOn(state: DrawerFilterState, chip: DrawerFilterChip): boolean {
  if (chip.group === "category") return state.categories.includes(chip.id);
  if (chip.group === "time") return state.times.includes(chip.id);
  return state.tags.includes(chip.id);
}

const ADULT_PATTERN = /\b(adult|21\+|strip|sex club)\b/i;

export function isAdultPlace(name: string, description?: string | null): boolean {
  return ADULT_PATTERN.test(`${description || ""} ${name}`);
}

export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day + days);
  const next = new Date(utc);
  const yyyy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function weekDatesFrom(today: string, length = 7): Set<string> {
  const dates = new Set<string>();
  for (let i = 0; i < length; i++) dates.add(addCalendarDays(today, i));
  return dates;
}

type Dated = { dateStart?: string | null; dateEnd?: string | null };

export function eventMatchesTimeFilter(event: Dated, timeId: string, now = Date.now()): boolean {
  const startDay = pacificCalendarDate(event.dateStart);
  if (!startDay) return false;
  const today = pacificTodayDate(now);
  if (timeId === "today") return startDay === today;
  if (timeId === "tomorrow") return startDay === addCalendarDays(today, 1);
  if (timeId === "week") return weekDatesFrom(today).has(startDay);
  if (timeId === "later") {
    const last = addCalendarDays(today, 6);
    return startDay > last;
  }
  if (timeId === "tonight") {
    const window = eventsTonightWindow(now);
    const start = parsePacificDateTime(event.dateStart);
    const end = parsePacificDateTime(event.dateEnd);
    if (start != null && start < window.end && (end != null && end > start ? end > window.start : start >= window.start)) return true;
    return startDay === today;
  }
  return false;
}

export function eventMatchesAnyTime(event: Dated, times: string[], now = Date.now()): boolean {
  if (!times.length) return true;
  return times.some(time => eventMatchesTimeFilter(event, time, now));
}

type TaggableEvent = Parameters<typeof getEventTypeTagsForEvent>[0] & {
  eventTypes?: unknown;
};

function sceneTagsFromEvent(event: TaggableEvent): string[] {
  const raw = event.eventTypes;
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? safeJsonArray(raw) : [];
  const tags: string[] = [];
  for (const value of list) {
    const token = String(value).toUpperCase();
    if (token === "PARTY" || token === "DRAG" || token === "KINK" || token === "SOCIAL") tags.push(token.toLowerCase());
  }
  return tags;
}

function safeJsonArray(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function eventTypeLabelToTagId(label: EventTypeFilterLabel): string {
  return EVENT_TYPE_TAG_IDS[label];
}

export function tagIdToEventTypeLabel(id: string): EventTypeFilterLabel | null {
  const entry = Object.entries(EVENT_TYPE_TAG_IDS).find(([, value]) => value === id);
  return entry ? entry[0] as EventTypeFilterLabel : null;
}

/** Canonical tag ids for one event, used by every drawer and map. */
export function eventDrawerTagIds(event: TaggableEvent): string[] {
  const ids = getEventTypeTagsForEvent(event).map(label => EVENT_TYPE_TAG_IDS[label]);
  return Array.from(new Set([...ids, ...sceneTagsFromEvent(event)]));
}

export function eventMatchesTags(event: TaggableEvent, tags: string[]): boolean {
  if (!tags.length) return true;
  const own = new Set(eventDrawerTagIds(event));
  return tags.every(tag => own.has(tag));
}

export type FilterablePlace = {
  type?: string | null;
  name?: string | null;
  description?: string | null;
};

export function placeCategoryIds(place: FilterablePlace): string[] {
  const ids: string[] = [];
  if (place.type) ids.push(place.type);
  if (isAdultPlace(place.name || "", place.description)) ids.push("adult");
  return ids;
}

export function placeMatchesCategories(place: FilterablePlace, categories: string[]): boolean {
  if (!categories.length) return true;
  const own = new Set(placeCategoryIds(place));
  return categories.some(id => id !== "eventz" && own.has(id));
}

export function eventMatchesCategories(
  categories: string[],
  venueType?: string | null,
): boolean {
  if (!categories.length) return true;
  if (categories.includes("eventz")) return true;
  return !!venueType && categories.includes(venueType);
}

export type InViewPlace = FilterablePlace & {
  id: number;
  lat?: number | null;
  lng?: number | null;
  locations?: Array<{ lat?: number | null; lng?: number | null }>;
  upcomingEvents?: Dated[];
};

export type InViewEvent = TaggableEvent & Dated & {
  id: number;
  title: string;
  venueName?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type InViewItem =
  | { kind: "event"; id: number; event: InViewEvent }
  | { kind: "place"; id: number; place: InViewPlace };

export type MapBounds = { west: number; east: number; south: number; north: number };

function pointInBounds(lat?: number | null, lng?: number | null, bounds?: MapBounds | null): boolean {
  if (lat == null || lng == null || !bounds) return false;
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

export function placeIsInBounds(place: InViewPlace, bounds: MapBounds | null): boolean {
  if (!bounds) return false;
  if (pointInBounds(place.lat, place.lng, bounds)) return true;
  return (place.locations ?? []).some(location => pointInBounds(location.lat, location.lng, bounds));
}

function venueKey(name?: string | null): string {
  return (name || "").trim().toLowerCase();
}

function eventCoords(
  event: InViewEvent,
  placesByVenue: Map<string, InViewPlace>,
): { lat?: number | null; lng?: number | null; venueType?: string | null } {
  if (event.lat != null && event.lng != null) {
    const place = placesByVenue.get(venueKey(event.venueName));
    return { lat: event.lat, lng: event.lng, venueType: place?.type };
  }
  const place = placesByVenue.get(venueKey(event.venueName));
  if (place) return { lat: place.lat, lng: place.lng, venueType: place.type };
  return { venueType: place?.type };
}

/**
 * Everything currently on screen: events plus every place type, mixed.
 * Time, category, and tag filters use the shared drawer config.
 */
export function collectInViewItems(
  places: InViewPlace[],
  events: InViewEvent[],
  bounds: MapBounds | null,
  filters: DrawerFilterState = EMPTY_DRAWER_FILTERS,
  now = Date.now(),
): InViewItem[] {
  if (!bounds) return [];
  const placesByVenue = new Map<string, InViewPlace>();
  for (const place of places) {
    const key = venueKey(place.name);
    if (key) placesByVenue.set(key, place);
  }
  const visiblePlaces = places.filter(place => placeIsInBounds(place, bounds));
  const items: InViewItem[] = [];

  for (const event of events) {
    const coords = eventCoords(event, placesByVenue);
    if (!pointInBounds(coords.lat, coords.lng, bounds)) continue;
    if (!eventMatchesAnyTime(event, filters.times, now)) continue;
    if (!eventMatchesTags(event, filters.tags)) continue;
    if (!eventMatchesCategories(filters.categories, coords.venueType)) continue;
    items.push({ kind: "event", id: event.id, event });
  }

  const placeTimeOk = (place: InViewPlace) => {
    if (!filters.times.length) return true;
    const upcoming = place.upcomingEvents ?? [];
    if (upcoming.length) return upcoming.some(event => eventMatchesAnyTime(event, filters.times, now));
    return false;
  };

  for (const place of visiblePlaces) {
    if (filters.tags.length) continue;
    if (!placeMatchesCategories(place, filters.categories)) continue;
    if (!placeTimeOk(place)) continue;
    items.push({ kind: "place", id: place.id, place });
  }

  return items.sort((a, b) => {
    const left = a.kind === "event" ? a.event.title : a.place.name || "";
    const right = b.kind === "event" ? b.event.title : b.place.name || "";
    return left.localeCompare(right, undefined, { sensitivity: "base" });
  });
}

export function flyerBoardWindowFromTime(timeId: string | undefined): string {
  if (!timeId) return "all";
  return timeId;
}
