import html2canvas from "html2canvas";
import type { EventListing } from "@shared/multiDayEvents";
import { parsePacificDateTime } from "@shared/missedConnections";

const DAY_LABELS: Record<string, string> = {
  THU: "THURSDAY, JULY 16",
  FRI: "FRIDAY, JULY 17",
  SAT: "SATURDAY, JULY 18",
  SUN: "SUNDAY, JULY 19",
};
const DAY_ORDER = ["THU", "FRI", "SAT", "SUN"];

function formatTime(value: string): string {
  const ms = parsePacificDateTime(value);
  if (ms == null) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms)).replace(" ", "").toLowerCase();
}

/**
 * Renders an off-screen 1080x1920 layout (rather than scaling the live
 * 4-column grid, which clips awkwardly in portrait) and captures it with
 * html2canvas for a clean Instagram Stories-ready download.
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

  const node = document.createElement("div");
  node.style.cssText = `
    position: fixed; left: -9999px; top: 0; width: 1080px; height: 1920px;
    background: #050505; color: #f0ede4; font-family: 'Inter', system-ui, sans-serif;
    display: flex; flex-direction: column; padding: 64px 56px; box-sizing: border-box;
  `;

  const header = document.createElement("div");
  header.style.cssText = "margin-bottom: 24px;";
  header.innerHTML = `
    <div style="font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 56px; letter-spacing: 0.03em; color: #C8FA3C; line-height: 1;">PDX PRIDE GUIDE</div>
    <div style="font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 34px; letter-spacing: 0.04em; color: #fff; margin-top: 6px;">MY SCHEDULE</div>
    <div style="height: 4px; background: linear-gradient(90deg, #00FFFF, #FF00CC, #39FF14, #FF6600); margin-top: 18px; border-radius: 2px;"></div>
  `;
  node.appendChild(header);

  const body = document.createElement("div");
  body.style.cssText = "flex: 1; overflow: hidden; display: flex; flex-direction: column; gap: 22px;";

  let totalEvents = 0;
  for (const day of DAY_ORDER) {
    const dayEvents = byDay[day];
    if (dayEvents.length === 0) continue;
    totalEvents += dayEvents.length;

    const section = document.createElement("div");
    const dayHeader = document.createElement("div");
    dayHeader.style.cssText = "font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 24px; letter-spacing: 0.06em; color: #888; margin-bottom: 10px;";
    dayHeader.textContent = DAY_LABELS[day];
    section.appendChild(dayHeader);

    for (const event of dayEvents) {
      const row = document.createElement("div");
      row.style.cssText = `
        display: flex; align-items: center; gap: 16px; padding: 14px 18px;
        background: #111; border-left: 4px solid #C8FA3C; border-radius: 6px; margin-bottom: 8px;
      `;
      row.innerHTML = `
        <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 22px; color: #C8FA3C; min-width: 110px;">${formatTime(event.dateStart)}</div>
        <div style="font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 28px; color: #fff; line-height: 1.1; flex: 1;">
          ${event.title}
          <div style="font-family: 'Inter', sans-serif; font-weight: 400; font-size: 18px; color: #999; margin-top: 2px;">${event.venueName}</div>
        </div>
      `;
      section.appendChild(row);
    }
    body.appendChild(section);
  }
  node.appendChild(body);

  const footer = document.createElement("div");
  footer.style.cssText = "margin-top: 24px; padding-top: 20px; border-top: 1px solid #222; display: flex; justify-content: space-between; align-items: center;";
  footer.innerHTML = `
    <div style="font-family: 'Inter', sans-serif; font-size: 20px; color: #666;">${totalEvents} event${totalEvents === 1 ? "" : "s"} · Portland, OR</div>
    <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 22px; color: #C8FA3C;">prideguidepdx.com</div>
  `;
  node.appendChild(footer);

  document.body.appendChild(node);
  try {
    const canvas = await html2canvas(node, { width: 1080, height: 1920, backgroundColor: "#050505", scale: 1 });
    const link = document.createElement("a");
    link.download = "my-pdx-pride-schedule.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    document.body.removeChild(node);
  }
}
