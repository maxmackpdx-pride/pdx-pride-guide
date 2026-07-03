# PDX Pride Guide — Avatars & Pride Rings

For claude.ai/design (or any design tool). Source of truth:
`client/src/components/UserAvatar.tsx`, `shared/avatarRings.ts`, and the
`.user-avatar` rules in `client/src/index.css`. Renderable sample:
`previews/avatars.html`.

## Anatomy — one component, three layers

```html
<!-- data-ring selects the flag gradient; --avatar-size scales everything -->
<div class="user-avatar" data-ring="transgender" style="--avatar-size:48px">
  <!-- ::before draws the RING: a 4px conic-gradient donut -->
  <div class="user-avatar__inner">              <!-- circle, overflow hidden -->
    <img class="user-avatar__photo" src="…" />  <!-- cover-fit, user-cropped -->
    <!-- OR the fallback when no photo: -->
    <!-- <span class="user-avatar__fallback" style="background:#00FFFF">T</span> -->
  </div>
  <!-- Chain ring only: 🔒 charm at bottom center -->
</div>
```

- Frame: `--avatar-size` (default 48px), `--ring-width: 4px`.
- Ring: drawn by `::before` as a **conic-gradient of the actual flag colors**.
  The inner face shrinks by `2 × ring-width` so the ring frames, never overlaps.
- Face: `photoUrl` (object-fit cover; pan/zoom crop stored per-user as
  `avatarCrop`). No photo → first initial of displayName/username, black text,
  on a neon chip chosen by `avatarChoice` (1–6): cyan `#00FFFF`, magenta
  `#FF00CC`, acid `#CCFF00`, violet `#8800FF`, orange `#FF6600`, white.
- Initial scales at `0.38 × size`; padlock charm at `0.18 × size`.

## The 18 rings

`none`, `rainbow`, `progress`, `lesbian`, `gay-men`, `bisexual`,
`transgender`, `nonbinary`, `pansexual`, `genderfluid`, `genderqueer`,
`intersex`, `asexual`, `aromantic`, `agender`, `leather`, `bear`, `chain`.

Each is a conic gradient of its real flag colors (see `index.css` ~line 3768).
`chain` is the one special case: metallic `repeating-conic-gradient` +
a 🔒 padlock charm element at the bottom of the circle.

## Rules

1. **Progress Pride is the default.** Unset/unknown ring values normalize to
   `progress`. `none` only renders when the user explicitly picked "No Ring" —
   and then the face fills 100% of the circle (no dead 4px gutter).
2. **The ring is identity, not status.** It's the user's own profile choice and
   follows them everywhere: nav trigger, dashboard pill, event-modal host row,
   talent lineup, attendance clusters, admin panels. Never repurpose ring
   colors to mean online/host/role — roles get separate chips (the HOST chip in
   the event modal is colored by the event's *day* color, independent of the ring).
3. **Masked = no ring.** Anonymous/masked attendance bubbles hide the ring with
   the rest of the identity.
4. **Calm mode keeps rings.** Glows/filters are stripped in calm mode, but flag
   rings remain — they're meaning, not decoration.
5. **Clusters stack.** Attendance clusters overlap avatars by ~−8px with a dark
   2px border (`#0b0b0b`) so faces read as a stack; count label follows
   ("12 going").
6. **Scale with the var.** Always size via `--avatar-size`; never scale the ring
   thickness independently or stretch the circle.
