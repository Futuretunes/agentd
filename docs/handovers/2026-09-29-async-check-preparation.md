# 2026-09-29 — Background check preparation

- Author: Codex.
- Requested outcome: continue the backlog continuously after installed 0.43.0, with shared Claude handovers.
- Status: implemented and fully validated; cumulative installer staged but not executed.
- Release: cumulative 0.44.0, task schema 2 unchanged.
- Branch/base: `feat/async-check-preparation` from `feat/async-review-preview` at `e518038`.

## Changes and relevant files

`public/app.js` now starts an owner-bound validation job for Run checks and Recheck committed files. It displays “Preparing exact changes…”, offers cancellation, then changes to the existing Stop checks control only after isolated checks actually start. Failure or cancellation repaints the current review instead of leaving stale controls.

`runner.ts` owns a separate check-preparation slot using the bounded child helper introduced for review previews. The first request returns immediately. Status/cancel polling is tied to the authenticated browser owner; a same-owner retry while active recovers the same task/tree job. Task reads stay available while dispatch, review, storage and other state-changing operations wait. Shutdown signals both preview helpers before awaiting publication cleanup and waits for their process groups and temporary indexes.

Cheap admission runs before starting the helper and all authoritative admission runs again after it settles. The helper computes the exact tree and conflict list with the credential-free local Git policy. Any edit made during preparation changes the tree and fails the job. Only then does the existing `executeChecks()` path materialize the approved tree, recheck dependency identity, persist running state before spawn, run inside isolation and mark results stale if the mutable source later changes. The older local administrative `validate` operation remains compatible and synchronous.

`mobile.ts` and `gateway-protocol.ts` add narrowly allowed start/status/cancel calls. The HTTPS layer derives the owner from its secure session cookie; browser-supplied owners are ignored. Exact tree IDs are validated before crossing the gateway. `review-jobs.ts` now accepts an operation kind and deduplication key so review and validation jobs keep independent ownership without conflating different requested trees.

## Validation evidence

Formatting and typecheck passed. Fourteen focused review/check/gateway fixtures passed. New coverage proves cancellation before checks, owner isolation, active retry reuse, responsive status reads, mutation exclusion, changed-content rejection, successful exact-tree checks, cookie/CSRF binding and invalid-tree refusal. Existing full edit/check/commit, revision, raw gateway, separate socket, attachment and helper shutdown tests also passed.

The exact source `6b116380f0e55864b21bb8066c4767cfd2f41d90` was archived with SHA-256 `dbcb77c7a3b7911b936d7d65fc8952357a423c49ee3f9f12e726433204fe9268`. That archive passed all 180 required Linux tests with zero skips, formatting and typecheck. GitHub push run `36529217591` and pull-request run `36529285282` both passed. A local no-model browser fixture visibly verified preparation progress, cancellation back to an unchanged review, a fresh retry and a passed check with commit enabled. Draft PR #48 records the review boundary. No live model, consent, cleanup, publication or deployment calls were made.

## Deployment and rollback

The operator reported 0.43.0 installed successfully: 179 tests passed, task schema 2, starts 38, resource limits already verified, and a managed application backup created. Candidate 0.44.0 is not installed. One cumulative installer targets the exact validated archive and remains unexecuted. Rollback must keep application/task state paired; native account profiles remain separately preserved.

## Constraints and known issues

This removes the expensive `git add -A` snapshot/conflict preflight from the GUI request path. The exact-tree materialization immediately before spawning checks still runs synchronously in the runner, although no browser request waits for it. A process crash loses disposable preparation jobs and requires reopening the review; it does not replay or authorize checks. Active HTTP retries are deduplicated, but durable response-loss receipts for validation start remain future R10 work. Hard-crash temporary indexes remain preserved for administrator inspection. The legacy direct validation endpoint is synchronous for local compatibility.

## Next steps

Move commit/revision/restart/integration mutation preflights behind durable owner-bound jobs, beginning with commit preparation because it still performs a full synchronous review snapshot before changing refs. Preserve checks bound to the exact tree, commit/publication approvals, cancellation, mutation exclusion and safe response-loss recovery. Continue runner request-routing decomposition alongside these bounded slices. Claude review/consolidation and a deliberate main/tag decision remain pending; no merge is authorized.
