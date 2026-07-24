/**
 * Game poster generator — Swedish/Scandinavian minimal, matched to The Sports
 * Bra brand (hot pink on warm off-white, one bold grotesque, generous
 * whitespace, a single accent). Used to give watch-party game listings a clean
 * default poster when the source (Airtable schedule) has no flyer art.
 *
 * Deterministic everywhere: the SVG embeds Archivo (woff2, base64) and is
 * rasterized to PNG with sharp — no system fonts required on Railway.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const FONT_DIR = path.join(import.meta.dirname ?? __dirname, "fonts");
function fontFace(weight: number): string {
  const b64 = readFileSync(path.join(FONT_DIR, `archivo-${weight}.woff2`)).toString("base64");
  return `@font-face{font-family:AR;font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}
// Read + embed the three weights once at module load.
const FONTS = [500, 700, 900].map(fontFace).join("");

const PINK = "#E63E82";
const INK = "#171310";
const PAPER = "#FBF6EF";
const W = 1080;
const H = 1350;
const ML = 90;
const MR = 990;

export type GamePosterInput = {
  /** e.g. "NWSL", "WNBA", "USWNT Friendly" */
  league: string;
  /** Small pink label after the league — defaults to "Watch Party" */
  tag?: string;
  /** First team, or a single-line billing ("USA vs Canada") */
  away: string;
  /** Second team; omit for single-line events */
  home?: string | null;
  /** e.g. "Sat · Aug 1" */
  dateLabel: string;
  /** e.g. "7:30 PM" */
  timeLabel: string;
  /** Footer address line; defaults to the bar */
  addressLine?: string;
};

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Rough cap-width estimate for Archivo Black uppercase — used only to choose
// where hero lines wrap. Over-estimates slightly so text never overruns.
const estWidth = (t: string, size: number, ls: number): number =>
  t.length * size * 0.63 + Math.max(0, t.length - 1) * ls;

function wrapHero(text: string, size: number, ls: number, maxW: number): string[] {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (estWidth(trial, size, ls) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Build the poster as a self-contained SVG string (fonts embedded). */
export function buildGamePosterSvg(input: GamePosterInput): string {
  const league = input.league || "Game Day";
  const tag = input.tag || "Watch Party";
  const away = input.away || "Women's Sports";
  const home = input.home || null;
  const dateLabel = input.dateLabel || "This Week";
  const timeLabel = input.timeLabel || "See Bar";
  const addressLine = input.addressLine || "2512 NE Broadway · Portland OR";
  const maxW = MR - ML;

  const heroSize = 118;
  const ls = -0.015 * heroSize;
  const parts = home ? [away, "vs", home] : [away];
  const heroLines: Array<{ t: string; vs: boolean }> = [];
  for (const part of parts) {
    if (part === "vs") {
      heroLines.push({ t: "vs", vs: true });
      continue;
    }
    for (const ln of wrapHero(part, heroSize, ls, maxW)) heroLines.push({ t: ln, vs: false });
  }

  let y = 360;
  const heroSvg = heroLines
    .map((l) => {
      if (l.vs) {
        const s = `<text x="${ML + 6}" y="${y + 30}" font-size="40" font-weight="500" fill="${PINK}" letter-spacing="13.6">VS</text>`;
        y += 96;
        return s;
      }
      const s = `<text x="${ML}" y="${y + 92}" font-size="${heroSize}" font-weight="900" fill="${INK}" letter-spacing="${ls.toFixed(2)}">${esc(l.t)}</text>`;
      y += 108;
      return s;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><style>${FONTS}text{font-family:AR}</style></defs>
<rect width="${W}" height="${H}" fill="${PAPER}"/>
<circle cx="${W + 60}" cy="960" r="210" fill="${PINK}"/>
<text x="${ML}" y="128" font-size="30" font-weight="900" fill="${PINK}" letter-spacing="0.6">THE SPORTS BRA®</text>
<text x="${MR}" y="128" text-anchor="end" font-size="22" font-weight="700" fill="${INK}" letter-spacing="6.16">PORTLAND</text>
<rect x="${ML}" y="162" width="${maxW}" height="5" fill="${INK}"/>
<text x="${ML}" y="246" font-size="26" font-weight="700" fill="${INK}" letter-spacing="6.76">${esc(String(league).toUpperCase())} <tspan fill="${PINK}">· ${esc(String(tag).toUpperCase())}</tspan></text>
${heroSvg}
<rect x="${ML}" y="1148" width="${maxW}" height="5" fill="${INK}"/>
<text x="${ML}" y="1226" font-size="58" font-weight="900" fill="${INK}" letter-spacing="-0.58">${esc(String(dateLabel).toUpperCase())}</text>
<text x="${MR}" y="1226" text-anchor="end" font-size="58" font-weight="900" fill="${PINK}" letter-spacing="-0.58">${esc(String(timeLabel).toUpperCase())}</text>
<text x="${ML}" y="1272" font-size="24" font-weight="500" fill="${INK}" fill-opacity="0.75" letter-spacing="3.84">${esc(String(addressLine).toUpperCase())}</text>
</svg>`;
}

/** Rasterize the poster SVG to a PNG buffer (deterministic — fonts embedded). */
export async function renderGamePosterPng(input: GamePosterInput): Promise<Buffer> {
  const svg = buildGamePosterSvg(input);
  return sharp(Buffer.from(svg)).png().toBuffer();
}
