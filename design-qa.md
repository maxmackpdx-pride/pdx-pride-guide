# Placez and ReZources — Eventz preview review

Result: passed for the private design preview. Zaylist production is unchanged.

## Scope and reference

Eventz supplies the page composition and the open/closed card standard. Placez uses the large Eventz frame at 200 × 403px with a 17px radius. ReZources uses the small 136 × 170px Eventz frame enlarged 20% in both dimensions: 163.2 × 204px, with a 19.2px radius. Fixed card dimensions apply in browse and grid views.

Both details now import the actual EventModal approved/reference styles: a centered frame up to 600px wide, viewport minus 38px on phones, height up to 1040px with 12px viewport clearance, a 24px radius, share/close controls, an artwork region, title hierarchy and action stack. Resource disclosures and the Place details disclosure use the Eventz disclosure treatment. The resource detail uses an accessible centered Radix dialog; its separate immediate-support drawer is unchanged.

Original PlaceDiscoveryCard and ResourceCard artwork, motif source, category coloring, motion and logo assets remain. Resource cards display an identifying caption for every organization. Only layout adapters and detail markup changed.

## Classification

- 35 nonprofit, health and support listings leave Placez: 27 match existing ReZources entries and eight were added using their existing directory content.
- Therapy and psychiatry practices are included per Tucker's explicit direction.
- The seeded preview now has 62 Placez and 91 ReZources results (90 organizations plus the food-finder entry). Cross-category appearances refer to the same organization.
- Existing place links for moved organizations open their ReZources details. Business records and event relationships are retained.
- Add Place options omit nonprofit, healthcare and group categories.

## Verification

- Classification assertions covered all 35 moved listings, unique matching resource targets and retained ordinary businesses.
- All 436 bundled preview assets match their immutable GitHub hashes. All 306 referenced logo paths resolve.
- Product TypeScript check, Sites production build and whitespace validation passed.
- Desktop and 390 × 844px phone layouts inspected. Closed dimensions measured in the browser. Open frames measured at 600px on desktop and 352 × 820px on phone; no horizontal overflow in the detail scrollers.
- Search, page navigation, resource and place detail opening, disclosures, scrolling, close controls, Escape, and focus restoration passed. Legacy place links to moved resources passed.
- Place follow/account actions show the preview notice. No production account mutations occur.

## Visual evidence

Current screenshots are kept in `.local/sites-review/`: `placez-eventz-frame.png`, `rezources-eventz-frame.png`, their mobile variants, and `placez-eventz-open.png`, `rezources-eventz-open.png` with mobile variants. The unchanged Eventz reference is `.local/design-review/eventz-desktop.png`.

## Limits

The private Sites preview uses seeded public data and a private three-page navigation bar. Account writes are disabled. Verification used Chromium and phone-sized emulation; physical Safari was not tested. The product's primary navigation, Eventz implementation, Foundation Library and Zaylist production deployment are unchanged.

## October 12 follow-up

- Removed list layout from both browse pages, including normalization of old `layout=list` links.
- Map entry links explicitly select just Placez or just ReZources, preserving optional place coordinates; the normal Mapz layer controls remain available. The place layer excludes organizations moved to ReZources.
- Place details now precede Follow and open by default. The Eventz Mizzed Connection inset opens the venue's existing connection tab. Upcoming events appear in an independent default-open section at the bottom, using square EventFlyerArt tiles.
- TypeScript and whitespace checks passed. Browser checks confirmed both default-open disclosures, details-before-Follow order, Mizzed tab selection and 148px square event tiles at the 390px viewport. Map query assertions and the rendered Placez/ReZources links agree with Mapz's existing eight visibility controls.
- The isolated Site contains three clearly marked archived event examples for Badlands, so the tile treatment can be reviewed without implying a current schedule. No product event data changed.
- A Site-only All boards experiment combines five community categories with twelve fictional posts. Its implementation, sample data, and three-page navigation do not alter product routes or production navigation.


## 2026-10-12 · Shared complementary card accents

Passed for the scoped color change. Added a shared secondary-color recipe across the existing card families, including nested cards and older card roots. Eventz large, compact and open cards retain the existing dayComplementToken pairs. Category cards derive a softened complementary hue from their own primary color. Nested Mizzed doorways rebind to their own identity. Thin opposite edges, motif linework, footer seams and small icons carry the secondary accent; dimensions, text hierarchy, logos, imagery and statuses remain intact.

Tucker’s follow-up removed the fixed pink/cyan smoked-glass flare from open cards and the experimental wide family. Shared card lighting now uses restrained category-specific linear reflections, a darker fill, 6px backdrop blur and a shorter edge shadow. No new image asset was created.

Verification: product TypeScript check and diff checks passed; matching private Site build passed. Browser inspection covered Placez (200 × 403), ReZources (163.2 × 204), open Placez, nested Mizzed and upcoming event tiles, wide board cards/open state, and calm mode. A local isolated fixture checked the actual full-size and compact Eventz components across all seven days, open Eventz, and representative shared card primitives. Fixed an explicit day-pair inheritance mismatch on compact card art. Final built board view compared against the prior screenshot in one visual input. At 390px the board page has no horizontal overflow and its cards remain 334px wide. Representative families were inspected, not every route; physical Safari was not tested. Product production is unchanged.
