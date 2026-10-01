# 2026-09-30 — 0.386.0: Latest run output accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Latest run output accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.386.0
- Implementation commit(s): 9dd1919
- PR: #712

## Changes and relevant files

- See feature PR #712.
- Package 0.386.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #712; live-installed on 192.168.1.20 (0.386.0 / 9dd19195d6d13f6365dcad36a05e184fbab93cfc).
- Archive SHA-256: `81392d883039cac91c088be69c23109134d6dd42681dc680e3c65de1195afe27`
- Revision: `9dd19195d6d13f6365dcad36a05e184fbab93cfc`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #712.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #712 and live-installed 0.386.0.
2. Continue a11y form labels.
