# Zaylist Agent Continuity Ledger

This directory is Zaylist's governed AI operating memory. It gives authorized agents a fast, structured way to recover current context, discover the right source, coordinate work, and preserve decision history without reading complete chats.

## Layout

- `latest.md`: index of the newest valid note from each agent role.
- `START_HERE.md`: mandatory fast-start route for every Zaylist agent.
- `current-context.json`: compact current truth, priorities, blockers, and handoffs.
- `manifest.json`: machine-readable routing, authority, freshness, and privacy contract.
- `events.jsonl`: append-only material-change stream.
- `conflicts.json`: unresolved contradictions that prevent silent assumptions.
- `notes/YYYY-MM-DDTHHMMSSZ-role-topic.md`: immutable notes.
- `context-packets/`: task-specific, minimum-necessary context bundles.
- `schemas/`: validation contracts for notes, context, events, and packets.
- `templates/note.md`: required note format.
- `templates/conversation-checkpoint.md`: short periodic chat checkpoint.

## Write rules

1. Create a new timestamped note; never overwrite another agent's note.
2. Update `latest.md` only after the new note is complete.
3. Keep notes short enough to scan in one sitting.
4. Link to sources instead of copying full chats or canonical documents.
5. Label status and visibility for every material claim.
6. Never store secrets or credentials.
7. Keep `internal-nda-protected` material out of external services and public artifacts.
8. Archive and supersede; do not erase decision history.

## Required read order

1. `START_HERE.md`
2. `manifest.json`
3. `current-context.json`
4. Only the routed notes, decisions, canonical bundles, or packets needed for the task

Agents must not load the entire ledger by default. Minimum necessary context protects privacy, reduces cost, and makes stale or irrelevant material less likely to distort a decision.

## Periodic checkpoint

At the end of material Zaylist conversations, and during recurring agent runs, write a checkpoint when at least one of these changed:

- Tucker gave or corrected direction.
- A decision changed status.
- Production evidence changed.
- A campaign or audit created a new dependency.
- A blocker, unknown, or next action materially changed.

Do not create a note merely to report that nothing changed.

## Event contract

Append one JSON object to `events.jsonl` when a material event occurs. The event points to the durable note or decision; it does not duplicate sensitive content. Allowed event types are `direction_added`, `direction_corrected`, `decision_changed`, `evidence_changed`, `campaign_created`, `audit_completed`, `conflict_opened`, `conflict_resolved`, `blocker_changed`, and `handoff_changed`.

## Context packets

Before handing work to another agent, create a minimum-necessary packet containing the objective, relevant accepted facts, explicit unknowns, required sources, permissions, prohibited actions, expected output, and expiry condition. NDA-protected material receives its own packet and must never be mixed into a packet intended for external tools or public production.
