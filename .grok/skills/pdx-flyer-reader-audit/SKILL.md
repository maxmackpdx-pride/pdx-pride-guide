---
name: pdx-flyer-reader-audit
description: >
  Audit and bug-test the Zaylist Flyer Reader AI: OCR, vision (Gemini/Groq),
  structureFlyer prompts, ground-truth validation harness, live flyer image
  reads, and QSearch flyer-reader API wiring. Triggers: "flyer reader audit",
  "validate flyers", "flyer AI broken", "OCR accuracy", "ground truth flyers",
  "/pdx-flyer-reader-audit". Use when confirming the flyer reader works as
  designed by reading real poster images and scoring against labels.
---

# PDX Flyer Reader Audit Agent

You verify the **Flyer Reader AI** end-to-end: image → OCR/vision → structured fields → draft, against ground truth and human-visible flyers.

## Repo + docs (read first)

| Path | Why |
|------|-----|
| `docs/FLYER_READER.md` | API, env, validation |
| `server/flyerReader/parse.ts` | LLM structure + heuristics |
| `server/flyerReader/ocr.ts` | Preprocess + Tesseract |
| `server/flyerReader/github.ts` | Load from disk / GitHub |
| `flyers/ground-truth.json` | Labeled answers |
| `flyers/*` | Actual poster images |
| `script/validate-flyers.ts` | Graded harness |
| `reports/flyer-validation-latest.json` | Last scored run (if present) |
| `server/qsearch/vision.ts` | Related QSearch vision path (Gemini) |

Repo root: `/Users/tuckercasey/pdx-pride-guide`

## Standing rules

1. **Look at the flyer.** Use `read_file` on image paths under `flyers/` so you actually see the poster before judging parse output.
2. **null in ground-truth means not printed** — do not score or invent those fields.
3. **Never auto-LIVE.** `queue: true` only hits Review.
4. **Keys:** needs `GEMINI_API_KEY` and/or `GROQ_API_KEY` for full vision; without keys, still run offline smoke + visual/manual checks.
5. **Confirm before push.** Do not commit secrets. Validation reports may go under `reports/` when intentional.
6. Year bias: flyers often omit year — expected Pride window is **2026** unless printed otherwise.

## Audit checklist

### A. Offline smoke (always)

```bash
cd /Users/tuckercasey/pdx-pride-guide
npx tsx script/smoke-flyer-reader.ts
# optional real Tesseract:
# SMOKE_OCR=1 npx tsx script/smoke-flyer-reader.ts
```

### B. Visual ground-truth pass (always)

For **every** key in `flyers/ground-truth.json`:

1. `read_file` the image (`flyers/….jpg|webp`).
2. Human-read: title, date, time, venue, address, URL if printed.
3. Compare to ground-truth labels — flag **label errors** separately from model errors.
4. Note hard cases (Sports Bra banner mostly-null; Sasha crop mostly-null) — intentional.

### C. Automated validation (when keys + network available)

```bash
npx tsx script/validate-flyers.ts --json reports/flyer-validation-audit.json
# or cap spend:
# FLYER_VALIDATE_MAX=8 npx tsx script/validate-flyers.ts --limit 8 --json reports/flyer-validation-audit.json
```

Score fields: title, start_date, end_date, time, venue, address, url (null expected = skip).

**Pass bar (from project history):** overall ≥ ~70% on scored cells is “working”; aim for prior best (~97% when tuned). Fail = large regression or blank parses with keys present.

If `FLYER_LLM_DISABLED=1`, report blocked for live LLM and still complete visual + smoke.

### D. Live webpage cross-check (sample 3+ flyers)

Pick flyers that name a real venue/event:

1. Find the event on the venue or ticket page (curl/browse).
2. Confirm date/venue/title on the **web** matches what the flyer shows (and what parse should output).
3. If QSearch/Trusted already has a listing, compare poster URL vs this flyer.

Examples tied to repo set: Sanctuary (Stank/Yes Coach), Bearracuda, Sports Bra block party, Get Down Spellman, etc.

### E. API wiring (if admin server reachable)

- `POST /api/admin/qsearch/flyer-reader/ocr` — text + confidence, no LLM required if Tesseract path works.
- `POST /api/admin/qsearch/flyer-reader/parse` — structured parse; optional `queue: true`.
- Confirm response shape matches `docs/FLYER_READER.md`.
- Confirm vision provider chain prefers Gemini free tier when `GEMINI_API_KEY` set (`parse.ts` / discovery).

### F. Bug classes to re-test

| Bug | Symptom |
|-----|---------|
| Year bias | Model returns 2027 / wrong year when flyer has month/day only |
| Wrong title line | DJ/opener instead of event name |
| URL without scheme | `WWW.BEARRACUDA.COM` fails hostname compare |
| Logo / crop | Mostly-null hard cases should not hallucinate full events |
| Kill switch | `FLYER_LLM_DISABLED=1` stops paid calls |
| Queue safety | queued draft is pending, not LIVE |

## Fix policy

- Prompt / heuristic / scoring bugs: implement + re-run `validate-flyers` (limit if cost).
- Ground-truth wrong: fix labels first, then re-score.
- Missing keys on Railway: report env checklist; do not invent fake high accuracy.

## Report format

```markdown
## Flyer Reader audit — YYYY-MM-DD

### Verdict
WORKING | REGRESSED | BLOCKED (no keys) | FAIL

### Smokes
- smoke-flyer-reader: …
- SMOKE_OCR: … / skipped

### Validation harness
- overall: X/Y (Z%)
- by field: title … start_date … time … venue …
- report file: reports/…

### Visual review (human vs labels vs model)
| Flyer | Visual OK? | Labels OK? | Model OK? | Notes |
|-------|------------|------------|-----------|-------|

### Live page cross-checks
| Event | Page URL | Matches flyer? |
|-------|----------|----------------|

### Env
- GEMINI_API_KEY: set/missing
- GROQ_API_KEY: set/missing
- FLYER_LLM_DISABLED: …

### Critical bugs / regressions
- …

### Recommended next steps
1. …
```
