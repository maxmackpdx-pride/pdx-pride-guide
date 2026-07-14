import type { CSSProperties } from "react";

export interface CoverCropData {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export const DEFAULT_COVER_CROP: CoverCropData = {
  offsetX: 0.5,
  offsetY: 0.5,
  scale: 1,
};

export const COVER_PREVIEW_WIDTH = 560;
export const COVER_PREVIEW_HEIGHT = 160;

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

export function parseCoverCrop(raw?: string | null): CoverCropData {
  if (!raw) return { ...DEFAULT_COVER_CROP };
  try {
    const parsed = JSON.parse(raw);
    return {
      offsetX: clamp01(Number(parsed.offsetX ?? 0.5)),
      offsetY: clamp01(Number(parsed.offsetY ?? 0.5)),
      scale: Math.max(1, Math.min(3, Number(parsed.scale ?? 1) || 1)),
    };
  } catch {
    return { ...DEFAULT_COVER_CROP };
  }
}

export function serializeCoverCrop(crop: CoverCropData): string {
  return JSON.stringify({
    offsetX: clamp01(crop.offsetX),
    offsetY: clamp01(crop.offsetY),
    scale: Math.max(1, Math.min(3, crop.scale)),
  });
}

export function coverCropToImgStyle(crop?: string | null): CSSProperties {
  const c = parseCoverCrop(crop);
  const x = `${c.offsetX * 100}%`;
  const y = `${c.offsetY * 100}%`;
  return {
    objectPosition: `${x} ${y}`,
    transform: c.scale !== 1 ? `scale(${c.scale})` : undefined,
    transformOrigin: `${x} ${y}`,
  };
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}

function drawCroppedCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  crop: CoverCropData,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);

  const baseScale = Math.max(width / image.width, height / image.height);
  const drawScale = baseScale * crop.scale;
  const drawW = image.width * drawScale;
  const drawH = image.height * drawScale;
  const centerX = crop.offsetX * image.width;
  const centerY = crop.offsetY * image.height;
  const drawX = width / 2 - centerX * drawScale;
  const drawY = height / 2 - centerY * drawScale;

  ctx.drawImage(image, drawX, drawY, drawW, drawH);
}

export function drawCoverPreviewCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  crop: CoverCropData,
) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, width, height);
  drawCroppedCover(ctx, image, crop, width, height);

  ctx.strokeStyle = "#00FFFF";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(0,255,255,0.35)";
  ctx.shadowBlur = 8;
  ctx.strokeRect(1, 1, width - 2, height - 2);
}