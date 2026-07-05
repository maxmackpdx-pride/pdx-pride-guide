// ─── Content moderation for PDX Pride Guide boards ────────────────────────────
//
// House rules (from the site owner):
//   • This is a deliberately sex-positive, kink-positive, sex-worker-friendly
//     space. Sexual content, kink/fetish vocabulary, nudity mentions, and
//     sex-work terms are ALWAYS allowed and must never trip a filter. An
//     explicit ALLOWLIST below is masked out of the text before any category
//     matching runs, so allowed terms can never feed another rule.
//   • BLOCKED outright: scat/waste play, blood/gore (incl. bloodplay/cutting),
//     weapons in sale/carry/threat context, abuse/harassment (slur attacks,
//     "kill yourself" variants, doxxing), hard-illegal content (minors +
//     sexual context, non-consent assertions), and links to anything that
//     isn't a known social/payment host.
//   • REVIEW: borderline matches (a lone weapon word, mild aggression) are
//     accepted but flagged to the site owner's inbox.
//
// Pure module — no imports, safe for client and server.

export type ModerationVerdict = "ALLOW" | "REVIEW" | "BLOCK";

export type ModerationCategory =
  | "SCAT"
  | "GORE"
  | "WEAPONS"
  | "ABUSE"
  | "ILLEGAL"
  | "LINKS";

export interface ModerationReason {
  category: string;
  match: string;
  /** Which submitted field tripped the rule (set by moderateFields / fieldLabel). */
  field?: string;
}

export interface ModerationResult {
  verdict: ModerationVerdict;
  reasons: ModerationReason[];
}

// ─── Normalization ────────────────────────────────────────────────────────────
// Lowercase + cheap leetspeak folding. Char-for-char so indices stay aligned
// with the original text (needed for allowlist masking).
const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "@": "a",
  "$": "s",
};

export function normalizeForModeration(text: string): string {
  const lower = text.toLowerCase();
  const isLetter = (c: string | undefined) => !!c && c >= "a" && c <= "z";
  let out = "";
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    const sub = LEET_MAP[ch];
    if (sub) {
      const prev = out[out.length - 1]; // already-folded neighbor
      const next = lower[i + 1];
      // Fold only when the leet char sits inside a word (adjacent to a letter,
      // or to another leet char that itself precedes a letter). Real numbers
      // like "1234 SE Stark" or "21+" stay digits.
      const nextIsLeetThenLetter = next !== undefined && LEET_MAP[next] !== undefined && isLetter(lower[i + 2]);
      if (isLetter(prev) || isLetter(next) || nextIsLeetThenLetter) {
        out += sub;
        continue;
      }
    }
    out += ch;
  }
  return out;
}

