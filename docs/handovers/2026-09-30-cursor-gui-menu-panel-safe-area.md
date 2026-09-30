# 2026-09-30 — 0.212.0: Phone menu panel bottom safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone conversation menu panel must clear the home-indicator safe area
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.212.0
- Branch and base: `feat/gui-menu-panel-safe-area` on `main` (0.211.0)
- Implementation commit(s): 022533e
- PR: #365

## Changes and relevant files

- Phone `.menu-panel` max-height subtracts `env(safe-area-inset-bottom)`.
- Package 0.212.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #365; live-installed on 192.168.1.20 (0.212.0 / 022533e).
- Archive SHA-256: `e46391be3c939a841a55a2d023a2ba0a6261540812f80e5ef3890182694fa54b`
- Revision: `022533e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.211.0 / revert of #365.

## Constraints and known issues

None beyond ordinary CSS safe-area handling.

## Next steps

1. Done: merged #365 and live-installed 0.212.0.
2. Bound agent picker panel width/height to phone safe areas next.
