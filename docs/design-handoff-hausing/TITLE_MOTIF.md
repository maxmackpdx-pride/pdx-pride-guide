# HAÜS title motif ("Dynamic Text")

The title motif is the large household or person name over a photo well. It uses the same Dynamic Text behavior documented in the Foundation Library. It is a fixed frame filled by normal type, not a stretched SVG treatment.

**Implementation:** `client/src/components/housing/HousingWell.tsx`  
**Styling:** `client/src/pages/Housing.css`  
**Canonical design guide:** `zaylist-foundation-library/public/design-system/guidelines/dynamic-text.html`

## The contract

- Typeface: Barlow Condensed 900, all caps.
- The photo well and title frame stay fixed.
- The solver keeps complete words together. A manual line break is authoritative.
- The solver measures candidate rows at 100px, then gives every row its own proportional font size.
- Every rendered row fills the exact same fixed frame width, so all rows begin and end on the same vertical edges.
- Rows may have different font sizes. That is intentional.
- Font spacing remains normal. Do not use `scaleX`, non-uniform SVG, forced tracking, or character positioning.
- Render one to three rows. If the name cannot fit at the approved size, shorten it, add a manual break, or change the frame.
- The accessible name remains the original unbroken title string.
- Clear cached metrics when web fonts load and recalculate when the well changes size.

## Why this changed

The previous implementation made rows equal-height and stretched them horizontally inside SVGs. That distorted glyphs and created the wrong silhouette. The current solver instead changes font size uniformly for each completed row. A short line can be larger than a long line, while both still touch the same left and right edges.

For example:

```
THE DOG
HOUSE
```

HOUSE begins where THE begins and ends where DOG ends because it is measured and set at a larger normal font size. It is not widened by tracking or horizontal scaling.

## Frame rules

| Surface | Title-frame width | Title-frame height |
| --- | ---: | ---: |
| Looking / Offering / Managed | 55% of photo well | 58% of photo well |
| Forming, wide well | 72% of photo well | 58% of photo well |
| Detail head | explicit `nameCap` | 58% of photo well |

The title frame lives above the caption row. It never changes photo-well height, pushes the caption, or invents a fourth row.

## Implementation outline

1. Wait for `document.fonts.ready`, clear the canvas metric cache, then measure again.
2. Measure candidate whole-word rows using `900 100px Barlow Condensed`.
3. Score candidates by whether their independently solved sizes fit the fixed height.
4. Render spans with `font-size` per row, `white-space: nowrap`, normal spacing, and no transform.
5. Observe the well and caption with `ResizeObserver` so the frame resolves again only when geometry changes.
