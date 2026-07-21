/**
 * Flyer sourcing — GitHub repo `flyers/` folder (Phase 1 of the Flyer Reader).
 *
 * Two paths, tried in order:
 * 1. LOCAL DISK — the flyers folder ships with the repo, so the deployed
 *    Railway app already has the files. Zero network, zero rate limits.
 * 2. GITHUB API — freshness between deploys / private-repo access. Uses
 *    GITHUB_FLYERS_REPO ("owner/repo", defaults to this app's repo) and
 *    optional GITHUB_TOKEN for private repos.
 *
 * Paths are strictly confined to the flyers directory — no traversal, no
 * absolute paths, image/PDF extensions only.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const FLYERS_DIR = process.env.FLYERS_DIR?.trim() || "flyers";
const GITHUB_REPO =
  process.env.GITHUB_FLYERS_REPO?.trim() || "maxmackpdx-pride/pdx-pride-guide";
const GITHUB_BRANCH = process.env.GITHUB_FLYERS_BRANCH?.trim() || "master";

const ALLOWED_EXT = /\.(png|jpe?g|webp|gif|avif|pdf)$/i;
const MAX_BYTES = 15_000_000;

export type FlyerSource = { buffer: Buffer; source: "disk" | "github"; path: string };

/** Normalize + validate a caller-supplied flyer path. Throws on bad input. */
export function safeFlyerRelPath(raw: string): string {
  const cleaned = String(raw || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const rel = cleaned.startsWith(`${FLYERS_DIR}/`) ? cleaned : `${FLYERS_DIR}/${cleaned}`;
  const normalized = path.posix.normalize(rel);
  if (
    !normalized.startsWith(`${FLYERS_DIR}/`) ||
    normalized.includes("..") ||
    !ALLOWED_EXT.test(normalized)
  ) {
    throw new Error(
      `Invalid flyer path (must be an image/PDF under ${FLYERS_DIR}/): ${raw}`,
    );
  }
  return normalized;
}

async function fetchFromGitHub(relPath: string): Promise<Buffer> {
  const token = process.env.GITHUB_TOKEN?.trim() || "";
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURI(
    relPath,
  )}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github.raw+json",
        "User-Agent": "PDXPrideGuide-FlyerReader/1.0",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`GitHub fetch failed: HTTP ${res.status} for ${relPath}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(`Flyer over ${MAX_BYTES} byte cap: ${relPath}`);
    }
    return buf;
  } finally {
    clearTimeout(timer);
  }
}

/** Load a flyer by repo-relative path (e.g. "flyers/alien-orgy-aug.png"). */
export async function loadFlyer(rawPath: string): Promise<FlyerSource> {
  const relPath = safeFlyerRelPath(rawPath);

  // 1. Disk (repo ships with the deploy)
  const diskPath = path.join(process.cwd(), relPath);
  if (existsSync(diskPath)) {
    const buffer = readFileSync(diskPath);
    if (buffer.byteLength > MAX_BYTES) {
      throw new Error(`Flyer over ${MAX_BYTES} byte cap: ${relPath}`);
    }
    return { buffer, source: "disk", path: relPath };
  }

  // 2. GitHub API
  const buffer = await fetchFromGitHub(relPath);
  return { buffer, source: "github", path: relPath };
}
