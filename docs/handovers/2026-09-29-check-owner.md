# 2026-09-29 — Check execution lifecycle

- Author: Codex; authorized overnight R2 work.
- Status: implemented; exact validation pending; not installed.
- Release: cumulative 0.39.0, task schema 2.
- Branch/base: `refactor/check-execution-owner` from `refactor/publication-operation-owner` at `ceb8e1f`.

## Changes and evidence

`check-execution.ts` owns approved-tree materialization, dependency fingerprint verification, sandbox/process creation, bounded output, resource monitoring, cancellation, timeout, cleanup and result persistence. Eligibility and human exact-tree approval checks remain in the runner. The returned completion handle occupies the existing shared task/check worker slot; completion clears only its own identity. No parallel check lane or broader privileges were added.

The extraction exposed a startup gap: spawning preceded the running-state write, whose failure could throw while leaving a child without its lifecycle handlers. That write now occurs inside the protected startup section before spawn. A subsequent synchronous spawn failure records failure; all startup failures attempt both sandbox and prepared-tree cleanup. Unexpected persistence failures remain visible, not silently converted to success.

## Validation

Existing runner/check-snapshot tests cover approval and exact-tree behavior. New domain fixtures verify interrupted cancellation waits for cleanup, modified worktrees yield stale results, spawn/cleanup failure cannot pass, and an injected database write failure never reaches process-launch arguments and removes prepared files. Full exact Linux, formatting, typecheck and CI results pending. No live native model, account, publication, deployment or retention deletion is used.

## Deployment and limits

Production remains 0.22.0/task schema 1. Keep the previous fully validated cumulative installer until this candidate passes. Schema remains 2; rollback needs matching application/task state, with native profiles preserved separately. Snapshot materialization and final staleness checks are still synchronous Git operations. Completion-write failure retains existing fail-fast behavior. This is lifecycle separation, not complete crash reconciliation or per-worker cgroups.

## Next

Continue R10 asynchronous snapshot/review Git, R2 task dispatch decomposition and R6 cleanup reconciliation. Keep shared Claude handover and cumulative installer current after validation; installation remains separate.
