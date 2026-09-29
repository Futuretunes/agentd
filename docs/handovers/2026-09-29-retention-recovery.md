# 2026-09-29 — Approved retention recovery

- Author: Codex.
- Requested outcome: continue safe retention reconciliation in the final overnight window.
- Status: implemented; release validation pending; not installed.
- Release: cumulative 0.42.0, task schema 2.
- Branch/base: `fix/retention-reconciliation` from `feat/provider-usage` at `744a8c7`.

## Changes and relevant files

`src/retention.ts` recognizes an absent worktree only when its exact managed path has no filesystem entry (including dangling links), no Git registration, and an earlier cleanup-start audit. It offers metadata reconciliation in a fresh preview, not automatic retry or deletion. The existing archive/age/status protections still apply. Approval remains owner-bound, expiring and inventory-bound. After a crash, the in-memory approval is lost and a new explicit approval is necessary. The GUI labels reconciliation separately from removing an existing copy.

Each candidate is checked again after audit admission. Log truncation uses nonblocking/no-follow open and checks ordinary-file type, device/inode, link count, size and modification/change timestamps. Changes are preserved and reported incomplete rather than silently truncated.

## Validation evidence

Six new `test/retention-recovery.test.mjs` fixture tests cover SQL failure after removal, restart/fresh approval, no audit evidence, surviving registration, dangling link, recreated content and same-size log replacement. Local formatting/typecheck passed. The first combined fixture run hit the local execution sandbox's Unix-socket restriction in the existing runner resource test; rerun with socket access passed all 11 focused tests. Full exact Linux archive and CI validation pending. No live cleanup, model request, credentials or deployment were used.

## Deployment and rollback

Production remains 0.22.0/schema 1. The staged cumulative installer still targets validated 0.41.0 until this candidate passes required Linux and CI checks. No schema change beyond the existing cumulative schema 2. Rollback requires matching application/task state and preserves native credentials separately. Public source contains no private operator paths; staging details belong in the private operator note.

## Constraints and next steps

This is narrow reconciliation for already removed worktrees, not a transaction spanning Git/filesystem/SQLite. It does not prune registrations, recreate files, replay old approvals, delete on startup or widen eligibility. Uncertain leftovers require manual review. Git inspection/removal and inventory remain synchronous; attachment/dependency-cache retention and hard quotas remain separate backlog items. Finish validation and stage one cumulative candidate, then leave the shared handover before the overnight deadline. Continue R10 asynchronous review/integration paths in a later item. Claude review/consolidation remains pending; no main merge authorized.
