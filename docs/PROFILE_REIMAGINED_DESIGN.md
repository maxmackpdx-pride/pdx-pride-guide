# Profile Reimagined design map (3a)

Source: `Profile Reimagined.dc.html` (mobile 390 / desktop 1000). See also package under Downloads.

## Panel order
1. Banner + flag-glow avatar (`UserAvatar`)
2. Identity (name, verified, PROMOTER/ADMIN stickers, @handle, pronouns, meta)
3. Bio + Follow / Message
4. Stat strip: Followers · Hosting · Attended · Going
5. Hosting (full width, Up Next / Past Events rails)
6. Desktop split (`≥900px`, `1.35fr 1fr`):
   - Left: The Big One, Past Events
   - Right: Going, Updates
7. Close seam (mantra + profile URL)

## Hard rules
- Day colors via `--day-*` only
- No em dashes
- Glow avatar = real `UserAvatar` only
- Live data via `normalizePublicProfile` from `GET /api/users/:username`
