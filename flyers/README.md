# Flyers — Flyer Reader ground truth + sources

Drop event flyer images here (`.png` `.jpg` `.webp` `.avif` `.gif` `.pdf`).
The Flyer Reader service loads them by repo path — disk-first on Railway
(this folder ships with the deploy), GitHub API fallback for freshness.

## OCR a flyer (Phase 1)

```bash
curl -X POST https://<your-app>/api/admin/qsearch/flyer-reader/ocr \
  -H "Content-Type: application/json" -b "<admin session cookie>" \
  -d '{"githubPath": "flyers/alien-orgy-aug.png"}'
# → { ok, source: "disk"|"github", text, confidence, preprocessMs, ocrMs }
```

Small uploads also work via `{"imageBase64": "..."}` (JSON body limit ~100kb;
larger uploads arrive with the Phase 3 multipart integration).

## Ground truth (Phase 4 validation)

For each flyer, add a sibling entry to `ground-truth.json` (see the example
file). The validation harness OCRs + parses every flyer listed and scores
field accuracy against these values. Event exports in `exports/` are a good
source for correct values.

## Env

- `FLYERS_DIR` (default `flyers`)
- `GITHUB_FLYERS_REPO` (default `maxmackpdx-pride/pdx-pride-guide`)
- `GITHUB_FLYERS_BRANCH` (default `master`)
- `GITHUB_TOKEN` — only needed for private-repo GitHub fallback
- `TESSERACT_CACHE_DIR` (default `/tmp/tesseract`)

---
CI armed 2026-07-23: GROQ_API_KEY secret set — every change to the parser, flyers, or harness now grades itself into reports/.

CI trigger: GEMINI_API_KEY armed — first true vision run.
