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
