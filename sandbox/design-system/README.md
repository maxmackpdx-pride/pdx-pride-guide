# Design System Sandbox (preview only)

Isolated preview of the Claude Design export. **Not wired to production routes** except `/design-preview` (dev/preview).

- `source/` — extracted zip (read-only reference)
- Ported components live in `client/src/sandbox/ds/`
- Preview page: `client/src/pages/DesignSystemSandbox.tsx`
- **Do not touch** `Avatar`, `UserAvatar`, `AvatarEditor`, or inbox avatar helpers

Open: `npm run dev` or `npm run preview:ds` → http://localhost:5000/design-preview

Nothing here ships to production except the `/design-preview` route (sandbox gallery only).