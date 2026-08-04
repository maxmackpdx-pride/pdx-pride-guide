import html2canvas from "html2canvas";
import { shareOrDownloadPng } from "@/lib/shareImage";

type ShareMissedConnection = {
  id: number;
  body: string;
  location?: string | null;
  accentColor: string;
};

/** Largest integer font-size (px) at which `text` fits within `maxW`×`maxH`
 *  when rendered as the impact headline. Measured with a hidden probe using
 *  the exact wrapping styles so html2canvas rasterizes the same layout. */
function fitHeadlineSize(text: string, maxW: number, maxH: number): number {
  const probe = document.createElement("div");
  probe.style.cssText = `
    position: absolute; left: -9999px; top: 0; visibility: hidden;
    width: ${maxW}px; white-space: normal; overflow-wrap: break-word; word-break: break-word;
    font-family: 'Barlow Condensed', sans-serif; font-weight: 800;
    text-transform: uppercase; line-height: 1.02; letter-spacing: 0.01em;
  `;
  probe.textContent = text;
  document.body.appendChild(probe);
  let lo = 36;
  let hi = 170;
  let best = lo;
  try {
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      probe.style.fontSize = `${mid}px`;
      if (probe.scrollHeight <= maxH && probe.scrollWidth <= maxW) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
  } finally {
    document.body.removeChild(probe);
  }
  return best;
}

/** Builds a 1080×1920 Instagram-Story card mirroring SpottedCard's quote look. */
async function buildMissedConnectionCanvas(post: ShareMissedConnection): Promise<HTMLCanvasElement> {
  const accent = post.accentColor;

  // Fonts must be ready before html2canvas rasterizes, or it falls back to a
  // system font with different metrics (clipping + wrong look). Time-bounded so
  // a stalled font fetch can never hang the share action.
  try {
    const fontsReady = Promise.all([
      document.fonts.load("800 100px 'Barlow Condensed'"),
      document.fonts.load("700 46px 'Inter'"),
    ]).then(() => document.fonts.ready);
    await Promise.race([fontsReady, new Promise(resolve => setTimeout(resolve, 2500))]);
  } catch {
    /* fonts API best-effort; continue */
  }

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
  quote.style.cssText = `font-family:'Barlow Condensed',sans-serif; font-weight: 700; font-size: 120px; color: ${accent}; line-height: 1;`;
  quote.textContent = "❝";
  card.appendChild(quote);

  // Card content width = 1080 − 2×88 (node pad) − 2×56 (card pad) = 792px.
  const BOX_W = 792;
  const BOX_H = 560;
  const headlineText = post.body.trim().toUpperCase();
  const fontSize = fitHeadlineSize(headlineText, BOX_W, BOX_H);

  const bodyWrap = document.createElement("div");
  bodyWrap.style.cssText = `
    display: flex; align-items: center; justify-content: center;
    width: 100%; height: ${BOX_H}px; overflow: hidden;
  `;
  const body = document.createElement("div");
  body.style.cssText = `
    font-family:'Barlow Condensed',sans-serif; font-weight: 800; text-transform: uppercase;
    font-size: ${fontSize}px; line-height: 1.02; letter-spacing: 0.01em; color: #fff;
    text-align: center; width: 100%; white-space: normal; overflow-wrap: break-word; word-break: break-word;
  `;
  body.textContent = headlineText;
  bodyWrap.appendChild(body);
  card.appendChild(bodyWrap);

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
    <div style="font-family:'Inter',sans-serif;font-size:26px;color:#666;">zaylist.com · Portland, OR</div>
  `;
  node.appendChild(footer);

  document.body.appendChild(node);
  try {
    return await html2canvas(node, {
      width: 1080,
      height: 1920,
      backgroundColor: "#050505",
      scale: 2,
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
  return shareOrDownloadPng(canvas, filename, "Mizzed Connection | Zaylist");
}
