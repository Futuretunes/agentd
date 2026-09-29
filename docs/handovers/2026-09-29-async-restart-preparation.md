# 2026-09-29 — Background restart-with-settings preparation

- Author/agent: Codex
- Requested outcome: continue R10 by moving restart-with-current-settings snapshot work out of the request path while preserving partial edits and explicit run approval
- Status: implemented and validated; staged, not installed
- Release: 0.47.0, task schema 2
- Branch and base: `feat/async-restart-preparation` from `feat/async-revision-preparation`
- Implementation commit(s): `b856bb74b419ac02f71a0bbb083871ec60790a9c`
- PR: [draft #51](https://github.com/Futuretunes/agentd/pull/51)

## Changes and relevant files

- `src/runner.ts` adds an owner-bound `restart-preparation` slot. A failed or stopped edit with unresolved files now snapshots those files through the bounded background review helper. Reads remain available while task dispatch and competing mutations wait. Cancellation leaves the original task and review unchanged.
- Final restart admission repeats latest-turn, archive, commit, repository/dependency and active-work checks. The resulting task retains the exact prepared tree and still enters `waiting_for_approval`; preparation never approves or dispatches a model run.
- A repeated request recovers the already-created restart from durable `restart_of` state, including after a service restart. A failed database transaction removes its newly created retention ref when possible.
- `src/gateway-protocol.ts` and `src/mobile.ts` expose only session-owned start/status/cancel operations. The legacy local `restart-settings` route remains available and synchronous for administrative compatibility.
- `public/app.js` polls visible preparation, offers cancellation and opens the newly created approval after completion.
- `test/settings.test.mjs` covers owner isolation, active-request recovery, responsive reads, mutation exclusion, cancellation, exact seed retention and completed recovery after process restart. `test/mobile.test.mjs` covers the cookie-derived owner boundary.

## Validation evidence

- macOS development environment, 2026-09-29:
  - `npm run format:check`: passed.
  - `npm run typecheck`: passed.
  - focused settings/mobile/gateway tests: 13/13 passed outside the filesystem sandbox because their Unix sockets require local host access.
  - `npm test`: 174 passed, 0 failed, 9 Linux-only isolation tests skipped as expected on macOS.
- Exact release archive:
  - source: `b856bb74b419ac02f71a0bbb083871ec60790a9c`
  - SHA-256: `5806a84ea069dce6822fb933d886dddc4c91ddeaa7d77109825b542cca678001`
  - release verifier reported version 0.47.0, format 1 and task schema 2.
- Ubuntu VM exact-release validation, without installation:
  - clean dependency install with lifecycle scripts disabled, formatting and typecheck passed.
  - `node scripts/test-isolation-ci.mjs`: 183/183 passed, 0 failed, 0 skipped, including all Linux isolation tests.
  - private validation log: `/home/c0d3x/agentd-async-restart-preparation-tests.log`.
- No-model browser fixture:
  - a failed edit with a partial tracked change was prepared through the new endpoint;
  - the browser refreshed to show the original review as superseded and a new `Ready for your approval` edit turn;
  - no provider account, native CLI or model request was used.
- GitHub CI passed for both the branch push (`36540465581`) and draft PR (`36540504962`), including Node 24, Node 26 and required Linux isolation jobs.

## Deployment and rollback

- No deployment occurred. Production remains the operator-reported 0.43.0/task schema 2 baseline.
- The exact archive and cumulative launcher are staged privately on the VM. Launcher SHA-256 is `c232b7f627d93e7624f31195a1a609b89a4cbb81f1b9e0192c04a7b59b834cf2`; it was syntax checked and not executed.
- This release has no database migration. Existing 0.43 rollback boundaries remain unchanged.

## Constraints and known issues

- The GUI preparation job is intentionally memory-only. A service restart expires an in-progress unapproved snapshot. A successfully created restart is recovered durably from task state.
- This work changes only preservation of partial edits during restart. A new task still requires the ordinary execution approval and retains the current per-project, conversation and adapter settings snapshot.
- Legacy local callers retain synchronous behavior. Browser callers use the bounded job path.
- Browser success was observed in a no-model fixture. Cancellation and ownership are covered by integration tests; production phone acceptance remains separate.

## Next steps

1. Continue R10 with integration mutation preflights, preserving exact-tree approvals and conflict review.
2. Continue R2 runner request-routing decomposition after the remaining synchronous Git preparation paths are bounded.
