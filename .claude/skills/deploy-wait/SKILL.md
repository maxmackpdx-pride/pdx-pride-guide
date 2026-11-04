---
name: deploy-wait
description: Wait on CI or a Railway deploy with one check at the decision point. Use when a pull request, required check, or Deploy to Railway run is in flight. No polling and no pending status pings.
---

# Deploy wait

Use this whenever a deploy is waiting on GitHub checks or Railway. Usage is the constraint. Pending time is not a reason to keep looking.

## While it is pending

- Subscribe once, or take one status read, then stop.
- Do not poll Actions, Railway, or the live site.
- Do not send a status ping while the result is still pending.
- Do not investigate neighboring workflows, logs, or health output until the required result is in.

## At the decision point

- Read the required checks once.
- Merge only when those checks are green, and only if Tucker already asked for the merge. No force and no admin bypass.
- If a required check fails, report that job URL and stop. Do not retry the wait loop.
- After a requested merge, read Deploy to Railway once. Report the merge SHA and whether that workflow succeeded, failed, or is still running.
- If it is still running, subscribe once and stop. The next message is the result, not another check.
- One report, then stop. Do not keep narrating a finished deploy.
