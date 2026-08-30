# Railway Break-Glass Deployment Skill

## Purpose

This skill documents the temporary fallback deployment behavior observed on August 30, 2026, when the normal/manual Railway deployment trigger was unavailable but Railway's native GitHub integration still deployed `master` successfully.

This is **not** the normal Zaylist deployment path.

Use this only as a break-glass procedure when one of these conditions is true:

1. Railway billing is unpaid, restricted, or in a grace state and the normal manual/API deployment path is not authorized.
2. Railway's normal deployment trigger/API is down or unavailable.
3. The user explicitly says Railway is down or the Railway bill has not been paid and asks to ship anyway.

If none of those conditions is true, do **not** invoke this skill. Follow the normal production deploy rules in `AGENTS.md`.

## What we learned

A push to `master` currently has two independent Railway-related paths:

### Path A: custom GitHub Action

`master` push → `.github/workflows/railway-deploy.yml` → pre-ship checks → Railway GraphQL `serviceInstanceDeployV2`

Observed failure mode on 2026-08-30:

- build and `npm run ship` completed successfully
- the Railway GraphQL deployment mutation returned `Not Authorized`
- the GitHub Action failed after three retries

This path depends on the GitHub Actions secret `RAILWAY_PROJECT_TOKEN` and the configured Railway service/environment IDs.

### Path B: Railway native GitHub integration

`master` push → Railway's own connected GitHub source integration → Railway build/deploy → commit status posted back to GitHub

Observed on 2026-08-30:

- the same commit whose custom GitHub Action failed was independently deployed by Railway's native GitHub integration
- Railway posted a successful commit status back to GitHub for the production service/domain
- the live site showed the new commit

Therefore a failed custom GitHub Action does **not** by itself prove that production failed during a break-glass incident.

## Hard safety rules

1. **Never call this normal redundancy.** It is temporary fallback behavior.
2. **Never assume a failed GitHub Action means the site did not deploy.** Check the commit status posted by Railway and, when possible, the live site.
3. **Never assume a successful Git push means the site is live.** Confirm the native Railway commit/deployment status.
4. **Do not change Railway billing, credentials, service IDs, environment IDs, DNS, or deployment configuration as part of this skill unless the user explicitly asks.**
5. **Do not disable either deployment path while Railway is in the impaired/unpaid state.** The native integration may be the only path still functioning.
6. **Do not intentionally trigger repeated pushes just to force a deploy.** One clean `master` push is enough. Observe what Railway does.
7. **Do not describe Cloudflare as the mechanism for this fallback unless evidence shows Cloudflare performed the build/deploy.** The 2026-08-30 fallback was still a Railway deployment.
8. **Do not remove the custom GitHub Action during the incident.** Decide which path to keep only after Railway billing/service health has been restored and both paths can be tested deliberately.

## Break-glass procedure

### 1. Establish that the exception applies

Confirm at least one:

- Railway bill is unpaid/restricted
- Railway API/manual deploy is unavailable
- user explicitly says Railway is down

If this is not true, stop and use the normal deploy process.

### 2. Make the production change normally

- keep the change scoped
- run the normal pre-ship/build guards
- push the approved commit to `master`
- record the commit SHA

### 3. Observe both deployment paths separately

Do not collapse them into one status.

Check:

- GitHub Action result from `.github/workflows/railway-deploy.yml`
- Railway commit status attached directly to the commit
- Railway service/deployment target associated with that status
- live-site behavior or a safe live probe when available

### 4. Interpret outcomes

#### A. GitHub Action succeeds + Railway native status succeeds

Production is updated normally. Report the successful deployment.

#### B. GitHub Action fails with authorization/service issue + Railway native status succeeds

This is the break-glass success case.

Report clearly:

- custom/manual deploy path failed
- Railway native GitHub integration deployed the commit successfully
- live site was verified if verification was possible
- temporary fallback remains in effect

Do not call the broken custom path healthy.

#### C. GitHub Action fails + no Railway native success status

Do **not** claim production updated. Report the failed deployment and stop unless the user asks for further recovery work.

#### D. Railway native status succeeds but live site does not reflect commit

Treat this as a production verification failure. Investigate service/domain/cache routing before claiming success.

### 5. Preserve evidence

For an incident, record or cite:

- commit SHA
- GitHub Action run result
- Railway native commit status
- timestamp
- service/domain target
- live verification result

This prevents later confusion about which deployment mechanism actually succeeded.

## Recovery after Railway returns to normal

When billing/service access is restored, **do not immediately delete either path**.

On the next harmless production change:

1. run normal pre-ship checks
2. push one approved commit
3. observe both the custom GitHub Action and Railway native integration
4. confirm whether both attempt to deploy the same commit
5. confirm which one is intended to own production deployment
6. only then remove or disable the redundant trigger, with explicit user approval

The long-term target is one authoritative deployment mechanism plus one authoritative production status.

## Known 2026-08-30 evidence

The incident that created this skill showed:

- custom GitHub workflow built successfully
- its Railway GraphQL deployment call failed three times with `Not Authorized`
- Railway independently posted a successful production commit status for the exact same SHA shortly afterward
- the user confirmed the new roadmap was visible on the live site

Interpretation: Railway's native GitHub integration retained a functioning deployment path even though the custom project-token deployment path was not authorized.

## When to retire this skill

Retire or archive this skill when either:

- Railway is no longer part of the production architecture, or
- the deployment architecture has one intentional, tested fallback whose behavior is documented elsewhere.

Until then, this skill exists only for billing/service outages and must not become the everyday ship process.
