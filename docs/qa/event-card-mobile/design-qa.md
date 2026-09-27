# Expanded event card mobile QA

Reference: user-selected neon glass event card. Local implementation, 2026-09-27.

## Evidence

`comparison.jpg` shows the supplied reference and the real React EventModal at the same 393 × 828 viewport. A temporary local database fixture supplies the title, date, venue, and a reconstructed poster. Fixture files and data are excluded from the commit. Real event posters remain data-driven.

## Checks

- Passed: mobile layout inspection at 360, 393, and 430 px widths. Content scrolls inside the frame when taller than the viewport.
- Passed: event details disclosure opens and closes, preserving metadata and existing event actions.
- Passed: location disclosure mounts the map after expansion.
- Passed: attendance CTA reveals the existing attendance panel.
- Passed: connections CTA reveals the existing time-gated Mizzed Connections panel.
- Passed: TypeScript check and production build. Build retains its existing large-chunk warning.
- Passed: same-size visual comparison for hierarchy, condensed headline, date/venue row, neon buttons, event link, connection feature, disclosure rows, and footer.

## Fidelity limits

This is a responsive implementation, not a pixel-identical raster reproduction. The reconstructed fixture illustration, generated glass texture/ring artwork, and icon geometry differ from the reference. No production event artwork or database was replaced. Phone-width checks used Chromium iframe viewports; native Safari was not tested.

## Delivery

Local commit only. No push or production deployment.

## Typography follow-up

Replaced card-specific Anton and Roboto Condensed with the existing ZayList display/body tokens: Barlow Condensed 700/800/900 and Inter 500/600/700. Removed the unused font files and licenses. Adjusted heading sizes to keep the mobile hierarchy and avoid single-line headline wrapping for this fixture. Updated comparison screenshot records the standard-font rendering.
