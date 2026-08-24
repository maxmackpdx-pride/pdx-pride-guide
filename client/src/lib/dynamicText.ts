/**
 * Dynamic Text — general-purpose solver for any fixed-frame title motif on the
 * site, not just HAÜZ cards.
 *
 * Ported from the canonical generator:
 *   zaylist-foundation-library/public/design-system/guidelines/dynamic-text.html
 *   (commit cdd50bd, "Allow manual Dynamic Text row breaks")
 *
 * THE CONTRACT (verbatim from the canonical guide's spec table):
 *  - Typeface: Barlow Condensed 900, all caps.
 *  - Row structure: whole words only. Automatic grouping is allowed. A manual
 *    line break in the source string is authoritative.
 *  - Width: 100% per rendered row, so every row starts and ends on the same
 *    vertical edges. That is the canonical default for every caller. A
 *    caller may opt into `fitWithinFrame` to recover frame height on a row
 *    grouping that would otherwise be flagged — every row in the block
 *    shrinks by the same ratio, no further than it has to, down to the
 *    readable floor (MIN_ROW_SIZE) if truly necessary — but this is a
 *    per-caller exception, not part of the site-wide contract, and defaults
 *    OFF. Owner-approved for HAÜZ specifically, 2026-08-23: "biggest font
 *    sizes possible that still fit within the borders." (An earlier version
 *    of this capped the shrink at a fixed percentage instead — 5%, then
 *    6.75%, then 6.2% — but real cases needed 25–42% to actually fit, so a
 *    small cap left results that were both still flagged AND smaller than
 *    they needed to be. Solving exactly for what fits is strictly better
 *    than guessing a percentage.) Other surfaces adopting Dynamic Text get
 *    the strict canonical behavior unless they deliberately opt in too.
 *  - Scale: per-row font size. Rows can be larger or smaller than each other,
 *    but every row scales evenly in both dimensions (real font-size, never a
 *    non-uniform stretch). A row carries extra space above it sized to its
 *    OWN measured diacritic overshoot (actualBoundingBoxAscent vs. the same
 *    text with diacritics stripped) — the canonical guide's own line-height
 *    (0.82) leaves no headroom for that on its own, and a flat guessed gap
 *    either wastes space on plain rows or still clips accented ones.
 *  - Spacing: normal font spacing. Never use tracking, added gaps, or
 *    character-by-character positioning to force a row to fit.
 *  - Frame: fixed. Text fills the named frame. It never expands a card,
 *    pushes a neighbor, or invents a new row of layout.
 *  - Limits: 1 to 3 rows. Maximize each row's own width and the block's use
 *    of the available height, but only among groupings that already fit
 *    comfortably — never force a split, then invent a way to make it fit.
 *    Reject or shorten copy that cannot fit at the approved readable size.
 *    A caller may opt into `preferTwoRows` to try every 2-row split before
 *    the general search — HAÜZ's own opt-in (HOUSING_PREFER_TWO_ROWS),
 *    "almost always two lines except with one word." Defaults off; this is
 *    a per-caller visual preference, not part of the canonical contract.
 *  - Accessible label: the original, unbroken source string. Visual splitting
 *    never changes reading order; expose the unbroken string as the
 *    accessible name.
 *
 * WHY THIS EXISTS AS ITS OWN MODULE (not inlined in HousingWell.tsx).
 * It was inlined once, and the HAÜS-specific caller added a suffix special
 * case that short-circuited the search instead of feeding "HAÜS" through it
 * as an ordinary word. That produced 2-row blocks sized to fill frame width
 * with no check that the combined row heights still fit the frame, which
 * silently overflowed on desktop for most "___ HAÜS" names — verified against
 * the real shipped font: "Sunnyside HAÜS" on a half card scored 73px/152px
 * against a 139px-tall frame. The general search below already finds
 * ["SUNNYSIDE HAÜS"] at 48px, or a better split, on its own — it does not
 * need a caller to force one. Any surface that special-cases a suffix or a
 * fixed split is very likely reintroducing that bug. Feed the solver the full
 * string and let it search.
 *
 * If some future surface genuinely needs a token guaranteed its own row
 * (a locked suffix, a fixed sign-off line), pass it as a manual break
 * ("\n") rather than reimplementing a shortcut here — that keeps it inside
 * the same scored search instead of bypassing it. Be aware a manual break is
 * authoritative and skips the search entirely, so it can still produce an
 * out-of-range result if that exact split doesn't fit — the search exists
 * specifically to avoid that by trying every split and picking one that does.
 */

/** Reference size the canvas measures at. Every row size is solved relative to it. */
const MEASURE_BASIS_PX = 100;
const MEASURE_FONT = `900 ${MEASURE_BASIS_PX}px 'Barlow Condensed', 'Arial Narrow', sans-serif`;

