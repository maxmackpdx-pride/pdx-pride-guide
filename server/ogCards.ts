/**
 * Dynamic 1200×630 social share cards (events, places, profiles).
 * Replaces raw flyer/logo/avatar (or generic og-preview) in og:image / twitter:image.
 *
 * Profile cards: full-bleed rectangular photo — pride ring glows around the
 * outer edge of the image (inward), not a circular crop.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { resolveDirectoryLogo, directoryFallbackLogo } from "@shared/directoryLogos";
import { normalizeAvatarRing, type AvatarRingId } from "@shared/avatarRings";
import { storage } from "./storage";
import {
  getTuckerHostedArchiveRow,
  isTuckerHostedArchiveId,
  tuckerHostedArchiveAsEvent,
} from "@shared/tuckerHostedArchive";

const W = 1200;
const H = 630;
const SITE_URL = (process.env.SITE_URL || "https://www.zaylist.com").replace(/\/$/, "");

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"));

function publicRoots(): string[] {
  return [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "client", "public"),
    path.resolve(__dirname, "public"),
  ];
}

/** Map a site path (/posters/x.jpg, /uploads/y.png) to a local file if present. */
export function resolveLocalAsset(urlPath: string | null | undefined): string | null {
  if (!urlPath) return null;
  if (/^https?:\/\//i.test(urlPath)) return null; // remote — skip embed for now
  const cleaned = urlPath.split("?")[0].replace(/^\/+/, "");
  if (cleaned.startsWith("uploads/")) {
    const file = path.join(UPLOADS_DIR, path.basename(cleaned));
    if (fs.existsSync(file)) return file;
  }
  for (const root of publicRoots()) {
    const file = path.join(root, cleaned);
    if (fs.existsSync(file)) return file;
  }
  // uploads without prefix
  const bare = path.join(UPLOADS_DIR, path.basename(cleaned));
  if (fs.existsSync(bare)) return bare;
  return null;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapTitle(title: string, maxChars = 28, maxLines = 4): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 3 ? `${last.slice(0, maxChars - 1)}…` : last;
  }
  return lines.slice(0, maxLines);
}

async function loadImageBuffer(localPath: string | null): Promise<Buffer | null> {
  if (!localPath) return null;
  try {
    return await fs.promises.readFile(localPath);
  } catch {
    return null;
  }
}

/**
 * Prefer a larger Google avatar than the OAuth default (s96-c is tiny for 1200×630).
 * Other remote hosts left as-is.
 */
export function preferLargeAvatarUrl(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  // Google profile photos: ...=s96-c → s720-c for OG quality
  if (/googleusercontent\.com/i.test(raw)) {
    if (/=s\d+/i.test(raw)) return raw.replace(/=s\d+(-[a-z0-9]+)*/gi, "=s720-c");
    return `${raw}${raw.includes("?") ? "&" : ""}=s720-c`;
  }
  return raw;
}

