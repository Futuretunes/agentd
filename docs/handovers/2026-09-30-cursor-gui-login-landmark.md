# 2026-09-30 — 0.131.0: Login landmark name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: The login section must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.131.0
- Branch and base: `feat/gui-login-landmark` on `main` (0.130.0)
- Implementation commit(s): 1682783
- PR: #203

## Changes and relevant files

- `#login` sets `aria-label="Sign in to agentd"`.
- Package 0.131.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #203; live-installed on 192.168.1.20 (0.131.0 / 862bfce).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.130.0 / revert of #203.

## Constraints and known issues

- Access key field remains autofocused.

## Next steps

1. Done: merged #203 and live-installed 0.131.0.
2. Continue UX polish or admin slices as operator priority allows.
