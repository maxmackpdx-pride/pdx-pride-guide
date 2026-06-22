export interface AvatarCropData {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export const DEFAULT_AVATAR_CROP: AvatarCropData = {
  offsetX: 0.5,
  offsetY: 0.5,
  scale: 1,
};

export function parseAvatarCrop(raw?: string | null): AvatarCropData {
  if (!raw) return { ...DEFAULT_AVATAR_CROP };
  try {
    const parsed = JSON.parse(raw);
    return {
      offsetX: clamp01(Number(parsed.offsetX ?? 0.5)),
      offsetY: clamp01(Number(parsed.offsetY ?? 0.5)),
      scale: Math.max(1, Math.min(4, Number(parsed.scale ?? 1) || 1)),
    };
  } catch {
    return { ...DEFAULT_AVATAR_CROP };
  }
}

export function serializeAvatarCrop(crop: AvatarCropData): string {
  return JSON.stringify({
    offsetX: clamp01(crop.offsetX),
    offsetY: clamp01(crop.offsetY),
    scale: Math.max(1, Math.min(4, crop.scale)),
  });
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
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

function drawCroppedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  crop: AvatarCropData,
  size: number,
  clipCircle = true,
) {
  ctx.clearRect(0, 0, size, size);
  if (clipCircle) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  const baseScale = Math.max(size / image.width, size / image.height);
  const drawScale = baseScale * crop.scale;
  const drawW = image.width * drawScale;
  const drawH = image.height * drawScale;
  const centerX = crop.offsetX * image.width;
  const centerY = crop.offsetY * image.height;
  const drawX = size / 2 - centerX * drawScale;
  const drawY = size / 2 - centerY * drawScale;

  ctx.drawImage(image, drawX, drawY, drawW, drawH);
  if (clipCircle) ctx.restore();
}

export function drawCropPreviewCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  crop: AvatarCropData,
) {
  const size = canvas.width;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, size, size);
  drawCroppedImage(ctx, image, crop, size, false);

  const ringR = size * 0.36;
  const cx = size / 2;
  const cy = size / 2;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.clip();
  drawCroppedImage(ctx, image, crop, size, false);
  ctx.restore();

  ctx.strokeStyle = "#00FFFF";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(0,255,255,0.45)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();
}

export async function renderCroppedAvatarBlob(
  image: HTMLImageElement,
  crop: AvatarCropData,
  size = 512,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  drawCroppedImage(ctx, image, crop, size, true);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error("Crop export failed"))),
      "image/jpeg",
      0.92,
    );
  });
}