/** Readable band. Below the minimum, the result is flagged, not clipped or shrunk further. */
const MIN_ROW_SIZE = 24;
const MAX_ROW_SIZE = 220;

/** Height weight per row, matching the shipped `.hz-well__name-line` line-height (0.82). */
const ROW_HEIGHT_WEIGHT = 0.82;

/**
 * A row is normally sized to exactly fill frameW. When a grouping's natural
 * combined height overflows frameH, a caller can opt into letting every row
 * in the block shrink UNIFORMLY (same ratio, so the relationship between
 * rows is unchanged) — by exactly as much as needed to fit frameH, no more,
 * down to the readable floor (MIN_ROW_SIZE) if that's genuinely required.
 * Never used to grow past 100%.
 *
 * This is NOT a site-wide default — solveDynamicText's `fitWithinFrame`
 * parameter defaults to false (strict, canonical, matches the Foundation
 * Library guide exactly). HOUSING_FIT_WITHIN_FRAME is HAÜZ's own opt-in,
 * owner-approved 2026-08-23 specifically for housing titles (very short
 * names — a bare first name, a short household name — forced onto multiple
 * rows have little other room to give). Another surface adopting Dynamic
 * Text should stay at the default `false` unless it separately earns its
 * own opt-in, the same way this one did.
 *
 * Only a grouping that still can't fit even at MIN_ROW_SIZE for every row
 * stays flagged — this is meant to actually resolve real cases, not just
 * nudge them, so there's no arbitrary percentage ceiling in between.
 */
export const HOUSING_FIT_WITHIN_FRAME = true;

/**
 * When true, a title with 2+ words tries every 2-row split first — scored
 * the same way as the general search — and uses the best one as long as it
 * still fits (with fitWithinFrame's help, if that's also on) after
 * recovery. Only falls back to the full 1-to-3-row search if every 2-row
 * split is genuinely unworkable. A single word always renders as 1 row;
 * this has no effect there.
 *
 * NOT a site-wide default — solveDynamicText's `preferTwoRows` parameter
 * defaults to false. HOUSING_PREFER_TWO_ROWS is HAÜZ's own opt-in,
 * owner-approved 2026-08-23: "almost always two lines except with one
 * word." This is a visual/design preference for HAÜZ cards specifically,
 * not a canonical Dynamic Text rule — the guide's own contract says
 * maximize width and height among groupings that already fit, which is
 * row-count-agnostic. Another surface adopting Dynamic Text should stay at
 * the default `false` unless it separately earns this same opt-in.
 */
export const HOUSING_PREFER_TWO_ROWS = true;

/** 1 to 3 rows, per the contract. */
const MAX_ROWS = 3;
/** Candidate rows may group up to 4 consecutive words. Keeps the search bounded. */
const MAX_WORDS_PER_ROW = 4;
/** Hard ceiling on the recursive candidate search so a very long string can't hang. */
const MAX_CANDIDATES = 5000;

let measureCtx: CanvasRenderingContext2D | null = null;
let measureCache = new Map<string, number>();
let measureAscentCache = new Map<string, number>();

function ensureCtx(): void {
  if (!measureCtx && typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    measureCtx = canvas.getContext("2d");
  }
}

/** Advance width of one line at the reference size. Cached per exact string. */
function measureLine(text: string): number {
  const cached = measureCache.get(text);
  if (cached !== undefined) return cached;
  ensureCtx();
  let width = Math.max(1, text.length * 45); // crude fallback if canvas is unavailable
  if (measureCtx) {
    measureCtx.font = MEASURE_FONT;
    width = Math.max(1, measureCtx.measureText(text).width);
  }
  measureCache.set(text, width);
  return width;
}

/**
 * Gap above every row after the first, sized to the ACTUAL diacritic overshoot
 * of that row's own text — not a guessed constant. A tight 0.82 line-height has
 * no headroom for ascenders or diacritics: "HAÜS" measures an
 * actualBoundingBoxAscent of 93 units at the 100px reference size versus 71 for
 * every plain-cap string (WHISKEY, JACK, ROWAN, …) — a real 22-unit overshoot
 * from the umlaut alone. A row with no diacritic measures the same ascent as
 * its own diacritic-stripped self, so this is naturally 0 there and adds no
 * wasted space. Folded into the height math below so the solver's fit check
 * accounts for the real rendered space, not just the row boxes.
 */
