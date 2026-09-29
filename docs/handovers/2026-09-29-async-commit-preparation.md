# 2026-09-29 — Background commit preparation

- Author: Codex.
- Requested outcome: continue the backlog without waiting for intermediate installation, while keeping Claude handovers current.
- Status: implemented; local validation passed; exact Linux release validation pending; not installed.
- Release: cumulative 0.45.0, task schema 2 unchanged.
- Branch/base: `feat/async-commit-preparation` from `feat/async-check-preparation` at `302531a`.

## Changes and relevant files

`public/app.js` now turns the existing Commit approval into an owner-bound background preparation job. The review shows “Preparing exact commit…” and offers cancellation until the exact snapshot has been accepted. Success still creates only the existing local `agentd/<task>` branch; it does not publish or merge anything.

`runner.ts` owns a separate commit-preparation slot using the bounded review helper. Reads stay available while task dispatch, review, checks and state-changing operations wait. The first browser request returns a job immediately. Same-owner retries with the same task, tree and commit message recover the active job. A completed commit is also recoverable after response loss or service restart only when the local branch, commit SHA, exact tree, parents and commit message all match the approved request. Different content or messages fail closed.

Admission runs before preparation and again after the child snapshot settles. The final path requires a pending edit review, no conflict/sensitive/oversized warning, a passing `git-tree-v1` check bound to the exact tree and a valid commit message. The existing `commitSnapshot()` compare-and-create behavior retains safe recovery if the ref was created before task persistence. The legacy local administrative `commit` operation remains synchronous and compatible.

`mobile.ts` derives ownership from the secure browser session for start/status/cancel. `gateway-protocol.ts` allows only the exact fields and validates the tree before it crosses the runner boundary. `public-error-messages.ts` includes the two new reviewed messages. No schema migration is needed.

## Validation evidence

Formatting and typecheck passed. The full local suite passed 181 tests with nine expected Linux-only skips. A focused 15-test commit/review/gateway/mobile/audit/error group passed. New coverage proves owner isolation, active retry reuse, different-message refusal, cancellation before mutation, responsive reads, competing mutation exclusion, changed-content rejection, exact checked-tree commit, same-process response-loss recovery and restart recovery. Exact Linux zero-skip validation, CI and the no-model browser fixture are pending. No live model, consent, cleanup, publication or deployment calls were made.

## Deployment and rollback

Installed production remains 0.43.0, task schema 2, starts 38. The exact validated 0.44.0 installer remains staged and unexecuted until 0.45.0 replaces it after exact validation. Rollback must keep application/task state paired; native account profiles remain separately preserved.

## Constraints and known issues

The expensive snapshot/conflict/sensitive-content preflight no longer occupies the browser request. Final local `commit-tree` and `update-ref` calls remain synchronous inside the background job and are intentionally non-cancellable once ref mutation begins. A crash before ref mutation requires retry; a crash after exact ref creation is recovered by the compare-and-create path and exact committed-result verification. Job progress itself is memory-only. The direct local commit route remains synchronous for compatibility.

## Next steps

Finish exact Linux/CI/browser validation, open a draft PR and replace the single staged installer without executing it. Then move revision/restart/integration mutation preflights behind the same owner-bound pattern, or extract review request routing if that reduces the remaining runner coupling first. Preserve exact snapshots, checks and distinct commit/publication approvals. Claude review/consolidation and a deliberate main/tag decision remain pending; no merge is authorized.
