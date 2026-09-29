# 2026-09-29 — Background revision preparation

- Author: Codex.
- Requested outcome: continue the backlog continuously, without intermediate operator installation, and keep Claude handovers current.
- Status: implemented; local validation passed; exact Linux/CI/browser validation pending; not installed.
- Release: cumulative 0.46.0, task schema 2 unchanged.
- Branch/base: `feat/async-revision-preparation` from `feat/async-commit-preparation` at `3ad5e62`.

## Changes and relevant files

`public/app.js` and `public/index.html` now submit Request revisions through an owner-bound background job. The modal shows exact-edit preparation, changes Cancel to Stop preparing and leaves the original review untouched when cancelled. Success keeps the current edits as the new run's seed and still requires the separate Run approval, fresh checks and a separate commit approval.

`runner.ts` owns a separate revision-preparation slot. Reads stay responsive while task dispatch, review and state-changing operations wait. Same-owner retries with the same task, tree and prompt recover active work. Existing `revision_of`, prompt and seed-tree data recover a completed request after response loss or service restart; a different prompt or tree fails closed.

Cheap admission runs before creating the job and all authoritative checks repeat after the exact child snapshot settles: pending/latest unarchived edit, available adapter, bounded prompt, unchanged tree, and no oversized or sensitive content. The existing protected `refs/agentd/revisions/<id>` retention ref and transactional task/superseded-review write remain unchanged. The legacy local `revise` operation stays synchronous and compatible.

`mobile.ts` derives job ownership from the secure session cookie. `gateway-protocol.ts` permits only the revision job fields and validates the exact tree. No schema migration is needed.

## Validation evidence

Formatting and typecheck passed. The full local suite passed 182 tests with nine expected Linux-only skips. A focused 15-test review/revision/gateway/mobile/error group passed. New coverage proves owner isolation, active retry reuse, cancellation before mutation, responsive reads, competing-mutation exclusion, changed-content refusal, exact seed preservation, different-request refusal, response-loss recovery and restart recovery. Exact Linux zero-skip validation, CI and the no-model browser flow are pending. No live model, consent, cleanup, publication or deployment calls were made.

## Deployment and rollback

Installed production remains 0.43.0, task schema 2, starts 38. Exact validated 0.45.0 remains the single staged and unexecuted candidate until 0.46.0 replaces it after validation. Rollback must keep application/task state paired; native profiles remain separately preserved.

## Constraints and known issues

The full snapshot/content preflight no longer occupies the browser request. The protected ref update and task transaction remain synchronous inside the background job and are intentionally non-cancellable after ref mutation begins. A crash between those two steps can leave an unreferenced protected ref for administrator cleanup, matching the pre-existing behavior; it cannot authorize or dispatch a revision. Progress records are memory-only. The direct local revise route remains synchronous.

## Next steps

Finish exact Linux/CI/browser validation, open a draft PR and replace the single staged installer without executing it. Then move restart-with-settings snapshot preparation into the background or extract review request routing if that is the safer next bounded slice. Preserve explicit run/check/commit/publication approvals. Claude review/consolidation and a deliberate main/tag decision remain pending; no merge is authorized.
