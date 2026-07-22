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
import {
  coerceFlyerJson,
  heuristicDate,
  heuristicTime,
  heuristicFlyerParse,
  flyerParseToDraft,
  structureFlyerText,
  structureFlyer,
} from "../server/flyerReader/parse";

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

  /* ── Phase 2: structured parsing (offline paths) ── */
  const NOW = new Date("2026-07-21T12:00:00");
  assert(
    coerceFlyerJson('Sure! ```json\n{"title":"Alien Orgy","confidence":88}\n``` hope that helps')?.title === "Alien Orgy",
    "coerceFlyerJson unwraps fenced LLM output",
  );
  assert(coerceFlyerJson("no json here") === null, "coerceFlyerJson null on garbage");
  assert(heuristicDate("SAT AUG 8 - 9PM", NOW) === "2026-08-08", "heuristic date parses 'AUG 8' → next occurrence");
  assert(heuristicDate("MAR 3 DOORS 8PM", NOW) === "2027-03-03", "months-old date rolls to next year");
  assert(heuristicDate("SAT JUL 18 9PM", new Date("2026-07-22T12:00:00")) === "2026-07-18", "recent-past date stays this year (no year bias)");
  assert(heuristicTime("DOORS 8PM SHOW 9:30PM") === "20:00", "heuristic time parses first time");
  const OCR_TEXT = "ALIEN ORGY\nSAT AUG 8 - 9PM\nSANCTUARY CLUB\n33 NW 9TH AVE PORTLAND\npdxsanctuary.com/events/alien-orgy";
  const hp = heuristicFlyerParse(OCR_TEXT, NOW);
  assert(hp.title === "ALIEN ORGY", "heuristic title = prominent top line");
  assert(hp.start_date === "2026-08-08" && hp.time === "21:00", "heuristic date+time extracted");
  assert(hp.address != null && /33 NW 9TH/i.test(hp.address), "heuristic address extracted");
  assert(hp.warnings.some(w => /LLM not configured/.test(w)), "no-LLM warning present");

  // structureFlyerText with mocked LLM fetch (no network)
  const mockFetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content:
                '{"title":"Alien Orgy","start_date":"2026-08-08","end_date":null,"time":"21:00","venue":"Sanctuary Club","address":"33 NW 9th Ave, Portland, OR","description":"Sci-fi themed play party at Sanctuary Club.","url":"https://pdxsanctuary.com/events/alien-orgy","qr_info":null,"confidence":90}',
            },
          },
        ],
      }),
      { status: 200 },
    )) as unknown as typeof fetch;
  process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "smoke-test-key";
  const structured = await structureFlyerText(OCR_TEXT, {
    ocrConfidence: 80,
    now: NOW,
    fetchImpl: mockFetch,
  });
  assert(structured.title === "Alien Orgy" && structured.venue === "Sanctuary Club", "LLM JSON mapped to schema");
  assert(structured.confidence === 81, `confidence blends LLM(90) with OCR(80) (got ${structured.confidence})`);
  assert(structured.model != null, "model recorded");

  // Scheme-less URL normalization (validator failure pattern from live run)
  const mockFetchUrl = (async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: '{"title":"Treasure Trail","start_date":"2026-07-17","end_date":null,"time":"20:00","venue":null,"address":null,"description":null,"url":"WWW.BEARRACUDA.COM","qr_info":null,"confidence":80}' } }],
      }),
      { status: 200 },
    )) as unknown as typeof fetch;
  const urlNorm = await structureFlyerText("TREASURE TRAIL", { now: NOW, fetchImpl: mockFetchUrl });
  assert(urlNorm.url === "https://www.bearracuda.com", `scheme-less URL normalized (got ${urlNorm.url})`);

  const draftOut = flyerParseToDraft(structured, { sourcePath: "flyers/alien-orgy.png" });
  assert(draftOut != null && draftOut.dateStart === "2026-08-08T21:00:00", "draft dateStart from date+time");
  assert(draftOut!.parseSource === "flyer-reader", "draft parseSource = flyer-reader");
  assert(draftOut!.sourceUrl === "github:flyers/alien-orgy.png", "draft carries GitHub source path");
  assert(draftOut!.admission !== "FREE", "draft never invents FREE");

  /* ── vision hybrid (mocked) ── */
  let visionSawImage = false;
  const mockVisionFetch = (async (_url: any, init: any) => {
    const body = JSON.parse(String(init?.body || "{}"));
    const userContent = body?.messages?.[1]?.content;
    visionSawImage =
      Array.isArray(userContent) &&
      userContent.some((c: any) => c?.type === "image_url" && String(c?.image_url?.url || "").startsWith("data:image/jpeg;base64,"));
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '{"title":"Gaylabration: Radiance","start_date":"2026-07-18","end_date":"2026-07-19","time":"21:00","venue":"Crystal Ballroom","address":null,"description":"Pride dance party at the Crystal Ballroom.","url":null,"qr_info":null,"confidence":92}' } }],
      }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  const tinyFlyer = await sharp(Buffer.from(svg)).png().toBuffer();
  const visionResult = await structureFlyer({
    imageBuffer: tinyFlyer,
    rawText: "REORDER GAYLABRATON SOUP", // deliberately bad OCR
    ocrConfidence: 30,
    now: NOW,
    fetchImpl: mockVisionFetch,
  });
  assert(visionSawImage, "vision request carries downscaled JPEG data URL");
  assert(visionResult.title === "Gaylabration: Radiance", "vision reads the stylized title OCR could not");
  assert(visionResult.model?.startsWith("groq-vision:") || visionResult.model?.includes("vision"), `vision model recorded (${visionResult.model})`);

  // Vision failure → text fallback with breadcrumb
  const failFetch = (async () => new Response("upstream error", { status: 500 })) as unknown as typeof fetch;
  const fellBack = await structureFlyer({
    imageBuffer: tinyFlyer,
    rawText: OCR_TEXT,
    now: NOW,
    fetchImpl: failFetch,
  });
  assert(fellBack.warnings.some(w => /Vision parse failed/.test(w)), "vision failure leaves breadcrumb and falls back");
  assert(fellBack.start_date === "2026-08-08", "text/heuristic fallback still extracts date");

  // No image → straight to text path (no vision attempt)
  const textOnly = await structureFlyer({ rawText: OCR_TEXT, now: NOW, fetchImpl: mockFetch });
  assert(textOnly.title === "Alien Orgy", "no image → text path unchanged");

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
