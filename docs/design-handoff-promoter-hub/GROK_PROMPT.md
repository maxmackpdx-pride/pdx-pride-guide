# Grok task prompt — Promoter hub redesign

Paste this whole file to Grok (or run it as your task brief). It assumes you have push access to
`maxmackpdx-pride/pdx-pride-guide` (default branch `master`) and the app already builds and runs locally.

---

## Goal

Redesign the confusing Promoter page (`/submit`) using the mockup in this folder
(`Promoter Hub.dc.html`) as the source of truth for **layout, copy, and the four-path
information architecture**. Do NOT ship the HTML file. Recreate the design inside the existing
React + TypeScript codebase, reusing the components and tokens already in the repo.

The mockup is a design reference built in plain HTML. It is high-fidelity for structure, copy,
color, and behavior, but you must express it with the app's real components, not raw divs.

## What actually changes (and what does not)

- **File to edit:** `client/src/pages/Submit.tsx`. This is the only page component that changes.
- **Do not** change the backend, the API contract (`POST /api/submit`), the auth flow, the
  `promoterStatus` model, or the admin side. The redesign is presentational + IA only.
- Keep all existing data hooks: `useAuth`, `useQuery(["/api/events/unclaimed"])`,
  `useQuery(["/api/events"])`, both mutations (`applyMutation`, `eventMutation`), and
  `handleSubmitWithEvent`. Rewire them to the new markup; do not rewrite their logic.
- Reuse the existing components already imported in that file: `BoardHero`, `PageHeader`,
  `BoardStatsBar`, `BoardCloseSeam`, `ScrollReveal`, `Button` (from `@/components/ds`),
  `EventTypeTag`, `BoardFilterChip`, `ImageUploader`, `AuthModal`. Pull design tokens from
  `client/src/index.css` (the `--panel-*`, `--neon-*`, `--day-*` vars). No new color literals.

## The redesign, precisely

The current page throws four sibling paths at the user with two stacked "how it works" panels and
unclear go-live rules. The redesign fixes exactly that:

1. **Every path advertises its outcome with a status chip.** Add a small mono uppercase chip to
   each path entry and to the top of each form. The chip text + color is a pure function of
   account state:
   - Submit / Claim -> verified: `Goes live now` (`--panel-lime`); else `Reviewed first` (`--panel-cyan`).
   - Apply -> `One-time review` (`--panel-purple`). Hide this path entirely for verified users.
   - Spotted -> `No promoter status` (`--panel-magenta`).
2. **Add a "Submit vs Apply" clarifier** block, shown only to non-verified users: Submit posts your
   event now and verifies you in the same step; Apply just verifies you for later.
3. **Remove the second "What verified promoters get" `BoardHowItWorks` panel** and collapse the
   remaining intro so the paths are visible without scrolling past a wall of text.
4. **Fold the 2-step submit stepper into one page.** For non-verified users the submit form shows
   two labeled sections on a single screen ("1 · About you (one time)", "2 · Your event") instead of
   the `submitStep` promoter_app -> event_details navigation. Verified users see only the event section.
   You can keep the `SubmitStep` type internally if easier, but the user should not navigate between
   two screens for one submission.
5. **Account required for Spotted.** Spotting still needs a logged-in account, it just does not need
   promoter status. Copy must say that (not "no account needed").

### The three landing layouts in the mockup are OPTIONS, not all three

The mockup ships an A/B/C landing switcher and a "Preview as" account switcher — those are prototype
scaffolding for review. **Do not port the switchers.** Ship ONE landing layout. Default to
**Layout A (Sorter)** — the single vertical list of four path rows under "What are you here to do?" —
unless the maintainer (Tucker) has picked another. Account state comes from the real `useAuth()`,
not a toggle.

Keep the existing `BoardHero` (landing) / `PageHeader` (sub-views) split, the `BoardStatsBar`
band, the status banners (verified / pending / account-required), and the `BoardCloseSeam`
("Submit it. Claim it. Keep Portland queer.").

### Copy

Use the exact strings from the mockup. Project rule: **no em dashes anywhere** (use periods,
commas, colons, or "to" for ranges). Do not reference "Pride Week" on this page.

## Connect it to the current setup

1. `git checkout master && git pull`
2. `git checkout -b redesign/promoter-hub`
3. Install + run if not already: `npm install`, then `npm run dev`. Open `/submit`.
4. Edit `client/src/pages/Submit.tsx` per the spec above. Match `Promoter Hub.dc.html` for
   layout, spacing, chip vocabulary, and copy. Lift real values from `client/src/index.css`.
5. Keep TypeScript happy: `npm run check` (or `tsc --noEmit`) must pass. Run the linter/formatter
   the repo uses.

## Smoke test (do this before deploying)

Run the app locally and verify each, as different users:

- **Logged out:** hitting a path opens `AuthModal`; the account-required banner shows and says
  Spotted needs an account (not promoter status).
- **Member (promoterStatus none):** Submit shows both "About you" + "Event" sections on one page;
  chips read `Reviewed first`; Apply path visible with `One-time review`.
- **Pending:** pending banner shows; can still submit/claim.
- **Verified promoter (or admin):** Apply path is hidden; chips read `Goes live now`; Submit shows
  only the event section.
- **Each form submits** through the real mutation and lands on the correct success state; a real
  `POST /api/submit` fires with the right `type` (`NEW_EVENT`, `PROMOTER_APPLICATION`, `SUGGEST`,
  `CLAIM`). Claim's event dropdown is populated from `/api/events/unclaimed`.
- **Deep links still work:** `/submit?mode=apply`, `/submit?mode=claim`, `/submit/claim/:eventId`.
- No console errors. `npm run build` succeeds. Check mobile width (single column).

## Deploy

1. Commit: `git commit -am "Redesign promoter hub: clarify four paths, per-path go-live chips, one-page submit"`
2. `git push -u origin redesign/promoter-hub`
3. Open a PR against `master`, summarize the IA change, and request Tucker's review. Let the normal
   CI + hosting pipeline deploy on merge. Do not force-push to `master`.

If anything in the data layer resists the new markup, stop and flag it in the PR rather than
changing the API.
