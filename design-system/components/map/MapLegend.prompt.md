**MapLegend**, the day-color key for the map. Lime-outlined box, a glowing dot per day (Mon to Sun), plus a rainbow "Multi-day" swatch.

```jsx
<MapLegend />
<MapLegend multi={false} days={[{label:'Sat', c:'var(--day-sat)'}, {label:'Sun', c:'var(--day-sun)'}]} />
```

- Defaults to the full Mon-to-Sun event palette. Override `days` for a subset.
- Placed over `MapPanel` (top-right) or standalone in a filter panel.
