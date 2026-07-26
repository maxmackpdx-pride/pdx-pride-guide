**MapPanel**, the dark neon map surface for the Events and Directory pages. Day-colored glowing pins over a dark map, rainbow flag seams top and bottom, and either the day legend or an Expand control.

```jsx
<MapPanel
  height={420}
  pins={[
    { x: 40, y: 40, day: "THU" },
    { x: 46, y: 52, day: "SAT" },
    { x: 35, y: 42, multi: true },
  ]}
/>
<MapPanel expandable onExpand={() => openFullMap()} />
```

- **pins**: `{x, y, day}` percentages (or `{x, y, multi:true}`). Pin color follows the day system.
- **legend** (default) vs **expandable** (shows an Expand button instead).
- In production the background is a Leaflet + CARTO dark tile layer; this styles the branded overlay. Uses `MapLegend`.