async function fetchRemoteImage(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Zaylist-OG/1.0 (+https://www.zaylist.com)",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(`[og] remote avatar HTTP ${res.status} for ${url.slice(0, 120)}`);
      return null;
    }
    const ctype = String(res.headers.get("content-type") || "");
    if (ctype && !ctype.startsWith("image/")) {
      console.warn(`[og] remote avatar non-image content-type ${ctype}`);
      return null;
    }
    const ab = await res.arrayBuffer();
    if (!ab.byteLength || ab.byteLength > 8 * 1024 * 1024) return null;
    return Buffer.from(ab);
  } catch (err) {
    console.warn("[og] remote avatar fetch failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Load avatar from local uploads OR remote HTTPS (Google login photos, etc.). */
async function loadAvatarBuffer(photoUrl: string | null | undefined): Promise<Buffer | null> {
  if (!photoUrl) return null;
  const local = resolveLocalAsset(photoUrl);
  if (local) return loadImageBuffer(local);

  if (!/^https:\/\//i.test(photoUrl)) return null;
  const preferred = preferLargeAvatarUrl(photoUrl);
  const big = await fetchRemoteImage(preferred);
  if (big) return big;
  // Fall back to original URL if size rewrite failed
  if (preferred !== photoUrl) return fetchRemoteImage(photoUrl);
  return null;
}

/** Flyer panel: cover-fit into a fixed box. */
async function fitCover(buf: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(buf)
    .rotate()
    .resize(width, height, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

/** Logo panel: contain inside box with padding. */
async function fitContain(buf: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(buf)
    .rotate()
    .resize(width, height, { fit: "contain", background: { r: 12, g: 12, b: 16, alpha: 1 } })
    .png()
    .toBuffer();
}

function rainbowBarSvg(): string {
  return `<rect x="0" y="0" width="${W}" height="8" fill="url(#rb)"/>`;
}

function baseDefs(): string {
  return `
  <defs>
    <linearGradient id="rb" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00FFFF"/>
      <stop offset="20%" stop-color="#39FF14"/>
      <stop offset="40%" stop-color="#CCFF00"/>
      <stop offset="60%" stop-color="#FF00CC"/>
      <stop offset="80%" stop-color="#8800FF"/>
      <stop offset="100%" stop-color="#FF6600"/>
    </linearGradient>
    <linearGradient id="leftScrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#060608" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#060608" stop-opacity="0"/>
    </linearGradient>
  </defs>`;
}

export function ogEventCardUrl(eventId: number): string {
  return `${SITE_URL}/api/og/event/${eventId}`;
}

export function ogPlaceCardUrl(placeId: number): string {
  return `${SITE_URL}/api/og/place/${placeId}`;
}

/** Bump when profile card layout/fetch logic changes so scrapers re-pull (not sticky cache). */
const PROFILE_OG_VERSION = "2";

export function ogProfileCardUrl(username: string): string {
  return `${SITE_URL}/api/og/profile/${encodeURIComponent(username.replace(/^@/, "").trim())}?v=${PROFILE_OG_VERSION}`;
}

/** Conic stops matching client avatar ring CSS (for rectangular edge glow). */
const RING_STOPS: Record<AvatarRingId, string[]> = {
  none: ["#19e3ff", "#ff00cc", "#ccff00", "#19e3ff"],
  rainbow: ["#E40303", "#FF8C00", "#FFED00", "#008026", "#24408E", "#732982", "#E40303"],
  progress: ["#E40303", "#FF8C00", "#FFED00", "#008026", "#24408E", "#FFFFFF", "#F6A9B8", "#55CDFC", "#784F17", "#E40303"],
  lesbian: ["#D52D00", "#FF9A56", "#FFFFFF", "#D362A4", "#A30262", "#D52D00"],
  "gay-men": ["#078D70", "#26CEAA", "#FFFFFF", "#98E8C1", "#5BCEFA", "#078D70"],
  bisexual: ["#D60270", "#D60270", "#9B4F96", "#0038A8", "#0038A8", "#D60270"],
  transgender: ["#5BCEFA", "#F5A9B8", "#FFFFFF", "#F5A9B8", "#5BCEFA", "#5BCEFA"],
  nonbinary: ["#FCF434", "#FFFFFF", "#9C59D1", "#333333", "#FCF434"],
  pansexual: ["#FF218C", "#FFD800", "#21B1FF", "#FF218C"],
  genderfluid: ["#FF76A4", "#FFFFFF", "#C011D7", "#333333", "#2F3CBE", "#FF76A4"],
  genderqueer: ["#B57EDC", "#FFFFFF", "#4A8123", "#B57EDC"],
  intersex: ["#FFD800", "#FFD800", "#79007F", "#FFD800"],
  asexual: ["#A3A3A3", "#FFFFFF", "#810081", "#C060C0", "#A3A3A3"],
  aromantic: ["#3DA542", "#FFFFFF", "#ABABAB", "#5ecf66", "#3DA542"],
  agender: ["#BABABA", "#FFFFFF", "#B4F8C8", "#FFFFFF", "#BABABA"],
  leather: ["#444444", "#FFFFFF", "#0000FF", "#6688ff", "#444444"],
  bear: ["#623818", "#FEEF9C", "#a06030", "#FEEF9C", "#623818"],
  chain: ["#8a919c", "#dfe5ee", "#5f6670", "#c8d0dc", "#8a919c"],
};

function ringGradientStops(ring: AvatarRingId): string {
  const stops = RING_STOPS[ring] || RING_STOPS.progress;
  return stops
    .map((c, i) => {
      const pct = Math.round((i / (stops.length - 1)) * 100);
      return `<stop offset="${pct}%" stop-color="${c}"/>`;
    })
    .join("");
}

export async function renderEventOgCard(eventId: number): Promise<Buffer | null> {
  let evt = storage.getEvent(eventId) as any;
  if ((!evt || evt.status !== "LIVE") && isTuckerHostedArchiveId(eventId)) {
    const row = getTuckerHostedArchiveRow(eventId);
    if (row) evt = tuckerHostedArchiveAsEvent(row);
  }
  if (!evt) return null;

  const posterRel = resolveEventPosterUrl(evt.id, evt.posterImageUrl, evt.dayOfWeek);
  const local = resolveLocalAsset(posterRel);
  const raw = await loadImageBuffer(local);

  const flyerW = 520;
  const flyerH = H - 8;
  let flyerBuf: Buffer | null = null;
  if (raw) {
    try {
      flyerBuf = await fitCover(raw, flyerW, flyerH);
    } catch {
      flyerBuf = null;
    }
  }

  const titleLines = wrapTitle(String(evt.title || "Event"), 26, 4);
  const venue = String(evt.venueName || "").trim();
  const day = String(evt.dayOfWeek || "").toUpperCase().slice(0, 3);
  const meta = [day, venue].filter(Boolean).join(" · ");

  const textX = flyerBuf ? 560 : 64;
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="${textX}" y="${160 + i * 58}" fill="#FFFFFF" font-family="Arial Narrow, Arial, sans-serif" font-weight="900" font-size="52" letter-spacing="0.02em">${escapeXml(line.toUpperCase())}</text>`,
    )
    .join("\n");

  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${baseDefs()}
  <rect width="${W}" height="${H}" fill="#0a0a0a"/>
  ${rainbowBarSvg()}
  <rect x="0" y="8" width="${W}" height="${H - 8}" fill="#0c0c0f"/>
  <text x="${textX}" y="72" fill="#CCFF00" font-family="ui-monospace, Menlo, monospace" font-size="18" letter-spacing="0.22em">ZAYLIST · EVENT</text>
  ${titleSvg}
  ${meta ? `<text x="${textX}" y="${160 + titleLines.length * 58 + 24}" fill="#19E3FF" font-family="ui-monospace, Menlo, monospace" font-size="22" letter-spacing="0.12em">${escapeXml(meta.toUpperCase())}</text>` : ""}
  <text x="${textX}" y="${H - 48}" fill="#888888" font-family="ui-monospace, Menlo, monospace" font-size="16" letter-spacing="0.16em">ZAYLIST.COM</text>
</svg>`);

  const base = sharp(svg).png();
  if (!flyerBuf) return base.toBuffer();

  return sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    },
  })
    .composite([
      { input: await base.toBuffer(), top: 0, left: 0 },
      { input: flyerBuf, top: 8, left: 0 },
      {
        input: Buffer.from(`<svg width="${flyerW}" height="${flyerH}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="url(#s)"/>
          <defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="0">
            <stop offset="70%" stop-color="#000" stop-opacity="0"/>
            <stop offset="100%" stop-color="#0a0a0a" stop-opacity="0.85"/>
          </linearGradient></defs>
        </svg>`),
        top: 8,
        left: 0,
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Directory place share card: logo only, centered on dark 1200×630.
 * No title / copy column — just the neon logo.
 */
export async function renderPlaceOgCard(placeId: number): Promise<Buffer | null> {
  const place = storage.getBusiness(placeId) as any;
  if (!place || place.active === false) return null;

  const logoRel =
    resolveDirectoryLogo(place.name, place.imageUrl)
    || directoryFallbackLogo(String(place.type || "venue"));
  const local = resolveLocalAsset(logoRel);
  const raw = await loadImageBuffer(local);

  // Large centered logo (leave margin so it doesn't touch the frame edge)
  const logoBox = 420;
  let logoBuf: Buffer | null = null;
  if (raw) {
    try {
      logoBuf = await fitContain(raw, logoBox, logoBox);
    } catch {
      logoBuf = null;
    }
  }

  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${baseDefs()}
  <rect width="${W}" height="${H}" fill="#0a0a0a"/>
  ${rainbowBarSvg()}
  <rect x="0" y="8" width="${W}" height="${H - 8}" fill="#0c0c0f"/>
</svg>`);

  const base = await sharp(svg).png().toBuffer();
  if (!logoBuf) return base;

  const logoLeft = Math.round((W - logoBox) / 2);
  const logoTop = Math.round((H - logoBox) / 2) + 2; // slight shift under rainbow bar

  return sharp(base)
    .composite([{ input: logoBuf, left: logoLeft, top: logoTop }])
    .png()
    .toBuffer();
}

/**
 * Profile share card: full-bleed rectangular avatar (not circular).
 * Pride ring is a soft glow around the outer edge of the 1200×630 image, bleeding inward.
 */
export async function renderProfileOgCard(usernameRaw: string): Promise<Buffer | null> {
  const username = String(usernameRaw || "").trim().replace(/^@/, "");
  if (!username) return null;
  const user = storage.getUserByUsername(username) as any;
  if (!user || String(user.status || "").toLowerCase() !== "active") return null;

  const ring = normalizeAvatarRing(user.avatarRing);
  // Local /uploads photos OR remote (Google Sign-In avatars — previously skipped → monogram fallback)
  const raw = await loadAvatarBuffer(user.photoUrl || null);

  let photoBuf: Buffer | null = null;
  if (raw) {
    try {
      photoBuf = await fitCover(raw, W, H);
    } catch {
      photoBuf = null;
    }
  }

  const display = String(user.displayName || user.username || username).trim();
  const handle = `@${user.username || username}`;
  const accent = String(user.accentColor || "#FF00CC").trim() || "#FF00CC";

  // Edge ring: thick outer stroke + blurred inward glow (rect frame, not circle)
  const edgeGlow = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      ${ringGradientStops(ring)}
    </linearGradient>
    <!-- Inward vignette so glow reads on the face edge -->
    <radialGradient id="inward" cx="50%" cy="50%" r="72%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
    <filter id="softer" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="28"/>
    </filter>
  </defs>
  <!-- Outer soft bloom (inward from edges) -->
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="url(#ring)" stroke-width="64" filter="url(#softer)" opacity="0.85"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="url(#ring)" stroke-width="28" filter="url(#soft)" opacity="0.95"/>
  <!-- Crisp inner edge band -->
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="url(#ring)" stroke-width="10" opacity="0.95"/>
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="url(#ring)" stroke-width="3" opacity="0.7"/>
  <!-- Darken center slightly so edge glow wins -->
  <rect width="${W}" height="${H}" fill="url(#inward)"/>
  <!-- Bottom name plate -->
  <rect x="0" y="${H - 120}" width="${W}" height="120" fill="#060608" fill-opacity="0.72"/>
  <text x="48" y="${H - 68}" fill="#CCFF00" font-family="ui-monospace, Menlo, monospace" font-size="16" letter-spacing="0.2em">ZAYLIST · MEMBER</text>
  <text x="48" y="${H - 28}" fill="#FFFFFF" font-family="Arial Narrow, Arial, sans-serif" font-weight="900" font-size="42" letter-spacing="0.02em">${escapeXml(display.toUpperCase())}</text>
  <text x="${W - 48}" y="${H - 32}" fill="${escapeXml(accent)}" font-family="ui-monospace, Menlo, monospace" font-size="22" letter-spacing="0.08em" text-anchor="end">${escapeXml(handle)}</text>
</svg>`);

  if (photoBuf) {
    return sharp(photoBuf)
      .composite([{ input: await sharp(edgeGlow).png().toBuffer(), top: 0, left: 0 }])
      .png()
      .toBuffer();
  }

  // No photo: solid dark field with monogram + same edge glow
  const initial = (display.replace(/[^a-zA-Z0-9]/g, "").slice(0, 1) || "?").toUpperCase();
  const fallback = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#121218"/>
  <text x="50%" y="48%" fill="${escapeXml(accent)}" font-family="Arial Narrow, Arial, sans-serif" font-weight="900" font-size="220" text-anchor="middle" dominant-baseline="middle">${escapeXml(initial)}</text>
</svg>`);

  return sharp(await sharp(fallback).png().toBuffer())
    .composite([{ input: await sharp(edgeGlow).png().toBuffer(), top: 0, left: 0 }])
    .png()
    .toBuffer();
}
