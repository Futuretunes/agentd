# 2026-09-29 — Owned dependency preparation domain

- Author: Codex; overnight R2 continuation.
- Status: implemented; exact Linux/CI validation pending; not installed.
- Release: cumulative 0.35.0, task schema 2.
- Branch/base: `refactor/dependency-operation-owner` from `refactor/operation-admission` at `43b6b46`.

## Changes

Extracted dependency preview, target/fingerprint checks, preparation, cancellation and status persistence from `runner.ts` into `dependency-jobs.ts`. The runner supplies existing project/task accessors, admission rules and audit/wakeup callbacks. Existing cross-domain busy checks now query the manager; public operations and approval requirements are unchanged.

`operation-slot.ts` owns a private completion identity and `{kind,id}` view. Cancellation keeps the slot busy through cleanup; stale IDs cannot cancel a successor; shutdown closes admission, aborts and waits. The completion callback cannot clear a successor. Immediate cancellation records cancelled state without invoking preparation. Expected failures remain recorded by the dependency domain; unexpected persistence errors are not silently suppressed.

## Validation

Local focused checks passed: 19 runner/domain/slot tests, one Linux-only skip; an additional immediate-cancellation run passed 7 tests with one Linux-only skip. Typecheck passed. Tests cover held ownership during cancellation, stale IDs, successor creation during completion, failures, shutdown, immediate cancellation, unchanged fingerprints, preserved existing dependencies and existing runner exclusions. Exact archive/required Linux/CI pending. No live model requests, account changes, publication, deployment or live cleanup.

## Deployment and rollback

Production remains 0.22.0/task schema 1. Previous validated 0.34.0 is staged only. Update the single cumulative private installer after this release passes exact Linux and CI validation. Schema remains 2; rollback to installed code requires matching saved application/task state and separate preservation of native profiles.

## Limitations and next

R2 remains partial: repository, publication/feedback, worker/check and account managers retain their current ownership. Global admission stays directional. This extraction does not claim atomic filesystem/SQLite dependency publication; unexpected persistence failure and crash reconciliation remain a follow-up. Next extract repository operations with the same ownership tests, then remaining asynchronous request-time Git and retention reconciliation. Keep approval/security behavior separate from structural refactoring.
