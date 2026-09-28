# 2026-09-28 — Exact-tree checks and Linux isolation CI

- Author: Codex.
- Request: after implementing the UI redesign, follow the backlog.
- Status: implemented and tested in an isolated candidate; not installed.
- Candidate: 0.20.0, alongside the UI redesign (`3452c80`, formatting `b8d670a`).
- Branch: `feat/task-desk-redesign`, based on the consolidated review line. No main merge or stack closure.

## Changes

R4: `checkSnapshot` materializes a fresh detached worktree from the exact approved Git tree. It never copies ignored files, attachments or later worktree content. Dependency fingerprints are checked against that materialization. Check processes use it as cwd and sandbox mount, then remove it on completion/failure/cancellation. Original worktree re-hashing remains a stale-content safeguard.

Checks now carry `input: git-tree-v1`. Earlier passing results become stale on startup and cannot authorize a commit/publication. The GUI offers Recheck committed files for historical commits; only an exact match to the committed tree is accepted, without rewriting the commit or weakening publication approval. Already published remote history is not changed.

R11: an explicit Linux isolation CI job runs all tests with real boundaries; the wrapper fails on skipped tests or missing completion. Namespace policy adjustment is confined to the disposable GitHub-hosted runner, never the agentd host. Making this job a protected-branch required status is still a repository-administration follow-up; the workflow alone cannot configure branch protection.

The fixed R4 defect demonstration was retired from the old review reproducer and replaced with desired-behavior regressions. Other unresolved diagnostic cases remain. UI behavior is documented in the separate redesign handover.

## Validation

Final staged Linux candidate: TypeScript passed; 99 tests passed, 0 failed, 0 skipped using `node scripts/test-isolation-ci.mjs`. No production services or host settings changed. Real Linux isolation covers hidden host data, protected Git metadata, denied direct network, provider proxy boundaries and the ignored-file check regression. New cases also cover approved versus later files, attachment exclusion, cleanup after failure/cancellation, legacy evidence invalidation and committed-file rechecks.

An initial archive accidentally carried macOS metadata files discovered as tests; packaging was corrected and the final suite passed. Fresh archives exclude those files. No model calls or real account consent were submitted. GitHub-hosted CI status is distinct from this VM result and must be checked on the PR.

## Deployment and rollback

Operator-specific candidate and rollback-capable update script are staged outside the public repository. The installer backs up the prior application/state, runs tests under the service boundary and rolls back on failure. It preserves native profiles, renewal journal, access key and unit hardening. A privileged operator must run it; no credentials are requested here.

Rollback restores old check records with the old application, so the historical R4 weakness also returns. Do not treat rollback as retaining this fix. Abrupt power loss can leave a temporary check worktree registration; general crash/storage cleanup remains backlog work.

## Next steps

1. Claude: review the redesign and exact-tree proof, especially stdout/log separation, UI security, provenance invalidation and committed-file rechecking.
2. Operator: install/accept the candidate; test phone keyboard and screen-reader behavior. No full WCAG certification is claimed.
3. Resolve R1 release baseline/merge strategy and protected-branch CI enforcement; next engineering work is tracked reproducible deployment/schema migrations (R3/R9), then boundary/resource work. Frontend formatting is complete; backend modularization remains R2.
4. Preserve U1: no manual-review waiver or commit without checks. Broader check profiles, binary/large-diff backend improvements and remaining live provider/publication acceptance remain open.
