**StatCard**, big-number dashboard tile with a neon border + glow and a "VIEW →" action. For the Admin dashboard stat grid.

```jsx
<div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14}}>
  <StatCard value={14} label="Registered Users" color="lime" />
  <StatCard value={47} label="Live Events" color="orange" />
  <StatCard value={5} label="Community-Submitted Events" color="cyan" />
  <StatCard value={2} label="Pending Review" color="pink" href="#" />
</div>
```

- **value** + **label** (uppercase). **action** defaults to "View"; pass `""` to hide.
- **color**: rotate across the grid (`lime`/`cyan`/`orange`/`pink`/`purple`/…) for the neon rhythm.
- **href**/**onClick** make it interactive (adds hover lift).
