# Flyer Reader - API & integration guide

Reads event poster flyers (image → structured event data) server-side.
Vision: Gemini free tier via self-discovering provider chain (Groq text,
Gemini vision; xAI/OpenAI slots supported). Validated at 97% on the
ground-truth set (reports/flyer-validation-latest.json).

## Endpoints (admin session required)

### POST /api/admin/qsearch/flyer-reader/ocr
Raw OCR only (no LLM spend).
Body: `{ "githubPath": "flyers/name.jpg" }` or small `{ "imageBase64": "..." }`
→ `{ ok, source, text, confidence, preprocessMs, ocrMs }`

### POST /api/admin/qsearch/flyer-reader/parse
Full pipeline: OCR → vision/LLM → structured event.
Body options:
- `githubPath` - flyer in the repo flyers/ folder (disk-first, GitHub fallback)
- `imageBase64` - small upload (JSON body limit ~100kb)
- `rawText` - skip OCR/vision, structure existing text
- `queue: true` - ALSO land the draft in the QSearch Review queue
  (human approve → LIVE/HIDDEN; never auto-LIVE)

→ `{ ok, parse: {title, start_date, end_date, time, venue, address,
     description, url, qr_info, confidence, raw_text, model, warnings},
     draft, queuedJobId }`

## Frontend sample (QSearch admin)

```tsx
// Scan a repo flyer into the Review queue
async function scanFlyer(githubPath: string) {
  const res = await fetch("/api/admin/qsearch/flyer-reader/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ githubPath, queue: true }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  // data.parse.confidence 0-100; data.queuedJobId → open Review tab
  return data;
}
```

## Env (Railway / GitHub secrets)

| Var | Purpose |
|---|---|
| GROQ_API_KEY | text structuring (cheap) |
| GEMINI_API_KEY | vision (free tier) - REQUIRED for image reading |
| FLYER_VISION_MODEL / _FALLBACK | model overrides (self-discovery handles stale ids) |
| FLYER_LLM_DISABLED=1 | kill switch - stops all paid calls instantly |
| FLYER_VALIDATE_MAX | vision-call cap per validation run (default 25) |
| FLYERS_DIR / GITHUB_FLYERS_REPO / GITHUB_FLYERS_BRANCH | flyer sourcing |
| TESSERACT_CACHE_DIR | OCR language data cache (default /tmp/tesseract) |

## Validation (the ongoing test suite)

CI runs `script/validate-flyers.ts` on any change to flyers/, the parser, or
the harness; the graded report commits to reports/. Manual: Actions →
"Flyer Reader validation" → Run workflow. Add new flyers + answers to
flyers/ground-truth.json to grow the test set (see flyers/README.md).
