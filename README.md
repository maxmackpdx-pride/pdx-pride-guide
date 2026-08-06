# Zaylist

Portland's queer platform. Events, places, housing, gigs, and the things that
happen after. Live at [zaylist.com](https://www.zaylist.com).

Built and owned by one person. Worked on with several AI models. That second
part is why this repo is organized the way it is.

---

## How the library works

Think of this repo as a building with four floors. Each floor holds a different
kind of writing, and they are never mixed up.

**Floor 1 — the decisions.** `foundation/decisions/`
One file per decision. Why it was made, what was chosen, what got rejected, and
what it costs. These are the rules. When something has a decision record, that
is the answer, and nobody gets to quietly disagree with it.

**Floor 2 — the explanations.** `foundation/chapters/` and the guides in
`foundation/tech-stack/`, `foundation/trust-safety/`
Longer writing about how a whole area works and why. Decisions tell you the
rule; chapters teach you the thinking.

**Floor 3 — the notebook.** `foundation/explorations/`
Raw thinking from working sessions, written down and never trimmed. Half-formed
ideas, things deliberately put off, things rejected and the reason why. This
floor has zero authority. Nothing here is a rule, even when it sounds
confident. It exists because good ideas used to get lost when a long
conversation got summarized down to its conclusions.

**Floor 4 — the day-to-day.** `foundation/agent-continuity/`
Where things stand right now. What changed, who did it, what is next. This is
the handoff note between working sessions, not a rulebook.

### The one rule that ties it together

**Higher floors never overrule lower ones.** A note cannot overturn a decision.
An idea in the notebook is not a plan. Something built in production does not
become correct just because it shipped. The order is:

1. Tucker's explicit decisions
2. Accepted records and the canonical Design System
3. Verified production evidence
4. Recommendations
5. Research, prototypes, and open questions

### Why every file says what it is

Every decision record carries a `status` and an `implementation_state`. A
record can say `accepted` but `not-implemented`, which means the choice is
made and the code has not caught up. Those are different things and the files
never blur them. `unknown` stays `unknown` rather than being guessed at.

### Why the version numbers matter

Each governed area has an `llms.txt` with a `Release:` id. If the content
changes, that id has to change too. CI enforces it. Without that, an AI could
be working from a copy it read last week with no way to tell it went stale.

---

## Start here

| You are | Read |
|---|---|
| A person | This file, then `foundation/chapters/` |
| Any AI agent | `AGENTS.md`, then `foundation/llms.txt` |
| Claude specifically | `CLAUDE.md` (it defers to `AGENTS.md`) |
| Looking for current state | `foundation/agent-continuity/START_HERE.md` |

## Where things live

- `client/` — React frontend
- `server/` — API and ingest
- `shared/` — types shared by both
- `design-system/` and `client/src/components/ds/` — the visual authority
- `foundation/` — decisions, chapters, explorations, continuity
- `docs/` — standards, guardrails, archive
- `scripts/` and `script/` — tooling and validation

## Deploying

Railway auto-deploys on every push to `master`. Pushing is shipping. Operational
rules are in `AGENTS.md` and are not optional.
