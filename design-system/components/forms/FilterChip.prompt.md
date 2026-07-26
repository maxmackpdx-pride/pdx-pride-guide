**FilterChip**, toggleable filter pill for the event list (day, admission, neighborhood, category). Fills with its accent color when selected.

```jsx
<FilterChip selected accent="lime" count={18} onToggle={...}>Free</FilterChip>
<FilterChip accent="pink" count={31}>Ticketed</FilterChip>
<FilterChip accent="cyan" showDot>Sat Jul 18</FilterChip>
```

- **selected** + **onToggle** drive state (uses `aria-pressed`).
- **accent**: `pink` / `cyan` / `purple` / `lime` / `amber` (or any CSS color).
- **count**: trailing number. **showDot**: leading accent dot.
- Lay chips out in a `display:flex; gap` row (horizontally scrollable on mobile).
