/**
 * Flyer OCR - sharp preprocessing + Tesseract (Phase 1 of the Flyer Reader).
 *
 * Preprocess: auto-rotate, flatten to white, grayscale, normalize contrast,
 * upscale small images (stylized flyer type needs pixels), light sharpen.
 * OCR: tesseract.js (pure WASM - no system tesseract binary needed on
 * Railway). The worker is created lazily on first use and reused; language
 * data caches under /tmp between requests.
 */
import sharp from "sharp";

export type OcrResult = {
  text: string;
  /** Tesseract mean word confidence 0-100 */
  confidence: number;
  preprocessMs: number;
  ocrMs: number;
  width: number;
  height: number;
};

const MIN_WIDTH = 1200;
const MAX_WIDTH = 2400;

/** Flyer image → OCR-friendly PNG. Exported for tests. */
export async function preprocessFlyer(input: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
  const base = sharp(input, { failOn: "none" }).rotate().flatten({ background: "#ffffff" });
  const meta = await base.metadata();
  const w = meta.width || 0;

  let pipeline = base.grayscale().normalize().sharpen();
  if (w > 0 && w < MIN_WIDTH) {
    pipeline = pipeline.resize({ width: MIN_WIDTH });
  } else if (w > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH });
  }

  const buffer = await pipeline.png().toBuffer();
  const outMeta = await sharp(buffer).metadata();
  return { buffer, width: outMeta.width || 0, height: outMeta.height || 0 };
}

type TesseractWorker = {
  recognize: (image: Buffer) => Promise<{ data: { text: string; confidence: number } }>;
  terminate: () => Promise<unknown>;
};

let workerPromise: Promise<TesseractWorker> | null = null;

async function getWorker(): Promise<TesseractWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      // Lazy import - keeps server boot fast and makes the dependency optional
      // until the first OCR request.
      const mod: any = await import("tesseract.js");
      const createWorker = mod.createWorker || mod.default?.createWorker;
      const worker = await createWorker("eng", 1, {
        cachePath: process.env.TESSERACT_CACHE_DIR?.trim() || "/tmp/tesseract",
      });
      return worker as TesseractWorker;
    })();
    workerPromise.catch(() => {
      workerPromise = null; // allow retry after a failed init
    });
  }
  return workerPromise;
}

export async function ocrFlyer(input: Buffer): Promise<OcrResult> {
  const t0 = Date.now();
  const pre = await preprocessFlyer(input);
  const t1 = Date.now();

  const worker = await getWorker();
  const { data } = await worker.recognize(pre.buffer);
  const t2 = Date.now();

  return {
    text: String(data.text || "").trim(),
    confidence: Math.round(Number(data.confidence) || 0),
    preprocessMs: t1 - t0,
    ocrMs: t2 - t1,
    width: pre.width,
    height: pre.height,
  };
}
