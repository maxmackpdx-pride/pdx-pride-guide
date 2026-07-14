# Admin safety rails (PDX Pride Guide)

**Keep in mind for every admin / floating-inbox / catalog change.**  
Live Pride traffic, volunteer admins, shared queues, and public trust for events and safety.

Last captured: 2026-07-14 (session guidance).

---

## Do not do (or defer hard)

### 1. Bulk ops that hit production listings without a dry-run
**Damage:** Mass-hide/LIVE/delete events, wrong merge, wiped hosts during Pride week.  
**Why:** One bad select-all on All Events is irreversible community damage.  
**If ever:** Dry-run preview, max N, owner-only for harsh actions, undo window, no “send to queue” that auto-resolves.  
**Status:** Bulk hide/claimable exists with preview + confirm + max batch — do **not** expand to mass delete, mass LIVE, or mass submission approve without the same guards.

### 2. AI auto-flag / auto-reject / auto-approve
**Damage:** Wrong bans, killed gifting/MC posts, legal/trust blowups, biased moderation.  
**If ever:** Suggest-only, human confirm, no silent apply, log every suggestion.

### 3. Offline mode that queues admin approves/denies
**Damage:** Double-approve, offline deny, multi-admin conflict.  
**Prefer:** Offline **read** + draft notes only; mutations require online + fresh state.

### 4. Task assignment as “only assignee can act” without reclaim
**Damage:** Queue stuck when someone leaves/sleeps; Pride backlog freezes.  
**If ever:** Soft assignment + any admin can take over + stale reclaim after N hours.  
**Status:** Soft claim/takeover/release implemented — **never** make claims exclusive locks.

### 5. Multi-tab “realtime” that rewrites local UI from push without reconciliation
**Damage:** Lost reply text, flapping badges, wrong queue state, duplicate actions.  
**Prefer:** Invalidate queries / soft refresh; never clobber open composers.

### 6. Version history that rewrites live events from old snapshots
**Damage:** Flyer/time/venue regression mid-week.  
**If ever:** Diff + restore **draft**, not blind restore-to-LIVE; owner gate for restore.

### 7. Theme switcher (especially Light) without a full a11y pass
**Damage:** Unreadable neon-on-light, broken contrast.  
**Prefer:** Pride accent presets only until light theme is designed end-to-end.

### 8. Global search that surfaces PII to all admins
**Damage:** Email/phone leakage to broad admin cohort.  
**Guard:** Owner-only fields; search redaction; rate limit; audit sensitive hits.  
**Status:** Non-owner search redacts emails — keep it that way.

### 9. “Bulk send to shared queue” that duplicates or reopens resolved items
**Damage:** Queue noise, double work, members re-notified.  
**Default:** Don’t build until meaning is defined (flag vs re-open).

### 10. Custom keyboard shortcuts that steal browser / a11y shortcuts
**Damage:** Accessibility tools, password managers, `?` help, form typing.  
**Guard:** Only when focus is not in inputs; no override of Esc/Tab; reset escape hatch.

### 11. Quick Actions FAB stacking on floating inbox FAB
**Damage:** Mobile dead zones, can’t open inbox (SSOT).  
**Prefer:** Hub chrome / Overview / avatar / in-sheet drawer — one FAB max on mobile.

### 12. Expanding admin powers on env-listed / peer owners without gates
**Damage:** Team revoke, purge QA, user PII, push blast, catalog wipe.  
**Keep:** Owner desk / team / purge / push-test gates as today.

### 13. Logging into or messaging as the system guide account
**Damage:** Shared inbox compromised; personal/system boundary collapses.  
**Status:** Guide `@prideguidepdx` is locked — **do not reverse**.

### 14. Auto-migrate historical personal DMs into guide threads
**Damage:** Wrong parties, privacy mixups.  
**Prefer:** New messages only; optional manual “continue as Guide” later.

### 15. Reports Hub exports that dump full member/contact data
**Damage:** Spreadsheet leaks, Discord screenshots of PII.  
**Guard:** Role-gated, redacted defaults, download audit, short-lived URLs.

### 16. Calendar view that edits LIVE times casually
**Damage:** Wrong night listings.  
**Prefer:** Read-only calendar first; edits via existing admin edit + confirmation.

### 17. “View as public” that uses admin session cookies in a public window
**Damage:** Session confusion / thinking you’re anonymous when you’re not.  
**Prefer:** True public URL in new tab (or token without admin cookie).  
**Status:** VIEW PUBLIC uses real public URLs — keep it that way.

### 18. Push-driven multi-device “sync” that marks queue items resolved without UI confirm
**Damage:** Wrong-item actions while scrolling.  
**Push = notify + refresh only.**

### 19. Pinned MORE items stored only client-side as “source of truth”
**Damage:** Different pins per device; people think a queue is “gone.”  
**Pins = shortcuts only; never hide real queues.**

### 20. Anything that creates a second approval UI outside floating inbox
**Damage:** Split brain (approve in Overview, deny in sheet).  
**SSOT = floating inbox** — Overview is **read + jump only** (no Approve/Reject there).

### 21. Rate-unlimited admin message / guide blast
**Damage:** Accidental spam, push storms, cost spikes.  
**Status:** Soft rate limit on guide DMs — keep / tighten; multi-send needs confirm.

### 22. Concurrent agent / force-push / schema thrash during Pride
**Damage:** Lost work, thrash (already seen historically).  
Process risk — higher damage than half the UI list. No force-push master without ask.

---

## Build carefully (OK later, with design)

| Idea | Condition |
|------|-----------|
| Global search | Redacted PII, routes to queue, no auto-actions |
| Notification bell filters | Read/filter only |
| Overview widgets | Links into inbox, **no approve** on Overview |
| Activity log UI | Append-only, no rewrite history |
| Breadcrumbs / pins | Nav/shortcuts only; same chrome mobile/desktop |
| View as public | Real public URL |
| Pride accent themes | Accent only until full light theme |
| Soft task assignment | Reclaimable, not exclusive locks |
| Aggregate queue API | Read optimization only |

---

## Safer order of work (low damage first)

1. Path clarity + Messages → floating inbox Admin (no nav bar fork mobile/desktop)  
2. Overview/pulse **read** widgets → open inbox  
3. Search + activity **read** UIs with redaction  
4. Breadcrumbs / pins / naming (avatar dropdown + drawers fair game)  
5. Only then: bulk (with dry-run), soft assignment, calendar (read-only), reports (gated)  
6. Last or never without real design: offline mutations, AI auto-actions, hard locks, mass LIVE edits  

---

## Short answer

**Most dangerous:** bulk production edits without guards, AI auto-moderation, offline queue mutations, exclusive assignment locks, dual approval UIs, PII search/exports, blind version restore, second FAB covering inbox, loosening owner gates.

**Safest:** better paths, labels, read-only pulse/search/activity, Messages → floating inbox as the only queue entry.

---

## Product chrome rules (related)

- Mobile and desktop **nav / header / footer** should look the same at first glance.  
- **Avatar / logo dropdown** and **in-sheet drawers** are fair game.  
- Admin queue lives in **floating inbox** (open via Messages) — not a separate nav Queue tab.  
- Admin-facing tools are fair game; normal member/customer UI is not the place for queue power.
