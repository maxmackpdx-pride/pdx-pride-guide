import { RESOURCE_CATEGORIES, type ResourceCategory, type ResourceOrg } from "@/lib/resourcesData";
import { FOOD_RESOURCE } from "@/lib/foodPantries";
import { serviceArtwork } from "@shared/serviceIdentity";

/**
 * NEEDZ Decks data model. Pure functions only, so the compiled Decks components
 * can derive every list during render without refs, effects or manual memo.
 * Records are the real NEEDZ directory (resourcesData.ts + food pantries).
 * Find Your People (clubs and groups) is intentionally excluded from Decks.
 */
export type NeedzCategoryId = string;
export type NeedzRow = {
  id: string;
  org: ResourceOrg;
  category: ResourceCategory;
  color: string;
  caption: string;
  logo: string | null;
  phone: string | null;
  walkIn: boolean;
  wa: boolean;
  everywhere: boolean;
  text: string;
  core: string;
};

/** Same closed-card captions as the existing NEEDZ ResourceCard (pages/Resources.tsx). Used only beside the org logo; logo-less cards show the full name. */
export const NEEDZ_CARD_CAPTIONS: Record<string, string> = {
 "Family Peace Center of Washington County": "Family Peace Center",
 "Virginia Garcia · Beaverton Wellness Center": "Beaverton Wellness Center",
 "PFLAG Vancouver": "Vancouver, WA",
 "YWCA Clark County · SafeChoice": "SafeChoice",

 "Oregon Health Plan (OHP)": "Oregon Health Plan (OHP)",
 "Multnomah County · Free Outreach Testing": "Free Outreach Testing",
 "Oregon Free HIV & Syphilis Lab Testing": "Free HIV & Syphilis Testing",
 "CAP Northwest & Our House": "Our House",
 "OHSU Transgender Health Program": "Transgender Health Program",
 "Marsha's Folx | Bradley Angle": "Marsha’s Folx",
 "WERQ Together": "WERQ Together",
 "New Avenues for Youth / SMYRC": "SMYRC",
 "The Living Room": "The Living Room",
 "TransActive Gender Project": "TransActive Gender Project",
 "Pairs With Pride": "Pairs With Pride",
 "Oregon Department of Veterans' Affairs": "Oregon Veterans’ Affairs",
 "Northwest Gender Alliance": "Northwest Gender Alliance",
 "Portland Small Business Development Center": "Portland Small Business Development Center",
 "Independent Publishing Resource Center": "Independent Publishing Resource Center",
 "Multnomah County Harm Reduction": "Harm Reduction",
 "HIV Alliance · Syringe Services": "Syringe Services",
 "Just in Case Oregon · Free Naloxone": "Free Naloxone",
 "Food banks & pantries": "Food Banks & Pantries",
};

/**
 * Decks palette: black, white and ONE category accent per card, every accent a
 * repo token from client/src/components/ds/tokens/colors.css (no raw hex).
 * Healthcare is red; Basic Needs is yellow (Tucker, Nov 12 2026).
 */
export const NEEDZ_CATEGORY_ACCENTS: Record<string, string> = {
  health: "var(--neon-red)",
  safety: "var(--yellow)",
  legal: "var(--neon-blue)",
  youth: "var(--text-hi)",
  family: "var(--neon-magenta)",
  money: "var(--green-acid)",
  arts: "var(--neon-violet)",
  "mental-health": "var(--neon-cyan)",
  "harm-reduction": "var(--neon-orange)",
};

export const NEEDZ_EXCLUDED_CATEGORIES = new Set(["community"]);

const WA_SCOPE = /Vancouver|Clark County|SW Washington|Southwest Washington|, WA\b/i;
const BOTH_SCOPE = /National|U\.S\.|Online|Statewide|Oregon (?:&|and) (?:SW|Southwest) Washington|Pacific Northwest|Northwest/i;
const WALK_IN = /walk-in|walk in|drop-in|drop in|24\/7|no appointment/i;

function phoneOf(org: ResourceOrg) {
  const source = org.phone || (org.alt?.startsWith("tel:") ? org.alt : "");
  const tel = source.replace(/^tel:/, "").trim();
  return tel || null;
}

export function formatPhone(tel: string) {
  const digits = tel.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return national.length === 10 ? `${national.slice(0, 3)}-${national.slice(3, 6)}-${national.slice(6)}` : tel;
}

