**StatPill**, compact count pill: accent number + gray uppercase label. All over Hub and Admin.

```jsx
<StatPill count={52} color="lime" icon={<i data-lucide="map-pin"></i>}>Events</StatPill>
<StatPill count={1} color="cyan">Events</StatPill>
<StatPill count={3} color="pink">Action Items</StatPill>
<StatPill count={1} color="orange">Posts</StatPill>
<StatPill variant="solid" color="lime" glow dot>Live</StatPill>
```

- **count** in accent color; label as children. **color**: any neon.
- **variant**: `outline` (default) / `solid`. **glow**, **dot**, **icon**, **size** (`sm`/`md`).
