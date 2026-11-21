/**
 * Dynamic 1200×630 social share cards (events, places, profiles).
 * Replaces raw flyer/logo/avatar (or generic og-preview) in og:image / twitter:image.
 */
import fs from "node:fs";
import {profileShareDisplayPath} from "./profileShareType";
import {createProfileShareCache} from "./profileShareCache";
import {PROFILE_SHARE_IMAGE_VERSION, profileShareImagePath} from "@shared/profileShare";
import path from "node:path";
import sharp from "sharp";
import { eventShareImagePath } from "@shared/eventSlug";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { resolveDirectoryLogo, directoryFallbackLogo } from "@shared/directoryLogos";
import { renderSocialCardArtwork } from "./socialCardArtwork";
import { storage } from "./storage";
import { canSharePublicEvent } from "@shared/publicEventVisibility";

const H = 630;
const SITE_URL = (process.env.SITE_URL || "https://www.zaylist.com").replace(/\/$/, "");

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"));

function publicRoots(): string[] {
  return [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "client", "public"),
    path.resolve(typeof __dirname === "string" ? __dirname : path.join(process.cwd(), "server"), "public"),
  ];
}

/** Map a site path (/posters/x.jpg, /uploads/y.png) to a local file if present. */
export function resolveLocalAsset(urlPath: string | null | undefined): string | null {
  if (!urlPath) return null;
  if (/^https?:\/\//i.test(urlPath)) return null; // remote - skip embed for now
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

export function ogEventCardUrl(eventId: number): string {
  return SITE_URL + eventShareImagePath(eventId);
}

export function ogPlaceCardUrl(placeId: number): string {
  return `${SITE_URL}/api/og/place/${placeId}?v=4`;
}

/** Bump when profile card layout/fetch logic changes so scrapers re-pull (not sticky cache). */
const PROFILE_OG_VERSION = PROFILE_SHARE_IMAGE_VERSION;
const profileShareCache = createProfileShareCache();

export function ogProfileCardUrl(username: string): string {
  return `${SITE_URL}${profileShareImagePath(username)}`;
}

export async function renderEventOgCard(eventId: number): Promise<Buffer | null> {
  const evt = storage.getEvent(eventId);
  if (!evt || !canSharePublicEvent(evt)) return null;

  const posterRel = resolveEventPosterUrl(evt.id, evt.posterImageUrl, evt.dayOfWeek);
  const local = resolveLocalAsset(posterRel);
  const raw = await loadImageBuffer(local);

  const image = await renderSocialCardArtwork(raw, "contain", () => makeFallbackArtwork(evt.title));
  const current = storage.getEvent(eventId);
  return current && canSharePublicEvent(current) ? image : null;
}

function makeFallbackArtwork(title: string, color = "#fff"): Buffer {
  const lines = wrapTitle(title.toUpperCase(), 20, 4);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="620" height="${H}">
  ${lines.map((line, i) => {
    const y = (H - lines.length * 60) / 2 + i * 60;
    return profileShareDisplayPath(line, { x: 48, y, width: 500, height: 54, maxSize: 52 }, color)
      || `<text x="48" y="${y + 44}" fill="${escapeXml(color)}" font-family="sans-serif" font-size="38">${escapeXml(line)}</text>`;
  }).join("")}
</svg>`);
}

export async function renderPlaceOgCard(placeId: number): Promise<Buffer | null> {
  const place = storage.getBusiness(placeId) as any;
  if (!place || place.active === false) return null;

  const logoRel =
    resolveDirectoryLogo(place.name, place.imageUrl)
    || directoryFallbackLogo(String(place.type || "venue"));
  const local = resolveLocalAsset(logoRel);
  const raw = await loadImageBuffer(local);

  return renderSocialCardArtwork(raw, "contain", () => makeFallbackArtwork(String(place.name || "Place")));
}

export async function renderProfileOgCard(usernameRaw: string): Promise<Buffer | null> {
  const username = String(usernameRaw || "").trim().replace(/^@/, "");
  if (!username) return null;
  const user = storage.getUserByUsername(username) as any;
  if (!user || String(user.status || "").toLowerCase() !== "active") return null;

  const localPhoto = resolveLocalAsset(user.photoUrl);
  const photoRevision = localPhoto ? fs.statSync(localPhoto).mtimeMs : null;
  const key = JSON.stringify([PROFILE_OG_VERSION, user.username, user.displayName, user.photoUrl, photoRevision, user.avatarRing, user.accentColor]);
  // The active-public gate above runs on every request, before any cached artwork is returned.
  return profileShareCache(key, () => renderPublicProfileArtwork(user, username));
}

export async function renderPublicProfileArtwork(user: {photoUrl?: string | null; avatarRing?: string | null; displayName?: string | null; username?: string; accentColor?: string | null}, username: string): Promise<Buffer> {
  const raw = await loadAvatarBuffer(user.photoUrl || null);
  const display = String(user.displayName || user.username || username).trim();
  const accent = /^#[0-9a-f]{6}$/i.test(user.accentColor || "") ? user.accentColor! : "#FF1FA0";
  return renderSocialCardArtwork(raw, "cover", () => makeFallbackArtwork(display, accent));
}
