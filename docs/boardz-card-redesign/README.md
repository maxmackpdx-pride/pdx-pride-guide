# Boardz card redesign (work in progress)

Punk meets cyberspace redesign of the Boardz cards, built as Design canvas boards.
Live canvas: https://claude.ai/artifact/AyVnR8MwaiDqTzv27hyvr6 (page "Directions").

- Wheatpaste card: posts with a photo. Cutout specimen card: posts without one.
- Each card has large, small and open states, versions A and B (picked from the post id).
- Torn rim uses the live punk-materials scan and color map, thinner. Seeking posts keep the live notch dashes.
- The card glitches and decays in random, unsynced parts. Calm mode and reduced motion stop it.
- Hoüz keeps its original palette: cyan frame and hero, type color as secondary.

Files
- `gen_dirs2.py`: card builders and the Giftz board (`boards/Directions.dc.html`).
- `gen_rooms.py`: Hoüz, Mizzed, Sellz and Gigz boards (`boards/Cards-*.dc.html`).
- `dirs2.css`: all card styles.

The boards reference canvas uploads by `/_blob/<id>` and a paper and tears stylesheet embedded as data URIs
(not committed, about 1.6 MB). They render inside the canvas, not standalone. Nothing here ships to the site yet.

## Deploy notes (do when this ships)

- **Hoüz month stamp + sort.** Every Hoüz card shows a three-letter month stamp (AUG, SEP, JUL) taken from the
  form's date field: move in (Join our Hoüz), by (Looking to rent), goal (Building a Hoüz), available (Managed
  rental). When Hoüz is viewed solo on Boardz, add a **sort by month** control that orders posts by that date,
  soonest first. Posts with no date go last.
