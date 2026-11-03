
export type PosterVariants = { width: number; height: number; variants: { src: string; width: number }[] };
/** Lazy images use rendered width; legacy browsers use the explicit fallback. */
export const POSTER_CARD_SIZES = 'auto, (max-width: 640px) calc(100vw - 32px), 360px';
export const POSTER_DETAIL_SIZES = 'auto, (max-width: 800px) calc(100vw - 32px), 760px';
/** Delivery-only lookup; original event records and URLs are never rewritten. */
export function responsivePoster(src: string, sizes = POSTER_CARD_SIZES, manifest: Record<string, PosterVariants> = {}) {
  const key = src.startsWith('https://www.zaylist.com/') ? src.slice('https://www.zaylist.com'.length) : src;
  const entry = Object.hasOwn(manifest, key) ? manifest[key] : Object.hasOwn(manifest, src) ? manifest[src] : undefined;
  if (!entry) return { src };
  const variants = [...entry.variants];
  if (!variants.some(v => v.width >= entry.width)) variants.push({ src, width: entry.width });
  return { src, srcSet: variants.map(v => `${v.src} ${v.width}w`).join(', '), sizes, width: entry.width, height: entry.height };
}
/** true means a retry was scheduled; only notify caller on a terminal original failure. */
export function restoreOriginalPoster(image: HTMLImageElement, original: string): boolean {
  if (!image.getAttribute('srcset')) return false;
  image.removeAttribute('srcset');
  image.removeAttribute('sizes');
  image.src = original;
  return true;
}
