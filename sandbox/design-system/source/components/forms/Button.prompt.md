**Button**, the site CTA. Signature look is a **neon outlined rectangle** (transparent fill, thick neon border + matching text, near-square corners, soft glow, trailing →).

```jsx
<Button accent="lime" size="lg" arrow>View All Events</Button>   {/* primary */}
<Button accent="pink" size="lg" arrow>Pride Werk</Button>        {/* secondary */}
<Button accent="lime" live>Live Events</Button>
<Button variant="solid" accent="pink">Get Tickets</Button>
<Button variant="gradient" arrow>Submit an Event</Button>
<Button variant="ghost" accent="cyan">Cancel</Button>
```

- **variant**: `neon` (default) / `solid` / `gradient` / `ghost`.
- **accent**: `lime` (primary), `pink`, `cyan`, `purple`, `amber`, `yellow`.
- **arrow** appends →; **live** shows the pulsing dot. **size**: `sm`/`md`/`lg`.
- Corners are near-square (3px) by brand convention, do not make CTAs pill-shaped.
