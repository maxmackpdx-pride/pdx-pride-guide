/**
 * Crisis intent for Needz search. A person typing "suicide", "988" or "help now" needs a crisis line first, not the one
 * housing item that happens to contain the word "crisis". These are national/local public lines, also listed (with
 * hours and official sources) under "Talk to someone".
 */
export type CrisisLine = { name: string; number: string; tel: string; text?: { label: string; href: string }; note: string; source: string };

export const CRISIS_LINES: CrisisLine[] = [
  { name: "988 Suicide & Crisis Lifeline", number: "988", tel: "988", text: { label: "Text 988", href: "sms:988" }, note: "Call or text, 24/7, for emotional distress or a mental health crisis.", source: "https://988lifeline.org/" },
  { name: "The Trevor Project", number: "866-488-7386", tel: "18664887386", text: { label: "Text START to 678678", href: "sms:678678?body=START" }, note: "24/7 crisis counselors for LGBTQ+ young people. Call, text, or chat.", source: "https://www.thetrevorproject.org/get-help/" },
  { name: "Trans Lifeline", number: "877-565-8860", tel: "18775658860", note: "Trans peer support, run by trans people. Mon–Fri 10am–6pm PT; check the site for closures.", source: "https://translifeline.org/hotline/" },
  { name: "Call to Safety", number: "503-235-5333", tel: "15032355333", note: "Portland 24/7 domestic and sexual violence crisis line. Free and confidential.", source: "https://calltosafety.org/services/crisis-line/" },
];

/** Terms that signal crisis/urgent-help intent. Matched on word boundaries, case-insensitive. */
export const CRISIS_TERMS = [
  "crisis", "suicide", "suicidal", "kill myself", "end my life", "want to die", "self harm", "self-harm", "hurt myself",
  "hotline", "helpline", "lifeline", "988", "emergency", "help now", "need help now", "urgent", "in danger", "unsafe",
  "not safe", "overdose", "abuse", "abused", "talk to someone", "someone to talk to",
];

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
const CRISIS_PATTERN = new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${CRISIS_TERMS.map(escape).join("|")})(?![\\p{L}\\p{N}])`, "iu");

export function isCrisisQuery(query: string): boolean {
  return CRISIS_PATTERN.test(query.trim());
}

/** 0 for no crisis signal; higher for rows that are themselves crisis/hotline services. */
export function crisisRowScore(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  if (/\b(crisis|hotline|helpline|lifeline|988)\b/.test(lower)) score += 2;
  if (/\b(suicide|suicidal|self[- ]harm|emergency|24\/7|24 hours)\b/.test(lower)) score += 1;
  if (/\b(housing|rent|eviction)\b/.test(lower) && score <= 2 && !/\b(hotline|lifeline|helpline|988|suicide)\b/.test(lower)) score -= 1;
  return score;
}

/** For a crisis query: rows that carry a crisis signal (or the plain text match), best first. Otherwise unchanged. */
export function rankForCrisis<T>(rows: T[], query: string, textOf: (row: T) => string, matchesPlain: (row: T) => boolean): T[] {
  if (!isCrisisQuery(query)) return rows;
  return rows
    .map((row, index) => ({ row, index, crisis: crisisRowScore(textOf(row)), score: crisisRowScore(textOf(row)) + (matchesPlain(row) ? 0.5 : 0) }))
    .filter(item => item.crisis > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.row);
}
