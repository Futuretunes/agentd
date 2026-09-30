# 2026-09-30 — 0.131.0: Login landmark name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: The login section must expose a stable accessible name
- Status: implemented
- Release: 0.131.0
- Branch and base: `feat/gui-login-landmark` on `main` (0.130.0)
- Implementation commit(s): be1d504
- PR: pending

## Changes and relevant files

- `#login` sets `aria-label="Sign in to agentd"`.
- Package 0.131.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Access key field remains autofocused.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