// ─── ALLOWLIST — sex/kink/SW vocabulary + known false-positive sources ────────
// Matched spans are blanked out of the text before category matching, so these
// can never trip SCAT/GORE/WEAPONS/ABUSE rules. (LINKS and ILLEGAL run on the
// unmasked text — links have their own host allowlist, and ILLEGAL compounds
// need the sexual-context words this list would otherwise hide.)
const ALLOWLIST: RegExp[] = [
  // Sexuality / nudity / kink vocabulary — always welcome here.
  /\bsex[- ]?positive\b/g,
  /\bsex(?:y|ual|uality)?\b/g,
  /\bsex[- ]?work(?:er)?s?\b/g,
  /\bnud(?:e|es|ity|ist)\b/g,
  /\bnaked\b/g,
  /\bkink(?:y|ster|sters)?\b/g,
  /\bfetish(?:es|wear)?\b/g,
  /\bbdsm\b/g,
  /\bbondage\b/g,
  /\bshibari\b/g,
  /\brope (?:play|bunny|top|scene|class|workshop)\b/g,
  /\bimpact play\b/g,
  /\bage ?play\b/g,
  /\bpup (?:play|hood|mosh)\b/g,
  /\bwater ?sports\b/g,
  /\bpiss play\b/g,
  /\bleather (?:daddy|daddies|dyke|dykes|community|night|bar|scene|gear)\b/g,
  /\bdadd(?:ies|y)\b/g,
  /\bdungeon\b/g,
  /\bflogg(?:er|ing)\b/g,
  /\bdomm?e?s?\b/g,
  /\bpro[- ]?domme?s?\b/g,
  /\bfindom(?:me)?s?\b/g,
  /\bsubmissives?\b/g,
  /\bswitch(?:es)?\b/g,
  /\bescorts?\b/g,
  /\bonlyfans\b/g,
  /\bstripp(?:er|ers|ing)\b/g,
  /\bstrip (?:show|club|tease|night)\b/g,
  /\bburlesque\b/g,
  /\bgo[- ]?go\b/g,
  /\bdrag (?:king|queen|show|brunch|night|artist)s?\b/g,
  /\btwinks?\b/g,
  /\bbears?\b/g,
  /\botters?\b/g,
  /\bcruising\b/g,
  /\bhook ?ups?\b/g,
  /\bpolyam(?:ory|orous)?\b/g,
  /\bswingers?\b/g,
  // Reclaimed community usage — never treat as an attack on its own.
  /\bdyke (?:march|night|bar)\b/g,
  /\bdykes on bikes\b/g,
  // Known false-positive sources for the block categories.
  /\bbloodhounds?\b/g,               // the dog breed
  /\bblood (?:drive|donation|donor|donors|bank|type|orange|moon)\b/g,
  /\bgive blood\b/g,
  /\bdonate blood\b/g,
  /\bwater ?guns?\b/g,
  /\bsquirt ?guns?\b/g,
  /\bnerf (?:gun|guns|battle|war)\b/g,
  /\bglue ?guns?\b/g,
  /\bstaple ?guns?\b/g,
  /\bknife[- ]throw(?:ing|er|ers)\b/g,
  /\bthrowing kni(?:fe|ves)\b/g,
  /\bscat (?:sing(?:ing|er|ers)?|jazz)\b/g, // jazz scat
  /\bcutting (?:edge|board|room)\b/g,
  /\bhaircutting\b/g,
  /\bgore-?tex\b/g,
];

/** Replace allowlisted spans with spaces (keeps indices stable). */
function maskAllowlisted(normalized: string): string {
  let masked = normalized;
  for (const re of ALLOWLIST) {
    re.lastIndex = 0;
    masked = masked.replace(re, (m) => " ".repeat(m.length));
  }
  return masked;
}

// ─── Category patterns ────────────────────────────────────────────────────────
type Tier = "BLOCK" | "REVIEW";
interface Rule {
  category: ModerationCategory;
  tier: Tier;
  patterns: RegExp[];
}

// SCAT — waste play is the one kink the house rules exclude. (11 patterns)
const SCAT_BLOCK: RegExp[] = [
  // common alternate spellings — "skat"/"skatt"/"scatt" (leet-folding handles sk@t)
  /\bsk[a@]tt?\s*(?:play|kink|scene|session|fetish)?\b/i,
  /\bscatt\b/i,
  /\bscat\b/,
  /\bscat ?play\b/,
  /\bcoproph(?:ilia|ile|agia|iliac)s?\b/,
  /\bpoop ?play\b/,
  /\bshit ?play\b/,
  /\btoilet ?play\b/,
  /\bbrown showers?\b/,
  /\bsmear(?:ing)? (?:poop|shit|feces)\b/,
  /\beat(?:ing)? (?:poop|shit|feces)\b/,
  /\bplay(?:ing)? with (?:poop|shit|feces)\b/,
  /\bhuman waste play\b/,
];

