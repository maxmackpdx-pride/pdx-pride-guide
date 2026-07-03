**Badge**, small Anton uppercase tag, near-square corners. Solid neon fill (black text) or neon outline. The workhorse label.

```jsx
<Badge admission="FREE" />              {/* lime "FREE" */}
<Badge admission="TICKETED" />          {/* cyan "TICKETED" */}
<Badge day="FRI" />                     {/* paper chip "FRI" */}
<Badge category="bars" />               {/* magenta "BARS & CLUBS" */}
<Badge color="yellow" glow>Grand Opening</Badge>
<Badge color="pink">Party</Badge>
<Badge color="cyan" variant="outline">Bear</Badge>
<Badge variant="paper">21+</Badge>
```

- Shortcuts: **admission** / **day** / **category** set color + default label.
- **variant**: `solid` (default) / `outline` / `paper`. **color**: any neon. **glow** for GRAND OPENING. **size**: `sm`/`md`/`lg`.
- Everything renders UPPERCASE in Anton.
