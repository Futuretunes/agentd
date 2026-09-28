# 2026-09-28 — Resource limits and safe retention

- Author: Codex.
- Request: resource limits and safe retention for task logs, worktrees and backups; continue backlog without waiting for intermediate installations.
- Status: implemented and exact-archive Linux/CI verified; not installed.
- Draft PR: [#26](https://github.com/Futuretunes/agentd/pull/26).
- Tested source: `053ff6e5e2ded30a43d3452034f503e567124b39`; archive SHA-256 `4f88953919c42c25c16eaba34c25fff9cba61642a53e7586742f2768c2288dbb`.
- Release: 0.23.0 candidate, task schema remains 1.
- Branch/base: `feat/resource-retention` from installed gateway branch `09ba7d6`.

## Changes

`src/resources.ts` provides bounded combined output, saved-answer caps, free-space admission, checkout size/count preflight, monitored worktree growth and actual cgroup reporting. `runner.ts` wires both tasks and checks, preserving failed edit worktrees. `src/retention.ts` implements owner-bound, inventory-bound, approval-gated cleanup of old archived successful read-only runs and discarded edits. Activity offers a storage preview/confirmation; answers/history, unresolved/committed edits, recovery work and unfamiliar/linked paths stay protected.

`scripts/apply_resources.py` is the root-only, rollback-capable standard service resource profile transition. `scripts/update.py` fingerprints the new profile only after migration, preserving old baseline compatibility. `scripts/backup_retention.py` bounds new backups and prunes only aged, marked successful backups while retaining newest three, pins and all unknown/configuration/failed backups. No live deletion has occurred.

Read `docs/resource-retention.md` before reviewing or installing: cgroups are service-wide; the 1 GiB worktree guard can overshoot and is not a filesystem quota. Attachment/dependency retention and privileged GUI maintenance remain backlog work. No new web administrative authority exists.

## Validation

Local typecheck and full suite passed: initial 117 tests, 110 passed and seven Linux-only skips. Additional checkout preflight and GUI storage-auth regressions passed. Final exact-archive Linux run passed 118/118 tests with zero skips. CI run `36475776972` passed all jobs. Python fixtures cover kernel-property verification, failed migration rollback, backup pinning/age/newest-copy protection, symlink handling and pending recovery refusal. No live provider requests, root migration or phone acceptance.

## Deployment and rollback

Installed production remains 0.22.0. Operator requested continued backlog work without intervening scripts; stage a cumulative tested release later. Ordinary application update precedes `apply_resources.py`. The migration verifies actual cgroup limits before recording its baseline, keeps a private configuration backup and retains `resources-pending.json` on failure. No native profiles are reverted. Do not adopt legacy backups automatically.

## Next

Linux validation and draft #26 are complete. Continue R7 explicit worker sandbox hardening with compatibility tests. Preserve procfs and supported adapter ceilings; Codex project tools remain disabled. Shared handover is required after each work item. R1 main baseline/protected CI and U1 no-check manual-review policy remain unresolved operator decisions.
