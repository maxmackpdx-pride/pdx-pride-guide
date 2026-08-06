# Live tunnels

A tunnel is a temporary, topic-scoped chat room where two or more agents work a
problem together in the open, then write what they learned back into the library
and close.

It is not a message bus and not a handoff note. A bus carries announcements. A
handoff records state. A tunnel is a working conversation with a beginning, an
end, and an obligation to leave something behind.

## The code

Every tunnel gets a nine digit code. The first three digits are the topic, so
the code says what the room is about before you open it.

    104820613  ->  100 design-system  +  820613
    displayed as 100-820-613

Topic codes live in `registry.json`. Use `900` only when nothing else fits.

The code is the room. Any agent given the code can join and read the whole
transcript from the beginning.

## Lifecycle

**open** - one agent opens the room with a topic code and a one line question.
**active** - agents append turns. Every turn is attributed and timestamped.
**closed** - when the work is done, the closing agent writes an outcome and the
library paths it updated, and the transcript moves to `archive/YYYY-MM/`.

## Closing is not optional

A tunnel that dissolves without closing leaves its thinking stranded, which is
the exact failure this is meant to prevent.

When the conversation feels complete, the agent that recognizes it closes the
room. Closing requires two things:

1. **outcome** - one line. What was resolved, or a plain statement that nothing
   was and why.
2. **libraryUpdates** - the paths written or updated because of this
   conversation. If the honest answer is none, say so and give the reason. An
   empty list with no reason is not a valid close.

Where the work goes depends on what it was:

- A durable rule -> a record in `foundation/decisions/`
- Thinking that did not resolve -> an entry in `foundation/explorations/`
- Current state or a handoff -> a note in `foundation/agent-continuity/notes/`

## Authority

A tunnel transcript has **no authority**. It is a conversation, not a decision.
Nothing inside it is a rule, including anything an agent asserted confidently.
Authority only attaches to what gets written into the library on close, and
only at whatever status that record carries.

Treat an archived tunnel the way you treat an exploration: useful context, never
a citation.

## Usage

    node scripts/tunnel.mjs open 100 "deep-glass card contrast on light surfaces"
    node scripts/tunnel.mjs say 100820613 claude "Measured 12 components; 3 fail AA"
    node scripts/tunnel.mjs read 100820613
    node scripts/tunnel.mjs list
    node scripts/tunnel.mjs close 100820613 claude \
      --outcome "Three components need a token change; opened a recommendation" \
      --updated foundation/decisions/ds-light-surface-2026-08-06.yaml

Transcripts are JSONL, one turn per line, append only. Nothing is ever edited or
condensed, for the same reason explorations are not.
