# 2026-09-30 — 0.518.0: Drawer close focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Drawer close focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.518.0
- Implementation commit(s): 53e0847
- PR: #971

## Changes and relevant files

- See feature PR #971.
- Package 0.518.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #971; live-installed on 192.168.1.20 (0.518.0 / 53e08474e994992018001eb6b8c010e966372e84).
- Archive SHA-256: `5675f48e9e674778305991eab1d099712057b8f9c9537a2790014be6e6305bf3`
- Revision: `53e08474e994992018001eb6b8c010e966372e84`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #971.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #971 and live-installed 0.518.0.
2. Continue a11y form labels.
