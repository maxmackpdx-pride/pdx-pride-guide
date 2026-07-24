import html2canvas from "html2canvas";
import { directoryFallbackLogo } from "@/lib/directoryLogos";
import { shareOrDownloadPng } from "@/lib/shareImage";

type ShareBusiness = {
  name: string;
  categoryLabel: string;
  /** ds category key (bars/food/cafes/venues/services/shops/hotels) or a literal #hex. */
  accentColor: string;
  description?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  hours?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
};

/** html2canvas can't resolve CSS custom properties reliably on a detached node — always
 * render with literal hex. Callers pass either a ds category key or an explicit #hex. */
const CATEGORY_HEX: Record<string, string> = {
  bars: "#FF2AA8", food: "#FF6600", cafes: "#39FF14", venues: "#19E3FF",
  services: "#A855F7", shops: "#FFC400", hotels: "#3A6BFF",
};

function resolveAccentHex(accentColor: string): string {
  if (accentColor.startsWith("#")) return accentColor;
  return CATEGORY_HEX[accentColor] || "#FF2AA8";
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Builds a 1080×1350 share card mirroring PlaceCard's dark neon look. */
async function buildBusinessCardCanvas(business: ShareBusiness): Promise<HTMLCanvasElement> {
  const accent = resolveAccentHex(business.accentColor);
  const logoSrc = business.logoUrl || directoryFallbackLogo("venue");
  const logoImg = await loadImage(logoSrc);

  const node = document.createElement("div");
  node.style.cssText = `
    position: absolute; left: -9999px; top: 0;
    width: 1080px; height: 1350px; overflow: hidden; box-sizing: border-box;
    background: #0b0b0e; color: #fff; font-family: 'Inter', system-ui, sans-serif;
    display: flex; flex-direction: column; padding: 56px;
    border: 6px solid ${accent}; border-radius: 18px;
  `;

  const media = document.createElement("div");
  media.style.cssText = `
    position: relative; height: 480px; border-radius: 14px; overflow: hidden;
    background: radial-gradient(125% 120% at 50% 12%, ${accent}22, #050506 72%);
    border: 1px solid ${accent}55; display: flex; align-items: center; justify-content: center;
    margin-bottom: 40px;
  `;
  if (logoImg) {
    const img = document.createElement("img");
    img.src = logoImg.src;
    img.style.cssText = `max-width:70%; max-height:70%; object-fit:contain; filter: drop-shadow(0 0 24px ${accent}88);`;
    media.appendChild(img);
  }
  node.appendChild(media);

  const badge = document.createElement("div");
  badge.style.cssText = `
    align-self: flex-start; font-family:'Barlow Condensed',sans-serif; font-weight:900;
    font-size: 26px; letter-spacing: 0.06em; text-transform: uppercase; color: ${accent};
    border: 2px solid ${accent}; border-radius: 999px; padding: 6px 22px; margin-bottom: 20px;
  `;
  badge.textContent = business.categoryLabel;
  node.appendChild(badge);

  const name = document.createElement("div");
  name.style.cssText = `
    font-family:'Barlow Condensed',sans-serif; font-weight:900; text-transform:uppercase;
    font-size: 72px; line-height: 1.02; color: #fff; margin-bottom: 24px;
  `;
  name.textContent = business.name;
  node.appendChild(name);

  const lines: string[] = [];
  const addr = [business.address, business.neighborhood].filter(Boolean).join(" · ");
  if (addr) lines.push(addr);
  if (business.hours) lines.push(business.hours);
  if (business.phone) lines.push(business.phone);
  if (lines.length) {
    const meta = document.createElement("div");
    meta.style.cssText = `font-family:'Inter',sans-serif; font-size: 30px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 24px;`;
    meta.innerHTML = lines.join("<br/>");
    node.appendChild(meta);
  }

  if (business.description) {
    const desc = document.createElement("div");
    desc.style.cssText = `
      font-family:'Inter',sans-serif; font-size: 28px; color: rgba(255,255,255,0.85); line-height: 1.5;
      overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
      margin-bottom: 20px;
    `;
    desc.textContent = business.description;
    node.appendChild(desc);
  }

  const spacer = document.createElement("div");
  spacer.style.cssText = "flex: 1;";
  node.appendChild(spacer);

  const footer = document.createElement("div");
  footer.style.cssText = `
    padding-top: 24px; border-top: 1px solid #262626; display: flex;
    justify-content: space-between; align-items: center;
  `;
  footer.innerHTML = `
    <div style="font-family:'Inter',sans-serif;font-size:24px;color:#666;">Queer Directory · Portland, OR</div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:28px;color:${accent};letter-spacing:0.04em;">zaylist.com</div>
  `;
  node.appendChild(footer);

  document.body.appendChild(node);
  try {
    return await html2canvas(node, {
      width: 1080,
      height: 1350,
      backgroundColor: "#0b0b0e",
      scale: 1,
      useCORS: true,
      allowTaint: false,
      windowWidth: 1080,
      windowHeight: 1350,
    });
  } finally {
    document.body.removeChild(node);
  }
}

export async function shareBusinessCard(business: ShareBusiness) {
  const canvas = await buildBusinessCardCanvas(business);
  const filename = `${business.name.replace(/[^\w\s-]/g, "").trim().slice(0, 48) || "venue"}.png`;
  return shareOrDownloadPng(canvas, filename, business.name);
}
