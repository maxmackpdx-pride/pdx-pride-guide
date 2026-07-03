**Logo**, the official brand lockup. App-icon mark + stacked wordmark (PDX / PRIDE / GUIDE, PRIDE in rainbow). **Brand rule: the mark appears with the wordmark** unless you deliberately use `variant="icon"`.

```jsx
<Logo variant="lockup" size={56} src="assets/logo.png" />   {/* header */}
<Logo variant="stacked" size={96} />                         {/* hero / centered */}
<Logo variant="icon" size={40} />                            {/* favicon / tight space */}
<Logo variant="wordmark" size={72} />                        {/* text-only */}
<Logo tone="dark" />                                         {/* on paper backgrounds */}
```

- **src**: pass the correct relative path to `assets/logo.png` for the page (`../../assets/logo.png` from a card/kit).
- **tone**: `light` on dark backgrounds (default), `dark` on paper.
- The mark is a 960×960 rounded app-icon (transparent corners), never stretch, recolor, or redraw it.
