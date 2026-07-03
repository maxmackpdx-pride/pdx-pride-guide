**PlaceCard**, venue directory card. Neon border in the category color, category badge, optional "Grand Opening" flag, address/hours/phone rows, description, website + Instagram links, and an optional upcoming-events sublist.

```jsx
<PlaceCard
  category="bars"
  grandOpening
  name="Camp Bar PDX"
  address="1125 SW Harvey Milk St"
  description="Modern inclusive gay bar in downtown Portland's Gayborhood, in the historic former Scandals space."
  website="https://example.com"
  instagram="@campbarpdx"
/>
<PlaceCard
  category="venues"
  name="Alberta Rose Theatre"
  address="3000 NE Alberta St"
  description="Historic 300-seat theater hosting music, burlesque, comedy, and community events."
  events={[{ day:"SAT", date:"Sat, Jul 18 · 8:00 PM", title:"BOYeurism: Pride Spectacular" }]}
/>
```

- **category**: `bars` / `food` / `cafes` / `venues` / `services` / `shops` / `hotels` (sets border + badge color).
- **grandOpening** adds the yellow glow flag. **events** renders the "Upcoming Pride Events" sublist.
- Lay out in a masonry/columns grid on the Places directory.
