# 2026-09-29 — 0.69.0: adapter policy configuration mutation

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: first configuration mutation after read-only overview
- Status: implemented; not installed
- Release: 0.69.0
- Branch and base: `feat/gui-adapter-policy` on `main` (0.68.0)
- PR: (open after push)

## Changes and relevant files

- `scripts/admin_adapters.py`: read/update allowlisted `AGENTD_ENABLED_ADAPTERS`, `AGENTD_EDITING`, `AGENTD_EDIT_ADAPTERS` in `/etc/agentd/agentd.env`; fingerprint-bound snapshot.
- `deploy/agentd-admin.service`: `ReadWritePaths` includes `/etc/agentd/agentd.env`.
- Admin helper/client/runner/gateway/mobile: `admin-adapters` / `admin-adapters-apply` with access-key step-up preview and idle confirmation when busy.
- Settings > Configuration: adapter policy form; runner restart still required for the process environment to pick up the change.
- Tests: `test/admin_adapters.py`, `test/access-key.test.mjs` helper op checks.

## Validation evidence

- Local typecheck, adapter Python test, access-key/gateway tests pending with commit.
- CI pending on push.

## Deployment and rollback

- Not installed. No schema migration. Requires administration helper already present and writable managed `agentd.env`.

## Constraints and known issues

- Policy is written immediately; live capabilities still follow the runner's startup environment until restart.
- Resource profile, hardening and TLS replacement remain future mutations.

## Next steps

1. Merge onto `main` when CI is green.
2. Next administration slices: further configuration mutations; approved native CLI binary helper; ntfy.
