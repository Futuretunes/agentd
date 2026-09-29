# 2026-09-29 — Owned repository operations

- Author: Codex; overnight R2 continuation.
- Status: implemented; exact Linux and CI passed; not installed.
- Release: cumulative 0.36.0, task schema 2.
- Branch/base: `refactor/repository-operation-owner` from `refactor/dependency-operation-owner` at `2d2eb5e`.

## Changes

`repository-jobs.ts` extracts GitHub discovery/import/update, job status, cancellation, persistence and unregistered-import cleanup from the runner. It reuses the owned operation slot introduced for dependencies. The runner supplies existing admission, account-profile, project, title and audit callbacks. Same-project update protection and pending-review/task exclusions remain intact. The slot holds ownership until transport and cleanup settle, including shutdown; immediate cancellation records a cancelled job without invoking transport. Global operation compatibility and native authentication remain unchanged.

## Validation

14 focused repository, operation-slot and GitHub account fixtures passed and exercise unchanged import/update constraints and recovery, immediate cancellation with zero transport calls, retained admission during cancellation, and shutdown waiting for partial-import cleanup and cancellation persistence. Typecheck passed. Exact archive `06a8391e1a7fbfe6767fadf33c3cd6b168f7419c` passed 147/147 required Linux tests with zero skips, formatting and typecheck. SHA-256: `34c04365bf3230816ea9332e1a77758a92931d6f61cf70146c955b1d480556e0`. CI run 36502787757 passed; draft PR #40 is open. No live account consent, model requests, repository publication, deployment or retention cleanup.

## Deployment and rollback

Production remains 0.22.0/task schema 1; the single private cumulative launcher now targets the validated 0.36.0 archive and remains unexecuted. Launcher syntax and staged hashes are verified. Task schema stays 2; rollback requires matching application/task state with native credentials preserved separately.

## Limitations and next

R2 remains partial: publication/feedback, task/check execution and account coordination still need decomposition. This structural change does not claim atomic Git/filesystem/SQLite publication or retry-safe remote updates. Existing recovery handles interrupted imports; broader recovery and remaining synchronous Git paths stay under R10. Continue one domain at a time, preserving scoped approvals and cancellation ownership. Next: publication/feedback ownership or concrete dependency publication recovery before broader retention changes.
