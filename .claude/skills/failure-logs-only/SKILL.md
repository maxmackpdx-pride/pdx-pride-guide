---
name: failure-logs-only
description: Read job logs only for a failed required check, or when the user asks why. Use before opening Actions logs, Railway logs, or a neighboring workflow. A green result does not get a log scrape.
---

# Failure logs only

Read a job log only when a required check failed, or when the user asked why.

- A green deploy or a green required check ends at the conclusion and the URL.
- Do not open the workflow next to it.
- Do not scrape logs to explain a success.
- On a failure, report that job URL and the failing step. Stop there unless they ask for more.
