**Avatar** — community member chip. Circular photo or initials inside the signature rainbow-gradient ring.

```jsx
<Avatar name="Tucker Casey" size="lg" />
<Avatar src="/u/12.jpg" name="DJ Anjali" ring="FRI" status />   {/* day-tinted ring + status dot */}
<Avatar name="Guest" ring="neutral" size="sm" />
```

- **ring**: `rainbow` (default), `neutral`, or a day key `MON..SUN` (e.g. host chips).
- **size**: `sm` / `md` / `lg` / `xl`, or a px number. **status** shows a dot.
- Cluster several with negative left margin for the "N going" attendance stack.
