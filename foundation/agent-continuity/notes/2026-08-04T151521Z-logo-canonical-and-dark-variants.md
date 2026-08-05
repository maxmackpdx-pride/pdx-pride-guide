---
schemaVersion: 1
noteId: 2026-08-04T151521Z-logo-canonical-and-dark-variants
generatedAt: 2026-08-04T15:15:21Z
ownerRole: design-drift-auditor
visibility: internal-shareable
status: current
supersedes: null
---

# Logo library update: dark variants folded in; canonical THE HAUZ and ZAYDARK chosen

## What changed
- [founder direction] Tucker chose the existing dark (on-black) versions as canonical: the-hauz-candidate.svg for THE HAUZ and zaydark-normalized-candidate.svg for ZAYDARK.
- [decision] The two newer candidates were superseded, not deleted: THE-HAUZ-Corner-Candidate.svg and zaydark-display-finish-pixel-locked.svg moved to assets/_superseded/ in the zay-logo-design skill.
- [implemented-locally] Folded 12 new dark/on-black variants into assets/dark-variants/ (full on-black family, THE HAUZ corner on black, solid white-on-dark ZAYLIST wordmark). 14 incoming light SVGs and both PNGs were byte-identical to existing assets and skipped.
- [implemented-locally] SKILL.md now documents assets/dark-variants/.

## Why it matters
Keeps one canonical mark per name and records the supersede so a future audit can see when and why, rather than reading it as accidental drift.

## Provenance
- Source of new assets: connected desktop folder "Important logo info" (2026-08-04).
- Actor: Claude, on Tucker explicit direction.
- Repackaged installable skill delivered the same session.

## Drift-audit and change-log discipline
On future drift: check this log and git history for when and why, classify intentional (update canonical) versus accidental (correct to standard), then log the resolution. Applies to every chat and every auditor.

## Next action
- Owner: Tucker / Codex
- Action: commit the skill asset changes and this note; optionally promote the drift-audit protocol into foundation/decisions/design-system.yaml.
- Approval required: promoting the protocol into the Foundation is a durable rule needing Tucker approval.
