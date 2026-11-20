import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";

/**
 * Social share cards, rendered at 2x and downscaled with lanczos3.
 * Supersampling keeps logo and poster edges crisp when a platform shows the
 * card large; the delivered file stays the standard 1200x630 PNG.
 * (Elevation pass, Nov 19 2026: upscale the quality of the places shares.)
 */
const SCALE = 2;
const width = 1200 * SCALE;
const height = 630 * SCALE;
const outWidth = 1200;
const outHeight = 630;
const artWidth = 620 * SCALE;
/** Contained art (place logos, event posters) sits inside this box, never clipped. */
const containBox = 580 * SCALE;
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="shade">
      <stop offset="34%" stop-color="#0c0c0f" stop-opacity="0"/>
      <stop offset="78%" stop-color="#0c0c0f" stop-opacity=".67"/>
      <stop offset="100%" stop-color="#0c0c0f" stop-opacity=".92"/>
    </linearGradient>
    <linearGradient id="rainbow">
      <stop stop-color="#00FFFF"/><stop offset="20%" stop-color="#2BFF00"/>
      <stop offset="40%" stop-color="#D4FF00"/><stop offset="60%" stop-color="#FF1FA0"/>
      <stop offset="80%" stop-color="#7B00FF"/><stop offset="100%" stop-color="#FF7B00"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#shade)"/>
  <rect width="100%" height="${8 * SCALE}" fill="url(#rainbow)"/>
</svg>`);

function fadeMask(w: number, h: number): Buffer {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="fade"><stop offset="76%" stop-color="white"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#fade)"/>
  </svg>`);
}

let logo: Promise<Buffer> | undefined;
async function readHeroLogo(): Promise<Buffer> {
  const relative = "home/zaylist-wordmark-filled.png";
  const render = (root: string) => sharp(path.resolve(root, relative))
    .trim().resize(480 * SCALE, 350 * SCALE, { fit: "contain", background: transparent }).png().toBuffer();
  try {
    return await render("dist/public");
  } catch {
    return render("client/public");
  }
}

/** Keep the subject readable at left and carry its colors into the logo area. */
export async function renderSocialCardArtwork(art: Buffer | null, fit: "cover" | "contain" = "contain", fallback?: () => Buffer): Promise<Buffer> {
  const layers: OverlayOptions[] = [];
  if (art) {
    try {
      const [backdrop, foreground] = await Promise.all([
        // Blurred echo of the art, darkened so pale artwork (most place logos
        // are white marks) cannot wash the card out to murky gray.
        sharp(art).rotate().resize(120, 63, { fit: "cover" }).flatten({ background: "#0c0c0f" })
          .blur(9).png().toBuffer()
          .then(input => sharp(input).resize(width, height, { fit: "fill" }).modulate({ brightness: 0.55 }).png().toBuffer()),
        fit === "contain"
          ? sharp(art).rotate().resize(containBox, containBox, { fit: "inside" })
            .ensureAlpha().png().toBuffer({ resolveWithObject: true })
          : sharp(art).rotate().resize(artWidth, height, { fit: "cover" })
            .ensureAlpha().png().toBuffer({ resolveWithObject: true }),
      ]);
      const { data, info } = foreground;
      if (fit === "contain") {
        // A contained mark is the whole subject: no fade, no crop, centered in
        // the art zone with air around it.
        layers.push({ input: backdrop }, {
          input: data,
          left: Math.round((artWidth - info.width) / 2),
          top: Math.round((height - info.height) / 2),
        });
      } else {
        const subject = await sharp(data)
          .composite([{ input: fadeMask(info.width, info.height), blend: "dest-in" }]).png().toBuffer();
        layers.push({ input: backdrop }, {
          input: subject,
          left: 0,
          top: Math.round((height - info.height) / 2),
        });
      }
    } catch {
      art = null;
    }
  }
  if (!art && fallback) {
    // Fallback art is authored at 1x (620x630 SVG); scale it into the 2x art zone.
    const scaled = await sharp(fallback()).resize(artWidth, height, { fit: "inside" }).png().toBuffer();
    layers.push({ input: scaled, left: 0, top: 0 });
  }
  logo ??= readHeroLogo().catch(error => {
    logo = undefined;
    throw error;
  });
  layers.push({ input: frame }, { input: await logo, left: 654 * SCALE, top: 140 * SCALE });
  // Composite at 2x first, then downscale in a second pass: a resize in the
  // same pipeline would shrink the canvas before the layers are applied.
  const composed = await sharp({ create: { width, height, channels: 4, background: "#0c0c0f" } })
    .composite(layers)
    .png().toBuffer();
  return sharp(composed)
    .resize(outWidth, outHeight, { kernel: sharp.kernel.lanczos3 })
    .png().toBuffer();
}