function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** actualBoundingBoxAscent at the reference size. 0 if the browser can't report it. */
function measureAscent(text: string): number {
  const cached = measureAscentCache.get(text);
  if (cached !== undefined) return cached;
  ensureCtx();
  let ascent = 0;
  if (measureCtx) {
    measureCtx.font = MEASURE_FONT;
    ascent = measureCtx.measureText(text).actualBoundingBoxAscent ?? 0;
  }
  measureAscentCache.set(text, ascent);
  return ascent;
}

/** Extra space above a row carrying this text, in px, given that row's own solved size. */
export function rowGapAbove(text: string, sizePx: number): number {
  const overshootRatio = Math.max(0, measureAscent(text) - measureAscent(stripDiacritics(text))) / MEASURE_BASIS_PX;
  return overshootRatio * sizePx;
}

/** Clear cached metrics. Call once webfonts resolve, or fallback-font metrics stick. */
export function clearDynamicTextCache(): void {
  measureCache = new Map();
  measureAscentCache = new Map();
}

export type DynamicTextResult = {
  lines: string[];
  /** One font size per line, in px, aligned to `lines`. */
  sizes: number[];
  /**
   * True when even the best-scoring grouping needs a row outside the
   * [24, 220]px band or a combined height taller than the frame. The result
   * still renders — flag it (shorter copy, a manual break, or a wider frame),
   * do not clip or shrink silently.
   */
  outOfRange: boolean;
};

type ScoredResult = DynamicTextResult & { score: number };

function scoreRows(lines: string[], frameW: number, frameH: number): ScoredResult {
  const sizes = lines.map((line) => (frameW / measureLine(line)) * MEASURE_BASIS_PX);
  const usedHeight = sizes.reduce(
    (sum, size, i) => sum + size * ROW_HEIGHT_WEIGHT + (i > 0 ? rowGapAbove(lines[i], size) : 0),
    0,
  );
  const outOfRange = sizes.some((size) => size < MIN_ROW_SIZE || size > MAX_ROW_SIZE) || usedHeight > frameH;
  // A single word stranded alone on a non-final row reads as an accident, not
  // a choice — penalize it so a better grouping wins when one exists. The
  // final row is exempt (a one-word last line, e.g. a name's last name, is normal).
  const singletonPenalty = lines
    .slice(0, -1)
    .reduce((sum, line) => sum + (line.split(" ").length === 1 ? 80 : 0), 0);
  return {
    lines,
    sizes,
    outOfRange,
    // Natural sizing — this raw score is what decides which grouping WINS
    // (see solveDynamicText). fitWithinFrame is applied afterward, only to
    // the winner — see recoverToFit. Letting it influence this score lets a
    // worse-looking split sneak past the height penalty just because it's
    // technically rescuable — verified: it flipped a clean single-row
    // "WHISKEY TOWN HAÜS" (37px) into an unforced two-row split. The search
    // must never know a fit mode exists, regardless of what the caller passed.
    score: Math.abs(frameH - usedHeight) + singletonPenalty + (outOfRange ? 100000 : 0),
  };
}

/**
 * Applied once, only to whichever candidate already won (by natural sizing,
 * via scoreRows above) or was manually specified. If it already fits, or
 * `fitWithinFrame` is false (the default for every caller that doesn't opt
 * in), this is a no-op. Otherwise every row shrinks by the same ratio —
 * whatever's needed to (a) hit frameH exactly and (b) bring the largest
 * natural row back under MAX_ROW_SIZE — down to whatever ratio keeps every
 * row at or above MIN_ROW_SIZE if either of those would require going below
 * it. Only a grouping that still doesn't fit at that readable floor stays
 * flagged.
 */
