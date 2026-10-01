# 2026-09-30 — 0.463.0: Settings content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Settings content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.463.0
- Implementation commit(s): badc1f0
- PR: #864

## Changes and relevant files

- See feature PR #864.
- Package 0.463.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #864; live-installed on 192.168.1.20 (0.463.0 / badc1f0034c4815fe6045f9aba45fb204aeda40e).
- Archive SHA-256: `8556a169dd7cc2db8b90a9b8c1a5f96d4d9620b7ad64b67f3d070e13382c1262`
- Revision: `badc1f0034c4815fe6045f9aba45fb204aeda40e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #864.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #864 and live-installed 0.463.0.
2. Continue a11y form labels.
