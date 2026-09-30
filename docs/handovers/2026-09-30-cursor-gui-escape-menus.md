# 2026-09-30 — 0.123.0: Escape closes composer menus (UX-2 / U19)

- Author/agent: Cursor
- Requested outcome: Escape should close the agent/mode picker and conversation menu when no dialog is open
- Status: implemented
- Release: 0.123.0
- Branch and base: `feat/gui-escape-menus` on `main` (0.122.0)
- Implementation commit(s): 11f64ec
- PR: pending

## Changes and relevant files

- `setupShell` closes `#run-picker` and `#conversation-menu` on Escape when no `<dialog>` is open.
- Package 0.123.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Native dialog Escape handling remains unchanged.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
