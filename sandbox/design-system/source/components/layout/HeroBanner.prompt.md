**HeroBanner**, full-bleed brand wallpaper with a legibility scrim and an overlay content slot. For the Home hero, Hub, and section headers.

```jsx
<HeroBanner image="assets/banners/hero-collage.png" minHeight={560} align="bottom-left" flush>
  <span className="pdx-marker">Portland Pride Weekend · July 16 to 19, 2026</span>
  <Logo variant="stacked" size={120} />
  <p style={{maxWidth:'42ch', color:'var(--text-mid)'}}>Your welcoming spot for the whole weekend.</p>
  <Button accent="lime" size="lg" arrow>Happening Now</Button>
</HeroBanner>
```

- **image**: a wallpaper from `assets/banners/`. **focal** tunes the crop.
- **scrim**: `bottom-left` (default) / `bottom` / `left` / `full` / `none`. **align** matches.
- **flush** for square corners at a page top; **seam** shows the top rainbow line.
