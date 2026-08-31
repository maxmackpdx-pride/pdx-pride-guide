import type {
  Admission,
  AgeRequirement,
  MapPin,
  PlaceCategory,
  PlaceEvent,
  PrideDay,
} from "./types";

export interface MockEvent {
  title: string;
  venue?: string;
  when?: string;
  day: PrideDay;
  image?: string;
  types?: string[];
  admission?: Admission;
  age?: AgeRequirement;
  going?: number;
  claimable?: boolean;
}

export interface MockPlace {
  name: string;
  category: PlaceCategory;
  address?: string;
  hours?: string;
  phone?: string;
  description?: string;
  website?: string;
  instagram?: string;
  grandOpening?: boolean;
  events?: PlaceEvent[];
}

export interface MockStat {
  value: number | string;
  label: string;
  color: "lime" | "pink" | "cyan" | "green" | "orange" | "purple" | "amber" | "blue";
  action?: string;
}

export const sampleEvents: MockEvent[] = [
  {
    title: "Dance Party",
    venue: "Holocene",
    when: "Fri, Jul 17 · 9:00 PM · SE Portland",
    day: "FRI",
    types: ["Dance party", "21+"],
    admission: "TICKETED",
    age: "21_PLUS",
    going: 142,
  },
  {
    title: "Trans March Rally",
    venue: "Waterfront Park",
    when: "Sat, Jul 18 · 11:00 AM · Downtown",
    day: "SAT",
    types: ["March", "Community"],
    admission: "FREE",
    age: "ALL_AGES",
    going: 89,
  },
  {
    title: "Pride Brunch Social",
    venue: "Q Center",
    when: "Sun, Jul 19 · 10:00 AM · North Portland",
    day: "SUN",
    types: ["Social"],
    admission: "SUGGESTED_DONATION",
    age: "ALL_AGES",
    claimable: true,
    going: 34,
  },
  {
    title: "Opening Night Kickoff",
    venue: "Tom McCall Waterfront",
    when: "Thu, Jul 16 · 7:00 PM · Downtown",
    day: "THU",
    types: ["Festival"],
    admission: "FREE",
    age: "ALL_AGES",
    going: 210,
  },
  {
    title: "QTBIPOC Mixer",
    venue: "The Sports Bra",
    when: "Wed, Jul 15 · 6:00 PM · NE Portland",
    day: "WED",
    types: ["Mixer"],
    admission: "FREE",
    age: "21_PLUS",
    going: 56,
  },
];

export const samplePlaces: MockPlace[] = [
  {
    name: "Camp Bar",
    category: "bars",
    address: "2401 SE Morrison St, Portland",
    hours: "Mon-Sun · 4 PM - 2 AM",
    phone: "(503) 236-0020",
    description:
      "Neighborhood bar that is ours with patio, drag nights, and a welcoming crowd every night of the week.",
    website: "https://example.com/campbar",
    instagram: "@campbarpdx",
    events: [
      { day: "FRI", date: "Fri, Jul 17 · 8:00 PM", title: "Pride Drag Showcase" },
      { day: "SAT", date: "Sat, Jul 18 · 10:00 PM", title: "Dance Floor Takeover" },
    ],
  },
  {
    name: "Back to Eden Bakery",
    category: "cafes",
    address: "2217 NE Sandy Blvd, Portland",
    hours: "Tue-Sun · 8 AM - 6 PM",
    description: "Vegan bakery and cafe. Pride weekend specials and rainbow treats all week.",
    instagram: "@backtoedenbakery",
    grandOpening: false,
  },
  {
    name: "The Treasury",
    category: "venues",
    address: "920 SW 6th Ave, Portland",
    hours: "Event hours vary",
    phone: "(503) 555-0142",
    description: "Historic ballroom hosting Pride galas, fundraisers, and community celebrations.",
    website: "https://example.com/treasury",
    events: [
      { day: "THU", date: "Thu, Jul 16 · 6:00 PM", title: "Pride Gala Opening" },
    ],
  },
];

export const sampleStats: MockStat[] = [
  { value: 52, label: "Live Events", color: "lime", action: "View" },
  { value: 3, label: "Action Items", color: "pink", action: "Review" },
  { value: 18, label: "Pending Submissions", color: "cyan", action: "Moderate" },
  { value: 7, label: "Claimable Listings", color: "amber", action: "Claim" },
];

export const sampleMapPins: MapPin[] = [
  { x: 28, y: 38, day: "FRI" },
  { x: 42, y: 45, day: "SAT" },
  { x: 55, y: 32, day: "SUN" },
  { x: 38, y: 58, multi: true },
  { x: 62, y: 48, day: "THU" },
  { x: 48, y: 22, day: "WED" },
];

export const sampleStickers = [
  { text: "KEEP PORTLAND WEIRD", color: "lime" as const, rotate: -4 },
  { text: "PRIDE IS A PROTEST", color: "pink" as const, rotate: 3 },
  { text: "MADE BY THE SCENE", color: "cyan" as const, rotate: -2 },
];

/** Preview-page aliases (DesignSystemSandbox.tsx) */
export const SANDBOX_BANNERS = {
  gifting: "/sandbox-ds/banners/banner-gifting.png",
  gigs: "/sandbox-ds/banners/banner-gigs.png",
  social: "/sandbox-ds/banners/banner-social.png",
  stickers: "/sandbox-ds/banners/banner-stickers.png",
} as const;

export interface SandboxEvent {
  title: string;
  venue?: string;
  when?: string;
  day: PrideDay;
  image?: string;
  tags: string[];
  admission?: Admission;
  age?: AgeRequirement;
  going?: number;
  claimable?: boolean;
}

export const SANDBOX_EVENTS: SandboxEvent[] = sampleEvents.map((e) => ({
  title: e.title,
  venue: e.venue,
  when: e.when,
  day: e.day,
  image: e.image,
  tags: e.types ?? [],
  admission: e.admission,
  age: e.age,
  going: e.going,
  claimable: e.claimable,
}));

export const SANDBOX_PLACES = samplePlaces;

export function formatEventWhen(ev: Pick<SandboxEvent, "when" | "venue">): string {
  return ev.when || ev.venue || "";
}
