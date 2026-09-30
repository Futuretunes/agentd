# 2026-09-30 — 0.132.0: Workspace accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: The signed-in workspace shell must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.132.0
- Branch and base: `feat/gui-workspace-label` on `main` (0.131.0)
- Implementation commit(s): 406df2d
- PR: #205

## Changes and relevant files

- `#workspace` sets `aria-label="agentd workspace"`.
- Package 0.132.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #205; live-installed on 192.168.1.20 (0.132.0 / 1e721ff).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.131.0 / revert of #205.

## Constraints and known issues

- Nested landmarks (sidebar/main) remain the primary navigation structure.

## Next steps

1. Done: merged #205 and live-installed 0.132.0.
2. Continue UX polish or admin slices as operator priority allows.
