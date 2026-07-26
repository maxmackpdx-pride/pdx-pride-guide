**Logo**, the official brand lockup. Tile mark + stacked wordmark (spectrum gradient). **Brand rule: the mark appears with the wordmark** unless you deliberately use `variant="icon"`.

```jsx
<Logo variant="full" size={72} fullSrc="assets/logo-lockup.png" /> {/* exact baked lockup */}
<Logo variant="lockup" size={56} src="app-face/icons/zaylist-512.png" />   {/* header, live text */}
<Logo variant="stacked" size={96} />                         {/* hero / centered */}
<Logo variant="icon" size={40} />                            {/* tight in-product space. Real favicons come from app-face/icons/ */}
<Logo variant="wordmark" size={72} />                        {/* text-only */}
<Logo tone="dark" />                                         {/* on paper backgrounds */}
```

- **variant `full`**: the baked horizontal lockup (the ZAYLIST wordmark as one image, `assets/logo-lockup.png`). `size` sets its height. Use when you want the exact wordmark art; use `lockup` when you want selectable/scalable live text next to the mark.
- **src / fullSrc**: pass the correct relative paths for the page (`../../app-face/icons/zaylist-512.png` and `../../assets/logo-lockup.png` from a card/kit).
- **tone**: `light` on dark backgrounds (default), `dark` on paper.
- The mark image is the shipped app face export. Its artwork, per-platform files and sizes are specified in the App face standards (`app-face/`), the only source of truth for home-screen icons and favicons. Do not restate its geometry here, and never stretch, recolor, or redraw it.