// GORE — blood is excluded even though kink broadly isn't. (13 patterns)
const GORE_BLOCK: RegExp[] = [
  /\bblood ?play\b/,
  /\bblood ?letting\b/,
  /\bblood (?:kink|fetish|ritual|sports?)\b/,
  /\bcutting (?:scene|play|session)\b/,
  /\bcut(?:ting)? (?:myself|yourself|himself|herself|themselves|each other)\b/,
  /\bself[- ]?harm\b/,
  /\bgore\b/,
  /\bgory\b/,
  /\bmutilat(?:e|ed|ion|ing)\b/,
  /\bdismember(?:ed|ing|ment)?\b/,
  /\bdecapitat(?:e|ed|ion|ing)\b/,
  /\bdisembowel(?:ed|ing|ment)?\b/,
  /\bcover(?:ed)? in blood\b/,
];

const WEAPON_WORDS =
  "guns?|glocks?|pistols?|firearms?|rifles?|handguns?|shotguns?|ak-?47s?|ar-?15s?|kni(?:fe|ves)|switchblades?|machetes?|weapons?";

// WEAPONS — blocked when paired with sale / carry / threat context. (8 patterns)
const WEAPONS_BLOCK: RegExp[] = [
  new RegExp(`\\b(?:sell|selling|sellin|sold|buy|buying|trade|trading)\\s+(?:a|an|my|this|some|used)?\\s*(?:${WEAPON_WORDS})\\b`),
  new RegExp(`\\b(?:${WEAPON_WORDS})\\s+(?:for|4)\\s*sale\\b`),
  new RegExp(`\\bsale of (?:a )?(?:${WEAPON_WORDS})\\b`),
  new RegExp(`\\b(?:bring|bringing|carry|carrying|pack|packing)\\s+(?:a|an|my)?\\s*(?:${WEAPON_WORDS}|heat|a piece)\\b`),
  /\bshoot (?:you|u|ya|him|her|them|everyone|everybody|somebody|this place|it up)\b/,
  /\bshoot up (?:the|this|that|a)\b/,
  /\b(?:stab|shank|gut) (?:you|u|ya|him|her|them|everyone|everybody|somebody)\b/,
  new RegExp(`\\bgun to (?:your|ur|his|her|their) head\\b`),
];

// WEAPONS — a lone weapon word without context is borderline → REVIEW. (1 pattern)
const WEAPONS_REVIEW: RegExp[] = [
  new RegExp(`\\b(?:${WEAPON_WORDS}|ammo|ammunition)\\b`),
];

