**Marquee**, full-bleed infinite scrolling ticker of slogans/dates. Signature zine/club strip. Pauses on hover.

```jsx
<Marquee color="rainbow" items={["Events", "July 16–19, 2026", "Keep Portland Weird", "Take Care of Each Other"]} />
<Marquee color="pink" speed={20} separator="●" />
```

- **color**: any neon or `rainbow`. **speed**: seconds per loop. **separator**: glyph between items.
- Place as a full-width band; don't box it in. Intentional addition (see readme).
