# 2026-09-29 — Background change previews

- Author: Codex.
- Requested outcome: next backlog item after the operator installed cumulative 0.42.0.
- Status: implemented; Linux and CI passed; staged, not installed.
- Release: 0.43.0, task schema 2 unchanged.
- Branch/base: `feat/async-review-preview` from `fix/retention-reconciliation` at `2d8b184`.

## Changes

The GUI starts a session-owned preview job and polls short requests while a trusted child performs snapshot and conflict inspection. Progress offers cancellation. Active same-session retries recover the same job; another session cannot read or cancel it. Results expire after five minutes with a maximum twenty cached jobs. Restart loses disposable preview jobs and requires reopening the review; no approvals or state mutations are replayed.

`review-preview.ts` / `review-preview-worker.ts` use the existing local Git policy, a minimal credential-free environment, private temporary index directory, sixty-second deadline and bounded two-megabyte output. Cancellation/shutdown kills the process group and waits for cleanup. `review-jobs.ts` owns the slot through settlement. Runner admission holds state-changing operations and dispatch while a preview runs; reads/polling remain available. Repository/publication/dependency work, active workers and queued tasks prevent a new preview. The existing check/commit/revise paths still recompute content, so the background preview is never itself a grant to commit stale files.

`mobile.ts` and `gateway-protocol.ts` bind start/status/cancel to the browser cookie and preserve authentication/CSRF/field allowlists. `public/app.js` uses progress and cancellation before opening the existing review. The older synchronous administrative review path is retained for compatibility.

## Validation

Local formatting/typecheck and thirteen focused tests passed, covering process yielding, snapshot equivalence, temporary cleanup, cancellation/ownership, shutdown-before-start, safe errors, authenticated cookie-bound polling, mutation exclusion and changed-content invalidation. Exact source `53e217397e89a5875ba0da228bc3c5be23eb000d` passed 179/179 required Linux tests with zero skips, formatting and typecheck. CI runs 36527554284 and 36527597833 passed; draft PR #47 is open. Archive SHA-256: `709d92441e352eed235eec246cac1bc8f3f2e48c0d1d83249648ef57c2cff77f`. A disposable local browser fixture verified progress, completed diff display, and cancellation returning to the conversation. The fixture ran a fake agent command, not a provider. No live model, consent, cleanup or deployment calls.

## Deployment and rollback

The operator's output confirms installed 0.42.0, task schema 2, starts 37, all 175 tests passing and resource cgroups verified. Prior shared handovers describing production 0.22.0 are historical. Candidate 0.43.0 has not been installed. The single cumulative installer now targets validated 0.43.0; syntax and staged hashes were verified without execution. Read-only health confirms installed 0.42.0/task schema 2/starts 37 unchanged. Application/task state rollback must stay paired; credentials remain separately preserved.

## Limitations and next work

This is R10's read-preview slice, not complete asynchronous mutation conversion. Check preparation, commit/revise/restart snapshots, integration application and legacy direct review remain synchronous. Next move mutation preflight snapshots behind owned jobs with durable request receipts; preserve exact approval hashes, cancellation and response-loss recovery. Hard-crash temporary index leftovers are preserved for administrator inspection, not automatically deleted. Physical filesystem changes outside agentd remain possible; mutation-time revalidation is mandatory. Phone acceptance and Claude review remain pending.
