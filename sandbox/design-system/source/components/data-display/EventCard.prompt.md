**EventCard**, the core directory row. Time block + title + venue/neighborhood + admission badge. Whole card links when `href` is set.

```jsx
<EventCard
  href="/events/13"
  day="THU" hour="8:00" ampm="PM"
  title="Sasha Colby Pride Kick-Off"
  venue="Star Theater" neighborhood="Old Town"
  admission="TICKETED" accent="purple"
  tags={["Drag","21+"]}
  saved={false} onSave={() => {}}
/>
<EventCard featured accent="pink" day="SAT" hour="12:00" ampm="PM"
  title="Portland Pride Waterfront Festival" venue="Tom McCall Waterfront Park"
  neighborhood="Downtown" admission="SUGGESTED_DONATION" />
```

- **accent**: rotate by day (`pink`/`cyan`/`purple`/`lime`/`amber`/`orange`/`blue`) so the list reads like a rainbow.
- **featured**: rainbow top rule for headliners.
- **onSave** adds the heart button; **saved** fills it.
- Uses `Badge` internally for admission. Stack cards in a `display:grid; gap:var(--gap-list)` column.