function buildRows(): NeedzRow[] {
  const seen = new Set<string>();
  const rows: NeedzRow[] = [];
  for (const category of RESOURCE_CATEGORIES) {
    if (NEEDZ_EXCLUDED_CATEGORIES.has(category.id)) continue;
    const orgs = category.id === "safety" ? [FOOD_RESOURCE, ...category.orgs] : category.orgs;
    for (const org of orgs) {
      if (seen.has(org.name)) continue;
      seen.add(org.name);
      const logo = serviceArtwork(org, org.logo, true) || null;
      const core = [org.name, org.sub, org.desc, ...(org.aliases || []), ...(org.serviceTags || [])].filter(Boolean).join(" ");
      const text = [org.name, org.sub, org.desc, org.howToStart, ...(org.aliases || []), ...(org.serviceTags || []), ...(org.programs || []).map(program => `${program.name} ${program.desc}`)].filter(Boolean).join(" ");
      rows.push({
        id: org.name,
        org,
        category,
        color: NEEDZ_CATEGORY_ACCENTS[category.id] ?? "var(--text-hi)",
        logo,
        caption: logo ? NEEDZ_CARD_CAPTIONS[org.name] ?? org.name : org.name,
        phone: phoneOf(org),
        walkIn: WALK_IN.test(`${org.hours || ""} ${org.howToStart || ""}`),
        wa: WA_SCOPE.test(org.scope),
        everywhere: BOTH_SCOPE.test(org.scope),
        text,
        core,
      });
    }
  }
  return rows;
}

export const NEEDZ_ROWS: NeedzRow[] = buildRows();

const tagText = (row: NeedzRow) => (row.org.serviceTags || []).join(" ");
const inCategory = (row: NeedzRow, id: string) => row.category.id === id || Boolean(row.org.categoryIds?.includes(id));

/** Everyday needs, matched against the real categories, service tags and descriptions. */
export type NeedzNeed = { id: string; name: string; color: string; glyph: string; test: (row: NeedzRow) => boolean };
export const NEEDZ_NEEDS: NeedzNeed[] = [
  { id: "food", name: "Food & meals", color: "var(--yellow)", glyph: "M4 10H20L18 19H6Z M9 10L11 5 M15 10L13 5", test: row => /\b(food|meals?|groceries|nutrition|pantr(?:y|ies))\b/i.test(row.core) },
  { id: "basics", name: "Clothes, showers & supplies", color: "var(--neon-orange)", glyph: "M8 4L4 7L6 10L8 9V20H16V9L18 10L20 7L16 4C15 6 9 6 8 4Z", test: row => /\b(cloth\w*|showers?|toiletr\w*|garments?|basic supplies|hygiene)\b/i.test(row.core) },
  { id: "doctor", name: "A doctor or clinic", color: "var(--neon-red)", glyph: "M10 4H14V10H20V14H14V20H10V14H4V10H10Z", test: row => row.category.id === "health" && !/^(?:Free testing)$/i.test(tagText(row)) && !/enrollment|coverage/i.test(tagText(row)) },
  { id: "testing", name: "Free testing", color: "var(--neon-red)", glyph: "M9 4H15 M10 4V16A2 2 0 0 0 14 16V4 M10 11H14", test: row => /\btesting\b/i.test(tagText(row)) },
  { id: "coverage", name: "Health insurance", color: "var(--neon-red)", glyph: "M12 4L19 7V12C19 16 16 19 12 20C8 19 5 16 5 12V7Z", test: row => /\b(enrollment|health coverage|insurance|OHP)\b/i.test(`${tagText(row)} ${row.org.name}`) },
  { id: "housing", name: "Housing help", color: "var(--amber)", glyph: "M4 11L12 4L20 11V20H4Z M10 20V14H14V20", test: row => /\b(housing|shelter|eviction|rent|relocation)\b/i.test(row.core) },
  { id: "bills", name: "Bills, taxes & money", color: "var(--green-acid)", glyph: "M4 7H20V17H4Z M12 9A3 3 0 1 1 11.9 9", test: row => row.category.id === "money" || /\b(utilit\w*|tax\w*|energy assistance|bills?)\b/i.test(tagText(row) + " " + row.org.name) },
  { id: "legal", name: "Legal help & rights", color: "var(--neon-blue)", glyph: "M12 4V20 M6 8H18 M4 14L6 8L8 14Z M16 14L18 8L20 14Z", test: row => row.category.id === "legal" || /\b(legal|eviction|name change)\b/i.test(tagText(row)) },
  { id: "talk", name: "Someone to talk to", color: "var(--neon-cyan)", glyph: "M4 6H20V16H10L6 20V16H4Z", test: row => inCategory(row, "mental-health") || /\b(peer|counsel\w*|therapy)\b/i.test(tagText(row)) },
  { id: "youth", name: "Youth spaces", color: "var(--text-hi)", glyph: "M12 4L14 9L20 9L15 13L17 19L12 15L7 19L9 13L4 9L10 9Z", test: row => inCategory(row, "youth") },
  { id: "family", name: "Family & elders", color: "var(--neon-magenta)", glyph: "M8 9A3 3 0 1 1 8.1 9 M16 9A3 3 0 1 1 16.1 9 M3 20C3 15 13 15 13 20 M11 20C11 15 21 15 21 20", test: row => inCategory(row, "family") },
  { id: "harm", name: "Safer-use supplies", color: "var(--neon-orange)", glyph: "M12 4C16 9 18 12 18 15A6 6 0 0 1 6 15C6 12 8 9 12 4Z", test: row => inCategory(row, "harm-reduction") },
  { id: "arts", name: "Arts, work & funding", color: "var(--neon-violet)", glyph: "M5 19L19 5 M14 5H19V10", test: row => inCategory(row, "arts") || /\b(scholarships?|grants?|jobs?|employment|mentoring)\b/i.test(tagText(row)) },
];

