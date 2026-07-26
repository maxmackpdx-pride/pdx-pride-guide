**Countdown**, live-ticking neon blocks counting down to a datetime. The hero countdown to events.

```jsx
<Countdown target="2026-07-16T19:00:00" />
<Countdown target={venue.doorsAt} size="sm" doneLabel="Doors open!" />
```

- **target**: ISO datetime. Default is events kickoff (Jul 16, 2026 7pm).
- **size**: `md` (hero) / `sm` (inline).
- Ticks every second; shows `doneLabel` once passed. Days / Hrs / Min / Sec blocks glow pink, amber, cyan, purple.
