# What this costs to run

Real numbers, updated 2026-09-19. The rule: **no AI on this project spends
without a ceiling.**

## Current Railway billing cycle

- Hobby workspace compute already has a `$60` cap.
- Compute is `$45.12 / $60`; current total usage is about `$45.19` and the estimated
  bill is about `$48.70`. Almost all usage is `pdx-pride-guide`.
- Agent usage is about `$0.07 / $5`.
- Do **not** lower the hard cap to `$40` during this cycle. More than `$45` has already
  been spent, so doing that could stop the production site.
- This cycle includes leftover cost from the old 4 GB production footprint and the
  failed staging box. Staging is now empty and production idle RAM is about 0.71 GB.

## Next Railway billing cycle

- After the cycle resets, set the workspace compute hard cap to `$40`.
- Set a soft alert around `$25–$30`.
- Expect a lower cycle if staging stays dead and Mapz color/shader work does not ship on
  `master` all day. Measure the result rather than restoring the stale `$5–$10` estimate.

## Other monthly costs

| Thing | Cost | Notes |
|---|---|---|
| Railway (app + SQLite) | ~$45–$49 this cycle | Current cycle includes old 4 GB production and failed staging; next cycle uses the `$40` hard-cap plan above. |
| Trusted venue sync (10 venues) | $0 | Own server fetching public pages. No AI calls. |
| Flyer OCR (Tesseract) | $0 | Runs on our own CPU. |
| Flyer vision/LLM calls (Groq) | pennies-$5 | ~fraction of a cent per flyer (1024px image). 500 flyers/mo ≈ single-digit dollars. Free tier rate-limits prevent runaway bills. |
| GitHub Actions CI | $0 | ~4 min/run, path-filtered triggers, well inside the 2,000 free min/mo. |
| Domain | ~$1-2 amortized | |
| **Infra total** | **~$46–$51 this cycle** | Railway dominates this cycle; reassess after the reset. |
| AI assistant subscriptions (Claude/Grok/Codex/Perplexity) | **$60-100+** | The dominant cost of this project. Review quarterly: does each seat still earn it? |

## Spending ceilings and controls

- Railway workspace compute: `$60` hard cap this cycle. After reset, change it to `$40`
  and add a `$25–$30` soft alert.

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

## Railway preview cost and controls

- The old `staging` environment (`d10b5732-c324-46bc-b557-ac2cc626d4f0`) was torn down
  on 2026-09-18. Do not wake it or recreate it as an always-on environment.
- A request for phone or Safari testing, **stage this**, or a demo URL means a temporary
  Railway Sandbox in the existing `pdx-pride-guide` project. This sandbox is the only
  canonical remote preview. It is not `/hauz-map-sandbox`, a zip, or a second always-on
  service.
- Sandbox compute is about `$50/GB-month` while the VM exists. At the maximum allowed
  2 GB size, the monthly-rate equivalent is about `$100`, so the short lifetime is a
  billing control, not just cleanup.
- Before creating a sandbox, check current workspace compute against the `$60` hard
  cap. It is `$45.12 / $60` as of 2026-09-19. If the sandbox would risk the cap, stop
  and tell Tucker before creating it.
- Give the sandbox a public HTTPS URL, cap it at 2 GB, set an idle timeout of about
  15 minutes, attach no `/data` volume, and attach no `zaylist.com` or
  `prideguidepdx.com` DNS.
- Never leave a sandbox running. Destroy it when Tucker says done.

## Before adding anything that spends

1. What's the per-unit cost and the monthly worst case?
2. Where's the cap in code?
3. Where's the kill switch?
Write the answers into this file in the same PR.
