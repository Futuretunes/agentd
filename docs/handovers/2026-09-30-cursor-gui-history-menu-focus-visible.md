# 2026-09-30 — 0.544.0: History menu focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History menu focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.544.0
- Implementation commit(s): 9f313e4
- PR: #1022

## Changes and relevant files

- See feature PR #1022.
- Package 0.544.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1022; live-installed on 192.168.1.20 (0.544.0 / 9f313e40969938a1317547f328d221884f827dcd).
- Archive SHA-256: `8db649f945b37925cfd288d39dedabd10b9c5d0ed7545cea96b22ab9c47d37ae`
- Revision: `9f313e40969938a1317547f328d221884f827dcd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1022.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1022 and live-installed 0.544.0.
2. Continue a11y form labels.
