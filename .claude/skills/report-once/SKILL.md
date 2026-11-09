---
name: report-once
description: Cursor only. Stop after the asked result is reported. Use when a task result, merge SHA, or deploy outcome is already in the chat. No second confirmation, log appendix, or extra watch.
---

# Report once

This skill's usage limits apply only to Cursor. Other agents follow their normal
workflow and the shared rules in `AGENTS.md`.

When the result the user asked for is already in the chat, stop.

- Do not send a second confirmation of the same SHA, check, or deploy.
- Do not add a log appendix, a sibling-workflow note, or a recap.
- Do not keep watching unless the user asked to hear a later event.
- A later notification that repeats a result you already reported gets no message.
