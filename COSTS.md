# What this costs to run

Real numbers, updated 2026-07-22. The rule: **no AI on this project spends
without a ceiling.**

## Monthly

| Thing | Cost | Notes |
|---|---|---|
| Railway (app + SQLite) | ~$5-10 | One service. No managed Postgres — deliberate. |
| Trusted venue sync (10 venues) | $0 | Own server fetching public pages. No AI calls. |
| Flyer OCR (Tesseract) | $0 | Runs on our own CPU. |
| Flyer vision/LLM calls (Groq) | pennies-$5 | ~fraction of a cent per flyer (1024px image). 500 flyers/mo ≈ single-digit dollars. Free tier rate-limits prevent runaway bills. |
| GitHub Actions CI | $0 | ~4 min/run, path-filtered triggers, well inside the 2,000 free min/mo. |
| Domain | ~$1-2 amortized | |
| **Infra total** | **~$10-15/mo** | |
| AI assistant subscriptions (Claude/Grok/Codex/Perplexity) | **$60-100+** | The dominant cost of this project. Review quarterly: does each seat still earn it? |

## Spending ceilings (enforced in code)

- `FLYER_LLM_DISABLED=1` — kill switch: stops ALL paid LLM + vision calls
  instantly (Railway env var or GitHub secret). Pipeline degrades to
  heuristics, never breaks.
- `FLYER_VALIDATE_MAX` (default 25) — hard cap on vision calls per
  validation run, regardless of how many flyers are in ground-truth.
- Vision images downscaled to 1024px JPEG before sending (token cost).
- CI validation only triggers on changes to flyers/parser/harness — not on
  every push. Report commits cannot re-trigger CI or Railway deploys.
- Groq free tier has hard rate limits — worst-case runaway is throttled,
  not billed.

## Before adding anything that spends

1. What's the per-unit cost and the monthly worst case?
2. Where's the cap in code?
3. Where's the kill switch?
Write the answers into this file in the same PR.
