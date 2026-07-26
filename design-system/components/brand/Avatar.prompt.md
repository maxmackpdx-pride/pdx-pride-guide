**Avatar** — community member chip. A photo or initial inside a 4px conic **flag ring**. The ring is IDENTITY, chosen by the member. Unset defaults to **Progress flag**.

```jsx
<Avatar name="Tucker Casey" ring="progress" size="lg" status />
<Avatar src="/u/12.jpg" name="DJ Anjali" ring="transgender" />
<Avatar name="Bear Dad" ring="bear" />
<Avatar name="Kink Host" ring="chain" />   {/* metal ring + padlock */}
<Avatar name="Guest" ring="none" />         {/* masked / no ring */}
```

- **ring**: `progress` (default), `rainbow`, `lesbian`, `gay-men`, `bisexual`,
  `transgender`, `nonbinary`, `pansexual`, `intersex`, `asexual`, `leather`,
  `bear`, `chain`, `none`. Colors mirror the site's `index.css`.
- **size**: `sm` (32, nav) / `md` (44) / `lg` (64) / `xl` (84), or a px number.
- **tint** sets the fallback bg (auto from name otherwise). **status** shows a dot.
- Attendance cluster: render several with `margin-left:-9px` and a dark border;
  the last (masked guest) uses `ring="none"`.
- `AVATAR_RINGS` is exported if you need the gradient map directly.
