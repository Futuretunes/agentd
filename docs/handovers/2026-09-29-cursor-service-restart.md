# 2026-09-29 — 0.65.0: approval-gated service restart

- Author/agent: Cursor (operator authorized continuous backlog work)
- Requested outcome: next administration slice after live-accepted 0.64.1 updates/rollback
- Status: implemented; not installed
- Release: 0.65.0
- Branch and base: `feat/gui-service-restart` on `fix/reload-required`
- PR: (open after push)

## Changes and relevant files

- `scripts/admin_restart.py`: fixed helper path to restart only `runnerUnit` or `mobileUnit` after configuration-ok and no update/rollback job running.
- `src/admin-helper.ts`, `src/admin-client.ts`, `src/server.ts`: `service-restart` helper operation.
- `src/runner.ts`, `src/gateway-protocol.ts`, `src/request-routing.ts`: `admin-service-restart-plan` (read) and `admin-service-restart` (managed) with existing `update` admission blocking.
- `src/mobile.ts`, `public/app.js`: `/api/service-restart` preview + step-up restart from Diagnostics.
- Tests: `test/admin_restart.py`, `test/access-key.test.mjs`, `test/mobile.test.mjs` bridge fixtures.

## Validation evidence

- Local: `npm run typecheck` passed; `node --test test/access-key.test.mjs test/gateway.test.mjs` passed; `python3 -B test/admin_restart.py` passed.
- Full Linux isolation CI: pending on push.

## Deployment and rollback

- Not installed. Requires administration helper on the host; no schema migration.
- Operator installs through the usual reviewed-release path when ready.

## Constraints and known issues

- Restarting the phone gateway drops the current browser connection; restarting the task runner drops in-flight runner work.
- Does not auto-cancel tasks; operator must stop work before restart when admission reports busy.

## Next steps

1. Merge PR stack #61–#72 if not already on `main`.
2. Review/merge this branch; stage 0.65.0 for operator install.
3. Next administration slice: guided CLI updates (`administration.md`).
