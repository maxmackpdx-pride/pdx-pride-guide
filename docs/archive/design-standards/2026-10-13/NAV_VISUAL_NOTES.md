# Historical navigation visual notes

Superseded; current destinations come from siteNav.ts and explicit owner direction. These old Z/Space address layouts are not current UI instructions.

## Site navigation

Source: Claude Design handoff *Top Nav Bar Mockups*, project `8c680e88`, 2026-08-21.
Code: `client/src/lib/siteNav.ts` (model + accents), `client/src/components/Nav.tsx`,
`.site-nav-link` / `.site-nav-dropdown__*` in `client/src/index.css`.

- Every entry is a **hairline pill** (`999px`, `2px solid #333`) on a plain dark bar. It lights in **its own accent** on hover, and **on hover only**. The current page keeps its accent on the rim and the label but carries **no standing glow and no pulse**: glow is an affordance, not a state.
- Accents are per destination and live in the nav model, not in CSS forks: Home lime, About magenta, Eventz cyan, Placez blue, Outz orange, Z/Space violet. Board items inside Z/Space carry their own board accent.
- Accents resolve through the shared tokens (`--panel-*`, `--neon-*`, `--green-acid`) via a `data-accent` attribute, so Calm Mode desaturates the nav with no nav-specific overrides. `#0044ff` and `#8800ff` are too dark to read as label ink: the glow keeps the token and the text lifts to a tint (`--nav-c` vs `--nav-c-ink`).
- Pills are `.88rem`. They must **not** inherit `--site-nav-size` (16.8 to 21.6px) - six bordered pills at that size run off the bar. Padding, pill gap, brand lockup width, and the search trigger's label all step down between 1024 and 1439 so the full set fits without the nav scrolling.
- Dropdowns are dark rounded panels of the same pills, **one plain column each**. A list may carry a mono **eyebrow**, used either as a section label (Outz: "Most Visited") or as plain descriptive copy (Z/Space: "Every board, one place"). There is no featured card. Z/Space opens leftward because its trigger is the last pill.
- Outz lists `All OUTZ` (`/z/out`, a real index page) above the two OUTZ addresses. Z/Space leads with `z/ all boards`, which carries the `/z` link the retired featured card used to own, then `My Hoüz`, `Gigz`, `Sellz`, `Mizzed`, `Giftz`.
- The desktop right cluster reads **search → notifications bolt → Hub → seam → avatar + caret**, in that order. The bolt is the same component as the mobile top bar's, so its panel styles are global, not trapped in a phone media query.
- **Hub is the one primary action** in the bar, so it takes the solid fill the standard reserves for primary: cyan plate, dark ink, and `--chrome-keyline` + `--chrome-bevel` + `--chrome-floor` + `--neon-bloom` composed as the whole shadow. No border, no standing dot. Log in / Join is the signed-out control in the same slot and is built the same way.
- The wordmark keeps the glitch treatment: the real logo asset plus two RGB-split ghost layers (cyan and magenta, `screen` blend) flashing briefly on a 3.2s loop. Never typeset it.

### Mobile bar and sheets

- Five tabs: **Eventz, Placez, Hub, Z/Space, Messages**, on deep glass with the flowing rainbow seam on the top edge. There is **no pull handle** on the site-wide bar; that remains retired. Any grip belongs to an in-Hub drawer, never the global site bar.
- Tab glow is accent-coloured and **hover/active only**. **Hub is the exception: its glow is white**, never a colour, because it is the centre mark and reads as neutral chrome.
- **Outz opens a drawer, not a navigation.** The phone bar has no Outz tab, so the trigger is the Outz row inside the Z/Space sheet. The drawer pins above the bar with a mono `Outz · Most Visited` kicker, numbered rows, and a `View All Outz →` footer to `/z/out`. It lists the OUTZ addresses that exist; do not pad it with places that have no page.
- **Hub is navigation, not a drawer trigger.** Tapping Hub takes a signed-in visitor directly to `/dashboard`. Admin remains an explicit destination inside the Hub experience. The global Hub tab must never open Member/Admin or administration sheets.
- **Signed out, Hub opens the log-in sheet**, which is the same `AuthModal` component presented bottom-anchored and full-bleed below 640px (`24px` top corners, ~82vh). One auth component, one Google path, one reset path: do not fork a second login form for phones.
- Reduced motion and Calm Mode drop sheet entrances and the seam flow; colors, glow, and every destination stay.

