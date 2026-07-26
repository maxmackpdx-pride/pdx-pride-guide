#!/usr/bin/env node
/**
 * Build Zaylist default social share cards (og-preview) from brand kit assets.
 * Exact wordmark pixels — no generative text. Run: node script/build-og-preview.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "client", "public");
const KIT = path.join(PUBLIC, "brand", "kit");

const W = 1200;
const H = 630;

const WORDMARK = path.join(KIT, "wordmark", "zaylist-wordmark-primary.png");
// Official App Face (cream Z + spectrum seam) — not the old glossy rainbow tile
const ICON = path.join(PUBLIC, "icons", "zaylist-1024.png");
const OUT_JPG = path.join(PUBLIC, "og-preview.jpg");
const OUT_PNG = path.join(PUBLIC, "og-preview.png");
const OUT_KIT = path.join(KIT, "social", "zaylist-og-1200x630.png");
const OUT_TWITTER = path.join(KIT, "social", "zaylist-twitter-1200x630.png");

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Soft vignette + spectrum rails + taglines (SVG overlay). */
function overlaySvg({ tagline, domain }) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rb" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FF19D6"/>
      <stop offset="12%" stop-color="#FF196C"/>
      <stop offset="24%" stop-color="#FF5319"/>
      <stop offset="34%" stop-color="#FFD119"/>
      <stop offset="44%" stop-color="#9CFF19"/>
      <stop offset="54%" stop-color="#5BFF19"/>
      <stop offset="66%" stop-color="#19F7FF"/>
      <stop offset="76%" stop-color="#1956FF"/>
      <stop offset="90%" stop-color="#E419FF"/>
      <stop offset="100%" stop-color="#FF19D6"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="46%" r="55%">
      <stop offset="0%" stop-color="#19e3ff" stop-opacity="0.18"/>
      <stop offset="45%" stop-color="#ff00cc" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.35"/>
      <stop offset="35%" stop-color="#000" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>

  <!-- ambient glow behind lockup -->
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>

  <!-- spectrum rails -->
  <rect x="0" y="0" width="${W}" height="10" fill="url(#rb)"/>
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="url(#rb)"/>

  <!-- left accent bar -->
  <rect x="0" y="10" width="6" height="${H - 20}" fill="url(#rb)" opacity="0.85"/>

  <!-- tagline under wordmark area -->
  <text
    x="${W / 2}"
    y="520"
    text-anchor="middle"
    font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    font-size="28"
    font-weight="600"
    letter-spacing="4"
    fill="#E8EEF7"
  >${escapeXml(tagline)}</text>

  <text
    x="${W / 2}"
    y="568"
    text-anchor="middle"
    font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    font-size="22"
    font-weight="500"
    letter-spacing="3"
    fill="#8B9BB0"
  >${escapeXml(domain)}</text>
</svg>`);
}

async function build() {
  for (const p of [WORDMARK, ICON]) {
    if (!fs.existsSync(p)) throw new Error(`Missing brand asset: ${p}`);
  }

  // Base plate
  const base = await sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: { r: 6, g: 6, b: 10 },
    },
  })
    .png()
    .toBuffer();

  // Wordmark: primary lockup (ZAYLIST + PORTLAND) — contain into center band
  const wordmarkW = 920;
  const wordmarkH = 360;
  const wordmark = await sharp(WORDMARK)
    .resize(wordmarkW, wordmarkH, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // App Face badge, top-left (square, no rounded corners — platforms mask)
  const iconSize = 112;
  const icon = await sharp(ICON)
    .resize(iconSize, iconSize, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  const svg = overlaySvg({
    tagline: "EVENTS  ·  GIGS  ·  COMMUNITY  ·  DIRECTORY",
    domain: "WWW.ZAYLIST.COM",
  });

  const composed = await sharp(base)
    .composite([
      {
        input: wordmark,
        left: Math.round((W - wordmarkW) / 2),
        top: 88,
      },
      {
        input: icon,
        left: 40,
        top: 36,
      },
      { input: svg, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  // PNG (lossless kit + public)
  await fs.promises.mkdir(path.dirname(OUT_KIT), { recursive: true });
  await fs.promises.writeFile(OUT_PNG, composed);
  await fs.promises.writeFile(OUT_KIT, composed);
  await fs.promises.writeFile(OUT_TWITTER, composed);

  // JPG for og-preview.jpg (crawlers that prefer jpeg shell)
  await sharp(composed)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(OUT_JPG);

  const meta = await sharp(OUT_JPG).metadata();
  console.log("Wrote:");
  console.log(" ", path.relative(ROOT, OUT_JPG), `${meta.width}x${meta.height}`, `${(fs.statSync(OUT_JPG).size / 1024).toFixed(0)}KB`);
  console.log(" ", path.relative(ROOT, OUT_PNG), `${(fs.statSync(OUT_PNG).size / 1024).toFixed(0)}KB`);
  console.log(" ", path.relative(ROOT, OUT_KIT));
  console.log(" ", path.relative(ROOT, OUT_TWITTER));
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
