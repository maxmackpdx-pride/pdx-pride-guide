# Our BoardZ card and overlay implementation pointers

Tucker’s named Eventz reference governs open and closed card styling. The canonical written guide is the [Foundation Design System](https://zaylist-foundation-library.maxmackpdx.workers.dev/design-system/); [LIVE_DESIGN_STANDARD.md](./LIVE_DESIGN_STANDARD.md) records the product implementation pointers. This file is not a second design kit.

- Our BoardZ is the single combined page at `/boardz`, with My Hoüz, Gigz, Giftz, Sellz and Mizzed. Legacy board entrances preserve categories, post IDs, tools and intents.
- Use the current shared `UnifiedBoardArt`, `OpenBoardCard` and category-specific real detail components. Keep wide closed cards and Eventz-based open glass anatomy; preserve each category’s existing features and permissions.
- Each category retains one assigned token hue. Complementary accents occupy at most 10–20% of a card; the multicolor Our BoardZ logo does not recolor category cards.
- Hub and Mapz open the same interactive object. Close retains the originating scroll, camera and filters. Demo cards remain clearly identified and read-only alongside real posts.
- Category following is independent of browsing selection and uses the existing Hub subscription mechanism. Mizzed privacy remains enforced by its existing API.
- Past event tiles reuse compact event cards, with only the poster in black and white. Upcoming events precede past events; Mizzed appears at the bottom.

The [superseded board-card document](./archive/design-standards/2026-10-13/BOARD_CARD_STANDARD.md) is historical provenance, not an active template.
