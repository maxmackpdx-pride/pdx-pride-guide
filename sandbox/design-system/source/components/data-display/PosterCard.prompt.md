**PosterCard**, image-first event card for the GRID view. Letter-portrait (8.5×11) flyer tile with the event's poster art as the full background, day-colored top edge, link chip, and title/venue/time over a bottom scrim.

```jsx
<PosterCard
  href="#"
  day="THU"
  image="assets/flyers/sasha-colby.jpg"
  title="Sasha Colby Pride Kick-Off"
  venue="Star Theater"
  time="8:00 PM"
  going={1}
/>
{/* no art -> day-tinted fallback panel with the title set large */}
<PosterCard day="SAT" title="Portland Pride Waterfront Festival" venue="Waterfront Park" time="12:00 PM" />
```

- **day** drives the top-edge + badge color. **going** shows the lime "N GOING" pill.
- **aspect** default `8.5/11`. **image** optional (fallback = generated-flyer look).
- Use in the events grid; use `EventCard` for the list view.
