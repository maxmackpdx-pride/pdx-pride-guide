/**
 * Smoke: Flyer Reader Phase 1 (offline unless SMOKE_OCR=1).
 * Run: npx tsx script/smoke-flyer-reader.ts
 *
 * Offline: path validation + sharp preprocessing on a generated flyer.
 * SMOKE_OCR=1 additionally runs real Tesseract (downloads eng traineddata).
 */
import sharp from "sharp";
import { safeFlyerRelPath } from "../server/flyerReader/github";
import { preprocessFlyer } from "../server/flyerReader/ocr";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

async function main() {
  /* ── path validation ── */
  assert(safeFlyerRelPath("alien-orgy.png") === "flyers/alien-orgy.png", "bare filename gets flyers/ prefix");
  assert(safeFlyerRelPath("flyers/sub/party.jpg") === "flyers/sub/party.jpg", "nested path under flyers/ allowed");
  for (const bad of ["../server/storage.ts", "flyers/../.env", "/etc/passwd", "flyers/notes.txt"]) {
    let threw = false;
    try {
      safeFlyerRelPath(bad);
    } catch {
      threw = true;
    }
    assert(threw, `rejected unsafe path: ${bad}`);
  }

  /* ── preprocessing on a generated flyer ── */
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
    <rect width="600" height="800" fill="#1a0533"/>
    <text x="50" y="200" font-family="sans-serif" font-size="64" fill="#ffffff">ALIEN ORGY</text>
    <text x="50" y="320" font-family="sans-serif" font-size="40" fill="#00ff88">SAT AUG 8 - 9PM</text>
    <text x="50" y="420" font-family="sans-serif" font-size="32" fill="#ffffff">SANCTUARY CLUB</text>
    <text x="50" y="500" font-family="sans-serif" font-size="28" fill="#ffffff">33 NW 9TH AVE PORTLAND</text>
  </svg>`;
  const flyerPng = await sharp(Buffer.from(svg)).png().toBuffer();
  const pre = await preprocessFlyer(flyerPng);
  assert(pre.width >= 1200, `preprocess upscales small flyers (got ${pre.width}px)`);
  assert(
    pre.buffer.length > 4 && pre.buffer[0] === 0x89 && pre.buffer[1] === 0x50,
    "preprocess outputs valid PNG",
  );

  /* ── real OCR (opt-in: needs network for traineddata) ── */
  if (process.env.SMOKE_OCR === "1") {
    const { ocrFlyer } = await import("../server/flyerReader/ocr");
    const result = await ocrFlyer(flyerPng);
    console.log("OCR text:", JSON.stringify(result.text.slice(0, 120)));
    console.log("OCR confidence:", result.confidence, `(pre ${result.preprocessMs}ms, ocr ${result.ocrMs}ms)`);
    assert(/ALIEN\s+ORGY/i.test(result.text), "OCR reads the headline");
    assert(/SANCTUARY/i.test(result.text), "OCR reads the venue");
  } else {
    console.log("(real OCR skipped — set SMOKE_OCR=1 to run Tesseract with network)");
  }

  console.log("\nAll flyer-reader smoke checks passed.");
}

main().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});
