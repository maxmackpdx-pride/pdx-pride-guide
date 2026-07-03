**SearchInput**, rounded pill search field for filtering the event directory. Built-in magnifier glyph, cyan focus glow, optional clear button.

```jsx
const [q, setQ] = React.useState("");
<SearchInput value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ("")} />
```

- **label**: optional mono-uppercase label above.
- **size**: `md` (48px, default) or `sm`.
- Pass `onClear` to enable the ✕ button.
