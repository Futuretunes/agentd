# 2026-09-30 — 0.577.0: Phone output download touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone output download touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.577.0
- Implementation commit(s): 7059e3e
- PR: #1088

## Changes and relevant files

- See feature PR #1088.
- Package 0.577.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1088; live-installed on 192.168.1.20 (0.577.0 / 7059e3e15a902f9143452aafcb89ba2a5035103e).
- Archive SHA-256: `4035fdab4ec34fb861519966172d52cd6072333e47898d41c32034082db30a9a`
- Revision: `7059e3e15a902f9143452aafcb89ba2a5035103e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1088.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1088 and live-installed 0.577.0.
2. Continue a11y form labels.