function recoverToFit(result: ScoredResult, frameH: number, fitWithinFrame: boolean): DynamicTextResult {
  const { lines, sizes: naturalSizes } = result;
  if (!fitWithinFrame) return { lines, sizes: naturalSizes, outOfRange: result.outOfRange };

  const naturalUsedHeight = naturalSizes.reduce(
    (sum, size, i) => sum + size * ROW_HEIGHT_WEIGHT + (i > 0 ? rowGapAbove(lines[i], size) : 0),
    0,
  );
  const naturalMaxSize = Math.max(...naturalSizes);
  const needsHeightRecovery = naturalUsedHeight > frameH;
  // A single oversized word (nothing else to shrink against) can exceed
  // MAX_ROW_SIZE on its own even when height is fine — verified: "Rowan"
  // alone on a wide frame solved to 232px natural, and height-recovery alone
  // only brought it to 232px too (barely enough to affect height, nowhere
  // near enough to satisfy the separate 220px ceiling). This needs its own
  // target, not just a side effect of the height target.
  const needsSizeCeiling = naturalMaxSize > MAX_ROW_SIZE;
  if (!needsHeightRecovery && !needsSizeCeiling) {
    return { lines, sizes: naturalSizes, outOfRange: result.outOfRange };
  }

  // Shrinking uniformly, the row with the smallest natural size hits the
  // readable floor first — that sets how far the whole block can go.
  const kFloor = MIN_ROW_SIZE / Math.min(...naturalSizes);
  const kHeightTarget = needsHeightRecovery ? Math.min(1, frameH / naturalUsedHeight) : 1;
  const kSizeCeiling = needsSizeCeiling ? MAX_ROW_SIZE / naturalMaxSize : 1;
  const k = Math.max(kFloor, Math.min(kHeightTarget, kSizeCeiling));
  const sizes = naturalSizes.map((size) => size * k);
  const usedHeight = sizes.reduce(
    (sum, size, i) => sum + size * ROW_HEIGHT_WEIGHT + (i > 0 ? rowGapAbove(lines[i], size) : 0),
    0,
  );
  const outOfRange =
    sizes.some((size) => size < MIN_ROW_SIZE || size > MAX_ROW_SIZE) || usedHeight > frameH + 1e-6;
  // Epsilon above, not below: k can be solved specifically to make
  // usedHeight equal frameH, so floating-point rounding in the size*k
  // multiplication chain can land a few billionths of a px over frameH on
  // an otherwise exact fit. Verified: without this, a case that solves to
  // usedHeight 110.20000000000002 against frameH 110.19999999999999 (real
  // numbers, real device widths) incorrectly flagged as out of range.
  return { lines, sizes, outOfRange };
}

/**
 * Solve a title into 1 to 3 rows that fill a fixed frame.
 *
 * @param source          The untouched title. A literal newline in the string
 *                        is treated as an authored, authoritative row break —
 *                        the solver will not search for a different grouping.
 * @param frameW          Fixed frame width in px. Every row is sized to
 *                        exactly fill it (subject to fitWithinFrame below).
 * @param frameH          Fixed frame height in px. Used to score which
 *                        grouping wins.
 * @param fitWithinFrame  Defaults to false — the strict, canonical behavior,
 *                        no recovery, matches the Foundation Library guide
 *                        exactly. Pass true (e.g. HOUSING_FIT_WITHIN_FRAME)
 *                        to opt into shrinking the winning grouping just
 *                        enough to fit, down to the readable floor. This is
 *                        a per-caller decision, not a site-wide default.
 * @param preferTwoRows   Defaults to false — the strict, canonical
 *                        row-count-agnostic search. Pass true (e.g.
 *                        HOUSING_PREFER_TWO_ROWS) to try every 2-row split
 *                        first for a 2+-word title, falling back to the
 *                        full search only if none work. Also a per-caller
 *                        decision, not a site-wide default.
 */
export function solveDynamicText(
  source: string,
  frameW: number,
  frameH: number,
  fitWithinFrame: boolean = false,
  preferTwoRows: boolean = false,
): DynamicTextResult {
  const manualRows = String(source)
    .trim()
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (manualRows.length > 1) {
    return recoverToFit(
      scoreRows(manualRows.map((line) => line.toUpperCase()), frameW, frameH),
      frameH,
      fitWithinFrame,
    );
  }

  const words = String(source).trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: [], sizes: [], outOfRange: false };

  if (preferTwoRows && words.length > 1) {
    const twoRowCandidates: string[][] = [];
    for (let i = 1; i < words.length; i++) {
      twoRowCandidates.push([words.slice(0, i).join(" "), words.slice(i).join(" ")]);
    }
    const bestTwoRow = twoRowCandidates
      .map((rows) => scoreRows(rows, frameW, frameH))
      .sort((a, b) => a.score - b.score)[0];
    const recovered = recoverToFit(bestTwoRow, frameH, fitWithinFrame);
    if (!recovered.outOfRange) return recovered;
    // Every 2-row split is genuinely unworkable even after recovery — fall
    // through to the full search below rather than ship a flagged result
    // when a different row count would have actually fit.
  }

  const candidates: string[][] = [];
  const visit = (start: number, rows: string[]) => {
    if (rows.length > MAX_ROWS || candidates.length > MAX_CANDIDATES) return;
    if (start === words.length) {
      candidates.push(rows);
      return;
    }
    for (let end = start + 1; end <= Math.min(words.length, start + MAX_WORDS_PER_ROW); end++) {
      visit(end, [...rows, words.slice(start, end).join(" ")]);
    }
  };
  visit(0, []);

  const best = candidates.map((rows) => scoreRows(rows, frameW, frameH)).sort((a, b) => a.score - b.score)[0];
  return recoverToFit(best ?? scoreRows([words.join(" ")], frameW, frameH), frameH, fitWithinFrame);
}
