**SectionHeader**, opens a page section: mono kicker + loud display title + optional subtitle and action.

```jsx
<SectionHeader
  kicker="The Guide"
  title={<>All <span className="hl">49 events</span></>}
  subtitle="Pride Weekend and summer 2026, all in one place."
  accent="cyan"
  action={<Button variant="secondary" size="sm">View all</Button>}
/>
```

- Wrap a word in `<span className="hl">` to color it with `accent`.
- **align**: `left` / `center`. **size**: `md` / `sm`.
