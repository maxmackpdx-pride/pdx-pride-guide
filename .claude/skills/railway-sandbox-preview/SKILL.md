---
name: railway-sandbox-preview
description: Create and retire temporary Railway Sandbox previews for Zaylist when Tucker asks to stage work, test on a phone or Safari, or provide a demo URL. Do not use for production deployment or Railway outages.
---

# Railway Sandbox Preview

## Purpose

Use this skill when Tucker asks to **stage this**, test work on a phone or Safari, or
provide a demo URL. The canonical remote preview is a temporary Railway Sandbox in the
existing `pdx-pride-guide` project.

This skill is not for production deployment or Railway outages. Use the separate
`railway-break-glass` skill only when Railway is down, restricted, or otherwise meets
that skill's stated incident conditions.

## Fixed project identity

- project: `pdx-pride-guide` (`13064cbe-e2d7-41cd-a028-fa957d0c9167`)
- production environment: `production` (`8ab787f3-f5ee-4713-9845-bd17dd30ad08`)
- production service: `pdx-pride-guide` (`c87eff12-aee2-4af2-8fd9-7f42b67c3ba3`)
- production volume: `pdx-pride-guide-volume`
  (`d824af22-9a4b-4e1f-8f76-8be45f93886b`) at `/data`

The old Railway `staging` environment
(`d10b5732-c324-46bc-b557-ac2cc626d4f0`) was torn down. Never wake or recreate it.

## Preview requirements

- Create a Railway Sandbox in the existing project, not another environment or
  always-on service.
- Give it a public HTTPS URL that Tucker can open on a phone or in Safari.
- Use no more than 2 GB and set the idle timeout to about 15 minutes.
- Attach no persistent volume. Never attach or copy production `/data`.
- Attach no `zaylist.com` or `prideguidepdx.com` DNS.
- Do not substitute a hidden production route such as `/hauz-map-sandbox`, a zip, or a
  second always-on Railway service.
- Keep the preview isolated from production. A sandbox must never become the production
  deployment path.

## Cost gate

Railway Sandboxes cost about $50/GB-month while the VM exists. Workspace compute was
$45.12 of the $60 cap on 2026-09-19.

Check current workspace spend before creating the sandbox. If creating or retaining it
would risk the $60 cap, stop and tell Tucker before creating or continuing it. Never
leave the sandbox running after the preview is no longer needed.

## Completion

Return the public HTTPS preview URL and state that the preview is a temporary Railway
Sandbox. Destroy it when Tucker says done, then confirm it has been destroyed. Do not
push production unless Tucker separately authorizes **push**, **ship**, **deploy**, or
**go live**.
