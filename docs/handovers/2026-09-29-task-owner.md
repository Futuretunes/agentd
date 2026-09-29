# 2026-09-29 — Stable task execution ownership

- Author: Codex; authorized overnight R2 work.
- Status: implemented; exact Linux and CI passed; not installed.
- Release: cumulative 0.40.0, task schema 2.
- Branch/base: `refactor/task-execution-owner` from `refactor/check-execution-owner` at `4e8fbd7`.

## Changes

`task-execution.ts` extracts asynchronous worktree preparation, attachment/context preparation, native invocation, isolation, process lifecycle, output/resource limits and terminal persistence. Queue selection, renewal, refreshed approval and global admission stay in the runner. A stable `TaskExecution` handle spans checkout and process execution; cancellation and shutdown continue awaiting the same promise. The runner only clears the handle completing its own run.

Execution begins in a microtask after ownership is returned. Immediate cancellation is checked before path writes, checkout or command construction. Shutdown during that window records interruption rather than generic failure. Existing path-before-checkout recovery, partial edit preservation, adapter rechecks, native selection checks, context fingerprints and explicit edit/commit separation are retained. No additional worker concurrency or authority.

## Validation

Existing runner, image, settings and checkout tests cover approval, renewal, policy, timeouts and cancellation. New domain regressions assert immediate cancellation invokes neither checkout nor command construction, the identical handle survives preparation and process shutdown with cleanup complete, and task path-write failure cannot launch preparation or a command. Exact archive `87e8d2cd41fb01361187d77ea3ab4db5177a3376` passed 161/161 required Linux tests, zero skips, formatting and typecheck. SHA-256: `3d69b8b1e66c2e40eeda281e67ea92e6c5dcfe4e7b90730e39690ca9f720e5d1`. CI runs 36521813406 and 36521818787 passed; draft PR #44 is open. The added immediate-shutdown regression verifies interruption without checkout. No live native model/account/publication request, deployment or live retention deletion is used.

## Deployment and limits

Production stays 0.22.0/task schema 1. The single private cumulative installer now targets this validated archive; syntax and staged hashes are checked, and it remains unexecuted. Candidate schema remains 2; rollback needs matched application/task state with native profiles separate. Unexpected persistence/cleanup exceptions retain fail-fast behavior; graceful recovery from such errors is not claimed. This does not make snapshots, reviews or integration application asynchronous. No host security settings changed.

## Next

R10 request-time Git responsiveness and R6 cleanup crash reconciliation remain priorities. Additional runner request/review decomposition and operation interleaving proofs remain open. Update shared Claude handover and the single cumulative installer after exact validation. Preserve the 08:00 local deadline for starting new work.
