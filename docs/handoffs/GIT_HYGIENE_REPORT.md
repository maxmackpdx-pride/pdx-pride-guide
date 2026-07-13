# Git Hygiene Report

**Repo:** `pdx-pride-guide`  
**Date:** 2026-07-13  
**Base ref:** `origin/master` @ `88bd634` (`fix(nav): put Hub left of desktop seam, seam mid-gap to avatar`)  
**Agent scope:** inventory stashes and branches; drop only data.db-only stashes; delete only fully merged feature branches (merge-base ancestor of `origin/master`). No force-push. No application source changes beyond this report.

**Working tree note:** After cleanup the repo is on `master`. Unrelated unstaged profile WIP was present at report time (`GoingRail.tsx`, `ProfileEventRail.*`, `MemberProfile.tsx`, untracked `mapAttendancePreviewToChips.ts`). That work was not created or modified by this hygiene pass; it was left untouched.

---

## 1. Stash inventory

Fourteen stashes existed at start. Six pure `data.db` stashes were dropped. Eight remain for human review.

### 1.1 Dropped (SAFE TO DROP)

| Original index | Message | Why dropped |
|---|---|---|
| stash@{2} | On claude/website-management-b6317h: local data.db | Only `data.db` binary |
| stash@{4} | On master: data.db local | Only `data.db` binary |
| stash@{6} | On master: wip | Only `data.db` binary |
| stash@{7} | On master: wip | Only `data.db` binary |
| stash@{8} | On feat/public-profile-redesign: data.db | Only `data.db` binary |
| stash@{13} | On master: local data.db | Only `data.db` binary |

### 1.2 Remaining stashes (reindexed after drops)

| New index | Message | Files (summary) | Classification | Notes for human |
|---|---|---|---|---|
| stash@{0} | On master: wip-before-profile-reimagined | 17 files: Events page/CSS, placeholders SVG id rename, `shared/eventPoster.ts`, SEO, push templates, `data.db` (+190/-48) | **REVIEW** | Profile redesign and day-aware posters largely shipped on master (`resolveEventPosterUrl` + day placeholders). Stash may still hold Events UX / SVG / SEO deltas vs current tip. Diff against master before applying. |
| stash@{1} | On master: WIP non-feed | 30 files: FloatingInbox, InboxOverlay, InboxSheetContext, HubPeople/Post/Profile, nude beaches server/shared, Nav, `data.db` (+995/-480) | **REVIEW** | Large pre-merge WIP. Much of inbox sheet / hub nav later landed via other branches. Treat as archaeology; do not bulk-apply. |
| stash@{2} | On master: wip deploy | 13 files: early FloatingInbox + panel views (Posts/Queue/Stats), `floatingInboxPosition`, storage churn, `data.db` (+1915/-71) | **REVIEW** | Looks like first Floating Inbox scaffold. Master already has production FloatingInbox and related UI. Likely superseded; keep only if you need historical panel experiments. |
| stash@{3} | On master: wip | 5 files: Admin metrics labels ("Live listings"), Schedule small edits (+30/-12) | **REVIEW** | Copy tweak only: "Live events" to "Live listings". Not on master today (`AdminMetricsPanel` still says "Live events (excl. placeholders)"). Safe small apply if product wants that wording. |
| stash@{4} | On master: motion remaining: sparks avatar schedule | 8 files: AttendanceCluster sparks, RailCard, UserAvatar, Schedule, index.css (+100/-7) | **REVIEW** | Core RsvpSparks / LiveWave already on master (`AttendanceCluster`, `RailCard`, `HomeUpNext`). Stash may hold leftover motion CSS / Schedule wiring not fully ported. Cherry-pick by file, do not apply whole stash. |
| stash@{5} | On feat/motion-add-ons: footer folders | Footer.tsx + index.css (+176/-44) | **REVIEW** | Footer folders structure already on master (`FOOTER_FOLDERS`). Stash is older folder link set (missing Nude Beaches / different Spotted label). Prefer master Footer; only mine if a specific link is missing. |
| stash@{6} | On master: wip local | `shared/boardModeration.ts` only (+3/-8) | **KEEP** | Policy WIP: rewrites Pride Werk rules to allow sensual/erotic massage as paid work; removes several banned terms. **Not on master** (master still PG-13 and bans "sensual massage" / "erotic massage"). Product/legal decision required before apply. |
| stash@{7} | On master: pre-schedule-redesign-handoff | `.DS_Store`, Home.tsx one-line label, `data.db` | **REVIEW** | Label idea: "Spots" to "LGBTQ+IA Businesses". Home layout has moved on; path may not apply cleanly. Mostly junk + one copy idea. |

