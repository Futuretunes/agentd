# 2026-09-30 — 0.123.0: Escape closes composer menus (UX-2 / U19)

- Author/agent: Cursor
- Requested outcome: Escape should close the agent/mode picker and conversation menu when no dialog is open
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.123.0
- Branch and base: `feat/gui-escape-menus` on `main` (0.122.0)
- Implementation commit(s): 8bd86ca
- PR: #187

## Changes and relevant files

- `setupShell` closes `#run-picker` and `#conversation-menu` on Escape when no `<dialog>` is open.
- Package 0.123.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #187; live-installed on 192.168.1.20 (0.123.0 / 583f640).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.122.0 / revert of #187.

## Constraints and known issues

- Native dialog Escape handling remains unchanged.

## Next steps

1. Done: merged #187 and live-installed 0.123.0.
2. Continue UX polish or admin slices as operator priority allows.
