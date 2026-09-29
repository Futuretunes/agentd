# 2026-09-29 — Atomic dependency publication and conservative recovery

- Author: Codex; overnight R10/R6 corrective work after domain extraction.
- Status: implemented, exact Linux and CI passed; not installed.
- Release: cumulative 0.37.0, task schema 2.
- Branch/base: `fix/dependency-publication-recovery` from `refactor/repository-operation-owner` at `b5674e7`.

## Verified problem and change

Dependency success previously updated the project's selected dependency path before separately marking the job successful. A failure between writes could leave a project referencing files removed by failure/startup cleanup. `dependency-recovery.ts` now publishes project metadata and job success in one immediate SQLite transaction, checking project/job identity, running state and manifest fingerprint before commit. A failed second write rolls back the project change.

Both failure cleanup and runner startup use reference-aware stage removal. Only a well-formed managed job directory is considered; linked stages are preserved. Any project reference overlapping the directory (including resolved aliases/ancestors) prevents removal. Unresolvable references preserve candidates rather than guessing. Existing interrupted job markers are not rewritten into success. No schema change or expanded agent access.

## Validation

Fault injection aborts the job-success SQL write and verifies the old dependency files/path remain usable, the failed stage is removed and the job records failure. Stale-job publication is refused transactionally. Cleanup fixtures cover aliases, linked stages, missing references, invalid IDs and safe unreferenced removal. Runner restart with a simulated legacy partial publication preserves referenced files and retains the interrupted marker. Exact archive `6463492ce935860a9920d7289914f6c4397251b1` passed 151/151 required Linux tests with zero skips, formatting and typecheck. SHA-256: `87e33b8ecdd32844f90ca88e3d22dafd47e59063a7bc1a7789a5a38dded8951f`. CI run 36507810948 passed; draft PR #41 is open; no live model/account/publication, deployment or live cleanup operations.

## Deployment and rollback

Production remains 0.22.0/task schema 1. The single private cumulative launcher now targets this validated 0.37.0 archive; it remains unexecuted. Syntax and staged hashes are verified. Schema remains 2, with matching application/task-state rollback and native profiles kept separate.

## Limits and next

This fixes atomic database visibility, not a distributed filesystem transaction or proof against physical storage/power-loss failure. Missing/linked references can intentionally leave storage behind for review. It does not delete whole dependency caches, repair corrupt packages, or auto-promote interrupted jobs. A referenced legacy stage may remain valid for the stored manifest while its historical job is interrupted; the record is preserved honestly. Next: remaining publication/feedback decomposition, request-time Git responsiveness, then retention cleanup crash reconciliation. Keep safeguards and adoption decisions separate.