### 1.3 Stash actions taken

- Dropped 6 data.db-only stashes (listed above).
- Did **not** apply or drop any code-bearing stash.
- Did **not** create separate patch export files (notes live in this table). To export a stash later:  
  `git stash show -p stash@{N} > /tmp/stash-N.patch`

---

## 2. Branch inventory

Merge test: `git merge-base --is-ancestor <branch> origin/master`.

### 2.1 Local branches (after cleanup)

| Branch | Tip date | Tip subject | Merged into origin/master? | Purpose guess | Action |
|---|---|---|---|---|---|
| `master` | 2026-07-13 | fix(nav): Hub left of desktop seam | yes (is master) | Production line | **Kept** (current checkout) |
| `feat/public-profile-redesign` | 2026-07-09 | Add first-party traffic analytics for admin Stats | **no** (ahead 4, behind 223) | Earlier public profile redesign + analytics | **Kept** (unmerged) |
| `feat/schedule-redesign` | 2026-07-08 | Name the day in the events panel quiet state | **no** (ahead 5, behind 328) | Schedule flyer rails / timeline redesign | **Kept** (tracks origin) |

### 2.2 Local branches deleted (fully merged)

| Branch | Was tip | Why deleted |
|---|---|---|
| `feature/profile-reimagined` | `0ce6cb4` | Merged via PR #12 |
| `fix/qa-p0-going-public` | `79f5dbb` | Merged via PR #13 / master |
| `feat/motion-add-ons` | `6198f71` | Motion work on master |
| `redesign/hub-shell` | `2fc68eb` | Hub redesign on master |
| `redesign/promoter-makeover` | `5d5b26e` | Promoter redesign on master |
| `redesign/promoter-submit-hub` | `4535549` | Older promoter/schedule wiring on master |
| `feat/profile-replies-facepile-cleanup` | `88bd634` | Same tip as master (no unique commits) |
| `claude/website-management-b6317h` | `0353092` | Local tip fully merged (was behind remote Claud branch) |

### 2.3 Remote branches remaining

| Branch | Tip date | Merged? | Purpose guess | Recommendation |
|---|---|---|---|---|
| `origin/master` | 2026-07-13 | n/a | Deploy / mainline | **Keep** |
| `origin/main` | 2026-07-11 | **no** (1 unique: Bowery Bagels logo PNG) | Secondary default-ish branch; diverged | **REVIEW**: either merge logo commit into master or delete after cherry-pick. Do not force-delete without checking deploys. |
| `origin/backup-before-build-20260626` | 2026-06-26 | yes (ancestor) | Safety backup | **Keep forever** |
| `origin/backup/pre-seo-2026-06-29` | 2026-06-29 | yes (ancestor) | Pre-SEO backup | **Keep forever** |
| `origin/feat/public-profile-redesign` | 2026-07-09 | **no** (ahead 2) | Older profile redesign + admin stats wiring | **REVIEW**: superseded by profile-reimagined on master for profile UI; may still hold unique analytics commit. Diff `origin/master..origin/feat/public-profile-redesign` before delete. |
| `origin/feat/schedule-redesign` | 2026-07-08 | **no** (ahead 5) | Schedule redesign stack | **REVIEW / KEEP** until schedule work is explicitly abandoned or rebased |
| `origin/feat/inbox-posts-edit-deeplinks` | 2026-07-10 | **no** (ahead 2) | Inbox Posts EDIT deep links (Phase 2) | **REVIEW**: may overlap inbox work already on master; verify before delete |
| `origin/feat/inbox-sheet-provider` | 2026-07-10 | **no** (ahead 3) | InboxSheetProvider lift (Phase 3) | **REVIEW**: floating inbox on master may supersede; verify unique commits |
| `origin/claude/website-management-b6317h` | 2026-07-13 | yes | Claud long-running agent branch (recent PWA Android how-to) | **REVIEW**: fully merged but still used as Claud workspace; leave unless Claud is retired |
| `origin/claude/quirky-planck-7puhu9` | 2026-06-30 | yes | Old Claud session | **REVIEW**: safe to delete if no one needs the name |
| `origin/claude/test-write-access` | 2026-06-22 | yes | Write-access probe / DNS notes | **REVIEW**: almost certainly deletable |

