export type ImageCandidate = { src: string; width: number };

function lengthToPx(value: string, viewport: number): number | null {
  const text = value.trim();
  const px = text.match(/^([\d.]+)px$/);
  if (px) return Number(px[1]);
  const vw = text.match(/^([\d.]+)vw$/);
  if (vw) return (viewport * Number(vw[1])) / 100;
  const calc = text.match(/^calc\(100vw\s*-\s*([\d.]+)px\)$/);
  if (calc) return viewport - Number(calc[1]);
  return null;
}

/** CSS `sizes` length for the current viewport. `auto` is skipped. */
export function slotPixels(sizes: string | undefined, viewport: number, matches: (query: string) => boolean): number {
  if (!sizes) return viewport;
  const parts = sizes.split(",").map((part) => part.trim()).filter((part) => part && part !== "auto");
  for (const part of parts) {
    const media = part.match(/^\(([^)]+)\)\s+(.+)$/);
    if (media) {
      if (matches(`(${media[1]})`)) {
        const px = lengthToPx(media[2], viewport);
        if (px != null) return px;
      }
      continue;
    }
    const px = lengthToPx(part, viewport);
    if (px != null) return px;
  }
  return viewport;
}

function pathOf(src: string) {
  try { return new URL(src, "https://www.zaylist.com").pathname; } catch { return src.split("?")[0]; }
}

/**
 * The srcset candidate a card actually paints for this slot and DPR.
 * Returns null when the winner would be the full original, so a preload cannot fetch it first.
 */
export function deliveredImageUrl(candidates: ImageCandidate[], slotPx: number, dpr: number, original?: string | null): string | null {
  const usable = candidates.filter((item) => item.src && item.width > 0);
  if (!usable.length || slotPx <= 0) return null;
  const target = slotPx * Math.max(dpr, 1);
  const sorted = [...usable].sort((a, b) => a.width - b.width);
  const chosen = sorted.find((item) => item.width >= target) ?? sorted[sorted.length - 1];
  if (original && pathOf(chosen.src) === pathOf(original)) return null;
  return chosen.src;
}