// ABUSE — threats, slur attacks, doxxing. (12 block patterns)
const ABUSE_BLOCK: RegExp[] = [
  /\bkill? ?(?:your|ur|you)? ?sel(?:f|ves)\b/, // kill yourself / kill urself / killyourself
  /\bkys\b/,
  /\bgo (?:die|hang yourself|neck yourself)\b/,
  /\b(?:hope|wish) (?:you|u) (?:die|were dead)\b/,
  /\b(?:you|u) (?:should|deserve to) die\b/,
  /\bkill (?:you|u|him|her|them)\b/,
  /\bi(?:'ll| will|m gonna| am going to)? ?(?:find|hunt) (?:you|u) down\b/,
  /\bi know where (?:you|u) live\b/,
  // Slurs only when used as an attack; reclaimed community use stays allowed.
  /\b(?:you|u|ur|you'?re) (?:a |an )?(?:fuck(?:ing)? |stupid |dumb |disgusting )*(?:faggot|tranny|troon|shemale|it)\b/,
  /\b(?:fucking|stupid|dumb|disgusting) (?:faggot|tranny|troon|shemale)s?\b/,
  // Doxxing patterns.
  /\blives at \d+/,
  /\b(?:home|his|her|their) address is\b/,
];

// ABUSE — mild aggression → REVIEW. (4 patterns)
const ABUSE_REVIEW: RegExp[] = [
  /\bfuck (?:you|u|off)\b/,
  /\b(?:punch|beat|slap|hurt) (?:you|u|him|her|them)\b/,
  /\b(?:tranny|troon|shemale)s?\b/, // slur without attack framing — human review
  /\bwatch your back\b/,
];

// ILLEGAL — minors + sexual context, non-consent assertions. Runs on the
// UNMASKED text so allowlisted sexual vocabulary still provides context. (10)
const ILLEGAL_BLOCK: RegExp[] = [
  /\b(?:child|children|minors?|under ?age|preteens?|pre-teens?|jail ?bait)\W+(?:porn|sex|sexual|nudes?|nudity|kink|hookups?|play|pics?|content|photos?)\b/,
  /\b(?:porn|sex|sexual|nudes?|hookups?|kink)\W+(?:with|of|from)\W+(?:a |an )?(?:child|children|minors?|kids?|under ?age|preteens?)\b/,
  /\bjail ?bait\b/,
  /\bcsam\b/,
  /\b(?:she|he|they) (?:didn'?t|did not|doesn'?t|does not|won'?t|will not) consent/,
  /\bwithout (?:her|his|their|your) consent\b/,
  /\bno consent (?:needed|required)\b/,
  /\bconsent (?:doesn'?t|does not) matter\b/,
  /\b(?:gonna|going to|will|i'?ll) rape\b/,
  /\broofie(?:d|s)?\b/,
];

const RULES: Rule[] = [
  { category: "SCAT", tier: "BLOCK", patterns: SCAT_BLOCK },
  { category: "GORE", tier: "BLOCK", patterns: GORE_BLOCK },
  { category: "WEAPONS", tier: "BLOCK", patterns: WEAPONS_BLOCK },
  { category: "ABUSE", tier: "BLOCK", patterns: ABUSE_BLOCK },
  { category: "WEAPONS", tier: "REVIEW", patterns: WEAPONS_REVIEW },
  { category: "ABUSE", tier: "REVIEW", patterns: ABUSE_REVIEW },
];

// ─── Link policy ──────────────────────────────────────────────────────────────
export const ALLOWED_LINK_HOSTS = [
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "bsky.app",
  "soundcloud.com",
  "spotify.com",
  "open.spotify.com",
  "linktr.ee",
  "onlyfans.com",
  "fetlife.com",
  "venmo.com",
  "cash.app",
  "youtube.com",
  "youtu.be",
  "eventbrite.com",
  "prideguidepdx.com",
  "www.prideguidepdx.com",
];

function isAllowedLinkHost(rawHost: string): boolean {
  const host = rawHost.toLowerCase().replace(/^www\./, "");
  if (/(^|\.)(bsky|bluesky)\./.test(`.${host}.`) || host.startsWith("bsky.") || host.startsWith("bluesky.")) {
    return true;
  }
  return ALLOWED_LINK_HOSTS.some(allowed => {
    const a = allowed.replace(/^www\./, "");
    return host === a || host.endsWith(`.${a}`);
  });
}

const URL_RE = /\bhttps?:\/\/([^\s<>"'/]+)[^\s<>"']*/gi;
// Bare domains (no scheme): skip emails (preceded by @) and already-schemed hosts.
const BARE_DOMAIN_RE =
  /(?<![@\w.\/-])((?:[a-z0-9-]+\.)+(?:com|net|org|ru|io|co|app|ee|me|be|xyz|info|biz|site|online|store|club|live|tv|cc|gg|to|fm|social|link))(?=[\/\s.,;:!?)]|$)/gi;
const OBFUSCATED_RE = [
  /\bhxxps?\b/i,
  /\b[a-z0-9-]{3,}\s*(?:\(|\[)?\s*dot\s*(?:\)|\])?\s*(?:com|net|org|ru|xyz|info|biz|online|site|io|co)\b/i,
];

function checkLinks(rawText: string): ModerationReason[] {
  const reasons: ModerationReason[] = [];
  const text = rawText; // links checked on raw text (leet-folding would corrupt hosts)

  URL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(text))) {
    const hostPart = m[1].split("@").pop() || m[1];
    const host = hostPart.split(":")[0];
    if (!isAllowedLinkHost(host)) reasons.push({ category: "LINKS", match: m[0].slice(0, 80) });
  }

  BARE_DOMAIN_RE.lastIndex = 0;
  while ((m = BARE_DOMAIN_RE.exec(text))) {
    const host = m[1];
    if (!isAllowedLinkHost(host)) reasons.push({ category: "LINKS", match: host });
  }

  for (const re of OBFUSCATED_RE) {
    const hit = text.match(re);
    if (hit) reasons.push({ category: "LINKS", match: hit[0].slice(0, 80) });
  }
  return reasons;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function moderateContent(
  text: string,
  opts?: { fieldLabel?: string },
): ModerationResult {
  if (!text || !text.trim()) return { verdict: "ALLOW", reasons: [] };

  const reasons: ModerationReason[] = [];
  let verdict: ModerationVerdict = "ALLOW";
  const bump = (tier: Tier) => {
    if (tier === "BLOCK") verdict = "BLOCK";
    else if (verdict === "ALLOW") verdict = "REVIEW";
  };
  const tag = (r: ModerationReason): ModerationReason =>
    opts?.fieldLabel ? { ...r, field: opts.fieldLabel } : r;

  // 1. Links — raw text, own host allowlist.
  for (const r of checkLinks(text)) {
    reasons.push(tag(r));
    bump("BLOCK");
  }

  const normalized = normalizeForModeration(text);

  // 2. ILLEGAL — unmasked normalized text (compounds need sexual-context words
  //    that the allowlist would otherwise mask out).
  for (const re of ILLEGAL_BLOCK) {
    const hit = normalized.match(re);
    if (hit) {
      reasons.push(tag({ category: "ILLEGAL", match: hit[0].slice(0, 80) }));
      bump("BLOCK");
    }
  }

  // 3. Everything else — allowlisted vocabulary masked out first, so sexy /
  //    kinky / SW terms can never feed another rule.
  const masked = maskAllowlisted(normalized);
  for (const rule of RULES) {
    for (const re of rule.patterns) {
      const hit = masked.match(re);
      if (hit) {
        // Skip REVIEW-tier duplicates of something already blocked in category.
        if (rule.tier === "REVIEW" && reasons.some(r => r.category === rule.category)) continue;
        reasons.push(tag({ category: rule.category, match: hit[0].slice(0, 80) }));
        bump(rule.tier);
      }
    }
  }

  return { verdict, reasons };
}

/** Moderate several named fields and merge results (worst verdict wins). */
export function moderateFields(
  fields: Record<string, string | null | undefined>,
): ModerationResult {
  let verdict: ModerationVerdict = "ALLOW";
  const reasons: ModerationReason[] = [];
  for (const [field, value] of Object.entries(fields)) {
    if (typeof value !== "string" || !value.trim()) continue;
    const result = moderateContent(value, { fieldLabel: field });
    reasons.push(...result.reasons);
    if (result.verdict === "BLOCK") verdict = "BLOCK";
    else if (result.verdict === "REVIEW" && verdict === "ALLOW") verdict = "REVIEW";
  }
  return { verdict, reasons };
}

/** Friendly, sex-positive rejection copy per category. */
export function moderationMessage(category: string): string {
  switch (category) {
    case "SCAT":
      return "Kink is welcome here, but scat and waste-play content isn't allowed on the boards. Plenty of other filth is fine; this isn't.";
    case "GORE":
      return "This post mentions blood or gore, which isn't allowed on the boards. Sexy is fine; blood isn't.";
    case "WEAPONS":
      return "This post mentions weapons, which isn't allowed on the boards. Sexy is fine; this isn't.";
    case "ABUSE":
      return "This post reads as a threat or harassment, which isn't allowed here. Flirty is fine; cruel isn't.";
    case "ILLEGAL":
      return "This post includes content that can't be on this site, full stop.";
    case "LINKS":
      return "Links here are limited to social and payment profiles (Instagram, TikTok, Bluesky, OnlyFans, Fetlife, Linktree, Venmo, Cash App, Spotify, YouTube, Eventbrite). Other links aren't allowed.";
    default:
      return "This post includes content that isn't allowed on the boards.";
  }
}