/** Tile counts are computed once from the real records. */
export const NEEDZ_NEED_COUNTS: Record<string, number> = Object.fromEntries(NEEDZ_NEEDS.map(need => [need.id, NEEDZ_ROWS.filter(need.test).length]));

export type NeedzWhen = "today" | "week" | "browse";
export const NEEDZ_WHEN: { id: NeedzWhen; name: string; sub: string }[] = [
  { id: "today", name: "Today", sub: "Walk-ins and phones first" },
  { id: "week", name: "This week", sub: "Appointments are fine" },
  { id: "browse", name: "Just browsing", sub: "Show me what's out there" },
];
export type NeedzHow = "any" | "phone" | "walk" | "web";
export const NEEDZ_HOW: { id: NeedzHow; name: string }[] = [
  { id: "any", name: "Any way" }, { id: "phone", name: "Phone" }, { id: "walk", name: "Walk in" }, { id: "web", name: "Online" },
];
export type NeedzWhere = "all" | "or" | "wa";
export const NEEDZ_WHERE: { id: NeedzWhere; name: string }[] = [
  { id: "all", name: "Anywhere" }, { id: "or", name: "Oregon" }, { id: "wa", name: "Vancouver, WA" },
];
export type NeedzWho = "trans" | "youth" | "family";
export const NEEDZ_WHO: { id: NeedzWho; name: string }[] = [
  { id: "trans", name: "Trans-focused" }, { id: "youth", name: "Youth" }, { id: "family", name: "Families & elders" },
];

export type NeedzFilters = { needs: string[]; when: NeedzWhen; how: NeedzHow; where: NeedzWhere; who: NeedzWho[] };
export const NEEDZ_DEFAULT_FILTERS: NeedzFilters = { needs: [], when: "browse", how: "any", where: "all", who: [] };

function rank(row: NeedzRow, when: NeedzWhen) {
  if (when === "today") return row.walkIn ? 0 : row.phone ? 1 : 2;
  if (when === "week") return row.phone ? 0 : 1;
  return 0;
}

/** Builds one deck from the intake answers. Returns a new array; never mutates records. */
export function buildDeck(filters: NeedzFilters, rows: NeedzRow[] = NEEDZ_ROWS): NeedzRow[] {
  const needs = NEEDZ_NEEDS.filter(need => filters.needs.includes(need.id));
  return rows
    .filter(row => !needs.length || needs.some(need => need.test(row)))
    .filter(row => filters.how === "any" || (filters.how === "phone" ? Boolean(row.phone) : filters.how === "walk" ? row.walkIn : Boolean(row.org.url) && !row.org.addr && !row.org.locations?.length))
    .filter(row => filters.where === "all" || row.everywhere || (filters.where === "wa" ? row.wa : !row.wa))
    .filter(row => (!filters.who.includes("trans") || Boolean(row.org.transSpecialist))
      && (!filters.who.includes("youth") || inCategory(row, "youth") || /\b(youth|young people|ages? 1\d)\b/i.test(`${row.org.scope} ${row.text}`))
      && (!filters.who.includes("family") || inCategory(row, "family") || /\b(older adults?|famil(?:y|ies)|parents?|elders?)\b/i.test(row.text)))
    .map((row, index) => ({ row, index, score: rank(row, filters.when) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(item => item.row);
}

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

/** Real lines, labelled in plain words. Checked against crisisSearch.ts and the existing Talk options. */
export type NeedzLine = { name: string; detail: string; tel: string; sms?: string; smsLabel?: string; source: string };
export const NEEDZ_TALK_LINES: NeedzLine[] = [
  { name: "Talk to someone now", detail: "988 Suicide & Crisis Lifeline. Call or text, free, 24/7.", tel: "988", sms: "sms:988", smsLabel: "Text 988", source: "https://988lifeline.org/" },
  { name: "LGBTQ+ young people", detail: "The Trevor Project, 866-488-7386. Call 24/7, or text START to 678678.", tel: "18664887386", sms: "sms:678678?body=START", smsLabel: "Text START", source: "https://www.thetrevorproject.org/get-help/" },
  { name: "Trans peer support", detail: "Trans Lifeline, 877-565-8860. Mon to Fri, 10am to 6pm PT.", tel: "18775658860", source: "https://translifeline.org/hotline/" },
  { name: "Relationship or sexual violence", detail: "Call to Safety, 503-235-5333. Free and confidential, 24/7.", tel: "15032355333", source: "https://calltosafety.org/services/crisis-line/" },
  { name: "Emergency", detail: "911 for police, fire or a medical emergency. Call if you can; text if speaking is unsafe.", tel: "911", sms: "sms:911", smsLabel: "Text 911", source: "https://www.oregon.gov/OEM/911/Pages/Text-to-9-1-1.aspx" },
];

/** Neutral destination for Quick exit. replace() keeps NEEDZ out of the back button. */
export const NEEDZ_QUICK_EXIT_URL = "https://www.google.com/search?q=weather";

export const NEEDZ_SAVED_KEY = "zaylist:needz-decks:saved";
