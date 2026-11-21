# Card system checks

Run `npm run cards:gate:start -- --ask "the owner's exact ask"` before changing a design. It states the seven filters in order. The three browser commands use a local server and a 402 × 874 touch viewport. Replace the origin and event path below with the instance under review.

```sh
event=http://127.0.0.1:5097/events/2022/yes-coach-3-year-anniversary
npm run cards:gate:api -- --url "$event"
npm run cards:gate:glass -- --url "$event" --url http://127.0.0.1:5097/directory --url http://127.0.0.1:5097/outzide
npm run cards:gate:copy -- --url "$event" --transcript /tmp/card-copy.txt
```

**API** checks the interest consumers, shared drawer components and direct literal writes to the hearts endpoint. In an isolated browser it changes the local event detail read response, follows the host through Info and People, and opens the profile route. These checks cover the named contracts.

**Glass** reads the canonical rule and its release from the published Foundation API on every run. It compares computed paint on the actual material layers. The scrim has no edge by the playground’s definition. The gate reports missing pieces, mismatches and unavailable comparisons as advisories. Any of these can be investigated after an owner-authorized change. [Published rule](https://zaylist-foundation-library.maxmackpdx.workers.dev/api/design/v1/rules?id=rule%3Aread-me%2Fdesign-guide-principles%3A%3Aone-glass-in-production)

**Copy** checks the displayed event title, venue, claim status, admission and age against the event API, then records the six tabs, action drawers, header and footer. Read the transcript cold and compare its wording with the founder’s voice. Save a review JSON with `sha256` from the run, `reviewer`, `kind` (“human” or “editorial”), `coldRead`, `voice` and `verdict` (“pass” or “revise”). Rerun with `--review /path/to/review.json`. A changed fingerprint invalidates a review. An editorial read or missing review leaves the human check open. Product paragraphs with em dashes are flagged. Organizer copy is preserved. [Published principles](https://zaylist-foundation-library.maxmackpdx.workers.dev/design-system/guidelines/design-guide-principles.html)

Each command accepts `--help`. Browser checks use installed Chrome by default. Set `CARD_GATE_CHROME=bundled` to use an installed Playwright Chromium.
