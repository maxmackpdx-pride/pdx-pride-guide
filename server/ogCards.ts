/**
 * Dynamic 1200×630 social share cards (events + directory places).
 * Replaces raw flyer/logo (or generic og-preview) in og:image / twitter:image.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { resolveDirectoryLogo, directoryFallbackLogo } from "@shared/directoryLogos";
import { storage } from "./storage";
import {
  getTuckerHostedArchiveRow,
  isTuckerHostedArchiveId,
  tuckerHostedArchiveAsEvent,
} from "@shared/tuckerHostedArchive";

const W = 1200;
const H = 630;
const SITE_URL = (process.env.SITE_URL || "https://www.prideguidepdx.com").replace(/\/$/, "");

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
  <text x="${textX}" y="72" fill="#CCFF00" font-family="ui-monospace, Menlo, monospace" font-size="18" letter-spacing="0.22em">PDX PRIDE GUIDE · EVENT</text>
  ${titleSvg}
  ${meta ? `<text x="${textX}" y="${160 + titleLines.length * 58 + 24}" fill="#19E3FF" font-family="ui-monospace, Menlo, monospace" font-size="22" letter-spacing="0.12em">${escapeXml(meta.toUpperCase())}</text>` : ""}
  <text x="${textX}" y="${H - 48}" fill="#888888" font-family="ui-monospace, Menlo, monospace" font-size="16" letter-spacing="0.16em">PRIDEGUIDEPDX.COM</text>
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

export async function renderPlaceOgCard(placeId: number): Promise<Buffer | null> {
  const place = storage.getBusiness(placeId) as any;
  if (!place || place.active === false) return null;

  const logoRel =
    resolveDirectoryLogo(place.name, place.imageUrl)
    || directoryFallbackLogo(String(place.type || "venue"));
  const local = resolveLocalAsset(logoRel);
  const raw = await loadImageBuffer(local);

  const logoBox = 360;
  let logoBuf: Buffer | null = null;
  if (raw) {
    try {
      logoBuf = await fitContain(raw, logoBox, logoBox);
    } catch {
      logoBuf = null;
    }
  }

  const titleLines = wrapTitle(String(place.name || "Place"), 22, 3);
  const sub = [place.neighborhood, place.type].filter(Boolean).join(" · ");
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="640" y="${220 + i * 52}" fill="#FFFFFF" font-family="Arial Narrow, Arial, sans-serif" font-weight="900" font-size="46" letter-spacing="0.02em">${escapeXml(line.toUpperCase())}</text>`,
    )
    .join("\n");

  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${baseDefs()}
  <rect width="${W}" height="${H}" fill="#0a0a0a"/>
  ${rainbowBarSvg()}
  <rect x="48" y="48" width="440" height="534" rx="16" fill="#0c0c0f" stroke="#1c1c22" stroke-width="2"/>
  <text x="640" y="100" fill="#FF00CC" font-family="ui-monospace, Menlo, monospace" font-size="18" letter-spacing="0.22em">QUEER PORTLAND DIRECTORY</text>
  ${titleSvg}
  ${sub ? `<text x="640" y="${220 + titleLines.length * 52 + 28}" fill="#19E3FF" font-family="ui-monospace, Menlo, monospace" font-size="20" letter-spacing="0.1em">${escapeXml(String(sub).toUpperCase())}</text>` : ""}
  <text x="640" y="${H - 48}" fill="#888888" font-family="ui-monospace, Menlo, monospace" font-size="16" letter-spacing="0.16em">PRIDEGUIDEPDX.COM/DIRECTORY</text>
</svg>`);

  const base = await sharp(svg).png().toBuffer();
  if (!logoBuf) return base;

  const logoLeft = 48 + Math.round((440 - logoBox) / 2);
  const logoTop = 48 + Math.round((534 - logoBox) / 2);

  return sharp(base)
    .composite([{ input: logoBuf, left: logoLeft, top: logoTop }])
    .png()
    .toBuffer();
}
