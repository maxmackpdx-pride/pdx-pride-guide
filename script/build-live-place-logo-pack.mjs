import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "client/public/directory-logos");
const API = process.env.ZAYLIST_DIRECTORY_URL || "https://www.zaylist.com/api/directory";
const ADULT = new Set(["fantasyland", "taboovideo", "mrpeeps", "fantasy"]);
// The legacy file for this record contained unrelated “PrEP4All” artwork.
const FORCE_GENERATE = new Set(["cascadeaidsprojectcapandourhouse"]);
const COLORS = {
  bar: "#FF00CC", restaurant: "#FF6600", cafe: "#39FF14", venue: "#19E3FF",
  service: "#A855F7", shop: "#FFD700", nonprofit: "#FFFFFF", healthcare: "#FF00CC",
  realestate: "#1A4DFF", group: "#FFD700", campground: "#39FF14", hotel: "#FF1FA0",
};

const normalize = (name) => name.toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/['’`]/g, "").replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, "").trim();
const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const source = await fs.readFile(path.join(ROOT, "shared/directoryLogos.ts"), "utf8");
const stemByNorm = new Map([...source.split("const URL_BY_NORMALIZED")[0].matchAll(/^\s{2}([a-z0-9]+):\s*"([^"]+)",/gm)].map((m) => [m[1], m[2]]));
const response = await fetch(API);
if (!response.ok) throw new Error(`Directory request failed: ${response.status}`);
const places = (await response.json()).filter((place) => place.active !== false);

await fs.mkdir(OUT, { recursive: true });
const manifest = [];
for (const place of places) {
  const norm = normalize(place.name);
  const stem = stemByNorm.get(norm) || `place-${norm}`;
  const primary = path.join(OUT, `${stem}.png`);
  const white = path.join(OUT, `${stem}-white.png`);
  const adult = ADULT.has(norm);
  const color = adult ? "#FF2400" : (COLORS[place.type] || COLORS.venue);
  let generated = FORCE_GENERATE.has(norm);
  if (!generated) {
    try { await fs.access(primary); } catch { generated = true; }
  }
  if (generated) {
    const words = String(place.name).toUpperCase().split(/\s+/);
    const lines = words.length > 3 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [words.join(" ")];
    const longest = Math.max(...lines.map((line) => line.length));
    const size = Math.max(48, Math.min(112, Math.floor(930 / Math.max(8, longest) * 1.65)));
    const y = lines.length === 1 ? [285] : [235, 345];
    const labels = lines.map((line, i) => `<text x="512" y="${y[i]}" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="${size}" font-weight="900" letter-spacing="3" fill="#08080a" stroke="${color}" stroke-width="12" paint-order="stroke" filter="url(#glow)">${esc(line)}</text><text x="512" y="${y[i]}" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="${size}" font-weight="900" letter-spacing="3" fill="#08080a" stroke="#FFFFFF" stroke-width="3">${esc(line)}</text>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="560" viewBox="0 0 1024 560"><defs><filter id="glow" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="18" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${labels}</svg>`;
    await sharp(Buffer.from(svg)).png().toFile(primary);
  }
  if (adult) {
    const meta = await sharp(primary).metadata();
    const width = meta.width || 1024;
    const height = meta.height || 560;
    const x1 = Math.round(width * 0.27);
    const x2 = Math.round(width * 0.73);
    const y = Math.round(height * 0.91);
    const stroke = Math.max(4, Math.round(height * 0.012));
    const accent = { create: { width: x2 - x1, height: stroke, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } };
    await sharp(primary).composite([{ input: accent, left: x1, top: y }]).png().toFile(`${primary}.adult.tmp`);
    await fs.rename(`${primary}.adult.tmp`, primary);
  }
  const image = sharp(primary).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) data[i] = data[i + 1] = data[i + 2] = 255;
  await sharp(data, { raw: info }).png().toFile(white);
  manifest.push({ id: place.id, name: place.name, type: place.type, adult, treatment: adult ? "red-white" : `${color}-white`, primary: `/directory-logos/${stem}.png`, white: `/directory-logos/${stem}-white.png`, generated });
}
await fs.writeFile(path.join(OUT, "manifest.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), source: API, count: manifest.length, places: manifest }, null, 2)}\n`);
for (const variant of ["primary", "white"]) {
  const tileWidth = 220, tileHeight = 150, columns = 6;
  const composites = [];
  for (let i = 0; i < manifest.length; i++) {
    const p = manifest[i];
    const logo = await sharp(path.join(ROOT, "client/public", p[variant])).resize(190, 105, { fit: "contain" }).png().toBuffer();
    composites.push({ input: logo, left: (i % columns) * tileWidth + 15, top: Math.floor(i / columns) * tileHeight + 8 });
  }
  await sharp({ create: { width: columns * tileWidth, height: Math.ceil(manifest.length / columns) * tileHeight, channels: 4, background: variant === "white" ? "#19191d" : "#050506" } })
    .composite(composites).png().toFile(path.join(OUT, `qa-contact-sheet-${variant}.png`));
}
console.log(`Built ${manifest.length} live Place logos and white variants.`);