### 2.4 Remote branches deleted (fully merged feature work)

| Branch | Was tip | Proof |
|---|---|---|
| `origin/feature/profile-reimagined` | `0ce6cb4` | Ancestor of master; PR #12 merged |
| `origin/fix/qa-p0-going-public` | `79f5dbb` | Ancestor of master |
| `origin/feat/motion-add-ons` | `6198f71` | Ancestor of master |
| `origin/redesign/hub-shell` | `2fc68eb` | Ancestor of master |
| `origin/redesign/promoter-makeover` | `5d5b26e` | Ancestor of master |
| `origin/redesign/promoter-submit-hub` | `4535549` | Ancestor of master |
| `origin/feat/inbox-phase-4` | `96fa21b` | Ancestor of master (Phase 4 complete on mainline) |

Delete method: `git merge-base --is-ancestor origin/<branch> origin/master` then `git push origin --delete <branch>`.

### 2.5 Intentionally not deleted

- All `backup*` / `backup/*` remotes
- `origin/master`, `origin/main`
- Any branch with unique commits vs master
- Fully merged `origin/claude/*` (agent workspace names; human call)

---

## 3. Actions summary

### Done

1. `git fetch --prune origin` (also observed `origin/feat/schedule-redesign-v2` already gone on remote)
2. Dropped 6 data.db-only stashes
3. Deleted 8 local fully-merged branches
4. Deleted 7 remote fully-merged feature branches via `git push origin --delete`
5. Left checkout on `master` @ `88bd634` tracking `origin/master`
6. Wrote this report

### Not done (human review)

| Item | Why |
|---|---|
| stash@{0}..@{5}, stash@{7} | Code or unclear uniqueness vs master |
| stash@{6} boardModeration | Policy change; product decision |
| `feat/public-profile-redesign` (local+remote) | Unmerged commits |
| `feat/schedule-redesign` (local+remote) | Unmerged schedule stack |
| `origin/feat/inbox-posts-edit-deeplinks` | Unmerged |
| `origin/feat/inbox-sheet-provider` | Unmerged |
| `origin/main` | 1 unique logo commit |
| `origin/claude/*` | Merged but leave agent remotes |
| Backup branches | Protected by policy |
| Unstaged profile WIP on working tree | Outside hygiene scope |

---

## 4. Suggested next human steps

1. **Policy:** Open stash@{6} (`boardModeration`) in a side branch if Pride Werk rules should allow paid sensual/erotic massage; otherwise drop it deliberately.
2. **Copy:** If "Live listings" wording is wanted, re-implement from stash@{3} against current admin components (file paths changed).
3. **Orphan branches:** Diff unmerged remotes and either revive or delete:
   ```bash
   git log --oneline origin/master..origin/feat/schedule-redesign
   git log --oneline origin/master..origin/feat/public-profile-redesign
   git log --oneline origin/master..origin/feat/inbox-sheet-provider
   git log --oneline origin/master..origin/feat/inbox-posts-edit-deeplinks
   git log --oneline origin/master..origin/main
   ```
4. **origin/main:** Cherry-pick `e8fc841` (Bowery Bagels logo) onto master if still needed, then decide whether `main` should track `master` or be removed from the default branch list on GitHub.
5. **Stash cleanup later:** After reviewing, `git stash drop` any REVIEW stashes confirmed superseded (especially @{2} deploy scaffold and @{5} footer folders).
6. **Working tree:** Commit or stash the current profile rail WIP before starting unrelated work.

---

## 5. Safety checklist

| Rule | Result |
|---|---|
| No force-push master | Observed |
| No delete of origin/master or origin/main | Observed |
| No delete of backup branches | Observed |
| Remote deletes only when fully merged into origin/master | Observed (7 branches) |
| Stash drops only data.db-only | Observed (6 stashes) |
| Application source unchanged by hygiene | Report only; pre-existing dirty profile files left as-is |

---

*End of report.*
