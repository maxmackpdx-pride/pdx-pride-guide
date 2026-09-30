export type ShareImageResult = "shared" | "downloaded" | "copied";

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/** Share a rendered canvas as a PNG: native share sheet → clipboard copy → plain download. */
export async function shareOrDownloadPng(
  canvas: HTMLCanvasElement,
  filename: string,
  title: string,
): Promise<ShareImageResult> {
  const blob = await canvasToBlob(canvas);
  if (blob) {
    const file = new File([blob], filename, { type: "image/png" });
    if (
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] }) &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({ files: [file], title });
        return "shared";
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") throw err;
      }
    }
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard && "write" in navigator.clipboard) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        downloadCanvas(canvas, filename);
        return "copied";
      } catch {
        // fall through to plain download
      }
    }
  }
  downloadCanvas(canvas, filename);
  return "downloaded";
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

/** The accent laid over the #050506 plate at a given strength, as an opaque hex. */
function mixOverInk(hex: string, amount: number): string {
  const ink = [5, 5, 6], c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return "#" + c.map((v, i) => Math.round(ink[i] + (v - ink[i]) * amount).toString(16).padStart(2, "0")).join("");
}

export type RoomShareCard = {
  /** Room name as it reads everywhere, e.g. "GIGZ". */
  room: string;
  /** Resolved hex for the room rim (canvas can't read CSS variables). */
  accent: string;
  mark: string;
  line?: string;
  url: string;
};

/**
 * Board 14: one share frame for the rooms. Black plate, room rim, photo well with
 * the room's mark, one meta line, zaylist.com footer. 1080×1350, drawn directly.
 */
export async function renderRoomShareCard(card: RoomShareCard): Promise<HTMLCanvasElement> {
  const W = 1080, H = 1350, pad = 64;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await Promise.all([
    document.fonts?.load('900 64px "Barlow Condensed"'),
    document.fonts?.load('600 34px "Inter"'),
  ].filter(Boolean)).catch(() => undefined);
  const mark = await loadImage(card.mark);

  ctx.fillStyle = "#050506"; ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 6; ctx.strokeStyle = card.accent;
  ctx.beginPath(); ctx.roundRect(3, 3, W - 6, H - 6, 18); ctx.stroke();

  // Photo well: debossed, the room's own mark in the middle.
  const wellY = pad, wellH = 760;
  const glow = ctx.createRadialGradient(W / 2, wellY + wellH / 2, 0, W / 2, wellY + wellH / 2, wellH * .75);
  // Opaque stops: mixing a translucent stop into an opaque one draws a bright ring.
  glow.addColorStop(0, mixOverInk(card.accent, .24)); glow.addColorStop(.55, mixOverInk(card.accent, .08)); glow.addColorStop(1, "#050506");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.roundRect(pad, wellY, W - pad * 2, wellH, 14); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = `${card.accent}55`; ctx.stroke();
  if (mark) {
    const fit = Math.min((W - pad * 4) / mark.width, (wellH - 160) / mark.height);
    const mw = mark.width * fit, mh = mark.height * fit;
    ctx.drawImage(mark, (W - mw) / 2, wellY + (wellH - mh) / 2, mw, mh);
  }

  let y = wellY + wellH + 96;
  ctx.fillStyle = card.accent; ctx.font = '500 26px ui-monospace, SFMono-Regular, Menlo, monospace';
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "4px";
  ctx.fillText(`${card.room} · ROOM`, pad, y);
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  y += 90;
  ctx.fillStyle = "#ffffff"; ctx.font = '900 84px "Barlow Condensed", "Arial Narrow", sans-serif';
  ctx.fillText(card.room, pad, y);
  if (card.line) {
    y += 70;
    ctx.fillStyle = "#e6e3da"; ctx.font = '600 34px "Inter", system-ui, sans-serif';
    ctx.fillText(card.line, pad, y, W - pad * 2);
  }
  ctx.fillStyle = "#999999"; ctx.font = '500 26px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(new URL(card.url).host.replace(/^www\./, ""), pad, H - pad);
  return canvas;
}
