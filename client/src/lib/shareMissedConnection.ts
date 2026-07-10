import html2canvas from "html2canvas";
import { shareOrDownloadPng } from "@/lib/shareImage";

type ShareMissedConnection = {
  id: number;
  body: string;
  location?: string | null;
  accentColor: string;
};

/** Builds a 1080×1920 Instagram-Story card mirroring SpottedCard's quote look. */
async function buildMissedConnectionCanvas(post: ShareMissedConnection): Promise<HTMLCanvasElement> {
  const accent = post.accentColor;

  const node = document.createElement("div");
  node.style.cssText = `
    position: absolute; left: -9999px; top: 0;
    width: 1080px; height: 1920px; overflow: hidden; box-sizing: border-box;
    background: #050505; color: #fff; font-family: 'Inter', system-ui, sans-serif;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    padding: 96px 88px;
  `;

  const glow = document.createElement("div");
  glow.style.cssText = `
    position: absolute; inset: 0;
    background: radial-gradient(60% 40% at 50% 30%, ${accent}22, transparent 70%);
    pointer-events: none;
  `;
  node.appendChild(glow);

  const card = document.createElement("div");
  card.style.cssText = `
    position: relative; width: 100%; border-radius: 22px; padding: 72px 56px;
    background: #0b0b0e; border: 3px solid ${accent}; box-shadow: 0 0 60px -10px ${accent}66;
    display: flex; flex-direction: column; gap: 40px;
  `;

  const quote = document.createElement("div");
  quote.style.cssText = `font-family:'Barlow Condensed',sans-serif; font-size: 120px; color: ${accent}; line-height: 1;`;
  quote.textContent = "❝";
  card.appendChild(quote);

  const body = document.createElement("div");
  body.style.cssText = `
    font-family:'Inter',sans-serif; font-weight: 600; font-size: 46px; line-height: 1.4; color: #fff;
    overflow: hidden; display: -webkit-box; -webkit-line-clamp: 8; -webkit-box-orient: vertical;
  `;
  body.textContent = post.body;
  card.appendChild(body);

  if (post.location) {
    const location = document.createElement("div");
    location.style.cssText = `font-family:'Inter',sans-serif; font-size: 32px; color: ${accent}; font-weight: 700;`;
    location.textContent = `📍 ${post.location}`;
    card.appendChild(location);
  }

  node.appendChild(card);

  const footer = document.createElement("div");
  footer.style.cssText = `
    position: relative; margin-top: 56px; display: flex; flex-direction: column; align-items: center; gap: 8px;
  `;
  footer.innerHTML = `
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:38px;color:#C8FA3C;letter-spacing:0.04em;">MISSED CONNECTIONS</div>
    <div style="font-family:'Inter',sans-serif;font-size:26px;color:#666;">prideguidepdx.com · Portland, OR</div>
  `;
  node.appendChild(footer);

  document.body.appendChild(node);
  try {
    return await html2canvas(node, {
      width: 1080,
      height: 1920,
      backgroundColor: "#050505",
      scale: 1,
      useCORS: true,
      allowTaint: false,
      windowWidth: 1080,
      windowHeight: 1920,
    });
  } finally {
    document.body.removeChild(node);
  }
}

export async function shareMissedConnectionStory(post: ShareMissedConnection) {
  const canvas = await buildMissedConnectionCanvas(post);
  const filename = `missed-connection-${post.id}.png`;
  return shareOrDownloadPng(canvas, filename, "Missed Connections — PDX Pride Guide");
}
