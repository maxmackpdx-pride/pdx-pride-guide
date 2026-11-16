# BoardZ save-label and mobile QA reconciliation

Reconciles the still-missing scoped changes from PR #72 onto master 0a71bc968936580c719d9630468d3a329f1bac77. This is not a merge of the stale branch.

## Production change
Small and wide BoardZ hearts now name their post: Save <title> / Unsave <title>. Both the base card and Zine faces use the same rule. Visuals, dimensions, API writes, save state, disabled behavior and propagation are unchanged.

## QA
- Recovered isolated production-card save/toggle browser test using the existing card-api-browser fixture.
- Recovered read-only 390px/430px journey runner. Updated PlaceZ selectors to the native page (textbox, A night out filter, repeated-card opener, native close label); filters are now local state, so it no longer falsely requires the retired URL parameters.
- The live journey runner remains opt-in workflow_dispatch, since mutable public listings and network access are not deterministic candidate checks. It blocks all non-GET/HEAD/OPTIONS requests.
- Workflow runs the isolated BoardZ browser regression and typecheck on the reconciliation branch and relevant PRs. Evidence is uploaded.
- Local node --check passed for both scripts; esbuild JSX transform passed for both changed production files.
- Browser execution and full typecheck require the complete checkout/dependencies and are not claimed as passed here.
- Live mobile journeys are emulated Chromium, not physical Safari. Live source/link correctness and authenticated persistence are not established by these tests.
