import html2canvas from "html2canvas";
import type { EventListing } from "@shared/multiDayEvents";
import { parsePacificDateTime } from "@shared/missedConnections";
import { resolveEventPosterUrl } from "@shared/eventPoster";

function loadLogoImage(): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "/favicon.png";
  });
}

const DAY_LABELS: Record<string, string> = {
  THU: "THURSDAY · JULY 16",
  FRI: "FRIDAY · JULY 17",
  SAT: "SATURDAY · JULY 18",
  SUN: "SUNDAY · JULY 19",
};
const DAY_ORDER = ["THU", "FRI", "SAT", "SUN"];
const ACCENT_CYCLE = ["#19E3FF", "#FF6600", "#39FF14", "#A855F7", "#FF00CC"];

function formatTime(value: string): string {
  const ms = parsePacificDateTime(value);
  if (ms == null) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms)).replace(" ", "").toLowerCase();
}

function makeCard(event: EventListing, accent: string, cardW: number, cardH: number): HTMLElement {
  const posterUrl = resolveEventPosterUrl(event.id, event.posterImageUrl);
  const card = document.createElement("div");
  card.style.cssText = `
    position: relative; width: ${cardW}px; height: ${cardH}px; border-radius: 10px;
    overflow: hidden; background: #111; flex-shrink: 0;
    background-image: url(${posterUrl});
    background-size: cover; background-position: center;
  `;
  // dark gradient overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.82) 100%);
  `;
  card.appendChild(overlay);
  // neon accent tint
  const tint = document.createElement("div");
  tint.style.cssText = `position: absolute; inset: 0; background: ${accent}; opacity: 0.1;`;
  card.appendChild(tint);
  // content
  const content = document.createElement("div");
  content.style.cssText = `
    position: absolute; inset: 0; padding: 18px 20px;
    display: flex; flex-direction: column; justify-content: flex-end;
  `;
  content.innerHTML = `
    <div style="font-family:'Inter',sans-serif;font-size:18px;color:rgba(255,255,255,0.7);margin-bottom:6px;">
      ${formatTime(event.dateStart)}${event.dateEnd ? ` – ${formatTime(event.dateEnd)}` : ""}
    </div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:${cardH < 180 ? 26 : 32}px;color:#fff;line-height:1.08;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
      ${event.title}
    </div>
    <div style="font-family:'Inter',sans-serif;font-size:16px;color:rgba(255,255,255,0.6);margin-top:5px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
      ${event.venueName || ""}
    </div>
  `;
  card.appendChild(content);
  // left accent bar
  const bar = document.createElement("div");
  bar.style.cssText = `position:absolute;left:0;top:0;bottom:0;width:4px;background:${accent};`;
  card.appendChild(bar);
  return card;
}

/**
 * Builds a 1080×1920 Stories-ready image that mirrors the live schedule view:
 * poster cards with background images, dark gradient overlay, and neon accents.
 */
export async function exportScheduleToStories(events: EventListing[]): Promise<void> {
  const byDay: Record<string, EventListing[]> = { THU: [], FRI: [], SAT: [], SUN: [] };
  for (const e of events) {
    const bucket = e.dayOfWeek ? byDay[e.dayOfWeek] : undefined;
    if (bucket) bucket.push(e);
  }
  for (const day of DAY_ORDER) {
    byDay[day].sort((a, b) => (parsePacificDateTime(a.dateStart) || 0) - (parsePacificDateTime(b.dateStart) || 0));
  }

  const PAD = 48;
  const INNER_W = 1080 - PAD * 2;
  const GAP = 12;

  const node = document.createElement("div");
  node.style.cssText = `
    position: absolute; left: -9999px; top: 0;
    width: 1080px; height: 1920px; overflow: hidden;
    background: #050505; color: #f0ede4;
    font-family: 'Inter', system-ui, sans-serif;
    display: flex; flex-direction: column; padding: ${PAD}px;
    box-sizing: border-box; gap: 28px;
  `;

  // Load logo
  const logoImg = await loadLogoImage();

  // Header
  const header = document.createElement("div");
  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;">
      ${logoImg ? `<img src="/favicon.png" width="52" height="52" style="border-radius:8px;flex-shrink:0;" />` : ""}
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:52px;letter-spacing:0.03em;color:#C8FA3C;line-height:1;">PDX PRIDE GUIDE</div>
    </div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:30px;letter-spacing:0.05em;color:#fff;margin-top:6px;">MY SCHEDULE</div>
    <div style="height:4px;background:linear-gradient(90deg,#00FFFF,#FF00CC,#39FF14,#FF6600);margin-top:16px;border-radius:2px;"></div>
  `;
  node.appendChild(header);

  // Event sections per day
  let accentIdx = 0;
  let totalEvents = 0;
  for (const day of DAY_ORDER) {
    const dayEvents = byDay[day];
    if (dayEvents.length === 0) continue;
    totalEvents += dayEvents.length;

    const section = document.createElement("div");

    const dayLabel = document.createElement("div");
    dayLabel.style.cssText = `font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:22px;letter-spacing:0.08em;color:#666;margin-bottom:12px;`;
    dayLabel.textContent = DAY_LABELS[day];
    section.appendChild(dayLabel);

    // Two-column grid of poster cards
    const cols = dayEvents.length === 1 ? 1 : 2;
    const cardW = cols === 1 ? INNER_W : Math.floor((INNER_W - GAP) / 2);
    const cardH = dayEvents.length <= 2 ? 280 : 200;

    const grid = document.createElement("div");
    grid.style.cssText = `display:flex;flex-wrap:wrap;gap:${GAP}px;`;

    for (const event of dayEvents) {
      const accent = ACCENT_CYCLE[accentIdx % ACCENT_CYCLE.length];
      accentIdx++;
      grid.appendChild(makeCard(event, accent, cardW, cardH));
    }

    section.appendChild(grid);
    node.appendChild(section);
  }

  // Footer
  const footer = document.createElement("div");
  footer.style.cssText = `padding-top:20px;border-top:1px solid #222;display:flex;justify-content:space-between;align-items:center;`;
  footer.innerHTML = `
    <div style="font-family:'Inter',sans-serif;font-size:18px;color:#555;">${totalEvents} event${totalEvents === 1 ? "" : "s"} · Portland, OR</div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:22px;color:#C8FA3C;letter-spacing:0.04em;">prideguidepdx.com</div>
  `;
  node.appendChild(footer);

  document.body.appendChild(node);
  try {
    const canvas = await html2canvas(node, {
      width: 1080,
      height: 1920,
      backgroundColor: "#050505",
      scale: 1,
      useCORS: true,
      allowTaint: false,
      windowWidth: 1080,
      windowHeight: 1920,
    });
    const link = document.createElement("a");
    link.download = "my-pdx-pride-schedule.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    document.body.removeChild(node);
  }
}
