# Agent onboarding

Read this once, fully, before your first change. It is the operating standard
for every model working on Zaylist. Nothing here is model-specific.

Written down because it was previously taught one conversation at a time, which
meant every new model relearned it and some of it was lost each time.

---

## 1. Where you are

One founder. One live platform at zaylist.com. Several AI models working the
same repo, often in the same week, sometimes the same hour.

That last part is why the rules below exist. Almost all of them are about not
destroying work you cannot see.

## 2. Front doors

- `README.md` - what this is, in plain language
- `AGENTS.md` - operational rules. Not optional
- `foundation/llms.txt` - index of everything governed
- `foundation/agent-continuity/START_HERE.md` - current state

## 3. The library has four floors

**`foundation/decisions/`** - one YAML record per durable decision. These are
the rules. Check `status` before applying: `accepted` and `current` are
authoritative; `recommendation`, `draft`, `queued`, and `deferred` are not;
`superseded` is history and must never be applied.

**`foundation/chapters/`** and the domain guides - longer explanations of how an
area works and why.

**`foundation/explorations/`** - raw session thinking, append-only, never
condensed. **Zero authority.** An idea recorded there is not a plan, even when
it sounds certain. When only an exploration covers a topic, the correct answer
is that no decision exists yet.

**`foundation/agent-continuity/`** - current state, handoff, tunnels.

### Authority order

1. Tucker's explicit decisions
2. Accepted records and the canonical Design System
3. Verified production evidence
4. Foundation recommendations
5. Research, prototypes, tunnels, and open questions

Production drift is not law. Something being live does not make it correct, and
you do not get to normalize it into a standard on your own.

## 4. Things that are easy to get wrong

**`implementation_state: not-implemented` is not shipped.** A record can be
`accepted` and unbuilt. Never describe a decision as live because it was made.

**Unknown stays unknown.** Do not resolve a gap by guessing. Label it
`deferred` or `unspecified` and say so.

**Never invent Foundation approval.** If a rule does not exist, say it does not
exist rather than inferring one from adjacent records.

**The divergence gate.** When implementation and the Foundation or Design System
disagree in a way that touches architecture, identity, navigation, permissions,
privacy, safety, accessibility, or a repeated pattern: stop and ask Tucker
whether it is a one-off exception, whether the code should return to the rule,
or whether the rule should change. Do not silently pick one. Fix obvious local
bugs against the existing standard without escalating.

**Corrections are appended, never edited in.** This applies to explorations,
tunnels, and notes. If you were wrong, add a new entry saying so. Do not rewrite
the old one.

## 5. Pushing is shipping

Railway auto-deploys every push to `master`. There is no staging gate.

- Confirm with Tucker before `git push`. Show the commit subject and files
- Never say the site is fixed while the change is local. Say "fixed locally,
  ready to push"
- After he confirms, push, then verify the deploy actually succeeded

**Stage deliberately.** `git add -A` in a repo with someone else's WIP in the
working tree will commit their unfinished work. This has already happened once.
Stage the specific paths you changed.

## 6. Release ids

Every governed area's `llms.txt` carries `Release: zaylist-<area>-YYYY-MM-DD.N`.
Change content in that area, move the id. CI enforces it via
`scripts/check-foundation-release.mjs`. Bump the trailing number, or roll the
date and reset to `.1`.

`foundation/agent-continuity/` is exempt. It is operational state, not a
published guide, and it changes every session.

A release id you have seen before is a guarantee that nothing in that area
moved. That is the whole point of it.

## 7. Claim before you touch

Run this before your first change, every session:

    node scripts/claim.mjs list
    node scripts/claim.mjs claim <you> "what you are doing" <path> [path...] --push

It shows what other agents have in flight and refuses your claim if it overlaps.
A conflicting claim is not a lock you may break. Open a tunnel and settle it.

Release when you are done: `node scripts/claim.mjs release <you> --push`

Route by cost, not by who noticed first. Grok is fastest and cheapest to
production, so urgent fixes and verification loops go to him. Claude is strong on
long-form reasoning and expensive per token, so governance writing and design
analysis go there. Codex takes multi-file implementation. Full table in
`foundation/decisions/agent-routing-2026-08-06.yaml`.

If a task is outside your lane, name it and leave it unclaimed rather than doing
it expensively.

## 8. Talking to each other

**Do not write pairwise handoff files.** `X_HANDOFF_FOR_Y.md` grows N by N and
nobody reads the one addressed to another model. The old ones are in
`docs/archive/handoffs/` for history.

**Use a tunnel** when two or more agents need to work a problem together:

    node scripts/tunnel.mjs open 210 "one line subject"
    node scripts/tunnel.mjs say <code> <you> "message" --push
    node scripts/tunnel.mjs read <code>

Nine digit code, first three digits are the topic. Anyone with the code reads
the whole transcript.

**Closing is required and enforced.** The tool refuses to close without an
outcome and the library paths you wrote. A tunnel that leaves nothing behind is
the failure the whole system exists to prevent.

**Nothing is ever deleted from a transcript**, including tests and scratch
turns. Mark a throwaway at write time with `--disposable` if you like; that
tags it and deletes nothing. Pruning is an owner decision, never automatic.

Transcripts carry no authority. Authority attaches only to what you write into
the library on close.

## 9. Paths

Absolute paths break every machine but one. That defeats the point of
cross-model continuity.

- `$ZAYLIST_REPO` - the local checkout of `maxmackpdx-pride/pdx-pride-guide`
- `$ZAYLIST_AUDITOR` - campaign and auditor workspace, deliberately **not** in
  this repo, living beside the checkout on disk

Doc links are repo-relative. Runtime working directories use the variables. Never
write a path starting with `/Users/`.

## 10. Design

The canonical Design System is the visual and interaction authority. The
Foundation records why it exists and where its boundaries are. Do not duplicate
its CSS or component code into the Foundation, and do not invent colors, type,
radii, spacing, or components anywhere.

## 11. Acknowledge it

When you have read this, record it:

    node scripts/ack.mjs ack <you> --push
    node scripts/ack.mjs status

The acknowledgement is keyed to a content hash of this file, not a version
number someone has to remember to bump. Any edit here makes every prior
acknowledgement stale automatically, and `status` exits 1 while anyone is behind.

Stale means the document changed after you read it. Re-read and acknowledge
again. It is not a formality: the whole point of writing this down was that
operating knowledge kept decaying quietly, and an unread update decays the same
way.

## 12. The solo founder test

Before recommending anything, ask whether one person can understand, recover,
afford, and explain it six months from now. If not, it is the wrong
recommendation regardless of how good it is.
