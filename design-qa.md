# Placez and ReZources — Eventz preview review

Result: passed for the private design preview. Zaylist production is unchanged.

## Scope and reference

Eventz supplies the page composition: compact identity, category dock, search, sidebar, and grouped browse lanes. Existing design tokens and detail interfaces fill the gaps. Tucker's subsequent direction takes precedence for the cards: preserve the original Placez and ReZources motifs, adapting only their size and spacing to this composition.

The generic BrowseCard was removed. Placez uses the original PlaceDiscoveryCard. ReZources uses its original ResourceCard implementation, restored verbatim from GitHub commit 76b046af. The motif artwork, motion, category coloring, glass layers, logo surfaces, and original actions are retained.

## Verification

- Ten original card/motif source files are byte-identical to 76b046af in both the product branch and the Sites demo. The ResourceCard implementation block is also identical.
- All 403 bundled assets match their immutable GitHub source hashes. All 298 referenced logo paths resolve.
- Product and demo TypeScript checks passed. The demo production build passed. Whitespace validation passed.
- Desktop checked at 1280px and phone layout at 390 × 844px. No horizontal page overflow. Cards are adapted to 200px browse rails and two-column mobile grids while retaining the original layers and artwork.
- Place and resource search, detail views, resource safety support, grid/browse controls, and switching between both pages passed.
- The preview-only page switch crash was fixed by preventing the scroll effect from returning a cleanup value. The round trip between both pages passed afterward.
- Account actions show a preview notice. The demo makes no production account mutations and uses public seeded directory records and the original resource data.

## Current visual evidence

These captures supersede the earlier generic-card captures:

- `.local/sites-review/placez-desktop.png`
- `.local/sites-review/rezources-desktop.png`
- `.local/sites-review/placez-mobile.png`
- `.local/sites-review/rezources-mobile.png`

The unchanged Eventz reference remains `.local/design-review/eventz-desktop.png`.

## Limits

The Sites preview has its own small navigation bar for the two pages. Real account actions and live data are outside this preview. Browser verification used Chromium and phone-sized emulation; physical Safari was not tested. Browser-generated favicon.ico requests returned 404; the declared PNG favicon is bundled. The product's primary navigation, Eventz implementation, Foundation Library, and production deployment are unchanged.
